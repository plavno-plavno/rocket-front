'use client';

import { useTranslations } from 'next-intl';
import { parseAsString, useQueryStates } from 'nuqs';
import { useMemo } from 'react';
import { Icons } from '@/components/icons';
import { Badge } from '@/components/ui/badge';
import { Button } from '@/components/ui/button';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import {
  Empty,
  EmptyDescription,
  EmptyHeader,
  EmptyMedia,
  EmptyTitle
} from '@/components/ui/empty';
import { Input } from '@/components/ui/input';
import { Kbd } from '@/components/ui/kbd';
import { LinkButton } from '@/components/ui/link-button';
import {
  Sheet,
  SheetContent,
  SheetDescription,
  SheetFooter,
  SheetHeader,
  SheetTitle
} from '@/components/ui/sheet';
import { useMe } from '@/features/session';
import { cn } from '@/lib/utils';

/**
 * Knowledge base sections and articles. Titles / bodies live in `messages/*.json` under
 * `help.articles.<id>`; `href` points to the screen the article explains (must exist in `feature.ts` routes).
 */
const SECTIONS = [
  {
    id: 'start',
    icon: 'rocket',
    articles: [
      { id: 'onboarding', href: '/dashboard/onboarding' },
      { id: 'scope', href: '/dashboard/overview' },
      { id: 'roles', href: '/dashboard/settings/users' }
    ]
  },
  {
    id: 'locations',
    icon: 'locations',
    articles: [
      { id: 'import', href: '/dashboard/locations/import' },
      { id: 'sync', href: '/dashboard/sources' },
      { id: 'actionRequired', href: '/dashboard/locations?syncStatus=action_required' },
      { id: 'policies', href: '/dashboard/settings/sources' }
    ]
  },
  {
    id: 'reviews',
    icon: 'reviews',
    articles: [
      { id: 'inbox', href: '/dashboard/reviews' },
      { id: 'templates', href: '/dashboard/reviews/templates' },
      { id: 'autoReplies', href: '/dashboard/reviews/auto-replies' },
      { id: 'ai', href: '/dashboard/reviews/ai' },
      { id: 'complaints', href: '/dashboard/reviews' }
    ]
  },
  {
    id: 'analytics',
    icon: 'analytics',
    articles: [
      { id: 'reviewAnalytics', href: '/dashboard/analytics/reviews' },
      { id: 'presence', href: '/dashboard/presence' },
      { id: 'rank', href: '/dashboard/rank' }
    ]
  },
  {
    id: 'growth',
    icon: 'megaphone',
    articles: [
      { id: 'campaigns', href: '/dashboard/review-generation/campaigns' },
      { id: 'widgets', href: '/dashboard/widgets/reviews' },
      { id: 'publications', href: '/dashboard/publications' }
    ]
  },
  {
    id: 'settings',
    icon: 'settings',
    articles: [
      { id: 'accounts', href: '/dashboard/settings/accounts' },
      { id: 'notifications', href: '/dashboard/settings/notifications' },
      { id: 'integrations', href: '/dashboard/settings/integrations' },
      { id: 'security', href: '/dashboard/settings/profile' }
    ]
  }
] as const;

type SectionId = (typeof SECTIONS)[number]['id'];
type ArticleId = (typeof SECTIONS)[number]['articles'][number]['id'];

const HOTKEYS = [
  { keys: ['⌘', 'K'], id: 'search' },
  { keys: ['D', 'O'], id: 'overview' },
  { keys: ['J', 'K'], id: 'inboxNav' },
  { keys: ['R'], id: 'reply' },
  { keys: ['T'], id: 'tags' },
  { keys: ['A'], id: 'assign' },
  { keys: ['⌘', '↵'], id: 'publish' }
] as const;

const params = { q: parseAsString.withDefault(''), article: parseAsString.withDefault('') };

const SUPPORT_EMAIL = process.env.NEXT_PUBLIC_SUPPORT_EMAIL ?? 'support@example.ru';

/** Knowledge base: sections × articles with search, an article sheet, hotkeys and support contacts. */
export function HelpCenter() {
  const t = useTranslations('help');
  const me = useMe();
  const [p, setP] = useQueryStates(params, { shallow: true });
  const q = p.q.trim().toLowerCase();

  const sections = useMemo(
    () =>
      SECTIONS.map((s) => ({
        ...s,
        title: t(`sections.${s.id}`),
        articles: s.articles
          .map((a) => ({
            ...a,
            section: s.id as SectionId,
            title: t(`articles.${a.id}.title`),
            summary: t(`articles.${a.id}.summary`),
            body: t(`articles.${a.id}.body`)
          }))
          .filter(
            (a) =>
              !q ||
              a.title.toLowerCase().includes(q) ||
              a.summary.toLowerCase().includes(q) ||
              a.body.toLowerCase().includes(q)
          )
      })).filter((s) => s.articles.length > 0),
    [t, q]
  );
  const open =
    sections.flatMap((s) => s.articles).find((a) => a.id === p.article) ??
    SECTIONS.flatMap((s) => s.articles.map((a) => ({ ...a, section: s.id })))
      .filter((a) => a.id === p.article)
      .map((a) => ({
        ...a,
        title: t(`articles.${a.id as ArticleId}.title`),
        summary: t(`articles.${a.id as ArticleId}.summary`),
        body: t(`articles.${a.id as ArticleId}.body`)
      }))[0];
  const total = sections.reduce((n, s) => n + s.articles.length, 0);

  return (
    <div className='flex flex-col gap-6' data-testid='help-center'>
      <div className='relative max-w-xl'>
        <Icons.search className='text-muted-foreground absolute top-1/2 left-3 size-4 -translate-y-1/2' />
        <Input
          value={p.q}
          onChange={(e) => setP({ q: e.target.value })}
          placeholder={t('search')}
          className='h-10 pl-9'
          aria-label={t('search')}
          data-testid='help-search'
        />
      </div>

      {sections.length === 0 ? (
        <Empty>
          <EmptyHeader>
            <EmptyMedia variant='icon'>
              <Icons.search />
            </EmptyMedia>
            <EmptyTitle>{t('nothing', { q: p.q.trim() })}</EmptyTitle>
            <EmptyDescription>{t('nothingHint', { email: SUPPORT_EMAIL })}</EmptyDescription>
          </EmptyHeader>
          <Button variant='outline' onClick={() => setP({ q: '' })}>
            {t('clear')}
          </Button>
        </Empty>
      ) : (
        <div className='grid gap-4 md:grid-cols-2 xl:grid-cols-3' data-testid='help-sections'>
          {sections.map((s) => {
            const Icon = Icons[s.icon];
            return (
              <Card key={s.id} data-section={s.id}>
                <CardHeader>
                  <CardTitle className='flex items-center gap-2'>
                    <span className='bg-primary/10 text-primary flex size-8 items-center justify-center rounded-md'>
                      <Icon className='size-4' />
                    </span>
                    {s.title}
                  </CardTitle>
                  <CardDescription>
                    {t('articlesCount', { count: s.articles.length })}
                  </CardDescription>
                </CardHeader>
                <CardContent className='px-2 pb-2'>
                  <ul className='flex flex-col'>
                    {s.articles.map((a) => (
                      <li key={a.id}>
                        <button
                          type='button'
                          onClick={() => setP({ article: a.id })}
                          className='hover:bg-accent/60 flex w-full flex-col gap-0.5 rounded-md px-3 py-2 text-left'
                          data-article={a.id}
                        >
                          <span className='text-sm font-medium'>{a.title}</span>
                          <span className='text-muted-foreground line-clamp-2 text-xs'>
                            {a.summary}
                          </span>
                        </button>
                      </li>
                    ))}
                  </ul>
                </CardContent>
              </Card>
            );
          })}
        </div>
      )}
      {q && sections.length > 0 && (
        <p className='text-muted-foreground text-xs'>{t('found', { count: total })}</p>
      )}

      <div className='grid gap-4 lg:grid-cols-2'>
        <Card data-testid='help-hotkeys'>
          <CardHeader>
            <CardTitle>{t('hotkeys.title')}</CardTitle>
            <CardDescription>{t('hotkeys.description')}</CardDescription>
          </CardHeader>
          <CardContent>
            <dl className='grid gap-2 sm:grid-cols-2'>
              {HOTKEYS.map((h) => (
                <div
                  key={h.id}
                  className='flex items-center justify-between gap-3 rounded-md border px-3 py-2 text-sm'
                >
                  <dt>{t(`hotkeys.${h.id}`)}</dt>
                  <dd className='flex gap-1'>
                    {h.keys.map((k) => (
                      <Kbd key={k}>{k}</Kbd>
                    ))}
                  </dd>
                </div>
              ))}
            </dl>
          </CardContent>
        </Card>
        <Card data-testid='help-support'>
          <CardHeader>
            <CardTitle>{t('support.title')}</CardTitle>
            <CardDescription>{t('support.description')}</CardDescription>
          </CardHeader>
          <CardContent className='flex flex-col gap-3 text-sm'>
            <div className='flex items-center gap-2'>
              <Icons.mail className='text-muted-foreground size-4' />
              <a href={`mailto:${SUPPORT_EMAIL}`} className='underline-offset-4 hover:underline'>
                {SUPPORT_EMAIL}
              </a>
            </div>
            <p className='text-muted-foreground'>{t('support.hint')}</p>
            <div className='bg-muted rounded-md p-3 font-mono text-xs'>
              <div>
                {t('support.tenant')}: {me.tenant.name} · {me.tenant.id}
              </div>
              <div>
                {t('support.user')}: {me.user.email} · {t(`roles.${me.role}`)}
              </div>
            </div>
            <div className='flex flex-wrap gap-2'>
              <LinkButton
                href={`mailto:${SUPPORT_EMAIL}?subject=${encodeURIComponent(t('support.subject', { tenant: me.tenant.name }))}`}
                size='sm'
              >
                <Icons.send className='size-4' /> {t('support.write')}
              </LinkButton>
              <LinkButton href='/dashboard/settings/accounts' variant='outline' size='sm'>
                <Icons.sources className='size-4' /> {t('support.accounts')}
              </LinkButton>
            </div>
          </CardContent>
        </Card>
      </div>

      <Sheet open={!!open} onOpenChange={(o) => !o && setP({ article: '' })}>
        <SheetContent
          className='flex w-full flex-col gap-0 p-0 sm:max-w-xl'
          data-testid='help-article'
        >
          {open && (
            <>
              <SheetHeader className='border-b'>
                <Badge variant='secondary' className='w-fit'>
                  {t(`sections.${open.section as SectionId}`)}
                </Badge>
                <SheetTitle>{open.title}</SheetTitle>
                <SheetDescription>{open.summary}</SheetDescription>
              </SheetHeader>
              <div className='flex-1 overflow-y-auto p-4'>
                {open.body.split('\n\n').map((para, i) => (
                  <p key={i} className={cn('text-sm leading-relaxed', i > 0 && 'mt-3')}>
                    {para}
                  </p>
                ))}
              </div>
              <SheetFooter className='flex-row justify-end gap-2 border-t'>
                <Button variant='outline' onClick={() => setP({ article: '' })}>
                  {t('close')}
                </Button>
                <LinkButton href={open.href}>
                  {t('openScreen')} <Icons.arrowRight className='size-4' />
                </LinkButton>
              </SheetFooter>
            </>
          )}
        </SheetContent>
      </Sheet>
    </div>
  );
}
