import { useRegisterActions } from 'kbar';
import { useTranslations } from 'next-intl';
import { useTheme } from 'next-themes';
import { useThemeConfig } from '@/components/themes/active-theme';
import { THEMES } from '@/components/themes/theme.config';

const useThemeSwitching = () => {
  const { theme, setTheme } = useTheme();
  const { activeTheme, setActiveTheme } = useThemeConfig();
  const t = useTranslations('layout.kbar');
  const tl = useTranslations('layout');

  const toggleDarkLight = () => {
    setTheme(theme === 'light' ? 'dark' : 'light');
  };

  const cycleTheme = () => {
    const currentIndex = THEMES.findIndex((x) => x.value === activeTheme);
    const nextIndex = (currentIndex + 1) % THEMES.length;
    setActiveTheme(THEMES[nextIndex].value);
  };

  const themeActions = [
    {
      id: 'theme.cycle',
      name: t('switchTheme'),
      shortcut: ['t', 't'],
      section: t('themeSection'),
      perform: cycleTheme
    },
    {
      id: 'theme.toggle',
      name: tl('toggleTheme'),
      shortcut: ['d', 'd'],
      section: t('themeSection'),
      perform: toggleDarkLight
    },
    {
      id: 'theme.light',
      name: tl('light'),
      section: t('themeSection'),
      perform: () => setTheme('light')
    },
    {
      id: 'theme.dark',
      name: tl('dark'),
      section: t('themeSection'),
      perform: () => setTheme('dark')
    }
  ];

  useRegisterActions(themeActions, [theme, activeTheme, t, tl]);
};

export default useThemeSwitching;
