import type { File, Project, User, Workspace } from '@collabcode/shared-types';

const now = new Date().toISOString();

export const mockUser: User = {
  id: 'user-1',
  email: 'developer@collabcode.dev',
  passwordHash: 'redacted',
  createdAt: now,
  updatedAt: now
};

export const mockWorkspaces: Workspace[] = [
  {
    id: 'ws-1',
    name: 'Core Platform',
    description: 'Backend and infra projects',
    ownerId: 'user-1',
    createdAt: now,
    updatedAt: now,
    deletedAt: null
  },
  {
    id: 'ws-2',
    name: 'Frontend Lab',
    description: 'Web app experimentation',
    ownerId: 'user-1',
    createdAt: now,
    updatedAt: now,
    deletedAt: null
  }
];

export const mockProjects: Project[] = [
  { id: 'pr-1', workspaceId: 'ws-1', name: 'API Gateway', createdAt: now, updatedAt: now, deletedAt: null },
  { id: 'pr-2', workspaceId: 'ws-1', name: 'Workspace Service', createdAt: now, updatedAt: now, deletedAt: null },
  { id: 'pr-3', workspaceId: 'ws-2', name: 'Frontend', createdAt: now, updatedAt: now, deletedAt: null }
];

export const mockFiles: File[] = [
  {
    id: 'file-1',
    projectId: 'pr-3',
    parentId: null,
    name: 'main.tsx',
    path: '/src/main.tsx',
    language: 'typescript',
    content: "console.log('hello');",
    createdAt: now,
    updatedAt: now,
    deletedAt: null
  },
  {
    id: 'file-2',
    projectId: 'pr-3',
    parentId: null,
    name: 'App.tsx',
    path: '/src/App.tsx',
    language: 'typescript',
    content: 'export function App() {}',
    createdAt: now,
    updatedAt: now,
    deletedAt: null
  }
];
