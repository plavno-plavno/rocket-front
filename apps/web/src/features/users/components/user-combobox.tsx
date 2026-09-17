'use client';

import { useQuery } from '@tanstack/react-query';
import { useTranslations } from 'next-intl';
import { useId, useState } from 'react';
import { Icons } from '@/components/icons';
import { Avatar, AvatarFallback } from '@/components/ui/avatar';
import { Button } from '@/components/ui/button';
import {
  Command,
  CommandEmpty,
  CommandGroup,
  CommandInput,
  CommandItem,
  CommandList
} from '@/components/ui/command';
import { Popover, PopoverContent, PopoverTrigger } from '@/components/ui/popover';
import { cn } from '@/lib/utils';
import { usersQueryOptions } from '../api/queries';

export interface UserComboboxProps {
  value: string | null;
  onChange: (userId: string | null) => void;
  /** Only members with access to this scope (server-side filter, future). */
  scope?: string;
  placeholder?: string;
  allowNone?: boolean;
  disabled?: boolean;
  className?: string;
}

function initials(name: string) {
  return name
    .split(/\s+/)
    .slice(0, 2)
    .map((p) => p[0]?.toUpperCase() ?? '')
    .join('');
}

/** Public (SDD-01T §3.5): searchable combobox of active tenant members (assignee, «ответил», filters). */
export function UserCombobox({
  value,
  onChange,
  placeholder,
  allowNone = true,
  disabled,
  className
}: UserComboboxProps) {
  const t = useTranslations('users.combobox');
  const [open, setOpen] = useState(false);
  const listId = useId();
  const { data } = useQuery(usersQueryOptions({ page: 1, page_size: 200 }));
  const members = (data?.items ?? []).filter((m) => m.status !== 'disabled' || m.user.id === value);
  const selected = value ? members.find((m) => m.user.id === value) : null;
  const label = placeholder ?? t('placeholder');

  return (
    <Popover open={open} onOpenChange={setOpen}>
      <PopoverTrigger
        render={
          <Button
            variant='outline'
            role='combobox'
            aria-expanded={open}
            aria-controls={listId}
            aria-label={label}
            disabled={disabled}
            className={cn('h-9 w-full justify-between font-normal', className)}
          />
        }
      >
        <span className='flex min-w-0 items-center gap-2'>
          {selected ? (
            <>
              <Avatar className='size-5'>
                <AvatarFallback className='text-[9px]'>
                  {initials(selected.user.name)}
                </AvatarFallback>
              </Avatar>
              <span className='truncate'>{selected.user.name}</span>
            </>
          ) : (
            <span className='text-muted-foreground truncate'>
              {value && !data ? '…' : allowNone ? t('none') : label}
            </span>
          )}
        </span>
        <Icons.chevronsUpDown className='text-muted-foreground size-4 shrink-0' />
      </PopoverTrigger>
      <PopoverContent className='w-72 p-0' align='start'>
        <Command>
          <CommandInput placeholder={t('search')} />
          <CommandList id={listId}>
            <CommandEmpty>{t('empty')}</CommandEmpty>
            <CommandGroup>
              {allowNone && (
                <CommandItem
                  value='__none__'
                  onSelect={() => {
                    onChange(null);
                    setOpen(false);
                  }}
                  className='gap-2'
                >
                  <Icons.userOff className='text-muted-foreground size-4' />
                  <span>{t('none')}</span>
                  {value === null && <Icons.check className='ml-auto size-4' />}
                </CommandItem>
              )}
              {members.map((m) => (
                <CommandItem
                  key={m.user.id}
                  value={`${m.user.name} ${m.user.email}`}
                  onSelect={() => {
                    onChange(m.user.id);
                    setOpen(false);
                  }}
                  className='gap-2'
                >
                  <Avatar className='size-5'>
                    <AvatarFallback className='text-[9px]'>{initials(m.user.name)}</AvatarFallback>
                  </Avatar>
                  <span className='flex min-w-0 flex-col'>
                    <span className='truncate'>{m.user.name}</span>
                    <span className='text-muted-foreground truncate text-xs'>{m.user.email}</span>
                  </span>
                  {value === m.user.id && <Icons.check className='ml-auto size-4' />}
                </CommandItem>
              ))}
            </CommandGroup>
          </CommandList>
        </Command>
      </PopoverContent>
    </Popover>
  );
}
