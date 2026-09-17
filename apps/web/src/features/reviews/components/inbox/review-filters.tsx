'use client';

import { useQuery } from '@tanstack/react-query';
import { useFormatter, useTranslations } from 'next-intl';
import { useQueryStates } from 'nuqs';
import { Icons } from '@/components/icons';
import { Badge } from '@/components/ui/badge';
import { Button } from '@/components/ui/button';
import { Calendar } from '@/components/ui/calendar';
import { Checkbox } from '@/components/ui/checkbox';
import { Label } from '@/components/ui/label';
import { Popover, PopoverContent, PopoverTrigger } from '@/components/ui/popover';
import { ScrollArea } from '@/components/ui/scroll-area';
import {
  Sheet,
  SheetContent,
  SheetDescription,
  SheetHeader,
  SheetTitle,
  SheetTrigger
} from '@/components/ui/sheet';
import { ToggleGroup, ToggleGroupItem } from '@/components/ui/toggle-group';
import { LocationPicker } from '@/features/locations';
import { platformsQueryOptions } from '@/features/sources';
import { tagsQueryOptions } from '@/features/tags';
import { usersQueryOptions } from '@/features/users';
import { useDateFnsLocale } from '@/lib/i18n/date-locale';
import { cn } from '@/lib/utils';
import {
  countActiveFilters,
  FILTER_KEYS,
  PLATFORM_STATES,
  RATINGS,
  reviewsSearchParams,
  SENTIMENTS,
  WORKFLOW_STATUSES
} from '../../searchparams';

function iso(d: Date) {
  return d.toISOString().slice(0, 10);
}

function Group({ title, children }: { title: string; children: React.ReactNode }) {
  return (
    <fieldset className='flex flex-col gap-1.5'>
      <legend className='text-muted-foreground mb-1.5 text-xs font-medium uppercase'>
        {title}
      </legend>
      {children}
    </fieldset>
  );
}

function CheckRow({
  id,
  label,
  checked,
  onChange,
  extra
}: {
  id: string;
  label: React.ReactNode;
  checked: boolean;
  onChange: (v: boolean) => void;
  extra?: React.ReactNode;
}) {
  return (
    <div className='flex items-center gap-2'>
      <Checkbox id={id} checked={checked} onCheckedChange={(v) => onChange(!!v)} />
      <Label htmlFor={id} className='flex-1 cursor-pointer text-sm font-normal'>
        {label}
      </Label>
      {extra}
    </div>
  );
}

function TriState({
  value,
  onChange,
  yes,
  no,
  any
}: {
  value: boolean | null;
  onChange: (v: boolean | null) => void;
  yes: string;
  no: string;
  any: string;
}) {
  const current = value === null ? 'any' : value ? 'yes' : 'no';
  return (
    <ToggleGroup
      value={[current]}
      onValueChange={(v) => {
        const next = (Array.isArray(v) ? v[0] : v) as string | undefined;
        onChange(next === 'yes' ? true : next === 'no' ? false : null);
      }}
      className='w-full'
    >
      <ToggleGroupItem value='any' size='sm' className='flex-1 text-xs'>
        {any}
      </ToggleGroupItem>
      <ToggleGroupItem value='yes' size='sm' className='flex-1 text-xs'>
        {yes}
      </ToggleGroupItem>
      <ToggleGroupItem value='no' size='sm' className='flex-1 text-xs'>
        {no}
      </ToggleGroupItem>
    </ToggleGroup>
  );
}

/** Filter groups of the inbox (SCR-3); every control writes to nuqs (`shallow`). */
export function ReviewFiltersPanel({ className }: { className?: string }) {
  const t = useTranslations('reviews.filters');
  const tw = useTranslations('reviews.workflow');
  const ts = useTranslations('reviews.detail.sentiment');
  const format = useFormatter();
  const dateLocale = useDateFnsLocale();
  const [params, setParams] = useQueryStates(reviewsSearchParams, { shallow: true });
  const { data: platforms } = useQuery(platformsQueryOptions());
  const { data: users } = useQuery(usersQueryOptions());
  const { data: tags } = useQuery(tagsQueryOptions());
  const active = countActiveFilters(params);

  const toggleIn = <
    K extends
      | 'platform'
      | 'rating'
      | 'assignee'
      | 'repliedBy'
      | 'status'
      | 'tag'
      | 'state'
      | 'sentiment'
  >(
    key: K,
    value: string,
    on: boolean
  ) => {
    const list = params[key] as string[];
    const next = on ? [...new Set([...list, value])] : list.filter((x) => x !== value);
    void setParams({ [key]: next } as never);
  };

  return (
    <div className={cn('flex h-full flex-col', className)} data-testid='review-filters'>
      <div className='flex items-center justify-between border-b px-3 py-2'>
        <span className='text-sm font-semibold'>
          {t('title')}
          {active > 0 && (
            <Badge variant='secondary' className='ml-2'>
              {active}
            </Badge>
          )}
        </span>
        <Button
          variant='ghost'
          size='sm'
          disabled={!active}
          onClick={() =>
            void setParams(Object.fromEntries(FILTER_KEYS.map((k) => [k, null])) as never)
          }
        >
          {t('clear')}
        </Button>
      </div>
      <ScrollArea className='flex-1'>
        <div className='flex flex-col gap-5 p-3'>
          <Group title={t('period')}>
            <Popover>
              <PopoverTrigger
                render={
                  <Button variant='outline' size='sm' className='justify-start font-normal' />
                }
              >
                <Icons.calendar className='size-3.5' />
                {params.from || params.to
                  ? `${params.from ? format.dateTime(new Date(params.from), 'short') : '…'} — ${params.to ? format.dateTime(new Date(params.to), 'short') : '…'}`
                  : t('any')}
              </PopoverTrigger>
              <PopoverContent className='w-auto p-0' align='start'>
                <Calendar
                  mode='range'
                  locale={dateLocale}
                  numberOfMonths={2}
                  selected={{
                    from: params.from ? new Date(params.from) : undefined,
                    to: params.to ? new Date(params.to) : undefined
                  }}
                  disabled={{ after: new Date() }}
                  onSelect={(range) =>
                    void setParams({
                      from: range?.from ? iso(range.from) : null,
                      to: range?.to ? iso(range.to) : range?.from ? iso(range.from) : null
                    })
                  }
                />
                <div className='flex justify-end border-t p-2'>
                  <Button
                    variant='ghost'
                    size='sm'
                    onClick={() => void setParams({ from: null, to: null })}
                  >
                    {t('clear')}
                  </Button>
                </div>
              </PopoverContent>
            </Popover>
          </Group>

          <Group title={t('platform')}>
            {(platforms?.items ?? []).map((p) => (
              <CheckRow
                key={p.id}
                id={`f-platform-${p.id}`}
                label={p.name}
                checked={params.platform.includes(p.id)}
                onChange={(v) => toggleIn('platform', p.id, v)}
              />
            ))}
          </Group>

          <Group title={t('rating')}>
            {RATINGS.map((r) => (
              <CheckRow
                key={r}
                id={`f-rating-${r}`}
                label={r === 'none' ? t('ratingNone') : t('stars', { count: Number(r) })}
                checked={params.rating.includes(r)}
                onChange={(v) => toggleIn('rating', r, v)}
              />
            ))}
          </Group>

          <Group title={t('status')}>
            {WORKFLOW_STATUSES.map((s) => (
              <CheckRow
                key={s}
                id={`f-status-${s}`}
                label={tw(s)}
                checked={params.status.includes(s)}
                onChange={(v) => toggleIn('status', s, v)}
              />
            ))}
          </Group>

          <Group title={t('hasReply')}>
            <TriState
              value={params.hasReply}
              onChange={(v) => void setParams({ hasReply: v })}
              yes={t('hasReplyYes')}
              no={t('hasReplyNo')}
              any={t('any')}
            />
          </Group>

          <Group title={t('assignee')}>
            {(users?.items ?? []).map((m) => (
              <CheckRow
                key={m.user.id}
                id={`f-assignee-${m.user.id}`}
                label={m.user.name}
                checked={params.assignee.includes(m.user.id)}
                onChange={(v) => toggleIn('assignee', m.user.id, v)}
              />
            ))}
          </Group>

          <Group title={t('repliedBy')}>
            {(users?.items ?? []).map((m) => (
              <CheckRow
                key={m.user.id}
                id={`f-replied-${m.user.id}`}
                label={m.user.name}
                checked={params.repliedBy.includes(m.user.id)}
                onChange={(v) => toggleIn('repliedBy', m.user.id, v)}
              />
            ))}
          </Group>

          <Group title={t('tags')}>
            {(tags?.items ?? []).map((tag) => (
              <CheckRow
                key={tag.id}
                id={`f-tag-${tag.id}`}
                label={
                  <span className='inline-flex items-center gap-1.5'>
                    <span className='size-2 rounded-full' style={{ backgroundColor: tag.color }} />
                    {tag.name}
                  </span>
                }
                checked={params.tag.includes(tag.id)}
                onChange={(v) => toggleIn('tag', tag.id, v)}
              />
            ))}
          </Group>

          <Group title={t('hasText')}>
            <TriState
              value={params.hasText}
              onChange={(v) => void setParams({ hasText: v })}
              yes={t('hasTextYes')}
              no={t('hasTextNo')}
              any={t('any')}
            />
          </Group>

          <Group title={t('state')}>
            {PLATFORM_STATES.map((s) => (
              <CheckRow
                key={s}
                id={`f-state-${s}`}
                label={t(`state_${s}`)}
                checked={params.state.includes(s)}
                onChange={(v) => toggleIn('state', s, v)}
              />
            ))}
          </Group>

          <Group title={t('sentiment')}>
            {SENTIMENTS.map((s) => (
              <CheckRow
                key={s}
                id={`f-sentiment-${s}`}
                label={ts(s)}
                checked={params.sentiment.includes(s)}
                onChange={(v) => toggleIn('sentiment', s, v)}
              />
            ))}
          </Group>

          <Group title={t('location')}>
            <LocationPicker
              value={{ location_ids: params.location, group_ids: [] }}
              onChange={(v) =>
                void setParams({ location: v.location_ids.length ? v.location_ids : null })
              }
              allowGroups={false}
            />
          </Group>
        </div>
      </ScrollArea>
    </div>
  );
}

/** Below 1536px the panel lives in a Sheet opened from the header. */
export function ReviewFiltersSheet() {
  const t = useTranslations('reviews.filters');
  const [params] = useQueryStates(reviewsSearchParams, { shallow: true });
  const active = countActiveFilters(params);
  return (
    <Sheet>
      <SheetTrigger render={<Button variant='outline' size='sm' className='2xl:hidden' />}>
        <Icons.adjustments className='size-4' />
        {t('title')}
        {active > 0 && <Badge variant='secondary'>{active}</Badge>}
      </SheetTrigger>
      <SheetContent className='w-full p-0 sm:max-w-md'>
        <SheetHeader className='sr-only'>
          <SheetTitle>{t('title')}</SheetTitle>
          <SheetDescription>{t('active', { count: active })}</SheetDescription>
        </SheetHeader>
        {/* In the sheet the close button sits over the panel header: keep «Очистить» clear of it. */}
        <ReviewFiltersPanel className='h-full [&>div:first-child]:pr-14' />
      </SheetContent>
    </Sheet>
  );
}
