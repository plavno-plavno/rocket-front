'use client';

import { useQuery } from '@tanstack/react-query';
import { useTranslations } from 'next-intl';
import { useMemo } from 'react';
import { features } from '@/generated/feature-registry';
import { badgesQueryOptions, useMe } from '@/features/session';
import { useScope } from '@/hooks/use-scope';
import { buildNavGroups, routeTitles } from '../nav';

const SHOW_PLANNED = process.env.NODE_ENV !== 'production';

/** Sidebar + kbar navigation derived from the feature registry, the session and live badges. */
export function useNavGroups() {
  const me = useMe();
  const t = useTranslations();
  const tc = useTranslations('common');
  const [scope] = useScope();
  const { data: badges } = useQuery({ ...badgesQueryOptions(scope), enabled: !!me });
  return useMemo(
    () =>
      buildNavGroups({
        features,
        me,
        t: (key) => t(key as never),
        badges,
        showPlanned: SHOW_PLANNED,
        labels: { comingSoon: tc('comingSoon'), new: tc('new'), beta: tc('beta') }
      }),
    [me, t, tc, badges]
  );
}

export function useRouteTitles() {
  const t = useTranslations();
  return useMemo(() => routeTitles(features, (key) => t(key as never)), [t]);
}
