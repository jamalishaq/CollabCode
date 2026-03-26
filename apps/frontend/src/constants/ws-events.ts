import { WsEventType } from '@collabcode/shared-types';

/** Websocket event name constants. */
export const WS_EVENTS = {
  presenceUpdated: WsEventType.PresenceUpdated,
  cursorMoved: WsEventType.CursorMoved,
  fileLocked: WsEventType.FileLocked,
  fileUnlocked: WsEventType.FileUnlocked
} as const;
