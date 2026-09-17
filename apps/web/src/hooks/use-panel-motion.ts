'use client';

import { gsap } from 'gsap';
import { useEffect, useRef } from 'react';

/**
 * Entrance motion for a panel. Own the animated DOM node: never mutate a not-yet-hydrated Suspense
 * descendant.
 * - `key === false` means «not ready yet» (e.g. a KPI still loading): nothing animates.
 * - The entrance plays once per mounted node. A later key change (data refetched because a filter
 *   changed) must not replay it — the whole KPI row used to jump 12px on every checkbox. Pass
 *   `replay: true` only where a new key really is new content (the route in DashboardMotion).
 */
export function usePanelMotion(
  key: string | boolean = true,
  stagger = false,
  { replay = false }: { replay?: boolean } = {}
) {
  const ref = useRef<HTMLDivElement>(null);
  const played = useRef(false);
  useEffect(() => {
    const element = ref.current;
    if (!element || key === false) return;
    if (played.current && !replay) return;
    played.current = true;
    let finished = false;
    const media = gsap.matchMedia();
    media.add('(prefers-reduced-motion: no-preference)', () => {
      const siblings = element.parentElement ? Array.from(element.parentElement.children) : [];
      gsap.from(element, {
        y: 12,
        opacity: 0,
        duration: 0.5,
        delay: stagger ? Math.min(siblings.indexOf(element) * 0.055, 0.22) : 0,
        ease: 'power2.out',
        clearProps: 'transform,opacity',
        onComplete: () => {
          finished = true;
        }
      });
    });
    return () => {
      media.revert();
      // Interrupted (StrictMode double effect, fast unmount): let the next run play it again.
      if (!finished) played.current = false;
    };
  }, [key, stagger, replay]);
  return ref;
}
