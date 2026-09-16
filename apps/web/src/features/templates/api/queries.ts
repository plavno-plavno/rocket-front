import { queryOptions } from '@tanstack/react-query';
import {
  listReplyTemplates,
  getReplyTemplate,
  listTemplateGroups,
  getTemplateGroup
} from './service';
import type { ListReplyTemplatesQuery, ListTemplateGroupsQuery } from './types';

/** Query keys: prefixed with the feature id; scoped lists include `scope` (SDD-01 §5.1). */
export const templatesKeys = {
  all: ['templates'] as const,
  replyTemplates: (params?: ListReplyTemplatesQuery) =>
    [...templatesKeys.all, 'replyTemplates', params ?? {}] as const,
  replyTemplate: (id: string) => [...templatesKeys.all, 'replyTemplate', id] as const,
  templateGroups: (params?: ListTemplateGroupsQuery) =>
    [...templatesKeys.all, 'templateGroups', params ?? {}] as const,
  templateGroup: (id: string) => [...templatesKeys.all, 'templateGroup', id] as const
};

export const replyTemplatesQueryOptions = (params?: ListReplyTemplatesQuery) =>
  queryOptions({
    queryKey: templatesKeys.replyTemplates(params),
    queryFn: () => listReplyTemplates(params)
  });

export const replyTemplateQueryOptions = (id: string) =>
  queryOptions({ queryKey: templatesKeys.replyTemplate(id), queryFn: () => getReplyTemplate(id) });

export const templateGroupsQueryOptions = (params?: ListTemplateGroupsQuery) =>
  queryOptions({
    queryKey: templatesKeys.templateGroups(params),
    queryFn: () => listTemplateGroups(params)
  });

export const templateGroupQueryOptions = (id: string) =>
  queryOptions({ queryKey: templatesKeys.templateGroup(id), queryFn: () => getTemplateGroup(id) });
