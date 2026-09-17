import { defineFeature } from '@/shell/feature';

export default defineFeature({
  id: 'help',
  track: 'UI-0',
  status: 'ready',
  nav: [
    {
      group: 'help',
      order: 10,
      titleKey: 'help.nav.center',
      url: '/dashboard/help',
      icon: 'help'
    }
  ],
  routes: ['/dashboard/help']
});
