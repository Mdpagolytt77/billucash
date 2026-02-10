import { Navigate, useLocation } from 'react-router-dom';
import { useAuth } from '@/contexts/AuthContext';
import LoadingScreen from '@/components/LoadingScreen';

interface ProtectedRouteProps {
  children: React.ReactNode;
  requireAdmin?: boolean;
}

const MODERATOR_ALLOWED_PATHS = ['/admin/users', '/admin/offers'];

const ProtectedRoute = ({ children, requireAdmin = false }: ProtectedRouteProps) => {
  const { user, isAdmin, isModerator, isLoading } = useAuth();
  const location = useLocation();

  if (isLoading) {
    return <LoadingScreen isLoading={true} />;
  }

  if (!user) {
    return <Navigate to="/signup" state={{ from: location }} replace />;
  }

  if (requireAdmin) {
    if (!isAdmin && !isModerator) {
      return <Navigate to="/dashboard" replace />;
    }
    // Moderators can only access specific pages
    if (isModerator && !isAdmin && !MODERATOR_ALLOWED_PATHS.includes(location.pathname)) {
      return <Navigate to="/admin/users" replace />;
    }
  }

  return <>{children}</>;
};

export default ProtectedRoute;
