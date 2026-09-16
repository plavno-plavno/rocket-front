import { Icons } from '@/components/icons';
import { cn } from '@/lib/utils';

const PLATFORM_ICONS: Record<string, keyof typeof Icons> = {
  plt_google: 'platformGoogle',
  plt_yandex: 'platformYandex',
  plt_2gis: 'platform2gis',
  plt_vk: 'platformVk'
};

export interface PlatformIconProps {
  platformId: string;
  /** Icon key reported by `Platform.icon`; falls back to a per-id map, then to a generic mark. */
  icon?: string | null;
  className?: string;
  title?: string;
}

/** Platform mark (SDD-01 §4.1). Decorative — pair with a text label or `title`. */
export function PlatformIcon({ platformId, icon, className, title }: PlatformIconProps) {
  const key = (icon && icon in Icons ? icon : PLATFORM_ICONS[platformId]) ?? 'platformGeneric';
  const Icon = Icons[key as keyof typeof Icons];
  return (
    <span
      className={cn('inline-flex size-4 shrink-0 items-center justify-center', className)}
      title={title}
      aria-label={title}
    >
      <Icon className='size-full' />
    </span>
  );
}
