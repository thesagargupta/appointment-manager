import { Navigate, Outlet, useLocation } from 'react-router-dom';
import { useAuth } from '../../context/AuthContext';
import { ErrorState, Spinner } from '../ui/Feedback';

export function ProtectedRoute() {
  const { admin, isLoading, error, retry } = useAuth();
  const location = useLocation();
  if (isLoading) return <Spinner label="Checking session" />;
  if (error) return <ErrorState message="We couldn't verify your session. Check your connection." onRetry={retry} />;
  if (!admin) return <Navigate to="/login" replace state={{ from: location }} />;
  return <Outlet />;
}
