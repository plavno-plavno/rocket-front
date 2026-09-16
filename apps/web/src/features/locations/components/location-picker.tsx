'use client';

import { useQuery } from '@tanstack/react-query';
import { useTranslations } from 'next-intl';
import { useMemo, useState } from 'react';
import { Badge } from '@/components/ui/badge';
import { Button } from '@/components/ui/button';
import { Checkbox } from '@/components/ui/checkbox';
import {
  Command,
  CommandEmpty,
  CommandGroup,
  CommandInput,
  CommandItem,
  CommandList
} from '@/components/ui/command';
import {
  Dialog,
  DialogContent,
  DialogFooter,
  DialogHeader,
  DialogTitle,
  DialogTrigger
} from '@/components/ui/dialog';
import { locationGroupsQueryOptions, locationsQueryOptions } from '../api/queries';

export interface LocationPickerValue {
  location_ids: string[];
  group_ids: string[];
}

export interface LocationPickerProps {
  value: LocationPickerValue;
  onChange: (value: LocationPickerValue) => void;
  mode?: 'single' | 'multi';
  /** Allow picking groups (brand / region / city) in addition to locations. */
  allowGroups?: boolean;
  /** Custom trigger; defaults to a button «Выбрать компании». */
  trigger?: React.ReactNode;
  disabled?: boolean;
}

/**
 * «Выбрать компании» (SCR-2) — Foundation stub with final props: dialog with search + checkbox
 * list (first 200 locations) and optional groups. UI-F1 replaces it with the DataTable + tree.
 */
export function LocationPicker({
  value,
  onChange,
  mode = 'multi',
  allowGroups = true,
  trigger,
  disabled
}: LocationPickerProps) {
  const t = useTranslations('locations.picker');
  const [open, setOpen] = useState(false);
  const [draft, setDraft] = useState<LocationPickerValue>(value);
  const { data: locations } = useQuery({
    ...locationsQueryOptions({ page: 1, page_size: 200, scope: 'all' }),
    enabled: open
  });
  const { data: groups } = useQuery({
    ...locationGroupsQueryOptions(),
    enabled: open && allowGroups
  });
  const count = value.location_ids.length + value.group_ids.length;
  const selected = useMemo(
    () => ({ loc: new Set(draft.location_ids), grp: new Set(draft.group_ids) }),
    [draft]
  );

  const toggle = (kind: 'loc' | 'grp', id: string) => {
    const key = kind === 'loc' ? 'location_ids' : 'group_ids';
    const set = new Set(draft[key]);
    if (set.has(id)) set.delete(id);
    else {
      if (mode === 'single')
        return setDraft({
          location_ids: kind === 'loc' ? [id] : [],
          group_ids: kind === 'grp' ? [id] : []
        });
      set.add(id);
    }
    setDraft({ ...draft, [key]: [...set] });
  };

  return (
    <Dialog
      open={open}
      onOpenChange={(o) => {
        setOpen(o);
        if (o) setDraft(value);
      }}
    >
      <DialogTrigger
        render={trigger ? <span /> : <Button variant='outline' size='sm' disabled={disabled} />}
      >
        {trigger ?? (
          <>
            {t('choose')}
            {count > 0 && <Badge variant='secondary'>{count}</Badge>}
          </>
        )}
      </DialogTrigger>
      <DialogContent className='max-w-lg p-0'>
        <DialogHeader className='px-4 pt-4'>
          <DialogTitle>{t('title')}</DialogTitle>
        </DialogHeader>
        <Command className='rounded-none border-y'>
          <CommandInput placeholder={t('search')} />
          <CommandList className='max-h-80'>
            <CommandEmpty>{t('empty')}</CommandEmpty>
            {allowGroups && groups?.items.length ? (
              <CommandGroup heading={t('groups')}>
                {groups.items.map((g) => (
                  <CommandItem
                    key={g.id}
                    value={`g ${g.name}`}
                    onSelect={() => toggle('grp', g.id)}
                    className='gap-2'
                  >
                    <Checkbox
                      checked={selected.grp.has(g.id)}
                      tabIndex={-1}
                      aria-hidden
                      className='pointer-events-none'
                    />
                    <span className='truncate'>{g.name}</span>
                    <span className='text-muted-foreground ml-auto text-xs'>
                      {g.location_count}
                    </span>
                  </CommandItem>
                ))}
              </CommandGroup>
            ) : null}
            <CommandGroup heading={t('locations')}>
              {(locations?.items ?? []).map((l) => (
                <CommandItem
                  key={l.id}
                  value={`l ${l.name} ${l.address.city}`}
                  onSelect={() => toggle('loc', l.id)}
                  className='gap-2'
                >
                  <Checkbox
                    checked={selected.loc.has(l.id)}
                    tabIndex={-1}
                    aria-hidden
                    className='pointer-events-none'
                  />
                  <span className='truncate'>{l.name}</span>
                  <span className='text-muted-foreground ml-auto truncate text-xs'>
                    {l.address.city}
                  </span>
                </CommandItem>
              ))}
            </CommandGroup>
          </CommandList>
        </Command>
        <DialogFooter className='px-4 pb-4'>
          <span className='text-muted-foreground mr-auto text-sm'>
            {t('selected', { count: draft.location_ids.length + draft.group_ids.length })}
          </span>
          <Button variant='outline' onClick={() => setOpen(false)}>
            {t('cancel')}
          </Button>
          <Button
            onClick={() => {
              onChange(draft);
              setOpen(false);
            }}
          >
            {t('apply')}
          </Button>
        </DialogFooter>
      </DialogContent>
    </Dialog>
  );
}
