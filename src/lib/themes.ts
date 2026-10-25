import { AvatarShape, ButtonShape, ButtonStyle, FontToken, LayoutWidth, ThemeId, ThemePreset } from '../types/linkora';

export const BUILT_IN_THEMES: ThemePreset[] = [
  {
    id: 'minimal-white',
    name: 'Minimal White',
    description: 'Crisp studio white canvas with high-contrast slate typography.',
    tier: 'free',
    isDark: false,
    bgColor: '#FFFFFF',
    bgGradient: '',
    textColor: '#0F172A',
    mutedTextColor: '#475569',
    buttonColor: '#0F172A',
    buttonTextColor: '#FFFFFF',
    defaultShape: 'rounded',
    defaultStyle: 'solid',
    previewAccent: '#4F46E5',
  },
  {
    id: 'dark-pro',
    name: 'Dark Pro',
    description: 'Deep obsidian surface engineered for developers and technical founders.',
    tier: 'free',
    isDark: true,
    bgColor: '#09090B',
    bgGradient: '',
    textColor: '#FAFAFA',
    mutedTextColor: '#A1A1AA',
    buttonColor: '#27272A',
    buttonTextColor: '#FAFAFA',
    defaultShape: 'rounded',
    defaultStyle: 'solid',
    previewAccent: '#6366F1',
  },
  {
    id: 'gradient-dream',
    name: 'Gradient Dream',
    description: 'Soft dusk indigo-to-violet gradient paired with clean light cards.',
    tier: 'free',
    isDark: false,
    bgColor: '#EEF2FF',
    bgGradient: 'linear-gradient(145deg, #EEF2FF 0%, #E0E7FF 50%, #F3E8FF 100%)',
    textColor: '#1E1B4B',
    mutedTextColor: '#4338CA',
    buttonColor: '#4338CA',
    buttonTextColor: '#FFFFFF',
    defaultShape: 'pill',
    defaultStyle: 'shadow',
    previewAccent: '#4338CA',
  },
  {
    id: 'business-pro',
    name: 'Business Professional',
    description: 'Structured executive slate palette suited for consultants and agencies.',
    tier: 'free',
    isDark: false,
    bgColor: '#F8FAFC',
    bgGradient: '',
    textColor: '#0F172A',
    mutedTextColor: '#475569',
    buttonColor: '#1E3A8A',
    buttonTextColor: '#FFFFFF',
    defaultShape: 'sharp',
    defaultStyle: 'solid',
    previewAccent: '#1E3A8A',
  },
  {
    id: 'nature-green',
    name: 'Nature Green',
    description: 'Warm botanical alabaster and deep forest tones for lifestyle brands.',
    tier: 'free',
    isDark: false,
    bgColor: '#F4F7F4',
    bgGradient: '',
    textColor: '#14532D',
    mutedTextColor: '#3F6212',
    buttonColor: '#166534',
    buttonTextColor: '#FFFFFF',
    defaultShape: 'pill',
    defaultStyle: 'solid',
    previewAccent: '#166534',
  },
  {
    id: 'editorial-ivory',
    name: 'Editorial Ivory',
    description: 'Warm architectural limestone paper paired with espresso ink accents.',
    tier: 'free',
    isDark: false,
    bgColor: '#FAF8F5',
    bgGradient: '',
    textColor: '#1C1917',
    mutedTextColor: '#57534E',
    buttonColor: '#292524',
    buttonTextColor: '#FAF8F5',
    defaultShape: 'sharp',
    defaultStyle: 'outline',
    previewAccent: '#78716C',
  },
  {
    id: 'ocean-breeze',
    name: 'Ocean Breeze',
    description: 'Refreshing coastal mist backdrop with deep marine blue link actions.',
    tier: 'free',
    isDark: false,
    bgColor: '#F0F9FF',
    bgGradient: 'linear-gradient(155deg, #F0F9FF 0%, #E0F2FE 60%, #ECFEFF 100%)',
    textColor: '#0C4A6E',
    mutedTextColor: '#0369A1',
    buttonColor: '#0284C7',
    buttonTextColor: '#FFFFFF',
    defaultShape: 'rounded',
    defaultStyle: 'soft',
    previewAccent: '#0284C7',
  },
  {
    id: 'nordic-frost',
    name: 'Nordic Frost',
    description: 'Clean Scandinavian cool daylight canvas with crisp slate-cobalt buttons.',
    tier: 'free',
    isDark: false,
    bgColor: '#F8FAFC',
    bgGradient: 'linear-gradient(160deg, #FFFFFF 0%, #F1F5F9 65%, #E2E8F0 100%)',
    textColor: '#0F172A',
    mutedTextColor: '#475569',
    buttonColor: '#334155',
    buttonTextColor: '#FFFFFF',
    defaultShape: 'rounded',
    defaultStyle: 'solid',
    previewAccent: '#334155',
  },
  {
    id: 'carbon-slate',
    name: 'Carbon Slate',
    description: 'Balanced dark architectural slate engineered for effortless night reading.',
    tier: 'free',
    isDark: true,
    bgColor: '#0F172A',
    bgGradient: 'linear-gradient(160deg, #0F172A 0%, #1E293B 100%)',
    textColor: '#F8FAFC',
    mutedTextColor: '#94A3B8',
    buttonColor: '#38BDF8',
    buttonTextColor: '#0F172A',
    defaultShape: 'rounded',
    defaultStyle: 'solid',
    previewAccent: '#38BDF8',
  },
  {
    id: 'creator-neon',
    name: 'Creator Neon',
    description: 'Midnight carbon backdrop with vivid electric violet link highlights.',
    tier: 'premium',
    isDark: true,
    bgColor: '#0B0F19',
    bgGradient: 'linear-gradient(160deg, #0B0F19 0%, #17122B 60%, #0F172A 100%)',
    textColor: '#F8FAFC',
    mutedTextColor: '#94A3B8',
    buttonColor: '#7C3AED',
    buttonTextColor: '#FFFFFF',
    defaultShape: 'rounded',
    defaultStyle: 'shadow',
    previewAccent: '#7C3AED',
  },
  {
    id: 'pink-aesthetic',
    name: 'Pink Aesthetic',
    description: 'Editorial blush silk background with deep rosewood typography.',
    tier: 'premium',
    isDark: false,
    bgColor: '#FFF5F7',
    bgGradient: 'linear-gradient(150deg, #FFF5F7 0%, #FCE7F3 100%)',
    textColor: '#881337',
    mutedTextColor: '#9F1239',
    buttonColor: '#BE185D',
    buttonTextColor: '#FFFFFF',
    defaultShape: 'pill',
    defaultStyle: 'soft',
    previewAccent: '#BE185D',
  },
  {
    id: 'glassmorphism',
    name: 'Glassmorphism',
    description: 'Rich indigo night sky with frosted translucent glass link surfaces.',
    tier: 'premium',
    isDark: true,
    bgColor: '#1E1B4B',
    bgGradient: 'linear-gradient(135deg, #1E1B4B 0%, #312E81 50%, #0F172A 100%)',
    textColor: '#FFFFFF',
    mutedTextColor: '#C7D2FE',
    buttonColor: '#FFFFFF',
    buttonTextColor: '#FFFFFF',
    defaultShape: 'rounded',
    defaultStyle: 'glass',
    previewAccent: '#818CF8',
  },
  {
    id: 'midnight-gold',
    name: 'Midnight Gold',
    description: 'Bespoke charcoal noir canvas accented with warm champagne gold.',
    tier: 'premium',
    isDark: true,
    bgColor: '#0C0A09',
    bgGradient: 'linear-gradient(155deg, #0C0A09 0%, #1C1917 55%, #0F172A 100%)',
    textColor: '#FAFAF9',
    mutedTextColor: '#D6D3D1',
    buttonColor: '#D97706',
    buttonTextColor: '#FFFFFF',
    defaultShape: 'rounded',
    defaultStyle: 'shadow',
    previewAccent: '#D97706',
  },
  {
    id: 'sunset-studio',
    name: 'Sunset Studio',
    description: 'Golden-hour apricot silk gradient crafted for visual creators and shops.',
    tier: 'premium',
    isDark: false,
    bgColor: '#FFF7ED',
    bgGradient: 'linear-gradient(145deg, #FFF7ED 0%, #FFEDD5 50%, #FFE4E6 100%)',
    textColor: '#431407',
    mutedTextColor: '#9A3412',
    buttonColor: '#C2410C',
    buttonTextColor: '#FFFFFF',
    defaultShape: 'pill',
    defaultStyle: 'shadow',
    previewAccent: '#EA580C',
  },
  {
    id: 'emerald-luxe',
    name: 'Emerald Luxe',
    description: 'Deep botanical dark emerald velvet paired with warm alabaster links.',
    tier: 'premium',
    isDark: true,
    bgColor: '#052E16',
    bgGradient: 'linear-gradient(155deg, #022C22 0%, #064E3B 55%, #0F172A 100%)',
    textColor: '#ECFDF5',
    mutedTextColor: '#A7F3D0',
    buttonColor: '#10B981',
    buttonTextColor: '#022C22',
    defaultShape: 'pill',
    defaultStyle: 'shadow',
    previewAccent: '#10B981',
  },
  {
    id: 'cyber-aurora',
    name: 'Cyber Aurora',
    description: 'Atmospheric twilight slate with cool northern-light teal highlights.',
    tier: 'premium',
    isDark: true,
    bgColor: '#090D16',
    bgGradient: 'linear-gradient(145deg, #090D16 0%, #0F172A 50%, #134E4A 100%)',
    textColor: '#F1F5F9',
    mutedTextColor: '#94A3B8',
    buttonColor: '#14B8A6',
    buttonTextColor: '#042F2E',
    defaultShape: 'rounded',
    defaultStyle: 'glass',
    previewAccent: '#14B8A6',
  },
];

export const SAFE_GRADIENT_PRESETS: { id: string; label: string; value: string }[] = [
  { id: 'none', label: 'Solid Color Only', value: '' },
  {
    id: 'indigo-mist',
    label: 'Indigo Mist',
    value: 'linear-gradient(145deg, #EEF2FF 0%, #E0E7FF 50%, #F3E8FF 100%)',
  },
  {
    id: 'obsidian-night',
    label: 'Obsidian Night',
    value: 'linear-gradient(160deg, #09090B 0%, #18181B 50%, #0F172A 100%)',
  },
  {
    id: 'midnight-violet',
    label: 'Midnight Violet',
    value: 'linear-gradient(135deg, #1E1B4B 0%, #312E81 50%, #0F172A 100%)',
  },
  {
    id: 'sage-morning',
    label: 'Sage Morning',
    value: 'linear-gradient(150deg, #F4F7F4 0%, #DCFCE7 100%)',
  },
  {
    id: 'warm-sand',
    label: 'Warm Sand',
    value: 'linear-gradient(150deg, #FAF8F5 0%, #F3ECE1 100%)',
  },
  {
    id: 'ocean-glass',
    label: 'Ocean Mist',
    value: 'linear-gradient(155deg, #F0F9FF 0%, #E0F2FE 60%, #ECFEFF 100%)',
  },
  {
    id: 'champagne-noir',
    label: 'Champagne Noir',
    value: 'linear-gradient(155deg, #0C0A09 0%, #1C1917 55%, #0F172A 100%)',
  },
  {
    id: 'emerald-velvet',
    label: 'Emerald Velvet',
    value: 'linear-gradient(155deg, #022C22 0%, #064E3B 55%, #0F172A 100%)',
  },
  {
    id: 'nordic-daylight',
    label: 'Nordic Daylight',
    value: 'linear-gradient(160deg, #FFFFFF 0%, #F1F5F9 65%, #E2E8F0 100%)',
  },
];

export const SAFE_FONTS: { id: FontToken; label: string; className: string }[] = [
  { id: 'jakarta', label: 'Plus Jakarta Sans', className: 'font-sans' },
  { id: 'modern', label: 'Clean Geometric', className: 'font-sans tracking-tight' },
  { id: 'editorial', label: 'Refined Editorial', className: 'font-serif tracking-normal' },
  { id: 'serif', label: 'Classic Serif', className: 'font-serif' },
  { id: 'mono', label: 'JetBrains Mono', className: 'font-mono text-sm' },
];

export const BUTTON_SHAPE_CLASSES: Record<ButtonShape, string> = {
  sharp: 'rounded-none',
  rounded: 'rounded-xl',
  pill: 'rounded-full',
};

export const AVATAR_SHAPE_CLASSES: Record<AvatarShape, string> = {
  circle: 'rounded-full',
  rounded: 'rounded-2xl',
  square: 'rounded-none',
};

export const LAYOUT_WIDTH_CLASSES: Record<LayoutWidth, string> = {
  compact: 'max-w-md',
  standard: 'max-w-lg',
  wide: 'max-w-xl',
};

export function getThemeById(themeId: ThemeId): ThemePreset {
  return BUILT_IN_THEMES.find((t) => t.id === themeId) || BUILT_IN_THEMES[0];
}

export function getFontClass(font: FontToken): string {
  return SAFE_FONTS.find((f) => f.id === font)?.className || 'font-sans';
}

export function computeContrastTextColor(hexColor: string): string {
  const clean = hexColor.replace('#', '').trim();
  if (clean.length !== 6) return '#FFFFFF';
  const r = parseInt(clean.slice(0, 2), 16);
  const g = parseInt(clean.slice(2, 4), 16);
  const b = parseInt(clean.slice(4, 6), 16);
  if (Number.isNaN(r) || Number.isNaN(g) || Number.isNaN(b)) return '#FFFFFF';
  const yiq = (r * 299 + g * 587 + b * 114) / 1000;
  return yiq >= 155 ? '#0F172A' : '#FFFFFF';
}

export function getButtonVisualClasses(style: ButtonStyle): string {
  switch (style) {
    case 'outline':
      return 'border-2 bg-transparent hover:opacity-90';
    case 'soft':
      return 'border border-black/10 shadow-xs hover:opacity-95';
    case 'shadow':
      return 'shadow-md hover:-translate-y-0.5 hover:shadow-lg';
    case 'glass':
      return 'backdrop-blur-md bg-white/15 border border-white/25 hover:bg-white/25';
    case 'solid':
    default:
      return 'border border-transparent hover:opacity-92';
  }
}
