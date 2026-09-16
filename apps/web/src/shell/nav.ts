import type { Schema } from '@lp/contracts';
import { NAV_GROUPS } from '@/config/nav-groups';
import { checkAccess } from '@/lib/permissions';
import type { NavGroup, NavItem } from '@/types';
import type { FeatureDefinition, FeatureNavChild } from './feature';

type Me = Schema<'Me'>;
type Badges = Schema<'Badges'>;

export interface BuildNavOptions {
  features: readonly FeatureDefinition[];
  me: Me | null | undefined;
  /** Resolves i18n keys (`t(key)` of the root namespace). */
  t: (key: string) => string;
  badges?: Partial<Badges>;
  /** `planned` features are hidden in production and shown with a "Soon" label otherwise. */
  showPlanned: boolean;
  labels: { comingSoon: string; new: string; beta: string };
}

/**
 * Builds sidebar groups from the feature registry (SDD-01T §3.1): filters by access, sorts by
 * `order`, resolves titles and dynamic badges. Pure so it can be unit-tested and reused by kbar.
 */
export function buildNavGroups({
  features,
  me,
  t,
  badges,
  showPlanned,
  labels
}: BuildNavOptions): NavGroup[] {
  const groups = NAV_GROUPS.toSorted((a, b) => a.order - b.order);
  const allowed = (check?: NavItem['access']) => checkAccess(me, check);

  const toChild = (feature: FeatureDefinition, child: FeatureNavChild): NavItem | null => {
    if (child.hidden || !allowed(child.access)) return null;
    return {
      title: t(child.titleKey),
      url: child.url,
      label: labelFor(feature, child, badges, labels),
      disabled: feature.status === 'planned'
    };
  };

  return groups
    .map((group) => {
      const items = features
        .flatMap((feature) =>
          (feature.nav ?? [])
            .filter((item) => item.group === group.id)
            .map((item) => ({ feature, item }))
        )
        .filter(
          ({ feature, item }) =>
            (feature.status !== 'planned' || showPlanned) && !item.hidden && allowed(item.access)
        )
        .toSorted((a, b) => a.item.order - b.item.order)
        .map(({ feature, item }): NavItem => {
          const children = (item.children ?? [])
            .map((c) => toChild(feature, c))
            .filter((c): c is NavItem => !!c);
          return {
            title: t(item.titleKey),
            url: item.url,
            icon: item.icon,
            shortcut: item.shortcut,
            label: labelFor(feature, item, badges, labels),
            disabled: feature.status === 'planned',
            items: children
          };
        });
      return { label: t(group.titleKey), items } satisfies NavGroup;
    })
    .filter((g) => g.items.length > 0);
}

function labelFor(
  feature: FeatureDefinition,
  item: FeatureNavChild,
  badges: Partial<Badges> | undefined,
  labels: BuildNavOptions['labels']
): string | undefined {
  if (feature.status === 'planned') return labels.comingSoon;
  if (item.badge && badges?.[item.badge]) return String(badges[item.badge]);
  if (item.label === 'new') return labels.new;
  if (item.label === 'beta') return labels.beta;
  return undefined;
}

/** Flat list of every registered route with its title — breadcrumbs and route→feature lookups. */
export function routeTitles(
  features: readonly FeatureDefinition[],
  t: (key: string) => string
): Map<string, string> {
  const out = new Map<string, string>();
  for (const f of features) {
    for (const item of f.nav ?? []) {
      out.set(item.url, t(item.titleKey));
      for (const c of item.children ?? []) out.set(c.url, t(c.titleKey));
    }
  }
  return out;
}
