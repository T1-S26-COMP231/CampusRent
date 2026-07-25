const API_URL = 'http://localhost:3001/api';
export const BACKEND_URL = 'http://localhost:3001';

export interface ApiOptions extends Omit<RequestInit, 'body'> {
  body?: BodyInit | Record<string, unknown>;
}

export async function apiRequest<T>(path: string, options: ApiOptions = {}): Promise<T> {
  const token = localStorage.getItem('campusrent_token');
  const headers = new Headers(options.headers);
  if (token) headers.set('Authorization', `Bearer ${token}`);

  let body = options.body;
  if (body && !(body instanceof FormData) && typeof body !== 'string') {
    headers.set('Content-Type', 'application/json');
    body = JSON.stringify(body);
  }

  const response = await fetch(`${API_URL}${path}`, { ...options, headers, body });
  const data = (await response.json()) as T & { error?: string };
  if (!response.ok) {
    throw new Error(data.error || 'Request failed');
  }
  return data;
}
