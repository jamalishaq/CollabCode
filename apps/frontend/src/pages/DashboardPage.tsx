import type { Workspace } from '@collabcode/shared-types';
import { useEffect, useState } from 'react';

import { ROUTES } from '../constants/routes';
import { listWorkspaces } from '../services/workspaceService';

/** DashboardPage renders user workspace overview. */
export function DashboardPage() {
  const [workspaces, setWorkspaces] = useState<Workspace[]>([]);

  useEffect(() => {
    void listWorkspaces().then((response) => setWorkspaces(response.data ?? []));
  }, []);

  return (
    <main className="page">
      <h1>Workspaces</h1>
      <div className="workspace-grid">
        {workspaces.map((workspace) => (
          <a className="card workspace-card" href={`${ROUTES.workspaces}/${workspace.id}`} key={workspace.id}>
            <h3>{workspace.name}</h3>
            <p>{workspace.description ?? 'No description'}</p>
          </a>
        ))}
      </div>
    </main>
  );
}
