'use client';

import { useTranslations } from 'next-intl';
import { useQueryStates } from 'nuqs';
import { Tabs, TabsList, TabsTrigger } from '@/components/ui/tabs';
import { locationsSearchParams } from '../searchparams';

/** «Карты, соц. сети, каталоги» | «Навигаторы» (SCR-1) — `?tab=` filters by `Platform.kind`. */
export function LocationTabs() {
  const t = useTranslations('locations.list.tabs');
  const [params, setParams] = useQueryStates(locationsSearchParams, { shallow: true });
  return (
    <Tabs
      value={params.tab}
      onValueChange={(value) => void setParams({ tab: value as 'maps' | 'navigators', page: 1 })}
    >
      <TabsList>
        <TabsTrigger value='maps'>{t('maps')}</TabsTrigger>
        <TabsTrigger value='navigators'>{t('navigators')}</TabsTrigger>
      </TabsList>
    </Tabs>
  );
}
