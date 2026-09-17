'use client';

import { useMutation, useQuery, useQueryClient } from '@tanstack/react-query';
import { useFormatter, useTranslations } from 'next-intl';
import { parseAsInteger, parseAsString, useQueryStates } from 'nuqs';
import { useEffect, useMemo, useState } from 'react';
import { toast } from 'sonner';
import { Icons } from '@/components/icons';
import { SortableTable } from '@/components/lp';
import { AlertModal } from '@/components/modal/alert-modal';
import { Badge } from '@/components/ui/badge';
import { Button } from '@/components/ui/button';
import { Checkbox } from '@/components/ui/checkbox';
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
  Empty,
  EmptyDescription,
  EmptyHeader,
  EmptyMedia,
  EmptyTitle
} from '@/components/ui/empty';
import { Input } from '@/components/ui/input';
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue
} from '@/components/ui/select';
import { Separator } from '@/components/ui/separator';
import { Skeleton } from '@/components/ui/skeleton';
import { useCan, useMe } from '@/features/session';
import { useDebounce } from '@/hooks/use-debounce';
import { isApiError } from '@/lib/api';
import { cn } from '@/lib/utils';
import {
  bulkReplyTemplatesMutation,
  createReplyTemplateMutation,
  deleteReplyTemplateMutation,
  reorderReplyTemplatesMutation
} from '../../api/mutations';
import { replyTemplatesQueryOptions, templateGroupsQueryOptions } from '../../api/queries';
import type { ReplyTemplate } from '../../api/types';
import { GroupsDialog } from './groups-dialog';
import { TemplateEditorSheet } from './template-editor-sheet';

const ALL = '__all__';
const NONE = '__none__';
const PAGE_SIZES = [10, 25, 50];
const errorText = (e: unknown) => (isApiError(e) ? (e.detail ?? e.message) : (e as Error).message);

export const templatesSearchParams = {
  q: parseAsString.withDefault(''),
  group: parseAsString.withDefault(''),
  visibility: parseAsString.withDefault(''),
  page: parseAsInteger.withDefault(1),
  perPage: parseAsInteger.withDefault(25)
};

/** Header buttons — rendered by the page in `actions`; state is shared through URL + events. */
export function TemplatesHeaderActions() {
  const t = useTranslations('templates.actions');
  const [groupsOpen, setGroupsOpen] = useState(false);
  const [editorOpen, setEditorOpen] = useState(false);
  return (
    <div className='flex items-center gap-2'>
      <Button variant='ghost' size='sm' onClick={() => setGroupsOpen(true)}>
        <Icons.adjustments className='size-4' /> {t('groups')}
      </Button>
      <Button size='sm' onClick={() => setEditorOpen(true)} data-testid='template-add'>
        <Icons.add className='size-4' /> {t('add')}
      </Button>
      <GroupsDialog open={groupsOpen} onOpenChange={setGroupsOpen} />
      <TemplateEditorSheet open={editorOpen} onOpenChange={setEditorOpen} template={null} />
    </div>
  );
}

/** S-REV-02 table: sortable rows (drag only without filters), facets, bulk actions, pagination. */
export function TemplatesTable() {
  const t = useTranslations('templates.table');
  const ta = useTranslations('templates.actions');
  const tv = useTranslations('templates.visibility');
  const tc = useTranslations('common');
  const tt = useTranslations('table');
  const format = useFormatter();
  const me = useMe();
  const canTeam = useCan('templates.team');
  const queryClient = useQueryClient();
  const [params, setParams] = useQueryStates(templatesSearchParams, { shallow: true });
  const [search, setSearch] = useState(params.q);
  const debounced = useDebounce(search.trim(), 400);
  useEffect(() => {
    if (debounced !== params.q) void setParams({ q: debounced || null, page: 1 });
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [debounced]);

  const query = useMemo(
    () => ({
      page: params.page,
      page_size: params.perPage,
      q: params.q || undefined,
      'filter[group_id]': params.group ? [params.group] : undefined,
      'filter[visibility]': params.visibility
        ? [params.visibility as ReplyTemplate['visibility']]
        : undefined
    }),
    [params]
  );
  const { data, isPending } = useQuery(replyTemplatesQueryOptions(query));
  const { data: groups } = useQuery(templateGroupsQueryOptions());
  const groupName = (id: string | null | undefined) =>
    id ? (groups?.items.find((g) => g.id === id)?.name ?? '—') : t('ungrouped');

  const [selected, setSelected] = useState<Set<string>>(new Set());
  const [editing, setEditing] = useState<ReplyTemplate | null>(null);
  const [editorOpen, setEditorOpen] = useState(false);
  const [confirm, setConfirm] = useState<'bulk-delete' | ReplyTemplate | null>(null);

  const reorder = useMutation(reorderReplyTemplatesMutation(queryClient));
  const bulk = useMutation(bulkReplyTemplatesMutation(queryClient));
  const remove = useMutation(deleteReplyTemplateMutation(queryClient));
  const duplicate = useMutation(createReplyTemplateMutation(queryClient));

  const items = data?.items ?? [];
  const total = data?.meta.total ?? 0;
  const pageCount = Math.max(1, Math.ceil(total / params.perPage));
  const filtered = !!(params.q || params.group || params.visibility);
  const allSelected = items.length > 0 && items.every((i) => selected.has(i.id));

  const runBulk = (
    action: 'set_group' | 'set_visibility' | 'delete',
    extra?: Record<string, unknown>
  ) =>
    bulk.mutate(
      { body: { ids: [...selected], action, ...extra } as never },
      {
        onSuccess: () => {
          toast.success(action === 'delete' ? ta('deleted') : ta('updated'));
          setSelected(new Set());
          setConfirm(null);
        },
        onError: (e) => toast.error(errorText(e))
      }
    );

  const columns = [
    {
      id: 'name',
      header: t('name'),
      cell: (tpl: ReplyTemplate) => (
        <button
          type='button'
          // Cap the column: the body preview is long, and truncate/line-clamp do not limit the
          // intrinsic width — the table grew to ~1860px and did not fit even a 4K screen.
          className='flex min-w-0 max-w-[42ch] flex-col text-left'
          onClick={() => {
            setEditing(tpl);
            setEditorOpen(true);
          }}
        >
          <span className='truncate font-medium'>{tpl.name}</span>
          <span className='text-muted-foreground line-clamp-1 text-xs'>{tpl.body}</span>
        </button>
      )
    },
    {
      id: 'group',
      header: t('group'),
      className: 'w-44',
      cell: (tpl: ReplyTemplate) => <span className='text-sm'>{groupName(tpl.group_id)}</span>
    },
    {
      id: 'visibility',
      header: t('visibility'),
      className: 'w-32',
      cell: (tpl: ReplyTemplate) => (
        <Badge
          variant='outline'
          className={cn(tpl.visibility === 'team' ? 'text-status-sent' : 'text-muted-foreground')}
        >
          {tv(tpl.visibility)}
        </Badge>
      )
    },
    {
      id: 'usage',
      header: t('usage'),
      className: 'w-28 text-right tabular-nums',
      cell: (tpl: ReplyTemplate) => tpl.usage_count ?? 0
    },
    {
      id: 'updated',
      header: t('updated'),
      className: 'w-32 text-muted-foreground text-xs',
      cell: (tpl: ReplyTemplate) =>
        tpl.updated_at ? format.dateTime(new Date(tpl.updated_at), 'short') : '—'
    },
    {
      id: 'actions',
      header: '',
      className: 'w-12',
      cell: (tpl: ReplyTemplate) => {
        const own = tpl.owner_user_id === me.user.id || canTeam;
        return (
          <DropdownMenu>
            <DropdownMenuTrigger
              render={<Button variant='ghost' size='icon-sm' aria-label={tc('openMenu')} />}
            >
              <Icons.ellipsis className='size-4' />
            </DropdownMenuTrigger>
            <DropdownMenuContent align='end'>
              <DropdownMenuGroup>
                <DropdownMenuItem
                  onClick={() => {
                    setEditing(tpl);
                    setEditorOpen(true);
                  }}
                >
                  <Icons.edit className='size-4' /> {t('edit')}
                </DropdownMenuItem>
                <DropdownMenuItem
                  onClick={() =>
                    duplicate.mutate(
                      {
                        body: {
                          name: `${tpl.name} ${t('copy')}`,
                          body: tpl.body,
                          group_id: tpl.group_id ?? null,
                          visibility: tpl.visibility,
                          sentiment_hint: tpl.sentiment_hint
                        }
                      },
                      { onError: (e) => toast.error(errorText(e)) }
                    )
                  }
                >
                  <Icons.copy className='size-4' /> {t('duplicate')}
                </DropdownMenuItem>
                {own && (
                  <>
                    <DropdownMenuSeparator />
                    <DropdownMenuItem variant='destructive' onClick={() => setConfirm(tpl)}>
                      <Icons.trash className='size-4' /> {ta('delete')}
                    </DropdownMenuItem>
                  </>
                )}
              </DropdownMenuGroup>
            </DropdownMenuContent>
          </DropdownMenu>
        );
      }
    }
  ];

  return (
    <div className='flex flex-col gap-3' data-testid='templates-table'>
      <div className='flex flex-wrap items-center gap-2'>
        <div className='relative w-full min-w-0 flex-1 basis-full sm:min-w-56 sm:basis-auto'>
          <Icons.search className='text-muted-foreground absolute top-1/2 left-2 size-4 -translate-y-1/2' />
          <Input
            value={search}
            onChange={(e) => setSearch(e.target.value)}
            placeholder={t('search')}
            className='h-8 pl-8'
            aria-label={t('search')}
          />
        </div>
        <Select
          value={params.group || ALL}
          onValueChange={(v) => void setParams({ group: v === ALL ? null : v, page: 1 })}
        >
          <SelectTrigger size='sm' className='w-44' aria-label={t('group')}>
            <SelectValue>
              {(v: string) =>
                v === ALL ? t('allGroups') : v === NONE ? t('ungrouped') : groupName(v)
              }
            </SelectValue>
          </SelectTrigger>
          <SelectContent>
            <SelectItem value={ALL}>{t('allGroups')}</SelectItem>
            {(groups?.items ?? []).map((g) => (
              <SelectItem key={g.id} value={g.id}>
                {g.name}
              </SelectItem>
            ))}
          </SelectContent>
        </Select>
        <Select
          value={params.visibility || ALL}
          onValueChange={(v) => void setParams({ visibility: v === ALL ? null : v, page: 1 })}
        >
          <SelectTrigger size='sm' className='w-36' aria-label={t('visibility')}>
            <SelectValue>
              {(v: string) => (v === ALL ? t('allTypes') : tv(v as ReplyTemplate['visibility']))}
            </SelectValue>
          </SelectTrigger>
          <SelectContent>
            <SelectItem value={ALL}>{t('allTypes')}</SelectItem>
            <SelectItem value='team'>{tv('team')}</SelectItem>
            <SelectItem value='private'>{tv('private')}</SelectItem>
          </SelectContent>
        </Select>
        {filtered && (
          <Button
            variant='ghost'
            size='sm'
            onClick={() => {
              setSearch('');
              void setParams({ q: null, group: null, visibility: null, page: 1 });
            }}
          >
            <Icons.close className='size-4' /> {tt('resetFilters')}
          </Button>
        )}
      </div>
      {filtered && <p className='text-muted-foreground text-xs'>{t('dragHint')}</p>}

      <SortableTable
        items={items}
        columns={columns}
        disabled={filtered || reorder.isPending || isPending}
        leading={(tpl) => (
          <Checkbox
            checked={selected.has(tpl.id)}
            onCheckedChange={(v) =>
              setSelected((s) => {
                const n = new Set(s);
                if (v) n.add(tpl.id);
                else n.delete(tpl.id);
                return n;
              })
            }
            aria-label={tpl.name}
          />
        )}
        onReorder={(next) =>
          reorder.mutate(
            { body: { ids: next.map((x) => x.id) } },
            {
              onSuccess: () => toast.success(ta('reordered')),
              onError: (e) => toast.error(errorText(e))
            }
          )
        }
        emptyState={
          isPending ? (
            <div className='flex flex-col gap-2 p-4'>
              {Array.from({ length: 5 }, (_, i) => (
                <Skeleton key={i} className='h-8 w-full' />
              ))}
            </div>
          ) : (
            <Empty className='py-10'>
              <EmptyHeader>
                <EmptyMedia variant='icon'>
                  <Icons.post />
                </EmptyMedia>
                <EmptyTitle>{t('empty')}</EmptyTitle>
                <EmptyDescription>{t('emptyHint')}</EmptyDescription>
              </EmptyHeader>
            </Empty>
          )
        }
      />

      <div className='flex flex-wrap items-center gap-2 text-sm'>
        <Checkbox
          checked={allSelected}
          onCheckedChange={(v) => setSelected(v ? new Set(items.map((i) => i.id)) : new Set())}
          aria-label={tt('selectAll')}
        />
        <span className='text-muted-foreground'>{tt('rowsTotal', { total })}</span>
        <div className='ml-auto flex items-center gap-2'>
          <span className='text-muted-foreground text-xs'>{t('pageSize')}</span>
          <Select
            value={String(params.perPage)}
            onValueChange={(v) => void setParams({ perPage: Number(v), page: 1 })}
          >
            <SelectTrigger size='sm' className='w-20' aria-label={t('pageSize')}>
              <SelectValue>{(v: string) => v}</SelectValue>
            </SelectTrigger>
            <SelectContent>
              {PAGE_SIZES.map((n) => (
                <SelectItem key={n} value={String(n)}>
                  {n}
                </SelectItem>
              ))}
            </SelectContent>
          </Select>
          <span className='text-muted-foreground text-xs tabular-nums'>
            {tt('page', { page: params.page, total: pageCount })}
          </span>
          <Button
            variant='outline'
            size='icon-sm'
            disabled={params.page <= 1}
            onClick={() => void setParams({ page: params.page - 1 })}
            aria-label={tt('previousPage')}
          >
            <Icons.chevronLeft className='size-4' />
          </Button>
          <Button
            variant='outline'
            size='icon-sm'
            disabled={params.page >= pageCount}
            onClick={() => void setParams({ page: params.page + 1 })}
            aria-label={tt('nextPage')}
          >
            <Icons.chevronRight className='size-4' />
          </Button>
        </div>
      </div>

      {selected.size > 0 && (
        <div
          className='bg-background/95 fixed inset-x-0 bottom-4 z-30 mx-auto flex w-fit items-center gap-2 rounded-lg border px-3 py-2 shadow-lg backdrop-blur'
          role='toolbar'
          data-testid='templates-bulk-bar'
        >
          <span className='text-sm font-medium'>{t('selected', { count: selected.size })}</span>
          <Separator orientation='vertical' className='h-5' />
          <DropdownMenu>
            <DropdownMenuTrigger render={<Button size='sm' variant='outline' />}>
              {ta('bulk')} <Icons.chevronDown className='size-4' />
            </DropdownMenuTrigger>
            <DropdownMenuContent align='center'>
              <DropdownMenuGroup>
                <DropdownMenuLabel>{ta('setGroup')}</DropdownMenuLabel>
                <DropdownMenuItem onClick={() => runBulk('set_group', { group_id: null })}>
                  {t('ungrouped')}
                </DropdownMenuItem>
                {(groups?.items ?? []).map((g) => (
                  <DropdownMenuItem
                    key={g.id}
                    onClick={() => runBulk('set_group', { group_id: g.id })}
                  >
                    {g.name}
                  </DropdownMenuItem>
                ))}
              </DropdownMenuGroup>
              <DropdownMenuSeparator />
              <DropdownMenuGroup>
                <DropdownMenuLabel>{ta('setVisibility')}</DropdownMenuLabel>
                <DropdownMenuItem
                  onClick={() => runBulk('set_visibility', { visibility: 'private' })}
                >
                  {tv('private')}
                </DropdownMenuItem>
                {canTeam && (
                  <DropdownMenuItem
                    onClick={() => runBulk('set_visibility', { visibility: 'team' })}
                  >
                    {tv('team')}
                  </DropdownMenuItem>
                )}
              </DropdownMenuGroup>
              <DropdownMenuSeparator />
              <DropdownMenuGroup>
                <DropdownMenuItem variant='destructive' onClick={() => setConfirm('bulk-delete')}>
                  <Icons.trash className='size-4' /> {ta('delete')}
                </DropdownMenuItem>
              </DropdownMenuGroup>
            </DropdownMenuContent>
          </DropdownMenu>
          <Button
            size='sm'
            variant='ghost'
            onClick={() => setSelected(new Set())}
            aria-label={tc('clear')}
          >
            <Icons.close className='size-4' />
          </Button>
        </div>
      )}

      <TemplateEditorSheet
        open={editorOpen}
        onOpenChange={(o) => {
          setEditorOpen(o);
          if (!o) setEditing(null);
        }}
        template={editing}
      />
      <AlertModal
        isOpen={!!confirm}
        onClose={() => setConfirm(null)}
        loading={bulk.isPending || remove.isPending}
        title={ta('delete')}
        description={
          confirm === 'bulk-delete'
            ? ta('deleteConfirm', { count: selected.size })
            : tc('confirmDescription')
        }
        confirmLabel={tc('delete')}
        onConfirm={() => {
          if (confirm === 'bulk-delete') runBulk('delete');
          else if (confirm)
            remove.mutate(
              { id: confirm.id },
              {
                onSuccess: () => {
                  toast.success(ta('deleted'));
                  setConfirm(null);
                },
                onError: (e) => toast.error(errorText(e))
              }
            );
        }}
      />
    </div>
  );
}
