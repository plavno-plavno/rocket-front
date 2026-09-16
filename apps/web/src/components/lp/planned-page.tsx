import { getTranslations } from 'next-intl/server';
import PageContainer from '@/components/layout/page-container';
import { Icons } from '@/components/icons';
import {
  Empty,
  EmptyDescription,
  EmptyHeader,
  EmptyMedia,
  EmptyTitle
} from '@/components/ui/empty';
import { Badge } from '@/components/ui/badge';

export interface PlannedPageProps {
  /** Feature id (folder / i18n namespace). */
  feature: string;
  /** Screen id from SDD-01 §8–9, e.g. `S-REV-01`. */
  screen: string;
  /** Owning track, e.g. `UI-F2`. */
  track?: string;
  title?: string;
}

/**
 * Placeholder rendered by every route until its track ships the screen (SDD-01T §3.3).
 * `check:templates` accepts it as a valid page template.
 */
export async function PlannedPage({ feature, screen, track, title }: PlannedPageProps) {
  const t = await getTranslations('layout.planned');
  return (
    <PageContainer pageTitle={title ?? t('title')}>
      <div
        className='flex flex-1 items-center justify-center'
        data-template='planned'
        data-feature={feature}
        data-screen={screen}
      >
        <Empty>
          <EmptyHeader>
            <EmptyMedia variant='icon'>
              <Icons.spinner className='animate-spin' />
            </EmptyMedia>
            <EmptyTitle>{t('heading')}</EmptyTitle>
            <EmptyDescription>{t('description')}</EmptyDescription>
          </EmptyHeader>
          <div className='flex gap-2'>
            <Badge variant='outline'>{feature}</Badge>
            <Badge variant='outline'>{screen}</Badge>
            {track && <Badge variant='secondary'>{track}</Badge>}
          </div>
        </Empty>
      </div>
    </PageContainer>
  );
}
