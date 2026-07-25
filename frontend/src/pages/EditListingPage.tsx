import { FormEvent, useEffect, useState } from 'react';
import { useNavigate, useParams } from 'react-router-dom';
import { apiRequest } from '../api/client';

interface Listing {
  id: string;
  title: string;
  category: string;
  description: string;
  rental_terms: string;
}

export default function EditListingPage() {
  const { id } = useParams();
  const navigate = useNavigate();
  const [categories, setCategories] = useState<string[]>([]);
  const [form, setForm] = useState({
    title: '',
    category: '',
    description: '',
    rental_terms: '',
  });
  const [images, setImages] = useState<FileList | null>(null);
  const [error, setError] = useState('');

  useEffect(() => {
    Promise.all([
      apiRequest<{ listings: Listing[] }>('/listings/mine'),
      apiRequest<{ categories: string[] }>('/listings/categories'),
    ])
      .then(([listingResponse, categoryResponse]) => {
        const listing = listingResponse.listings.find((candidate) => candidate.id === id);
        if (!listing) throw new Error('Listing not found');
        setForm({
          title: listing.title,
          category: listing.category,
          description: listing.description,
          rental_terms: listing.rental_terms,
        });
        setCategories(categoryResponse.categories);
      })
      .catch((caught: Error) => setError(caught.message));
  }, [id]);

  async function submit(event: FormEvent) {
    event.preventDefault();
    const body = new FormData();
    Object.entries(form).forEach(([key, value]) => body.append(key, value));
    Array.from(images ?? []).forEach((file) => body.append('images', file));
    try {
      await apiRequest(`/listings/${id}`, { method: 'PUT', body });
      navigate('/my-listings');
    } catch (caught) {
      setError(caught instanceof Error ? caught.message : 'Could not update listing');
    }
  }

  return (
    <section className="panel form-panel">
      <h2>Edit listing</h2>
      <form onSubmit={submit}>
        <label>
          Title
          <input
            value={form.title}
            onChange={(event) => setForm({ ...form, title: event.target.value })}
            required
          />
        </label>
        <label>
          Category
          <select
            value={form.category}
            onChange={(event) => setForm({ ...form, category: event.target.value })}
            required
          >
            {categories.map((category) => <option key={category}>{category}</option>)}
          </select>
        </label>
        <label>
          Description
          <textarea
            value={form.description}
            onChange={(event) => setForm({ ...form, description: event.target.value })}
            required
          />
        </label>
        <label>
          Rental terms
          <textarea
            value={form.rental_terms}
            onChange={(event) => setForm({ ...form, rental_terms: event.target.value })}
          />
        </label>
        <label>
          Add images
          <input type="file" accept="image/*" multiple onChange={(event) => setImages(event.target.files)} />
        </label>
        {error && <p className="error">{error}</p>}
        <div className="actions">
          <button>Save changes</button>
          <button className="secondary" type="button" onClick={() => navigate('/my-listings')}>
            Cancel
          </button>
        </div>
      </form>
    </section>
  );
}
