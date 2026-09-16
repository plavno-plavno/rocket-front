import type { SVGProps } from 'react';

type Props = SVGProps<SVGSVGElement> & { size?: number | string };

function Mark({ letter, color, size = 24, ...props }: Props & { letter: string; color: string }) {
  return (
    <svg viewBox='0 0 24 24' width={size} height={size} role='img' aria-hidden='true' {...props}>
      <circle cx='12' cy='12' r='11' fill={color} />
      <text
        x='12'
        y='16.2'
        textAnchor='middle'
        fontSize='12'
        fontWeight='700'
        fontFamily='Inter, system-ui, sans-serif'
        fill='#fff'
      >
        {letter}
      </text>
    </svg>
  );
}

/** Neutral letter-marks for platforms (brand SVGs are registered by UI-DS per brandbook, SDD-01 §4.1). */
export const IconPlatformGoogle = (p: Props) => (
  <Mark letter='G' color='var(--platform-google, #4285f4)' {...p} />
);
export const IconPlatformYandex = (p: Props) => (
  <Mark letter='Я' color='var(--platform-yandex, #fc3f1d)' {...p} />
);
export const IconPlatform2gis = (p: Props) => (
  <Mark letter='2' color='var(--platform-2gis, #19aa1e)' {...p} />
);
export const IconPlatformVk = (p: Props) => <Mark letter='В' color='#0077ff' {...p} />;
export const IconPlatformGeneric = (p: Props) => (
  <Mark letter='•' color='var(--status-neutral, #888)' {...p} />
);
