import { AvatarShape, ButtonShape, ButtonStyle, FontToken, LayoutWidth, ThemeId, ThemePreset } from '../types/linkora';

export const BUILT_IN_THEMES: ThemePreset[] = [
  {
    id: 'minimal-white',
    name: 'Minimal White',
    description: 'Crisp studio white canvas with high-contrast slate typography.',
    tier: 'free',
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
    id: 'creator-neon',
    name: 'Creator Neon',
    description: 'Midnight carbon backdrop with vivid electric violet link highlights.',
    tier: 'premium',
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
