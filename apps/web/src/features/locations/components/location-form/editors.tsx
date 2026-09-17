'use client';

import { useTranslations } from 'next-intl';
import { Icons } from '@/components/icons';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue
} from '@/components/ui/select';
import { Switch } from '@/components/ui/switch';
import { cn } from '@/lib/utils';
import { WEEKDAYS, type Weekday } from '../../constants/taxonomy';
import type { LocationFormValues } from './schema';

type Hours = LocationFormValues['hours'];

/** Weekly hours: one interval per day + closed switch (SDD-00 §4 `hours.regular`). */
export function HoursEditor({
  value,
  onChange,
  disabled
}: {
  value: Hours;
  onChange: (v: Hours) => void;
  disabled?: boolean;
}) {
  const t = useTranslations('locations.form.hours');
  const td = useTranslations('locations.form.weekdays');
  const set = (day: Weekday, patch: Partial<Hours[Weekday]>) =>
    onChange({ ...value, [day]: { ...value[day], ...patch } });
  const copyMonToAll = () => {
    const mon = value.mon;
    onChange(Object.fromEntries(WEEKDAYS.map((d) => [d, { ...mon }])) as Hours);
  };
  return (
    <div className='flex flex-col gap-2'>
      {WEEKDAYS.map((day) => (
        <div key={day} className='grid grid-cols-[3rem_auto_1fr] items-center gap-3 text-sm'>
          <span className='font-medium'>{td(day)}</span>
          <label className='flex items-center gap-2'>
            <Switch
              checked={!value[day].closed}
              onCheckedChange={(open) => set(day, { closed: !open })}
              disabled={disabled}
              aria-label={`${td(day)}: ${t('open')}`}
            />
            <span
              className={cn('text-muted-foreground w-16', value[day].closed && 'text-status-error')}
            >
              {value[day].closed ? t('closed') : t('open')}
            </span>
          </label>
          <div className={cn('flex items-center gap-2', value[day].closed && 'invisible')}>
            <Input
              type='time'
              value={value[day].open}
              onChange={(e) => set(day, { open: e.target.value })}
              disabled={disabled}
              className='h-8 w-28'
              aria-label={`${td(day)}: ${t('from')}`}
            />
            <span>—</span>
            <Input
              type='time'
              value={value[day].close}
              onChange={(e) => set(day, { close: e.target.value })}
              disabled={disabled}
              className='h-8 w-28'
              aria-label={`${td(day)}: ${t('to')}`}
            />
          </div>
        </div>
      ))}
      <Button
        type='button'
        variant='ghost'
        size='sm'
        className='w-fit'
        onClick={copyMonToAll}
        disabled={disabled}
      >
        <Icons.copy className='size-4' /> {t('copyMonday')}
      </Button>
    </div>
  );
}

type Special = LocationFormValues['special_hours'];

/** Special hours: date + closed / interval (holidays, inventory days). */
export function SpecialHoursEditor({
  value,
  onChange,
  disabled
}: {
  value: Special;
  onChange: (v: Special) => void;
  disabled?: boolean;
}) {
  const t = useTranslations('locations.form.hours');
  const update = (i: number, patch: Partial<Special[number]>) =>
    onChange(value.map((s, k) => (k === i ? { ...s, ...patch } : s)));
  return (
    <div className='flex flex-col gap-2'>
      {value.map((s, i) => (
        <div key={i} className='grid grid-cols-[10rem_auto_1fr_auto] items-center gap-3 text-sm'>
          <Input
            type='date'
            value={s.date}
            onChange={(e) => update(i, { date: e.target.value })}
            disabled={disabled}
            className='h-8'
            aria-label={t('date')}
          />
          <label className='flex items-center gap-2'>
            <Switch
              checked={!s.closed}
              onCheckedChange={(open) => update(i, { closed: !open })}
              disabled={disabled}
              aria-label={t('open')}
            />
            <span className='text-muted-foreground w-16'>{s.closed ? t('closed') : t('open')}</span>
          </label>
          <div className={cn('flex items-center gap-2', s.closed && 'invisible')}>
            <Input
              type='time'
              value={s.open}
              onChange={(e) => update(i, { open: e.target.value })}
              disabled={disabled}
              className='h-8 w-28'
              aria-label={t('from')}
            />
            <span>—</span>
            <Input
              type='time'
              value={s.close}
              onChange={(e) => update(i, { close: e.target.value })}
              disabled={disabled}
              className='h-8 w-28'
              aria-label={t('to')}
            />
          </div>
          <Button
            type='button'
            variant='ghost'
            size='icon'
            className='size-8'
            onClick={() => onChange(value.filter((_, k) => k !== i))}
            disabled={disabled}
            aria-label={t('remove')}
          >
            <Icons.trash className='size-4' />
          </Button>
        </div>
      ))}
      <Button
        type='button'
        variant='outline'
        size='sm'
        className='w-fit'
        onClick={() =>
          onChange([...value, { date: '', closed: true, open: '10:00', close: '18:00' }])
        }
        disabled={disabled}
      >
        <Icons.add className='size-4' /> {t('addSpecial')}
      </Button>
    </div>
  );
}

type Phones = LocationFormValues['phones'];
const PHONE_KINDS = ['main', 'additional', 'fax', 'whatsapp'] as const;

export function PhonesEditor({
  value,
  onChange,
  errors,
  disabled
}: {
  value: Phones;
  onChange: (v: Phones) => void;
  errors?: (string | undefined)[];
  disabled?: boolean;
}) {
  const t = useTranslations('locations.form.contacts');
  const update = (i: number, patch: Partial<Phones[number]>) =>
    onChange(value.map((p, k) => (k === i ? { ...p, ...patch } : p)));
  return (
    <div className='flex flex-col gap-2'>
      {value.map((p, i) => (
        <div key={i} className='flex flex-col gap-1'>
          <div className='flex items-center gap-2'>
            <Input
              value={p.e164}
              onChange={(e) => update(i, { e164: e.target.value })}
              placeholder='+74951234567'
              inputMode='tel'
              disabled={disabled}
              className='h-8 w-48'
              aria-label={t('phone')}
              aria-invalid={!!errors?.[i]}
            />
            <Select
              value={p.kind}
              onValueChange={(kind) => update(i, { kind: kind as Phones[number]['kind'] })}
              disabled={disabled}
            >
              <SelectTrigger className='h-8 w-40' aria-label={t('phoneKind')}>
                <SelectValue>
                  {(k: (typeof PHONE_KINDS)[number]) => t(`phoneKinds.${k}`)}
                </SelectValue>
              </SelectTrigger>
              <SelectContent>
                {PHONE_KINDS.map((k) => (
                  <SelectItem key={k} value={k}>
                    {t(`phoneKinds.${k}`)}
                  </SelectItem>
                ))}
              </SelectContent>
            </Select>
            <Button
              type='button'
              variant='ghost'
              size='icon'
              className='size-8'
              onClick={() => onChange(value.filter((_, k) => k !== i))}
              disabled={disabled || value.length === 1}
              aria-label={t('removePhone')}
            >
              <Icons.trash className='size-4' />
            </Button>
          </div>
          {errors?.[i] && <p className='text-status-error text-xs'>{errors[i]}</p>}
        </div>
      ))}
      <Button
        type='button'
        variant='outline'
        size='sm'
        className='w-fit'
        onClick={() => onChange([...value, { e164: '', kind: 'additional' }])}
        disabled={disabled}
      >
        <Icons.add className='size-4' /> {t('addPhone')}
      </Button>
    </div>
  );
}

type Social = LocationFormValues['social'];
const SOCIAL_KINDS = [
  'vk',
  'telegram',
  'instagram',
  'facebook',
  'youtube',
  'tiktok',
  'other'
] as const;

export function SocialEditor({
  value,
  onChange,
  disabled
}: {
  value: Social;
  onChange: (v: Social) => void;
  disabled?: boolean;
}) {
  const t = useTranslations('locations.form.contacts');
  const update = (i: number, patch: Partial<Social[number]>) =>
    onChange(value.map((p, k) => (k === i ? { ...p, ...patch } : p)));
  return (
    <div className='flex flex-col gap-2'>
      {value.map((s, i) => (
        <div key={i} className='flex items-center gap-2'>
          <Select
            value={s.kind}
            onValueChange={(kind) => update(i, { kind: kind as Social[number]['kind'] })}
            disabled={disabled}
          >
            <SelectTrigger className='h-8 w-36' aria-label={t('socialKind')}>
              <SelectValue>
                {(k: (typeof SOCIAL_KINDS)[number]) => t(`socialKinds.${k}`)}
              </SelectValue>
            </SelectTrigger>
            <SelectContent>
              {SOCIAL_KINDS.map((k) => (
                <SelectItem key={k} value={k}>
                  {t(`socialKinds.${k}`)}
                </SelectItem>
              ))}
            </SelectContent>
          </Select>
          <Input
            value={s.url}
            onChange={(e) => update(i, { url: e.target.value })}
            placeholder='https://'
            disabled={disabled}
            className='h-8 flex-1'
            aria-label={t('socialUrl')}
          />
          <Button
            type='button'
            variant='ghost'
            size='icon'
            className='size-8'
            onClick={() => onChange(value.filter((_, k) => k !== i))}
            disabled={disabled}
            aria-label={t('removeSocial')}
          >
            <Icons.trash className='size-4' />
          </Button>
        </div>
      ))}
      <Button
        type='button'
        variant='outline'
        size='sm'
        className='w-fit'
        onClick={() => onChange([...value, { kind: 'vk', url: '' }])}
        disabled={disabled}
      >
        <Icons.add className='size-4' /> {t('addSocial')}
      </Button>
    </div>
  );
}

type Overrides = LocationFormValues['platform_overrides'];

export function OverridesEditor({
  value,
  onChange,
  platforms,
  disabled
}: {
  value: Overrides;
  onChange: (v: Overrides) => void;
  platforms: { id: string; name: string }[];
  disabled?: boolean;
}) {
  const t = useTranslations('locations.form.overrides');
  const update = (i: number, patch: Partial<Overrides[number]>) =>
    onChange(value.map((p, k) => (k === i ? { ...p, ...patch } : p)));
  const free = platforms.filter((p) => !value.some((o) => o.platform_id === p.id));
  return (
    <div className='flex flex-col gap-2'>
      {value.map((o, i) => (
        <div key={i} className='grid grid-cols-[12rem_1fr_auto] items-center gap-2'>
          <Label className='truncate'>
            {platforms.find((p) => p.id === o.platform_id)?.name ?? o.platform_id}
          </Label>
          <Input
            value={o.name}
            onChange={(e) => update(i, { name: e.target.value })}
            placeholder={t('namePlaceholder')}
            disabled={disabled}
            className='h-8'
            aria-label={t('name')}
          />
          <Button
            type='button'
            variant='ghost'
            size='icon'
            className='size-8'
            onClick={() => onChange(value.filter((_, k) => k !== i))}
            disabled={disabled}
            aria-label={t('remove')}
          >
            <Icons.trash className='size-4' />
          </Button>
        </div>
      ))}
      {free.length > 0 && (
        <Select
          value=''
          onValueChange={(id) => id && onChange([...value, { platform_id: id, name: '' }])}
          disabled={disabled}
        >
          <SelectTrigger className='h-8 w-64' aria-label={t('add')}>
            <SelectValue placeholder={t('add')}>{() => t('add')}</SelectValue>
          </SelectTrigger>
          <SelectContent>
            {free.map((p) => (
              <SelectItem key={p.id} value={p.id}>
                {p.name}
              </SelectItem>
            ))}
          </SelectContent>
        </Select>
      )}
    </div>
  );
}
