import { FormEvent, useEffect, useState } from 'react';
import { useParams } from 'react-router-dom';
import { apiRequest, BACKEND_URL } from '../api/client';
import StatusBadge from '../components/StatusBadge';
import { useAuth } from '../context/AuthContext';

interface Listing {
  id: string;
  owner_id: string;
  title: string;
  category: string;
  description: string;
  rental_terms: string;
  availability: 'available' | 'unavailable';
  images: string[];
  owner: { first_name: string; last_name: string } | null;
}

export default function ListingDetailPage() {
  const { id } = useParams();
  const { user } = useAuth();
  const [listing, setListing] = useState<Listing | null>(null);
  const [error, setError] = useState('');
  const [requestForm, setRequestForm] = useState({
    start_date: '',
    end_date: '',
    message: '',
  });
  const [message, setMessage] = useState('');

  useEffect(() => {
    apiRequest<{ listing: Listing }>(`/listings/${id}`)
      .then((response) => setListing(response.listing))
      .catch((caught: Error) => setError(caught.message));
  }, [id]);

  async function submitRequest(event: FormEvent) {
    event.preventDefault();
    if (!listing) return;
    try {
      const response = await apiRequest<{ message: string }>('/requests', {
        method: 'POST',
        body: { listing_id: listing.id, ...requestForm },
      });
      setMessage(response.message);
      setError('');
      setRequestForm({ start_date: '', end_date: '', message: '' });
    } catch (caught) {
      setError(caught instanceof Error ? caught.message : 'Could not submit request');
    }
  }

  if (error && !listing) return <p className="panel error">{error}</p>;
  if (!listing) return <p className="panel">Loading listing...</p>;

  return (
    <section className="detail-layout">
      <article className="panel">
        <div className="detail-images">
          {listing.images.length ? (
            listing.images.map((image) => (
              <img key={image} src={`${BACKEND_URL}/uploads/${image}`} alt="" />
            ))
          ) : (
            <div className="image-placeholder">No images</div>
          )}
        </div>
        <div className="card-title">
          <h2>{listing.title}</h2>
          <StatusBadge status={listing.availability} />
        </div>
        <p className="muted">{listing.category}</p>
        <h3>Description</h3>
        <p>{listing.description}</p>
        <h3>Rental terms</h3>
        <p>{listing.rental_terms || 'Contact the owner to discuss terms.'}</p>
        <p className="muted">
          Owner: {listing.owner ? `${listing.owner.first_name} ${listing.owner.last_name}` : 'Student'}
        </p>
      </article>

      {user?.id !== listing.owner_id && listing.availability === 'available' && (
        <form className="panel request-form" onSubmit={submitRequest}>
          <h3>Request this item</h3>
          <label>
            Start date
            <input
              type="date"
              value={requestForm.start_date}
              onChange={(event) => setRequestForm({ ...requestForm, start_date: event.target.value })}
              required
            />
          </label>
          <label>
            End date
            <input
              type="date"
              value={requestForm.end_date}
              onChange={(event) => setRequestForm({ ...requestForm, end_date: event.target.value })}
              required
            />
          </label>
          <label>
            Message
            <textarea
              value={requestForm.message}
              onChange={(event) => setRequestForm({ ...requestForm, message: event.target.value })}
            />
          </label>
          {error && <p className="error">{error}</p>}
          {message && <p className="success">{message}</p>}
          <button>Submit rental request</button>
        </form>
      )}
    </section>
  );
}
