'use client';

import { useTranslations } from 'next-intl';

import * as React from 'react';
import { Icons } from '@/components/icons';
import { Button } from '@/components/ui/button';
import { useInfobar, type InfobarContent } from '@/components/ui/infobar';
import { cn } from '@/lib/utils';

interface InfoButtonProps extends Omit<React.ComponentProps<typeof Button>, 'content'> {
  content: InfobarContent;
  variant?: 'default' | 'ghost' | 'outline' | 'secondary' | 'destructive' | 'link';
  size?: 'default' | 'sm' | 'lg' | 'icon';
}

export function InfoButton({
  content,
  className,
  variant = 'ghost',
  size = 'icon',
  ...props
}: InfoButtonProps) {
  const t = useTranslations('ui');
  const { setContent, setOpen, open, openMobile, isMobile } = useInfobar();
  const visible = isMobile ? openMobile : open;

  // Set content on mount so the infobar has it ready, but don't force it open
  const contentRef = React.useRef(content);
  contentRef.current = content;

  React.useEffect(() => {
    setContent(contentRef.current);
  }, []); // eslint-disable-line react-hooks/exhaustive-deps

  // Same button opens and closes the panel (it used to only open it).
  const handleClick: React.ComponentProps<typeof Button>['onClick'] = (e) => {
    if (!visible) setContent(content);
    setOpen(!visible);
    props.onClick?.(e);
  };

  return (
    <Button
      variant={variant}
      size={size}
      className={cn('shrink-0', className)}
      onClick={handleClick}
      aria-label={visible ? t('hideInfo') : t('showInfo')}
      aria-expanded={visible}
      {...props}
    >
      <Icons.info className='h-4 w-4' />
    </Button>
  );
}
