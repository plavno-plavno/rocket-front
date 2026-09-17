'use client';

import { useQuery } from '@tanstack/react-query';
import { useTranslations } from 'next-intl';
import { Icons } from '@/components/icons';
import { Badge } from '@/components/ui/badge';
import { locationsQueryOptions } from '@/features/locations';
import { WidgetConfigurator, type WidgetConfig } from '@/features/widgets';

/** Preview of the store locator widget: city search box + the first locations of the tenant. */
function LocatorPreview({ config }: { config: WidgetConfig }) {
  const t = useTranslations('store-locator.preview');
  const { data } = useQuery(locationsQueryOptions({ scope: 'all', page: 1, page_size: 4 }));
  return (
    <div className='flex flex-col gap-3'>
      <div className='bg-muted flex items-center gap-2 rounded-md px-3 py-2 text-sm'>
        <Icons.search className='text-muted-foreground size-4' />
        <span className='text-muted-foreground'>{config.default_city || t('cityPlaceholder')}</span>
      </div>
      <div className='bg-muted/50 text-muted-foreground flex h-28 items-center justify-center rounded-md border border-dashed text-xs'>
        <Icons.mapPin className='mr-1 size-4' /> {t('map')}
      </div>
      <ul className='divide-y text-sm'>
        {(data?.items ?? []).map((l) => (
          <li key={l.id} className='flex flex-col gap-0.5 py-2'>
            <span className='font-medium'>{l.name}</span>
            <span className='text-muted-foreground text-xs'>
              {l.address.free_form ?? l.address.city}
            </span>
            {(config.show_hours ?? true) && (
              <Badge variant='outline' className='w-fit text-[10px]'>
                {t('openNow')}
              </Badge>
            )}
          </li>
        ))}
      </ul>
      <p className='text-muted-foreground text-center text-[10px]'>{t('poweredBy')}</p>
    </div>
  );
}

/** «Сторлокатор» (Beta): the widget configurator for `store_locator` widgets. */
export function StoreLocator() {
  return (
    <WidgetConfigurator
      kind='store_locator'
      renderPreview={(config) => <LocatorPreview config={config} />}
    />
  );
}
