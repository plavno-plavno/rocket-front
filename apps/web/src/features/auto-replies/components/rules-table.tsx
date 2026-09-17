'use client';

import { useMutation, useQuery, useQueryClient } from '@tanstack/react-query';
import { useTranslations } from 'next-intl';
import { useState } from 'react';
import { toast } from 'sonner';
import { Icons } from '@/components/icons';
import { SortableTable } from '@/components/lp';
import { AlertModal } from '@/components/modal/alert-modal';
import { Badge } from '@/components/ui/badge';
import { Button } from '@/components/ui/button';
import {
  Empty,
  EmptyDescription,
  EmptyHeader,
  EmptyMedia,
  EmptyTitle
} from '@/components/ui/empty';
import { Skeleton } from '@/components/ui/skeleton';
import { Switch } from '@/components/ui/switch';
import { useCan } from '@/features/session';
import { platformsQueryOptions } from '@/features/sources';
import { isApiError } from '@/lib/api';
import { cn } from '@/lib/utils';
import {
  deleteAutoReplyRuleMutation,
  reorderAutoReplyRulesMutation,
  updateAutoReplyRuleMutation
} from '../api/mutations';
import { autoReplyRulesQueryOptions } from '../api/queries';
import type { AutoReplyRule } from '../api/types';
import { RuleEditorSheet } from './rule-editor-sheet';

const errorText = (e: unknown) => (isApiError(e) ? (e.detail ?? e.message) : (e as Error).message);

export function RulesHeaderActions() {
  const t = useTranslations('auto-replies.actions');
  const canEdit = useCan('templates.team');
  const [open, setOpen] = useState(false);
  if (!canEdit) return null;
  return (
    <>
      <Button size='sm' onClick={() => setOpen(true)} data-testid='rule-add'>
        <Icons.add className='size-4' /> {t('add')}
      </Button>
      <RuleEditorSheet open={open} onOpenChange={setOpen} rule={null} />
    </>
  );
}

/** S-REV-04: rules ordered by priority (drag), enable switch, conditions / action summary. */
export function RulesTable() {
  const t = useTranslations('auto-replies.table');
  const ta = useTranslations('auto-replies.actions');
  const tm = useTranslations('auto-replies.mode');
  const tc = useTranslations('common');
  const queryClient = useQueryClient();
  const canEdit = useCan('templates.team');
  const { data, isPending } = useQuery(autoReplyRulesQueryOptions());
  const { data: platforms } = useQuery(platformsQueryOptions());
  const update = useMutation(updateAutoReplyRuleMutation(queryClient));
  const remove = useMutation(deleteAutoReplyRuleMutation(queryClient));
  const reorder = useMutation(reorderAutoReplyRulesMutation(queryClient));
  const [editing, setEditing] = useState<AutoReplyRule | null>(null);
  const [editorOpen, setEditorOpen] = useState(false);
  const [deleting, setDeleting] = useState<AutoReplyRule | null>(null);
  const items = data?.items ?? [];

  const conditions = (r: AutoReplyRule) => {
    const c = r.conditions;
    const parts = [
      c.ratings?.length ? t('ratings', { list: c.ratings.toSorted().join(', ') }) : t('anyRating'),
      c.has_text == null ? null : c.has_text ? t('withText') : t('withoutText'),
      c.platform_ids?.length
        ? c.platform_ids.length <= 2
          ? c.platform_ids
              .map((id) => platforms?.items.find((p) => p.id === id)?.name ?? id)
              .join(', ')
          : t('platforms', { count: c.platform_ids.length })
        : t('allPlatforms'),
      c.keywords?.length ? t('keywords', { list: c.keywords.slice(0, 3).join(', ') }) : null
    ];
    return parts.filter(Boolean).join(' · ');
  };
  const action = (r: AutoReplyRule) =>
    r.action.ai_profile_id
      ? t('ai')
      : r.action.template_ids?.length
        ? t('templates', { count: r.action.template_ids.length })
        : t('noAction');

  return (
    <div className='flex flex-col gap-3' data-testid='rules-table'>
      <SortableTable
        items={items}
        disabled={!canEdit || reorder.isPending || isPending}
        onReorder={(next) =>
          reorder.mutate(
            { body: { ids: next.map((r) => r.id) } },
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
                  <Icons.sparkles />
                </EmptyMedia>
                <EmptyTitle>{t('empty')}</EmptyTitle>
                <EmptyDescription>{t('emptyHint')}</EmptyDescription>
              </EmptyHeader>
            </Empty>
          )
        }
        columns={[
          {
            id: 'enabled',
            header: t('enabled'),
            className: 'w-16',
            cell: (r) => (
              <Switch
                checked={r.enabled}
                disabled={!canEdit}
                aria-label={r.name}
                onCheckedChange={(v) =>
                  update.mutate(
                    {
                      id: r.id,
                      body: {
                        name: r.name,
                        enabled: v,
                        conditions: r.conditions,
                        action: r.action,
                        mode: r.mode,
                        delay_minutes: r.delay_minutes,
                        working_hours_only: r.working_hours_only ?? true
                      }
                    },
                    {
                      onSuccess: () => toast.success(v ? ta('enabled') : ta('disabled')),
                      onError: (e) => toast.error(errorText(e))
                    }
                  )
                }
              />
            )
          },
          {
            id: 'name',
            header: t('name'),
            cell: (r) => (
              <button
                type='button'
                className={cn('text-left font-medium', !r.enabled && 'text-muted-foreground')}
                onClick={() => {
                  setEditing(r);
                  setEditorOpen(true);
                }}
              >
                {r.name}
              </button>
            )
          },
          {
            id: 'conditions',
            header: t('conditions'),
            className: 'text-muted-foreground max-w-80 text-xs',
            cell: conditions
          },
          { id: 'action', header: t('action'), className: 'w-36 text-sm', cell: action },
          {
            id: 'mode',
            header: t('mode'),
            className: 'w-28',
            cell: (r) => (
              <Badge
                variant='outline'
                className={cn(
                  r.mode === 'publish' ? 'text-status-synced' : 'text-muted-foreground'
                )}
              >
                {tm(r.mode)}
              </Badge>
            )
          },
          {
            id: 'delay',
            header: t('delay'),
            className: 'text-muted-foreground w-36 text-xs',
            cell: (r) =>
              `${t('delayMinutes', { count: r.delay_minutes })}${r.working_hours_only ? ` · ${t('workingHours')}` : ''}`
          },
          {
            id: 'fired',
            header: t('fired'),
            className: 'w-28 text-right tabular-nums',
            cell: (r) => r.stats?.fired_30d ?? 0
          },
          {
            id: 'actions',
            header: '',
            className: 'w-20',
            cell: (r) =>
              canEdit ? (
                <span className='flex justify-end gap-1'>
                  <Button
                    variant='ghost'
                    size='icon-sm'
                    aria-label={ta('edit')}
                    onClick={() => {
                      setEditing(r);
                      setEditorOpen(true);
                    }}
                  >
                    <Icons.edit className='size-3.5' />
                  </Button>
                  <Button
                    variant='ghost'
                    size='icon-sm'
                    aria-label={ta('delete')}
                    onClick={() => setDeleting(r)}
                  >
                    <Icons.trash className='size-3.5' />
                  </Button>
                </span>
              ) : null
          }
        ]}
      />
      <RuleEditorSheet
        open={editorOpen}
        onOpenChange={(o) => {
          setEditorOpen(o);
          if (!o) setEditing(null);
        }}
        rule={editing}
      />
      <AlertModal
        isOpen={!!deleting}
        onClose={() => setDeleting(null)}
        loading={remove.isPending}
        title={ta('delete')}
        description={deleting ? ta('deleteConfirm', { name: deleting.name }) : ''}
        confirmLabel={tc('delete')}
        onConfirm={() =>
          deleting &&
          remove.mutate(
            { id: deleting.id },
            {
              onSuccess: () => {
                toast.success(ta('deleted'));
                setDeleting(null);
              },
              onError: (e) => toast.error(errorText(e))
            }
          )
        }
      />
    </div>
  );
}
