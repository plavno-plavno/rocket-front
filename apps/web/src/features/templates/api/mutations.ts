import { mutationOptions, type QueryClient } from '@tanstack/react-query';
import { templatesKeys } from './queries';
import {
  createReplyTemplate,
  updateReplyTemplate,
  deleteReplyTemplate,
  bulkReplyTemplates,
  reorderReplyTemplates,
  renderReplyTemplate,
  createTemplateGroup,
  updateTemplateGroup,
  deleteTemplateGroup,
  reorderTemplateGroups
} from './service';

export const createReplyTemplateMutation = (qc: QueryClient) =>
  mutationOptions({
    mutationKey: [...templatesKeys.all, 'create_reply_template'],
    mutationFn: ({ body }: { body: Parameters<typeof createReplyTemplate>[0] }) =>
      createReplyTemplate(body),
    onSuccess: () => qc.invalidateQueries({ queryKey: templatesKeys.all })
  });

export const updateReplyTemplateMutation = (qc: QueryClient) =>
  mutationOptions({
    mutationKey: [...templatesKeys.all, 'update_reply_template'],
    mutationFn: ({ id, body }: { id: string; body: Parameters<typeof updateReplyTemplate>[1] }) =>
      updateReplyTemplate(id, body),
    onSuccess: () => qc.invalidateQueries({ queryKey: templatesKeys.all })
  });

export const deleteReplyTemplateMutation = (qc: QueryClient) =>
  mutationOptions({
    mutationKey: [...templatesKeys.all, 'delete_reply_template'],
    mutationFn: ({ id }: { id: string }) => deleteReplyTemplate(id),
    onSuccess: () => qc.invalidateQueries({ queryKey: templatesKeys.all })
  });

export const bulkReplyTemplatesMutation = (qc: QueryClient) =>
  mutationOptions({
    mutationKey: [...templatesKeys.all, 'bulk_reply_templates'],
    mutationFn: ({ body }: { body: Parameters<typeof bulkReplyTemplates>[0] }) =>
      bulkReplyTemplates(body),
    onSuccess: () => qc.invalidateQueries({ queryKey: templatesKeys.all })
  });

export const reorderReplyTemplatesMutation = (qc: QueryClient) =>
  mutationOptions({
    mutationKey: [...templatesKeys.all, 'reorder_reply_templates'],
    mutationFn: ({ body }: { body: Parameters<typeof reorderReplyTemplates>[0] }) =>
      reorderReplyTemplates(body),
    onSuccess: () => qc.invalidateQueries({ queryKey: templatesKeys.all })
  });

export const renderReplyTemplateMutation = (qc: QueryClient) =>
  mutationOptions({
    mutationKey: [...templatesKeys.all, 'render_reply_template'],
    mutationFn: ({ body }: { body: Parameters<typeof renderReplyTemplate>[0] }) =>
      renderReplyTemplate(body),
    onSuccess: () => qc.invalidateQueries({ queryKey: templatesKeys.all })
  });

export const createTemplateGroupMutation = (qc: QueryClient) =>
  mutationOptions({
    mutationKey: [...templatesKeys.all, 'create_template_group'],
    mutationFn: ({ body }: { body: Parameters<typeof createTemplateGroup>[0] }) =>
      createTemplateGroup(body),
    onSuccess: () => qc.invalidateQueries({ queryKey: templatesKeys.all })
  });

export const updateTemplateGroupMutation = (qc: QueryClient) =>
  mutationOptions({
    mutationKey: [...templatesKeys.all, 'update_template_group'],
    mutationFn: ({ id, body }: { id: string; body: Parameters<typeof updateTemplateGroup>[1] }) =>
      updateTemplateGroup(id, body),
    onSuccess: () => qc.invalidateQueries({ queryKey: templatesKeys.all })
  });

export const deleteTemplateGroupMutation = (qc: QueryClient) =>
  mutationOptions({
    mutationKey: [...templatesKeys.all, 'delete_template_group'],
    mutationFn: ({ id }: { id: string }) => deleteTemplateGroup(id),
    onSuccess: () => qc.invalidateQueries({ queryKey: templatesKeys.all })
  });

export const reorderTemplateGroupsMutation = (qc: QueryClient) =>
  mutationOptions({
    mutationKey: [...templatesKeys.all, 'reorder_template_groups'],
    mutationFn: ({ body }: { body: Parameters<typeof reorderTemplateGroups>[0] }) =>
      reorderTemplateGroups(body),
    onSuccess: () => qc.invalidateQueries({ queryKey: templatesKeys.all })
  });
