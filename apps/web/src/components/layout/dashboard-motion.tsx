'use client';

import { usePathname } from 'next/navigation';
import type { ReactNode } from 'react';
import { usePanelMotion } from '@/hooks/use-panel-motion';

/** Animate only our hydrated wrapper; streamed descendants hydrate independently. */
export function DashboardMotion({ children }: { children: ReactNode }) {
  const pathname = usePathname();
  const root = usePanelMotion(pathname);
  return (
    <div ref={root} className='lp-dashboard-content flex min-w-0 flex-1 flex-col'>
      {children}
    </div>
  );
}
