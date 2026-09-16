import type { ReactNode } from 'react';
import PageContainer from '@/components/layout/page-container';
import { cn } from '@/lib/utils';

export interface WizardStep {
  id: string;
  title: string;
  description?: string;
}

export interface WizardPageProps {
  title: string;
  description?: string;
  steps: WizardStep[];
  /** Index of the current step. */
  current: number;
  /** Current step content. */
  children: ReactNode;
  /** Back / Next / Finish buttons. */
  footer?: ReactNode;
  access?: boolean;
}

/** Wizard template (SDD-01T §3.6): stepper, step content, navigation footer (import, onboarding, campaigns). */
export function WizardPage({
  title,
  description,
  steps,
  current,
  children,
  footer,
  access = true
}: WizardPageProps) {
  return (
    <PageContainer pageTitle={title} pageDescription={description} access={access}>
      <div className='flex flex-1 flex-col gap-6' data-template='wizard'>
        <ol className='flex flex-wrap gap-2' aria-label={title}>
          {steps.map((step, i) => (
            <li
              key={step.id}
              aria-current={i === current ? 'step' : undefined}
              className={cn(
                'flex items-center gap-2 rounded-md border px-3 py-1.5 text-sm',
                i === current && 'border-primary bg-primary/5 font-medium',
                i < current && 'text-muted-foreground'
              )}
            >
              <span
                className={cn(
                  'flex size-5 items-center justify-center rounded-full border text-xs',
                  i < current && 'bg-primary text-primary-foreground border-primary',
                  i === current && 'border-primary'
                )}
              >
                {i + 1}
              </span>
              {step.title}
            </li>
          ))}
        </ol>
        <div className='flex flex-1 flex-col gap-4'>{children}</div>
        {footer && (
          <div className='flex items-center justify-end gap-2 border-t pt-4'>{footer}</div>
        )}
      </div>
    </PageContainer>
  );
}
