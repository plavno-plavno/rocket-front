'use client';

import { useMutation, useQuery, useQueryClient } from '@tanstack/react-query';
import { useTranslations } from 'next-intl';
import { useState } from 'react';
import { toast } from 'sonner';
import { Icons } from '@/components/icons';
import { Button } from '@/components/ui/button';
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogFooter,
  DialogHeader,
  DialogTitle
} from '@/components/ui/dialog';
import { Field, FieldLabel } from '@/components/ui/field';
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue
} from '@/components/ui/select';
import { isApiError } from '@/lib/api';
import { updateLocationGroupMutation } from '../../api/mutations';
import { locationGroupsQueryOptions } from '../../api/queries';

/** Adds the selected locations to a manual group (`rule.location_ids`). */
export function AssignGroupsDialog({
  open,
  onOpenChange,
  locationIds,
  onDone
}: {
  open: boolean;
  onOpenChange: (open: boolean) => void;
  locationIds: string[];
  onDone: () => void;
}) {
  const t = useTranslations('locations.bulk.groups');
  const queryClient = useQueryClient();
  const { data } = useQuery(locationGroupsQueryOptions());
  const groups = (data?.items ?? []).filter((g) => g.kind === 'custom' || g.rule?.location_ids);
  const [groupId, setGroupId] = useState<string | null>(null);
  const mutation = useMutation(updateLocationGroupMutation(queryClient));
  const selected = groups.find((g) => g.id === groupId);

  const submit = async () => {
    if (!selected) return;
    const ids = Array.from(new Set([...(selected.rule?.location_ids ?? []), ...locationIds]));
    try {
      await mutation.mutateAsync({
        id: selected.id,
        body: {
          name: selected.name,
          kind: selected.kind,
          parent_id: selected.parent_id ?? null,
          rule: { ...selected.rule, location_ids: ids }
        }
      });
      toast.success(t('done'));
      onOpenChange(false);
      onDone();
    } catch (e) {
      toast.error(isApiError(e) ? (e.detail ?? e.message) : (e as Error).message);
    }
  };

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent data-testid='assign-groups-dialog'>
        <DialogHeader>
          <DialogTitle>{t('title')}</DialogTitle>
          <DialogDescription>{t('description', { count: locationIds.length })}</DialogDescription>
        </DialogHeader>
        <Field>
          <FieldLabel>{t('group')}</FieldLabel>
          <Select value={groupId} onValueChange={setGroupId}>
            <SelectTrigger aria-label={t('group')}>
              <SelectValue placeholder={t('group')}>
                {(v: string | null) => groups.find((g) => g.id === v)?.name ?? t('group')}
              </SelectValue>
            </SelectTrigger>
            <SelectContent>
              {groups.map((g) => (
                <SelectItem key={g.id} value={g.id}>
                  {g.name}
                  <span className='text-muted-foreground ml-auto text-xs tabular-nums'>
                    {g.location_count}
                  </span>
                </SelectItem>
              ))}
            </SelectContent>
          </Select>
        </Field>
        <DialogFooter>
          <Button onClick={submit} disabled={!selected || mutation.isPending}>
            {mutation.isPending && <Icons.spinner className='size-4 animate-spin' />}
            {t('submit')}
          </Button>
        </DialogFooter>
      </DialogContent>
    </Dialog>
  );
}
