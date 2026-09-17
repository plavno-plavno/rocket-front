'use client';

import { gsap } from 'gsap';
import { useEffect, useRef } from 'react';

/** Own the animated DOM node: never mutate a not-yet-hydrated Suspense descendant. */
export function usePanelMotion(key: string | boolean = true, stagger = false) {
  const ref = useRef<HTMLDivElement>(null);
  useEffect(() => {
    const element = ref.current;
    if (!element) return;
    const media = gsap.matchMedia();
    media.add('(prefers-reduced-motion: no-preference)', () => {
      const siblings = element.parentElement ? Array.from(element.parentElement.children) : [];
      gsap.from(element, {
        y: 12,
        opacity: 0,
        duration: 0.5,
        delay: stagger ? Math.min(siblings.indexOf(element) * 0.055, 0.22) : 0,
        ease: 'power2.out',
        clearProps: 'transform,opacity'
      });
    });
    return () => media.revert();
  }, [key, stagger]);
  return ref;
}
