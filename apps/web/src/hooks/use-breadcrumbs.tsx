'use client';

import { useTranslations } from 'next-intl';
import { usePathname } from 'next/navigation';
import { useMemo } from 'react';
import { useRouteTitles } from '@/shell/hooks/use-nav-groups';

type BreadcrumbItem = {
  title: string;
  link: string;
};

/**
 * Breadcrumbs from the feature registry: every path prefix that matches a registered route gets
 * its i18n title; unknown segments (ids, sub-pages) fall back to the raw segment.
 */
export function useBreadcrumbs(): BreadcrumbItem[] {
  const pathname = usePathname();
  const titles = useRouteTitles();
  const t = useTranslations('layout');

  return useMemo(() => {
    const segments = pathname.split('/').filter(Boolean);
    const crumbs: BreadcrumbItem[] = [];
    for (let i = 0; i < segments.length; i++) {
      const path = `/${segments.slice(0, i + 1).join('/')}`;
      if (path === '/dashboard') {
        crumbs.push({ title: t('home'), link: '/dashboard/overview' });
        continue;
      }
      const known = titles.get(path);
      if (known) crumbs.push({ title: known, link: path });
      else if (i === segments.length - 1)
        crumbs.push({ title: decodeURIComponent(segments[i]), link: path });
    }
    return crumbs;
  }, [pathname, titles, t]);
}
