'use client';

import { useQuery } from '@tanstack/react-query';
import { useTranslations } from 'next-intl';
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue
} from '@/components/ui/select';
import { usersQueryOptions } from '../api/queries';

export interface UserComboboxProps {
  value: string | null;
  onChange: (userId: string | null) => void;
  /** Only members with access to this scope (server-side filter, future). */
  scope?: string;
  placeholder?: string;
  allowNone?: boolean;
  disabled?: boolean;
  className?: string;
}

const NONE = '__none__';

/** Public stub (SDD-01T §3.5): plain select of tenant members. UI-F7 upgrades it to a searchable combobox. */
export function UserCombobox({
  value,
  onChange,
  placeholder,
  allowNone = true,
  disabled,
  className
}: UserComboboxProps) {
  const t = useTranslations('users.combobox');
  const { data } = useQuery(usersQueryOptions({ page: 1, page_size: 200 }));
  return (
    <Select
      value={value ?? NONE}
      onValueChange={(v) => onChange(v === NONE ? null : v)}
      disabled={disabled}
    >
      <SelectTrigger className={className} aria-label={placeholder ?? t('placeholder')}>
        <SelectValue placeholder={placeholder ?? t('placeholder')} />
      </SelectTrigger>
      <SelectContent>
        {allowNone && <SelectItem value={NONE}>{t('none')}</SelectItem>}
        {(data?.items ?? []).map((m) => (
          <SelectItem key={m.user.id} value={m.user.id}>
            {m.user.name}
          </SelectItem>
        ))}
      </SelectContent>
    </Select>
  );
}
