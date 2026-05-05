import React, { useState } from 'react';
import { NavLink, useNavigate } from 'react-router-dom';
import { useAppDispatch, useAppSelector } from '../app/store';
import { logout } from '../features/auth/authSlice';
import { ROLE_PERMISSIONS } from '../types';
import { selectStoreName } from '../features/settings/settingsSlice';
import { useI18n } from '../i18n/I18nProvider';

interface NavItemProps {
  to: string;
  icon: React.ReactNode;
  label: string;
  submenus?: { to: string; label: string }[];
}

const NavItem: React.FC<NavItemProps> = ({ to, icon, label, submenus }) => {
  const [isOpen, setIsOpen] = useState(false);

  return (
    <div className="relative">
      {submenus && submenus.length > 0 ? (
        <div>
          <button
            onClick={() => setIsOpen(!isOpen)}
            className="flex items-center justify-between gap-3 w-full px-4 py-3 lg:py-2.5 mx-2 rounded-lg text-sm font-medium transition-all duration-150 text-text-muted hover:text-text-primary hover:bg-gray-50"
          >
            <div className="flex items-center gap-3">
              <span className="w-5 h-5 lg:w-4 lg:h-4 flex-shrink-0">{icon}</span>
              <span className="hidden sm:inline">{label}</span>
            </div>
          </button>
          {isOpen && (
            <div className="ml-6 mr-2 mt-1 bg-surface rounded-lg border border-border overflow-hidden">
              {submenus.map(submenu => (
                <NavLink
                  key={submenu.to}
                  to={submenu.to}
                  onClick={() => document.body.classList.remove('overflow-hidden')}
                  className={({ isActive }) =>
                    `flex items-center gap-3 px-4 py-2.5 text-sm font-medium transition-colors ${
                      isActive
                        ? 'text-text-primary bg-gray-50'
                        : 'text-text-muted hover:text-text-primary hover:bg-gray-50'
                    }`
                  }
                >
                  <span className="hidden sm:inline">{submenu.label}</span>
                </NavLink>
              ))}
            </div>
          )}
        </div>
      ) : (
        <NavLink
          to={to}
          onClick={() => document.body.classList.remove('overflow-hidden')}
          className={({ isActive }) =>
            `flex items-center gap-3 px-4 py-3 lg:py-2.5 mx-2 rounded-lg text-sm font-medium transition-all duration-150 ${
              isActive
                ? 'text-text-primary bg-gray-50 border-l-[3px] border-primary'
                : 'text-text-muted hover:text-text-primary hover:bg-gray-50 border-l-[3px] border-transparent'
            }`
          }
        >
          <span className="w-5 h-5 lg:w-4 lg:h-4 flex-shrink-0">{icon}</span>
          <span className="hidden sm:inline">{label}</span>
        </NavLink>
      )}
    </div>
  );
};

const DashboardIcon = () => (
  <svg fill="none" stroke="currentColor" viewBox="0 0 24 24">
    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M3 7h7V3H3v4zm0 10h7v-6H3v6zm11 0h7v-4h-7v4zm0-14v6h7V3h-7z" />
  </svg>
);
const SalesIcon = () => (
  <svg fill="none" stroke="currentColor" viewBox="0 0 24 24">
    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M3 3h2l.4 2M7 13h10l4-8H5.4m0 0L7 13m0 0l-1.5 6h13" />
  </svg>
);
const ProductsIcon = () => (
  <svg fill="none" stroke="currentColor" viewBox="0 0 24 24">
    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M20 7l-8-4-8 4m16 0l-8 4m8-4v10l-8 4m0-10L4 7m8 4v10M4 7v10l8 4" />
  </svg>
);
const TeamIcon = () => (
  <svg fill="none" stroke="currentColor" viewBox="0 0 24 24">
    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M17 20h5v-2a4 4 0 00-5-3.87M9 20H4v-2a4 4 0 015-3.87m8-4a4 4 0 11-8 0 4 4 0 018 0zm6 4a2 2 0 11-4 0 2 2 0 014 0zM5 16a2 2 0 11-4 0 2 2 0 014 0z" />
  </svg>
);
const ReportsIcon = () => (
  <svg fill="none" stroke="currentColor" viewBox="0 0 24 24">
    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 19v-6a2 2 0 00-2-2H5a2 2 0 00-2 2v6a2 2 0 002 2h2a2 2 0 002-2zm0 0V9a2 2 0 012-2h2a2 2 0 012 2v10m-6 0a2 2 0 002 2h2a2 2 0 002-2m0 0V5a2 2 0 012-2h2a2 2 0 012 2v14a2 2 0 01-2 2h-2a2 2 0 01-2-2z" />
  </svg>
);
const CustomersIcon = () => (
  <svg fill="none" stroke="currentColor" viewBox="0 0 24 24">
    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M17 20h5v-2a3 3 0 00-5.356-1.857M17 20H7m10 0v-2c0-.656-.126-1.283-.356-1.857M7 20H2v-2a3 3 0 015.356-1.857M7 20v-2c0-.656.126-1.283.356-1.857m0 0a5.002 5.002 0 019.288 0M15 7a3 3 0 11-6 0 3 3 0 016 0z" />
  </svg>
);
const SettingsIcon = () => (
  <svg fill="none" stroke="currentColor" viewBox="0 0 24 24">
    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M10.325 4.317c.426-1.756 2.924-1.756 3.35 0a1.724 1.724 0 002.573 1.066c1.543-.94 3.31.826 2.37 2.37a1.724 1.724 0 001.065 2.572c1.756.426 1.756 2.924 0 3.35a1.724 1.724 0 00-1.066 2.573c.94 1.543-.826 3.31-2.37 2.37a1.724 1.724 0 00-2.572 1.065c-.426 1.756-2.924 1.756-3.35 0a1.724 1.724 0 00-2.573-1.066c-1.543.94-3.31-.826-2.37-2.37a1.724 1.724 0 00-1.065-2.572c-1.756-.426-1.756-2.924 0-3.35a1.724 1.724 0 001.066-2.573c-.94-1.543.826-3.31 2.37-2.37.996.608 2.296.07 2.572-1.065z" />
    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M15 12a3 3 0 11-6 0 3 3 0 016 0z" />
  </svg>
);

const InventoryIcon = () => (
  <svg fill="none" stroke="currentColor" viewBox="0 0 24 24">
    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 5H7a2 2 0 00-2 2v12a2 2 0 002 2h10a2 2 0 002-2V7a2 2 0 00-2-2h-2M9 5a2 2 0 002 2h2a2 2 0 002-2M9 5a2 2 0 012-2h2a2 2 0 012 2m-3 7h3m-3 4h3m-6-4h.01M9 16h.01" />
  </svg>
);

const DashboardLayout: React.FC<{ children: React.ReactNode }> = ({ children }) => {
  const dispatch = useAppDispatch();
  const navigate = useNavigate();
  const user = useAppSelector(state => state.auth.user);
  const storeName = useAppSelector(selectStoreName);
  const t = useI18n();
  const [sidebarOpen, setSidebarOpen] = useState(false);

  const userPermissions = user ? ROLE_PERMISSIONS[user.role] || [] : [];

  const navItems = [
    { to: '/dashboard', icon: <DashboardIcon />, label: t.nav.dashboard, permission: 'dashboard' },
    { to: '/pos', icon: <SalesIcon />, label: t.nav.pos, permission: 'pos' },
    { to: '/products', icon: <ProductsIcon />, label: t.nav.products, permission: 'products' },
    { 
      to: '/inventory', 
      icon: <InventoryIcon />, 
      label: t.nav.inventory, 
      permission: 'inventory',
      submenus: [
        { to: '/inventory', label: t.inventory.summary },
        { to: '/inventory?tab=lowstock', label: t.inventory.lowStock },
        { to: '/inventory?tab=reorder', label: t.inventory.reorder },
      ]
    },
    { to: '/customers', icon: <CustomersIcon />, label: t.nav.customers, permission: 'customers' },
    { to: '/employees', icon: <TeamIcon />, label: t.nav.employees, permission: 'employees' },
    { to: '/reports', icon: <ReportsIcon />, label: t.nav.reports, permission: 'reports' },
    { to: '/settings', icon: <SettingsIcon />, label: t.nav.settings, permission: 'settings' },
  ].filter(item => userPermissions.includes(item.permission));

  const openSidebar = () => {
    setSidebarOpen(true);
    document.body.classList.add('overflow-hidden');
  };

  const closeSidebar = () => {
    setSidebarOpen(false);
    document.body.classList.remove('overflow-hidden');
  };

  const handleLogout = () => {
    dispatch(logout());
    navigate('/login');
  };

  return (
    <div className="flex min-h-screen bg-background">
      {sidebarOpen && (
        <div className="fixed inset-0 bg-black/60 z-40 lg:hidden" onClick={closeSidebar} />
      )}

      <aside className={`
        fixed lg:relative inset-y-0 left-0 z-50
        w-[280px] lg:w-[240px] bg-surface border-r border-border
        flex flex-col h-screen
        transform transition-transform duration-200 ease-out
        lg:translate-x-0
        ${sidebarOpen ? 'translate-x-0' : '-translate-x-full'}
      `}>
        <div className="px-5 py-5 border-b border-border flex items-center justify-between">
          <div className="flex items-center gap-2">
            <div className="w-8 h-8 rounded-lg bg-primary flex items-center justify-center flex-shrink-0">
              <svg className="w-4 h-4 text-white" fill="currentColor" viewBox="0 0 24 24">
                <path d="M4 4h6v6H4V4zm10 0h6v6h-6V4zM4 14h6v6H4v-6zm10 3h2v-2h-2v2zm0 3h2v-2h-2v2zm-2-3h2v-2h-2v2zm3-5h2v-2h-2v2zm2 2h2v-2h-2v2zm-2 2h2v-2h-2v2zm-3 0h2v-2h-2v2z" />
              </svg>
            </div>
            <span className="font-bold text-base text-text-primary truncate">{storeName}</span>
          </div>
          <button onClick={closeSidebar} className="lg:hidden p-1 text-text-muted hover:text-text-primary">
            <svg className="w-6 h-6" fill="none" stroke="currentColor" viewBox="0 0 24 24">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M6 18L18 6M6 6l12 12" />
            </svg>
          </button>
        </div>

        <nav className="flex-1 py-4 flex flex-col gap-1 overflow-y-auto">
          {navItems.map(item => (
            <NavItem 
              key={item.to} 
              to={item.to} 
              icon={item.icon} 
              label={item.label} 
              submenus={item.submenus}
            />
          ))}
        </nav>

        <div className="p-4 border-t border-border">
          <button
            onClick={handleLogout}
            className="flex items-center gap-3 px-4 py-2.5 w-full rounded-lg text-sm font-medium text-text-muted hover:text-error hover:bg-error/5"
          >
            <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M17 16l4-4m0 0l-4-4m4 4H7m6 4v1a3 3 0 01-3 3H6a3 3 0 01-3-3V7a3 3 0 013-3h4a3 3 0 013 3v1" />
            </svg>
            <span className="hidden sm:inline">{t.auth.logout}</span>
          </button>
        </div>
      </aside>

      <div className="flex-1 flex flex-col min-w-0">
        <header className="bg-surface border-b border-border px-3 lg:px-6 py-2 lg:py-3 flex items-center gap-2 lg:gap-4 sticky top-0 z-20">
          <button
            onClick={openSidebar}
            className="p-2 rounded-lg hover:bg-background text-text-muted hover:text-text-primary transition-colors flex-shrink-0"
          >
            <svg className="w-6 h-6" fill="none" stroke="currentColor" viewBox="0 0 24 24">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M4 6h16M4 12h16M4 18h16" />
            </svg>
          </button>

          <div className="hidden xs:flex flex-1 relative">
            <svg className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-text-muted" fill="none" stroke="currentColor" viewBox="0 0 24 24">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M21 21l-6-6m2-5a7 7 0 11-14 0 7 7 0 0114 0z" />
            </svg>
            <input
              type="text"
              placeholder="Search..."
              className="w-full max-w-xs pl-10 pr-4 py-2 bg-background border border-border rounded-lg text-sm text-text-primary placeholder-text-muted focus:outline-none focus:ring-2 focus:ring-primary/20 focus:border-primary"
            />
          </div>

          <div className="flex-1" />

          <div className="flex items-center gap-3">
            <button className="p-2 rounded-lg hover:bg-background text-text-muted hover:text-text-primary transition-colors">
              <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M15 17h5l-1.405-1.405A2.032 2.032 0 0118 14.158V11a6.002 6.002 0 00-4-5.659V5a2 2 0 10-4 0v.341C7.67 6.165 6 8.388 6 11v3.159c0 .538-.214 1.055-.595 1.436L4 17h5m6 0v1a3 3 0 11-6 0v1m6 0H9" />
              </svg>
            </button>
            <div className="w-8 h-8 rounded-full bg-primary/10 flex items-center justify-center">
              <span className="text-sm font-medium text-primary">{user?.name?.charAt(0).toUpperCase() || 'U'}</span>
            </div>
          </div>
        </header>

        <main className="flex-1 overflow-auto">
          {children}
        </main>
      </div>
    </div>
  );
};

export default DashboardLayout;