import type { Schema } from '@lp/contracts';
import type { PermissionCheck } from '@/types';

type Me = Schema<'Me'>;

/**
 * Evaluates a `PermissionCheck` against the session context. Pure and shared by
 * `useFilteredNavGroups` (client) and `requireAccess` (server). UX only (SDD-01 §11.5).
 */
export function checkAccess(me: Me | null | undefined, check?: PermissionCheck): boolean {
  if (!check) return true;
  if (!me) return false;
  if (check.requireTenant && !me.tenant) return false;
  if (check.permission && !me.permissions.includes(check.permission)) return false;
  if (check.role) {
    const roles = Array.isArray(check.role) ? check.role : [check.role];
    if (!roles.includes(me.role)) return false;
  }
  if (check.feature && !me.tenant.plan.features.includes(check.feature)) return false;
  return true;
}

export function can(me: Me | null | undefined, action: Schema<'Action'>): boolean {
  return !!me && me.permissions.includes(action);
}

export function hasFeature(me: Me | null | undefined, feature: Schema<'PlanFeature'>): boolean {
  return !!me && me.tenant.plan.features.includes(feature);
}
