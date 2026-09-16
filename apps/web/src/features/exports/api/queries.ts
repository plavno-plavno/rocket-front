import { queryOptions } from '@tanstack/react-query';
import { listExports, getExport } from './service';

/** Query keys: prefixed with the feature id; scoped lists include `scope` (SDD-01 §5.1). */
export const exportsKeys = {
  all: ['exports'] as const,
  exports: () => [...exportsKeys.all, 'exports'] as const,
  export: (id: string) => [...exportsKeys.all, 'export', id] as const
};

export const exportsQueryOptions = () =>
  queryOptions({ queryKey: exportsKeys.exports(), queryFn: () => listExports() });

export const exportQueryOptions = (id: string) =>
  queryOptions({ queryKey: exportsKeys.export(id), queryFn: () => getExport(id) });
