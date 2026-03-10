import { useEffect } from 'react';

/** useFileLock handles lock acquire/release and heartbeat renewal. */
export function useFileLock(fileId: string | null): void {
  useEffect(() => {
    if (!fileId) {
      return;
    }

    const interval = window.setInterval(() => {
      void fetch(`/api/files/${fileId}/lock/renew`, { method: 'POST', credentials: 'include' });
    }, 15_000);

    return () => {
      window.clearInterval(interval);
      void fetch(`/api/files/${fileId}/lock`, { method: 'DELETE', credentials: 'include' });
    };
  }, [fileId]);
}
