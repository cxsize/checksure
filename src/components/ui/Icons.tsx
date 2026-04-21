interface IconProps {
  size?: number;
  c?: string;
  sw?: number;
  dir?: 'right' | 'left' | 'up' | 'down';
}

export const Icons = {
  Clock: ({ size = 24, c = 'currentColor', sw = 2 }: IconProps) => (
    <svg width={size} height={size} viewBox="0 0 24 24" fill="none" stroke={c} strokeWidth={sw} strokeLinecap="round" strokeLinejoin="round">
      <circle cx="12" cy="12" r="9" />
      <path d="M12 7v5l3 2" />
    </svg>
  ),
  Pin: ({ size = 24, c = 'currentColor', sw = 2 }: IconProps) => (
    <svg width={size} height={size} viewBox="0 0 24 24" fill="none" stroke={c} strokeWidth={sw} strokeLinecap="round" strokeLinejoin="round">
      <path d="M12 22s-7-7.5-7-13a7 7 0 0114 0c0 5.5-7 13-7 13z" />
      <circle cx="12" cy="9" r="2.5" />
    </svg>
  ),
  Home: ({ size = 24, c = 'currentColor', sw = 2 }: IconProps) => (
    <svg width={size} height={size} viewBox="0 0 24 24" fill="none" stroke={c} strokeWidth={sw} strokeLinecap="round" strokeLinejoin="round">
      <path d="M3 11l9-7 9 7v9a2 2 0 01-2 2h-4v-6h-6v6H5a2 2 0 01-2-2z" />
    </svg>
  ),
  Calendar: ({ size = 24, c = 'currentColor', sw = 2 }: IconProps) => (
    <svg width={size} height={size} viewBox="0 0 24 24" fill="none" stroke={c} strokeWidth={sw} strokeLinecap="round" strokeLinejoin="round">
      <rect x="3" y="5" width="18" height="16" rx="2" />
      <path d="M3 10h18M8 3v4M16 3v4" />
    </svg>
  ),
  Person: ({ size = 24, c = 'currentColor', sw = 2 }: IconProps) => (
    <svg width={size} height={size} viewBox="0 0 24 24" fill="none" stroke={c} strokeWidth={sw} strokeLinecap="round" strokeLinejoin="round">
      <circle cx="12" cy="8" r="4" />
      <path d="M4 21c0-4.4 3.6-8 8-8s8 3.6 8 8" />
    </svg>
  ),
  Leave: ({ size = 24, c = 'currentColor', sw = 2 }: IconProps) => (
    <svg width={size} height={size} viewBox="0 0 24 24" fill="none" stroke={c} strokeWidth={sw} strokeLinecap="round" strokeLinejoin="round">
      <path d="M5 21V7a2 2 0 012-2h10a2 2 0 012 2v14" />
      <path d="M9 9h6M9 13h6M9 17h4" />
    </svg>
  ),
  Check: ({ size = 24, c = 'currentColor', sw = 2.5 }: IconProps) => (
    <svg width={size} height={size} viewBox="0 0 24 24" fill="none" stroke={c} strokeWidth={sw} strokeLinecap="round" strokeLinejoin="round">
      <path d="M4 12l5 5L20 6" />
    </svg>
  ),
  Chevron: ({ size = 24, c = 'currentColor', sw = 2, dir = 'right' }: IconProps) => {
    const paths = { right: 'M9 6l6 6-6 6', left: 'M15 6l-6 6 6 6', down: 'M6 9l6 6 6-6', up: 'M6 15l6-6 6 6' };
    return (
      <svg width={size} height={size} viewBox="0 0 24 24" fill="none" stroke={c} strokeWidth={sw} strokeLinecap="round" strokeLinejoin="round">
        <path d={paths[dir!]} />
      </svg>
    );
  },
  Bell: ({ size = 24, c = 'currentColor', sw = 2 }: IconProps) => (
    <svg width={size} height={size} viewBox="0 0 24 24" fill="none" stroke={c} strokeWidth={sw} strokeLinecap="round" strokeLinejoin="round">
      <path d="M18 16V11a6 6 0 10-12 0v5l-2 3h16l-2-3z" />
      <path d="M10 21a2 2 0 004 0" />
    </svg>
  ),
  Coffee: ({ size = 24, c = 'currentColor', sw = 2 }: IconProps) => (
    <svg width={size} height={size} viewBox="0 0 24 24" fill="none" stroke={c} strokeWidth={sw} strokeLinecap="round" strokeLinejoin="round">
      <path d="M4 8h13v6a5 5 0 01-5 5H9a5 5 0 01-5-5V8z" />
      <path d="M17 10h2a2 2 0 010 4h-2" />
      <path d="M7 2v3M11 2v3" />
    </svg>
  ),
  Wallet: ({ size = 24, c = 'currentColor', sw = 2 }: IconProps) => (
    <svg width={size} height={size} viewBox="0 0 24 24" fill="none" stroke={c} strokeWidth={sw} strokeLinecap="round" strokeLinejoin="round">
      <rect x="3" y="6" width="18" height="14" rx="2" />
      <path d="M3 10h18M16 15h2" />
    </svg>
  ),
  Globe: ({ size = 24, c = 'currentColor', sw = 2 }: IconProps) => (
    <svg width={size} height={size} viewBox="0 0 24 24" fill="none" stroke={c} strokeWidth={sw} strokeLinecap="round" strokeLinejoin="round">
      <circle cx="12" cy="12" r="9" />
      <path d="M3 12h18M12 3a14 14 0 010 18M12 3a14 14 0 000 18" />
    </svg>
  ),
  Arrow: ({ size = 24, c = 'currentColor', sw = 2, dir = 'right' }: IconProps) => {
    const paths = { right: 'M5 12h14M13 6l6 6-6 6', left: 'M19 12H5M11 6l-6 6 6 6' };
    return (
      <svg width={size} height={size} viewBox="0 0 24 24" fill="none" stroke={c} strokeWidth={sw} strokeLinecap="round" strokeLinejoin="round">
        <path d={paths[dir as 'right' | 'left']} />
      </svg>
    );
  },
  X: ({ size = 24, c = 'currentColor', sw = 2 }: IconProps) => (
    <svg width={size} height={size} viewBox="0 0 24 24" fill="none" stroke={c} strokeWidth={sw} strokeLinecap="round" strokeLinejoin="round">
      <path d="M6 6l12 12M18 6L6 18" />
    </svg>
  ),
  Play: ({ size = 24, c = 'currentColor' }: IconProps) => (
    <svg width={size} height={size} viewBox="0 0 24 24" fill={c}><path d="M7 5v14l11-7z" /></svg>
  ),
  Pause: ({ size = 24, c = 'currentColor' }: IconProps) => (
    <svg width={size} height={size} viewBox="0 0 24 24" fill={c}><rect x="6" y="5" width="4" height="14" rx="1" /><rect x="14" y="5" width="4" height="14" rx="1" /></svg>
  ),
  Refresh: ({ size = 24, c = 'currentColor', sw = 2 }: IconProps) => (
    <svg width={size} height={size} viewBox="0 0 24 24" fill="none" stroke={c} strokeWidth={sw} strokeLinecap="round" strokeLinejoin="round">
      <path d="M3 12a9 9 0 0115-6.7L21 8M21 3v5h-5M21 12a9 9 0 01-15 6.7L3 16M3 21v-5h5" />
    </svg>
  ),
  Line: ({ size = 22, c = '#fff' }: IconProps) => (
    <svg width={size} height={size} viewBox="0 0 24 24" fill={c}>
      <path d="M12 3C6.5 3 2 6.6 2 11c0 2.6 1.6 4.9 4.1 6.4-.2.7-.9 2.6-1 3 0 .2.1.4.3.3.2 0 2.5-1.6 3.5-2.3.9.2 2 .4 3.1.4 5.5 0 10-3.6 10-8S17.5 3 12 3z" />
    </svg>
  ),
};
