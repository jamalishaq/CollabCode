import { LOCK_RENEW_INTERVAL_SECONDS } from '@collabcode/shared-config';
import { useEffect } from 'react';

import { acquireLock, releaseLock } from '../services/fileService';

/** useFileLock handles lock acquire/release and heartbeat renewal. */
export function useFileLock(projectId: string | null, fileId: string | null): void {
  useEffect(() => {
    if (!projectId || !fileId) {
      return;
    }

    void acquireLock(projectId, fileId);

    const interval = window.setInterval(() => {
      void acquireLock(projectId, fileId);
    }, LOCK_RENEW_INTERVAL_SECONDS * 1000);

    return () => {
      window.clearInterval(interval);
      void releaseLock(projectId, fileId);
    };
  }, [projectId, fileId]);
}
