import { defineFeature } from '@/shell/feature';

export default defineFeature({
  id: 'settings',
  track: 'UI-F7',
  status: 'ready',
  screens: ['S-SET-02', 'S-SET-03', 'S-SET-04', 'S-SET-05', 'S-SET-06'],
  nav: [
    {
      group: 'settings',
      order: 10,
      titleKey: 'settings.nav.profile',
      url: '/dashboard/settings/profile',
      icon: 'account'
    },
    {
      group: 'settings',
      order: 30,
      titleKey: 'settings.nav.accounts',
      url: '/dashboard/settings/accounts',
      icon: 'sources',
      access: {
        permission: 'accounts.manage'
      }
    },
    {
      group: 'settings',
      order: 40,
      titleKey: 'settings.nav.notifications',
      url: '/dashboard/settings/notifications',
      icon: 'notification'
    },
    {
      group: 'settings',
      order: 50,
      titleKey: 'settings.nav.integrations',
      url: '/dashboard/settings/integrations',
      icon: 'integrations',
      access: {
        permission: 'integrations.manage'
      }
    },
    {
      group: 'settings',
      order: 60,
      titleKey: 'settings.nav.sources',
      url: '/dashboard/settings/sources',
      icon: 'settings',
      access: {
        permission: 'accounts.manage'
      }
    }
  ],
  routes: ['/dashboard/settings']
});
