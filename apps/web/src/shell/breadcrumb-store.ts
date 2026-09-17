'use client';

import { useEffect } from 'react';
import { create } from 'zustand';

interface BreadcrumbState {
  titles: Record<string, string>;
  set: (path: string, title: string | null) => void;
}

/** Titles for dynamic segments (e.g. `/dashboard/locations/loc_…` → location name). */
export const useBreadcrumbStore = create<BreadcrumbState>((set) => ({
  titles: {},
  set: (path, title) =>
    set((s) => {
      const titles = { ...s.titles };
      if (title) titles[path] = title;
      else delete titles[path];
      return { titles };
    })
}));

/** Registers a human title for the given path while the component is mounted. */
export function useBreadcrumbTitle(path: string, title: string | undefined) {
  const set = useBreadcrumbStore((s) => s.set);
  useEffect(() => {
    if (!title) return;
    set(path, title);
    return () => set(path, null);
  }, [path, title, set]);
}
