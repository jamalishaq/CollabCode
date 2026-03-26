import { useEffect, useMemo, useState } from 'react';

import { ROUTES } from './constants/routes';
import { DashboardPage } from './pages/DashboardPage';
import { EditorPage } from './pages/EditorPage';
import { LandingPage } from './pages/LandingPage';
import { LoginPage } from './pages/LoginPage';
import { RegisterPage } from './pages/RegisterPage';
import { WorkspacePage } from './pages/WorkspacePage';

function normalize(pathname: string): string {
  if (pathname === '/') {
    return pathname;
  }

  return pathname.endsWith('/') ? pathname.slice(0, -1) : pathname;
}

function matchWorkspace(pathname: string): { workspaceId: string } | null {
  const match = pathname.match(/^\/workspaces\/([^/]+)$/);
  return match ? { workspaceId: match[1] } : null;
}

function matchEditor(pathname: string): { workspaceId: string; projectId: string } | null {
  const match = pathname.match(/^\/workspaces\/([^/]+)\/projects\/([^/]+)$/);
  return match ? { workspaceId: match[1], projectId: match[2] } : null;
}

/** App is the root shell and simple router. */
export function App() {
  const [pathname, setPathname] = useState<string>(() => normalize(window.location.pathname));

  useEffect(() => {
    const onPopState = () => setPathname(normalize(window.location.pathname));
    window.addEventListener('popstate', onPopState);

    return () => window.removeEventListener('popstate', onPopState);
  }, []);

  const content = useMemo(() => {
    if (pathname === ROUTES.landing) {
      return <LandingPage />;
    }

    if (pathname === ROUTES.login) {
      return <LoginPage />;
    }

    if (pathname === ROUTES.register) {
      return <RegisterPage />;
    }

    if (pathname === ROUTES.dashboard) {
      return <DashboardPage />;
    }

    const workspaceMatch = matchWorkspace(pathname);
    if (workspaceMatch) {
      return <WorkspacePage workspaceId={workspaceMatch.workspaceId} />;
    }

    const editorMatch = matchEditor(pathname);
    if (editorMatch) {
      return <EditorPage workspaceId={editorMatch.workspaceId} projectId={editorMatch.projectId} />;
    }

    return <LandingPage />;
  }, [pathname]);

  return <div className="app-shell">{content}</div>;
}
