import { useState } from 'react';

import { Button } from '../components/ui/Button';
import { Input } from '../components/ui/Input';
import { useAuth } from '../hooks/useAuth';

/** LoginPage renders authentication entrypoint. */
export function LoginPage() {
  const { login, statusMessage } = useAuth();
  const [email, setEmail] = useState('developer@collabcode.dev');
  const [password, setPassword] = useState('password123');

  return (
    <main className="page auth-page">
      <h1>Login</h1>
      <form
        className="card"
        onSubmit={(event) => {
          event.preventDefault();
          void login({ email, password });
        }}
      >
        <Input label="Email" type="email" value={email} onChange={(event) => setEmail(event.target.value)} />
        <Input
          label="Password"
          type="password"
          value={password}
          onChange={(event) => setPassword(event.target.value)}
        />
        <Button type="submit">Sign in</Button>
        <p>{statusMessage}</p>
      </form>
    </main>
  );
}
