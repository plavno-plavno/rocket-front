'use client';

import { useMutation, useQuery, useQueryClient } from '@tanstack/react-query';
import { useTranslations } from 'next-intl';
import { useEffect, useState } from 'react';
import { toast } from 'sonner';
import { Icons } from '@/components/icons';
import { Button } from '@/components/ui/button';
import {
  Card,
  CardContent,
  CardDescription,
  CardFooter,
  CardHeader,
  CardTitle
} from '@/components/ui/card';
import { Checkbox } from '@/components/ui/checkbox';
import { Field, FieldDescription, FieldLabel } from '@/components/ui/field';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { LinkButton } from '@/components/ui/link-button';
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue
} from '@/components/ui/select';
import { Skeleton } from '@/components/ui/skeleton';
import { Switch } from '@/components/ui/switch';
import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow
} from '@/components/ui/table';
import {
  notificationSettingsQueryOptions,
  updateNotificationSettingsMutation,
  type NotificationSettings
} from '@/features/notifications';
import { isApiError } from '@/lib/api';

type Rule = NotificationSettings['rules'][number];
type Channel = Rule['channels'][number];
type Digest = NonNullable<NonNullable<NotificationSettings['channels']['email']>['digest']>;

const CHANNELS: Channel[] = ['email', 'telegram', 'web_push'];
const DIGESTS: Digest[] = ['instant', 'daily', 'weekly'];
const CHANNEL_ICON: Record<Channel, keyof typeof Icons> = {
  email: 'mail',
  telegram: 'telegram',
  web_push: 'mobile'
};

const errorText = (e: unknown) => (isApiError(e) ? (e.detail ?? e.message) : (e as Error).message);

/** S-SET-04 «Уведомления»: rules × channels matrix, channel settings, quiet hours — one PUT. */
export function NotificationSettingsForm() {
  const t = useTranslations('settings.notifications');
  const tn = useTranslations('notifications.types');
  const queryClient = useQueryClient();
  const { data, isPending } = useQuery(notificationSettingsQueryOptions());
  const save = useMutation(updateNotificationSettingsMutation(queryClient));
  const [draft, setDraft] = useState<NotificationSettings | null>(null);

  useEffect(() => {
    if (data) setDraft(structuredClone(data));
  }, [data]);

  if (isPending || !draft) {
    return (
      <div className='flex flex-col gap-4'>
        <Skeleton className='h-64' />
        <Skeleton className='h-40' />
      </div>
    );
  }

  const dirty = JSON.stringify(draft) !== JSON.stringify(data);
  const setRule = (type: Rule['type'], patch: Partial<Rule>) =>
    setDraft({
      ...draft,
      rules: draft.rules.map((r) => (r.type === type ? { ...r, ...patch } : r))
    });
  const toggleChannel = (rule: Rule, channel: Channel) =>
    setRule(rule.type, {
      channels: rule.channels.includes(channel)
        ? rule.channels.filter((c) => c !== channel)
        : [...rule.channels, channel]
    });
  const channelEnabled = (c: Channel) => draft.channels[c]?.enabled ?? false;
  const setChannel = <C extends Channel>(
    c: C,
    patch: Partial<NonNullable<NotificationSettings['channels'][C]>>
  ) =>
    setDraft({
      ...draft,
      channels: { ...draft.channels, [c]: { ...draft.channels[c], ...patch } }
    });

  const submit = () =>
    save.mutate(
      { body: draft },
      {
        onSuccess: () => toast.success(t('saved')),
        onError: (e) => toast.error(errorText(e))
      }
    );

  return (
    <div className='flex flex-col gap-6' data-testid='notification-settings'>
      <Card>
        <CardHeader>
          <CardTitle>{t('rules.title')}</CardTitle>
          <CardDescription>{t('rules.description')}</CardDescription>
        </CardHeader>
        <CardContent className='overflow-x-auto px-0'>
          <Table data-testid='rules-matrix'>
            <TableHeader>
              <TableRow>
                <TableHead className='pl-6'>{t('rules.event')}</TableHead>
                <TableHead className='w-20 text-center'>{t('rules.enabled')}</TableHead>
                {CHANNELS.map((c) => {
                  const Icon = Icons[CHANNEL_ICON[c]];
                  return (
                    <TableHead key={c} className='w-24 text-center'>
                      <span className='inline-flex items-center gap-1'>
                        <Icon className='size-3.5' /> {t(`channels.${c}.short`)}
                      </span>
                    </TableHead>
                  );
                })}
                <TableHead className='w-36 pr-6'>{t('rules.threshold')}</TableHead>
              </TableRow>
            </TableHeader>
            <TableBody>
              {draft.rules.map((rule) => (
                <TableRow key={rule.type} data-rule={rule.type}>
                  <TableCell className='pl-6'>
                    <div className='font-medium'>{tn(`${rule.type}.title`)}</div>
                    <div className='text-muted-foreground text-xs'>{tn(`${rule.type}.hint`)}</div>
                  </TableCell>
                  <TableCell className='text-center'>
                    <Switch
                      checked={rule.enabled}
                      onCheckedChange={(v) => setRule(rule.type, { enabled: v })}
                      aria-label={t('rules.enabledFor', { event: tn(`${rule.type}.title`) })}
                    />
                  </TableCell>
                  {CHANNELS.map((c) => (
                    <TableCell key={c} className='text-center'>
                      <Checkbox
                        checked={rule.channels.includes(c)}
                        disabled={!rule.enabled || !channelEnabled(c)}
                        onCheckedChange={() => toggleChannel(rule, c)}
                        aria-label={`${tn(`${rule.type}.title`)} — ${t(`channels.${c}.title`)}`}
                      />
                    </TableCell>
                  ))}
                  <TableCell className='pr-6'>
                    {rule.type === 'unanswered_review' ? (
                      <div className='flex items-center gap-1'>
                        <Input
                          type='number'
                          min={1}
                          max={168}
                          className='h-8 w-20'
                          value={rule.threshold_hours ?? ''}
                          disabled={!rule.enabled}
                          onChange={(e) =>
                            setRule(rule.type, {
                              threshold_hours: e.target.value ? Number(e.target.value) : null
                            })
                          }
                          aria-label={t('rules.threshold')}
                        />
                        <span className='text-muted-foreground text-xs'>{t('rules.hours')}</span>
                      </div>
                    ) : (
                      <span className='text-muted-foreground text-xs'>—</span>
                    )}
                  </TableCell>
                </TableRow>
              ))}
            </TableBody>
          </Table>
        </CardContent>
      </Card>

      <Card>
        <CardHeader>
          <CardTitle>{t('channels.title')}</CardTitle>
          <CardDescription>{t('channels.description')}</CardDescription>
        </CardHeader>
        <CardContent className='flex flex-col gap-5'>
          <div className='flex items-start justify-between gap-4'>
            <div className='flex items-start gap-3'>
              <Icons.mail className='text-muted-foreground mt-0.5 size-5' />
              <div>
                <Label htmlFor='ch-email'>{t('channels.email.title')}</Label>
                <p className='text-muted-foreground text-sm'>{t('channels.email.hint')}</p>
                {channelEnabled('email') && (
                  <Field className='mt-3 max-w-xs'>
                    <FieldLabel htmlFor='ch-email-digest'>{t('channels.email.digest')}</FieldLabel>
                    <Select
                      value={draft.channels.email?.digest ?? 'instant'}
                      onValueChange={(v) =>
                        setChannel('email', { digest: (v as Digest) ?? 'instant' })
                      }
                    >
                      <SelectTrigger id='ch-email-digest' aria-label={t('channels.email.digest')}>
                        <SelectValue>
                          {(v: string) => t(`channels.email.digests.${v as Digest}`)}
                        </SelectValue>
                      </SelectTrigger>
                      <SelectContent>
                        {DIGESTS.map((d) => (
                          <SelectItem key={d} value={d}>
                            {t(`channels.email.digests.${d}`)}
                          </SelectItem>
                        ))}
                      </SelectContent>
                    </Select>
                  </Field>
                )}
              </div>
            </div>
            <Switch
              id='ch-email'
              checked={channelEnabled('email')}
              onCheckedChange={(v) => setChannel('email', { enabled: v })}
            />
          </div>

          <div className='flex items-start justify-between gap-4'>
            <div className='flex items-start gap-3'>
              <Icons.telegram className='text-muted-foreground mt-0.5 size-5' />
              <div>
                <Label htmlFor='ch-telegram'>{t('channels.telegram.title')}</Label>
                <p className='text-muted-foreground text-sm'>{t('channels.telegram.hint')}</p>
                {channelEnabled('telegram') && (
                  <div className='mt-3 flex flex-wrap items-center gap-2'>
                    {draft.channels.telegram?.linked ? (
                      <span className='text-status-synced inline-flex items-center gap-1 text-sm'>
                        <Icons.circleCheck className='size-4' /> {t('channels.telegram.linked')}
                      </span>
                    ) : (
                      <>
                        <span className='text-muted-foreground text-sm'>
                          {t('channels.telegram.notLinked')}
                        </span>
                        {draft.channels.telegram?.deeplink && (
                          <LinkButton
                            size='sm'
                            variant='outline'
                            href={draft.channels.telegram.deeplink}
                            target='_blank'
                            rel='noreferrer'
                          >
                            <Icons.externalLink className='size-4' /> {t('channels.telegram.link')}
                          </LinkButton>
                        )}
                      </>
                    )}
                  </div>
                )}
              </div>
            </div>
            <Switch
              id='ch-telegram'
              checked={channelEnabled('telegram')}
              onCheckedChange={(v) => setChannel('telegram', { enabled: v })}
            />
          </div>

          <div className='flex items-start justify-between gap-4'>
            <div className='flex items-start gap-3'>
              <Icons.mobile className='text-muted-foreground mt-0.5 size-5' />
              <div>
                <Label htmlFor='ch-push'>{t('channels.web_push.title')}</Label>
                <p className='text-muted-foreground text-sm'>{t('channels.web_push.hint')}</p>
              </div>
            </div>
            <Switch
              id='ch-push'
              checked={channelEnabled('web_push')}
              onCheckedChange={(v) => setChannel('web_push', { enabled: v })}
            />
          </div>
        </CardContent>
      </Card>

      <Card>
        <CardHeader>
          <CardTitle>{t('quiet.title')}</CardTitle>
          <CardDescription>{t('quiet.description')}</CardDescription>
        </CardHeader>
        <CardContent className='flex flex-col gap-4'>
          <div className='flex items-center justify-between gap-4'>
            <Label htmlFor='quiet-enabled'>{t('quiet.enabled')}</Label>
            <Switch
              id='quiet-enabled'
              checked={!!draft.quiet_hours}
              onCheckedChange={(v) =>
                setDraft({ ...draft, quiet_hours: v ? { from: '22:00', to: '08:00' } : null })
              }
            />
          </div>
          {draft.quiet_hours && (
            <div className='grid max-w-sm grid-cols-2 gap-4'>
              <Field>
                <FieldLabel htmlFor='quiet-from'>{t('quiet.from')}</FieldLabel>
                <Input
                  id='quiet-from'
                  type='time'
                  value={draft.quiet_hours.from ?? ''}
                  onChange={(e) =>
                    setDraft({
                      ...draft,
                      quiet_hours: { ...draft.quiet_hours, from: e.target.value }
                    })
                  }
                />
              </Field>
              <Field>
                <FieldLabel htmlFor='quiet-to'>{t('quiet.to')}</FieldLabel>
                <Input
                  id='quiet-to'
                  type='time'
                  value={draft.quiet_hours.to ?? ''}
                  onChange={(e) =>
                    setDraft({
                      ...draft,
                      quiet_hours: { ...draft.quiet_hours, to: e.target.value }
                    })
                  }
                />
              </Field>
              <FieldDescription className='col-span-2'>{t('quiet.hint')}</FieldDescription>
            </div>
          )}
        </CardContent>
        <CardFooter className='justify-end gap-2'>
          <Button
            variant='outline'
            disabled={!dirty || save.isPending}
            onClick={() => data && setDraft(structuredClone(data))}
          >
            {t('reset')}
          </Button>
          <Button
            onClick={submit}
            disabled={!dirty || save.isPending}
            data-testid='notification-settings-save'
          >
            {save.isPending && <Icons.spinner className='size-4 animate-spin' />}
            {t('save')}
          </Button>
        </CardFooter>
      </Card>
    </div>
  );
}
