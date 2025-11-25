import { Navigate } from 'react-router-dom';
import { useOperatorAuthStore } from '../store/operatorAuthStore';

interface OperatorProtectedRouteProps {
  children: React.ReactNode;
}

const OperatorProtectedRoute = ({ children }: OperatorProtectedRouteProps) => {
  const { isAuthenticated } = useOperatorAuthStore();

  if (!isAuthenticated) {
    return <Navigate to="/operator/login" replace />;
  }

  return <>{children}</>;
};

export default OperatorProtectedRoute;
