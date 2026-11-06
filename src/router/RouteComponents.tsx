import { lazy } from 'react';

// Lazy route page components. Kept in this module so each file exports only
// components, preserving Fast Refresh boundaries (react-refresh/only-export-components).
export const LandingPage = lazy(() => import('../pages/Landing/LandingPage'));
export const LoginPage = lazy(() => import('../pages/Login/LoginPage'));
export const RegisterPage = lazy(() => import('../pages/Register/RegisterPage'));
export const TenantSelectPage = lazy(() => import('../pages/TenantSelect/TenantSelectPage'));

export const AcceptInvitePage = lazy(() => import('../pages/AcceptInvite/AcceptInvitePage'));
export const POSPage = lazy(() => import('../pages/POS/POSPage'));
export const ProductsPage = lazy(() => import('../pages/Products/ProductsPage'));
export const EmployeesPage = lazy(() => import('../pages/Employees/EmployeesPage'));
export const DashboardPage = lazy(() => import('../pages/Dashboard/DashboardPage'));
export const ReportsPage = lazy(() => import('../pages/Reports/ReportsPage'));
export const SettingsPage = lazy(() => import('../pages/Settings/SettingsPage'));
export const CustomersPage = lazy(() => import('../pages/Customers/CustomersPage'));
export const InventoryPage = lazy(() => import('../pages/Inventory/InventoryPage'));

export const PageLoader = () => (
  <div className="flex h-screen items-center justify-center">
    <div className="text-lg text-gray-600">Cargando...</div>
  </div>
);
