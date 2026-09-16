import type { Schema } from '@lp/contracts';
import type { Icons } from '@/components/icons';
import type { NavGroupId } from '@/config/nav-groups';
import type { TrackId } from '@/config/tracks';
import type { PermissionCheck } from '@/types';

export type FeatureStatus = 'planned' | 'wip' | 'ready';
export type IconKey = keyof typeof Icons;
export type BadgeKey = keyof Schema<'Badges'>;

export interface FeatureNavChild {
  /** i18n key, e.g. `reviews.nav.templates` */
  titleKey: string;
  url: string;
  access?: PermissionCheck;
  badge?: BadgeKey;
  /** Static label chip: `new` / `beta` (i18n `common.new` / `common.beta`). */
  label?: 'new' | 'beta';
  /** Hide from the sidebar (still registered for breadcrumbs / kbar). */
  hidden?: boolean;
}

export interface FeatureNavItem extends FeatureNavChild {
  group: NavGroupId;
  /** Sort order inside the group. */
  order: number;
  icon: IconKey;
  /** kbar shortcut sequence, e.g. `['d', 'l']`. Must be unique across features. */
  shortcut?: [string, string];
  children?: FeatureNavChild[];
}

export interface FeatureKbarAction {
  /** Globally unique, prefixed with the feature id: `reviews.open-by-id`. */
  id: string;
  titleKey: string;
  /** i18n key of the section title (defaults to the feature's first nav item). */
  section?: string;
  kind: 'navigate' | 'dialog';
  /** For `navigate`. */
  url?: string;
  shortcut?: string[];
  keywords?: string;
  access?: PermissionCheck;
}

export interface FeatureDefinition {
  /** = i18n namespace, query-key prefix, folder name. */
  id: string;
  track: TrackId;
  status: FeatureStatus;
  /** Screen ids from SDD-01 §8–9 this feature implements (documentation only). */
  screens?: string[];
  nav?: FeatureNavItem[];
  kbar?: FeatureKbarAction[];
  /** Route prefixes owned by the feature (used for breadcrumbs and `check:templates`). */
  routes?: string[];
}

/**
 * Declares a feature for the generated registries (SDD-01T §3.1). Identity function with types —
 * validation happens in `scripts/gen/validate.ts` (`pnpm gen --check`).
 */
export function defineFeature<const T extends FeatureDefinition>(definition: T): T {
  return definition;
}
