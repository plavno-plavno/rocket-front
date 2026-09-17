'use client';
import { Collapsible, CollapsibleContent, CollapsibleTrigger } from '@/components/ui/collapsible';
import {
  Sidebar,
  SidebarContent,
  SidebarFooter,
  SidebarGroup,
  SidebarGroupLabel,
  SidebarHeader,
  SidebarMenu,
  SidebarMenuBadge,
  SidebarMenuButton,
  SidebarMenuItem,
  SidebarMenuSub,
  SidebarMenuSubButton,
  SidebarMenuSubItem,
  SidebarRail
} from '@/components/ui/sidebar';
import { useNavGroups } from '@/shell/hooks/use-nav-groups';
import { TenantSwitcher, UserNav } from '@/features/session';
import Link from 'next/link';
import { usePathname } from 'next/navigation';
import { Icons } from '@/components/icons';
import { useTranslations } from 'next-intl';
import { useEffect, useState } from 'react';
import type { NavItem } from '@/types';

function isActivePath(pathname: string, url: string) {
  return pathname === url || (url !== '/dashboard' && pathname.startsWith(`${url}/`));
}

/** Counters («988», «9+») get a soft pill, static labels («Новое», «Бета») a filled accent pill. */
function badgeKind(label: string | number): 'count' | 'label' {
  return /^\d+\+?$/.test(String(label)) ? 'count' : 'label';
}

/**
 * Expandable nav group. Controlled on purpose: the nav is rebuilt when the badges query resolves,
 * so an uncontrolled `defaultOpen` would change after mount (Base UI logs a warning). The group
 * opens itself when the route points inside it, and the user can still collapse it.
 */
function CollapsibleNavItem({ item, pathname }: { item: NavItem; pathname: string }) {
  const Icon = item.icon ? Icons[item.icon] : Icons.logo;
  const shouldOpen =
    !!item.isActive || (item.items?.some((sub) => isActivePath(pathname, sub.url)) ?? false);
  const [open, setOpen] = useState(shouldOpen);
  useEffect(() => {
    if (shouldOpen) setOpen(true);
  }, [shouldOpen]);

  return (
    <Collapsible open={open} onOpenChange={setOpen} render={<SidebarMenuItem />}>
      <CollapsibleTrigger
        render={
          <SidebarMenuButton
            tooltip={item.title}
            isActive={isActivePath(pathname, item.url)}
            className='group/collapsible'
          />
        }
      >
        {item.icon && <Icon />}
        <span>{item.title}</span>
        <Icons.chevronRight className='ml-auto transition-transform duration-200 group-data-panel-open/collapsible:rotate-90' />
      </CollapsibleTrigger>
      <CollapsibleContent>
        <SidebarMenuSub>
          {item.items?.map((subItem) => (
            <SidebarMenuSubItem key={subItem.url}>
              <SidebarMenuSubButton
                render={<Link href={subItem.url} aria-label={subItem.title} />}
                isActive={isActivePath(pathname, subItem.url)}
              >
                <span>{subItem.title}</span>
                {subItem.label && (
                  <SidebarMenuBadge data-kind={badgeKind(subItem.label)}>
                    {subItem.label}
                  </SidebarMenuBadge>
                )}
              </SidebarMenuSubButton>
            </SidebarMenuSubItem>
          ))}
        </SidebarMenuSub>
      </CollapsibleContent>
    </Collapsible>
  );
}

export default function AppSidebar() {
  const pathname = usePathname();
  const t = useTranslations('app');
  const filteredGroups = useNavGroups();

  return (
    <Sidebar collapsible='icon' className='lp-sidebar'>
      <SidebarHeader>
        <Link
          href='/dashboard/overview'
          className='lp-brand flex items-center gap-2.5 px-2 py-3'
          aria-label={t('name')}
        >
          <span className='bg-primary text-primary-foreground flex size-9 shrink-0 items-center justify-center rounded-xl'>
            <Icons.mapPin className='size-6' />
          </span>
          <span className='truncate text-lg font-bold tracking-tight group-data-[collapsible=icon]:hidden'>
            {t('name')}
            <span className='text-primary'>.</span>
          </span>
        </Link>
        <TenantSwitcher />
      </SidebarHeader>
      <SidebarContent className='overflow-x-hidden'>
        {filteredGroups.map((group) => (
          <SidebarGroup key={group.label || 'ungrouped'} className='py-0'>
            {group.label && <SidebarGroupLabel>{group.label}</SidebarGroupLabel>}
            <SidebarMenu>
              {group.items.map((item) => {
                const Icon = item.icon ? Icons[item.icon] : Icons.logo;
                return item?.items && item?.items?.length > 0 ? (
                  <CollapsibleNavItem key={item.title} item={item} pathname={pathname} />
                ) : (
                  <SidebarMenuItem key={item.url}>
                    <SidebarMenuButton
                      render={<Link href={item.url} aria-label={item.title} />}
                      tooltip={item.title}
                      isActive={isActivePath(pathname, item.url)}
                    >
                      <Icon />
                      <span>{item.title}</span>
                    </SidebarMenuButton>
                    {item.label && (
                      <SidebarMenuBadge data-kind={badgeKind(item.label)}>
                        {item.label}
                      </SidebarMenuBadge>
                    )}
                  </SidebarMenuItem>
                );
              })}
            </SidebarMenu>
          </SidebarGroup>
        ))}
      </SidebarContent>
      <SidebarFooter>
        <UserNav />
      </SidebarFooter>
      <SidebarRail />
    </Sidebar>
  );
}
