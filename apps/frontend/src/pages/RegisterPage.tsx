import { useState } from 'react';

import { Button } from '../components/ui/Button';
import { Input } from '../components/ui/Input';
import { useAuth } from '../hooks/useAuth';

export function RegisterPage() {
  const { register, statusMessage } = useAuth();
  const [form, setForm] = useState({
    email: '',
    firstName: '',
    lastName: '',
    password: ''
  });

  return (
    <main className="page auth-page">
      <h1>Register</h1>
      <form
        className="card"
        onSubmit={(event) => {
          event.preventDefault();
          void register(form);
        }}
      >
        <Input label="First Name" value={form.firstName} onChange={(event) => setForm({ ...form, firstName: event.target.value })} />
        <Input label="Last Name" value={form.lastName} onChange={(event) => setForm({ ...form, lastName: event.target.value })} />
        <Input label="Email" type="email" value={form.email} onChange={(event) => setForm({ ...form, email: event.target.value })} />
        <Input label="Password" type="password" value={form.password} onChange={(event) => setForm({ ...form, password: event.target.value })} />
        <Button type="submit">Create account</Button>
        <p>{statusMessage}</p>
      </form>
    </main>
  );
}
