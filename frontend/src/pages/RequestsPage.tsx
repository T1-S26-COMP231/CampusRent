import { useEffect, useState } from 'react';
import { apiRequest } from '../api/client';
import StatusBadge from '../components/StatusBadge';

interface RentalRequest {
  id: string;
  start_date: string;
  end_date: string;
  message: string;
  status: string;
  listing: { id: string; title: string } | null;
  renter: { first_name: string; last_name: string } | null;
}

export default function RequestsPage() {
  const [requests, setRequests] = useState<RentalRequest[]>([]);
  const [error, setError] = useState('');

  async function loadRequests() {
    try {
      const response = await apiRequest<{ requests: RentalRequest[] }>('/requests/incoming');
      setRequests(response.requests);
      setError('');
    } catch (caught) {
      setError(caught instanceof Error ? caught.message : 'Could not load requests');
    }
  }

  useEffect(() => {
    void loadRequests();
  }, []);

  async function approve(id: string) {
    try {
      await apiRequest(`/requests/${id}/approve`, { method: 'PATCH' });
      await loadRequests();
    } catch (caught) {
      setError(caught instanceof Error ? caught.message : 'Could not approve request');
    }
  }

  return (
    <section>
      <div className="page-heading">
        <div>
          <h2>Incoming rental requests</h2>
          <p>Review requests submitted for your listings.</p>
        </div>
      </div>
      {error && <p className="error">{error}</p>}
      <div className="stack">
        {!requests.length && <div className="panel">No incoming requests.</div>}
        {requests.map((request) => (
          <article className="panel row-card" key={request.id}>
            <div>
              <h3>{request.listing?.title ?? 'Unavailable listing'}</h3>
              <p>
                Requested by {request.renter
                  ? `${request.renter.first_name} ${request.renter.last_name}`
                  : 'Student'}
              </p>
              <p>{request.start_date} to {request.end_date}</p>
              {request.message && <p>{request.message}</p>}
              <StatusBadge status={request.status} />
            </div>
            {request.status === 'pending' && (
              <button onClick={() => void approve(request.id)}>Approve request</button>
            )}
          </article>
        ))}
      </div>
    </section>
  );
}
