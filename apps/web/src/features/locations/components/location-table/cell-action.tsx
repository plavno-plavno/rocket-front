'use client';

import { useMutation, useQueryClient } from '@tanstack/react-query';
import { useTranslations } from 'next-intl';
import { useRouter } from 'next/navigation';
import { useState } from 'react';
import { toast } from 'sonner';
import { Icons } from '@/components/icons';
import { AlertModal } from '@/components/modal/alert-modal';
import { Button } from '@/components/ui/button';
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuGroup,
  DropdownMenuItem,
  DropdownMenuLabel,
  DropdownMenuSeparator,
  DropdownMenuTrigger
} from '@/components/ui/dropdown-menu';
import { useCan } from '@/features/session';
import { deleteLocationMutation } from '../../api/mutations';
import type { LocationListItem } from '../../api/types';

export function CellAction({ data }: { data: LocationListItem }) {
  const t = useTranslations('locations.list.actions');
  const tc = useTranslations('common');
  const router = useRouter();
  const queryClient = useQueryClient();
  const canEdit = useCan('locations.edit');
  const [confirmOpen, setConfirmOpen] = useState(false);
  const remove = useMutation({
    ...deleteLocationMutation(queryClient),
    onSuccess: () => {
      toast.success(t('deleted', { name: data.name }));
      setConfirmOpen(false);
    },
    onError: (error) => toast.error(error.message)
  });

  return (
    <>
      <AlertModal
        isOpen={confirmOpen}
        onClose={() => setConfirmOpen(false)}
        onConfirm={() => remove.mutate(data.id)}
        loading={remove.isPending}
        description={t('deleteConfirm')}
      />
      <DropdownMenu modal={false}>
        <DropdownMenuTrigger
          render={
            <Button variant='ghost' size='icon' className='size-8' aria-label={tc('openMenu')} />
          }
        >
          <Icons.ellipsis className='size-4' />
        </DropdownMenuTrigger>
        <DropdownMenuContent align='end'>
          <DropdownMenuGroup>
            <DropdownMenuLabel>{tc('actions')}</DropdownMenuLabel>
          </DropdownMenuGroup>
          <DropdownMenuGroup>
            <DropdownMenuItem onClick={() => router.push(`/dashboard/locations/${data.id}`)}>
              <Icons.eye className='size-4' /> {t('open')}
            </DropdownMenuItem>
            {canEdit && (
              <DropdownMenuItem
                onClick={() => router.push(`/dashboard/locations/${data.id}?tab=data&edit=1`)}
              >
                <Icons.edit className='size-4' /> {t('edit')}
              </DropdownMenuItem>
            )}
            <DropdownMenuItem
              onClick={() => router.push(`/dashboard/locations/${data.id}?tab=listings`)}
            >
              <Icons.sources className='size-4' /> {t('listings')}
            </DropdownMenuItem>
          </DropdownMenuGroup>
          {canEdit && (
            <>
              <DropdownMenuSeparator />
              <DropdownMenuItem variant='destructive' onClick={() => setConfirmOpen(true)}>
                <Icons.trash className='size-4' /> {t('delete')}
              </DropdownMenuItem>
            </>
          )}
        </DropdownMenuContent>
      </DropdownMenu>
    </>
  );
}
