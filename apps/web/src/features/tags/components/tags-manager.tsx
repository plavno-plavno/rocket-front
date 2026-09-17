'use client';

import { useMutation, useQuery, useQueryClient } from '@tanstack/react-query';
import { useTranslations } from 'next-intl';
import { useEffect, useState } from 'react';
import { toast } from 'sonner';
import { Icons } from '@/components/icons';
import { AlertModal } from '@/components/modal/alert-modal';
import { Badge } from '@/components/ui/badge';
import { Button } from '@/components/ui/button';
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogFooter,
  DialogHeader,
  DialogTitle
} from '@/components/ui/dialog';
import {
  Empty,
  EmptyDescription,
  EmptyHeader,
  EmptyMedia,
  EmptyTitle
} from '@/components/ui/empty';
import { Field, FieldError, FieldLabel } from '@/components/ui/field';
import { Input } from '@/components/ui/input';
import { Skeleton } from '@/components/ui/skeleton';
import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow
} from '@/components/ui/table';
import { useCan } from '@/features/session';
import { isApiError } from '@/lib/api';
import { createTagMutation, deleteTagMutation, updateTagMutation } from '../api/mutations';
import { tagsQueryOptions } from '../api/queries';
import type { Tag } from '../api/types';

const PALETTE = [
  '#2563eb',
  '#16a34a',
  '#d97706',
  '#dc2626',
  '#7c3aed',
  '#0891b2',
  '#db2777',
  '#64748b'
];
const errorText = (e: unknown) => (isApiError(e) ? (e.detail ?? e.message) : (e as Error).message);

function TagDialog({
  open,
  onOpenChange,
  tag
}: {
  open: boolean;
  onOpenChange: (open: boolean) => void;
  tag: Tag | null;
}) {
  const t = useTranslations('tags.editor');
  const ta = useTranslations('tags.actions');
  const queryClient = useQueryClient();
  const [name, setName] = useState('');
  const [color, setColor] = useState(PALETTE[0]!);
  const [error, setError] = useState<string | null>(null);
  const create = useMutation(createTagMutation(queryClient));
  const update = useMutation(updateTagMutation(queryClient));
  useEffect(() => {
    if (open) {
      setName(tag?.name ?? '');
      setColor(tag?.color ?? PALETTE[Math.floor(Math.random() * PALETTE.length)]!);
      setError(null);
    }
  }, [open, tag]);
  const pending = create.isPending || update.isPending;
  const submit = async () => {
    if (!name.trim()) return setError(t('nameRequired'));
    try {
      if (tag) await update.mutateAsync({ id: tag.id, body: { name: name.trim(), color } });
      else await create.mutateAsync({ body: { name: name.trim(), color } });
      toast.success(tag ? ta('updated') : ta('created'));
      onOpenChange(false);
    } catch (e) {
      setError(errorText(e));
    }
  };
  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent data-testid='tag-dialog'>
        <DialogHeader>
          <DialogTitle>{tag ? t('editTitle') : t('createTitle')}</DialogTitle>
          <DialogDescription className='sr-only'>{t('name')}</DialogDescription>
        </DialogHeader>
        <Field>
          <FieldLabel htmlFor='tag-name'>{t('name')}</FieldLabel>
          <Input
            id='tag-name'
            value={name}
            onChange={(e) => setName(e.target.value)}
            maxLength={40}
            autoFocus
            onKeyDown={(e) => e.key === 'Enter' && submit()}
          />
          {error && <FieldError>{error}</FieldError>}
        </Field>
        <Field>
          <FieldLabel>{t('color')}</FieldLabel>
          <div className='flex flex-wrap items-center gap-2'>
            {PALETTE.map((c) => (
              <button
                key={c}
                type='button'
                aria-label={c}
                aria-pressed={color === c}
                onClick={() => setColor(c)}
                className='size-7 rounded-full border-2 transition-transform aria-pressed:scale-110 aria-pressed:border-foreground'
                style={{ backgroundColor: c, borderColor: color === c ? undefined : 'transparent' }}
              />
            ))}
            <input
              type='color'
              value={color}
              onChange={(e) => setColor(e.target.value)}
              aria-label={t('color')}
              className='size-7 cursor-pointer rounded border bg-transparent p-0'
            />
          </div>
        </Field>
        <DialogFooter>
          <Button onClick={submit} disabled={pending}>
            {pending && <Icons.spinner className='size-4 animate-spin' />}
            {t('save')}
          </Button>
        </DialogFooter>
      </DialogContent>
    </Dialog>
  );
}

/** S-REV-03 «Теги»: CRUD table with colour and review count. */
export function TagsManager() {
  const t = useTranslations('tags.table');
  const ta = useTranslations('tags.actions');
  const tc = useTranslations('common');
  const queryClient = useQueryClient();
  const canEdit = useCan('reviews.reply');
  const { data, isPending } = useQuery(tagsQueryOptions());
  const remove = useMutation(deleteTagMutation(queryClient));
  const [search, setSearch] = useState('');
  const [dialogOpen, setDialogOpen] = useState(false);
  const [editing, setEditing] = useState<Tag | null>(null);
  const [deleting, setDeleting] = useState<Tag | null>(null);
  const items = (data?.items ?? []).filter((x) =>
    x.name.toLowerCase().includes(search.trim().toLowerCase())
  );

  return (
    <div className='flex flex-col gap-3' data-testid='tags-manager'>
      <div className='flex flex-wrap items-center gap-2'>
        <div className='relative min-w-56 flex-1'>
          <Icons.search className='text-muted-foreground absolute top-1/2 left-2 size-4 -translate-y-1/2' />
          <Input
            value={search}
            onChange={(e) => setSearch(e.target.value)}
            placeholder={t('search')}
            className='h-8 pl-8'
            aria-label={t('search')}
          />
        </div>
        {canEdit && (
          <Button
            size='sm'
            onClick={() => {
              setEditing(null);
              setDialogOpen(true);
            }}
            data-testid='tag-add'
          >
            <Icons.add className='size-4' /> {ta('add')}
          </Button>
        )}
      </div>
      <div className='overflow-hidden rounded-lg border'>
        <Table>
          <TableHeader className='bg-muted'>
            <TableRow>
              <TableHead>{t('name')}</TableHead>
              <TableHead className='w-32'>{t('color')}</TableHead>
              <TableHead className='w-28 text-right'>{t('count')}</TableHead>
              {canEdit && <TableHead className='w-24' />}
            </TableRow>
          </TableHeader>
          <TableBody>
            {isPending &&
              Array.from({ length: 4 }, (_, i) => (
                <TableRow key={i}>
                  <TableCell colSpan={4}>
                    <Skeleton className='h-5 w-full' />
                  </TableCell>
                </TableRow>
              ))}
            {!isPending && items.length === 0 && (
              <TableRow>
                <TableCell colSpan={4}>
                  <Empty className='py-8'>
                    <EmptyHeader>
                      <EmptyMedia variant='icon'>
                        <Icons.star />
                      </EmptyMedia>
                      <EmptyTitle>{t('empty')}</EmptyTitle>
                      <EmptyDescription>{t('emptyHint')}</EmptyDescription>
                    </EmptyHeader>
                  </Empty>
                </TableCell>
              </TableRow>
            )}
            {items.map((tag) => (
              <TableRow key={tag.id}>
                <TableCell>
                  <Badge variant='outline' className='gap-1.5'>
                    <span
                      className='size-2 rounded-full'
                      style={{ backgroundColor: tag.color }}
                      aria-hidden
                    />
                    {tag.name}
                  </Badge>
                </TableCell>
                <TableCell className='text-muted-foreground font-mono text-xs'>
                  {tag.color}
                </TableCell>
                <TableCell className='text-right tabular-nums'>{tag.review_count}</TableCell>
                {canEdit && (
                  <TableCell>
                    <div className='flex justify-end gap-1'>
                      <Button
                        variant='ghost'
                        size='icon-sm'
                        aria-label={ta('edit')}
                        onClick={() => {
                          setEditing(tag);
                          setDialogOpen(true);
                        }}
                      >
                        <Icons.edit className='size-3.5' />
                      </Button>
                      <Button
                        variant='ghost'
                        size='icon-sm'
                        aria-label={ta('delete')}
                        onClick={() => setDeleting(tag)}
                      >
                        <Icons.trash className='size-3.5' />
                      </Button>
                    </div>
                  </TableCell>
                )}
              </TableRow>
            ))}
          </TableBody>
        </Table>
      </div>
      <TagDialog open={dialogOpen} onOpenChange={setDialogOpen} tag={editing} />
      <AlertModal
        isOpen={!!deleting}
        onClose={() => setDeleting(null)}
        loading={remove.isPending}
        title={ta('delete')}
        description={
          deleting ? ta('deleteConfirm', { name: deleting.name, count: deleting.review_count }) : ''
        }
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
