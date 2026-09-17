'use client';

import { useMutation, useQuery, useQueryClient } from '@tanstack/react-query';
import { useFormatter, useNow, useTranslations } from 'next-intl';
import { useEffect, useState } from 'react';
import { toast } from 'sonner';
import { Icons } from '@/components/icons';
import { AlertModal } from '@/components/modal/alert-modal';
import { Alert, AlertDescription, AlertTitle } from '@/components/ui/alert';
import { Badge } from '@/components/ui/badge';
import { Button } from '@/components/ui/button';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Checkbox } from '@/components/ui/checkbox';
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogFooter,
  DialogHeader,
  DialogTitle
} from '@/components/ui/dialog';
import { Field, FieldDescription, FieldError, FieldLabel } from '@/components/ui/field';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import {
  Sheet,
  SheetContent,
  SheetDescription,
  SheetHeader,
  SheetTitle
} from '@/components/ui/sheet';
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
import { isApiError } from '@/lib/api';
import { cn } from '@/lib/utils';
import {
  createApiKeyMutation,
  createIntegrationsWebhookMutation,
  deleteIntegrationsWebhookMutation,
  revokeApiKeyMutation,
  testWebhookMutation,
  updateIntegrationsWebhookMutation
} from '../api/mutations';
import {
  apiKeysQueryOptions,
  integrationsWebhooksQueryOptions,
  webhookDeliveriesQueryOptions
} from '../api/queries';
import type { ApiKey, ApiKeyCreated, Webhook, WebhookUpsert } from '../api/types';

const API_SCOPES = [
  'locations:read',
  'locations:write',
  'reviews:read',
  'reviews:reply',
  'analytics:read'
];
const WEBHOOK_EVENTS: WebhookUpsert['events'] = [
  'review.created',
  'review.updated',
  'reply.published',
  'listing.action_required'
];
/** i18n keys cannot contain dots. */
const EVENT_KEY = {
  'review.created': 'review_created',
  'review.updated': 'review_updated',
  'reply.published': 'reply_published',
  'listing.action_required': 'listing_action_required'
} as const;

const errorText = (e: unknown) => (isApiError(e) ? (e.detail ?? e.message) : (e as Error).message);

function copy(text: string, done: string) {
  void navigator.clipboard.writeText(text).then(() => toast.success(done));
}

/* ───────────────────────────── API keys ───────────────────────────── */

function CreateKeyDialog({
  open,
  onOpenChange
}: {
  open: boolean;
  onOpenChange: (o: boolean) => void;
}) {
  const t = useTranslations('settings.integrations.keys');
  const queryClient = useQueryClient();
  const create = useMutation(createApiKeyMutation(queryClient));
  const [name, setName] = useState('');
  const [scopes, setScopes] = useState<string[]>(['locations:read', 'reviews:read']);
  const [error, setError] = useState<string | null>(null);
  const [created, setCreated] = useState<ApiKeyCreated | null>(null);

  useEffect(() => {
    if (!open) return;
    setName('');
    setScopes(['locations:read', 'reviews:read']);
    setError(null);
    setCreated(null);
  }, [open]);

  const submit = async () => {
    if (!name.trim()) return setError(t('nameRequired'));
    if (scopes.length === 0) return setError(t('scopesRequired'));
    try {
      setCreated(await create.mutateAsync({ body: { name: name.trim(), scopes } }));
    } catch (e) {
      setError(errorText(e));
    }
  };

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent data-testid='key-dialog'>
        {created ? (
          <>
            <DialogHeader>
              <DialogTitle>{t('createdTitle')}</DialogTitle>
              <DialogDescription>{t('createdHint')}</DialogDescription>
            </DialogHeader>
            <Alert>
              <Icons.key className='size-4' />
              <AlertTitle>{created.name}</AlertTitle>
              <AlertDescription>
                <code
                  className='bg-muted mt-1 block rounded px-2 py-1 font-mono text-xs break-all'
                  data-testid='key-secret'
                >
                  {created.secret}
                </code>
              </AlertDescription>
            </Alert>
            <DialogFooter>
              <Button variant='outline' onClick={() => copy(created.secret, t('copied'))}>
                <Icons.copy className='size-4' /> {t('copy')}
              </Button>
              <Button onClick={() => onOpenChange(false)}>{t('done')}</Button>
            </DialogFooter>
          </>
        ) : (
          <>
            <DialogHeader>
              <DialogTitle>{t('createTitle')}</DialogTitle>
              <DialogDescription>{t('createHint')}</DialogDescription>
            </DialogHeader>
            <div className='flex flex-col gap-4'>
              <Field>
                <FieldLabel htmlFor='key-name'>{t('name')}</FieldLabel>
                <Input
                  id='key-name'
                  value={name}
                  onChange={(e) => setName(e.target.value)}
                  placeholder={t('namePlaceholder')}
                  autoFocus
                />
              </Field>
              <Field>
                <FieldLabel>{t('scopes')}</FieldLabel>
                <div className='grid gap-2 sm:grid-cols-2'>
                  {API_SCOPES.map((s) => (
                    <Label key={s} className='flex items-center gap-2 font-normal'>
                      <Checkbox
                        checked={scopes.includes(s)}
                        onCheckedChange={(v) =>
                          setScopes(v ? [...scopes, s] : scopes.filter((x) => x !== s))
                        }
                      />
                      <span className='font-mono text-xs'>{s}</span>
                    </Label>
                  ))}
                </div>
              </Field>
              {error && <FieldError>{error}</FieldError>}
            </div>
            <DialogFooter>
              <Button variant='outline' onClick={() => onOpenChange(false)}>
                {t('cancel')}
              </Button>
              <Button onClick={submit} disabled={create.isPending} data-testid='key-submit'>
                {create.isPending && <Icons.spinner className='size-4 animate-spin' />}
                {t('create')}
              </Button>
            </DialogFooter>
          </>
        )}
      </DialogContent>
    </Dialog>
  );
}

function ApiKeysCard() {
  const t = useTranslations('settings.integrations.keys');
  const tc = useTranslations('common');
  const format = useFormatter();
  const now = useNow({ updateInterval: 60_000 });
  const queryClient = useQueryClient();
  const { data, isPending } = useQuery(apiKeysQueryOptions());
  const revoke = useMutation(revokeApiKeyMutation(queryClient));
  const [createOpen, setCreateOpen] = useState(false);
  const [revoking, setRevoking] = useState<ApiKey | null>(null);
  const items = data?.items ?? [];

  return (
    <Card data-testid='api-keys'>
      <CardHeader className='flex flex-row items-start justify-between gap-4'>
        <div className='flex flex-col gap-1.5'>
          <CardTitle>{t('title')}</CardTitle>
          <CardDescription>{t('description')}</CardDescription>
        </div>
        <Button size='sm' onClick={() => setCreateOpen(true)} data-testid='key-create'>
          <Icons.add className='size-4' /> {t('create')}
        </Button>
      </CardHeader>
      <CardContent className='overflow-x-auto px-0'>
        <Table>
          <TableHeader>
            <TableRow>
              <TableHead className='pl-6'>{t('name')}</TableHead>
              <TableHead>{t('prefix')}</TableHead>
              <TableHead>{t('scopes')}</TableHead>
              <TableHead>{t('lastUsed')}</TableHead>
              <TableHead className='w-0 pr-6' />
            </TableRow>
          </TableHeader>
          <TableBody>
            {isPending && (
              <TableRow>
                <TableCell colSpan={5} className='px-6'>
                  <Skeleton className='h-5 w-full' />
                </TableCell>
              </TableRow>
            )}
            {!isPending && items.length === 0 && (
              <TableRow>
                <TableCell
                  colSpan={5}
                  className='text-muted-foreground px-6 py-8 text-center text-sm'
                >
                  {t('empty')}
                </TableCell>
              </TableRow>
            )}
            {items.map((k) => (
              <TableRow key={k.id}>
                <TableCell className='pl-6 font-medium'>{k.name}</TableCell>
                <TableCell className='font-mono text-xs'>{k.prefix}…</TableCell>
                <TableCell>
                  <div className='flex flex-wrap gap-1'>
                    {k.scopes.map((s) => (
                      <Badge key={s} variant='outline' className='font-mono text-[10px]'>
                        {s}
                      </Badge>
                    ))}
                  </div>
                </TableCell>
                <TableCell className='text-muted-foreground text-xs'>
                  {k.last_used_at ? (
                    <time dateTime={k.last_used_at}>
                      {format.relativeTime(new Date(k.last_used_at), now)}
                    </time>
                  ) : (
                    t('neverUsed')
                  )}
                </TableCell>
                <TableCell className='pr-6'>
                  <Button
                    size='sm'
                    variant='ghost'
                    onClick={() => setRevoking(k)}
                    aria-label={`${t('revoke')}: ${k.name}`}
                  >
                    <Icons.trash className='size-4' /> {t('revoke')}
                  </Button>
                </TableCell>
              </TableRow>
            ))}
          </TableBody>
        </Table>
      </CardContent>
      <CreateKeyDialog open={createOpen} onOpenChange={setCreateOpen} />
      <AlertModal
        isOpen={!!revoking}
        onClose={() => setRevoking(null)}
        loading={revoke.isPending}
        title={t('revoke')}
        description={revoking ? t('revokeConfirm', { name: revoking.name }) : ''}
        confirmLabel={tc('delete')}
        onConfirm={() =>
          revoking &&
          revoke.mutate(
            { id: revoking.id },
            {
              onSuccess: () => {
                toast.success(t('revoked'));
                setRevoking(null);
              },
              onError: (e) => toast.error(errorText(e))
            }
          )
        }
      />
    </Card>
  );
}

/* ───────────────────────────── Webhooks ───────────────────────────── */

function WebhookDialog({
  open,
  onOpenChange,
  webhook
}: {
  open: boolean;
  onOpenChange: (o: boolean) => void;
  webhook: Webhook | null;
}) {
  const t = useTranslations('settings.integrations.webhooks');
  const te = useTranslations('settings.integrations.webhooks.events');
  const queryClient = useQueryClient();
  const create = useMutation(createIntegrationsWebhookMutation(queryClient));
  const update = useMutation(updateIntegrationsWebhookMutation(queryClient));
  const [url, setUrl] = useState('');
  const [events, setEvents] = useState<WebhookUpsert['events']>([]);
  const [enabled, setEnabled] = useState(true);
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    if (!open) return;
    setUrl(webhook?.url ?? '');
    setEvents(webhook?.events ?? ['review.created']);
    setEnabled(webhook?.enabled ?? true);
    setError(null);
  }, [open, webhook]);

  const pending = create.isPending || update.isPending;
  const submit = async () => {
    if (!/^https:\/\/.+/.test(url.trim())) return setError(t('urlInvalid'));
    if (events.length === 0) return setError(t('eventsRequired'));
    const body: WebhookUpsert = { url: url.trim(), events, enabled };
    try {
      if (webhook) await update.mutateAsync({ id: webhook.id, body });
      else await create.mutateAsync({ body });
      toast.success(webhook ? t('updated') : t('created'));
      onOpenChange(false);
    } catch (e) {
      setError(errorText(e));
    }
  };

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent data-testid='webhook-dialog'>
        <DialogHeader>
          <DialogTitle>{webhook ? t('editTitle') : t('createTitle')}</DialogTitle>
          <DialogDescription>{t('hint')}</DialogDescription>
        </DialogHeader>
        <div className='flex flex-col gap-4'>
          <Field>
            <FieldLabel htmlFor='wh-url'>{t('url')}</FieldLabel>
            <Input
              id='wh-url'
              value={url}
              onChange={(e) => setUrl(e.target.value)}
              placeholder='https://example.ru/hooks/lp'
              inputMode='url'
              autoFocus
            />
            <FieldDescription>{t('urlHint')}</FieldDescription>
          </Field>
          <Field>
            <FieldLabel>{t('eventsLabel')}</FieldLabel>
            <div className='grid gap-2 sm:grid-cols-2'>
              {WEBHOOK_EVENTS.map((ev) => (
                <Label key={ev} className='flex items-center gap-2 font-normal'>
                  <Checkbox
                    checked={events.includes(ev)}
                    onCheckedChange={(v) =>
                      setEvents(v ? [...events, ev] : events.filter((x) => x !== ev))
                    }
                  />
                  <span>
                    {te(EVENT_KEY[ev])}{' '}
                    <span className='text-muted-foreground font-mono text-xs'>{ev}</span>
                  </span>
                </Label>
              ))}
            </div>
          </Field>
          <div className='flex items-center justify-between'>
            <Label htmlFor='wh-enabled'>{t('enabled')}</Label>
            <Switch id='wh-enabled' checked={enabled} onCheckedChange={setEnabled} />
          </div>
          {error && <FieldError>{error}</FieldError>}
        </div>
        <DialogFooter>
          <Button variant='outline' onClick={() => onOpenChange(false)}>
            {t('cancel')}
          </Button>
          <Button onClick={submit} disabled={pending} data-testid='webhook-submit'>
            {pending && <Icons.spinner className='size-4 animate-spin' />}
            {t('save')}
          </Button>
        </DialogFooter>
      </DialogContent>
    </Dialog>
  );
}

function DeliveriesSheet({ webhook, onClose }: { webhook: Webhook | null; onClose: () => void }) {
  const t = useTranslations('settings.integrations.webhooks');
  const format = useFormatter();
  const { data, isPending } = useQuery({
    ...webhookDeliveriesQueryOptions(webhook?.id ?? '', { page: 1, page_size: 50 }),
    enabled: !!webhook
  });
  return (
    <Sheet open={!!webhook} onOpenChange={(o) => !o && onClose()}>
      <SheetContent
        className='flex w-full flex-col gap-0 p-0 sm:max-w-lg'
        data-testid='deliveries-sheet'
      >
        <SheetHeader className='border-b'>
          <SheetTitle>{t('deliveries')}</SheetTitle>
          <SheetDescription className='truncate font-mono text-xs'>{webhook?.url}</SheetDescription>
        </SheetHeader>
        <div className='flex-1 overflow-auto'>
          <Table>
            <TableHeader className='bg-muted'>
              <TableRow>
                <TableHead>{t('deliveryEvent')}</TableHead>
                <TableHead className='w-20'>{t('deliveryStatus')}</TableHead>
                <TableHead>{t('deliveryAt')}</TableHead>
              </TableRow>
            </TableHeader>
            <TableBody>
              {isPending && (
                <TableRow>
                  <TableCell colSpan={3}>
                    <Skeleton className='h-5 w-full' />
                  </TableCell>
                </TableRow>
              )}
              {(data?.items ?? []).map((d) => (
                <TableRow key={d.id}>
                  <TableCell>
                    <div className='font-mono text-xs'>{d.event}</div>
                    {d.error && <div className='text-status-error text-xs'>{d.error}</div>}
                  </TableCell>
                  <TableCell>
                    <Badge
                      variant='outline'
                      className={cn(
                        'gap-1',
                        d.status < 400 ? 'text-status-synced' : 'text-status-error'
                      )}
                    >
                      {d.status < 400 ? (
                        <Icons.check className='size-3' />
                      ) : (
                        <Icons.close className='size-3' />
                      )}
                      {d.status}
                    </Badge>
                  </TableCell>
                  <TableCell className='text-muted-foreground text-xs'>
                    {format.dateTime(new Date(d.attempted_at), 'medium')}
                  </TableCell>
                </TableRow>
              ))}
              {!isPending && (data?.items ?? []).length === 0 && (
                <TableRow>
                  <TableCell colSpan={3} className='text-muted-foreground py-8 text-center text-sm'>
                    {t('noDeliveries')}
                  </TableCell>
                </TableRow>
              )}
            </TableBody>
          </Table>
        </div>
      </SheetContent>
    </Sheet>
  );
}

function WebhooksCard() {
  const t = useTranslations('settings.integrations.webhooks');
  const te = useTranslations('settings.integrations.webhooks.events');
  const tc = useTranslations('common');
  const format = useFormatter();
  const now = useNow({ updateInterval: 60_000 });
  const queryClient = useQueryClient();
  const { data, isPending } = useQuery(integrationsWebhooksQueryOptions());
  const remove = useMutation(deleteIntegrationsWebhookMutation(queryClient));
  const update = useMutation(updateIntegrationsWebhookMutation(queryClient));
  const test = useMutation(testWebhookMutation(queryClient));
  const [dialogOpen, setDialogOpen] = useState(false);
  const [editing, setEditing] = useState<Webhook | null>(null);
  const [deleting, setDeleting] = useState<Webhook | null>(null);
  const [deliveriesOf, setDeliveriesOf] = useState<Webhook | null>(null);
  const items = data?.items ?? [];

  return (
    <Card data-testid='webhooks'>
      <CardHeader className='flex flex-row items-start justify-between gap-4'>
        <div className='flex flex-col gap-1.5'>
          <CardTitle>{t('title')}</CardTitle>
          <CardDescription>{t('description')}</CardDescription>
        </div>
        <Button
          size='sm'
          onClick={() => {
            setEditing(null);
            setDialogOpen(true);
          }}
          data-testid='webhook-create'
        >
          <Icons.add className='size-4' /> {t('add')}
        </Button>
      </CardHeader>
      <CardContent className='overflow-x-auto px-0'>
        <Table>
          <TableHeader>
            <TableRow>
              <TableHead className='pl-6'>{t('url')}</TableHead>
              <TableHead>{t('eventsLabel')}</TableHead>
              <TableHead>{t('lastDelivery')}</TableHead>
              <TableHead className='w-16 text-center'>{t('enabled')}</TableHead>
              <TableHead className='w-0 pr-6' />
            </TableRow>
          </TableHeader>
          <TableBody>
            {isPending && (
              <TableRow>
                <TableCell colSpan={5} className='px-6'>
                  <Skeleton className='h-5 w-full' />
                </TableCell>
              </TableRow>
            )}
            {!isPending && items.length === 0 && (
              <TableRow>
                <TableCell
                  colSpan={5}
                  className='text-muted-foreground px-6 py-8 text-center text-sm'
                >
                  {t('empty')}
                </TableCell>
              </TableRow>
            )}
            {items.map((w) => (
              <TableRow key={w.id}>
                <TableCell className='pl-6'>
                  <div className='max-w-64 truncate font-mono text-xs' title={w.url}>
                    {w.url}
                  </div>
                  {w.secret_prefix && (
                    <div className='text-muted-foreground text-xs'>
                      {t('secret')}: <span className='font-mono'>{w.secret_prefix}…</span>
                    </div>
                  )}
                </TableCell>
                <TableCell>
                  <div className='flex flex-wrap gap-1'>
                    {w.events.map((ev) => (
                      <Badge key={ev} variant='outline' className='text-[10px]'>
                        {te(EVENT_KEY[ev])}
                      </Badge>
                    ))}
                  </div>
                </TableCell>
                <TableCell className='text-xs'>
                  {w.last_delivery_at ? (
                    <button
                      type='button'
                      className='inline-flex items-center gap-1 underline-offset-4 hover:underline'
                      onClick={() => setDeliveriesOf(w)}
                    >
                      <Badge
                        variant='outline'
                        className={cn(
                          'gap-1',
                          (w.last_delivery_status ?? 0) < 400
                            ? 'text-status-synced'
                            : 'text-status-error'
                        )}
                      >
                        {w.last_delivery_status ?? '—'}
                      </Badge>
                      <time dateTime={w.last_delivery_at} className='text-muted-foreground'>
                        {format.relativeTime(new Date(w.last_delivery_at), now)}
                      </time>
                    </button>
                  ) : (
                    <span className='text-muted-foreground'>{t('noDeliveries')}</span>
                  )}
                </TableCell>
                <TableCell className='text-center'>
                  <Switch
                    checked={w.enabled}
                    disabled={update.isPending}
                    aria-label={`${t('enabled')}: ${w.url}`}
                    onCheckedChange={(v) =>
                      update.mutate(
                        { id: w.id, body: { url: w.url, events: w.events, enabled: v } },
                        { onError: (e) => toast.error(errorText(e)) }
                      )
                    }
                  />
                </TableCell>
                <TableCell className='pr-6'>
                  <div className='flex justify-end gap-1'>
                    <Button
                      size='sm'
                      variant='ghost'
                      disabled={test.isPending && test.variables?.id === w.id}
                      onClick={() =>
                        test.mutate(
                          { id: w.id },
                          {
                            onSuccess: (d) =>
                              d.status < 400
                                ? toast.success(t('testOk', { status: d.status }))
                                : toast.error(t('testFailed', { status: d.status })),
                            onError: (e) => toast.error(errorText(e))
                          }
                        )
                      }
                    >
                      {test.isPending && test.variables?.id === w.id ? (
                        <Icons.spinner className='size-4 animate-spin' />
                      ) : (
                        <Icons.send className='size-4' />
                      )}
                      {t('test')}
                    </Button>
                    <Button
                      size='icon-sm'
                      variant='ghost'
                      aria-label={t('deliveries')}
                      onClick={() => setDeliveriesOf(w)}
                    >
                      <Icons.history className='size-3.5' />
                    </Button>
                    <Button
                      size='icon-sm'
                      variant='ghost'
                      aria-label={t('edit')}
                      onClick={() => {
                        setEditing(w);
                        setDialogOpen(true);
                      }}
                    >
                      <Icons.edit className='size-3.5' />
                    </Button>
                    <Button
                      size='icon-sm'
                      variant='ghost'
                      aria-label={t('delete')}
                      onClick={() => setDeleting(w)}
                    >
                      <Icons.trash className='size-3.5' />
                    </Button>
                  </div>
                </TableCell>
              </TableRow>
            ))}
          </TableBody>
        </Table>
      </CardContent>
      <WebhookDialog open={dialogOpen} onOpenChange={setDialogOpen} webhook={editing} />
      <DeliveriesSheet webhook={deliveriesOf} onClose={() => setDeliveriesOf(null)} />
      <AlertModal
        isOpen={!!deleting}
        onClose={() => setDeleting(null)}
        loading={remove.isPending}
        title={t('delete')}
        description={deleting ? t('deleteConfirm', { url: deleting.url }) : ''}
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
    </Card>
  );
}

/** S-SET-05 «Интеграции»: API keys (secret shown once) and webhooks with a delivery log. */
export function IntegrationsSettings() {
  return (
    <>
      <ApiKeysCard />
      <WebhooksCard />
    </>
  );
}
