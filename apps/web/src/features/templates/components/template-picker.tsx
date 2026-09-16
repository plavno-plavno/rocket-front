'use client';

import { useQuery } from '@tanstack/react-query';
import { useTranslations } from 'next-intl';
import { useState } from 'react';
import { Icons } from '@/components/icons';
import { renderTemplate } from '@/components/lp';
import { Button } from '@/components/ui/button';
import {
  Command,
  CommandEmpty,
  CommandGroup,
  CommandInput,
  CommandItem,
  CommandList
} from '@/components/ui/command';
import { Popover, PopoverContent, PopoverTrigger } from '@/components/ui/popover';
import { replyTemplatesQueryOptions, templateGroupsQueryOptions } from '../api/queries';
import type { ReplyTemplate } from '../api/types';

export type TemplatePickerReviewContext = Partial<
  Record<
    | 'author_name'
    | 'location_name'
    | 'location_address'
    | 'brand_name'
    | 'rating'
    | 'manager_name'
    | 'platform_name',
    string
  >
>;

export interface TemplatePickerProps {
  /** Receives the rendered text (variables substituted with `reviewContext`) and the template. */
  onInsert: (text: string, template: ReplyTemplate) => void;
  reviewContext?: TemplatePickerReviewContext;
  disabled?: boolean;
  trigger?: React.ReactNode;
}

/** Public stub (SDD-01T §3.5): command list of templates grouped by TemplateGroup; inserts rendered text. */
export function TemplatePicker({
  onInsert,
  reviewContext,
  disabled,
  trigger
}: TemplatePickerProps) {
  const t = useTranslations('templates.picker');
  const [open, setOpen] = useState(false);
  const { data: templates } = useQuery({
    ...replyTemplatesQueryOptions({ page: 1, page_size: 200 }),
    enabled: open
  });
  const { data: groups } = useQuery({ ...templateGroupsQueryOptions(), enabled: open });
  const byGroup = new Map<string | null, ReplyTemplate[]>();
  for (const tpl of templates?.items ?? [])
    byGroup.set(tpl.group_id ?? null, [...(byGroup.get(tpl.group_id ?? null) ?? []), tpl]);
  const groupName = (id: string | null) =>
    id ? (groups?.items.find((g) => g.id === id)?.name ?? id) : t('ungrouped');

  return (
    <Popover open={open} onOpenChange={setOpen}>
      <PopoverTrigger
        render={trigger ? <span /> : <Button variant='outline' size='sm' disabled={disabled} />}
      >
        {trigger ?? (
          <>
            <Icons.template className='size-4' /> {t('button')}
          </>
        )}
      </PopoverTrigger>
      <PopoverContent className='w-96 p-0' align='start'>
        <Command>
          <CommandInput placeholder={t('search')} />
          <CommandList className='max-h-80'>
            <CommandEmpty>{t('empty')}</CommandEmpty>
            {[...byGroup.entries()].map(([gid, items]) => (
              <CommandGroup key={gid ?? 'none'} heading={groupName(gid)}>
                {items.map((tpl) => (
                  <CommandItem
                    key={tpl.id}
                    value={`${tpl.name} ${tpl.body}`}
                    onSelect={() => {
                      onInsert(renderTemplate(tpl.body, reviewContext ?? {}), tpl);
                      setOpen(false);
                    }}
                    className='flex-col items-start gap-0.5'
                  >
                    <span className='font-medium'>{tpl.name}</span>
                    <span className='text-muted-foreground line-clamp-2 text-xs'>{tpl.body}</span>
                  </CommandItem>
                ))}
              </CommandGroup>
            ))}
          </CommandList>
        </Command>
      </PopoverContent>
    </Popover>
  );
}
