import type { Schema } from '@lp/contracts';
import { Icons } from '@/components/icons';

export type Role = Schema<'Role'>;
export type Action = Schema<'Action'>;
export type PlanFeature = Schema<'PlanFeature'>;

/**
 * Access check for navigation items and pages (SDD-01 §2.2). All present conditions must hold.
 * UX only — core-api enforces authorization.
 */
export interface PermissionCheck {
  /** Requires an active tenant (always true for a signed-in user; kept for parity with the starter). */
  requireTenant?: boolean;
  /** Requires a permission action from `Me.permissions`. */
  permission?: Action;
  /** Requires one of the roles. */
  role?: Role | Role[];
  /** Requires a plan feature from `Me.tenant.plan.features`. */
  feature?: PlanFeature;
}

export interface NavItem {
  title: string;
  url: string;
  disabled?: boolean;
  external?: boolean;
  shortcut?: [string, string];
  icon?: keyof typeof Icons;
  label?: string;
  description?: string;
  isActive?: boolean;
  items?: NavItem[];
  access?: PermissionCheck;
}

export interface NavGroup {
  label: string;
  items: NavItem[];
}

export interface NavItemWithChildren extends NavItem {
  items: NavItemWithChildren[];
}

export interface NavItemWithOptionalChildren extends NavItem {
  items?: NavItemWithChildren[];
}

export type MainNavItem = NavItemWithOptionalChildren;

export type SidebarNavItem = NavItemWithChildren;
