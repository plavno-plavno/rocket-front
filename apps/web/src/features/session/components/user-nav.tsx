'use client';

import { useMutation, useQueryClient } from '@tanstack/react-query';
import { useTranslations } from 'next-intl';
import { useTheme } from 'next-themes';
import { useRouter } from 'next/navigation';
import { Icons } from '@/components/icons';
import { Avatar, AvatarFallback, AvatarImage } from '@/components/ui/avatar';
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuGroup,
  DropdownMenuItem,
  DropdownMenuLabel,
  DropdownMenuSeparator,
  DropdownMenuSub,
  DropdownMenuSubContent,
  DropdownMenuSubTrigger,
  DropdownMenuTrigger
} from '@/components/ui/dropdown-menu';
import {
  SidebarMenu,
  SidebarMenuButton,
  SidebarMenuItem,
  useSidebar
} from '@/components/ui/sidebar';
import { signOutMutation } from '../api/mutations';
import { useMe } from '../hooks/use-me';
import { LanguageSwitcher } from './language-switcher';

function initialsOf(name: string) {
  return name
    .split(/\s+/)
    .slice(0, 2)
    .map((w) => w[0]?.toUpperCase() ?? '')
    .join('');
}

/** Sidebar footer: profile, language, theme, sign out (SDD-01 §2.2 "User nav"). */
export function UserNav() {
  const me = useMe();
  const t = useTranslations('layout');
  const router = useRouter();
  const queryClient = useQueryClient();
  const { isMobile } = useSidebar();
  const { setTheme, theme } = useTheme();
  const signOut = useMutation(signOutMutation(queryClient));

  const avatar = (
    <Avatar className='size-8 rounded-lg'>
      {me.user.avatar_url && <AvatarImage src={me.user.avatar_url} alt={me.user.name} />}
      <AvatarFallback className='rounded-lg text-xs'>{initialsOf(me.user.name)}</AvatarFallback>
    </Avatar>
  );

  return (
    <SidebarMenu>
      <SidebarMenuItem>
        <DropdownMenu>
          <DropdownMenuTrigger
            render={
              <SidebarMenuButton
                size='lg'
                className='data-popup-open:bg-sidebar-accent data-popup-open:text-sidebar-accent-foreground'
                aria-label={t('userMenu')}
              />
            }
          >
            {avatar}
            <div className='grid flex-1 text-left text-sm leading-tight'>
              <span className='truncate font-semibold'>{me.user.name}</span>
              <span className='truncate text-xs'>{me.user.email}</span>
            </div>
            <Icons.chevronsUpDown className='ml-auto size-4' />
          </DropdownMenuTrigger>
          <DropdownMenuContent
            className='w-(--anchor-width) min-w-56 rounded-lg'
            side={isMobile ? 'bottom' : 'right'}
            align='end'
            sideOffset={4}
          >
            <DropdownMenuGroup>
              <DropdownMenuLabel className='p-0 font-normal'>
                <div className='flex items-center gap-2 px-1 py-1.5 text-left text-sm'>
                  {avatar}
                  <div className='grid flex-1 text-left text-sm leading-tight'>
                    <span className='truncate font-semibold'>{me.user.name}</span>
                    <span className='truncate text-xs'>{me.user.email}</span>
                  </div>
                </div>
              </DropdownMenuLabel>
            </DropdownMenuGroup>
            <DropdownMenuSeparator />
            <DropdownMenuGroup>
              <DropdownMenuItem onClick={() => router.push('/dashboard/settings/profile')}>
                <Icons.account className='size-4' />
                {t('profile')}
              </DropdownMenuItem>
              <DropdownMenuItem onClick={() => router.push('/dashboard/notifications')}>
                <Icons.notification className='size-4' />
                {t('notifications')}
              </DropdownMenuItem>
            </DropdownMenuGroup>
            <DropdownMenuSeparator />
            <DropdownMenuGroup>
              <DropdownMenuSub>
                <DropdownMenuSubTrigger>
                  <Icons.globe className='size-4' />
                  {t('language')}
                </DropdownMenuSubTrigger>
                <DropdownMenuSubContent>
                  <LanguageSwitcher variant='menu-items' />
                </DropdownMenuSubContent>
              </DropdownMenuSub>
              <DropdownMenuSub>
                <DropdownMenuSubTrigger>
                  <Icons.brightness className='size-4' />
                  {t('toggleTheme')}
                </DropdownMenuSubTrigger>
                <DropdownMenuSubContent>
                  {(['light', 'dark', 'system'] as const).map((mode) => (
                    <DropdownMenuItem key={mode} onClick={() => setTheme(mode)}>
                      {mode === 'light' ? (
                        <Icons.sun className='size-4' />
                      ) : mode === 'dark' ? (
                        <Icons.moon className='size-4' />
                      ) : (
                        <Icons.laptop className='size-4' />
                      )}
                      {t(mode)}
                      {theme === mode && <Icons.check className='ml-auto size-4' />}
                    </DropdownMenuItem>
                  ))}
                </DropdownMenuSubContent>
              </DropdownMenuSub>
            </DropdownMenuGroup>
            <DropdownMenuSeparator />
            <DropdownMenuItem
              disabled={signOut.isPending}
              onClick={() =>
                signOut.mutate(undefined, { onSuccess: () => router.replace('/auth/sign-in') })
              }
            >
              <Icons.logout className='size-4' />
              {t('signOut')}
            </DropdownMenuItem>
          </DropdownMenuContent>
        </DropdownMenu>
      </SidebarMenuItem>
    </SidebarMenu>
  );
}
