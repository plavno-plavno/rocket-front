import { dehydrate, HydrationBoundary } from '@tanstack/react-query';
import { cookies } from 'next/headers';
import { getTranslations } from 'next-intl/server';
import KBar from '@/components/kbar';
import AppSidebar from '@/components/layout/app-sidebar';
import Header from '@/components/layout/header';
import { InfoSidebar } from '@/components/layout/info-sidebar';
import { InfobarProvider } from '@/components/ui/infobar';
import { SidebarInset, SidebarProvider } from '@/components/ui/sidebar';
import { SessionProvider } from '@/features/session';
import { prefetchMe } from '@/features/session/server';
import { RealtimeProvider } from '@/shell/components/realtime-provider';

export default async function DashboardLayout({ children }: { children: React.ReactNode }) {
  // `/me` once per request: gates the segment (401 → sign-in) and hydrates useMe() on the client.
  const { queryClient } = await prefetchMe();
  const cookieStore = await cookies();
  const defaultOpen = cookieStore.get('sidebar_state')?.value === 'true';
  const t = await getTranslations('common');
  return (
    <HydrationBoundary state={dehydrate(queryClient)}>
      <SessionProvider>
        <RealtimeProvider>
          <KBar>
            <SidebarProvider defaultOpen={defaultOpen}>
              <a
                href='#main-content'
                className='bg-background ring-ring sr-only rounded-md px-3 py-2 text-sm font-medium shadow focus:not-sr-only focus:absolute focus:top-2 focus:start-2 focus:z-50 focus:ring-2'
              >
                {t('skipToContent')}
              </a>
              <AppSidebar />
              <SidebarInset id='main-content' tabIndex={-1} className='scroll-mt-16'>
                <Header />
                <InfobarProvider defaultOpen={false}>
                  {children}
                  <InfoSidebar side='right' />
                </InfobarProvider>
              </SidebarInset>
            </SidebarProvider>
          </KBar>
        </RealtimeProvider>
      </SessionProvider>
    </HydrationBoundary>
  );
}
