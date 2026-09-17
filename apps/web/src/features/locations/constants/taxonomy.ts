/**
 * Internal category taxonomy (SDD-00 §4 `/contracts/taxonomy/categories.yaml`).
 * The contract has no endpoint for it yet → CHANGE_REQUEST 2026-09-17-UI-F1-taxonomy; until then a
 * static subset lives here (labels are i18n keys under `locations.taxonomy`).
 */
export const CATEGORY_IDS = [
  'cat_sporting_goods',
  'cat_shoes',
  'cat_clothing',
  'cat_bicycles',
  'cat_fitness',
  'cat_outdoor',
  'cat_kids',
  'cat_electronics'
] as const;
export type CategoryId = (typeof CATEGORY_IDS)[number];

export const ATTRIBUTE_KEYS = [
  'wheelchair_accessible',
  'card_payment',
  'parking',
  'wifi',
  'delivery',
  'pickup',
  'fitting_room'
] as const;
export type AttributeKey = (typeof ATTRIBUTE_KEYS)[number];

export const POLICY_FIELDS = ['name', 'phones', 'hours', 'description', 'website'] as const;
export const WEEKDAYS = ['mon', 'tue', 'wed', 'thu', 'fri', 'sat', 'sun'] as const;
export type Weekday = (typeof WEEKDAYS)[number];
