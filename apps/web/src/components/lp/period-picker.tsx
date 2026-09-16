'use client';

import { useFormatter, useTranslations } from 'next-intl';
import { Button } from '@/components/ui/button';
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue
} from '@/components/ui/select';
import { ToggleGroup, ToggleGroupItem } from '@/components/ui/toggle-group';
import { cn } from '@/lib/utils';

export type PeriodPreset = 'day' | 'week' | '30d' | 'month' | 'quarter';
export type Granularity = 'day' | 'week' | 'month';

export interface PeriodValue {
  from: string;
  to: string;
  granularity: Granularity;
  compare?: { from: string; to: string } | null;
}

export interface PeriodPickerProps {
  value: PeriodValue;
  onChange: (value: PeriodValue) => void;
  /** Show the granularity switch («По дням / неделям / месяцам»). */
  withGranularity?: boolean;
  /** Show «Сравнить периоды». */
  withCompare?: boolean;
  className?: string;
}

const PRESETS: PeriodPreset[] = ['day', 'week', '30d', 'month', 'quarter'];

function iso(d: Date) {
  return d.toISOString().slice(0, 10);
}

/** Computes `[from, to]` for a preset relative to today (tenant timezone handled by the caller). */
export function presetRange(
  preset: PeriodPreset,
  today = new Date()
): { from: string; to: string } {
  const to = new Date(today);
  const from = new Date(today);
  switch (preset) {
    case 'day':
      break;
    case 'week':
      from.setDate(from.getDate() - 6);
      break;
    case '30d':
      from.setDate(from.getDate() - 29);
      break;
    case 'month':
      from.setDate(1);
      break;
    case 'quarter':
      from.setMonth(Math.floor(from.getMonth() / 3) * 3, 1);
      break;
  }
  return { from: iso(from), to: iso(to) };
}

/** Previous period of the same length, ending the day before `from`. */
export function previousPeriod(from: string, to: string): { from: string; to: string } {
  const f = new Date(from);
  const t = new Date(to);
  const days = Math.round((t.getTime() - f.getTime()) / 86_400_000) + 1;
  const prevTo = new Date(f);
  prevTo.setDate(prevTo.getDate() - 1);
  const prevFrom = new Date(prevTo);
  prevFrom.setDate(prevFrom.getDate() - days + 1);
  return { from: iso(prevFrom), to: iso(prevTo) };
}

/**
 * Period control (SCR-6, SDD-01 §4.1): presets, explicit range, granularity, compare toggle.
 * Foundation version uses native date inputs; UI-DS replaces them with the calendar popover.
 */
export function PeriodPicker({
  value,
  onChange,
  withGranularity = false,
  withCompare = false,
  className
}: PeriodPickerProps) {
  const t = useTranslations('period');
  const format = useFormatter();
  const activePreset = PRESETS.find((p) => {
    const r = presetRange(p);
    return r.from === value.from && r.to === value.to;
  });

  return (
    <div className={cn('flex flex-wrap items-center gap-2', className)} data-testid='period-picker'>
      <ToggleGroup
        value={activePreset ? [activePreset] : []}
        onValueChange={(v) => {
          const preset = (Array.isArray(v) ? v[0] : v) as PeriodPreset | undefined;
          if (preset)
            onChange({
              ...value,
              ...presetRange(preset),
              compare: value.compare
                ? previousPeriod(presetRange(preset).from, presetRange(preset).to)
                : value.compare
            });
        }}
        aria-label={t('presets')}
      >
        {PRESETS.map((p) => (
          <ToggleGroupItem key={p} value={p} size='sm' className='px-2.5 text-xs'>
            {t(`preset.${p}`)}
          </ToggleGroupItem>
        ))}
      </ToggleGroup>
      <div className='text-muted-foreground flex items-center gap-1 text-xs'>
        <input
          type='date'
          aria-label={t('from')}
          value={value.from}
          max={value.to}
          onChange={(e) => onChange({ ...value, from: e.target.value })}
          className='bg-background h-8 rounded-md border px-2 text-xs'
        />
        —
        <input
          type='date'
          aria-label={t('to')}
          value={value.to}
          min={value.from}
          onChange={(e) => onChange({ ...value, to: e.target.value })}
          className='bg-background h-8 rounded-md border px-2 text-xs'
        />
      </div>
      {withGranularity && (
        <Select
          value={value.granularity}
          onValueChange={(g) => onChange({ ...value, granularity: g as Granularity })}
        >
          <SelectTrigger size='sm' className='h-8 w-36 text-xs' aria-label={t('granularityLabel')}>
            <SelectValue />
          </SelectTrigger>
          <SelectContent>
            {(['day', 'week', 'month'] as const).map((g) => (
              <SelectItem key={g} value={g}>
                {t(`granularity.${g}`)}
              </SelectItem>
            ))}
          </SelectContent>
        </Select>
      )}
      {withCompare && (
        <Button
          variant={value.compare ? 'secondary' : 'outline'}
          size='sm'
          className='h-8 text-xs'
          aria-pressed={!!value.compare}
          onClick={() =>
            onChange({
              ...value,
              compare: value.compare ? null : previousPeriod(value.from, value.to)
            })
          }
        >
          {t('compare')}
          {value.compare && (
            <span className='text-muted-foreground ml-1'>
              {format.dateTime(new Date(value.compare.from), 'short')} —{' '}
              {format.dateTime(new Date(value.compare.to), 'short')}
            </span>
          )}
        </Button>
      )}
    </div>
  );
}
