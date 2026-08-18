import {
  createUserWithEmailAndPassword,
  signInWithEmailAndPassword,
  signOut,
  onAuthStateChanged,
  updatePassword,
  reauthenticateWithCredential,
  EmailAuthProvider,
  type User as FirebaseUser,
} from 'firebase/auth';
import { doc, getDoc, setDoc, serverTimestamp } from 'firebase/firestore';
import { auth, db, usernameToEmail } from './config';
import type { User } from '@/types';

interface UserProfileDoc {
  name: string;
  username: string;
  currency: string;
  theme: 'light' | 'dark';
  createdAt?: unknown;
}

function friendlyAuthError(err: unknown): string {
  const code = (err as { code?: string })?.code ?? '';
  // Log the raw code in dev so it's easy to diagnose new error types.
  if (import.meta.env.DEV) console.error('[Auth error]', code, err);
  switch (code) {
    case 'auth/email-already-in-use':
      return 'Username is already taken';
    case 'auth/invalid-credential':
    case 'auth/user-not-found':
    case 'auth/wrong-password':
      return 'Invalid username or password';
    case 'auth/weak-password':
      return 'Password must be at least 6 characters';
    case 'auth/too-many-requests':
      return 'Too many attempts. Please try again later.';
    case 'auth/operation-not-allowed':
    case 'auth/configuration-not-found':
      return 'Email/Password sign-in is not enabled. Enable it in the Firebase Console → Authentication → Sign-in method.';
    default:
      return 'Something went wrong. Please try again.';
  }
}

function toUser(uid: string, profile: UserProfileDoc): User {
  return {
    id: uid,
    name: profile.name,
    username: profile.username,
    currency: profile.currency ?? 'INR',
    theme: profile.theme ?? 'dark',
  };
}

async function fetchProfile(uid: string): Promise<UserProfileDoc | null> {
  const snap = await getDoc(doc(db, 'users', uid));
  return snap.exists() ? (snap.data() as UserProfileDoc) : null;
}

export async function register(name: string, username: string, password: string): Promise<{ user: User }> {
  if (password.length < 6) throw new Error('Password must be at least 6 characters');
  const trimmedUsername = username.trim();
  if (trimmedUsername.length < 3) throw new Error('Username must be at least 3 characters');

  try {
    const cred = await createUserWithEmailAndPassword(auth, usernameToEmail(trimmedUsername), password);
    const profile: UserProfileDoc = {
      name,
      username: trimmedUsername,
      currency: 'INR',
      theme: 'dark',
      createdAt: serverTimestamp(),
    };
    await setDoc(doc(db, 'users', cred.user.uid), profile);
    return { user: toUser(cred.user.uid, profile) };
  } catch (err) {
    throw new Error(friendlyAuthError(err));
  }
}

export async function login(username: string, password: string): Promise<{ user: User }> {
  try {
    const cred = await signInWithEmailAndPassword(auth, usernameToEmail(username.trim()), password);
    const profile = await fetchProfile(cred.user.uid);
    if (!profile) throw new Error('Invalid username or password');
    return { user: toUser(cred.user.uid, profile) };
  } catch (err) {
    throw new Error(err instanceof Error && err.message === 'Invalid username or password'
      ? err.message
      : friendlyAuthError(err));
  }
}

export async function loginAsDemo(): Promise<{ user: User }> {
  const demoUsername = 'demo';
  const demoPassword = 'demouser123';
  try {
    return await login(demoUsername, demoPassword);
  } catch {
    try {
      return await register('Demo User', demoUsername, demoPassword);
    } catch {
      const randomTag = Math.floor(1000 + Math.random() * 9000);
      const uniqueUsername = `demo_${randomTag}`;
      return await register('Demo User', uniqueUsername, demoPassword);
    }
  }
}


export async function fetchMe(): Promise<User> {
  const current = auth.currentUser;
  if (!current) throw new Error('Not signed in');
  const profile = await fetchProfile(current.uid);
  if (!profile) throw new Error('User profile not found');
  return toUser(current.uid, profile);
}

export async function changePassword(currentPassword: string, newPassword: string): Promise<void> {
  const current = auth.currentUser;
  if (!current || !current.email) throw new Error('Not signed in');
  if (newPassword.length < 6) throw new Error('New password must be at least 6 characters');
  try {
    const credential = EmailAuthProvider.credential(current.email, currentPassword);
    await reauthenticateWithCredential(current, credential);
    await updatePassword(current, newPassword);
  } catch {
    throw new Error('Current password is incorrect');
  }
}

export async function logout(): Promise<void> {
  await signOut(auth);
}

/** Re-authenticates with the account password. Used before destructive
 * actions (data reset) since Firebase requires a recent login for those,
 * mirroring the backend's password confirmation step. */
export async function reauthenticate(password: string): Promise<void> {
  const current = auth.currentUser;
  if (!current || !current.email) throw new Error('Not signed in');
  try {
    const credential = EmailAuthProvider.credential(current.email, password);
    await reauthenticateWithCredential(current, credential);
  } catch {
    throw new Error('Incorrect password');
  }
}

/** Subscribes to Firebase's auth state and resolves the app User profile
 * (or null when signed out) on every change. Returns the unsubscribe fn. */
export function subscribeToAuthChanges(callback: (user: User | null) => void): () => void {
  return onAuthStateChanged(auth, async (fbUser: FirebaseUser | null) => {
    if (!fbUser) {
      callback(null);
      return;
    }
    const profile = await fetchProfile(fbUser.uid);
    callback(profile ? toUser(fbUser.uid, profile) : null);
  });
}
