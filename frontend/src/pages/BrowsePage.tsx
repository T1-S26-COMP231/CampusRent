import { FormEvent, useEffect, useState } from 'react';
import { apiRequest } from '../api/client';
import ListingCard, { ListingSummary } from '../components/ListingCard';

export default function BrowsePage() {
  const [listings, setListings] = useState<ListingSummary[]>([]);
  const [error, setError] = useState('');
  const [search, setSearch] = useState('');
  const [category, setCategory] = useState('');
  const [categories, setCategories] = useState<string[]>([]);

  async function loadListings() {
    let path = '/listings';
    const params = new URLSearchParams();
    if (search.trim()) params.set('search', search.trim());
    if (category) params.set('category', category);
    if (params.size) path += `?${params.toString()}`;

    try {
      const response = await apiRequest<{ listings: ListingSummary[] }>(path);
      setListings(response.listings);
      setError('');
    } catch (caught) {
      setError(caught instanceof Error ? caught.message : 'Could not load listings');
    }
  }

  useEffect(() => {
    void loadListings();
    apiRequest<{ categories: string[] }>('/listings/categories')
      .then((response) => setCategories(response.categories))
      .catch(() => undefined);
  }, []);

  function searchListings(event: FormEvent) {
    event.preventDefault();
    void loadListings();
  }

  return (
    <section>
      <div className="page-heading">
        <div>
          <h2>Browse available listings</h2>
          <p>Discover items offered by verified students.</p>
        </div>
      </div>
      <form className="panel search-bar" onSubmit={searchListings}>
        <input
          value={search}
          onChange={(event) => setSearch(event.target.value)}
          placeholder="Search titles and descriptions"
        />
        <select value={category} onChange={(event) => setCategory(event.target.value)}>
          <option value="">All categories</option>
          {categories.map((item) => <option key={item}>{item}</option>)}
        </select>
        <button>Search</button>
      </form>
      {error && <p className="error">{error}</p>}
      <div className="listing-grid">
        {!listings.length && <div className="panel">No available listings found.</div>}
        {listings.map((listing) => <ListingCard key={listing.id} listing={listing} />)}
      </div>
    </section>
  );
}
