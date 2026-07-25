import { useEffect, useState } from 'react';
import { Link } from 'react-router-dom';
import { apiRequest } from '../api/client';
import StatusBadge from '../components/StatusBadge';

interface Listing {
  id: string;
  title: string;
  category: string;
  availability: 'available' | 'unavailable';
}

export default function MyListingsPage() {
  const [listings, setListings] = useState<Listing[]>([]);
  const [error, setError] = useState('');

  async function loadListings() {
    try {
      const response = await apiRequest<{ listings: Listing[] }>('/listings/mine');
      setListings(response.listings);
      setError('');
    } catch (caught) {
      setError(caught instanceof Error ? caught.message : 'Could not load listings');
    }
  }

  useEffect(() => {
    void loadListings();
  }, []);

  async function removeListing(id: string) {
    if (!window.confirm('Remove this listing?')) return;
    try {
      await apiRequest(`/listings/${id}`, { method: 'DELETE' });
      await loadListings();
    } catch (caught) {
      setError(caught instanceof Error ? caught.message : 'Could not remove listing');
    }
  }

  async function changeAvailability(listing: Listing) {
    const availability = listing.availability === 'available' ? 'unavailable' : 'available';
    try {
      await apiRequest(`/listings/${listing.id}/availability`, {
        method: 'PATCH',
        body: { availability },
      });
      await loadListings();
    } catch (caught) {
      setError(caught instanceof Error ? caught.message : 'Could not update availability');
    }
  }

  return (
    <section>
      <div className="page-heading">
        <div>
          <h2>My listings</h2>
          <p>Manage the items you have offered to other students.</p>
        </div>
        <Link className="button-link" to="/listings/new">Create listing</Link>
      </div>
      {error && <p className="error">{error}</p>}
      <div className="stack">
        {!listings.length && <div className="panel">You do not have any listings yet.</div>}
        {listings.map((listing) => (
          <article className="panel row-card" key={listing.id}>
            <div>
              <h3>{listing.title}</h3>
              <p>{listing.category}</p>
              <StatusBadge status={listing.availability} />
            </div>
            <div className="actions">
              <Link className="button-link secondary" to={`/listings/${listing.id}/edit`}>
                Edit
              </Link>
              <button className="secondary" onClick={() => void changeAvailability(listing)}>
                Mark {listing.availability === 'available' ? 'unavailable' : 'available'}
              </button>
              <button className="danger" onClick={() => void removeListing(listing.id)}>
                Remove
              </button>
            </div>
          </article>
        ))}
      </div>
    </section>
  );
}
