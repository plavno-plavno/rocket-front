'use client';

import { useQuery } from '@tanstack/react-query';
import { useTranslations } from 'next-intl';
import { useMemo, useState } from 'react';
import type { Schema } from '@lp/contracts';
import { Icons } from '@/components/icons';
import { Badge } from '@/components/ui/badge';
import { Button } from '@/components/ui/button';
import { Checkbox } from '@/components/ui/checkbox';
import {
  Command,
  CommandEmpty,
  CommandGroup,
  CommandInput,
  CommandItem,
  CommandList,
  CommandSeparator
} from '@/components/ui/command';
import { Popover, PopoverContent, PopoverTrigger } from '@/components/ui/popover';
import { locationGroupsQueryOptions } from '@/features/locations';
import { useScope } from '@/hooks/use-scope';
import { groupIdsToScope, scopeToGroupIds } from '@/lib/searchparams';
import { cn } from '@/lib/utils';

type LocationGroup = Schema<'LocationGroup'>;

const KIND_ORDER: LocationGroup['kind'][] = ['brand', 'region', 'city', 'custom'];

/**
 * Global scope «Все компании» (SCR-1): tree of location groups with search and multi-select,
 * persisted in `?scope=` (SDD-01 §4.1, §7.1). Selected groups are OR-ed by core-api.
 */
export function ScopeSelector({ className }: { className?: string }) {
  const t = useTranslations('layout');
  const tk = useTranslations('layout.scopeKinds');
  const [scope, setScope] = useScope();
  const [open, setOpen] = useState(false);
  const { data, isPending } = useQuery(locationGroupsQueryOptions());
  const selected = useMemo(() => new Set(scopeToGroupIds(scope)), [scope]);

  const groups = useMemo(() => data?.items ?? [], [data]);
  const byKind = useMemo(() => {
    const map = new Map<LocationGroup['kind'], LocationGroup[]>();
    for (const kind of KIND_ORDER) map.set(kind, []);
    for (const g of groups) map.get(g.kind)?.push(g);
    return map;
  }, [groups]);

  const selectedCount = useMemo(() => {
    if (!selected.size) return null;
    const ids = new Set<string>();
    // Approximate the union by summing counts (exact union needs location ids — done server-side).
    let total = 0;
    for (const g of groups) if (selected.has(g.id) && !ids.has(g.id)) total += g.location_count;
    return total;
  }, [groups, selected]);

  const toggle = (id: string) => {
    const next = new Set(selected);
    if (next.has(id)) next.delete(id);
    else next.add(id);
    void setScope(groupIdsToScope([...next]));
  };
  const clear = () => {
    void setScope('all');
  };

  const label =
    selected.size === 0
      ? t('scope')
      : selectedCount !== null
        ? t('scopeSelected', { count: selectedCount })
        : t('scope');

  return (
    <Popover open={open} onOpenChange={setOpen}>
      <PopoverTrigger
        render={
          <Button
            variant='outline'
            size='sm'
            className={cn('max-w-64 justify-between gap-2', className)}
            aria-label={t('scope')}
            data-testid='scope-selector'
          />
        }
      >
        <Icons.locations className='size-4 shrink-0' />
        <span className='truncate'>{label}</span>
        {selected.size > 0 && (
          <Badge variant='secondary' className='rounded-sm px-1 font-mono text-[10px]'>
            {selected.size}
          </Badge>
        )}
        <Icons.chevronsUpDown className='size-3.5 shrink-0 opacity-50' />
      </PopoverTrigger>
      <PopoverContent className='w-80 p-0' align='start'>
        <Command>
          <CommandInput placeholder={t('scopeSearch')} />
          <CommandList className='max-h-80'>
            <CommandEmpty>{isPending ? t('scopeLoading') : t('scopeEmpty')}</CommandEmpty>
            {KIND_ORDER.map((kind) => {
              const items = byKind.get(kind) ?? [];
              if (!items.length) return null;
              return (
                <CommandGroup key={kind} heading={tk(kind)}>
                  {items.map((g) => (
                    <CommandItem
                      key={g.id}
                      value={`${g.name} ${g.id}`}
                      onSelect={() => toggle(g.id)}
                      // The checkbox shows the state: hide the primitive's trailing check icon.
                      className='gap-2 [&>svg:last-child]:hidden'
                    >
                      <Checkbox
                        checked={selected.has(g.id)}
                        tabIndex={-1}
                        aria-hidden
                        className='pointer-events-none'
                      />
                      <span className='min-w-0 flex-1 truncate'>{g.name}</span>
                      <span className='text-muted-foreground w-8 shrink-0 text-right text-xs tabular-nums'>
                        {g.location_count}
                      </span>
                    </CommandItem>
                  ))}
                </CommandGroup>
              );
            })}
            {selected.size > 0 && (
              <>
                <CommandSeparator />
                <CommandGroup>
                  <CommandItem onSelect={clear} className='justify-center text-center'>
                    {t('scopeReset')}
                  </CommandItem>
                </CommandGroup>
              </>
            )}
          </CommandList>
        </Command>
      </PopoverContent>
    </Popover>
  );
}
