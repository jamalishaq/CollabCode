import type { User } from '@collabcode/shared-types';
import { create } from 'zustand';

interface AuthState {
  currentUser: User | null;
  accessToken: string | null;
  isAuthenticated: boolean;
  setSession: (params: { user: User; accessToken: string | null }) => void;
  clearSession: () => void;
}

/** useAuthStore stores current authentication state. */
export const useAuthStore = create<AuthState>((set) => ({
  currentUser: null,
  accessToken: null,
  isAuthenticated: false,
  setSession: ({ user, accessToken }) => set({ currentUser: user, accessToken, isAuthenticated: true }),
  clearSession: () => set({ currentUser: null, accessToken: null, isAuthenticated: false })
}));
