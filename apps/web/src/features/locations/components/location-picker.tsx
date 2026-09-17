'use client';

import { useQuery } from '@tanstack/react-query';
import { useTranslations } from 'next-intl';
import { useMemo, useState } from 'react';
import { Icons } from '@/components/icons';
import { Badge } from '@/components/ui/badge';
import { Button } from '@/components/ui/button';
import { Checkbox } from '@/components/ui/checkbox';
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogFooter,
  DialogHeader,
  DialogTitle,
  DialogTrigger
} from '@/components/ui/dialog';
import { Input } from '@/components/ui/input';
import { ScrollArea } from '@/components/ui/scroll-area';
import { Skeleton } from '@/components/ui/skeleton';
import { useDebounce } from '@/hooks/use-debounce';
import { cn } from '@/lib/utils';
import { locationGroupsQueryOptions, locationsQueryOptions } from '../api/queries';
import type { LocationGroup } from '../api/types';

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

const PAGE_SIZE = 200;
const KIND_ORDER: LocationGroup['kind'][] = ['brand', 'region', 'city', 'custom'];

interface TreeNode {
  group: LocationGroup;
  children: TreeNode[];
}

/** Groups → forest by `parent_id`, ordered brand → region → city → custom, then by name. */
function buildTree(groups: LocationGroup[]): TreeNode[] {
  const byParent = new Map<string | null, LocationGroup[]>();
  for (const g of groups) {
    const key = g.parent_id ?? null;
    byParent.set(key, [...(byParent.get(key) ?? []), g]);
  }
  const sortGroups = (list: LocationGroup[]) =>
    list.toSorted(
      (a, b) =>
        KIND_ORDER.indexOf(a.kind) - KIND_ORDER.indexOf(b.kind) ||
        a.name.localeCompare(b.name, 'ru')
    );
  const build = (parent: string | null): TreeNode[] =>
    sortGroups(byParent.get(parent) ?? []).map((group) => ({ group, children: build(group.id) }));
  const roots = build(null);
  // Orphans (parent not in the list) become roots too.
  const ids = new Set(groups.map((g) => g.id));
  for (const g of groups)
    if (g.parent_id && !ids.has(g.parent_id)) roots.push({ group: g, children: build(g.id) });
  return roots;
}

function GroupTree({
  nodes,
  selected,
  onToggle,
  depth = 0
}: {
  nodes: TreeNode[];
  selected: Set<string>;
  onToggle: (id: string) => void;
  depth?: number;
}) {
  const t = useTranslations('locations.picker');
  const [collapsed, setCollapsed] = useState<Set<string>>(new Set());
  return (
    <ul role={depth === 0 ? 'tree' : 'group'} className='flex flex-col'>
      {nodes.map(({ group, children }) => {
        const isCollapsed = collapsed.has(group.id);
        return (
          <li
            key={group.id}
            role='treeitem'
            aria-selected={selected.has(group.id)}
            aria-expanded={children.length ? !isCollapsed : undefined}
          >
            <div
              className='hover:bg-muted flex h-8 items-center gap-1.5 rounded-md pr-2 text-sm'
              style={{ paddingLeft: depth * 16 + 4 }}
            >
              {children.length ? (
                <button
                  type='button'
                  className='text-muted-foreground flex size-5 items-center justify-center rounded hover:text-foreground'
                  aria-label={isCollapsed ? t('expand') : t('collapse')}
                  onClick={() =>
                    setCollapsed((s) => {
                      const next = new Set(s);
                      if (next.has(group.id)) next.delete(group.id);
                      else next.add(group.id);
                      return next;
                    })
                  }
                >
                  {isCollapsed ? (
                    <Icons.chevronRight className='size-3.5' />
                  ) : (
                    <Icons.chevronDown className='size-3.5' />
                  )}
                </button>
              ) : (
                <span className='size-5' />
              )}
              <label className='flex min-w-0 flex-1 cursor-pointer items-center gap-2'>
                <Checkbox
                  checked={selected.has(group.id)}
                  onCheckedChange={() => onToggle(group.id)}
                  aria-label={group.name}
                />
                <span className='truncate'>{group.name}</span>
                <span className='text-muted-foreground ml-auto text-xs tabular-nums'>
                  {group.location_count}
                </span>
              </label>
            </div>
            {children.length && !isCollapsed ? (
              <GroupTree
                nodes={children}
                selected={selected}
                onToggle={onToggle}
                depth={depth + 1}
              />
            ) : null}
          </li>
        );
      })}
    </ul>
  );
}

/**
 * «Выбрать компании» (SCR-2, SDD-01 §4.2): dialog with a group tree (brand → region → city) and a
 * searchable location list with select-all. Public API of UI-F1; props are additive-only.
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
  const [search, setSearch] = useState('');
  const q = useDebounce(search.trim(), 300);
  const { data: locations, isPending } = useQuery({
    ...locationsQueryOptions({ page: 1, page_size: PAGE_SIZE, scope: 'all', q: q || undefined }),
    enabled: open
  });
  const { data: groups } = useQuery({
    ...locationGroupsQueryOptions(),
    enabled: open && allowGroups
  });
  const tree = useMemo(() => buildTree(groups?.items ?? []), [groups]);
  const count = value.location_ids.length + value.group_ids.length;
  const selected = useMemo(
    () => ({ loc: new Set(draft.location_ids), grp: new Set(draft.group_ids) }),
    [draft]
  );
  const items = locations?.items ?? [];
  const total = locations?.meta.total ?? 0;
  const allVisibleSelected = items.length > 0 && items.every((l) => selected.loc.has(l.id));

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
  const toggleAllVisible = () => {
    const set = new Set(draft.location_ids);
    if (allVisibleSelected) for (const l of items) set.delete(l.id);
    else for (const l of items) set.add(l.id);
    setDraft({ ...draft, location_ids: [...set] });
  };

  return (
    <Dialog
      open={open}
      onOpenChange={(o) => {
        setOpen(o);
        if (o) {
          setDraft(value);
          setSearch('');
        }
      }}
    >
      <DialogTrigger
        render={trigger ? <span /> : <Button variant='outline' size='sm' disabled={disabled} />}
      >
        {trigger ?? (
          <>
            <Icons.locations className='size-4' />
            {t('choose')}
            {count > 0 && <Badge variant='secondary'>{count}</Badge>}
          </>
        )}
      </DialogTrigger>
      <DialogContent
        className='flex max-h-[85vh] flex-col gap-0 p-0 sm:max-w-3xl'
        data-testid='location-picker'
      >
        <DialogHeader className='px-4 pt-4 pb-3'>
          <DialogTitle>{t('title')}</DialogTitle>
          <DialogDescription>
            {mode === 'single' ? t('hintSingle') : t('hintMulti')}
          </DialogDescription>
        </DialogHeader>
        <div
          className={cn(
            'grid min-h-0 flex-1 border-y',
            allowGroups && tree.length
              ? 'grid-cols-[minmax(0,1fr)] sm:grid-cols-[16rem_minmax(0,1fr)]'
              : 'grid-cols-1'
          )}
        >
          {allowGroups && tree.length ? (
            <div className='flex min-h-0 flex-col border-b sm:border-r sm:border-b-0'>
              <div className='text-muted-foreground px-3 py-2 text-xs font-medium uppercase'>
                {t('groups')}
              </div>
              <ScrollArea className='h-56 px-2 pb-2 sm:h-96'>
                <GroupTree
                  nodes={tree}
                  selected={selected.grp}
                  onToggle={(id) => toggle('grp', id)}
                />
              </ScrollArea>
            </div>
          ) : null}
          <div className='flex min-h-0 flex-col'>
            <div className='flex items-center gap-2 px-3 py-2'>
              <div className='relative flex-1'>
                <Icons.search className='text-muted-foreground absolute top-1/2 left-2 size-4 -translate-y-1/2' />
                <Input
                  value={search}
                  onChange={(e) => setSearch(e.target.value)}
                  placeholder={t('search')}
                  className='h-8 pl-8'
                  aria-label={t('search')}
                />
              </div>
              {mode === 'multi' && (
                <Button
                  variant='ghost'
                  size='sm'
                  onClick={toggleAllVisible}
                  disabled={!items.length}
                >
                  {allVisibleSelected
                    ? t('clearVisible')
                    : t('selectVisible', { count: items.length })}
                </Button>
              )}
            </div>
            <ScrollArea className='h-72 sm:h-[22rem]'>
              <ul className='flex flex-col px-2 pb-2'>
                {isPending &&
                  Array.from({ length: 8 }, (_, i) => (
                    <li key={i} className='px-2 py-1.5'>
                      <Skeleton className='h-5 w-full' />
                    </li>
                  ))}
                {!isPending && items.length === 0 && (
                  <li className='text-muted-foreground px-2 py-8 text-center text-sm'>
                    {t('empty')}
                  </li>
                )}
                {items.map((l) => (
                  <li key={l.id}>
                    <label className='hover:bg-muted flex cursor-pointer items-center gap-2 rounded-md px-2 py-1.5 text-sm'>
                      <Checkbox
                        checked={selected.loc.has(l.id)}
                        onCheckedChange={() => toggle('loc', l.id)}
                        aria-label={l.name}
                      />
                      <span className='truncate'>{l.name}</span>
                      {l.branch_code && (
                        <span className='text-muted-foreground font-mono text-xs'>
                          {l.branch_code}
                        </span>
                      )}
                      <span className='text-muted-foreground ml-auto truncate text-xs'>
                        {l.address.city}
                      </span>
                    </label>
                  </li>
                ))}
                {total > items.length && (
                  <li className='text-muted-foreground px-2 py-2 text-center text-xs'>
                    {t('more', { shown: items.length, total })}
                  </li>
                )}
              </ul>
            </ScrollArea>
          </div>
        </div>
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
