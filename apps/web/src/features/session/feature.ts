import { defineFeature } from '@/shell/feature';

export default defineFeature({
  id: 'session',
  track: 'UI-0',
  status: 'ready',
  screens: ['auth'],
  routes: ['/auth']
});
