'use client';

import { useTranslations } from 'next-intl';
import { useRef } from 'react';
import { Badge } from '@/components/ui/badge';
import { Textarea } from '@/components/ui/textarea';
import { cn } from '@/lib/utils';

/** Whitelisted template variables (SDD-00 §3.9). */
export const TEMPLATE_VARIABLES = [
  'author_name',
  'location_name',
  'location_address',
  'brand_name',
  'rating',
  'manager_name',
  'platform_name'
] as const;
export type TemplateVariable = (typeof TEMPLATE_VARIABLES)[number];

export interface TemplateBodyEditorProps {
  value: string;
  onChange: (value: string) => void;
  /** Values used for the live preview; missing ones show as `{{var}}`. */
  previewContext?: Partial<Record<TemplateVariable, string>>;
  maxLength?: number;
  disabled?: boolean;
  className?: string;
  id?: string;
}

const VAR_RE = /\{\{\s*([a-z_]+)\s*\}\}/g;

export function renderTemplate(
  body: string,
  ctx: Partial<Record<string, string | undefined>>
): string {
  return body.replace(
    VAR_RE,
    (m, name: string) => (ctx as Record<string, string | undefined>)[name] ?? m
  );
}

export function unknownVariables(body: string): string[] {
  const out = new Set<string>();
  for (const m of body.matchAll(VAR_RE))
    if (!(TEMPLATE_VARIABLES as readonly string[]).includes(m[1])) out.add(m[1]);
  return [...out];
}

/**
 * Template body editor (SDD-01 §4.1): textarea + variable chips that insert at the caret + live
 * preview and unknown-variable warning. UI-DS may replace the chips with a `{{` autocomplete popover.
 */
export function TemplateBodyEditor({
  value,
  onChange,
  previewContext,
  maxLength,
  disabled,
  className,
  id
}: TemplateBodyEditorProps) {
  const t = useTranslations('templateEditor');
  const ref = useRef<HTMLTextAreaElement>(null);
  const unknown = unknownVariables(value);

  const insert = (name: TemplateVariable) => {
    const el = ref.current;
    const token = `{{${name}}}`;
    if (!el) return onChange(value + token);
    const start = el.selectionStart ?? value.length;
    const end = el.selectionEnd ?? start;
    const next = value.slice(0, start) + token + value.slice(end);
    onChange(next);
    requestAnimationFrame(() => {
      el.focus();
      el.setSelectionRange(start + token.length, start + token.length);
    });
  };

  return (
    <div className={cn('flex flex-col gap-2', className)}>
      <div className='flex flex-wrap gap-1' aria-label={t('variables')}>
        {TEMPLATE_VARIABLES.map((v) => (
          <button
            key={v}
            type='button'
            disabled={disabled}
            onClick={() => insert(v)}
            className='focus-visible:ring-ring rounded-md focus-visible:ring-2 focus-visible:outline-none'
          >
            <Badge variant='secondary' className='cursor-pointer font-mono text-[11px]'>
              {`{{${v}}}`}
            </Badge>
          </button>
        ))}
      </div>
      <Textarea
        ref={ref}
        id={id}
        value={value}
        onChange={(e) => onChange(e.target.value)}
        rows={6}
        maxLength={maxLength}
        disabled={disabled}
        aria-invalid={unknown.length > 0}
      />
      <div className='text-muted-foreground flex justify-between text-xs'>
        <span className={cn(unknown.length && 'text-status-error')}>
          {unknown.length
            ? t('unknown', { vars: unknown.map((u) => `{{${u}}}`).join(', ') })
            : t('hint')}
        </span>
        {maxLength && (
          <span className='tabular-nums'>
            {value.length}/{maxLength}
          </span>
        )}
      </div>
      {previewContext && value && (
        <div className='bg-muted/50 rounded-md border p-3 text-sm'>
          <p className='text-muted-foreground mb-1 text-xs'>{t('preview')}</p>
          <p className='whitespace-pre-wrap'>{renderTemplate(value, previewContext)}</p>
        </div>
      )}
    </div>
  );
}
