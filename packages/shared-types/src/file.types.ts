/** A file in a project tree. */
export interface File {
  id: string;
  projectId: string;
  parentId?: string | null;
  name: string;
  path: string;
  language: string;
  content: string;
  createdAt: string;
  updatedAt: string;
  deletedAt?: string | null;
}

/** Current lock state for a file. */
export interface FileLock {
  fileId: string;
  userId: string;
  acquiredAt: string;
  expiresAt: string;
}

/** Immutable version metadata for a file save. */
export interface FileVersion {
  id: string;
  fileId: string;
  version: number;
  contentHash: string;
  createdBy: string;
  createdAt: string;
}
