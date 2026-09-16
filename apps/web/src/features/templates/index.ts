/** Public API of the templates feature (SDD-01T §3.5). */
export { TemplatePicker } from './components/template-picker';
export type {
  TemplatePickerProps,
  TemplatePickerReviewContext
} from './components/template-picker';
export {
  replyTemplatesQueryOptions,
  templateGroupsQueryOptions,
  templatesKeys
} from './api/queries';
export type { ReplyTemplate, TemplateGroup } from './api/types';
