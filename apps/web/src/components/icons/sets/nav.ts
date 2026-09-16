import {
  IconChartBar,
  IconChartDots,
  IconClipboardText,
  IconCopy,
  IconLayoutGrid,
  IconMessageQuestion,
  IconPlugConnected,
  IconRobot,
  IconSpeakerphone,
  IconStar,
  IconTag,
  IconTrendingUp
} from '@tabler/icons-react';

/** Navigation icons referenced by `feature.ts` files (owner: UI-0). */
export const icons = {
  reviews: IconStar,
  question: IconMessageQuestion,
  template: IconClipboardText,
  tag: IconTag,
  autoReply: IconRobot,
  megaphone: IconSpeakerphone,
  analytics: IconChartBar,
  presence: IconChartDots,
  rank: IconTrendingUp,
  duplicates: IconCopy,
  widget: IconLayoutGrid,
  integrations: IconPlugConnected
} as const;
