'use client';

import type { NavItem, NavGroup } from '@/types';
import { checkAccess } from '@/lib/permissions';
import { useMe } from '@/features/session/hooks/use-me';

/**
 * Filters navigation by the session context (role, permissions, plan features) — SDD-01 §2.2.
 * Items whose children are all hidden disappear too.
 */
export function useFilteredNavItems(items: NavItem[]): NavItem[] {
  const me = useMe();
  return filterItems(items, (check) => checkAccess(me, check));
}

export function useFilteredNavGroups(groups: NavGroup[]): NavGroup[] {
  const me = useMe();
  return groups
    .map((group) => ({
      ...group,
      items: filterItems(group.items, (check) => checkAccess(me, check))
    }))
    .filter((group) => group.items.length > 0);
}

function filterItems(items: NavItem[], allowed: (check?: NavItem['access']) => boolean): NavItem[] {
  return items.flatMap((item) => {
    if (!allowed(item.access)) return [];
    if (item.items?.length) {
      const children = filterItems(item.items, allowed);
      if (children.length === 0) return [];
      return [{ ...item, items: children }];
    }
    return [item];
  });
}
