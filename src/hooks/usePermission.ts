import { useAppSelector } from '../app/store';
import { ROLE_PERMISSIONS } from '../types';
import type { Permission } from '../types';

export function usePermission(): {
  hasPermission: (permission: Permission) => boolean;
  hasAnyPermission: (permissions: Permission[]) => boolean;
  hasAllPermissions: (permissions: Permission[]) => boolean;
} {
  const user = useAppSelector(state => state.auth.user);

  const hasPermission = (permission: Permission): boolean => {
    if (!user) return false;
    const perms = ROLE_PERMISSIONS[user.role] || [];
    return perms.includes(permission);
  };

  const hasAnyPermission = (permissions: Permission[]): boolean => {
    return permissions.some(p => hasPermission(p));
  };

  const hasAllPermissions = (permissions: Permission[]): boolean => {
    return permissions.every(p => hasPermission(p));
  };

  return { hasPermission, hasAnyPermission, hasAllPermissions };
}
