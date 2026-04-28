import { createBrowserRouter, Navigate } from 'react-router-dom';
import { useAppSelector } from '../app/store';
import type { ReactNode } from 'react';
import { ROLE_PERMISSIONS } from '../types';

import AuthLayout from '../layouts/AuthLayout';
import DashboardLayout from '../layouts/DashboardLayout';

import LoginPage from '../pages/Login/LoginPage';
import POSPage from '../pages/POS/POSPage';
import ProductsPage from '../pages/Products/ProductsPage';
import EmployeesPage from '../pages/Employees/EmployeesPage';
import DashboardPage from '../pages/Dashboard/DashboardPage';
import ReportsPage from '../pages/Reports/ReportsPage';
import SettingsPage from '../pages/Settings/SettingsPage';
import CustomersPage from '../pages/Customers/CustomersPage';

const PAGE_ROUTES: Record<string, string> = {
  '/pos': 'pos',
  '/products': 'products',
  '/employees': 'employees',
  '/dashboard': 'dashboard',
  '/reports': 'reports',
  '/settings': 'settings',
  '/customers': 'customers',
};

const ProtectedRoute = ({ children }: { children: ReactNode }) => {
  const { isAuthenticated, user } = useAppSelector(state => state.auth);
  if (!isAuthenticated || !user) return <Navigate to="/login" replace />;

  const currentPath = window.location.pathname;
  const requiredPermission = PAGE_ROUTES[currentPath];

  if (requiredPermission) {
    const userPermissions = ROLE_PERMISSIONS[user.role] || [];
    if (!userPermissions.includes(requiredPermission)) {
      const fallback = user.role === 'cashier' ? '/pos' : '/dashboard';
      return <Navigate to={fallback} replace />;
    }
  }

  return <>{children}</>;
};

export const router = createBrowserRouter([
  {
    path: '/',
    element: <Navigate to="/login" replace />,
  },
  {
    path: '/login',
    element: (
      <AuthLayout>
        <LoginPage />
      </AuthLayout>
    ),
  },
  {
    path: '/pos',
    element: (
      <ProtectedRoute>
        <DashboardLayout>
          <POSPage />
        </DashboardLayout>
      </ProtectedRoute>
    ),
  },
  {
    path: '/products',
    element: (
      <ProtectedRoute>
        <DashboardLayout>
          <ProductsPage />
        </DashboardLayout>
      </ProtectedRoute>
    ),
  },
  {
    path: '/employees',
    element: (
      <ProtectedRoute>
        <DashboardLayout>
          <EmployeesPage />
        </DashboardLayout>
      </ProtectedRoute>
    ),
  },
  {
    path: '/dashboard',
    element: (
      <ProtectedRoute>
        <DashboardLayout>
          <DashboardPage />
        </DashboardLayout>
      </ProtectedRoute>
    ),
  },
  {
    path: '/reports',
    element: (
      <ProtectedRoute>
        <DashboardLayout>
          <ReportsPage />
        </DashboardLayout>
      </ProtectedRoute>
    ),
  },
  {
    path: '/settings',
    element: (
      <ProtectedRoute>
        <DashboardLayout>
          <SettingsPage />
        </DashboardLayout>
      </ProtectedRoute>
    ),
  },
  {
    path: '/customers',
    element: (
      <ProtectedRoute>
        <DashboardLayout>
          <CustomersPage />
        </DashboardLayout>
      </ProtectedRoute>
    ),
  },
]);
