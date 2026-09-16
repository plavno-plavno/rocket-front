import { notFound } from 'next/navigation';
import PageContainer from '@/components/layout/page-container';
import { DesignSystemShowcase } from '@/features/_ds/components/showcase';

/** Design-system showcase — dev builds only (SDD-01 §12). Owner: UI-DS. */
export default function ComponentsPage() {
  if (process.env.NODE_ENV === 'production' && process.env.NEXT_PUBLIC_SHOW_DEV_PAGES !== 'true')
    notFound();
  return (
    <PageContainer
      pageTitle='Компоненты'
      pageDescription='Витрина components/lp и примитивов shadcn в теме lp'
    >
      <DesignSystemShowcase />
    </PageContainer>
  );
}
