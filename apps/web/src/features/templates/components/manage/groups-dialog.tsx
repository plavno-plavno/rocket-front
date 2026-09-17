'use client';

import { useMutation, useQuery, useQueryClient } from '@tanstack/react-query';
import { useTranslations } from 'next-intl';
import { useState } from 'react';
import { toast } from 'sonner';
import { Icons } from '@/components/icons';
import { SortableTable } from '@/components/lp';
import { AlertModal } from '@/components/modal/alert-modal';
import { Button } from '@/components/ui/button';
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogHeader,
  DialogTitle
} from '@/components/ui/dialog';
import { Input } from '@/components/ui/input';
import { isApiError } from '@/lib/api';
import {
  createTemplateGroupMutation,
  deleteTemplateGroupMutation,
  reorderTemplateGroupsMutation,
  updateTemplateGroupMutation
} from '../../api/mutations';
import { templateGroupsQueryOptions } from '../../api/queries';
import type { TemplateGroup } from '../../api/types';

const errorText = (e: unknown) => (isApiError(e) ? (e.detail ?? e.message) : (e as Error).message);

/** «Настроить группы» (SCR-5): sortable list, inline rename, create, delete. */
export function GroupsDialog({
  open,
  onOpenChange
}: {
  open: boolean;
  onOpenChange: (open: boolean) => void;
}) {
  const t = useTranslations('templates.groups');
  const tc = useTranslations('common');
  const queryClient = useQueryClient();
  const { data } = useQuery({ ...templateGroupsQueryOptions(), enabled: open });
  const create = useMutation(createTemplateGroupMutation(queryClient));
  const update = useMutation(updateTemplateGroupMutation(queryClient));
  const remove = useMutation(deleteTemplateGroupMutation(queryClient));
  const reorder = useMutation(reorderTemplateGroupsMutation(queryClient));
  const [newName, setNewName] = useState('');
  const [editing, setEditing] = useState<{ id: string; name: string } | null>(null);
  const [deleting, setDeleting] = useState<TemplateGroup | null>(null);
  const groups = data?.items ?? [];

  const saveRename = () => {
    if (!editing || !editing.name.trim()) return;
    update.mutate(
      { id: editing.id, body: { name: editing.name.trim() } },
      {
        onSuccess: () => {
          toast.success(t('updated'));
          setEditing(null);
        },
        onError: (e) => toast.error(errorText(e))
      }
    );
  };

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent className='sm:max-w-lg' data-testid='groups-dialog'>
        <DialogHeader>
          <DialogTitle>{t('title')}</DialogTitle>
          <DialogDescription>{t('description')}</DialogDescription>
        </DialogHeader>
        <form
          className='flex gap-2'
          onSubmit={(e) => {
            e.preventDefault();
            if (!newName.trim()) return;
            create.mutate(
              { body: { name: newName.trim() } },
              {
                onSuccess: () => {
                  toast.success(t('created'));
                  setNewName('');
                },
                onError: (err) => toast.error(errorText(err))
              }
            );
          }}
        >
          <Input
            value={newName}
            onChange={(e) => setNewName(e.target.value)}
            placeholder={t('name')}
            aria-label={t('name')}
            maxLength={80}
          />
          <Button type='submit' disabled={!newName.trim() || create.isPending}>
            <Icons.add className='size-4' /> {t('create')}
          </Button>
        </form>
        <SortableTable
          items={groups}
          disabled={reorder.isPending}
          emptyState={<p className='text-muted-foreground p-4 text-center text-sm'>{t('empty')}</p>}
          onReorder={(items) =>
            reorder.mutate(
              { body: { ids: items.map((g) => g.id) } },
              { onError: (e) => toast.error(errorText(e)) }
            )
          }
          columns={[
            {
              id: 'name',
              header: t('name'),
              cell: (g) =>
                editing?.id === g.id ? (
                  <Input
                    autoFocus
                    value={editing.name}
                    onChange={(e) => setEditing({ id: g.id, name: e.target.value })}
                    onKeyDown={(e) => {
                      if (e.key === 'Enter') saveRename();
                      if (e.key === 'Escape') setEditing(null);
                    }}
                    onBlur={saveRename}
                    className='h-8'
                    aria-label={t('rename')}
                  />
                ) : (
                  <span className='font-medium'>{g.name}</span>
                )
            },
            {
              id: 'count',
              header: '',
              className: 'text-muted-foreground w-32 text-xs',
              cell: (g) => t('count', { count: g.template_count })
            },
            {
              id: 'actions',
              header: '',
              className: 'w-20',
              cell: (g) => (
                <span className='flex justify-end gap-1'>
                  <Button
                    variant='ghost'
                    size='icon-sm'
                    aria-label={t('rename')}
                    onClick={() => setEditing({ id: g.id, name: g.name })}
                  >
                    <Icons.edit className='size-3.5' />
                  </Button>
                  <Button
                    variant='ghost'
                    size='icon-sm'
                    aria-label={t('delete')}
                    onClick={() => setDeleting(g)}
                  >
                    <Icons.trash className='size-3.5' />
                  </Button>
                </span>
              )
            }
          ]}
        />
        <AlertModal
          isOpen={!!deleting}
          onClose={() => setDeleting(null)}
          loading={remove.isPending}
          title={t('delete')}
          description={deleting ? t('deleteConfirm', { name: deleting.name }) : ''}
          confirmLabel={tc('delete')}
          onConfirm={() =>
            deleting &&
            remove.mutate(
              { id: deleting.id },
              {
                onSuccess: () => {
                  toast.success(t('deleted'));
                  setDeleting(null);
                },
                onError: (e) => toast.error(errorText(e))
              }
            )
          }
        />
      </DialogContent>
    </Dialog>
  );
}
