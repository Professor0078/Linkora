import React, { useId, useState } from 'react';
import { ArrowUpRight, Flag, QrCode, Share2, User } from 'lucide-react';
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
import { SAFE_HEX_COLOR_REGEX } from '../lib/validation';
import { PlatformIcon } from './PlatformIcon';

interface BioPageRendererProps {
  profile: Omit<ProfileConfig, 'uid' | 'accountStatus' | 'linkCount' | 'lastModifiedLinkId' | 'totalViews' | 'totalClicks'>;
  links: BioLink[];
  compactPreview?: boolean;
  onLinkClick?: (link: BioLink) => void;
  onCtaClick?: () => void;
  onOpenShare?: () => void;
  onOpenReport?: () => void;
}

export const BioPageRenderer: React.FC<BioPageRendererProps> = ({
  profile,
  links,
  compactPreview = false,
  onLinkClick,
  onCtaClick,
  onOpenShare,
  onOpenReport,
}) => {
  const rawId = useId().replace(/[^a-zA-Z0-9_-]/g, '');
  const scopeClass = `bio-scope-${rawId}`;
  const [avatarFailed, setAvatarFailed] = useState(false);

  const theme = getThemeById(profile.themeId);

  const resolvedBgColor = SAFE_HEX_COLOR_REGEX.test(profile.customBgColor)
    ? profile.customBgColor
    : theme.bgColor;

  const matchedGradientPreset = SAFE_GRADIENT_PRESETS.find(
    (g) => g.value && g.value === profile.customBgGradient
  );
  const resolvedGradient = matchedGradientPreset
    ? matchedGradientPreset.value
    : theme.bgGradient;

  const resolvedTextColor = SAFE_HEX_COLOR_REGEX.test(profile.customTextColor)
    ? profile.customTextColor
    : theme.textColor;

  const resolvedButtonColor = SAFE_HEX_COLOR_REGEX.test(profile.customButtonColor)
    ? profile.customButtonColor
    : theme.buttonColor;

  const resolvedButtonText = SAFE_HEX_COLOR_REGEX.test(profile.customButtonColor)
    ? computeContrastTextColor(profile.customButtonColor)
    : theme.buttonTextColor;

  const safeBgImage =
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

  const enabledLinks = links.filter((l) => l.enabled).sort((a, b) => a.order - b.order);
  const socialLinks = enabledLinks.filter((l) => l.isSocialIcon);

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
  `;

  return (
    <div
      className={`${scopeClass} ${fontClass} relative w-full ${
        compactPreview ? 'min-h-[560px] rounded-3xl overflow-hidden' : 'min-h-screen'
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

      <div
        className={`relative z-10 w-full ${widthClass} mx-auto px-5 ${
          compactPreview ? 'pt-6 pb-8' : 'pt-10 pb-14 sm:pt-14'
        } flex flex-col items-center`}
      >
        {/* Top utility bar on public page */}
        {onOpenShare && (
          <div className="w-full flex items-center justify-end gap-2 mb-4">
            <button
              type="button"
              onClick={onOpenShare}
              aria-label="Share or view QR code for this page"
              className="inline-flex items-center gap-1.5 px-3 py-2 rounded-full text-xs font-medium backdrop-blur-md bg-black/10 hover:bg-black/20 transition-colors cursor-pointer whitespace-nowrap shrink-0"
            >
              <QrCode className="w-3.5 h-3.5" aria-hidden="true" />
              <span>Share</span>
            </button>
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

        {/* Display Name & Username */}
        <h1 className="text-xl sm:text-2xl font-bold tracking-tight text-center text-balance">
          {profile.displayName || 'Your Name'}
        </h1>
        <p className="text-xs opacity-70 mt-1 font-mono">@{profile.username || 'username'}</p>

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

        {/* Custom Featured Call-to-Action Button */}
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

        {/* Link Stack */}
        <div className="w-full mt-5 space-y-3">
          {enabledLinks.length === 0 ? (
            <div className="w-full py-8 px-4 rounded-2xl border border-current/15 text-center opacity-70 text-sm">
              No active links published yet.
            </div>
          ) : (
            enabledLinks.map((link) => {
              const isExternal = link.url.startsWith('http');
              return (
                <a
                  key={link.id}
                  href={link.url}
                  target={isExternal ? '_blank' : undefined}
                  rel={isExternal ? 'noopener noreferrer' : undefined}
                  onClick={(e) => {
                    if (compactPreview) {
                      e.preventDefault();
                    }
                    onLinkClick?.(link);
                  }}
                  className={`bio-btn w-full min-h-[52px] px-5 py-3.5 ${buttonShapeClass} ${buttonStyleClass} flex items-center justify-between gap-3 font-medium text-sm sm:text-base transition-all duration-150 focus-visible:outline-2 focus-visible:outline-offset-2`}
                >
                  <span className="flex items-center gap-3 min-w-0">
                    <PlatformIcon platform={link.platform} className="w-4 h-4 shrink-0 opacity-90" />
                    <span className="truncate">{link.title}</span>
                  </span>
                  <Share2 className="w-3.5 h-3.5 shrink-0 opacity-0 group-hover:opacity-60" aria-hidden="true" />
                  <ArrowUpRight className="w-4 h-4 shrink-0 opacity-75" aria-hidden="true" />
                </a>
              );
            })
          )}
        </div>
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
