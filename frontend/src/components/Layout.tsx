import { Link, useNavigate } from 'react-router-dom';
import { useAuth } from '../context/AuthContext';

export default function Layout({ children }: { children: React.ReactNode }) {
  const { user, logout } = useAuth();
  const navigate = useNavigate();

  return (
    <div className="app-shell">
      <header className="site-header">
        <Link className="brand" to="/">CampusRent</Link>
        <nav>
          {user ? (
            <>
              <Link to="/browse">Browse</Link>
              <Link to="/listings/new">Create listing</Link>
              <Link to="/my-listings">My listings</Link>
              <Link to="/requests">Requests</Link>
              {user.role === 'admin' && <Link to="/admin">Verification</Link>}
              <button
                className="link-button"
                onClick={() => {
                  logout();
                  navigate('/login');
                }}
              >
                Log out
              </button>
            </>
          ) : (
            <>
              <Link to="/login">Log in</Link>
              <Link to="/register">Register</Link>
            </>
          )}
        </nav>
      </header>
      <main className="page">{children}</main>
    </div>
  );
}
