import { createContext, useContext, useEffect, useState } from 'react';
import { apiRequest } from '../api/client';

export interface User {
  id: string;
  email: string;
  first_name: string;
  last_name: string;
  role: 'student' | 'admin';
  verification_status: 'pending' | 'verified' | 'rejected';
}

interface AuthContextValue {
  user: User | null;
  loading: boolean;
  login: (email: string, password: string) => Promise<void>;
  logout: () => void;
}

const AuthContext = createContext<AuthContextValue | undefined>(undefined);

export function AuthProvider({ children }: { children: React.ReactNode }) {
  const [user, setUser] = useState<User | null>(null);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    if (!localStorage.getItem('campusrent_token')) {
      setLoading(false);
      return;
    }
    apiRequest<{ user: User }>('/auth/me')
      .then((response) => setUser(response.user))
      .catch(() => localStorage.removeItem('campusrent_token'))
      .finally(() => setLoading(false));
  }, []);

  async function login(email: string, password: string) {
    const response = await apiRequest<{ token: string; user: User }>('/auth/login', {
      method: 'POST',
      body: { email, password },
    });
    localStorage.setItem('campusrent_token', response.token);
    setUser(response.user);
  }

  function logout() {
    localStorage.removeItem('campusrent_token');
    setUser(null);
  }

  return (
    <AuthContext.Provider value={{ user, loading, login, logout }}>
      {children}
    </AuthContext.Provider>
  );
}

export function useAuth() {
  const value = useContext(AuthContext);
  if (!value) throw new Error('useAuth must be used inside AuthProvider');
  return value;
}
