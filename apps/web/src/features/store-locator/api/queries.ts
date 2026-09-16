import { queryOptions } from '@tanstack/react-query';
import { listWidgets, getWidget } from './service';
import type { ListWidgetsQuery } from './types';

/** Query keys: prefixed with the feature id; scoped lists include `scope` (SDD-01 §5.1). */
export const storeLocatorKeys = {
  all: ['store-locator'] as const,
  widgets: (params?: ListWidgetsQuery) =>
    [...storeLocatorKeys.all, 'widgets', params ?? {}] as const,
  widget: (id: string) => [...storeLocatorKeys.all, 'widget', id] as const
};

export const widgetsQueryOptions = (params?: ListWidgetsQuery) =>
  queryOptions({ queryKey: storeLocatorKeys.widgets(params), queryFn: () => listWidgets(params) });

export const widgetQueryOptions = (id: string) =>
  queryOptions({ queryKey: storeLocatorKeys.widget(id), queryFn: () => getWidget(id) });
