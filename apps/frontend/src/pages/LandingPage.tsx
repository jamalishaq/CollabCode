import { ROUTES } from '../constants/routes';

export function LandingPage() {
  return (
    <main className="page center-page">
      <h1>CollabCode</h1>
      <p>Collaborative coding workspace with realtime presence and secure execution.</p>
      <nav className="inline-actions">
        <a href={ROUTES.login}>Login</a>
        <a href={ROUTES.register}>Register</a>
        <a href={ROUTES.dashboard}>Dashboard</a>
      </nav>
    </main>
  );
}
