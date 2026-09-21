import {
  Navigate,
  Outlet,
  useLocation,
} from 'react-router-dom';

import { useAuth } from '../context/AuthContext';

export default function ProtectedRoute() {
  const {
    user,
    loading,
  } = useAuth();

  const location =
    useLocation();

  if (loading) {
    return (
      <main className="container state-page">
        <div className="state-card">
          <span className="eyebrow">
            ACCOUNT
          </span>

          <h2>
            Loading your account...
          </h2>
        </div>
      </main>
    );
  }

  if (!user) {
    return (
      <Navigate
        to={`/login?next=${encodeURIComponent(
          location.pathname
        )}`}
        replace
      />
    );
  }

  return <Outlet />;
}
