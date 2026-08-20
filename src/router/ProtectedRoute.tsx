import { Navigate } from 'react-router-dom';
import { useAppSelector } from '../app/store';
import type { ReactNode } from 'react';
import { ROLE_PERMISSIONS, PAGE_PERMISSIONS } from '../types';

const ProtectedRoute = ({ children }: { children: ReactNode }) => {
  const { isAuthenticated, user } = useAppSelector(state => state.auth);
  if (!isAuthenticated || !user) return <Navigate to="/login" replace />;

  const currentPath = window.location.pathname;
  const requiredPermission = PAGE_PERMISSIONS[currentPath];

  if (requiredPermission) {
    const userPermissions = ROLE_PERMISSIONS[user.role] || [];
    if (!userPermissions.includes(requiredPermission)) {
      const fallback = user.role === 'cashier' ? '/pos' : '/dashboard';
      return <Navigate to={fallback} replace />;
    }
  }

  return <>{children}</>;
};

export default ProtectedRoute;
