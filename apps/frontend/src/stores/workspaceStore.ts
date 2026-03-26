import { create } from 'zustand';

interface WorkspaceState {
  activeWorkspace: string | null;
  activeProject: string | null;
  activeFile: string | null;
  setActiveWorkspace: (workspaceId: string | null) => void;
  setActiveProject: (projectId: string | null) => void;
  setActiveFile: (fileId: string | null) => void;
}

/** useWorkspaceStore stores active workspace context. */
export const useWorkspaceStore = create<WorkspaceState>((set) => ({
  activeWorkspace: null,
  activeProject: null,
  activeFile: null,
  setActiveWorkspace: (workspaceId) => set({ activeWorkspace: workspaceId }),
  setActiveProject: (projectId) => set({ activeProject: projectId }),
  setActiveFile: (fileId) => set({ activeFile: fileId })
}));
