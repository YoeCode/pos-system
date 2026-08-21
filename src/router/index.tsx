import { Suspense, lazy } from 'react';
import { createBrowserRouter, Navigate } from 'react-router-dom';

import AuthLayout from '../layouts/AuthLayout';
import DashboardLayout from '../layouts/DashboardLayout';
import ProtectedRoute from './ProtectedRoute';

const LandingPage = lazy(() => import('../pages/Landing/LandingPage'));
const LoginPage = lazy(() => import('../pages/Login/LoginPage'));
const RegisterPage = lazy(() => import('../pages/Register/RegisterPage'));
const TenantSelectPage = lazy(() => import('../pages/TenantSelect/TenantSelectPage'));

const AcceptInvitePage = lazy(() => import('../pages/AcceptInvite/AcceptInvitePage'));
const POSPage = lazy(() => import('../pages/POS/POSPage'));
const ProductsPage = lazy(() => import('../pages/Products/ProductsPage'));
const EmployeesPage = lazy(() => import('../pages/Employees/EmployeesPage'));
const DashboardPage = lazy(() => import('../pages/Dashboard/DashboardPage'));
const ReportsPage = lazy(() => import('../pages/Reports/ReportsPage'));
const SettingsPage = lazy(() => import('../pages/Settings/SettingsPage'));
const CustomersPage = lazy(() => import('../pages/Customers/CustomersPage'));
const InventoryPage = lazy(() => import('../pages/Inventory/InventoryPage'));

const PageLoader = () => (
  <div className="flex h-screen items-center justify-center">
    <div className="text-lg text-gray-600">Cargando...</div>
  </div>
);

export const router = createBrowserRouter([
  {
    path: '/',
    element: (
      <Suspense fallback={<PageLoader />}>
        <LandingPage />
      </Suspense>
    ),
  },
  {
    path: '/login',
    element: (
      <Suspense fallback={<PageLoader />}>
        <AuthLayout>
          <LoginPage />
        </AuthLayout>
      </Suspense>
    ),
  },
  {
    path: '/register',
    element: (
      <Suspense fallback={<PageLoader />}>
        <AuthLayout>
          <RegisterPage />
        </AuthLayout>
      </Suspense>
    ),
  },
  {
    path: '/select-tenant',
    element: (
      <Suspense fallback={<PageLoader />}>
        <AuthLayout>
          <TenantSelectPage />
        </AuthLayout>
      </Suspense>
    ),
  },
  {
    path: '/pos',
    element: (
      <Suspense fallback={<PageLoader />}>
        <ProtectedRoute>
          <DashboardLayout>
            <POSPage />
          </DashboardLayout>
        </ProtectedRoute>
      </Suspense>
    ),
  },
  {
    path: '/products',
    element: (
      <Suspense fallback={<PageLoader />}>
        <ProtectedRoute>
          <DashboardLayout>
            <ProductsPage />
          </DashboardLayout>
        </ProtectedRoute>
      </Suspense>
    ),
  },
  {
    path: '/employees',
    element: (
      <Suspense fallback={<PageLoader />}>
        <ProtectedRoute>
          <DashboardLayout>
            <EmployeesPage />
          </DashboardLayout>
        </ProtectedRoute>
      </Suspense>
    ),
  },
  {
    path: '/dashboard',
    element: (
      <Suspense fallback={<PageLoader />}>
        <ProtectedRoute>
          <DashboardLayout>
            <DashboardPage />
          </DashboardLayout>
        </ProtectedRoute>
      </Suspense>
    ),
  },
  {
    path: '/reports',
    element: (
      <Suspense fallback={<PageLoader />}>
        <ProtectedRoute>
          <DashboardLayout>
            <ReportsPage />
          </DashboardLayout>
        </ProtectedRoute>
      </Suspense>
    ),
  },
  {
    path: '/settings',
    element: (
      <Suspense fallback={<PageLoader />}>
        <ProtectedRoute>
          <DashboardLayout>
            <SettingsPage />
          </DashboardLayout>
        </ProtectedRoute>
      </Suspense>
    ),
  },
  {
    path: '/customers',
    element: (
      <Suspense fallback={<PageLoader />}>
        <ProtectedRoute>
          <DashboardLayout>
            <CustomersPage />
          </DashboardLayout>
        </ProtectedRoute>
      </Suspense>
    ),
  },
  {
    path: '/inventory',
    element: (
      <Suspense fallback={<PageLoader />}>
        <ProtectedRoute>
          <DashboardLayout>
            <InventoryPage />
          </DashboardLayout>
        </ProtectedRoute>
      </Suspense>
    ),
  },
  {
    path: '/tenant-settings',
    element: <Navigate to="/settings" replace />,
  },
  {
    path: '/accept-invite',
    element: (
      <Suspense fallback={<PageLoader />}>
        <AcceptInvitePage />
      </Suspense>
    ),
  },
]);
