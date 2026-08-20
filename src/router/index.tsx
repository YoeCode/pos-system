import { createBrowserRouter, Navigate } from 'react-router-dom';

import AuthLayout from '../layouts/AuthLayout';
import DashboardLayout from '../layouts/DashboardLayout';

import LandingPage from '../pages/Landing/LandingPage';
import LoginPage from '../pages/Login/LoginPage';
import RegisterPage from '../pages/Register/RegisterPage';
import TenantSelectPage from '../pages/TenantSelect/TenantSelectPage';

import AcceptInvitePage from '../pages/AcceptInvite/AcceptInvitePage';
import POSPage from '../pages/POS/POSPage';
import ProductsPage from '../pages/Products/ProductsPage';
import EmployeesPage from '../pages/Employees/EmployeesPage';
import DashboardPage from '../pages/Dashboard/DashboardPage';
import ReportsPage from '../pages/Reports/ReportsPage';
import SettingsPage from '../pages/Settings/SettingsPage';
import CustomersPage from '../pages/Customers/CustomersPage';
import InventoryPage from '../pages/Inventory/InventoryPage';
import ProtectedRoute from './ProtectedRoute';

export const router = createBrowserRouter([
  {
    path: '/',
    element: <LandingPage />,
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
    path: '/register',
    element: (
      <AuthLayout>
        <RegisterPage />
      </AuthLayout>
    ),
  },
  {
    path: '/select-tenant',
    element: (
      <AuthLayout>
        <TenantSelectPage />
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
  {
    path: '/inventory',
    element: (
      <ProtectedRoute>
        <DashboardLayout>
          <InventoryPage />
        </DashboardLayout>
      </ProtectedRoute>
    ),
  },
  {
    path: '/tenant-settings',
    element: <Navigate to="/settings" replace />,
  },
  {
    path: '/accept-invite',
    element: <AcceptInvitePage />,
  },
]);
