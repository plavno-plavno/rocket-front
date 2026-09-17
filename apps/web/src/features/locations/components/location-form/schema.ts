import { z } from 'zod';
import type { Location, LocationCreate, LocationUpdate } from '../../api/types';
import { ATTRIBUTE_KEYS, POLICY_FIELDS, WEEKDAYS, type Weekday } from '../../constants/taxonomy';

const TIME = /^([01]\d|2[0-3]):[0-5]\d$/;
const E164 = /^\+\d{10,15}$/;

/** Builds the Zod schema with localized messages (`t` = `locations.form.validation`). */
export function locationSchema(
  t: (key: string, values?: Record<string, string | number>) => string
) {
  const time = z.string().regex(TIME, t('time'));
  return z.object({
    name: z.string().trim().min(2, t('nameMin')).max(120, t('nameMax')),
    branch_code: z.string().trim().max(32, t('branchCodeMax')),
    status: z.enum(['open', 'temporarily_closed', 'permanently_closed', 'coming_soon']),
    brand_group_id: z.string(),
    timezone: z.string().min(1, t('required')),
    address: z.object({
      country: z.string().length(2, t('country')),
      region: z.string().trim(),
      city: z.string().trim().min(1, t('cityRequired')),
      street: z.string().trim(),
      house: z.string().trim(),
      building: z.string().trim(),
      postal_code: z.string().trim(),
      landmark: z.string().trim(),
      floor: z.string().trim()
    }),
    geo: z.object({
      lat: z
        .string()
        .refine(
          (v) => v === '' || (!Number.isNaN(Number(v)) && Math.abs(Number(v)) <= 90),
          t('lat')
        ),
      lng: z
        .string()
        .refine(
          (v) => v === '' || (!Number.isNaN(Number(v)) && Math.abs(Number(v)) <= 180),
          t('lng')
        )
    }),
    phones: z.array(
      z.object({
        e164: z.string().regex(E164, t('phone')),
        kind: z.enum(['main', 'additional', 'fax', 'whatsapp'])
      })
    ),
    emails: z.array(z.string().email(t('email'))),
    website: z
      .string()
      .trim()
      .refine((v) => v === '' || /^https?:\/\//.test(v), t('website')),
    social: z.array(
      z.object({
        kind: z.enum(['vk', 'telegram', 'instagram', 'facebook', 'youtube', 'tiktok', 'other']),
        url: z.string().url(t('url'))
      })
    ),
    hours: z.object(
      Object.fromEntries(
        WEEKDAYS.map((d) => [d, z.object({ closed: z.boolean(), open: time, close: time })])
      ) as Record<
        Weekday,
        z.ZodObject<{ closed: z.ZodBoolean; open: z.ZodString; close: z.ZodString }>
      >
    ),
    special_hours: z.array(
      z.object({
        date: z.string().min(1, t('required')),
        closed: z.boolean(),
        open: time,
        close: time
      })
    ),
    categories: z.object({
      primary: z.string().min(1, t('required')),
      additional: z.array(z.string())
    }),
    attributes: z.object(
      Object.fromEntries(ATTRIBUTE_KEYS.map((k) => [k, z.boolean()])) as Record<
        (typeof ATTRIBUTE_KEYS)[number],
        z.ZodBoolean
      >
    ),
    description: z.string().max(4000, t('descriptionMax')),
    platform_overrides: z.array(
      z.object({ platform_id: z.string().min(1), name: z.string().trim() })
    ),
    field_policies: z.object(
      Object.fromEntries(
        POLICY_FIELDS.map((f) => [f, z.enum(['enforce', 'accept_platform', 'ask'])])
      ) as Record<
        (typeof POLICY_FIELDS)[number],
        z.ZodEnum<{ enforce: 'enforce'; accept_platform: 'accept_platform'; ask: 'ask' }>
      >
    )
  });
}

export type LocationFormValues = z.infer<ReturnType<typeof locationSchema>>;

const DEFAULT_HOURS = { closed: false, open: '10:00', close: '22:00' };

export function emptyLocationValues(defaults?: {
  timezone?: string;
  brand_group_id?: string;
}): LocationFormValues {
  return {
    name: '',
    branch_code: '',
    status: 'open',
    brand_group_id: defaults?.brand_group_id ?? '',
    timezone: defaults?.timezone ?? 'Europe/Moscow',
    address: {
      country: 'RU',
      region: '',
      city: '',
      street: '',
      house: '',
      building: '',
      postal_code: '',
      landmark: '',
      floor: ''
    },
    geo: { lat: '', lng: '' },
    phones: [{ e164: '', kind: 'main' }],
    emails: [],
    website: '',
    social: [],
    hours: Object.fromEntries(
      WEEKDAYS.map((d) => [d, { ...DEFAULT_HOURS }])
    ) as LocationFormValues['hours'],
    special_hours: [],
    categories: { primary: 'cat_sporting_goods', additional: [] },
    attributes: Object.fromEntries(
      ATTRIBUTE_KEYS.map((k) => [k, false])
    ) as LocationFormValues['attributes'],
    description: '',
    platform_overrides: [],
    field_policies: {
      name: 'ask',
      phones: 'enforce',
      hours: 'enforce',
      description: 'accept_platform',
      website: 'enforce'
    }
  };
}

/** Canonical location (SDD-00 §4) → editable form model. */
export function toFormValues(loc: Location): LocationFormValues {
  const base = emptyLocationValues({
    timezone: loc.timezone,
    brand_group_id: loc.brand_group_id ?? ''
  });
  const hours = { ...base.hours };
  for (const rule of loc.hours?.regular ?? []) {
    for (const day of rule.days) {
      const first = rule.intervals[0];
      hours[day as Weekday] = first
        ? { closed: false, open: first[0], close: first[1] }
        : { ...DEFAULT_HOURS, closed: true };
    }
  }
  const covered = new Set((loc.hours?.regular ?? []).flatMap((r) => r.days));
  for (const d of WEEKDAYS)
    if (!covered.has(d) && (loc.hours?.regular?.length ?? 0) > 0)
      hours[d] = { ...DEFAULT_HOURS, closed: true };
  return {
    ...base,
    name: loc.name,
    branch_code: loc.branch_code ?? '',
    status: loc.status,
    address: {
      country: loc.address.country,
      region: loc.address.region ?? '',
      city: loc.address.city,
      street: loc.address.street ?? '',
      house: loc.address.house ?? '',
      building: loc.address.building ?? '',
      postal_code: loc.address.postal_code ?? '',
      landmark: loc.address.landmark ?? '',
      floor: loc.address.floor ?? ''
    },
    geo: { lat: loc.geo ? String(loc.geo.lat) : '', lng: loc.geo ? String(loc.geo.lng) : '' },
    phones: loc.phones?.length
      ? loc.phones.map((p) => ({ e164: p.e164, kind: p.kind ?? 'main' }))
      : [{ e164: '', kind: 'main' }],
    emails: loc.emails ?? [],
    website: loc.website ?? '',
    social: (loc.social ?? []).map((s) => ({ kind: s.kind, url: s.url })),
    hours,
    special_hours: (loc.hours?.special ?? []).map((s) => ({
      date: s.date,
      closed: !!s.closed,
      open: s.intervals?.[0]?.[0] ?? '10:00',
      close: s.intervals?.[0]?.[1] ?? '18:00'
    })),
    categories: {
      primary: loc.categories?.primary ?? 'cat_sporting_goods',
      additional: loc.categories?.additional ?? []
    },
    attributes: {
      ...base.attributes,
      ...Object.fromEntries(
        Object.entries(loc.attributes ?? {})
          .filter(([k]) => (ATTRIBUTE_KEYS as readonly string[]).includes(k))
          .map(([k, v]) => [k, !!v])
      )
    } as LocationFormValues['attributes'],
    description: loc.description ?? '',
    platform_overrides: Object.entries(loc.platform_overrides ?? {}).map(([platform_id, o]) => ({
      platform_id,
      name: o.name ?? ''
    })),
    field_policies: {
      ...base.field_policies,
      ...(loc.field_policies as Partial<LocationFormValues['field_policies']>)
    }
  };
}

/** Form model → canonical write body. Empty strings become null; hours collapse into day groups. */
const nn = (s: string) => (s.trim() === '' ? null : s.trim());

export function toApiBody(v: LocationFormValues): LocationCreate {
  const groups = new Map<string, Weekday[]>();
  for (const d of WEEKDAYS) {
    const h = v.hours[d];
    if (h.closed) continue;
    const key = `${h.open}-${h.close}`;
    groups.set(key, [...(groups.get(key) ?? []), d]);
  }
  const phones = v.phones.filter((p) => p.e164.trim());
  return {
    name: v.name.trim(),
    branch_code: nn(v.branch_code),
    status: v.status,
    brand_group_id: nn(v.brand_group_id),
    timezone: v.timezone,
    address: {
      country: v.address.country,
      region: nn(v.address.region),
      city: v.address.city.trim(),
      street: nn(v.address.street),
      house: nn(v.address.house),
      building: nn(v.address.building),
      unit: null,
      postal_code: nn(v.address.postal_code),
      free_form:
        [v.address.city, v.address.street, v.address.house].filter((x) => x.trim()).join(', ') ||
        null,
      landmark: nn(v.address.landmark),
      floor: nn(v.address.floor),
      fias_id: null
    },
    ...(v.geo.lat !== '' && v.geo.lng !== ''
      ? { geo: { lat: Number(v.geo.lat), lng: Number(v.geo.lng), precision: 'rooftop' as const } }
      : {}),
    phones,
    emails: v.emails,
    website: nn(v.website),
    social: v.social,
    hours: {
      regular: [...groups.entries()].map(([key, days]) => ({
        days,
        intervals: [key.split('-') as [string, string]]
      })),
      special: v.special_hours.map((s) =>
        s.closed
          ? { date: s.date, closed: true }
          : { date: s.date, intervals: [[s.open, s.close] as [string, string]] }
      )
    },
    categories: v.categories,
    attributes: v.attributes,
    description: nn(v.description),
    platform_overrides: Object.fromEntries(
      v.platform_overrides
        .filter((o) => o.platform_id && o.name.trim())
        .map((o) => [o.platform_id, { name: o.name.trim() }])
    ),
    field_policies: v.field_policies
  };
}

export function toUpdateBody(v: LocationFormValues, version: number): LocationUpdate {
  return { ...toApiBody(v), version };
}
