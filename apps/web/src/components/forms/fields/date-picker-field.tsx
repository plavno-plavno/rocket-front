'use client';

import { useTranslations } from 'next-intl';
import { useDateFnsLocale } from '@/lib/i18n/date-locale';

import { Button } from '@/components/ui/button';
import { Calendar } from '@/components/ui/calendar';
import { Field, FieldDescription, FieldError, FieldLabel } from '@/components/ui/field';
import { Popover, PopoverContent, PopoverTrigger } from '@/components/ui/popover';
import { Icons } from '@/components/icons';
import { cn } from '@/lib/utils';
import { format } from 'date-fns';
import type { DateRange } from 'react-day-picker';
import { useFieldContext, useFieldInvalid, type BaseFieldProps } from '@/lib/form-context';

/** Single date — Popover + Calendar per the shadcn date-picker pattern. */
export function DatePickerField({
  label,
  description,
  required,
  placeholder,
  disabledDates
}: BaseFieldProps & {
  placeholder?: string;
  disabledDates?: (date: Date) => boolean;
}) {
  const t = useTranslations('ui');
  const dateLocale = useDateFnsLocale();
  const field = useFieldContext<Date | undefined>();
  const isInvalid = useFieldInvalid();

  return (
    <Field data-invalid={isInvalid}>
      <FieldLabel htmlFor={field.name}>
        {label}
        {required && ' *'}
      </FieldLabel>
      <Popover>
        <PopoverTrigger
          render={
            <Button
              id={field.name}
              variant='outline'
              aria-invalid={isInvalid}
              aria-describedby={isInvalid ? `${field.name}-error` : undefined}
              className={cn(
                'w-full justify-start text-left font-normal',
                !field.state.value && 'text-muted-foreground'
              )}
            />
          }
        >
          <Icons.calendar className='mr-2 h-4 w-4' />
          {field.state.value ? (
            format(field.state.value, 'PPP', { locale: dateLocale })
          ) : (
            <span>{placeholder ?? t('pickDate')}</span>
          )}
        </PopoverTrigger>
        <PopoverContent className='w-auto p-0' align='start'>
          <Calendar
            locale={dateLocale}
            mode='single'
            selected={field.state.value}
            onSelect={(date) => field.handleChange(date)}
            disabled={disabledDates}
            autoFocus
          />
        </PopoverContent>
      </Popover>
      {description && <FieldDescription>{description}</FieldDescription>}
      {isInvalid && <FieldError id={`${field.name}-error`} errors={field.state.meta.errors} />}
    </Field>
  );
}

/** Date range — two-month Calendar in range mode. */
export function DateRangeField({
  label,
  description,
  required,
  placeholder
}: BaseFieldProps & { placeholder?: string }) {
  const t = useTranslations('ui');
  const dateLocale = useDateFnsLocale();
  const field = useFieldContext<DateRange | undefined>();
  const isInvalid = useFieldInvalid();
  const range = field.state.value;

  return (
    <Field data-invalid={isInvalid}>
      <FieldLabel htmlFor={field.name}>
        {label}
        {required && ' *'}
      </FieldLabel>
      <Popover>
        <PopoverTrigger
          render={
            <Button
              id={field.name}
              variant='outline'
              aria-invalid={isInvalid}
              aria-describedby={isInvalid ? `${field.name}-error` : undefined}
              className={cn(
                'w-full justify-start text-left font-normal',
                !range?.from && 'text-muted-foreground'
              )}
            />
          }
        >
          <Icons.calendar className='mr-2 h-4 w-4' />
          {range?.from ? (
            range.to ? (
              <>
                {format(range.from, 'd MMM y', { locale: dateLocale })} —{' '}
                {format(range.to, 'd MMM y', { locale: dateLocale })}
              </>
            ) : (
              format(range.from, 'd MMM y', { locale: dateLocale })
            )
          ) : (
            <span>{placeholder ?? t('pickDateRange')}</span>
          )}
        </PopoverTrigger>
        <PopoverContent className='w-auto p-0' align='start'>
          <Calendar
            locale={dateLocale}
            mode='range'
            selected={range}
            onSelect={field.handleChange}
            numberOfMonths={2}
            autoFocus
          />
        </PopoverContent>
      </Popover>
      {description && <FieldDescription>{description}</FieldDescription>}
      {isInvalid && <FieldError id={`${field.name}-error`} errors={field.state.meta.errors} />}
    </Field>
  );
}
