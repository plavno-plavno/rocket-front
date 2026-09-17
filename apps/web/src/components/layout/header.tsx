import React from 'react';
import { SidebarTrigger } from '../ui/sidebar';
import { Separator } from '../ui/separator';
import { Breadcrumbs } from '../breadcrumbs';
import SearchInput from '../search-input';
import { ThemeModeToggle } from '../themes/theme-mode-toggle';
import { NotificationBell } from '@/features/notifications';
import { ScopeSelector } from '@/shell/components/scope-selector';
import { HelpButton } from './help-button';

/** Dashboard header (SDD-01 §7.1): sidebar trigger, breadcrumbs, global scope, ⌘K, help, theme, notifications. */
export default function Header() {
  return (
    <header className='lp-topbar bg-background/90 sticky top-0 z-20 flex h-18 shrink-0 items-center justify-between gap-2 border-b border-border/60 backdrop-blur-xl'>
      <div className='flex min-w-0 items-center gap-2 px-4'>
        <SidebarTrigger className='-ml-1' />
        <Separator orientation='vertical' className='mr-2 h-4 data-vertical:self-center' />
        <Breadcrumbs />
      </div>

      <div className='flex items-center gap-2 px-4'>
        <ScopeSelector className='hidden sm:flex' />
        <div className='hidden xl:flex'>
          <SearchInput />
        </div>
        <HelpButton />
        <ThemeModeToggle />
        <NotificationBell />
      </div>
    </header>
  );
}
