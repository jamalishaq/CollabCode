/** PresenceUser tracks active collaborators. */
export interface PresenceUser {
  userId: string;
  status: 'online' | 'offline';
}

/** usePresence exposes collaborator presence state. */
export function usePresence(): PresenceUser[] {
  return [];
}
