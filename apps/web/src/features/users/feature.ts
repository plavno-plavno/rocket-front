import { defineFeature } from '@/shell/feature';

export default defineFeature({
  id: 'users',
  track: 'UI-F7',
  status: 'planned',
  screens: ['S-SET-01'],
  nav: [
    {
      group: 'settings',
      order: 20,
      titleKey: 'users.nav.list',
      url: '/dashboard/settings/users',
      icon: 'teams',
      access: {
        permission: 'users.manage'
      }
    }
  ],
  routes: ['/dashboard/settings/users']
});
