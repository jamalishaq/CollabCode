/** Workspace-level access roles. */
export enum WorkspaceRole {
  Owner = 'Owner',
  Editor = 'Editor',
  Viewer = 'Viewer'
}

/** A top-level workspace entity. */
export interface Workspace {
  id: string;
  name: string;
  description?: string;
  ownerId: string;
  createdAt: string;
  updatedAt: string;
  deletedAt?: string | null;
}

/** A project that belongs to a workspace. */
export interface Project {
  id: string;
  workspaceId: string;
  name: string;
  createdAt: string;
  updatedAt: string;
  deletedAt?: string | null;
}
