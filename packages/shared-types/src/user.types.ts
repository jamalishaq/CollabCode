/** A user account identity. */
export interface User {
  id: string;
  email: string;
  passwordHash: string;
  createdAt: string;
  updatedAt: string;
}

/** Public profile metadata for a user. */
export interface UserProfile {
  userId: string;
  displayName: string;
  avatarUrl?: string;
  bio?: string;
}
