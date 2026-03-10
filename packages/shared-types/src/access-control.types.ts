/** Supported RBAC permissions. */
export enum Permission {
  Read = 'read',
  Write = 'write',
  Delete = 'delete',
  ManageMembers = 'manage_members',
  DeleteWorkspace = 'delete_workspace'
}

/** Mapping of role to allowed permissions. */
export type RolePermissionMap = Record<string, Permission[]>;
