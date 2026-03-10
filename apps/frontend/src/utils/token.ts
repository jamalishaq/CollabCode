/** getAuthCookieHint returns a UX-only cookie presence hint. */
export function getAuthCookieHint(): string | null {
  return document.cookie.includes('session_hint=') ? 'session_hint' : null;
}

/** clearAuthCookieHint clears non-sensitive cookie hints only. */
export function clearAuthCookieHint(): void {
  document.cookie = 'session_hint=; Max-Age=0; path=/; SameSite=Lax';
}
