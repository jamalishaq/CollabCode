import type { File, Project, Workspace } from '@collabcode/shared-types';
import { useEffect, useMemo, useState } from 'react';

import { EditorComponent } from '../components/features/editor/Editor';
import { FileTree } from '../components/features/file-tree/FileTree';
import { WorkspacePanel } from '../components/features/workspace/WorkspacePanel';
import { useFileLock } from '../hooks/useFileLock';
import { listFiles } from '../services/fileService';
import { getProjectById, getWorkspaceById, listProjects } from '../services/workspaceService';

interface EditorPageProps {
  workspaceId: string;
  projectId: string;
}

/** EditorPage composes the primary coding workspace. */
export function EditorPage({ workspaceId, projectId }: EditorPageProps) {
  const [workspace, setWorkspace] = useState<Workspace | null>(null);
  const [project, setProject] = useState<Project | null>(null);
  const [projects, setProjects] = useState<Project[]>([]);
  const [files, setFiles] = useState<File[]>([]);
  const [activeFileId, setActiveFileId] = useState<string | null>(null);

  useEffect(() => {
    void Promise.all([
      getWorkspaceById(workspaceId),
      getProjectById(projectId),
      listProjects(workspaceId),
      listFiles(projectId)
    ]).then(([workspaceResponse, projectResponse, projectsResponse, filesResponse]) => {
      const listedFiles = filesResponse.data ?? [];
      setWorkspace(workspaceResponse.data);
      setProject(projectResponse.data);
      setProjects(projectsResponse.data ?? []);
      setFiles(listedFiles);
      setActiveFileId((current) => current ?? listedFiles[0]?.id ?? null);
    });
  }, [workspaceId, projectId]);

  useFileLock(projectId, activeFileId);

  const activeFile = useMemo(() => files.find((entry) => entry.id === activeFileId) ?? null, [activeFileId, files]);

  if (!workspace || !project) {
    return <main className="page">Loading editor…</main>;
  }

  return (
    <main className="page editor-page">
      <WorkspacePanel workspace={workspace} projects={projects} />
      <FileTree files={files} activeFileId={activeFileId} onSelect={setActiveFileId} />
      <section className="panel">
        <h2>{project.name}</h2>
        <EditorComponent fileId={activeFile?.id ?? 'unknown-file'} fileName={activeFile?.name ?? 'Untitled file'} />
      </section>
    </main>
  );
}
