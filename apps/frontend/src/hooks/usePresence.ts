import type { PresenceUser, WsMessage } from '@collabcode/shared-types';
import { WsEventType } from '@collabcode/shared-types';
import { useEffect, useState } from 'react';

import { env } from '../config/env';

const fallbackUsers: PresenceUser[] = [
  {
    userId: 'user-2',
    displayName: 'Taylor',
    color: '#7c3aed',
    lastSeenAt: new Date().toISOString()
  }
];

/** usePresence exposes collaborator presence state from the collaboration service. */
export function usePresence(fileId: string): PresenceUser[] {
  const [users, setUsers] = useState<PresenceUser[]>(fallbackUsers);

  useEffect(() => {
    const websocket = new WebSocket(`${env.collaborationWsUrl.replace(/\/$/, '')}/collaborate/${fileId}`);

    websocket.onmessage = (event) => {
      try {
        const message = JSON.parse(String(event.data)) as WsMessage<PresenceUser[]>;
        if (message.type === WsEventType.PresenceUpdated && Array.isArray(message.payload)) {
          setUsers(message.payload);
        }
      } catch {
        setUsers(fallbackUsers);
      }
    };

    websocket.onerror = () => {
      setUsers(fallbackUsers);
    };

    return () => {
      websocket.close();
    };
  }, [fileId]);

  return users;
}
