import { create } from 'zustand';

interface WorkspaceState {
  activeWorkspace: string | null;
  activeProject: string | null;
  activeFile: string | null;
}

/** useWorkspaceStore stores active workspace context. */
export const useWorkspaceStore = create<WorkspaceState>(() => ({
  activeWorkspace: null,
  activeProject: null,
  activeFile: null
}));
