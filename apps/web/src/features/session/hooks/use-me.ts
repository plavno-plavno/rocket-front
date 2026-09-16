'use client';

import { useSuspenseQuery } from '@tanstack/react-query';
import type { Schema } from '@lp/contracts';
import { can, checkAccess, hasFeature } from '@/lib/permissions';
import type { PermissionCheck } from '@/types';
import { meQueryOptions } from '../api/queries';

/** Session context (user, tenant, role, permissions). Suspends until `/me` is loaded. */
export function useMe() {
  const { data } = useSuspenseQuery(meQueryOptions());
  return data;
}

export function useCan(action: Schema<'Action'>): boolean {
  return can(useMe(), action);
}

export function useHasFeature(feature: Schema<'PlanFeature'>): boolean {
  return hasFeature(useMe(), feature);
}

export function useAccess(check?: PermissionCheck): boolean {
  return checkAccess(useMe(), check);
}
