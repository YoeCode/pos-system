import React from 'react';
import { NavLink, useNavigate } from 'react-router-dom';
import { useAppDispatch, useAppSelector } from '../app/store';
import { logout } from '../features/auth/authSlice';
import { ROLE_PERMISSIONS } from '../types';
import { selectStoreName } from '../features/settings/settingsSlice';

interface NavItemProps {
  to: string;
  icon: React.ReactNode;
  label: string;
}

const NavItem: React.FC<NavItemProps> = ({ to, icon, label }) => {
  return (
    <NavLink
      to={to}
      className={({ isActive }) =>
        `flex items-center gap-3 px-4 py-2.5 mx-2 rounded-lg text-sm font-medium transition-all duration-150 ${
          isActive
            ? 'text-primary bg-primary/5 border-l-[3px] border-primary pl-[13px]'
            : 'text-text-muted hover:text-text-primary hover:bg-gray-50 border-l-[3px] border-transparent pl-[13px]'
        }`
      }
    >
      <span className="w-4 h-4 flex-shrink-0">{icon}</span>
      <span>{label}</span>
    </NavLink>
  );
};

const DashboardIcon = () => (
  <svg fill="none" stroke="currentColor" viewBox="0 0 24 24" className="w-4 h-4">
    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M3 7h7V3H3v4zm0 10h7v-6H3v6zm11 0h7v-4h-7v4zm0-14v6h7V3h-7z" />
  </svg>
);
const SalesIcon = () => (
  <svg fill="none" stroke="currentColor" viewBox="0 0 24 24" className="w-4 h-4">
    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M3 3h2l.4 2M7 13h10l4-8H5.4m0 0L7 13m0 0l-1.5 6h13" />
  </svg>
);
const ProductsIcon = () => (
  <svg fill="none" stroke="currentColor" viewBox="0 0 24 24" className="w-4 h-4">
    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M20 7l-8-4-8 4m16 0l-8 4m8-4v10l-8 4m0-10L4 7m8 4v10M4 7v10l8 4" />
  </svg>
);
const TeamIcon = () => (
  <svg fill="none" stroke="currentColor" viewBox="0 0 24 24" className="w-4 h-4">
    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M17 20h5v-2a4 4 0 00-5-3.87M9 20H4v-2a4 4 0 015-3.87m8-4a4 4 0 11-8 0 4 4 0 018 0zm6 4a2 2 0 11-4 0 2 2 0 014 0zM5 16a2 2 0 11-4 0 2 2 0 014 0z" />
  </svg>
);
const ReportsIcon = () => (
  <svg fill="none" stroke="currentColor" viewBox="0 0 24 24" className="w-4 h-4">
    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 19v-6a2 2 0 00-2-2H5a2 2 0 00-2 2v6a2 2 0 002 2h2a2 2 0 002-2zm0 0V9a2 2 0 012-2h2a2 2 0 012 2v10m-6 0a2 2 0 002 2h2a2 2 0 002-2m0 0V5a2 2 0 012-2h2a2 2 0 012 2v14a2 2 0 01-2 2h-2a2 2 0 01-2-2z" />
  </svg>
);
const SettingsIcon = () => (
  <svg fill="none" stroke="currentColor" viewBox="0 0 24 24" className="w-4 h-4">
    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M10.325 4.317c.426-1.756 2.924-1.756 3.35 0a1.724 1.724 0 002.573 1.066c1.543-.94 3.31.826 2.37 2.37a1.724 1.724 0 001.065 2.572c1.756.426 1.756 2.924 0 3.35a1.724 1.724 0 00-1.066 2.573c.94 1.543-.826 3.31-2.37 2.37a1.724 1.724 0 00-2.572 1.065c-.426 1.756-2.924 1.756-3.35 0a1.724 1.724 0 00-2.573-1.066c-1.543.94-3.31-.826-2.37-2.37a1.724 1.724 0 00-1.065-2.572c-1.756-.426-1.756-2.924 0-3.35a1.724 1.724 0 001.066-2.573c-.94-1.543.826-3.31 2.37-2.37.996.608 2.296.07 2.572-1.065z" />
    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M15 12a3 3 0 11-6 0 3 3 0 016 0z" />
  </svg>
);

interface DashboardLayoutProps {
  children: React.ReactNode;
}

const DashboardLayout: React.FC<DashboardLayoutProps> = ({ children }) => {
  const dispatch = useAppDispatch();
  const navigate = useNavigate();
  const user = useAppSelector(state => state.auth.user);
  const storeName = useAppSelector(selectStoreName);

  const handleLogout = () => {
    dispatch(logout());
    navigate('/login');
  };

  const userPermissions = user ? ROLE_PERMISSIONS[user.role] || [] : [];

  const navItems = [
    { to: '/dashboard', icon: <DashboardIcon />, label: 'Dashboard', permission: 'dashboard' },
    { to: '/pos', icon: <SalesIcon />, label: 'Sales', permission: 'pos' },
    { to: '/products', icon: <ProductsIcon />, label: 'Products', permission: 'products' },
    { to: '/employees', icon: <TeamIcon />, label: 'Team', permission: 'employees' },
    { to: '/reports', icon: <ReportsIcon />, label: 'Reports', permission: 'reports' },
    { to: '/settings', icon: <SettingsIcon />, label: 'Settings', permission: 'settings' },
  ].filter(item => userPermissions.includes(item.permission));

  return (
    <div className="flex min-h-screen bg-background">
      {/* Sidebar */}
      <aside className="w-[240px] bg-surface border-r border-border flex flex-col fixed h-screen">
        {/* Logo */}
        <div className="px-6 py-5 border-b border-border">
          <div className="flex items-center gap-2">
            <div className="w-8 h-8 rounded-lg bg-primary flex items-center justify-center">
              <svg className="w-4 h-4 text-white" fill="currentColor" viewBox="0 0 24 24">
                <path d="M4 4h6v6H4V4zm10 0h6v6h-6V4zM4 14h6v6H4v-6zm10 3h2v-2h-2v2zm0 3h2v-2h-2v2zm-2-3h2v-2h-2v2zm3-5h2v-2h-2v2zm2 2h2v-2h-2v2zm-2 2h2v-2h-2v2zm-3 0h2v-2h-2v2z" />
              </svg>
            </div>
            <span className="font-bold text-lg text-text-primary tracking-tight">{storeName}</span>
          </div>
        </div>

        {/* Nav */}
        <nav className="flex-1 py-4 flex flex-col gap-1">
          {navItems.map(item => (
            <NavItem key={item.to} to={item.to} icon={item.icon} label={item.label} />
          ))}
        </nav>

        {/* Logout */}
        <div className="p-4 border-t border-border">
          <button
            onClick={handleLogout}
            className="flex items-center gap-3 px-4 py-2.5 w-full rounded-lg text-sm font-medium text-text-muted hover:text-error hover:bg-error/5 transition-all duration-150"
          >
            <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M17 16l4-4m0 0l-4-4m4 4H7m6 4v1a3 3 0 01-3 3H6a3 3 0 01-3-3V7a3 3 0 013-3h4a3 3 0 013 3v1" />
            </svg>
            Logout
          </button>
        </div>
      </aside>

      {/* Main content */}
      <div className="flex-1 ml-[240px] flex flex-col min-h-screen">
        {/* Top bar */}
        <header className="bg-surface border-b border-border px-6 py-3 flex items-center gap-4 sticky top-0 z-10">
          {/* Search */}
          <div className="flex-1 relative">
            <svg className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-text-muted" fill="none" stroke="currentColor" viewBox="0 0 24 24">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M21 21l-6-6m2-5a7 7 0 11-14 0 7 7 0 0114 0z" />
            </svg>
            <input
              type="text"
              placeholder="Search anything..."
              className="w-full pl-9 pr-4 py-2 text-sm bg-background border border-border rounded-lg text-text-primary placeholder-text-muted focus:outline-none focus:ring-2 focus:ring-primary/20 focus:border-primary"
            />
          </div>

          {/* Actions */}
          <div className="flex items-center gap-2">
            <button className="w-9 h-9 flex items-center justify-center rounded-lg hover:bg-background text-text-muted hover:text-text-primary transition-colors">
              <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M15 17h5l-1.405-1.405A2.032 2.032 0 0118 14.158V11a6.002 6.002 0 00-4-5.659V5a2 2 0 10-4 0v.341C7.67 6.165 6 8.388 6 11v3.159c0 .538-.214 1.055-.595 1.436L4 17h5m6 0v1a3 3 0 11-6 0v-1m6 0H9" />
              </svg>
            </button>
            <button className="w-9 h-9 flex items-center justify-center rounded-lg hover:bg-background text-text-muted hover:text-text-primary transition-colors">
              <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M8.228 9c.549-1.165 2.03-2 3.772-2 2.21 0 4 1.343 4 3 0 1.4-1.278 2.575-3.006 2.907-.542.104-.994.54-.994 1.093m0 3h.01M21 12a9 9 0 11-18 0 9 9 0 0118 0z" />
              </svg>
            </button>
          </div>

          {/* Divider */}
          <div className="w-px h-6 bg-border" />

          {/* User */}
          <div className="flex items-center gap-3">
            <div className="text-right">
              <p className="text-sm font-semibold text-text-primary leading-tight">{user?.name || 'Admin'}</p>
              <p className="text-xs text-text-muted leading-tight capitalize">{user?.role} · Terminal {user?.terminal || '01'}</p>
            </div>
            <div className="w-9 h-9 rounded-full bg-primary/20 flex items-center justify-center text-primary font-bold text-sm">
              {user?.name?.charAt(0) || 'A'}
            </div>
          </div>
        </header>

        {/* Page content */}
        <main className="flex-1 overflow-auto">
          {children}
        </main>
      </div>
    </div>
  );
};

export default DashboardLayout;
