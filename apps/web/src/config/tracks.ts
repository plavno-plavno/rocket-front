/** UI tracks (SDD-01T §4). Mirrors `tracks.json`; used by `feature.ts` for ownership metadata. */
export const TRACKS = [
  'UI-0',
  'UI-DS',
  'UI-F1',
  'UI-F2',
  'UI-F3',
  'UI-F4',
  'UI-F5',
  'UI-F6',
  'UI-F7',
  'UI-F8'
] as const;
export type TrackId = (typeof TRACKS)[number];
