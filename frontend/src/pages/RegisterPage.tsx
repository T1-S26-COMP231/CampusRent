import { FormEvent, useState } from 'react';
import { Link } from 'react-router-dom';
import { apiRequest } from '../api/client';

export default function RegisterPage() {
  const [form, setForm] = useState({
    first_name: '',
    last_name: '',
    email: '',
    password: '',
  });
  const [message, setMessage] = useState('');
  const [error, setError] = useState('');
  const [saving, setSaving] = useState(false);

  async function submit(event: FormEvent) {
    event.preventDefault();
    setSaving(true);
    setMessage('');
    setError('');
    try {
      const response = await apiRequest<{ message: string }>('/auth/register', {
        method: 'POST',
        body: form,
      });
      setMessage(response.message);
      setForm({ first_name: '', last_name: '', email: '', password: '' });
    } catch (caught) {
      setError(caught instanceof Error ? caught.message : 'Registration failed');
    } finally {
      setSaving(false);
    }
  }

  return (
    <section className="panel form-panel">
      <h2>Create a student account</h2>
      <p>Use your institutional email. An administrator must verify your account.</p>
      <form onSubmit={submit}>
        <div className="form-grid two-columns">
          <label>
            First name
            <input
              value={form.first_name}
              onChange={(event) => setForm({ ...form, first_name: event.target.value })}
              required
            />
          </label>
          <label>
            Last name
            <input
              value={form.last_name}
              onChange={(event) => setForm({ ...form, last_name: event.target.value })}
              required
            />
          </label>
        </div>
        <label>
          Institutional email
          <input
            type="email"
            value={form.email}
            onChange={(event) => setForm({ ...form, email: event.target.value })}
            placeholder="name@mycentennialcollege.ca"
            required
          />
        </label>
        <label>
          Password
          <input
            type="password"
            minLength={6}
            value={form.password}
            onChange={(event) => setForm({ ...form, password: event.target.value })}
            required
          />
        </label>
        {error && <p className="error">{error}</p>}
        {message && <p className="success">{message}</p>}
        <button disabled={saving}>{saving ? 'Registering...' : 'Register'}</button>
      </form>
      <p className="form-footer">
        Already registered? <Link to="/login">Log in</Link>
      </p>
    </section>
  );
}
