'use client';

import { useQuery } from '@tanstack/react-query';
import { useTranslations } from 'next-intl';
import { useState } from 'react';
import { Icons } from '@/components/icons';
import { Badge } from '@/components/ui/badge';
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
import { tagsQueryOptions } from '../api/queries';

export interface TagPickerProps {
  value: string[];
  onChange: (tagIds: string[]) => void;
  disabled?: boolean;
  className?: string;
}

/** Public stub (SDD-01T §3.5): multiselect of tenant tags with colour dots. */
export function TagPicker({ value, onChange, disabled, className }: TagPickerProps) {
  const t = useTranslations('tags.picker');
  const [open, setOpen] = useState(false);
  const { data } = useQuery(tagsQueryOptions());
  const tags = data?.items ?? [];
  const selected = new Set(value);
  const toggle = (id: string) => {
    const next = new Set(selected);
    if (next.has(id)) next.delete(id);
    else next.add(id);
    onChange([...next]);
  };
  return (
    <div className={cn('flex flex-wrap items-center gap-1', className)}>
      {tags
        .filter((x) => selected.has(x.id))
        .map((x) => (
          <Badge key={x.id} variant='outline' className='gap-1'>
            <span
              className='size-2 rounded-full'
              style={{ backgroundColor: x.color }}
              aria-hidden
            />
            {x.name}
            {!disabled && (
              <button
                type='button'
                onClick={() => toggle(x.id)}
                aria-label={t('remove', { name: x.name })}
                className='hover:text-foreground text-muted-foreground'
              >
                <Icons.close className='size-3' />
              </button>
            )}
          </Badge>
        ))}
      <Popover open={open} onOpenChange={setOpen}>
        <PopoverTrigger
          render={
            <Button variant='ghost' size='sm' className='h-6 px-1.5 text-xs' disabled={disabled} />
          }
        >
          <Icons.add className='size-3.5' /> {t('add')}
        </PopoverTrigger>
        <PopoverContent className='w-56 p-0' align='start'>
          <Command>
            <CommandInput placeholder={t('search')} />
            <CommandList>
              <CommandEmpty>{t('empty')}</CommandEmpty>
              <CommandGroup>
                {tags.map((x) => (
                  <CommandItem
                    key={x.id}
                    value={x.name}
                    onSelect={() => toggle(x.id)}
                    className='gap-2'
                  >
                    <span
                      className='size-2.5 rounded-full'
                      style={{ backgroundColor: x.color }}
                      aria-hidden
                    />
                    <span className='truncate'>{x.name}</span>
                    {selected.has(x.id) && <Icons.check className='ml-auto size-4' />}
                  </CommandItem>
                ))}
              </CommandGroup>
            </CommandList>
          </Command>
        </PopoverContent>
      </Popover>
    </div>
  );
}
