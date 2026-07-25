import { useEffect, useState } from 'react';
import { apiRequest } from '../api/client';
import StatusBadge from '../components/StatusBadge';
import { useAuth } from '../context/AuthContext';

interface PendingUser {
  id: string;
  email: string;
  first_name: string;
  last_name: string;
  verification_status: string;
  created_at: string;
}

export default function AdminPage() {
  const { user } = useAuth();
  const [users, setUsers] = useState<PendingUser[]>([]);
  const [error, setError] = useState('');

  async function loadUsers() {
    try {
      const response = await apiRequest<{ users: PendingUser[] }>('/admin/verifications');
      setUsers(response.users);
      setError('');
    } catch (caught) {
      setError(caught instanceof Error ? caught.message : 'Could not load accounts');
    }
  }

  useEffect(() => {
    if (user?.role === 'admin') void loadUsers();
  }, [user]);

  async function decide(id: string, status: 'verified' | 'rejected') {
    try {
      await apiRequest(`/admin/verifications/${id}`, {
        method: 'PATCH',
        body: { status },
      });
      await loadUsers();
    } catch (caught) {
      setError(caught instanceof Error ? caught.message : 'Could not update account');
    }
  }

  if (user?.role !== 'admin') {
    return (
      <section className="panel">
        <h2>Administrator verification</h2>
        <p className="error">Administrator access is required.</p>
      </section>
    );
  }

  return (
    <section>
      <div className="page-heading">
        <div>
          <h2>Student verification</h2>
          <p>Review pending institutional-email registrations.</p>
        </div>
      </div>
      {error && <p className="error">{error}</p>}
      <div className="stack">
        {!users.length && <div className="panel">No accounts are waiting for verification.</div>}
        {users.map((candidate) => (
          <article className="panel row-card" key={candidate.id}>
            <div>
              <h3>{candidate.first_name} {candidate.last_name}</h3>
              <p>{candidate.email}</p>
              <StatusBadge status={candidate.verification_status} />
            </div>
            <div className="actions">
              <button onClick={() => void decide(candidate.id, 'verified')}>Verify</button>
              <button className="danger" onClick={() => void decide(candidate.id, 'rejected')}>
                Reject
              </button>
            </div>
          </article>
        ))}
      </div>
    </section>
  );
}
