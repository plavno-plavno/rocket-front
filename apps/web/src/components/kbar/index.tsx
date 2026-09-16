'use client';
import {
  KBarAnimator,
  KBarPortal,
  KBarPositioner,
  KBarProvider,
  KBarSearch,
  type Action
} from 'kbar';
import { useTranslations } from 'next-intl';
import { useRouter } from 'next/navigation';
import { useMemo } from 'react';
import { Kbd } from '@/components/ui/kbd';
import { features } from '@/generated/feature-registry';
import { useMe } from '@/features/session';
import { checkAccess } from '@/lib/permissions';
import { useNavGroups } from '@/shell/hooks/use-nav-groups';
import RenderResults from './render-result';
import useThemeSwitching from './use-theme-switching';

/** Name of the DOM event dispatched for `kind: 'dialog'` kbar actions; detail = action id. */
export const KBAR_DIALOG_EVENT = 'lp:kbar-action';

export default function KBar({ children }: { children: React.ReactNode }) {
  const router = useRouter();
  const me = useMe();
  const t = useTranslations();
  const tl = useTranslations('layout');
  const groups = useNavGroups();

  const actions = useMemo<Action[]>(() => {
    const navigateTo = (url: string) => router.push(url);
    const navActions = groups.flatMap((group) =>
      group.items.flatMap((item) => {
        const base: Action[] = item.disabled
          ? []
          : [
              {
                id: `nav:${item.url}`,
                name: item.title,
                shortcut: item.shortcut,
                keywords: item.title.toLowerCase(),
                section: group.label,
                perform: () => navigateTo(item.url)
              }
            ];
        const children: Action[] = (item.items ?? [])
          .filter((c) => !c.disabled)
          .map((c) => ({
            id: `nav:${c.url}`,
            name: c.title,
            keywords: c.title.toLowerCase(),
            section: item.title,
            perform: () => navigateTo(c.url)
          }));
        return [...base, ...children];
      })
    );
    const featureActions: Action[] = features.flatMap((f) =>
      (f.kbar ?? [])
        .filter((a) => f.status !== 'planned' && checkAccess(me, a.access))
        .map((a) => ({
          id: a.id,
          name: t(a.titleKey as never),
          shortcut: a.shortcut,
          keywords: a.keywords,
          section: a.section ? t(a.section as never) : tl('actions'),
          perform: () => {
            if (a.kind === 'navigate' && a.url) navigateTo(a.url);
            else window.dispatchEvent(new CustomEvent(KBAR_DIALOG_EVENT, { detail: a.id }));
          }
        }))
    );
    return [...featureActions, ...navActions];
  }, [router, groups, me, t, tl]);

  return (
    <KBarProvider actions={actions}>
      <KBarComponent>{children}</KBarComponent>
    </KBarProvider>
  );
}

const KBarComponent = ({ children }: { children: React.ReactNode }) => {
  useThemeSwitching();
  const t = useTranslations('layout.kbar');

  return (
    <>
      <KBarPortal>
        <KBarPositioner className='bg-black/10 supports-backdrop-filter:backdrop-blur-xs fixed inset-0 z-99999 flex items-start! justify-center p-4! pt-[14vh]!'>
          <KBarAnimator className='bg-popover text-popover-foreground ring-foreground/10 relative mx-auto w-full max-w-[600px] overflow-hidden rounded-xl shadow-lg ring-1'>
            <div className='bg-popover sticky top-0 z-10 border-b'>
              <KBarSearch
                defaultPlaceholder={t('placeholder')}
                className='placeholder:text-muted-foreground w-full border-none bg-transparent px-4 py-3.5 text-sm outline-hidden focus:ring-0 focus:outline-hidden'
              />
            </div>
            <div className='h-[400px]'>
              <RenderResults />
            </div>
            <div className='text-muted-foreground flex items-center gap-3 border-t px-3 py-2 text-xs'>
              <span className='flex items-center gap-1'>
                <Kbd>↑</Kbd>
                <Kbd>↓</Kbd> {t('navigate')}
              </span>
              <span className='flex items-center gap-1'>
                <Kbd>↵</Kbd> {t('open')}
              </span>
              <span className='flex items-center gap-1'>
                <Kbd>esc</Kbd> {t('close')}
              </span>
            </div>
          </KBarAnimator>
        </KBarPositioner>
      </KBarPortal>
      {children}
    </>
  );
};
