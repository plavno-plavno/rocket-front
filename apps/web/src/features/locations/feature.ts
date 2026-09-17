import { defineFeature } from '@/shell/feature';

export default defineFeature({
  id: 'locations',
  track: 'UI-F1',
  status: 'ready',
  screens: ['S-LOC-01', 'S-LOC-02', 'S-LOC-03'],
  nav: [
    {
      group: 'work',
      order: 10,
      titleKey: 'locations.nav.list',
      url: '/dashboard/locations',
      icon: 'locations',
      shortcut: ['d', 'l'],
      access: { permission: 'locations.read' }
    }
  ],
  kbar: [
    {
      id: 'locations.find',
      titleKey: 'locations.kbar.find',
      kind: 'dialog',
      keywords: 'компания филиал магазин location'
    },
    {
      id: 'locations.create',
      titleKey: 'locations.kbar.create',
      kind: 'navigate',
      url: '/dashboard/locations/new',
      access: { permission: 'locations.edit' }
    },
    {
      id: 'locations.import',
      titleKey: 'locations.kbar.import',
      kind: 'navigate',
      url: '/dashboard/locations/import',
      access: { permission: 'locations.edit' }
    }
  ],
  routes: ['/dashboard/locations']
});
