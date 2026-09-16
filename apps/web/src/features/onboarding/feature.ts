import { defineFeature } from '@/shell/feature';

export default defineFeature({
  id: 'onboarding',
  track: 'UI-F7',
  status: 'planned',
  screens: ['S-ONB-01'],
  routes: ['/dashboard/onboarding']
});
