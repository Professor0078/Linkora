import React, { useId, useMemo, useState } from 'react';
import {
  ArrowUpRight,
  BadgeCheck,
  Briefcase,
  CalendarClock,
  CheckCircle2,
  ChevronDown,
  ChevronUp,
  Clock,
  Contact,
  Flag,
  Heart,
  MapPin,
  Megaphone,
  MessageSquare,
  Moon,
  Music,
  Pin,
  Play,
  QrCode,
  Search,
  Send,
  Star,
  Sun,
  User,
  X,
} from 'lucide-react';
import { BioLink, ProfileConfig } from '../types/linkora';
import {
  AVATAR_SHAPE_CLASSES,
  BUTTON_SHAPE_CLASSES,
  computeContrastTextColor,
  getButtonVisualClasses,
  getFontClass,
  getThemeById,
  LAYOUT_WIDTH_CLASSES,
  SAFE_GRADIENT_PRESETS,
} from '../lib/themes';
import {
  downloadTextFile,
  extractSafeSpotifyEmbedUrl,
  extractSafeYouTubeEmbedUrl,
  generateVCardString,
  getLinkScheduleStatus,
  SAFE_HEX_COLOR_REGEX,
  validateBasicEmail,
} from '../lib/validation';
import { PlatformIcon } from './PlatformIcon';

export interface PublicLeadInput {
  visitorName: string;
  visitorEmail: string;
  visitorPhone: string;
  message: string;
}

interface BioPageRendererProps {
  profile: Omit<
    ProfileConfig,
    'uid' | 'accountStatus' | 'linkCount' | 'lastModifiedLinkId' | 'totalViews' | 'totalClicks'
  >;
  links: BioLink[];
  compactPreview?: boolean;
  onLinkClick?: (link: BioLink) => void;
  onCtaClick?: () => void;
  onOpenShare?: () => void;
  onOpenReport?: () => void;
  onSubmitLead?: (input: PublicLeadInput) => Promise<void>;
}

export const BioPageRenderer: React.FC<BioPageRendererProps> = ({
  profile,
  links,
  compactPreview = false,
  onLinkClick,
  onCtaClick,
  onOpenShare,
  onOpenReport,
  onSubmitLead,
}) => {
  const rawId = useId().replace(/[^a-zA-Z0-9_-]/g, '');
  const scopeClass = `bio-scope-${rawId}`;
  const [avatarFailed, setAvatarFailed] = useState(false);
  const [failedThumbIds, setFailedThumbIds] = useState<Record<string, boolean>>({});
  const [vcardSavedFeedback, setVcardSavedFeedback] = useState(false);

  // Visitor Light / Dark surface override (3.0)
  const [visitorColorOverride, setVisitorColorOverride] = useState<'default' | 'light' | 'dark'>('default');
  // Visitor inline media drawer state (3.0)
  const [expandedEmbedIds, setExpandedEmbedIds] = useState<Record<string, boolean>>({});
  // Visitor link search when creator has many links (3.0)
  const [linkFilterQuery, setLinkFilterQuery] = useState('');

  // Visitor Lead Capture state
  const [leadExpanded, setLeadExpanded] = useState(!compactPreview);
  const [visitorName, setVisitorName] = useState('');
  const [visitorEmail, setVisitorEmail] = useState('');
  const [visitorPhone, setVisitorPhone] = useState('');
  const [visitorMessage, setVisitorMessage] = useState('');
  const [leadBusy, setLeadBusy] = useState(false);
  const [leadError, setLeadError] = useState('');
  const [leadSubmitted, setLeadSubmitted] = useState(false);

  const theme = getThemeById(profile.themeId);

  const baseBgColor = SAFE_HEX_COLOR_REGEX.test(profile.customBgColor)
    ? profile.customBgColor
    : theme.bgColor;

  const matchedGradientPreset = SAFE_GRADIENT_PRESETS.find(
    (g) => g.value && g.value === profile.customBgGradient
  );
  const baseGradient = matchedGradientPreset ? matchedGradientPreset.value : theme.bgGradient;

  const baseTextColor = SAFE_HEX_COLOR_REGEX.test(profile.customTextColor)
    ? profile.customTextColor
    : theme.textColor;

  const baseButtonColor = SAFE_HEX_COLOR_REGEX.test(profile.customButtonColor)
    ? profile.customButtonColor
    : theme.buttonColor;

  const baseButtonText = SAFE_HEX_COLOR_REGEX.test(profile.customButtonColor)
    ? computeContrastTextColor(profile.customButtonColor)
    : theme.buttonTextColor;

  const isBaseDark = computeContrastTextColor(baseBgColor) === '#FFFFFF';

  const effectiveMode: 'light' | 'dark' =
    visitorColorOverride === 'default' ? (isBaseDark ? 'dark' : 'light') : visitorColorOverride;

  const resolvedBgColor =
    visitorColorOverride === 'default'
      ? baseBgColor
      : visitorColorOverride === 'dark'
      ? '#09090B'
      : '#F8FAFC';

  const resolvedGradient =
    visitorColorOverride === 'default'
      ? baseGradient
      : visitorColorOverride === 'dark'
      ? 'linear-gradient(160deg, #09090B 0%, #18181B 55%, #0F172A 100%)'
      : 'linear-gradient(160deg, #FFFFFF 0%, #F8FAFC 65%, #F1F5F9 100%)';

  const resolvedTextColor =
    visitorColorOverride === 'default'
      ? baseTextColor
      : visitorColorOverride === 'dark'
      ? '#FAFAFA'
      : '#0F172A';

  const resolvedButtonColor =
    visitorColorOverride === 'default'
      ? baseButtonColor
      : visitorColorOverride === 'dark'
      ? '#27272A'
      : '#0F172A';

  const resolvedButtonText =
    visitorColorOverride === 'default'
      ? baseButtonText
      : visitorColorOverride === 'dark'
      ? '#FAFAFA'
      : '#FFFFFF';

  const safeBgImage =
    visitorColorOverride === 'default' &&
    profile.backgroundImageUrl &&
    (profile.backgroundImageUrl.startsWith('data:image/') ||
      profile.backgroundImageUrl.startsWith('https://') ||
      profile.backgroundImageUrl.startsWith('/src/assets/') ||
      profile.backgroundImageUrl.startsWith('/assets/'))
      ? profile.backgroundImageUrl.replace(/["'()\\]/g, '')
      : '';

  const buttonShapeClass = BUTTON_SHAPE_CLASSES[profile.buttonShape] || 'rounded-xl';
  const buttonStyleClass = getButtonVisualClasses(profile.buttonStyle);
  const avatarShapeClass = AVATAR_SHAPE_CLASSES[profile.avatarShape] || 'rounded-full';
  const fontClass = getFontClass(profile.fontFamily);
  const widthClass = compactPreview ? 'max-w-sm' : LAYOUT_WIDTH_CLASSES[profile.layoutWidth] || 'max-w-lg';

  const liveEnabledLinks = useMemo(() => {
    const now = Date.now();
    return links
      .filter((l) => l.enabled && getLinkScheduleStatus(l.startsAt, l.expiresAt, now) === 'live')
      .sort((a, b) => {
        if (Boolean(a.isPinned) !== Boolean(b.isPinned)) {
          return a.isPinned ? -1 : 1;
        }
        return a.order - b.order;
      });
  }, [links]);

  const filteredLinks = useMemo(() => {
    const q = linkFilterQuery.trim().toLowerCase();
    if (!q) return liveEnabledLinks;
    return liveEnabledLinks.filter(
      (l) =>
        l.title.toLowerCase().includes(q) ||
        (l.subtitle || '').toLowerCase().includes(q) ||
        (l.sectionTitle || '').toLowerCase().includes(q) ||
        (l.badgeText || '').toLowerCase().includes(q)
    );
  }, [liveEnabledLinks, linkFilterQuery]);

  const socialLinks = liveEnabledLinks.filter((l) => l.isSocialIcon);

  const allowVisitorToggle = profile.visitorThemeSwitchEnabled !== false;

  const handleToggleVisitorTheme = () => {
    const nextTarget: 'light' | 'dark' = effectiveMode === 'dark' ? 'light' : 'dark';
    const matchesBase = (nextTarget === 'dark') === isBaseDark;
    setVisitorColorOverride(matchesBase ? 'default' : nextTarget);
  };

  const scopedCss = `
    .${scopeClass} {
      background-color: ${resolvedBgColor};
      ${resolvedGradient ? `background-image: ${resolvedGradient};` : ''}
      color: ${resolvedTextColor};
    }
    .${scopeClass} .bio-btn {
      ${
        profile.buttonStyle === 'outline'
          ? `border-color: ${resolvedButtonColor}; color: ${resolvedTextColor}; background-color: transparent;`
          : profile.buttonStyle === 'glass'
          ? `color: ${resolvedTextColor};`
          : `background-color: ${resolvedButtonColor}; color: ${resolvedButtonText};`
      }
    }
    .${scopeClass} .bio-cta-btn {
      background-color: ${resolvedTextColor};
      color: ${computeContrastTextColor(resolvedTextColor)};
    }
    .${scopeClass} .bio-surface {
      border-color: currentColor;
    }
  `;

  const handleSaveContactVCard = () => {
    const publicUrl =
      typeof window !== 'undefined'
        ? `${window.location.origin}/${profile.username || 'creator'}`
        : `https://linkora.app/${profile.username || 'creator'}`;

    const vcf = generateVCardString({
      displayName: profile.displayName || profile.username || 'Creator',
      headline: profile.headline || '',
      email: profile.vcardEmail || '',
      phone: profile.vcardPhone || '',
      location: profile.location || '',
      bio: profile.bio || '',
      url: publicUrl,
    });

    downloadTextFile(`${profile.username || 'contact'}.vcf`, vcf, 'text/vcard;charset=utf-8');
    setVcardSavedFeedback(true);
    window.setTimeout(() => setVcardSavedFeedback(false), 2500);
  };

  const handleLeadFormSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setLeadError('');

    if (visitorName.trim().length < 2) {
      setLeadError('Please enter your name.');
      return;
    }
    if (!validateBasicEmail(visitorEmail)) {
      setLeadError('Please enter a valid email address.');
      return;
    }

    if (compactPreview || !onSubmitLead) {
      setLeadSubmitted(true);
      setVisitorName('');
      setVisitorEmail('');
      setVisitorPhone('');
      setVisitorMessage('');
      return;
    }

    setLeadBusy(true);
    try {
      await onSubmitLead({
        visitorName,
        visitorEmail,
        visitorPhone,
        message: visitorMessage,
      });
      setLeadSubmitted(true);
      setVisitorName('');
      setVisitorEmail('');
      setVisitorPhone('');
      setVisitorMessage('');
    } catch (err) {
      setLeadError(err instanceof Error ? err.message : 'Unable to send message right now.');
    } finally {
      setLeadBusy(false);
    }
  };

  const renderAvailabilityLine = () => {
    const status = profile.availabilityStatus || 'none';
    if (status === 'none') return null;

    const defaultLabel =
      status === 'available'
        ? 'Available for new projects'
        : status === 'booking'
        ? 'Open for bookings & collaborations'
        : 'Currently booked · Limited availability';

    const label = (profile.availabilityText || '').trim() || defaultLabel;
    const StatusIcon =
      status === 'available' ? Briefcase : status === 'booking' ? CalendarClock : Clock;

    return (
      <div className="mt-2.5 inline-flex items-center justify-center gap-1.5 text-xs font-medium opacity-85 text-center">
        <StatusIcon className="w-3.5 h-3.5 shrink-0 opacity-85" aria-hidden="true" />
        <span>{label}</span>
      </div>
    );
  };

  let lastRenderedSection = '';

  return (
    <div
      className={`${scopeClass} ${fontClass} relative w-full ${
        compactPreview ? 'min-h-[580px] rounded-3xl overflow-hidden' : 'min-h-screen'
      } flex flex-col items-center justify-between transition-colors duration-200`}
    >
      <style>{scopedCss}</style>

      {safeBgImage && (
        <div className="absolute inset-0 pointer-events-none overflow-hidden">
          <img
            src={safeBgImage}
            alt=""
            referrerPolicy="no-referrer"
            loading="lazy"
            className="w-full h-full object-cover opacity-30"
          />
          <div className="absolute inset-0 bg-gradient-to-b from-black/25 via-transparent to-black/50" />
        </div>
      )}

      {/* Optional Top Announcement Strip */}
      {profile.announcementText && profile.announcementText.trim().length > 0 && (
        <div className="relative z-10 w-full px-4 py-2.5 backdrop-blur-md bg-black/10 border-b border-current/10 text-center">
          <p className="max-w-xl mx-auto text-xs font-medium flex items-center justify-center gap-2">
            <Megaphone className="w-3.5 h-3.5 shrink-0 opacity-85" aria-hidden="true" />
            <span className="truncate">{profile.announcementText}</span>
          </p>
        </div>
      )}

      <div
        className={`relative z-10 w-full ${widthClass} mx-auto px-5 ${
          compactPreview ? 'pt-6 pb-8' : 'pt-9 pb-14 sm:pt-12'
        } flex flex-col items-center`}
      >
        {/* Top utility bar (Visitor Light/Dark Switcher + Save Contact vCard + Share QR) */}
        {(allowVisitorToggle || onOpenShare || profile.vcardEnabled) && (
          <div className="w-full flex items-center justify-between gap-2 mb-4">
            <div>
              {allowVisitorToggle && (
                <button
                  type="button"
                  onClick={handleToggleVisitorTheme}
                  aria-label={
                    effectiveMode === 'dark' ? 'Switch page to light mode' : 'Switch page to dark mode'
                  }
                  title={
                    effectiveMode === 'dark' ? 'Switch page to light mode' : 'Switch page to dark mode'
                  }
                  className="inline-flex items-center gap-1.5 min-h-[36px] px-3 py-1.5 rounded-full text-xs font-semibold backdrop-blur-md bg-black/10 hover:bg-black/20 transition-colors cursor-pointer whitespace-nowrap shrink-0"
                >
                  {effectiveMode === 'dark' ? (
                    <>
                      <Sun className="w-3.5 h-3.5" aria-hidden="true" />
                      <span>Light</span>
                    </>
                  ) : (
                    <>
                      <Moon className="w-3.5 h-3.5" aria-hidden="true" />
                      <span>Dark</span>
                    </>
                  )}
                </button>
              )}
            </div>

            <div className="flex items-center gap-2">
              {profile.vcardEnabled && (
                <button
                  type="button"
                  onClick={handleSaveContactVCard}
                  className="inline-flex items-center gap-1.5 min-h-[36px] px-3.5 py-1.5 rounded-full text-xs font-semibold backdrop-blur-md bg-black/10 hover:bg-black/20 transition-colors cursor-pointer whitespace-nowrap shrink-0"
                >
                  <Contact className="w-3.5 h-3.5" aria-hidden="true" />
                  <span>{vcardSavedFeedback ? 'Contact Saved' : 'Save Contact'}</span>
                </button>
              )}
              {onOpenShare && (
                <button
                  type="button"
                  onClick={onOpenShare}
                  aria-label="Share or view QR code for this page"
                  className="inline-flex items-center gap-1.5 min-h-[36px] px-3.5 py-1.5 rounded-full text-xs font-semibold backdrop-blur-md bg-black/10 hover:bg-black/20 transition-colors cursor-pointer whitespace-nowrap shrink-0"
                >
                  <QrCode className="w-3.5 h-3.5" aria-hidden="true" />
                  <span>Share</span>
                </button>
              )}
            </div>
          </div>
        )}

        {/* Avatar */}
        <div
          className={`w-24 h-24 ${avatarShapeClass} overflow-hidden border-2 border-white/40 shadow-sm bg-slate-200/60 flex items-center justify-center shrink-0 mb-4`}
        >
          {profile.avatarUrl && !avatarFailed ? (
            <img
              src={profile.avatarUrl}
              alt={`${profile.displayName} profile photo`}
              referrerPolicy="no-referrer"
              onError={() => setAvatarFailed(true)}
              className="w-full h-full object-cover"
            />
          ) : (
            <User className="w-10 h-10 opacity-60" aria-hidden="true" />
          )}
        </div>

        {/* Display Name + Official Verified Creator Badge */}
        <div className="flex items-center justify-center gap-1.5 max-w-full">
          <h1 className="text-xl sm:text-2xl font-bold tracking-tight text-center text-balance">
            {profile.displayName || 'Your Name'}
          </h1>
          {profile.isVerifiedCreator && (
            <span
              title="Verified Creator"
              aria-label="Verified Creator"
              className="inline-flex items-center justify-center shrink-0 text-sky-500"
            >
              <BadgeCheck className="w-5 h-5" />
            </span>
          )}
        </div>

        {/* Handle + Headline + Location metadata (unboxed text with · separators) */}
        <div className="mt-1.5 flex flex-wrap items-center justify-center gap-x-2 gap-y-1 text-xs opacity-75 text-center">
          <span className="font-mono">@{profile.username || 'username'}</span>
          {profile.headline && profile.headline.trim().length > 0 && (
            <>
              <span aria-hidden="true">·</span>
              <span className="font-medium">{profile.headline}</span>
            </>
          )}
          {profile.location && profile.location.trim().length > 0 && (
            <>
              <span aria-hidden="true">·</span>
              <span className="inline-flex items-center gap-1">
                <MapPin className="w-3 h-3 shrink-0 opacity-80" aria-hidden="true" />
                <span>{profile.location}</span>
              </span>
            </>
          )}
        </div>

        {/* Linkora 3.0 Availability Status Line */}
        {renderAvailabilityLine()}

        {/* Bio */}
        {profile.bio && (
          <p className="mt-3 text-sm sm:text-base leading-relaxed text-center opacity-85 max-w-md whitespace-pre-line">
            {profile.bio}
          </p>
        )}

        {/* Social Icon Row */}
        {socialLinks.length > 0 && (
          <div className="mt-5 flex flex-wrap items-center justify-center gap-2.5">
            {socialLinks.map((social) => {
              const isExternal = social.url.startsWith('http');
              return (
                <a
                  key={`soc-${social.id}`}
                  href={social.url}
                  target={isExternal ? '_blank' : undefined}
                  rel={isExternal ? 'noopener noreferrer' : undefined}
                  onClick={(e) => {
                    if (compactPreview) {
                      e.preventDefault();
                    }
                    onLinkClick?.(social);
                  }}
                  aria-label={social.title}
                  title={social.title}
                  className="w-11 h-11 rounded-full flex items-center justify-center bg-black/10 hover:bg-black/20 transition-transform duration-150 hover:scale-105 focus-visible:outline-2 focus-visible:outline-offset-2"
                >
                  <PlatformIcon platform={social.platform} className="w-5 h-5" />
                </a>
              );
            })}
          </div>
        )}

        {/* Custom Primary Call-to-Action Button */}
        {profile.ctaLabel && profile.ctaUrl && (
          <div className="w-full mt-6">
            <a
              href={profile.ctaUrl}
              target={profile.ctaUrl.startsWith('http') ? '_blank' : undefined}
              rel={profile.ctaUrl.startsWith('http') ? 'noopener noreferrer' : undefined}
              onClick={(e) => {
                if (compactPreview) {
                  e.preventDefault();
                }
                onCtaClick?.();
              }}
              className={`bio-cta-btn w-full min-h-[48px] px-5 py-3.5 ${buttonShapeClass} font-semibold text-sm sm:text-base flex items-center justify-between gap-3 shadow-sm transition-transform duration-150 hover:-translate-y-0.5 focus-visible:outline-2 focus-visible:outline-offset-2`}
            >
              <span className="truncate">{profile.ctaLabel}</span>
              <ArrowUpRight className="w-4 h-4 shrink-0" aria-hidden="true" />
            </a>
          </div>
        )}

        {/* Visitor Quick Link Filter (shown automatically when 6+ links are live) */}
        {!compactPreview && liveEnabledLinks.length >= 6 && (
          <div className="w-full mt-5 relative">
            <Search
              className="w-3.5 h-3.5 absolute left-3.5 top-1/2 -translate-y-1/2 opacity-60 pointer-events-none"
              aria-hidden="true"
            />
            <input
              type="search"
              value={linkFilterQuery}
              onChange={(e) => setLinkFilterQuery(e.target.value)}
              placeholder="Search links..."
              aria-label="Search links on this page"
              className="w-full min-h-[40px] pl-9 pr-8 py-2 rounded-xl border border-current/15 bg-black/5 backdrop-blur-xs text-xs placeholder:opacity-60 focus:outline-2"
            />
            {linkFilterQuery && (
              <button
                type="button"
                onClick={() => setLinkFilterQuery('')}
                aria-label="Clear search"
                className="absolute right-2.5 top-1/2 -translate-y-1/2 p-1 opacity-70 hover:opacity-100 cursor-pointer"
              >
                <X className="w-3.5 h-3.5" />
              </button>
            )}
          </div>
        )}

        {/* Rich Link Stack 3.0 */}
        <div className="w-full mt-5 space-y-3">
          {filteredLinks.length === 0 ? (
            <div className="w-full py-8 px-4 rounded-2xl border border-current/15 text-center opacity-70 text-sm">
              {linkFilterQuery
                ? 'No links match your search.'
                : 'No active links published yet.'}
            </div>
          ) : (
            filteredLinks.map((link) => {
              const isExternal = link.url.startsWith('http');
              const cleanSection = (link.sectionTitle || '').trim();
              const showSectionHeader =
                cleanSection.length > 0 && cleanSection !== lastRenderedSection;
              if (cleanSection.length > 0) {
                lastRenderedSection = cleanSection;
              }

              const hasThumb = Boolean(link.thumbnailUrl && !failedThumbIds[link.id]);
              const hasSubtitle = Boolean(link.subtitle && link.subtitle.trim().length > 0);
              const hasBadge = Boolean(link.badgeText && link.badgeText.trim().length > 0);
              const hasPrice = Boolean(link.priceLabel && link.priceLabel.trim().length > 0);
              const isSpotlight = Boolean(link.isFeatured);
              const isPinned = Boolean(link.isPinned);

              const youtubeEmbed =
                link.embedType === 'youtube' ? extractSafeYouTubeEmbedUrl(link.url) : null;
              const spotifyEmbed =
                link.embedType === 'spotify' ? extractSafeSpotifyEmbedUrl(link.url) : null;
              const activeEmbedUrl = youtubeEmbed || spotifyEmbed;
              const isEmbedOpen = Boolean(expandedEmbedIds[link.id]);

              return (
                <React.Fragment key={link.id}>
                  {showSectionHeader && (
                    <div className="pt-3 pb-1 flex items-center gap-3">
                      <span className="text-xs font-semibold tracking-tight opacity-75">
                        {cleanSection}
                      </span>
                      <div className="h-px flex-1 bg-current opacity-15" />
                    </div>
                  )}

                  <div className="w-full">
                    <a
                      href={link.url}
                      target={isExternal ? '_blank' : undefined}
                      rel={isExternal ? 'noopener noreferrer' : undefined}
                      onClick={(e) => {
                        if (compactPreview) {
                          e.preventDefault();
                        }
                        onLinkClick?.(link);
                      }}
                      className={`bio-btn w-full min-h-[54px] ${
                        hasThumb || hasSubtitle ? 'p-3.5 sm:px-4 sm:py-3.5' : 'px-5 py-3.5'
                      } ${buttonShapeClass} ${buttonStyleClass} ${
                        isSpotlight ? 'ring-2 ring-current/30 shadow-md' : ''
                      } flex items-center justify-between gap-3 transition-all duration-150 focus-visible:outline-2 focus-visible:outline-offset-2`}
                    >
                      <div className="flex items-center gap-3.5 min-w-0 flex-1">
                        {hasThumb ? (
                          <div className="w-12 h-12 rounded-lg overflow-hidden bg-black/15 shrink-0 flex items-center justify-center">
                            <img
                              src={link.thumbnailUrl}
                              alt=""
                              referrerPolicy="no-referrer"
                              onError={() =>
                                setFailedThumbIds((prev) => ({ ...prev, [link.id]: true }))
                              }
                              className="w-full h-full object-cover"
                            />
                          </div>
                        ) : (
                          <PlatformIcon
                            platform={link.platform}
                            className="w-4 h-4 shrink-0 opacity-90"
                          />
                        )}

                        <div className="min-w-0 flex-1 text-left">
                          <div className="flex items-center gap-2 min-w-0">
                            {isPinned && (
                              <Pin
                                className="w-3.5 h-3.5 shrink-0 opacity-80"
                                aria-label="Pinned link"
                              />
                            )}
                            {isSpotlight && (
                              <Star
                                className="w-3.5 h-3.5 shrink-0 fill-current opacity-85"
                                aria-hidden="true"
                              />
                            )}
                            <span className="font-semibold text-sm sm:text-base truncate">
                              {link.title}
                            </span>
                          </div>

                          {(hasSubtitle || hasBadge) && (
                            <div className="mt-0.5 flex flex-wrap items-center gap-x-1.5 gap-y-0.5 text-xs opacity-80">
                              {hasBadge && <span className="font-semibold">{link.badgeText}</span>}
                              {hasBadge && hasSubtitle && <span aria-hidden="true">·</span>}
                              {hasSubtitle && <span className="line-clamp-1">{link.subtitle}</span>}
                            </div>
                          )}
                        </div>
                      </div>

                      <div className="flex items-center gap-2.5 shrink-0">
                        {hasPrice && (
                          <span className="text-xs sm:text-sm font-mono font-semibold tabular-nums opacity-95">
                            {link.priceLabel}
                          </span>
                        )}
                        <ArrowUpRight className="w-4 h-4 shrink-0 opacity-75" aria-hidden="true" />
                      </div>
                    </a>

                    {/* Safe Allowlisted Inline Media Player Drawer (YouTube / Spotify) */}
                    {activeEmbedUrl && (
                      <div className="mt-1.5">
                        <button
                          type="button"
                          onClick={() =>
                            setExpandedEmbedIds((prev) => ({
                              ...prev,
                              [link.id]: !prev[link.id],
                            }))
                          }
                          className="inline-flex items-center gap-1.5 px-3 py-1 rounded-lg text-xs font-medium opacity-80 hover:opacity-100 bg-black/10 hover:bg-black/15 transition-colors cursor-pointer whitespace-nowrap"
                        >
                          {youtubeEmbed ? (
                            <Play className="w-3 h-3 shrink-0" aria-hidden="true" />
                          ) : (
                            <Music className="w-3 h-3 shrink-0" aria-hidden="true" />
                          )}
                          <span>
                            {isEmbedOpen
                              ? 'Hide Player'
                              : youtubeEmbed
                              ? 'Watch Video Here'
                              : 'Listen Here'}
                          </span>
                          {isEmbedOpen ? (
                            <ChevronUp className="w-3.5 h-3.5" aria-hidden="true" />
                          ) : (
                            <ChevronDown className="w-3.5 h-3.5" aria-hidden="true" />
                          )}
                        </button>

                        {isEmbedOpen && (
                          <div className="mt-2 rounded-2xl overflow-hidden border border-current/15 bg-black/20 shadow-sm">
                            {youtubeEmbed ? (
                              <div className="aspect-video w-full">
                                <iframe
                                  src={youtubeEmbed}
                                  title={link.title}
                                  loading="lazy"
                                  allow="accelerometer; autoplay; clipboard-write; encrypted-media; gyroscope; picture-in-picture"
                                  allowFullScreen
                                  referrerPolicy="strict-origin-when-cross-origin"
                                  className="w-full h-full border-0"
                                />
                              </div>
                            ) : (
                              <iframe
                                src={spotifyEmbed || ''}
                                title={link.title}
                                loading="lazy"
                                allow="autoplay; clipboard-write; encrypted-media; fullscreen; picture-in-picture"
                                className="w-full h-[152px] border-0"
                              />
                            )}
                          </div>
                        )}
                      </div>
                    )}
                  </div>
                </React.Fragment>
              );
            })
          )}
        </div>

        {/* Linkora 3.0 Creator Tip Jar / Support Card */}
        {profile.tipJarEnabled && profile.tipJarUrl && profile.tipJarUrl.trim().length > 0 && (
          <div className="w-full mt-6 rounded-2xl border border-current/15 backdrop-blur-md bg-black/5 p-4 flex items-center justify-between gap-3">
            <div className="flex items-center gap-3 min-w-0">
              <div className="w-9 h-9 rounded-xl bg-black/10 flex items-center justify-center shrink-0">
                <Heart className="w-4 h-4" aria-hidden="true" />
              </div>
              <div className="min-w-0 text-left">
                <p className="text-sm font-bold tracking-tight truncate">
                  {profile.tipJarLabel?.trim() || 'Support my work'}
                </p>
                <p className="text-xs opacity-75 truncate">
                  Direct creator support & appreciation
                </p>
              </div>
            </div>
            <a
              href={profile.tipJarUrl}
              target={profile.tipJarUrl.startsWith('http') ? '_blank' : undefined}
              rel={profile.tipJarUrl.startsWith('http') ? 'noopener noreferrer' : undefined}
              onClick={(e) => {
                if (compactPreview) e.preventDefault();
                onCtaClick?.();
              }}
              className={`bio-cta-btn min-h-[38px] px-4 py-2 ${buttonShapeClass} text-xs font-semibold inline-flex items-center gap-1.5 shrink-0 whitespace-nowrap transition-transform duration-150 hover:-translate-y-0.5`}
            >
              <span>Support</span>
              <ArrowUpRight className="w-3.5 h-3.5" aria-hidden="true" />
            </a>
          </div>
        )}

        {/* Visitor Lead Capture / Inquiry Form */}
        {profile.leadCaptureEnabled && (
          <div className="w-full mt-6 rounded-2xl border border-current/15 backdrop-blur-md bg-black/5 p-4 sm:p-5">
            <div className="flex items-center justify-between gap-3">
              <div className="flex items-center gap-2 min-w-0">
                <MessageSquare className="w-4 h-4 shrink-0 opacity-80" aria-hidden="true" />
                <h2 className="text-sm font-bold tracking-tight truncate">
                  {profile.leadCaptureTitle?.trim() || 'Send me a message'}
                </h2>
              </div>
              {compactPreview && (
                <button
                  type="button"
                  onClick={() => setLeadExpanded((prev) => !prev)}
                  className="text-xs font-semibold underline opacity-80 hover:opacity-100 cursor-pointer whitespace-nowrap shrink-0"
                >
                  {leadExpanded ? 'Hide' : 'Open Form'}
                </button>
              )}
            </div>

            {leadExpanded && (
              <div className="mt-3.5">
                {leadSubmitted ? (
                  <div className="py-3 px-3.5 rounded-xl bg-black/10 flex items-center justify-between gap-3 text-xs">
                    <span className="inline-flex items-center gap-2 font-medium">
                      <CheckCircle2 className="w-4 h-4 shrink-0" aria-hidden="true" />
                      <span>Message delivered directly to {profile.displayName || 'creator'}.</span>
                    </span>
                    <button
                      type="button"
                      onClick={() => setLeadSubmitted(false)}
                      className="font-semibold underline cursor-pointer whitespace-nowrap shrink-0"
                    >
                      New
                    </button>
                  </div>
                ) : (
                  <form onSubmit={handleLeadFormSubmit} className="space-y-2.5 text-left">
                    {leadError && (
                      <p className="text-xs font-medium px-3 py-2 rounded-lg bg-red-500/15">
                        {leadError}
                      </p>
                    )}
                    <div className="grid grid-cols-1 sm:grid-cols-2 gap-2.5">
                      <input
                        type="text"
                        required
                        minLength={2}
                        maxLength={80}
                        value={visitorName}
                        onChange={(e) => setVisitorName(e.target.value)}
                        placeholder="Your name"
                        aria-label="Your name"
                        className="w-full min-h-[40px] px-3 py-2 rounded-xl border border-current/20 bg-white/90 text-slate-900 placeholder:text-slate-500 text-xs focus:outline-2"
                      />
                      <input
                        type="email"
                        required
                        maxLength={254}
                        value={visitorEmail}
                        onChange={(e) => setVisitorEmail(e.target.value)}
                        placeholder="Email address"
                        aria-label="Email address"
                        className="w-full min-h-[40px] px-3 py-2 rounded-xl border border-current/20 bg-white/90 text-slate-900 placeholder:text-slate-500 text-xs focus:outline-2"
                      />
                    </div>
                    <input
                      type="tel"
                      maxLength={40}
                      value={visitorPhone}
                      onChange={(e) => setVisitorPhone(e.target.value)}
                      placeholder="WhatsApp or phone (optional)"
                      aria-label="WhatsApp or phone (optional)"
                      className="w-full min-h-[40px] px-3 py-2 rounded-xl border border-current/20 bg-white/90 text-slate-900 placeholder:text-slate-500 text-xs focus:outline-2"
                    />
                    <textarea
                      rows={2}
                      maxLength={500}
                      value={visitorMessage}
                      onChange={(e) => setVisitorMessage(e.target.value)}
                      placeholder="How can we collaborate or help?"
                      aria-label="Message"
                      className="w-full p-3 rounded-xl border border-current/20 bg-white/90 text-slate-900 placeholder:text-slate-500 text-xs focus:outline-2"
                    />
                    <button
                      type="submit"
                      disabled={leadBusy}
                      className={`bio-cta-btn w-full min-h-[42px] px-4 py-2.5 ${buttonShapeClass} text-xs font-semibold inline-flex items-center justify-center gap-2 cursor-pointer disabled:opacity-50 transition-opacity`}
                    >
                      <Send className="w-3.5 h-3.5" aria-hidden="true" />
                      <span>{leadBusy ? 'Sending...' : 'Send Message'}</span>
                    </button>
                  </form>
                )}
              </div>
            )}
          </div>
        )}
      </div>

      {/* Footer Branding & Abuse Reporting */}
      <footer className="relative z-10 pb-6 pt-2 px-4 flex items-center justify-center gap-3 text-xs opacity-70">
        <a
          href="/"
          onClick={(e) => {
            if (compactPreview) e.preventDefault();
          }}
          className="font-semibold tracking-tight hover:opacity-100 transition-opacity"
        >
          Linkora
        </a>
        {onOpenReport && (
          <>
            <span aria-hidden="true">·</span>
            <button
              type="button"
              onClick={onOpenReport}
              className="inline-flex items-center gap-1 hover:opacity-100 transition-opacity cursor-pointer"
            >
              <Flag className="w-3 h-3" aria-hidden="true" />
              <span>Report</span>
            </button>
          </>
        )}
      </footer>
    </div>
  );
};
