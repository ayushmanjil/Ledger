// Firebase app initialization.
//
// All values come from Vite environment variables so no secrets are ever
// committed to source control. Copy .env.example to .env and fill in the
// config from your Firebase project settings (Project settings → General →
// "Your apps" → Web app → SDK setup and configuration).
import { initializeApp, getApps, type FirebaseApp } from 'firebase/app';
import { getAuth, type Auth } from 'firebase/auth';
import { getFirestore, type Firestore } from 'firebase/firestore';

const firebaseConfig = {
  apiKey: import.meta.env.VITE_FIREBASE_API_KEY,
  authDomain: import.meta.env.VITE_FIREBASE_AUTH_DOMAIN,
  projectId: import.meta.env.VITE_FIREBASE_PROJECT_ID,
  storageBucket: import.meta.env.VITE_FIREBASE_STORAGE_BUCKET,
  messagingSenderId: import.meta.env.VITE_FIREBASE_MESSAGING_SENDER_ID,
  appId: import.meta.env.VITE_FIREBASE_APP_ID,
};

if (!firebaseConfig.apiKey || !firebaseConfig.projectId) {
  // Fails loudly in dev rather than silently hitting a 400 from Firebase.
  // eslint-disable-next-line no-console
  console.error(
    'Firebase config is missing. Copy .env.example to .env and fill in your ' +
    'Firebase project credentials (see README.md).'
  );
}

export const app: FirebaseApp = getApps().length ? getApps()[0]! : initializeApp(firebaseConfig);
export const auth: Auth = getAuth(app);
export const db: Firestore = getFirestore(app);

// Firebase Auth requires an email/password identity. This app's UI and UX
// are username-based (per the original design), so we deterministically
// derive a synthetic, unlisted email address from the username. The
// username itself is never exposed to anyone but the account owner (it is
// stored in the user's own Firestore profile document), and it is never
// used for anything except constructing the Firebase Auth identity.
const EMAIL_DOMAIN = 'ledger.local';

export function usernameToEmail(username: string): string {
  return `${username.trim().toLowerCase()}@${EMAIL_DOMAIN}`;
}
