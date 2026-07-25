import { Link } from 'react-router-dom';
import { BACKEND_URL } from '../api/client';
import StatusBadge from './StatusBadge';

export interface ListingSummary {
  id: string;
  title: string;
  category: string;
  description: string;
  availability: string;
  images: string[];
  owner: { first_name: string; last_name: string } | null;
}

export default function ListingCard({ listing }: { listing: ListingSummary }) {
  return (
    <article className="listing-card">
      {listing.images[0] ? (
        <img src={`${BACKEND_URL}/uploads/${listing.images[0]}`} alt="" />
      ) : (
        <div className="image-placeholder">No image</div>
      )}
      <div className="listing-card-body">
        <div className="card-title">
          <h3>{listing.title}</h3>
          <StatusBadge status={listing.availability} />
        </div>
        <p className="muted">{listing.category}</p>
        <p>{listing.description}</p>
        <p className="muted">
          Listed by {listing.owner ? `${listing.owner.first_name} ${listing.owner.last_name}` : 'Student'}
        </p>
        <Link className="button-link" to={`/listings/${listing.id}`}>View details</Link>
      </div>
    </article>
  );
}
