/** Claims carried in a JWT token. */
export interface JwtPayload {
  sub: string;
  email: string;
  iat: number;
  exp: number;
}

/** Login payload for authentication. */
export interface LoginRequest {
  email: string;
  password: string;
}

/** Registration payload for authentication. */
export interface RegisterRequest {
  email: string;
  password: string;
  displayName: string;
}
