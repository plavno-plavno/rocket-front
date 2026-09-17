import type { Schema } from '@lp/contracts';

/** Polls an async export until it is downloadable (≤ 40 s), like the inbox and locations exports. */
export async function waitForExport(
  getExport: (id: string) => Promise<Schema<'Export'>>,
  id: string
): Promise<Schema<'Export'>> {
  for (let i = 0; i < 40; i++) {
    const exp = await getExport(id);
    if (exp.state === 'done' && exp.download_url) return exp;
    if (exp.state === 'failed') throw new Error(exp.error ?? 'export failed');
    await new Promise((r) => setTimeout(r, 1000));
  }
  throw new Error('timeout');
}

const pad = (n: number) => String(n).padStart(2, '0');

/** Seconds → «21 мин 58 с» / «2 ч 05 мин» / «1 д 3 ч» (docs/UX_WRITING.md). */
export function formatDuration(
  seconds: number | null | undefined,
  t: (key: 'd' | 'h' | 'min' | 's') => string
): string {
  if (seconds == null) return '—';
  const s = Math.round(seconds);
  if (s < 3600) return `${Math.floor(s / 60)} ${t('min')} ${pad(s % 60)} ${t('s')}`;
  if (s < 86_400)
    return `${Math.floor(s / 3600)} ${t('h')} ${pad(Math.floor((s % 3600) / 60))} ${t('min')}`;
  return `${Math.floor(s / 86_400)} ${t('d')} ${Math.floor((s % 86_400) / 3600)} ${t('h')}`;
}

/** KPI delta → «+12,5 %» with tone; `null` when no comparison period. */
export function deltaOf(
  kpi: { delta_percent?: number | null } | undefined,
  format: (v: number) => string,
  invert = false
): { delta?: string; deltaTone?: 'positive' | 'negative' | 'neutral' } {
  const d = kpi?.delta_percent;
  if (d == null) return {};
  const tone = d === 0 ? 'neutral' : d > 0 !== invert ? 'positive' : 'negative';
  return { delta: `${d > 0 ? '+' : ''}${format(d)} %`, deltaTone: tone };
}
