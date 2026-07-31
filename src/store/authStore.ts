import { create } from 'zustand';
import type { User } from '@/types';
import { subscribeToAuthChanges, logout as firebaseLogout } from '@/firebase/auth.service';
import { useFinanceStore } from '@/store/financeStore';

interface AuthState {
  user: User | null;
  /** True once the initial Firebase auth check has resolved. Used by
   * ProtectedRoute to avoid redirecting to /login during the brief async
   * window before Firebase reports whether a session exists. */
  initializing: boolean;
  setSession: (user: User) => void;
  logout: () => Promise<void>;
}

export const useAuthStore = create<AuthState>((set) => ({
  user: null,
  initializing: true,
  setSession: (user) => set({ user }),
  logout: async () => {
    await firebaseLogout();
    set({ user: null });
    useFinanceStore.getState().reset();
  },
}));

// Keeps the store in sync with Firebase's own session persistence (which
// handles remembering the signed-in user across page reloads on its own —
// no manual localStorage token handling needed).
subscribeToAuthChanges((user) => {
  useAuthStore.setState({ user, initializing: false });
  if (!user) useFinanceStore.getState().reset();
});
