import { queryOptions } from '@tanstack/react-query';
import { listWidgets, getWidget } from './service';
import type { ListWidgetsQuery } from './types';

/** Query keys: prefixed with the feature id; scoped lists include `scope` (SDD-01 §5.1). */
export const widgetsKeys = {
  all: ['widgets'] as const,
  widgets: (params?: ListWidgetsQuery) => [...widgetsKeys.all, 'widgets', params ?? {}] as const,
  widget: (id: string) => [...widgetsKeys.all, 'widget', id] as const
};

export const widgetsQueryOptions = (params?: ListWidgetsQuery) =>
  queryOptions({ queryKey: widgetsKeys.widgets(params), queryFn: () => listWidgets(params) });

export const widgetQueryOptions = (id: string) =>
  queryOptions({ queryKey: widgetsKeys.widget(id), queryFn: () => getWidget(id) });
