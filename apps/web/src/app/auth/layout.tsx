import { getTranslations } from 'next-intl/server';
import { Icons } from '@/components/icons';
import { ThemeModeToggle } from '@/components/themes/theme-mode-toggle';
import { LanguageSwitcher } from '@/features/session/components/language-switcher';

export default async function AuthLayout({ children }: { children: React.ReactNode }) {
  const t = await getTranslations('app');
  return (
    <div className='bg-muted/40 flex min-h-svh flex-col'>
      <header className='flex items-center justify-between px-6 py-4'>
        <div className='flex items-center gap-2 font-semibold'>
          <Icons.logo className='size-5' />
          <span>{t('name')}</span>
        </div>
        <div className='flex items-center gap-1'>
          <LanguageSwitcher />
          <ThemeModeToggle />
        </div>
      </header>
      <main className='flex flex-1 items-center justify-center p-4'>
        <div className='w-full max-w-sm'>{children}</div>
      </main>
    </div>
  );
}
