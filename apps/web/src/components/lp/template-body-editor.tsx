'use client';

import { useTranslations } from 'next-intl';
import { useCallback, useEffect, useMemo, useRef, useState } from 'react';
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

/** Finds an unclosed `{{` right before the caret and returns the typed prefix. */
function openToken(text: string, caret: number): { start: number; query: string } | null {
  const before = text.slice(0, caret);
  const open = before.lastIndexOf('{{');
  if (open < 0) return null;
  const after = before.slice(open + 2);
  if (after.includes('}}') || /[^a-z_]/.test(after)) return null;
  return { start: open, query: after };
}

/**
 * Template body editor (SDD-01 §4.1): variable chips insert at the caret; typing `{{` opens an
 * inline autocomplete (↑/↓, Enter/Tab, Esc); live preview and unknown-variable warning.
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
  const [token, setToken] = useState<{ start: number; query: string } | null>(null);
  const [active, setActive] = useState(0);
  const suggestions = useMemo(
    () => (token ? TEMPLATE_VARIABLES.filter((v) => v.startsWith(token.query)) : []),
    [token]
  );

  const refreshToken = useCallback(() => {
    const el = ref.current;
    if (!el) return setToken(null);
    setToken(openToken(el.value, el.selectionStart ?? el.value.length));
    setActive(0);
  }, []);

  const insertAt = (start: number, end: number, name: TemplateVariable) => {
    const el = ref.current;
    const tokenText = `{{${name}}}`;
    const next = value.slice(0, start) + tokenText + value.slice(end);
    onChange(next);
    setToken(null);
    requestAnimationFrame(() => {
      el?.focus();
      el?.setSelectionRange(start + tokenText.length, start + tokenText.length);
    });
  };

  const insertChip = (name: TemplateVariable) => {
    const el = ref.current;
    const start = el?.selectionStart ?? value.length;
    const end = el?.selectionEnd ?? start;
    insertAt(start, end, name);
  };

  const completeSuggestion = (name: TemplateVariable) => {
    if (!token || !ref.current) return;
    insertAt(token.start, ref.current.selectionStart ?? value.length, name);
  };

  useEffect(() => {
    if (!token) setActive(0);
  }, [token]);

  const onKeyDown = (e: React.KeyboardEvent<HTMLTextAreaElement>) => {
    if (!token || !suggestions.length) return;
    if (e.key === 'ArrowDown') {
      e.preventDefault();
      setActive((a) => (a + 1) % suggestions.length);
    } else if (e.key === 'ArrowUp') {
      e.preventDefault();
      setActive((a) => (a - 1 + suggestions.length) % suggestions.length);
    } else if (e.key === 'Enter' || e.key === 'Tab') {
      e.preventDefault();
      completeSuggestion(suggestions[active]);
    } else if (e.key === 'Escape') {
      setToken(null);
    }
  };

  const listId = `${id ?? 'template-body'}-suggestions`;

  return (
    <div className={cn('flex flex-col gap-2', className)}>
      <div className='flex flex-wrap gap-1' aria-label={t('variables')}>
        {TEMPLATE_VARIABLES.map((v) => (
          <button
            key={v}
            type='button'
            disabled={disabled}
            onClick={() => insertChip(v)}
            className='focus-visible:ring-ring rounded-md focus-visible:ring-2 focus-visible:outline-none'
          >
            <Badge variant='secondary' className='cursor-pointer font-mono text-[11px]'>
              {`{{${v}}}`}
            </Badge>
          </button>
        ))}
      </div>
      <div className='relative'>
        <Textarea
          ref={ref}
          id={id}
          value={value}
          onChange={(e) => {
            onChange(e.target.value);
            requestAnimationFrame(refreshToken);
          }}
          onKeyDown={onKeyDown}
          onClick={refreshToken}
          onBlur={() => setTimeout(() => setToken(null), 150)}
          rows={6}
          maxLength={maxLength}
          disabled={disabled}
          aria-invalid={unknown.length > 0}
          aria-autocomplete='list'
          aria-controls={token ? listId : undefined}
          aria-expanded={!!token && suggestions.length > 0}
        />
        {token && suggestions.length > 0 && (
          <div
            id={listId}
            role='listbox'
            className='bg-popover text-popover-foreground absolute bottom-2 left-2 z-20 w-56 rounded-md border p-1 shadow-md'
            aria-label={t('variables')}
          >
            {suggestions.map((v, i) => (
              <div key={v} role='option' aria-selected={i === active}>
                <button
                  type='button'
                  onMouseDown={(e) => e.preventDefault()}
                  onClick={() => completeSuggestion(v)}
                  className={cn(
                    'w-full rounded-sm px-2 py-1 text-left font-mono text-xs',
                    i === active && 'bg-accent text-accent-foreground'
                  )}
                >
                  {`{{${v}}}`}
                </button>
              </div>
            ))}
          </div>
        )}
      </div>
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
