'use client';

import { useMutation, useQuery, useQueryClient } from '@tanstack/react-query';
import { useFormatter, useTranslations } from 'next-intl';
import { parseAsString, useQueryStates } from 'nuqs';
import { useEffect, useState } from 'react';
import { toast } from 'sonner';
import { Icons } from '@/components/icons';
import { AlertModal } from '@/components/modal/alert-modal';
import { Badge } from '@/components/ui/badge';
import { Button } from '@/components/ui/button';
import {
  Empty,
  EmptyDescription,
  EmptyHeader,
  EmptyMedia,
  EmptyTitle
} from '@/components/ui/empty';
import { Field, FieldDescription, FieldError, FieldLabel } from '@/components/ui/field';
import { Input } from '@/components/ui/input';
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue
} from '@/components/ui/select';
import {
  Sheet,
  SheetContent,
  SheetDescription,
  SheetFooter,
  SheetHeader,
  SheetTitle
} from '@/components/ui/sheet';
import { Skeleton } from '@/components/ui/skeleton';
import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow
} from '@/components/ui/table';
import { Textarea } from '@/components/ui/textarea';
import { LocationPicker } from '@/features/locations';
import { mediaAssetsQueryOptions } from '@/features/media';
import { useCan } from '@/features/session';
import { isApiError } from '@/lib/api';
import { cn } from '@/lib/utils';
import {
  createProductMutation,
  deleteProductMutation,
  syncProductsMutation,
  updateProductMutation
} from '../api/mutations';
import { productsQueryOptions } from '../api/queries';
import type { Product, ProductUpsert } from '../api/types';

const ALL = '__all__';
const CATEGORIES = ['Обувь', 'Одежда', 'Инвентарь', 'Зимние виды спорта', 'Велоспорт', 'Другое'];

const errorText = (e: unknown) => (isApiError(e) ? (e.detail ?? e.message) : (e as Error).message);

const params = {
  q: parseAsString.withDefault(''),
  category: parseAsString.withDefault(''),
  sort: parseAsString.withDefault('')
};

function ProductSheet({
  open,
  onOpenChange,
  product
}: {
  open: boolean;
  onOpenChange: (o: boolean) => void;
  product: Product | null;
}) {
  const t = useTranslations('products.sheet');
  const queryClient = useQueryClient();
  const create = useMutation(createProductMutation(queryClient));
  const update = useMutation(updateProductMutation(queryClient));
  const { data: media } = useQuery({
    ...mediaAssetsQueryOptions({ page: 1, page_size: 24, 'filter[kind]': ['photo'] }),
    enabled: open
  });
  const [name, setName] = useState('');
  const [category, setCategory] = useState(CATEGORIES[0]!);
  const [description, setDescription] = useState('');
  const [price, setPrice] = useState('');
  const [mediaId, setMediaId] = useState<string | null>(null);
  const [locationIds, setLocationIds] = useState<string[]>([]);
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    if (!open) return;
    setName(product?.name ?? '');
    setCategory(product?.category ?? CATEGORIES[0]!);
    setDescription(product?.description ?? '');
    setPrice(product ? String(product.price.amount_minor / 100) : '');
    setMediaId(product?.media_id ?? null);
    setLocationIds(product?.location_ids ?? []);
    setError(null);
  }, [open, product]);

  const pending = create.isPending || update.isPending;
  const submit = async () => {
    const amount = Math.round(Number(price.replace(',', '.')) * 100);
    if (!name.trim()) return setError(t('nameRequired'));
    if (!Number.isFinite(amount) || amount <= 0) return setError(t('priceInvalid'));
    const body: ProductUpsert = {
      name: name.trim(),
      category,
      description: description.trim() || null,
      price: { amount_minor: amount, currency: 'RUB' },
      media_id: mediaId,
      location_scope: locationIds.length ? 'selected' : 'all',
      location_ids: locationIds
    };
    try {
      if (product) await update.mutateAsync({ id: product.id, body });
      else await create.mutateAsync({ body });
      toast.success(product ? t('updated') : t('created'));
      onOpenChange(false);
    } catch (e) {
      setError(errorText(e));
    }
  };

  return (
    <Sheet open={open} onOpenChange={onOpenChange}>
      <SheetContent
        className='flex w-full flex-col gap-0 p-0 sm:max-w-xl'
        data-testid='product-sheet'
      >
        <SheetHeader className='border-b'>
          <SheetTitle>{product ? t('editTitle') : t('createTitle')}</SheetTitle>
          <SheetDescription>{t('description')}</SheetDescription>
        </SheetHeader>
        <div className='flex flex-1 flex-col gap-4 overflow-y-auto p-4'>
          <Field>
            <FieldLabel htmlFor='prd-name'>{t('name')} *</FieldLabel>
            <Input id='prd-name' value={name} onChange={(e) => setName(e.target.value)} autoFocus />
          </Field>
          <div className='grid gap-4 sm:grid-cols-2'>
            <Field>
              <FieldLabel htmlFor='prd-category'>{t('category')}</FieldLabel>
              <Select value={category} onValueChange={(v) => setCategory(v ?? CATEGORIES[0]!)}>
                <SelectTrigger id='prd-category' aria-label={t('category')}>
                  <SelectValue>{(v: string) => v}</SelectValue>
                </SelectTrigger>
                <SelectContent>
                  {CATEGORIES.map((c) => (
                    <SelectItem key={c} value={c}>
                      {c}
                    </SelectItem>
                  ))}
                </SelectContent>
              </Select>
            </Field>
            <Field>
              <FieldLabel htmlFor='prd-price'>{t('price')} *</FieldLabel>
              <Input
                id='prd-price'
                value={price}
                onChange={(e) => setPrice(e.target.value)}
                inputMode='decimal'
                placeholder='0'
              />
              <FieldDescription>{t('priceHint')}</FieldDescription>
            </Field>
          </div>
          <Field>
            <FieldLabel htmlFor='prd-description'>{t('descriptionField')}</FieldLabel>
            <Textarea
              id='prd-description'
              value={description}
              onChange={(e) => setDescription(e.target.value)}
              rows={3}
            />
          </Field>
          <Field>
            <FieldLabel>{t('photo')}</FieldLabel>
            <div className='grid grid-cols-4 gap-2 sm:grid-cols-6'>
              {(media?.items ?? []).map((m) => (
                <button
                  key={m.id}
                  type='button'
                  aria-pressed={mediaId === m.id}
                  aria-label={m.id}
                  onClick={() => setMediaId(mediaId === m.id ? null : m.id)}
                  className={cn(
                    'aspect-square overflow-hidden rounded-md border',
                    mediaId === m.id && 'ring-primary ring-2'
                  )}
                >
                  {/* eslint-disable-next-line @next/next/no-img-element */}
                  <img
                    src={m.thumbnail_url ?? m.url}
                    alt=''
                    className='size-full object-cover'
                    loading='lazy'
                  />
                </button>
              ))}
            </div>
          </Field>
          <Field>
            <FieldLabel>{t('scope')}</FieldLabel>
            <div className='flex flex-wrap items-center gap-3 text-sm'>
              <span>
                {locationIds.length === 0
                  ? t('scopeAll')
                  : t('scopeSelected', { count: locationIds.length })}
              </span>
              <LocationPicker
                value={{ location_ids: locationIds, group_ids: [] }}
                onChange={(v) => setLocationIds(v.location_ids)}
              />
            </div>
          </Field>
          {error && <FieldError>{error}</FieldError>}
        </div>
        <SheetFooter className='flex-row justify-end gap-2 border-t'>
          <Button variant='outline' onClick={() => onOpenChange(false)} disabled={pending}>
            {t('cancel')}
          </Button>
          <Button onClick={submit} disabled={pending} data-testid='product-submit'>
            {pending && <Icons.spinner className='size-4 animate-spin' />}
            {t('save')}
          </Button>
        </SheetFooter>
      </SheetContent>
    </Sheet>
  );
}

/** S-PRD-01 «Товары и цены»: catalogue table (image, price, scope, sync counts), search / category, sheet editor, push to platforms. */
export function ProductsCatalog() {
  const t = useTranslations('products');
  const format = useFormatter();
  const [p, setP] = useQueryStates(params, { shallow: true });
  const canEdit = useCan('locations.edit');
  const queryClient = useQueryClient();
  const { data, isPending, isPlaceholderData } = useQuery({
    ...productsQueryOptions({
      page: 1,
      page_size: 100,
      ...(p.q ? { q: p.q } : {}),
      ...(p.category ? { 'filter[category]': [p.category] } : {}),
      ...(p.sort ? { sort: p.sort } : {})
    }),
    placeholderData: (prev) => prev
  });
  const remove = useMutation(deleteProductMutation(queryClient));
  const sync = useMutation(syncProductsMutation(queryClient));
  const [sheetOpen, setSheetOpen] = useState(false);
  const [editing, setEditing] = useState<Product | null>(null);
  const [deleting, setDeleting] = useState<Product | null>(null);
  const items = data?.items ?? [];
  const money = (m: Product['price']) =>
    format.number(m.amount_minor / 100, {
      style: 'currency',
      currency: m.currency,
      maximumFractionDigits: 0
    });
  const toggleSort = (key: 'name' | 'price' | 'updated_at') =>
    setP({ sort: p.sort === `-${key}` ? key : `-${key}` });

  return (
    <div className='flex flex-col gap-4' data-testid='products-catalog'>
      <div className='flex flex-wrap items-center gap-2'>
        <div className='relative min-w-56 flex-1'>
          <Icons.search className='text-muted-foreground absolute top-1/2 left-2 size-4 -translate-y-1/2' />
          <Input
            value={p.q}
            onChange={(e) => setP({ q: e.target.value })}
            placeholder={t('search')}
            className='h-8 pl-8'
            aria-label={t('search')}
          />
        </div>
        <Select
          value={p.category || ALL}
          onValueChange={(v) => setP({ category: !v || v === ALL ? '' : v })}
        >
          <SelectTrigger
            className='h-8 w-52'
            aria-label={t('filters.category')}
            data-testid='products-category'
          >
            <SelectValue>{(v: string) => (v === ALL ? t('filters.anyCategory') : v)}</SelectValue>
          </SelectTrigger>
          <SelectContent>
            <SelectItem value={ALL}>{t('filters.anyCategory')}</SelectItem>
            {CATEGORIES.map((c) => (
              <SelectItem key={c} value={c}>
                {c}
              </SelectItem>
            ))}
          </SelectContent>
        </Select>
        {canEdit && (
          <>
            <Button
              size='sm'
              variant='outline'
              disabled={sync.isPending}
              onClick={() =>
                sync.mutate(
                  {},
                  {
                    onSuccess: (b) =>
                      toast.success(t('actions.syncStarted', { count: b.progress.total })),
                    onError: (e) => toast.error(errorText(e))
                  }
                )
              }
              data-testid='products-sync'
            >
              {sync.isPending ? (
                <Icons.spinner className='size-4 animate-spin' />
              ) : (
                <Icons.send className='size-4' />
              )}
              {t('actions.sync')}
            </Button>
            <Button
              size='sm'
              onClick={() => {
                setEditing(null);
                setSheetOpen(true);
              }}
              data-testid='product-create'
            >
              <Icons.add className='size-4' /> {t('actions.create')}
            </Button>
          </>
        )}
      </div>

      <div className={cn('overflow-x-auto rounded-lg border', isPlaceholderData && 'opacity-60')}>
        <Table>
          <TableHeader className='bg-muted'>
            <TableRow>
              <TableHead className='w-14' />
              <TableHead>
                <button
                  type='button'
                  className='inline-flex items-center gap-1 hover:underline'
                  onClick={() => toggleSort('name')}
                >
                  {t('columns.name')} <Icons.chevronsUpDown className='size-3.5 opacity-40' />
                </button>
              </TableHead>
              <TableHead>{t('columns.category')}</TableHead>
              <TableHead className='text-right'>
                <button
                  type='button'
                  className='inline-flex items-center gap-1 hover:underline'
                  onClick={() => toggleSort('price')}
                >
                  {t('columns.price')} <Icons.chevronsUpDown className='size-3.5 opacity-40' />
                </button>
              </TableHead>
              <TableHead>{t('columns.scope')}</TableHead>
              <TableHead>{t('columns.sync')}</TableHead>
              <TableHead className='w-0' />
            </TableRow>
          </TableHeader>
          <TableBody>
            {isPending &&
              Array.from({ length: 6 }, (_, i) => (
                <TableRow key={i}>
                  <TableCell colSpan={7}>
                    <Skeleton className='h-5 w-full' />
                  </TableCell>
                </TableRow>
              ))}
            {!isPending && items.length === 0 && (
              <TableRow>
                <TableCell colSpan={7}>
                  <Empty className='py-8'>
                    <EmptyHeader>
                      <EmptyMedia variant='icon'>
                        <Icons.product />
                      </EmptyMedia>
                      <EmptyTitle>{p.q || p.category ? t('emptyFiltered') : t('empty')}</EmptyTitle>
                      <EmptyDescription>{t('emptyHint')}</EmptyDescription>
                    </EmptyHeader>
                  </Empty>
                </TableCell>
              </TableRow>
            )}
            {items.map((x) => (
              <TableRow key={x.id} data-product={x.id}>
                <TableCell>
                  {x.image_url ? (
                    // eslint-disable-next-line @next/next/no-img-element
                    <img
                      src={x.image_url}
                      alt=''
                      className='size-10 rounded-md border object-cover'
                      loading='lazy'
                    />
                  ) : (
                    <span className='bg-muted flex size-10 items-center justify-center rounded-md'>
                      <Icons.product className='text-muted-foreground size-4' />
                    </span>
                  )}
                </TableCell>
                <TableCell>
                  <div className='font-medium'>{x.name}</div>
                  {x.description && (
                    <div className='text-muted-foreground max-w-72 truncate text-xs'>
                      {x.description}
                    </div>
                  )}
                </TableCell>
                <TableCell>
                  <Badge variant='secondary'>{x.category}</Badge>
                </TableCell>
                <TableCell className='text-right font-medium tabular-nums'>
                  {money(x.price)}
                </TableCell>
                <TableCell className='text-muted-foreground text-xs'>
                  {x.location_scope === 'all' || !x.location_ids?.length
                    ? t('scopeAll')
                    : t('scopeSelected', { count: x.location_ids.length })}
                </TableCell>
                <TableCell>
                  <span className='flex items-center gap-2 text-xs tabular-nums'>
                    <span className='text-status-synced inline-flex items-center gap-1'>
                      <Icons.circleCheck className='size-3.5' /> {x.sync_state.synced}
                    </span>
                    {x.sync_state.sent > 0 && (
                      <span className='text-status-sent inline-flex items-center gap-1'>
                        <Icons.send className='size-3.5' /> {x.sync_state.sent}
                      </span>
                    )}
                    {x.sync_state.failed > 0 && (
                      <span className='text-status-error inline-flex items-center gap-1'>
                        <Icons.circleX className='size-3.5' /> {x.sync_state.failed}
                      </span>
                    )}
                  </span>
                </TableCell>
                <TableCell>
                  {canEdit && (
                    <div className='flex justify-end gap-1'>
                      <Button
                        size='icon-sm'
                        variant='ghost'
                        aria-label={`${t('actions.edit')}: ${x.name}`}
                        onClick={() => {
                          setEditing(x);
                          setSheetOpen(true);
                        }}
                      >
                        <Icons.edit className='size-3.5' />
                      </Button>
                      <Button
                        size='icon-sm'
                        variant='ghost'
                        aria-label={`${t('actions.delete')}: ${x.name}`}
                        onClick={() => setDeleting(x)}
                      >
                        <Icons.trash className='size-3.5' />
                      </Button>
                    </div>
                  )}
                </TableCell>
              </TableRow>
            ))}
          </TableBody>
        </Table>
      </div>

      <ProductSheet open={sheetOpen} onOpenChange={setSheetOpen} product={editing} />
      <AlertModal
        isOpen={!!deleting}
        onClose={() => setDeleting(null)}
        loading={remove.isPending}
        title={t('actions.delete')}
        description={deleting ? t('deleteConfirm', { name: deleting.name }) : ''}
        confirmLabel={t('actions.delete')}
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
    </div>
  );
}
