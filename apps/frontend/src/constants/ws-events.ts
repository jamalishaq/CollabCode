/** Websocket event name constants. */
export const WS_EVENTS = {
  presenceUpdated: 'presence.updated',
  cursorMoved: 'cursor.moved',
  fileLocked: 'file.locked',
  fileUnlocked: 'file.unlocked'
} as const;
