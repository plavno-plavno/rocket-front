import type { Schema } from '@lp/contracts';
import { useTranslations } from 'next-intl';
import { Icons } from '@/components/icons';
import { Badge } from '@/components/ui/badge';
import { cn } from '@/lib/utils';

type SyncStatus = Schema<'SyncStatus'>;

export const SYNC_STATUS_META: Record<
  SyncStatus,
  { icon: keyof typeof Icons; className: string; dot: string }
> = {
  synced: {
    icon: 'circleCheck',
    className: 'text-status-synced bg-status-synced-bg border-transparent',
    dot: 'bg-status-synced'
  },
  sent: {
    icon: 'send',
    className: 'text-status-sent bg-status-sent-bg border-transparent',
    dot: 'bg-status-sent'
  },
  action_required: {
    icon: 'warning',
    className: 'text-status-action bg-status-action-bg border-transparent',
    dot: 'bg-status-action'
  },
  error: {
    icon: 'xCircle',
    className: 'text-status-error bg-status-error-bg border-transparent',
    dot: 'bg-status-error'
  },
  not_connected: {
    icon: 'circle',
    className: 'text-status-neutral bg-status-neutral-bg border-transparent',
    dot: 'bg-status-neutral/40'
  },
  unsupported: {
    icon: 'circleDashed',
    className: 'text-status-neutral bg-status-neutral-bg border-transparent',
    dot: 'bg-status-neutral/40'
  }
};

/** Status chip: icon + text, never colour alone (SDD-01 §3.1). */
export function SyncStatusBadge({
  status,
  className,
  compact = false
}: {
  status: SyncStatus;
  className?: string;
  compact?: boolean;
}) {
  const t = useTranslations('status');
  const meta = SYNC_STATUS_META[status];
  const Icon = Icons[meta.icon];
  return (
    <Badge
      variant='outline'
      className={cn(
        'gap-1 font-medium',
        meta.className,
        compact && 'px-1.5 py-0 text-[11px]',
        className
      )}
    >
      <Icon className='size-3.5' />
      {t(status)}
    </Badge>
  );
}

/** Small dot for dense stacks; always carries the status text in `title`. */
export function SyncStatusDot({ status, className }: { status: SyncStatus; className?: string }) {
  const t = useTranslations('status');
  return (
    <span
      role='img'
      aria-label={t(status)}
      title={t(status)}
      className={cn('inline-block size-2 rounded-full', SYNC_STATUS_META[status].dot, className)}
    />
  );
}
