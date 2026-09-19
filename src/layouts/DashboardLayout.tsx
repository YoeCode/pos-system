import React, { useState, useLayoutEffect } from 'react';
import { NavLink, useNavigate, useLocation } from 'react-router-dom';
import { useAppDispatch, useAppSelector } from '../app/store';
import { logoutUser } from '../features/auth/authSlice';
import { ROLE_PERMISSIONS } from '../types';
import { selectStoreName } from '../features/settings/settingsSlice';
import { selectLowStockCount } from '../features/products/productsSlice';
import { useI18n } from '../i18n/useI18n';
import { useRealtimeStatusIndicator } from '../features/realtime/useRealtimeStatusIndicator';
import { useRealtimeSync } from '../features/realtime/useRealtimeSync';

interface NavItemProps {
  to: string;
  icon: React.ReactNode;
  label: string;
  submenus?: { to: string; label: string }[];
  badge?: number;
}

const NavItem: React.FC<NavItemProps> = ({
  to,
  icon,
  label,
  submenus,
  badge,
}) => {
  const [isOpen, setIsOpen] = useState(false);
  const location = useLocation();
  const isThisActive = location.pathname === to;
  const hasActiveSubmenu = submenus?.some(
    (sub) =>
      location.pathname === sub.to ||
      location.pathname.startsWith(sub.to.split('?')[0]),
  );
  const isActive = isThisActive || hasActiveSubmenu;

  useLayoutEffect(() => {
    setIsOpen(false);
  }, [location.pathname]);

  const handleClick = () => {
    if (submenus && submenus.length > 0) {
      setIsOpen(!isOpen);
    }
  };

  if (submenus && submenus.length > 0) {
    return (
      <div>
        <NavLink
          to={to}
          onClick={handleClick}
          className={`flex items-center justify-between gap-3 w-full px-3 py-2.5 rounded-[10px] text-body-md font-medium transition-all duration-150 ${
            isActive
              ? 'bg-white/10 text-white'
              : 'text-white/60 hover:text-white hover:bg-white/5'
          }`}
        >
          <div className="flex items-center gap-3">
            <span className="w-5 h-5 flex-shrink-0">{icon}</span>
            <span>{label}</span>
          </div>
          <div className="flex items-center gap-2">
            {badge !== undefined && badge > 0 && (
              <span className="bg-error text-white text-label-sm font-bold px-1.5 py-0.5 rounded-full min-w-[20px] text-center">
                {badge}
              </span>
            )}
            <svg
              className={`w-4 h-4 transition-transform ${isOpen ? 'rotate-180' : ''}`}
              fill="none"
              stroke="currentColor"
              viewBox="0 0 24 24"
            >
              <path
                strokeLinecap="round"
                strokeLinejoin="round"
                strokeWidth={2}
                d="M19 9l-7 7-7-7"
              />
            </svg>
          </div>
        </NavLink>
        {isOpen && (
          <div className="ml-8 mt-1 space-y-0.5">
            {submenus.map((submenu) => (
              <NavLink
                key={submenu.to}
                to={submenu.to}
                onClick={() =>
                  document.body.classList.remove('overflow-hidden')
                }
                className={({ isActive }) =>
                  `flex items-center gap-3 px-3 py-2 text-body-md rounded-[10px] transition-all ${
                    isActive
                      ? 'text-white bg-white/10'
                      : 'text-white/50 hover:text-white hover:bg-white/5'
                  }`
                }
              >
                <span>{submenu.label}</span>
              </NavLink>
            ))}
          </div>
        )}
      </div>
    );
  }

  return (
    <NavLink
      to={to}
      onClick={() => document.body.classList.remove('overflow-hidden')}
      className={({ isActive }) =>
        `flex items-center gap-3 px-3 py-2.5 rounded-[10px] text-body-md font-medium transition-all duration-150 ${
          isActive
            ? 'bg-white/10 text-white'
            : 'text-white/60 hover:text-white hover:bg-white/5'
        }`
      }
    >
      <span className="w-5 h-5 flex-shrink-0">{icon}</span>
      <span>{label}</span>
      {badge !== undefined && badge > 0 && (
        <span className="ml-auto bg-error text-white text-label-sm font-bold px-1.5 py-0.5 rounded-full min-w-[20px] text-center">
          {badge}
        </span>
      )}
    </NavLink>
  );
};

// --- Icons (stroke-based, lineal) ---

const DashboardIcon = () => (
  <svg fill="none" stroke="currentColor" viewBox="0 0 24 24">
    <path
      strokeLinecap="round"
      strokeLinejoin="round"
      strokeWidth={1.5}
      d="M3 7h7V3H3v4zm0 10h7v-6H3v6zm11 0h7v-4h-7v4zm0-14v6h7V3h-7z"
    />
  </svg>
);

const SalesIcon = () => (
  <svg fill="none" stroke="currentColor" viewBox="0 0 24 24">
    <path
      strokeLinecap="round"
      strokeLinejoin="round"
      strokeWidth={1.5}
      d="M3 3h2l.4 2M7 13h10l4-8H5.4m0 0L7 13m0 0l-1.5 6h13"
    />
  </svg>
);

const ProductsIcon = () => (
  <svg fill="none" stroke="currentColor" viewBox="0 0 24 24">
    <path
      strokeLinecap="round"
      strokeLinejoin="round"
      strokeWidth={1.5}
      d="M20 7l-8-4-8 4m16 0l-8 4m8-4v10l-8 4m0-10L4 7m8 4v10M4 7v10l8 4"
    />
  </svg>
);

const TeamIcon = () => (
  <svg fill="none" stroke="currentColor" viewBox="0 0 24 24">
    <path
      strokeLinecap="round"
      strokeLinejoin="round"
      strokeWidth={1.5}
      d="M17 20h5v-2a4 4 0 00-5-3.87M9 20H4v-2a4 4 0 015-3.87m8-4a4 4 0 11-8 0 4 4 0 018 0zm6 4a2 2 0 11-4 0 2 2 0 014 0zM5 16a2 2 0 11-4 0 2 2 0 014 0z"
    />
  </svg>
);

const ReportsIcon = () => (
  <svg fill="none" stroke="currentColor" viewBox="0 0 24 24">
    <path
      strokeLinecap="round"
      strokeLinejoin="round"
      strokeWidth={1.5}
      d="M9 19v-6a2 2 0 00-2-2H5a2 2 0 00-2 2v6a2 2 0 002 2h2a2 2 0 002-2zm0 0V9a2 2 0 012-2h2a2 2 0 012 2v10m-6 0a2 2 0 002 2h2a2 2 0 002-2m0 0V5a2 2 0 012-2h2a2 2 0 012 2v14a2 2 0 01-2 2h-2a2 2 0 01-2-2z"
    />
  </svg>
);

const CustomersIcon = () => (
  <svg fill="none" stroke="currentColor" viewBox="0 0 24 24">
    <path
      strokeLinecap="round"
      strokeLinejoin="round"
      strokeWidth={1.5}
      d="M17 20h5v-2a3 3 0 00-5.356-1.857M17 20H7m10 0v-2c0-.656-.126-1.283-.356-1.857M7 20H2v-2a3 3 0 015.356-1.857M7 20v-2c0-.656.126-1.283.356-1.857m0 0a5.002 5.002 0 019.288 0M15 7a3 3 0 11-6 0 3 3 0 016 0z"
    />
  </svg>
);

const SettingsIcon = () => (
  <svg fill="none" stroke="currentColor" viewBox="0 0 24 24">
    <path
      strokeLinecap="round"
      strokeLinejoin="round"
      strokeWidth={1.5}
      d="M10.325 4.317c.426-1.756 2.924-1.756 3.35 0a1.724 1.724 0 002.573 1.066c1.543-.94 3.31.826 2.37 2.37a1.724 1.724 0 001.065 2.572c1.756.426 1.756 2.924 0 3.35a1.724 1.724 0 00-1.066 2.573c.94 1.543-.826 3.31-2.37 2.37a1.724 1.724 0 00-2.572 1.065c-.426 1.756-2.924 1.756-3.35 0a1.724 1.724 0 00-2.573-1.066c-1.543.94-3.31-.826-2.37-2.37a1.724 1.724 0 00-1.065-2.572c-1.756-.426-1.756-2.924 0-3.35a1.724 1.724 0 001.066-2.573c-.94-1.543.826-3.31 2.37-2.37.996.608 2.296.07 2.572-1.065z"
    />
    <path
      strokeLinecap="round"
      strokeLinejoin="round"
      strokeWidth={1.5}
      d="M15 12a3 3 0 11-6 0 3 3 0 016 0z"
    />
  </svg>
);

const InventoryIcon = () => (
  <svg fill="none" stroke="currentColor" viewBox="0 0 24 24">
    <path
      strokeLinecap="round"
      strokeLinejoin="round"
      strokeWidth={1.5}
      d="M9 5H7a2 2 0 00-2 2v12a2 2 0 002 2h10a2 2 0 002-2V7a2 2 0 00-2-2h-2M9 5a2 2 0 002 2h2a2 2 0 002-2M9 5a2 2 0 012-2h2a2 2 0 012 2m-3 7h3m-3 4h3m-6-4h.01M9 16h.01"
    />
  </svg>
);

// --- Bottom nav items ---
const bottomNavItems = [
  { to: '/dashboard', icon: <DashboardIcon />, label: 'Panel' },
  { to: '/pos', icon: <SalesIcon />, label: 'TPV' },
  { to: '/products', icon: <ProductsIcon />, label: 'Productos' },
  { to: '/inventory', icon: <InventoryIcon />, label: 'Inventario' },
];

const DashboardLayout: React.FC<{ children: React.ReactNode }> = ({
  children,
}) => {
  const dispatch = useAppDispatch();
  const navigate = useNavigate();
  const user = useAppSelector((state) => state.auth.user);
  const tenantId = user?.tenantId;
  const tenantRole = user?.tenantRole;
  const storeName = useAppSelector(selectStoreName);
  const t = useI18n();
  const [sidebarOpen, setSidebarOpen] = useState(false);
  const [moreOpen, setMoreOpen] = useState(false);
  const realtimeStatus = useRealtimeStatusIndicator();

  useRealtimeSync();

  const userPermissions = user ? ROLE_PERMISSIONS[user.role] || [] : [];
  const lowStockCount = useAppSelector(selectLowStockCount);

  const navItems = [
    {
      to: '/dashboard',
      icon: <DashboardIcon />,
      label: t.nav.dashboard,
      permission: 'dashboard:view' as const,
    },
    {
      to: '/pos',
      icon: <SalesIcon />,
      label: t.nav.pos,
      permission: 'pos:sale' as const,
    },
    {
      to: '/products',
      icon: <ProductsIcon />,
      label: t.nav.products,
      permission: 'product:view' as const,
    },
    {
      to: '/inventory',
      icon: <InventoryIcon />,
      label: t.nav.inventory,
      permission: 'inventory:view' as const,
      badge: lowStockCount,
      submenus: [
        { to: '/inventory', label: t.inventory.summary },
        { to: '/inventory?tab=lowstock', label: t.inventory.lowStock },
        { to: '/inventory?tab=reorder', label: t.inventory.reorder },
      ],
    },
    {
      to: '/customers',
      icon: <CustomersIcon />,
      label: t.nav.customers,
      permission: 'customer:view' as const,
    },
    {
      to: '/employees',
      icon: <TeamIcon />,
      label: t.nav.employees,
      permission: 'employee:view' as const,
    },
    {
      to: '/reports',
      icon: <ReportsIcon />,
      label: t.nav.reports,
      permission: 'report:view' as const,
    },
    {
      to: '/settings',
      icon: <SettingsIcon />,
      label: t.nav.settings,
      permission: 'setting:view' as const,
    },
  ].filter((item) => userPermissions.includes(item.permission));

  // Items not in bottom nav (shown in "Más" drawer)
  const moreNavItems = navItems.filter(
    (item) => !bottomNavItems.some((b) => b.to === item.to),
  );

  const openSidebar = () => {
    setSidebarOpen(true);
    document.body.classList.add('overflow-hidden');
  };

  const closeSidebar = () => {
    setSidebarOpen(false);
    document.body.classList.remove('overflow-hidden');
  };

  const handleLogout = () => {
    dispatch(logoutUser());
    navigate('/login');
  };

  const syncStatusColors = {
    connected: 'bg-success',
    connecting: 'bg-warning animate-pulse',
    error: 'bg-error',
    disconnected: 'bg-text-muted',
  };

  return (
    <div className="flex h-[100dvh] bg-background overflow-hidden">
      {/* Mobile overlay */}
      {sidebarOpen && (
        <div
          className="fixed inset-0 bg-black/60 z-40 lg:hidden"
          onClick={closeSidebar}
        />
      )}

      {/* "Más" drawer (mobile) */}
      {moreOpen && (
        <div
          className="fixed inset-0 bg-black/60 z-40 lg:hidden"
          onClick={() => setMoreOpen(false)}
        />
      )}
      {moreOpen && (
        <div className="fixed inset-y-0 right-0 z-50 w-[280px] bg-secondary flex flex-col h-[100dvh] transform transition-transform duration-200 ease-out translate-x-0">
          <div className="h-14 px-4 flex items-center justify-between border-b border-white/10">
            <span className="text-headline-sm text-white">Más</span>
            <button
              onClick={() => setMoreOpen(false)}
              className="p-2 text-white/60 hover:text-white rounded-[10px]"
              aria-label="Cerrar"
            >
              <svg
                className="w-6 h-6"
                fill="none"
                stroke="currentColor"
                viewBox="0 0 24 24"
              >
                <path
                  strokeLinecap="round"
                  strokeLinejoin="round"
                  strokeWidth={2}
                  d="M6 18L18 6M6 6l12 12"
                />
              </svg>
            </button>
          </div>
          <nav className="flex-1 py-4 px-3 space-y-1 overflow-y-auto">
            {moreNavItems.map((item) => (
              <NavItem
                key={item.to}
                to={item.to}
                icon={item.icon}
                label={item.label}
                submenus={item.submenus}
                badge={item.badge}
              />
            ))}
          </nav>
          <div className="p-4 border-t border-white/10">
            <button
              onClick={handleLogout}
              className="flex items-center gap-3 px-3 py-2.5 w-full rounded-[10px] text-body-md text-white/60 hover:text-white hover:bg-white/5"
            >
              <svg
                className="w-5 h-5"
                fill="none"
                stroke="currentColor"
                viewBox="0 0 24 24"
              >
                <path
                  strokeLinecap="round"
                  strokeLinejoin="round"
                  strokeWidth={1.5}
                  d="M17 16l4-4m0 0l-4-4m4 4H7m6 4v1a3 3 0 01-3 3H6a3 3 0 01-3-3V7a3 3 0 013-3h4a3 3 0 013 3v1"
                />
              </svg>
              <span>{t.auth.logout}</span>
            </button>
          </div>
        </div>
      )}

      {/* Sidebar — navy */}
      <aside
        className={`fixed lg:relative inset-y-0 left-0 z-50
          w-[260px] lg:w-[240px] bg-secondary
          flex flex-col h-[100dvh] lg:h-screen
          transform transition-transform duration-200 ease-out
          lg:translate-x-0 pt-[env(safe-area-inset-top)]
          ${sidebarOpen ? 'translate-x-0' : '-translate-x-full'}`}
      >
        {/* Logo area */}
        <div className="h-14 px-4 flex items-center justify-between border-b border-white/10">
          <div className="flex items-center gap-2.5 min-w-0">
            <div className="w-8 h-8 rounded-[10px] bg-primary flex items-center justify-center flex-shrink-0">
              <svg
                className="w-4 h-4 text-white"
                fill="currentColor"
                viewBox="0 0 24 24"
              >
                <path d="M4 4h6v6H4V4zm10 0h6v6h-6V4zM4 14h6v6H4v-6zm10 3h2v-2h-2v2zm0 3h2v-2h-2v2zm-2-3h2v-2h-2v2zm3-5h2v-2h-2v2zm2 2h2v-2h-2v2zm-2 2h2v-2h-2v2zm-3 0h2v-2h-2v2z" />
              </svg>
            </div>
            <div className="min-w-0 flex flex-col justify-center">
              <span className="font-bold text-body-md text-white truncate block leading-tight">
                {storeName}
              </span>
              {tenantId && (
                <span className="text-label-sm text-white/40 uppercase tracking-wider truncate block leading-tight">
                  {tenantRole || 'miembro'}
                </span>
              )}
            </div>
          </div>
          <button
            onClick={closeSidebar}
            className="lg:hidden p-2 text-white/60 hover:text-white"
            aria-label="Cerrar menú"
          >
            <svg
              className="w-6 h-6"
              fill="none"
              stroke="currentColor"
              viewBox="0 0 24 24"
            >
              <path
                strokeLinecap="round"
                strokeLinejoin="round"
                strokeWidth={2}
                d="M6 18L18 6M6 6l12 12"
              />
            </svg>
          </button>
        </div>

        {/* Navigation */}
        <nav className="flex-1 py-4 px-3 flex flex-col gap-1 overflow-y-auto overscroll-y-contain min-h-0 scrollbar-none">
          {navItems.map((item) => (
            <NavItem
              key={item.to}
              to={item.to}
              icon={item.icon}
              label={item.label}
              submenus={item.submenus}
              badge={item.badge}
            />
          ))}
        </nav>

        {/* Logout */}
        <div className="p-3 border-t border-white/10">
          <button
            onClick={handleLogout}
            className="flex items-center gap-3 px-3 py-2.5 w-full rounded-[10px] text-body-md text-white/60 hover:text-white hover:bg-white/5 transition-colors"
          >
            <svg
              className="w-5 h-5"
              fill="none"
              stroke="currentColor"
              viewBox="0 0 24 24"
            >
              <path
                strokeLinecap="round"
                strokeLinejoin="round"
                strokeWidth={1.5}
                d="M17 16l4-4m0 0l-4-4m4 4H7m6 4v1a3 3 0 01-3 3H6a3 3 0 01-3-3V7a3 3 0 013-3h4a3 3 0 013 3v1"
              />
            </svg>
            <span>{t.auth.logout}</span>
          </button>
        </div>
      </aside>

      {/* Main area */}
      <div className="flex-1 flex flex-col min-w-0 overflow-hidden">
        {/* Header */}
        <header className="h-14 bg-white sticky top-0 z-20 border-b border-border shadow-card">
          <div className="h-full px-3 lg:px-6 flex items-center gap-3">
            {/* Mobile menu button */}
            <button
              onClick={openSidebar}
              className="h-10 w-10 flex items-center justify-center rounded-[10px] hover:bg-surface-container-low text-text-muted hover:text-text-primary transition-colors flex-shrink-0 lg:hidden"
              aria-label="Abrir menú"
            >
              <svg
                className="w-6 h-6"
                fill="none"
                stroke="currentColor"
                viewBox="0 0 24 24"
              >
                <path
                  strokeLinecap="round"
                  strokeLinejoin="round"
                  strokeWidth={1.5}
                  d="M4 6h16M4 12h16M4 18h16"
                />
              </svg>
            </button>

            {/* Terminal info (desktop) */}
            <div className="hidden md:flex items-center gap-2 text-label-md bg-surface-container-low px-3 py-1.5 rounded-full border border-border">
              <span className="w-2 h-2 rounded-full bg-success" />
              <span className="text-text-muted">Terminal #01</span>
            </div>

            <div className="flex-1" />

            {/* Right actions */}
            <div className="flex items-center gap-2">
              {/* Sync status */}
              <button
                className="h-10 w-10 flex items-center justify-center rounded-[10px] hover:bg-surface-container-low text-text-muted hover:text-text-primary transition-colors"
                title={
                  realtimeStatus === 'connected'
                    ? 'Sincronizado con la nube'
                    : realtimeStatus === 'connecting'
                      ? 'Conectando...'
                      : 'Error de sincronización'
                }
                aria-label="Estado de sincronización"
              >
                <svg
                  className="w-5 h-5"
                  fill="none"
                  stroke="currentColor"
                  viewBox="0 0 24 24"
                >
                  <path
                    strokeLinecap="round"
                    strokeLinejoin="round"
                    strokeWidth={1.5}
                    d="M3 15a4 4 0 004 4h9a5 5 0 10-.1-9.999 5.002 5.002 0 10-9.78 2.096A4.001 4.001 0 003 15z"
                  />
                </svg>
              </button>

              {/* Reload */}
              <button
                onClick={() => window.location.reload()}
                className="h-10 w-10 flex items-center justify-center rounded-[10px] hover:bg-surface-container-low text-text-muted hover:text-text-primary transition-colors"
                title="Recargar página"
                aria-label="Recargar página"
                type="button"
              >
                <svg
                  className="w-5 h-5"
                  fill="none"
                  stroke="currentColor"
                  viewBox="0 0 24 24"
                >
                  <path
                    strokeLinecap="round"
                    strokeLinejoin="round"
                    strokeWidth={1.5}
                    d="M4 4v5h.582m15.356 2A8.001 8.001 0 004.582 9m0 0H9m11 11v-5h-.581m0 0a8.003 8.003 0 01-15.357-2m15.357 2H15"
                  />
                </svg>
              </button>

              {/* Notifications */}
              <button className="h-10 w-10 flex items-center justify-center rounded-[10px] hover:bg-surface-container-low text-text-muted hover:text-text-primary transition-colors">
                <svg
                  className="w-5 h-5"
                  fill="none"
                  stroke="currentColor"
                  viewBox="0 0 24 24"
                >
                  <path
                    strokeLinecap="round"
                    strokeLinejoin="round"
                    strokeWidth={1.5}
                    d="M15 17h5l-1.405-1.405A2.032 2.032 0 0118 14.158V11a6.002 6.002 0 00-4-5.659V5a2 2 0 10-4 0v.341C7.67 6.165 6 8.388 6 11v3.159c0 .538-.214 1.055-.595 1.436L4 17h5m6 0v1a3 3 0 11-6 0v1m6 0H9"
                  />
                </svg>
              </button>

              {/* User avatar */}
              <div className="relative ml-1">
                <div className="w-9 h-9 rounded-full bg-primary/10 flex items-center justify-center">
                  <span className="text-label-lg font-semibold text-primary">
                    {user?.name?.charAt(0).toUpperCase() || 'U'}
                  </span>
                </div>
                <span
                  className={`absolute -bottom-0.5 -right-0.5 w-2.5 h-2.5 rounded-full border-2 border-white ${syncStatusColors[realtimeStatus]}`}
                />
              </div>
            </div>
          </div>
        </header>

        {/* Skip link */}
        <a
          href="#main-content"
          className="sr-only focus:not-sr-only focus:absolute focus:top-4 focus:left-4 focus:z-50 focus:px-4 focus:py-2 focus:bg-primary focus:text-white focus:rounded-[10px] focus:font-semibold"
        >
          Skip to content
        </a>

        {/* Main content */}
        <main
          id="main-content"
          className="flex-1 overflow-y-auto overscroll-y-contain pb-20 lg:pb-0"
          tabIndex={-1}
        >
          {children}
        </main>
      </div>

      {/* Bottom nav (mobile/tablet) */}
      <nav className="fixed bottom-0 left-0 w-full z-30 flex justify-around items-center px-2 py-1 h-16 lg:hidden bg-white border-t border-border shadow-card">
        {bottomNavItems.map((item) => (
          <NavLink
            key={item.to}
            to={item.to}
            className={({ isActive }) =>
              `flex flex-col items-center justify-center rounded-[10px] py-1 px-3 min-h-[48px] transition-colors ${
                isActive
                  ? 'text-primary'
                  : 'text-text-muted hover:text-text-primary'
              }`
            }
          >
            <span className="w-5 h-5">{item.icon}</span>
            <span className="text-label-sm mt-0.5">{item.label}</span>
          </NavLink>
        ))}
        <button
          onClick={() => setMoreOpen(true)}
          className="flex flex-col items-center justify-center rounded-[10px] py-1 px-3 min-h-[48px] text-text-muted hover:text-text-primary transition-colors"
        >
          <svg
            className="w-5 h-5"
            fill="none"
            stroke="currentColor"
            viewBox="0 0 24 24"
          >
            <path
              strokeLinecap="round"
              strokeLinejoin="round"
              strokeWidth={1.5}
              d="M4 6h16M4 12h16M4 18h16"
            />
          </svg>
          <span className="text-label-sm mt-0.5">Más</span>
        </button>
      </nav>
    </div>
  );
};

export default DashboardLayout;
