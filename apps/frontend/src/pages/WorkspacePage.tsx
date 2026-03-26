import type { Project, Workspace } from '@collabcode/shared-types';
import { useEffect, useState } from 'react';

import { WorkspacePanel } from '../components/features/workspace/WorkspacePanel';
import { ROUTES } from '../constants/routes';
import { getWorkspaceById, listProjects } from '../services/workspaceService';

interface WorkspacePageProps {
  workspaceId: string;
}

export function WorkspacePage({ workspaceId }: WorkspacePageProps) {
  const [workspace, setWorkspace] = useState<Workspace | null>(null);
  const [projects, setProjects] = useState<Project[]>([]);

  useEffect(() => {
    void Promise.all([getWorkspaceById(workspaceId), listProjects(workspaceId)]).then(([workspaceResponse, projectsResponse]) => {
      setWorkspace(workspaceResponse.data);
      setProjects(projectsResponse.data ?? []);
    });
  }, [workspaceId]);

  if (!workspace) {
    return <main className="page">Loading workspace…</main>;
  }

  return (
    <main className="page workspace-page">
      <WorkspacePanel workspace={workspace} projects={projects} />
      <section className="panel">
        <h3>Open a project</h3>
        <ul>
          {projects.map((project) => (
            <li key={project.id}>
              <a href={`${ROUTES.workspaces}/${workspaceId}/projects/${project.id}`}>{project.name}</a>
            </li>
          ))}
        </ul>
      </section>
    </main>
  );
}
