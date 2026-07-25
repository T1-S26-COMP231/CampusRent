import { FormEvent, useEffect, useState } from 'react';
import { apiRequest } from '../api/client';

export default function CreateListingPage() {
  const [categories, setCategories] = useState<string[]>([]);
  const [form, setForm] = useState({
    title: '',
    category: '',
    description: '',
    rental_terms: '',
  });
  const [images, setImages] = useState<FileList | null>(null);
  const [message, setMessage] = useState('');
  const [error, setError] = useState('');

  useEffect(() => {
    apiRequest<{ categories: string[] }>('/listings/categories')
      .then((response) => setCategories(response.categories))
      .catch((caught: Error) => setError(caught.message));
  }, []);

  async function submit(event: FormEvent) {
    event.preventDefault();
    const body = new FormData();
    Object.entries(form).forEach(([key, value]) => body.append(key, value));
    Array.from(images ?? []).forEach((file) => body.append('images', file));
    try {
      const response = await apiRequest<{ message: string }>('/listings', {
        method: 'POST',
        body,
      });
      setMessage(response.message);
      setError('');
      setForm({ title: '', category: '', description: '', rental_terms: '' });
      setImages(null);
    } catch (caught) {
      setError(caught instanceof Error ? caught.message : 'Could not create listing');
    }
  }

  return (
    <section className="panel form-panel">
      <h2>Create an item listing</h2>
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
            <option value="">Choose a category</option>
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
          Images (up to five)
          <input type="file" accept="image/*" multiple onChange={(event) => setImages(event.target.files)} />
        </label>
        {error && <p className="error">{error}</p>}
        {message && <p className="success">{message}</p>}
        <button>Create listing</button>
      </form>
    </section>
  );
}
