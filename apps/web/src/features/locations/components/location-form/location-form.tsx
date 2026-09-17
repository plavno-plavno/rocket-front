'use client';

import { useMutation, useQuery, useQueryClient } from '@tanstack/react-query';
import { useTranslations } from 'next-intl';
import { useRouter } from 'next/navigation';
import { useMemo, useState } from 'react';
import { toast } from 'sonner';
import { Alert, AlertDescription } from '@/components/ui/alert';
import { Button } from '@/components/ui/button';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Field, FieldLabel } from '@/components/ui/field';
import { Label } from '@/components/ui/label';
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue
} from '@/components/ui/select';
import { Switch } from '@/components/ui/switch';
import { platformsQueryOptions } from '@/features/sources';
import { isApiError } from '@/lib/api';
import { useAppForm } from '@/lib/form';
import {
  createLocationMutation,
  previewSyncMutation,
  updateLocationMutation
} from '../../api/mutations';
import { locationGroupsQueryOptions } from '../../api/queries';
import type { Location, PreviewSyncResponse } from '../../api/types';
import { ATTRIBUTE_KEYS, CATEGORY_IDS, POLICY_FIELDS } from '../../constants/taxonomy';
import {
  HoursEditor,
  OverridesEditor,
  PhonesEditor,
  SocialEditor,
  SpecialHoursEditor
} from './editors';
import { PreviewSyncDialog } from './preview-sync-dialog';
import {
  emptyLocationValues,
  locationSchema,
  toApiBody,
  toFormValues,
  toUpdateBody,
  type LocationFormValues
} from './schema';

const TIMEZONES = [
  'Europe/Kaliningrad',
  'Europe/Moscow',
  'Europe/Samara',
  'Asia/Yekaterinburg',
  'Asia/Omsk',
  'Asia/Krasnoyarsk',
  'Asia/Irkutsk',
  'Asia/Yakutsk',
  'Asia/Vladivostok',
  'Asia/Magadan',
  'Asia/Kamchatka'
];

export interface LocationFormProps {
  /** Existing location → edit mode with preview-sync; undefined → create. */
  location?: Location;
  readOnly?: boolean;
  onSaved?: (location: Location) => void;
}

function Section({
  title,
  description,
  children
}: {
  title: string;
  description?: string;
  children: React.ReactNode;
}) {
  return (
    <Card>
      <CardHeader>
        <CardTitle>{title}</CardTitle>
        {description && <CardDescription>{description}</CardDescription>}
      </CardHeader>
      <CardContent className='flex flex-col gap-4'>{children}</CardContent>
    </Card>
  );
}

/** S-LOC-03 «Данные»: canonical location form in Card blocks (SDD-01 §8). */
export function LocationForm({ location, readOnly = false, onSaved }: LocationFormProps) {
  const t = useTranslations('locations.form');
  const tv = useTranslations('locations.form.validation');
  const tc = useTranslations('locations.form.contacts');
  const router = useRouter();
  const queryClient = useQueryClient();
  const { data: groups } = useQuery(locationGroupsQueryOptions('brand'));
  const { data: platforms } = useQuery(platformsQueryOptions());
  const [formError, setFormError] = useState<string | null>(null);
  const [preview, setPreview] = useState<{
    open: boolean;
    data: PreviewSyncResponse | null;
    values: LocationFormValues | null;
  }>({ open: false, data: null, values: null });

  const previewSync = useMutation(previewSyncMutation(location?.id ?? ''));
  const create = useMutation(createLocationMutation(queryClient));
  const update = useMutation(updateLocationMutation(queryClient, location?.id ?? ''));
  const schema = useMemo(() => locationSchema((k, v) => tv(k as never, v as never)), [tv]);

  const form = useAppForm({
    defaultValues: location
      ? toFormValues(location)
      : emptyLocationValues({ brand_group_id: groups?.items[0]?.id }),
    validators: { onSubmit: schema },
    onSubmit: async ({ value }) => {
      setFormError(null);
      if (!location) {
        try {
          const created = await create.mutateAsync(toApiBody(value));
          toast.success(t('actions.created', { name: created.name }));
          onSaved?.(created);
          router.push(`/dashboard/locations/${created.id}`);
        } catch (error) {
          setFormError(
            isApiError(error)
              ? (error.detail ?? (Object.values(error.fieldErrors).join('; ') || error.message))
              : (error as Error).message
          );
        }
        return;
      }
      // Edit: dry-run first, then confirm in the dialog.
      setPreview({ open: true, data: null, values: value });
      try {
        const data = await previewSync.mutateAsync(toUpdateBody(value, location.version));
        setPreview((p) => ({ ...p, data }));
      } catch {
        setPreview((p) => ({ ...p, data: { available: false, listings: [] } }));
      }
    }
  });

  const confirmSave = async () => {
    if (!location || !preview.values) return;
    try {
      const saved = await update.mutateAsync(toUpdateBody(preview.values, location.version));
      setPreview({ open: false, data: null, values: null });
      toast.success(t('actions.saved'));
      onSaved?.(saved);
    } catch (error) {
      setPreview({ open: false, data: null, values: null });
      setFormError(
        isApiError(error) && error.status === 409
          ? t('actions.conflict')
          : isApiError(error)
            ? (error.detail ?? error.message)
            : (error as Error).message
      );
    }
  };

  const platformName = (id: string) => platforms?.items.find((p) => p.id === id)?.name ?? id;
  const disabled = readOnly;

  return (
    <form
      className='flex flex-col gap-4'
      onSubmit={(e) => {
        e.preventDefault();
        void form.handleSubmit();
      }}
      noValidate
      data-testid='location-form'
    >
      {formError && (
        <Alert variant='destructive'>
          <AlertDescription>{formError}</AlertDescription>
        </Alert>
      )}

      <Section title={t('sections.main')}>
        <div className='grid gap-4 sm:grid-cols-2'>
          <form.AppField
            name='name'
            children={(field) => (
              <field.TextField label={t('fields.name')} required disabled={disabled} />
            )}
          />
          <form.AppField
            name='branch_code'
            children={(field) => (
              <field.TextField label={t('fields.branchCode')} disabled={disabled} />
            )}
          />
          <form.AppField
            name='status'
            children={(field) => (
              <field.SelectField
                label={t('fields.status')}
                options={(
                  ['open', 'temporarily_closed', 'coming_soon', 'permanently_closed'] as const
                ).map((s) => ({ value: s, label: t(`status.${s}`) }))}
              />
            )}
          />
          <form.AppField
            name='brand_group_id'
            children={(field) => (
              <field.SelectField
                label={t('fields.brand')}
                options={(groups?.items ?? []).map((g) => ({ value: g.id, label: g.name }))}
              />
            )}
          />
          <form.AppField
            name='timezone'
            children={(field) => (
              <field.SelectField
                label={t('fields.timezone')}
                options={TIMEZONES.map((z) => ({ value: z, label: z }))}
              />
            )}
          />
        </div>
      </Section>

      <Section title={t('sections.address')}>
        <div className='grid gap-4 sm:grid-cols-2 lg:grid-cols-3'>
          <form.AppField
            name='address.country'
            children={(field) => (
              <field.TextField
                label={t('fields.country')}
                required
                maxLength={2}
                disabled={disabled}
              />
            )}
          />
          <form.AppField
            name='address.region'
            children={(field) => <field.TextField label={t('fields.region')} disabled={disabled} />}
          />
          <form.AppField
            name='address.city'
            children={(field) => (
              <field.TextField label={t('fields.city')} required disabled={disabled} />
            )}
          />
          <form.AppField
            name='address.street'
            children={(field) => <field.TextField label={t('fields.street')} disabled={disabled} />}
          />
          <form.AppField
            name='address.house'
            children={(field) => <field.TextField label={t('fields.house')} disabled={disabled} />}
          />
          <form.AppField
            name='address.building'
            children={(field) => (
              <field.TextField label={t('fields.building')} disabled={disabled} />
            )}
          />
          <form.AppField
            name='address.postal_code'
            children={(field) => (
              <field.TextField label={t('fields.postalCode')} disabled={disabled} />
            )}
          />
          <form.AppField
            name='address.landmark'
            children={(field) => (
              <field.TextField label={t('fields.landmark')} disabled={disabled} />
            )}
          />
          <form.AppField
            name='address.floor'
            children={(field) => <field.TextField label={t('fields.floor')} disabled={disabled} />}
          />
          <form.AppField
            name='geo.lat'
            children={(field) => (
              <field.TextField label={t('fields.lat')} inputMode='decimal' disabled={disabled} />
            )}
          />
          <form.AppField
            name='geo.lng'
            children={(field) => (
              <field.TextField label={t('fields.lng')} inputMode='decimal' disabled={disabled} />
            )}
          />
        </div>
      </Section>

      <Section title={t('sections.contacts')}>
        <form.Field
          name='phones'
          children={(field) => (
            <Field>
              <FieldLabel>{tc('phone')}</FieldLabel>
              <PhonesEditor
                value={field.state.value}
                onChange={field.handleChange}
                disabled={disabled}
                errors={field.state.value.map(
                  (_, i) =>
                    (
                      form.getFieldMeta(`phones[${i}].e164`)?.errors?.[0] as
                        | { message?: string }
                        | undefined
                    )?.message
                )}
              />
            </Field>
          )}
        />
        <div className='grid gap-4 sm:grid-cols-2'>
          <form.AppField
            name='website'
            children={(field) => (
              <field.TextField
                label={t('fields.website')}
                type='url'
                placeholder='https://'
                disabled={disabled}
              />
            )}
          />
          <form.AppField
            name='emails'
            children={(field) => (
              <field.TagsField
                label={t('fields.emails')}
                placeholder={t('fields.emailsPlaceholder')}
              />
            )}
          />
        </div>
        <form.Field
          name='social'
          children={(field) => (
            <Field>
              <FieldLabel>{tc('socialKind')}</FieldLabel>
              <SocialEditor
                value={field.state.value}
                onChange={field.handleChange}
                disabled={disabled}
              />
            </Field>
          )}
        />
      </Section>

      <Section title={t('sections.hours')}>
        <form.Field
          name='hours'
          children={(field) => (
            <HoursEditor
              value={field.state.value}
              onChange={field.handleChange}
              disabled={disabled}
            />
          )}
        />
      </Section>

      <Section title={t('sections.specialHours')} description={t('hours.specialHint')}>
        <form.Field
          name='special_hours'
          children={(field) => (
            <SpecialHoursEditor
              value={field.state.value}
              onChange={field.handleChange}
              disabled={disabled}
            />
          )}
        />
      </Section>

      <Section title={t('sections.categories')}>
        <div className='grid gap-4 sm:grid-cols-2'>
          <form.AppField
            name='categories.primary'
            children={(field) => (
              <field.SelectField
                label={t('fields.primaryCategory')}
                required
                options={CATEGORY_IDS.map((c) => ({ value: c, label: t(`taxonomy.${c}`) }))}
              />
            )}
          />
          <form.AppField
            name='categories.additional'
            children={(field) => (
              <field.CheckboxGroupField
                label={t('fields.additionalCategories')}
                options={CATEGORY_IDS.map((c) => ({ value: c, label: t(`taxonomy.${c}`) }))}
              />
            )}
          />
        </div>
      </Section>

      <Section title={t('sections.attributes')}>
        <form.Field
          name='attributes'
          children={(field) => (
            <div className='grid gap-3 sm:grid-cols-2 lg:grid-cols-3'>
              {ATTRIBUTE_KEYS.map((k) => (
                <div key={k} className='flex items-center gap-2'>
                  <Switch
                    id={`attr-${k}`}
                    checked={field.state.value[k]}
                    onCheckedChange={(v) => field.handleChange({ ...field.state.value, [k]: v })}
                    disabled={disabled}
                  />
                  <Label htmlFor={`attr-${k}`}>{t(`attributes.${k}`)}</Label>
                </div>
              ))}
            </div>
          )}
        />
      </Section>

      <Section title={t('sections.description')} description={t('fields.descriptionHint')}>
        <form.AppField
          name='description'
          children={(field) => (
            <field.TextareaField label={t('fields.description')} rows={6} disabled={disabled} />
          )}
        />
      </Section>

      <Section title={t('sections.media')} description={t('media.hint')}>
        <p className='text-muted-foreground text-sm'>—</p>
      </Section>

      <Section title={t('sections.overrides')} description={t('overrides.hint')}>
        <form.Field
          name='platform_overrides'
          children={(field) => (
            <OverridesEditor
              value={field.state.value}
              onChange={field.handleChange}
              platforms={platforms?.items ?? []}
              disabled={disabled}
            />
          )}
        />
      </Section>

      <Section title={t('sections.policies')} description={t('policies.hint')}>
        <form.Field
          name='field_policies'
          children={(field) => (
            <div className='grid gap-3 sm:grid-cols-2 lg:grid-cols-3'>
              {POLICY_FIELDS.map((f) => (
                <div key={f} className='flex flex-col gap-1'>
                  <Label>{t(`policies.fields.${f}`)}</Label>
                  <Select
                    value={field.state.value[f]}
                    onValueChange={(v) =>
                      field.handleChange({ ...field.state.value, [f]: v as 'enforce' })
                    }
                    disabled={disabled}
                  >
                    <SelectTrigger className='w-full'>
                      <SelectValue>
                        {(v: 'enforce' | 'accept_platform' | 'ask') => t(`policies.values.${v}`)}
                      </SelectValue>
                    </SelectTrigger>
                    <SelectContent>
                      {(['enforce', 'accept_platform', 'ask'] as const).map((v) => (
                        <SelectItem key={v} value={v}>
                          {t(`policies.values.${v}`)}
                        </SelectItem>
                      ))}
                    </SelectContent>
                  </Select>
                </div>
              ))}
            </div>
          )}
        />
      </Section>

      {!readOnly && (
        <div className='bg-background/95 sticky bottom-0 -mx-4 flex items-center justify-end gap-2 border-t px-4 py-3 backdrop-blur md:-mx-6 md:px-6'>
          <Button type='button' variant='outline' onClick={() => router.back()}>
            {t('actions.cancel')}
          </Button>
          <form.AppForm>
            <form.SubmitButton>
              {location ? t('actions.save') : t('actions.create')}
            </form.SubmitButton>
          </form.AppForm>
        </div>
      )}

      <PreviewSyncDialog
        open={preview.open}
        onOpenChange={(o) => !o && setPreview({ open: false, data: null, values: null })}
        preview={preview.data}
        loading={preview.open && !preview.data}
        platformName={platformName}
        onConfirm={confirmSave}
        confirming={update.isPending}
      />
    </form>
  );
}
