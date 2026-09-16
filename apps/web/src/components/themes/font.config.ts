import { Inter, JetBrains_Mono } from 'next/font/google';

import { cn } from '@/lib/utils';

// Cyrillic subset is mandatory (SDD-01 §3.1); Geist (starter) has no Cyrillic glyphs.
const fontSans = Inter({
  subsets: ['latin', 'cyrillic'],
  variable: '--font-inter'
});

const fontMono = JetBrains_Mono({
  subsets: ['latin', 'cyrillic'],
  variable: '--font-jetbrains-mono'
});

export const fontVariables = cn(fontSans.variable, fontMono.variable);
