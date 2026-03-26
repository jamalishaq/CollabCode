import type { Project, Workspace } from '@collabcode/shared-types';

interface WorkspacePanelProps {
  workspace: Workspace;
  projects: Project[];
}

export function WorkspacePanel({ workspace, projects }: WorkspacePanelProps) {
  return (
    <section className="panel workspace-panel">
      <h2>{workspace.name}</h2>
      <p>{workspace.description ?? 'No description provided.'}</p>
      <h3>Projects</h3>
      <ul>
        {projects.map((project) => (
          <li key={project.id}>{project.name}</li>
        ))}
      </ul>
    </section>
  );
}
