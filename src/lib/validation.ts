import { LinkPlatform } from '../types/linkora';

// Synchronized verbatim with firebase-blueprint.json & firestore.rules
export const USERNAME_REGEX = /^[a-z0-9_-]{3,30}$/;
export const SAFE_ID_REGEX = /^[a-zA-Z0-9_-]{1,128}$/;
export const SAFE_URL_REGEX = /^(https?:\/\/|mailto:|tel:).+/i;
export const SAFE_HEX_COLOR_REGEX = /^#[0-9a-fA-F]{6}$/;
export const BASIC_EMAIL_REGEX = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;

export const RESERVED_USERNAMES = new Set([
  'admin',
  'dashboard',
  'login',
  'signup',
  'reset-password',
  'privacy',
  'terms',
  'contact',
  'about',
  'api',
  'settings',
  'pricing',
  'templates',
  'features',
  'support',
]);

export function sanitizePlainText(input: string, maxLength: number): string {
  // Strip control characters and angle brackets to ensure zero HTML/script injection
  return input
    .replace(/[\u0000-\u0008\u000B\u000C\u000E-\u001F<>]/g, '')
    .slice(0, maxLength);
}

export function normalizeUsername(input: string): string {
  return input
    .toLowerCase()
    .trim()
    .replace(/[^a-z0-9_-]/g, '')
    .slice(0, 30);
}

export function validateUsername(slug: string): { valid: boolean; error?: string } {
  const clean = slug.trim().toLowerCase();
  if (clean.length < 3) {
    return { valid: false, error: 'Username must be at least 3 characters long.' };
  }
  if (clean.length > 30) {
    return { valid: false, error: 'Username must be 30 characters or fewer.' };
  }
  if (RESERVED_USERNAMES.has(clean)) {
    return { valid: false, error: `"${clean}" is a reserved system route.` };
  }
  if (!USERNAME_REGEX.test(clean)) {
    return {
      valid: false,
      error: 'Use only lowercase letters, numbers, hyphens (-), or underscores (_).',
    };
  }
  return { valid: true };
}

export function validateBasicEmail(email: string): boolean {
  const clean = email.trim();
  return clean.length >= 3 && clean.length <= 254 && BASIC_EMAIL_REGEX.test(clean);
}

export function normalizeAndValidateUrl(
  rawInput: string,
  platform?: LinkPlatform
): { valid: boolean; url: string; error?: string } {
  const trimmed = rawInput.trim();
  if (!trimmed) {
    return { valid: false, url: '', error: 'Destination URL is required.' };
  }

  // Block dangerous schemes unconditionally
  const lower = trimmed.toLowerCase();
  if (
    lower.startsWith('javascript:') ||
    lower.startsWith('data:') ||
    lower.startsWith('vbscript:') ||
    lower.startsWith('file:')
  ) {
    return { valid: false, url: '', error: 'Unsupported or unsafe URL protocol.' };
  }

  let candidate = trimmed;

  if (platform === 'email' && !lower.startsWith('mailto:')) {
    if (trimmed.includes('@') && !trimmed.includes('://')) {
      candidate = `mailto:${trimmed}`;
    }
  } else if (platform === 'phone' && !lower.startsWith('tel:')) {
    const digits = trimmed.replace(/[^0-9+]/g, '');
    if (digits.length >= 6) {
      candidate = `tel:${digits}`;
    }
  } else if (platform === 'whatsapp' && !lower.startsWith('http')) {
    const digits = trimmed.replace(/[^0-9]/g, '');
    if (digits.length >= 7) {
      candidate = `https://wa.me/${digits}`;
    }
  } else if (
    !lower.startsWith('https://') &&
    !lower.startsWith('http://') &&
    !lower.startsWith('mailto:') &&
    !lower.startsWith('tel:')
  ) {
    candidate = `https://${trimmed}`;
  }

  if (candidate.length > 1000) {
    return { valid: false, url: '', error: 'URL must be under 1,000 characters.' };
  }

  if (!SAFE_URL_REGEX.test(candidate)) {
    return { valid: false, url: '', error: 'Enter a valid https://, mailto:, or tel: address.' };
  }

  if (candidate.startsWith('http://') || candidate.startsWith('https://')) {
    try {
      const parsed = new URL(candidate);
      if (!parsed.hostname || !parsed.hostname.includes('.')) {
        return { valid: false, url: '', error: 'Enter a complete domain (e.g., example.com).' };
      }
    } catch {
      return { valid: false, url: '', error: 'Invalid web URL format.' };
    }
  }

  return { valid: true, url: candidate };
}

export function buildWhatsAppLink(phone: string, prefilledMessage: string): string {
  const cleanPhone = phone.replace(/[^0-9]/g, '');
  if (!cleanPhone) return '';
  const cleanMessage = sanitizePlainText(prefilledMessage.trim(), 200);
  if (!cleanMessage) {
    return `https://wa.me/${cleanPhone}`;
  }
  return `https://wa.me/${cleanPhone}?text=${encodeURIComponent(cleanMessage)}`;
}

export function sanitizeHexColor(input: string): string {
  const trimmed = input.trim();
  if (!trimmed) return '';
  return SAFE_HEX_COLOR_REGEX.test(trimmed) ? trimmed.toUpperCase() : '';
}

export async function compressImageToDataUrl(
  file: File,
  maxDimension: number,
  maxBytes: number
): Promise<string> {
  if (!file.type.startsWith('image/')) {
    throw new Error('Please choose a valid image file (PNG, JPG, or WebP).');
  }
  if (file.size > 8 * 1024 * 1024) {
    throw new Error('Image file must be smaller than 8 MB.');
  }

  const dataUrl = await new Promise<string>((resolve, reject) => {
    const reader = new FileReader();
    reader.onload = () => resolve(String(reader.result));
    reader.onerror = () => reject(new Error('Failed to read image file.'));
    reader.readAsDataURL(file);
  });

  const img = await new Promise<HTMLImageElement>((resolve, reject) => {
    const element = new Image();
    element.onload = () => resolve(element);
    element.onerror = () => reject(new Error('Invalid image content.'));
    element.src = dataUrl;
  });

  const scale = Math.min(1, maxDimension / Math.max(img.width, img.height));
  const width = Math.max(1, Math.round(img.width * scale));
  const height = Math.max(1, Math.round(img.height * scale));

  const canvas = document.createElement('canvas');
  canvas.width = width;
  canvas.height = height;
  const ctx = canvas.getContext('2d');
  if (!ctx) {
    throw new Error('Image processing is unavailable in this browser.');
  }
  ctx.fillStyle = '#FFFFFF';
  ctx.fillRect(0, 0, width, height);
  ctx.drawImage(img, 0, 0, width, height);

  let quality = 0.82;
  let result = canvas.toDataURL('image/jpeg', quality);
  while (result.length > maxBytes && quality > 0.35) {
    quality -= 0.12;
    result = canvas.toDataURL('image/jpeg', quality);
  }

  if (result.length > maxBytes) {
    throw new Error('Image is too complex. Please try a smaller photo.');
  }

  return result;
}

export function generateSafeId(prefix = 'id'): string {
  const rand = Math.random().toString(36).slice(2, 10);
  return `${prefix}_${Date.now().toString(36)}_${rand}`;
}

function escapeVCardValue(val: string): string {
  return val
    .replace(/\\/g, '\\\\')
    .replace(/\n/g, '\\n')
    .replace(/;/g, '\\;')
    .replace(/,/g, '\\,')
    .trim();
}

export function generateVCardString(params: {
  displayName: string;
  headline?: string;
  email?: string;
  phone?: string;
  location?: string;
  bio?: string;
  url: string;
}): string {
  const lines = [
    'BEGIN:VCARD',
    'VERSION:3.0',
    `FN:${escapeVCardValue(params.displayName || 'Creator')}`,
    `N:${escapeVCardValue(params.displayName || 'Creator')};;;;`,
  ];

  if (params.headline?.trim()) {
    lines.push(`TITLE:${escapeVCardValue(params.headline)}`);
  }
  if (params.email?.trim()) {
    lines.push(`EMAIL;TYPE=INTERNET:${escapeVCardValue(params.email)}`);
  }
  if (params.phone?.trim()) {
    lines.push(`TEL;TYPE=CELL:${escapeVCardValue(params.phone)}`);
  }
  if (params.location?.trim()) {
    lines.push(`ADR;TYPE=WORK:;;${escapeVCardValue(params.location)};;;;`);
  }
  if (params.url?.trim()) {
    lines.push(`URL:${escapeVCardValue(params.url)}`);
  }
  if (params.bio?.trim()) {
    lines.push(`NOTE:${escapeVCardValue(params.bio)}`);
  }

  lines.push('END:VCARD');
  return lines.join('\r\n');
}

export function escapeCsvCell(value: string | number | boolean | null | undefined): string {
  const str = String(value ?? '');
  if (str.includes(',') || str.includes('"') || str.includes('\n') || str.includes('\r')) {
    return `"${str.replace(/"/g, '""')}"`;
  }
  return str;
}

export function downloadTextFile(filename: string, content: string, mimeType = 'text/plain;charset=utf-8'): void {
  const blob = new Blob([content], { type: mimeType });
  const url = URL.createObjectURL(blob);
  const anchor = document.createElement('a');
  anchor.href = url;
  anchor.download = filename;
  document.body.appendChild(anchor);
  anchor.click();
  document.body.removeChild(anchor);
  window.setTimeout(() => URL.revokeObjectURL(url), 1000);
}

// ============================================================================
// Linkora 3.0 Safe Schedule Window & Allowlisted Media Embed Parsers
// ============================================================================

const SAFE_DATETIME_REGEX = /^\d{4}-\d{2}-\d{2}T\d{2}:\d{2}(:\d{2}(\.\d{1,3})?Z?)?$/;

export function sanitizeScheduleDatetime(input?: string): string {
  const trimmed = (input || '').trim();
  if (!trimmed) return '';
  if (trimmed.length > 32 || !SAFE_DATETIME_REGEX.test(trimmed)) return '';
  const parsed = Date.parse(trimmed);
  if (Number.isNaN(parsed)) return '';
  return trimmed;
}

export type ScheduleState = 'live' | 'scheduled' | 'expired';

export function getLinkScheduleStatus(
  startsAt?: string,
  expiresAt?: string,
  nowMs: number = Date.now()
): ScheduleState {
  if (startsAt && startsAt.trim()) {
    const startMs = Date.parse(startsAt.trim());
    if (!Number.isNaN(startMs) && nowMs < startMs) {
      return 'scheduled';
    }
  }
  if (expiresAt && expiresAt.trim()) {
    const endMs = Date.parse(expiresAt.trim());
    if (!Number.isNaN(endMs) && nowMs > endMs) {
      return 'expired';
    }
  }
  return 'live';
}

export function extractSafeYouTubeEmbedUrl(rawUrl: string): string | null {
  try {
    const parsed = new URL(rawUrl);
    const host = parsed.hostname.replace(/^www\./, '').toLowerCase();
    let videoId = '';

    if (host === 'youtu.be') {
      videoId = parsed.pathname.split('/').filter(Boolean)[0] || '';
    } else if (host === 'youtube.com' || host === 'm.youtube.com' || host === 'youtube-nocookie.com') {
      if (parsed.pathname === '/watch') {
        videoId = parsed.searchParams.get('v') || '';
      } else if (parsed.pathname.startsWith('/shorts/') || parsed.pathname.startsWith('/embed/') || parsed.pathname.startsWith('/live/')) {
        videoId = parsed.pathname.split('/').filter(Boolean)[1] || '';
      }
    }

    if (/^[a-zA-Z0-9_-]{11}$/.test(videoId)) {
      return `https://www.youtube-nocookie.com/embed/${videoId}?rel=0`;
    }
    return null;
  } catch {
    return null;
  }
}

export function extractSafeSpotifyEmbedUrl(rawUrl: string): string | null {
  try {
    const parsed = new URL(rawUrl);
    const host = parsed.hostname.replace(/^www\./, '').toLowerCase();
    if (host !== 'open.spotify.com') return null;

    const parts = parsed.pathname
      .split('/')
      .filter(Boolean)
      .filter((seg) => !seg.startsWith('intl-') && seg !== 'embed');

    if (parts.length < 2) return null;
    const kind = parts[0];
    const itemId = parts[1];
    const allowedKinds = new Set(['track', 'album', 'playlist', 'episode', 'show']);
    if (!allowedKinds.has(kind)) return null;
    if (!/^[a-zA-Z0-9]{10,40}$/.test(itemId)) return null;

    return `https://open.spotify.com/embed/${kind}/${itemId}?utm_source=generator`;
  } catch {
    return null;
  }
}

