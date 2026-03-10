/** useAuth provides auth command helpers. */
export function useAuth(): { login: () => Promise<void>; logout: () => Promise<void>; refresh: () => Promise<void> } {
  return {
    login: async () => undefined,
    logout: async () => undefined,
    refresh: async () => undefined
  };
}
