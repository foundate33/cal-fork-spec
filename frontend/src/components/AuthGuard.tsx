import { Navigate } from 'react-router-dom';
import { useAuth } from '../context/AuthContext';

export function AuthGuard({ children }: { children: React.ReactNode }) {
  const { userId } = useAuth();
  if (!userId) {
    return <Navigate to="/" replace />;
  }
  return <>{children}</>;
}