import { create } from 'zustand';

interface AuthState {
  currentUser: { id: string; email: string } | null;
  isAuthenticated: boolean;
}

/** useAuthStore stores current authentication state. */
export const useAuthStore = create<AuthState>(() => ({
  currentUser: null,
  isAuthenticated: false
}));
