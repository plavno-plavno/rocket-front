'use client';

import { useTranslations } from 'next-intl';
import Link from 'next/link';
import { usePathname } from 'next/navigation';
import { Icons, type IconKey } from '@/components/icons';
import { useAccess } from '@/features/session';
import { cn } from '@/lib/utils';
import type { PermissionCheck } from '@/types';

interface Item {
  key: 'profile' | 'users' | 'accounts' | 'notifications' | 'integrations' | 'sources';
  url: string;
  icon: IconKey;
  access?: PermissionCheck;
}

/** Mirrors the `settings` nav group of the registry (users / settings / notifications features). */
const ITEMS: Item[] = [
  { key: 'profile', url: '/dashboard/settings/profile', icon: 'account' },
  {
    key: 'users',
    url: '/dashboard/settings/users',
    icon: 'teams',
    access: { permission: 'users.manage' }
  },
  {
    key: 'accounts',
    url: '/dashboard/settings/accounts',
    icon: 'sources',
    access: { permission: 'accounts.manage' }
  },
  { key: 'notifications', url: '/dashboard/settings/notifications', icon: 'notification' },
  {
    key: 'integrations',
    url: '/dashboard/settings/integrations',
    icon: 'integrations',
    access: { permission: 'integrations.manage' }
  },
  {
    key: 'sources',
    url: '/dashboard/settings/sources',
    icon: 'settings',
    access: { permission: 'accounts.manage' }
  }
];

function NavLink({ item }: { item: Item }) {
  const t = useTranslations('settings.nav');
  const pathname = usePathname();
  const allowed = useAccess(item.access);
  if (!allowed) return null;
  const Icon = Icons[item.icon];
  const active = pathname === item.url || pathname.startsWith(`${item.url}/`);
  return (
    <li className='shrink-0'>
      <Link
        href={item.url}
        aria-current={active ? 'page' : undefined}
        className={cn(
          'hover:bg-accent hover:text-accent-foreground flex items-center gap-2 rounded-md px-3 py-2 text-sm whitespace-nowrap',
          active ? 'bg-accent font-medium' : 'text-muted-foreground'
        )}
      >
        <Icon className='size-4' />
        {t(item.key)}
      </Link>
    </li>
  );
}

/** Nested settings navigation for the `SettingsPage` template (`nav` slot). */
export function SettingsNav() {
  const t = useTranslations('settings.nav');
  return (
    <ul
      className='flex flex-row gap-1 overflow-x-auto [scrollbar-width:none] lg:flex-col [&::-webkit-scrollbar]:hidden'
      aria-label={t('label')}
      data-testid='settings-nav'
    >
      {ITEMS.map((item) => (
        <NavLink key={item.key} item={item} />
      ))}
    </ul>
  );
}
