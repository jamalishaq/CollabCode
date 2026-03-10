/** A connected user in a collaboration session. */
export interface PresenceUser {
  userId: string;
  displayName: string;
  color: string;
  lastSeenAt: string;
}

/** Cursor location in a source file. */
export interface CursorPosition {
  fileId: string;
  line: number;
  column: number;
}

/** Typed websocket event names. */
export enum WsEventType {
  PresenceUpdated = 'presence.updated',
  CursorMoved = 'cursor.moved',
  FileLocked = 'file.locked',
  FileUnlocked = 'file.unlocked',
  DocumentPatched = 'document.patched'
}

/** Generic websocket message envelope. */
export interface WsMessage<T> {
  type: WsEventType;
  payload: T;
  correlationId?: string;
  timestamp: string;
}
