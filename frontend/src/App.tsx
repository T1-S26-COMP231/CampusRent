import { Navigate, Route, Routes } from 'react-router-dom';
import Layout from './components/Layout';
import { AuthProvider, useAuth } from './context/AuthContext';
import AdminPage from './pages/AdminPage';
import LoginPage from './pages/LoginPage';
import RegisterPage from './pages/RegisterPage';
import CreateListingPage from './pages/CreateListingPage';
import EditListingPage from './pages/EditListingPage';
import MyListingsPage from './pages/MyListingsPage';
import BrowsePage from './pages/BrowsePage';
import ListingDetailPage from './pages/ListingDetailPage';
import RequestsPage from './pages/RequestsPage';

function Protected({ children }: { children: React.ReactNode }) {
  const { user, loading } = useAuth();
  if (loading) return <p className="panel">Loading...</p>;
  return user ? <>{children}</> : <Navigate to="/login" replace />;
}

function AppRoutes() {
  const { user } = useAuth();
  let defaultPath = user?.role === 'admin' ? '/admin' : '/register';
  if (user?.role === 'student') defaultPath = '/listings/new';
  if (user?.role === 'student') defaultPath = '/my-listings';
  if (user?.role === 'student') defaultPath = '/browse';
  return (
    <Layout>
      <Routes>
        <Route path="/" element={<Navigate to={user ? defaultPath : '/login'} replace />} />
        <Route path="/register" element={<RegisterPage />} />
        <Route path="/login" element={<LoginPage />} />
        <Route
          path="/admin"
          element={
            <Protected>
              <AdminPage />
            </Protected>
          }
        />
        <Route
          path="/listings/new"
          element={
            <Protected>
              <CreateListingPage />
            </Protected>
          }
        />
        <Route
          path="/my-listings"
          element={
            <Protected>
              <MyListingsPage />
            </Protected>
          }
        />
        <Route
          path="/listings/:id/edit"
          element={
            <Protected>
              <EditListingPage />
            </Protected>
          }
        />
        <Route
          path="/browse"
          element={
            <Protected>
              <BrowsePage />
            </Protected>
          }
        />
        <Route
          path="/listings/:id"
          element={
            <Protected>
              <ListingDetailPage />
            </Protected>
          }
        />
        <Route
          path="/requests"
          element={
            <Protected>
              <RequestsPage />
            </Protected>
          }
        />
        <Route path="*" element={<Navigate to="/" replace />} />
      </Routes>
    </Layout>
  );
}

export default function App() {
  return (
    <AuthProvider>
      <AppRoutes />
    </AuthProvider>
  );
}
