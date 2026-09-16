import {
  IconPlatform2gis,
  IconPlatformGeneric,
  IconPlatformGoogle,
  IconPlatformVk,
  IconPlatformYandex
} from '../platform-marks';

/** Platform marks (owner: UI-DS). Replace with brand SVGs per brandbook (SDD-01 §4.1). */
export const icons = {
  platformGoogle: IconPlatformGoogle,
  platformYandex: IconPlatformYandex,
  platform2gis: IconPlatform2gis,
  platformVk: IconPlatformVk,
  platformGeneric: IconPlatformGeneric
} as const;
