'use client';

import { useMutation, useQueryClient } from '@tanstack/react-query';
import { useTranslations } from 'next-intl';
import { useRouter } from 'next/navigation';
import { Icons } from '@/components/icons';
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuGroup,
  DropdownMenuItem,
  DropdownMenuLabel,
  DropdownMenuSeparator,
  DropdownMenuTrigger
} from '@/components/ui/dropdown-menu';
import {
  SidebarMenu,
  SidebarMenuButton,
  SidebarMenuItem,
  useSidebar
} from '@/components/ui/sidebar';
import { switchTenantMutation } from '../api/mutations';
import { useMe } from '../hooks/use-me';

/** Sidebar header: current tenant + switch between memberships (SDD-01 §2.2). */
export function TenantSwitcher() {
  const me = useMe();
  const t = useTranslations('layout');
  const tr = useTranslations('roles');
  const router = useRouter();
  const queryClient = useQueryClient();
  const { isMobile } = useSidebar();
  const switchTenant = useMutation(switchTenantMutation(queryClient));

  const initials = me.tenant.name
    .split(/\s+/)
    .slice(0, 2)
    .map((w) => w[0]?.toUpperCase())
    .join('');

  return (
    <SidebarMenu>
      <SidebarMenuItem>
        <DropdownMenu>
          <DropdownMenuTrigger
            render={
              <SidebarMenuButton
                size='lg'
                className='data-popup-open:bg-sidebar-accent data-popup-open:text-sidebar-accent-foreground'
                aria-label={t('switchTenant')}
              />
            }
          >
            <div className='bg-sidebar-primary text-sidebar-primary-foreground flex aspect-square size-8 items-center justify-center rounded-lg text-xs font-semibold'>
              {initials}
            </div>
            <div className='grid flex-1 text-left text-sm leading-tight'>
              <span className='truncate font-semibold'>{me.tenant.name}</span>
              <span className='truncate text-xs'>{tr(me.role)}</span>
            </div>
            <Icons.chevronsUpDown className='ml-auto' />
          </DropdownMenuTrigger>
          <DropdownMenuContent
            className='w-(--anchor-width) min-w-56 rounded-lg'
            align='start'
            side={isMobile ? 'bottom' : 'right'}
            sideOffset={4}
          >
            <DropdownMenuGroup>
              <DropdownMenuLabel className='text-muted-foreground text-xs'>
                {t('switchTenant')}
              </DropdownMenuLabel>
            </DropdownMenuGroup>
            {me.tenants.map((tenant) => (
              <DropdownMenuItem
                key={tenant.id}
                disabled={switchTenant.isPending}
                onClick={() => {
                  if (tenant.id === me.tenant.id) return;
                  switchTenant.mutate(tenant.id, { onSuccess: () => router.refresh() });
                }}
              >
                <div className='flex size-6 items-center justify-center rounded-sm border text-[10px] font-semibold'>
                  {tenant.name[0]}
                </div>
                <div className='grid flex-1'>
                  <span className='truncate'>{tenant.name}</span>
                  <span className='text-muted-foreground truncate text-xs'>{tr(tenant.role)}</span>
                </div>
                {tenant.id === me.tenant.id && <Icons.check className='ml-auto size-4' />}
              </DropdownMenuItem>
            ))}
            <DropdownMenuSeparator />
            {/* The plan is information, not an action: a disabled item with a gear read as a broken
                «Settings». Base UI requires a label to sit inside a group. */}
            <DropdownMenuGroup>
              <DropdownMenuLabel className='text-muted-foreground flex items-center justify-between gap-2 text-xs font-normal'>
                {t('plan')}
                <span className='text-foreground font-medium'>{me.tenant.plan.name}</span>
              </DropdownMenuLabel>
            </DropdownMenuGroup>
          </DropdownMenuContent>
        </DropdownMenu>
      </SidebarMenuItem>
    </SidebarMenu>
  );
}
