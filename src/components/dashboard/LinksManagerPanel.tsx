import React, { useMemo, useState } from 'react';
import {
  ArrowDown,
  ArrowUp,
  CalendarClock,
  Check,
  ChevronDown,
  ChevronUp,
  CopyPlus,
  Edit3,
  Eye,
  EyeOff,
  ImagePlus,
  Link2,
  MessageCircle,
  Pin,
  PlayCircle,
  Plus,
  Search,
  Share2,
  Star,
  Trash2,
  X,
} from 'lucide-react';
import { ConfirmModal } from '../ConfirmModal';
import { PLATFORM_OPTIONS, PlatformIcon } from '../PlatformIcon';
import {
  addBioLink,
  bulkSetBioLinksEnabled,
  deleteBioLink,
  duplicateBioLink,
  reorderBioLinks,
  updateBioLink,
} from '../../lib/firestoreService';
import {
  buildWhatsAppLink,
  compressImageToDataUrl,
  getLinkScheduleStatus,
} from '../../lib/validation';
import {
  BioLink,
  LinkEmbedType,
  LinkPlatform,
  PlanTier,
  ProfileConfig,
} from '../../types/linkora';

interface LinksManagerPanelProps {
  uid: string;
  profile: ProfileConfig;
  links: BioLink[];
  plan: PlanTier;
  onRefresh: () => Promise<void>;
}

type LinkStatusFilter = 'all' | 'live' | 'scheduled' | 'hidden';

function toDatetimeLocalInput(val?: string): string {
  if (!val) return '';
  return val.slice(0, 16);
}

export const LinksManagerPanel: React.FC<LinksManagerPanelProps> = ({
  uid,
  profile,
  links,
  plan,
  onRefresh,
}) => {
  const maxLinks = plan === 'premium' ? 50 : 10;

  // Add Link Form State
  const [title, setTitle] = useState('');
  const [platform, setPlatform] = useState<LinkPlatform>('website');
  const [url, setUrl] = useState('');
  const [waPhone, setWaPhone] = useState('');
  const [waMessage, setWaMessage] = useState('');
  const [isSocialIcon, setIsSocialIcon] = useState(false);

  // Rich Card 2.0 & Linkora 3.0 Add State
  const [showAdvancedAdd, setShowAdvancedAdd] = useState(false);
  const [subtitle, setSubtitle] = useState('');
  const [priceLabel, setPriceLabel] = useState('');
  const [badgeText, setBadgeText] = useState('');
  const [sectionTitle, setSectionTitle] = useState('');
  const [thumbnailUrl, setThumbnailUrl] = useState('');
  const [isFeatured, setIsFeatured] = useState(false);
  const [isPinned, setIsPinned] = useState(false);
  const [embedType, setEmbedType] = useState<LinkEmbedType>('none');
  const [startsAt, setStartsAt] = useState('');
  const [expiresAt, setExpiresAt] = useState('');
  const [uploadingThumb, setUploadingThumb] = useState(false);

  // Filter, Search & Edit State
  const [statusFilter, setStatusFilter] = useState<LinkStatusFilter>('all');
  const [searchTerm, setSearchTerm] = useState('');
  const [busy, setBusy] = useState(false);
  const [error, setError] = useState('');
  const [editingId, setEditingId] = useState<string | null>(null);
  const [editTitle, setEditTitle] = useState('');
  const [editUrl, setEditUrl] = useState('');
  const [editPlatform, setEditPlatform] = useState<LinkPlatform>('website');
  const [editSubtitle, setEditSubtitle] = useState('');
  const [editPriceLabel, setEditPriceLabel] = useState('');
  const [editBadgeText, setEditBadgeText] = useState('');
  const [editSectionTitle, setEditSectionTitle] = useState('');
  const [editThumbnailUrl, setEditThumbnailUrl] = useState('');
  const [editIsFeatured, setEditIsFeatured] = useState(false);
  const [editIsPinned, setEditIsPinned] = useState(false);
  const [editEmbedType, setEditEmbedType] = useState<LinkEmbedType>('none');
  const [editStartsAt, setEditStartsAt] = useState('');
  const [editExpiresAt, setEditExpiresAt] = useState('');

  const [deleteTarget, setDeleteTarget] = useState<BioLink | null>(null);

  const selectedMeta =
    PLATFORM_OPTIONS.find((p) => p.id === platform) || PLATFORM_OPTIONS[0];

  const filteredLinks = useMemo(() => {
    const q = searchTerm.trim().toLowerCase();
    const nowMs = Date.now();
    return links.filter((l) => {
      const sched = getLinkScheduleStatus(l.startsAt, l.expiresAt, nowMs);
      if (statusFilter === 'live' && (!l.enabled || sched !== 'live')) return false;
      if (statusFilter === 'scheduled' && (sched === 'live' || !l.enabled)) return false;
      if (statusFilter === 'hidden' && l.enabled && sched !== 'expired') return false;

      if (!q) return true;
      return (
        l.title.toLowerCase().includes(q) ||
        l.url.toLowerCase().includes(q) ||
        (l.sectionTitle || '').toLowerCase().includes(q) ||
        (l.subtitle || '').toLowerCase().includes(q)
      );
    });
  }, [links, searchTerm, statusFilter]);

  const handleQuickPreset = (
    presetPlatform: LinkPlatform,
    defaultTitle: string,
    defaultEmbed: LinkEmbedType = 'none'
  ) => {
    setPlatform(presetPlatform);
    if (!title) setTitle(defaultTitle);
    if (defaultEmbed !== 'none') {
      setEmbedType(defaultEmbed);
      setShowAdvancedAdd(true);
    }
    if (
      [
        'instagram',
        'youtube',
        'tiktok',
        'linkedin',
        'x',
        'facebook',
        'github',
        'whatsapp',
      ].includes(presetPlatform)
    ) {
      setIsSocialIcon(true);
    }
    if (presetPlatform === 'shop') {
      setShowAdvancedAdd(true);
    }
  };

  const handleThumbUpload = async (
    e: React.ChangeEvent<HTMLInputElement>,
    mode: 'add' | 'edit'
  ) => {
    const file = e.target.files?.[0];
    if (!file) return;
    setUploadingThumb(true);
    setError('');
    try {
      const dataUrl = await compressImageToDataUrl(file, 360, 95000);
      if (mode === 'add') {
        setThumbnailUrl(dataUrl);
      } else {
        setEditThumbnailUrl(dataUrl);
      }
    } catch (err) {
      setError(err instanceof Error ? err.message : 'Could not process thumbnail image.');
    } finally {
      setUploadingThumb(false);
      e.target.value = '';
    }
  };

  const handleCreateLink = async (e: React.FormEvent) => {
    e.preventDefault();
    setError('');
    setBusy(true);

    try {
      const resolvedUrl =
        platform === 'whatsapp' && waPhone.trim()
          ? buildWhatsAppLink(waPhone, waMessage)
          : url;

      await addBioLink(uid, profile, plan, {
        title,
        url: resolvedUrl,
        platform,
        isSocialIcon,
        subtitle,
        badgeText,
        priceLabel,
        sectionTitle,
        thumbnailUrl,
        isFeatured,
        isPinned,
        embedType,
        startsAt,
        expiresAt,
        order: links.length,
      });

      setTitle('');
      setUrl('');
      setWaPhone('');
      setWaMessage('');
      setIsSocialIcon(false);
      setSubtitle('');
      setPriceLabel('');
      setBadgeText('');
      setSectionTitle('');
      setThumbnailUrl('');
      setIsFeatured(false);
      setIsPinned(false);
      setEmbedType('none');
      setStartsAt('');
      setExpiresAt('');
      await onRefresh();
    } catch (err) {
      setError(err instanceof Error ? err.message : 'Could not add link.');
    } finally {
      setBusy(false);
    }
  };

  const handleStartEdit = (link: BioLink) => {
    setEditingId(link.id);
    setEditTitle(link.title);
    setEditUrl(link.url);
    setEditPlatform(link.platform);
    setEditSubtitle(link.subtitle || '');
    setEditPriceLabel(link.priceLabel || '');
    setEditBadgeText(link.badgeText || '');
    setEditSectionTitle(link.sectionTitle || '');
    setEditThumbnailUrl(link.thumbnailUrl || '');
    setEditIsFeatured(Boolean(link.isFeatured));
    setEditIsPinned(Boolean(link.isPinned));
    setEditEmbedType(link.embedType || 'none');
    setEditStartsAt(toDatetimeLocalInput(link.startsAt));
    setEditExpiresAt(toDatetimeLocalInput(link.expiresAt));
  };

  const handleSaveEdit = async (link: BioLink) => {
    setError('');
    setBusy(true);
    try {
      await updateBioLink(uid, link.id, {
        title: editTitle,
        url: editUrl,
        platform: editPlatform,
        subtitle: editSubtitle,
        priceLabel: editPriceLabel,
        badgeText: editBadgeText,
        sectionTitle: editSectionTitle,
        thumbnailUrl: editThumbnailUrl,
        isFeatured: editIsFeatured,
        isPinned: editIsPinned,
        embedType: editEmbedType,
        startsAt: editStartsAt,
        expiresAt: editExpiresAt,
      });
      setEditingId(null);
      await onRefresh();
    } catch (err) {
      setError(err instanceof Error ? err.message : 'Failed to update link.');
    } finally {
      setBusy(false);
    }
  };

  const handleToggleEnabled = async (link: BioLink) => {
    setError('');
    try {
      await updateBioLink(uid, link.id, { enabled: !link.enabled });
      await onRefresh();
    } catch (err) {
      setError(err instanceof Error ? err.message : 'Could not toggle link visibility.');
    }
  };

  const handleTogglePinnedTop = async (link: BioLink) => {
    setError('');
    try {
      await updateBioLink(uid, link.id, { isPinned: !link.isPinned });
      await onRefresh();
    } catch (err) {
      setError(err instanceof Error ? err.message : 'Could not update pin state.');
    }
  };

  const handleToggleSpotlight = async (link: BioLink) => {
    setError('');
    try {
      await updateBioLink(uid, link.id, { isFeatured: !link.isFeatured });
      await onRefresh();
    } catch (err) {
      setError(err instanceof Error ? err.message : 'Could not update spotlight state.');
    }
  };

  const handleBulkEnabled = async (nextEnabled: boolean) => {
    setError('');
    setBusy(true);
    try {
      await bulkSetBioLinksEnabled(uid, links, nextEnabled);
      await onRefresh();
    } catch (err) {
      setError(err instanceof Error ? err.message : 'Could not bulk update links.');
    } finally {
      setBusy(false);
    }
  };

  const handleDuplicate = async (link: BioLink) => {
    setError('');
    setBusy(true);
    try {
      await duplicateBioLink(uid, profile, plan, link, links.length);
      await onRefresh();
    } catch (err) {
      setError(err instanceof Error ? err.message : 'Could not duplicate link.');
    } finally {
      setBusy(false);
    }
  };

  const handleToggleSocialPin = async (link: BioLink) => {
    setError('');
    try {
      await updateBioLink(uid, link.id, { isSocialIcon: !link.isSocialIcon });
      await onRefresh();
    } catch (err) {
      setError(err instanceof Error ? err.message : 'Could not update social icon pin.');
    }
  };

  const handleMove = async (index: number, direction: -1 | 1) => {
    const targetIndex = index + direction;
    if (targetIndex < 0 || targetIndex >= links.length) return;
    const next = [...links];
    const [moved] = next.splice(index, 1);
    next.splice(targetIndex, 0, moved);
    setBusy(true);
    try {
      await reorderBioLinks(uid, next);
      await onRefresh();
    } catch (err) {
      setError(err instanceof Error ? err.message : 'Failed to reorder links.');
    } finally {
      setBusy(false);
    }
  };

  const handleConfirmDelete = async () => {
    if (!deleteTarget) return;
    setBusy(true);
    setError('');
    try {
      await deleteBioLink(uid, profile, deleteTarget.id);
      setDeleteTarget(null);
      await onRefresh();
    } catch (err) {
      setError(err instanceof Error ? err.message : 'Could not delete link.');
    } finally {
      setBusy(false);
    }
  };

  const limitReached = profile.linkCount >= maxLinks;
  const reorderLocked = Boolean(searchTerm.trim()) || statusFilter !== 'all';

  return (
    <div className="space-y-6">
      {/* Plan Usage Header */}
      <div className="rounded-2xl border border-slate-200 dark:border-slate-800 bg-white dark:bg-slate-900 p-5 flex flex-col sm:flex-row sm:items-center justify-between gap-4">
        <div>
          <h2 className="text-base font-bold text-slate-900 dark:text-white">
            Destination Links, Media Embeds &amp; Scheduled Drops
          </h2>
          <p className="text-xs text-slate-500 dark:text-slate-400 mt-0.5">
            Add websites, WhatsApp contacts, YouTube/Spotify inline embeds, pinned links, timed
            release schedules, and rich product cards.
          </p>
        </div>
        <div className="text-xs font-mono text-slate-600 dark:text-slate-300 tabular-nums shrink-0">
          {profile.linkCount} / {maxLinks} links used ({plan} plan)
        </div>
      </div>

      {/* Add New Link Form */}
      <form
        onSubmit={handleCreateLink}
        className="rounded-2xl border border-slate-200 dark:border-slate-800 bg-white dark:bg-slate-900 p-6 space-y-4"
      >
        <div className="flex flex-wrap items-center justify-between gap-2">
          <h3 className="text-sm font-bold text-slate-900 dark:text-white">Add a new link</h3>
          <div className="flex flex-wrap items-center gap-1.5">
            {(
              [
                ['whatsapp', 'WhatsApp', 'none'],
                ['youtube', 'YouTube Video', 'youtube'],
                ['website', 'Spotify Audio', 'spotify'],
                ['instagram', 'Instagram', 'none'],
                ['shop', 'Product Card', 'none'],
              ] as [LinkPlatform, string, LinkEmbedType][]
            ).map(([pid, label, presetEmbed]) => (
              <button
                key={label}
                type="button"
                onClick={() => handleQuickPreset(pid, label, presetEmbed)}
                className={`px-2.5 py-1 rounded-lg text-xs font-medium border transition-colors cursor-pointer whitespace-nowrap ${
                  platform === pid && embedType === presetEmbed
                    ? 'border-indigo-600 bg-indigo-50 text-indigo-700 dark:bg-indigo-950/60 dark:text-indigo-300'
                    : 'border-slate-200 dark:border-slate-700 text-slate-600 dark:text-slate-300 hover:bg-slate-50 dark:hover:bg-slate-800'
                }`}
              >
                + {label}
              </button>
            ))}
          </div>
        </div>

        {error && (
          <div className="p-3 rounded-xl bg-red-50 dark:bg-red-950/50 border border-red-200 dark:border-red-900 text-xs text-red-700 dark:text-red-300">
            {error}
          </div>
        )}

        <div className="grid grid-cols-1 sm:grid-cols-3 gap-4">
          <div>
            <label
              htmlFor="new-link-platform"
              className="block text-xs font-semibold text-slate-700 dark:text-slate-300 mb-1.5"
            >
              Link Type
            </label>
            <select
              id="new-link-platform"
              value={platform}
              onChange={(e) => setPlatform(e.target.value as LinkPlatform)}
              className="w-full min-h-[42px] px-3 py-2 rounded-xl border border-slate-300 dark:border-slate-700 bg-white dark:bg-slate-950 text-sm text-slate-900 dark:text-white"
            >
              {PLATFORM_OPTIONS.map((opt) => (
                <option key={opt.id} value={opt.id}>
                  {opt.label}
                </option>
              ))}
            </select>
          </div>

          <div className="sm:col-span-2">
            <label
              htmlFor="new-link-title"
              className="block text-xs font-semibold text-slate-700 dark:text-slate-300 mb-1.5"
            >
              Button / Card Title
            </label>
            <input
              id="new-link-title"
              type="text"
              required
              maxLength={100}
              value={title}
              onChange={(e) => setTitle(e.target.value)}
              placeholder="e.g., Watch My Latest Studio Breakdown, 1:1 Strategy Call"
              className="w-full min-h-[42px] px-3.5 py-2 rounded-xl border border-slate-300 dark:border-slate-700 bg-white dark:bg-slate-950 text-sm text-slate-900 dark:text-white"
            />
          </div>
        </div>

        {platform === 'whatsapp' ? (
          <div className="grid grid-cols-1 sm:grid-cols-2 gap-4 p-4 rounded-xl bg-slate-50 dark:bg-slate-950 border border-slate-200 dark:border-slate-800">
            <div>
              <label
                htmlFor="wa-phone"
                className="block text-xs font-semibold text-slate-700 dark:text-slate-300 mb-1"
              >
                WhatsApp Phone (with country code)
              </label>
              <input
                id="wa-phone"
                type="tel"
                value={waPhone}
                onChange={(e) => setWaPhone(e.target.value)}
                placeholder="+92 300 1234567"
                className="w-full min-h-[40px] px-3 py-1.5 rounded-lg border border-slate-300 dark:border-slate-700 bg-white dark:bg-slate-900 text-sm text-slate-900 dark:text-white"
              />
            </div>
            <div>
              <label
                htmlFor="wa-msg"
                className="block text-xs font-semibold text-slate-700 dark:text-slate-300 mb-1"
              >
                Optional Pre-filled Greeting
              </label>
              <input
                id="wa-msg"
                type="text"
                maxLength={160}
                value={waMessage}
                onChange={(e) => setWaMessage(e.target.value)}
                placeholder="Hi! I found your Linkora page..."
                className="w-full min-h-[40px] px-3 py-1.5 rounded-lg border border-slate-300 dark:border-slate-700 bg-white dark:bg-slate-900 text-sm text-slate-900 dark:text-white"
              />
            </div>
            {!waPhone && (
              <div className="sm:col-span-2">
                <label
                  htmlFor="wa-raw-url"
                  className="block text-xs text-slate-500 dark:text-slate-400 mb-1"
                >
                  Or paste an existing wa.me URL directly:
                </label>
                <input
                  id="wa-raw-url"
                  type="text"
                  value={url}
                  onChange={(e) => setUrl(e.target.value)}
                  placeholder="https://wa.me/923001234567"
                  className="w-full min-h-[40px] px-3 py-1.5 rounded-lg border border-slate-300 dark:border-slate-700 bg-white dark:bg-slate-900 text-sm text-slate-900 dark:text-white"
                />
              </div>
            )}
          </div>
        ) : (
          <div>
            <label
              htmlFor="new-link-url"
              className="block text-xs font-semibold text-slate-700 dark:text-slate-300 mb-1.5"
            >
              Destination URL / Contact
            </label>
            <input
              id="new-link-url"
              type="text"
              required
              maxLength={1000}
              value={url}
              onChange={(e) => setUrl(e.target.value)}
              placeholder={
                embedType === 'youtube'
                  ? 'https://www.youtube.com/watch?v=...'
                  : embedType === 'spotify'
                  ? 'https://open.spotify.com/track/...'
                  : selectedMeta.placeholder
              }
              className="w-full min-h-[42px] px-3.5 py-2 rounded-xl border border-slate-300 dark:border-slate-700 bg-white dark:bg-slate-950 text-sm text-slate-900 dark:text-white font-mono"
            />
          </div>
        )}

        {/* Expandable Rich Card, Media Embed & Schedule Options (Linkora 3.0) */}
        <div className="pt-1">
          <button
            type="button"
            onClick={() => setShowAdvancedAdd((prev) => !prev)}
            className="inline-flex items-center gap-1.5 text-xs font-semibold text-indigo-600 dark:text-indigo-400 hover:underline cursor-pointer"
          >
            {showAdvancedAdd ? (
              <ChevronUp className="w-3.5 h-3.5" />
            ) : (
              <ChevronDown className="w-3.5 h-3.5" />
            )}
            <span>
              Rich Card, Inline Media &amp; Schedule Options (Thumbnails, YouTube/Spotify, Timed
              Releases)
            </span>
          </button>

          {showAdvancedAdd && (
            <div className="mt-3 p-4 rounded-xl bg-slate-50 dark:bg-slate-950 border border-slate-200 dark:border-slate-800 space-y-4">
              <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                <div>
                  <label
                    htmlFor="new-link-subtitle"
                    className="block text-xs font-semibold text-slate-700 dark:text-slate-300 mb-1"
                  >
                    Card Subtitle (Optional)
                  </label>
                  <input
                    id="new-link-subtitle"
                    type="text"
                    maxLength={140}
                    value={subtitle}
                    onChange={(e) => setSubtitle(e.target.value)}
                    placeholder="e.g., Instant digital download · 45 templates"
                    className="w-full min-h-[40px] px-3 py-1.5 rounded-lg border border-slate-300 dark:border-slate-700 bg-white dark:bg-slate-900 text-xs text-slate-900 dark:text-white"
                  />
                </div>
                <div>
                  <label
                    htmlFor="new-link-section"
                    className="block text-xs font-semibold text-slate-700 dark:text-slate-300 mb-1"
                  >
                    Section Group Header Above Card (Optional)
                  </label>
                  <input
                    id="new-link-section"
                    type="text"
                    maxLength={60}
                    value={sectionTitle}
                    onChange={(e) => setSectionTitle(e.target.value)}
                    placeholder="e.g., Featured Products, Latest Videos"
                    className="w-full min-h-[40px] px-3 py-1.5 rounded-lg border border-slate-300 dark:border-slate-700 bg-white dark:bg-slate-900 text-xs text-slate-900 dark:text-white"
                  />
                </div>
              </div>

              <div className="grid grid-cols-1 sm:grid-cols-3 gap-4">
                <div>
                  <label
                    htmlFor="new-link-price"
                    className="block text-xs font-semibold text-slate-700 dark:text-slate-300 mb-1"
                  >
                    Price Tag (Optional)
                  </label>
                  <input
                    id="new-link-price"
                    type="text"
                    maxLength={24}
                    value={priceLabel}
                    onChange={(e) => setPriceLabel(e.target.value)}
                    placeholder="e.g., $29 or PKR 3,500"
                    className="w-full min-h-[40px] px-3 py-1.5 rounded-lg border border-slate-300 dark:border-slate-700 bg-white dark:bg-slate-900 text-xs font-mono text-slate-900 dark:text-white"
                  />
                </div>
                <div>
                  <label
                    htmlFor="new-link-badge"
                    className="block text-xs font-semibold text-slate-700 dark:text-slate-300 mb-1"
                  >
                    Highlight Label (Optional)
                  </label>
                  <input
                    id="new-link-badge"
                    type="text"
                    maxLength={24}
                    value={badgeText}
                    onChange={(e) => setBadgeText(e.target.value)}
                    placeholder="e.g., New, Bestseller"
                    className="w-full min-h-[40px] px-3 py-1.5 rounded-lg border border-slate-300 dark:border-slate-700 bg-white dark:bg-slate-900 text-xs text-slate-900 dark:text-white"
                  />
                </div>
                <div>
                  <label className="block text-xs font-semibold text-slate-700 dark:text-slate-300 mb-1">
                    Card Thumbnail
                  </label>
                  <div className="flex items-center gap-2">
                    <label className="min-h-[40px] px-3 py-1.5 rounded-lg border border-slate-300 dark:border-slate-700 bg-white dark:bg-slate-900 text-xs font-semibold text-slate-700 dark:text-slate-200 hover:bg-slate-50 dark:hover:bg-slate-800 inline-flex items-center gap-1.5 cursor-pointer whitespace-nowrap">
                      <ImagePlus className="w-3.5 h-3.5 text-indigo-600 dark:text-indigo-400" />
                      <span>
                        {uploadingThumb
                          ? 'Processing...'
                          : thumbnailUrl
                          ? 'Change Image'
                          : 'Upload Image'}
                      </span>
                      <input
                        type="file"
                        accept="image/*"
                        onChange={(e) => handleThumbUpload(e, 'add')}
                        className="hidden"
                      />
                    </label>
                    {thumbnailUrl && (
                      <button
                        type="button"
                        onClick={() => setThumbnailUrl('')}
                        aria-label="Remove thumbnail"
                        className="w-9 h-9 rounded-lg border border-red-200 dark:border-red-900/60 text-red-600 dark:text-red-400 flex items-center justify-center cursor-pointer"
                      >
                        <Trash2 className="w-3.5 h-3.5" />
                      </button>
                    )}
                  </div>
                </div>
              </div>

              {/* Linkora 3.0 Inline Media Embed & Timed Schedule */}
              <div className="grid grid-cols-1 sm:grid-cols-3 gap-4 pt-3 border-t border-slate-200/80 dark:border-slate-800">
                <div>
                  <label
                    htmlFor="new-link-embed"
                    className="block text-xs font-semibold text-slate-700 dark:text-slate-300 mb-1"
                  >
                    Inline Media Player (3.0)
                  </label>
                  <select
                    id="new-link-embed"
                    value={embedType}
                    onChange={(e) => setEmbedType(e.target.value as LinkEmbedType)}
                    className="w-full min-h-[40px] px-3 py-1.5 rounded-lg border border-slate-300 dark:border-slate-700 bg-white dark:bg-slate-900 text-xs text-slate-900 dark:text-white"
                  >
                    <option value="none">Standard External Link</option>
                    <option value="youtube">YouTube Inline Video Player</option>
                    <option value="spotify">Spotify Inline Audio Player</option>
                  </select>
                </div>

                <div>
                  <label
                    htmlFor="new-link-starts"
                    className="block text-xs font-semibold text-slate-700 dark:text-slate-300 mb-1"
                  >
                    Publish Start Time (Optional)
                  </label>
                  <input
                    id="new-link-starts"
                    type="datetime-local"
                    value={startsAt}
                    onChange={(e) => setStartsAt(e.target.value)}
                    className="w-full min-h-[40px] px-3 py-1.5 rounded-lg border border-slate-300 dark:border-slate-700 bg-white dark:bg-slate-900 text-xs font-mono text-slate-900 dark:text-white"
                  />
                </div>

                <div>
                  <label
                    htmlFor="new-link-expires"
                    className="block text-xs font-semibold text-slate-700 dark:text-slate-300 mb-1"
                  >
                    Auto-Expire Time (Optional)
                  </label>
                  <input
                    id="new-link-expires"
                    type="datetime-local"
                    value={expiresAt}
                    onChange={(e) => setExpiresAt(e.target.value)}
                    className="w-full min-h-[40px] px-3 py-1.5 rounded-lg border border-slate-300 dark:border-slate-700 bg-white dark:bg-slate-900 text-xs font-mono text-slate-900 dark:text-white"
                  />
                </div>
              </div>

              <div className="flex flex-wrap items-center gap-5 pt-1">
                <label className="inline-flex items-center gap-2 text-xs text-slate-700 dark:text-slate-300 cursor-pointer">
                  <input
                    type="checkbox"
                    checked={isPinned}
                    onChange={(e) => setIsPinned(e.target.checked)}
                    className="w-4 h-4 rounded border-slate-300 text-indigo-600 focus:ring-indigo-600"
                  />
                  <span>Pin to top of bio page</span>
                </label>

                <label className="inline-flex items-center gap-2 text-xs text-slate-700 dark:text-slate-300 cursor-pointer">
                  <input
                    type="checkbox"
                    checked={isFeatured}
                    onChange={(e) => setIsFeatured(e.target.checked)}
                    className="w-4 h-4 rounded border-slate-300 text-indigo-600 focus:ring-indigo-600"
                  />
                  <span>Highlight as a Spotlight Card</span>
                </label>
              </div>
            </div>
          )}
        </div>

        <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4 pt-1">
          <label className="inline-flex items-center gap-2 text-xs text-slate-700 dark:text-slate-300 cursor-pointer">
            <input
              type="checkbox"
              checked={isSocialIcon}
              onChange={(e) => setIsSocialIcon(e.target.checked)}
              className="w-4 h-4 rounded border-slate-300 text-indigo-600 focus:ring-indigo-600"
            />
            <span>Also pin icon in top social bar</span>
          </label>

          <button
            type="submit"
            disabled={busy || limitReached || uploadingThumb}
            className="min-h-[42px] px-5 py-2 rounded-xl bg-indigo-600 hover:bg-indigo-700 text-white text-xs font-semibold inline-flex items-center justify-center gap-2 transition-colors cursor-pointer disabled:opacity-50 whitespace-nowrap"
          >
            <Plus className="w-4 h-4" />
            <span>{limitReached ? 'Plan Link Limit Reached' : 'Add Link to Page'}</span>
          </button>
        </div>
      </form>

      {/* Filter, Bulk Actions & Search Toolbar */}
      {links.length > 0 && (
        <div className="flex flex-col lg:flex-row lg:items-center justify-between gap-3">
          <div className="flex flex-wrap items-center gap-2">
            <div className="inline-flex items-center gap-1 p-1 rounded-xl bg-slate-100 dark:bg-slate-900 border border-slate-200 dark:border-slate-800">
              {(
                [
                  ['all', 'All'],
                  ['live', 'Live'],
                  ['scheduled', 'Scheduled'],
                  ['hidden', 'Hidden / Expired'],
                ] as [LinkStatusFilter, string][]
              ).map(([fid, flabel]) => (
                <button
                  key={fid}
                  type="button"
                  onClick={() => setStatusFilter(fid)}
                  className={`px-2.5 py-1 rounded-lg text-xs font-semibold transition-colors cursor-pointer whitespace-nowrap ${
                    statusFilter === fid
                      ? 'bg-white dark:bg-slate-800 text-slate-900 dark:text-white shadow-xs'
                      : 'text-slate-600 dark:text-slate-400 hover:text-slate-900 dark:hover:text-white'
                  }`}
                >
                  {flabel}
                </button>
              ))}
            </div>

            {links.length > 1 && (
              <div className="inline-flex items-center gap-1.5">
                <button
                  type="button"
                  disabled={busy}
                  onClick={() => handleBulkEnabled(true)}
                  className="px-2.5 py-1.5 rounded-lg border border-slate-200 dark:border-slate-700 bg-white dark:bg-slate-900 text-xs font-medium text-slate-600 dark:text-slate-300 hover:bg-slate-50 dark:hover:bg-slate-800 cursor-pointer whitespace-nowrap"
                >
                  Enable All
                </button>
                <button
                  type="button"
                  disabled={busy}
                  onClick={() => handleBulkEnabled(false)}
                  className="px-2.5 py-1.5 rounded-lg border border-slate-200 dark:border-slate-700 bg-white dark:bg-slate-900 text-xs font-medium text-slate-600 dark:text-slate-300 hover:bg-slate-50 dark:hover:bg-slate-800 cursor-pointer whitespace-nowrap"
                >
                  Hide All
                </button>
              </div>
            )}
          </div>

          <div className="flex items-center gap-3">
            <span className="text-xs font-medium text-slate-500 dark:text-slate-400 tabular-nums whitespace-nowrap">
              {filteredLinks.length} of {links.length}
            </span>
            <div className="relative w-full sm:w-64">
              <Search className="w-4 h-4 text-slate-400 absolute left-3 top-1/2 -translate-y-1/2 pointer-events-none" />
              <input
                type="search"
                value={searchTerm}
                onChange={(e) => setSearchTerm(e.target.value)}
                placeholder="Filter by title or section..."
                aria-label="Filter links"
                className="w-full min-h-[38px] pl-9 pr-3 py-1.5 rounded-xl border border-slate-200 dark:border-slate-700 bg-white dark:bg-slate-900 text-xs text-slate-900 dark:text-white"
              />
            </div>
          </div>
        </div>
      )}

      {/* Existing Links List */}
      <div className="space-y-3">
        {links.length === 0 ? (
          <div className="rounded-2xl border border-dashed border-slate-300 dark:border-slate-700 p-10 text-center bg-white dark:bg-slate-900">
            <div className="w-11 h-11 rounded-xl bg-slate-100 dark:bg-slate-800 text-slate-500 flex items-center justify-center mx-auto mb-3">
              <Link2 className="w-5 h-5" />
            </div>
            <h3 className="text-sm font-bold text-slate-900 dark:text-white">No links added yet</h3>
            <p className="mt-1 text-xs text-slate-500 dark:text-slate-400 max-w-sm mx-auto">
              Use the form above to add your website, YouTube/Spotify embeds, WhatsApp inquiry
              button, or product cards. They appear immediately in your live preview.
            </p>
          </div>
        ) : filteredLinks.length === 0 ? (
          <div className="rounded-2xl border border-slate-200 dark:border-slate-800 p-8 text-center bg-white dark:bg-slate-900">
            <p className="text-xs font-medium text-slate-500 dark:text-slate-400">
              No links match the selected filter or search query.
            </p>
          </div>
        ) : (
          filteredLinks.map((link) => {
            const fullIdx = links.findIndex((item) => item.id === link.id);
            const isEditing = editingId === link.id;
            const scheduleState = getLinkScheduleStatus(link.startsAt, link.expiresAt);
            return (
              <div
                key={link.id}
                className={`rounded-2xl border bg-white dark:bg-slate-900 p-4 sm:p-5 transition-colors ${
                  link.enabled && scheduleState === 'live'
                    ? 'border-slate-200 dark:border-slate-800'
                    : 'border-slate-200/70 dark:border-slate-800/70 opacity-70'
                }`}
              >
                {isEditing ? (
                  <div className="space-y-3">
                    <div className="grid grid-cols-1 sm:grid-cols-3 gap-3">
                      <select
                        value={editPlatform}
                        onChange={(e) => setEditPlatform(e.target.value as LinkPlatform)}
                        aria-label="Edit link platform"
                        className="min-h-[40px] px-3 py-1.5 rounded-lg border border-slate-300 dark:border-slate-700 bg-white dark:bg-slate-950 text-sm text-slate-900 dark:text-white"
                      >
                        {PLATFORM_OPTIONS.map((opt) => (
                          <option key={opt.id} value={opt.id}>
                            {opt.label}
                          </option>
                        ))}
                      </select>
                      <input
                        type="text"
                        value={editTitle}
                        onChange={(e) => setEditTitle(e.target.value)}
                        maxLength={100}
                        aria-label="Edit link title"
                        className="sm:col-span-2 min-h-[40px] px-3 py-1.5 rounded-lg border border-slate-300 dark:border-slate-700 bg-white dark:bg-slate-950 text-sm text-slate-900 dark:text-white"
                      />
                    </div>
                    <input
                      type="text"
                      value={editUrl}
                      onChange={(e) => setEditUrl(e.target.value)}
                      maxLength={1000}
                      aria-label="Edit link URL"
                      className="w-full min-h-[40px] px-3 py-1.5 rounded-lg border border-slate-300 dark:border-slate-700 bg-white dark:bg-slate-950 text-sm font-mono text-slate-900 dark:text-white"
                    />

                    {/* Rich Card Edit Fields */}
                    <div className="grid grid-cols-1 sm:grid-cols-2 gap-3 pt-1">
                      <input
                        type="text"
                        value={editSubtitle}
                        onChange={(e) => setEditSubtitle(e.target.value)}
                        maxLength={140}
                        placeholder="Subtitle (optional)"
                        className="min-h-[38px] px-3 py-1.5 rounded-lg border border-slate-300 dark:border-slate-700 bg-white dark:bg-slate-950 text-xs text-slate-900 dark:text-white"
                      />
                      <input
                        type="text"
                        value={editSectionTitle}
                        onChange={(e) => setEditSectionTitle(e.target.value)}
                        maxLength={60}
                        placeholder="Section header above card (optional)"
                        className="min-h-[38px] px-3 py-1.5 rounded-lg border border-slate-300 dark:border-slate-700 bg-white dark:bg-slate-950 text-xs text-slate-900 dark:text-white"
                      />
                    </div>

                    <div className="grid grid-cols-1 sm:grid-cols-3 gap-3">
                      <input
                        type="text"
                        value={editPriceLabel}
                        onChange={(e) => setEditPriceLabel(e.target.value)}
                        maxLength={24}
                        placeholder="Price tag (e.g. $29)"
                        className="min-h-[38px] px-3 py-1.5 rounded-lg border border-slate-300 dark:border-slate-700 bg-white dark:bg-slate-950 text-xs font-mono text-slate-900 dark:text-white"
                      />
                      <input
                        type="text"
                        value={editBadgeText}
                        onChange={(e) => setEditBadgeText(e.target.value)}
                        maxLength={24}
                        placeholder="Label (e.g. New)"
                        className="min-h-[38px] px-3 py-1.5 rounded-lg border border-slate-300 dark:border-slate-700 bg-white dark:bg-slate-950 text-xs text-slate-900 dark:text-white"
                      />
                      <div className="flex items-center gap-2">
                        <label className="min-h-[38px] px-3 py-1.5 rounded-lg border border-slate-300 dark:border-slate-700 bg-white dark:bg-slate-950 text-xs font-semibold text-slate-700 dark:text-slate-200 inline-flex items-center gap-1.5 cursor-pointer whitespace-nowrap">
                          <ImagePlus className="w-3.5 h-3.5 text-indigo-600 dark:text-indigo-400" />
                          <span>{editThumbnailUrl ? 'Replace Thumb' : 'Add Thumb'}</span>
                          <input
                            type="file"
                            accept="image/*"
                            onChange={(e) => handleThumbUpload(e, 'edit')}
                            className="hidden"
                          />
                        </label>
                        {editThumbnailUrl && (
                          <button
                            type="button"
                            onClick={() => setEditThumbnailUrl('')}
                            className="text-xs text-red-600 dark:text-red-400 underline cursor-pointer"
                          >
                            Clear
                          </button>
                        )}
                      </div>
                    </div>

                    {/* Linkora 3.0 Embed & Schedule Edit Fields */}
                    <div className="grid grid-cols-1 sm:grid-cols-3 gap-3 pt-2 border-t border-slate-100 dark:border-slate-800">
                      <div>
                        <label className="block text-[11px] font-semibold text-slate-600 dark:text-slate-400 mb-1">
                          Inline Media Player
                        </label>
                        <select
                          value={editEmbedType}
                          onChange={(e) => setEditEmbedType(e.target.value as LinkEmbedType)}
                          className="w-full min-h-[38px] px-3 py-1.5 rounded-lg border border-slate-300 dark:border-slate-700 bg-white dark:bg-slate-950 text-xs text-slate-900 dark:text-white"
                        >
                          <option value="none">None (Standard Link)</option>
                          <option value="youtube">YouTube Inline Video</option>
                          <option value="spotify">Spotify Inline Audio</option>
                        </select>
                      </div>
                      <div>
                        <label className="block text-[11px] font-semibold text-slate-600 dark:text-slate-400 mb-1">
                          Start Time (Optional)
                        </label>
                        <input
                          type="datetime-local"
                          value={editStartsAt}
                          onChange={(e) => setEditStartsAt(e.target.value)}
                          className="w-full min-h-[38px] px-3 py-1.5 rounded-lg border border-slate-300 dark:border-slate-700 bg-white dark:bg-slate-950 text-xs font-mono text-slate-900 dark:text-white"
                        />
                      </div>
                      <div>
                        <label className="block text-[11px] font-semibold text-slate-600 dark:text-slate-400 mb-1">
                          Expire Time (Optional)
                        </label>
                        <input
                          type="datetime-local"
                          value={editExpiresAt}
                          onChange={(e) => setEditExpiresAt(e.target.value)}
                          className="w-full min-h-[38px] px-3 py-1.5 rounded-lg border border-slate-300 dark:border-slate-700 bg-white dark:bg-slate-950 text-xs font-mono text-slate-900 dark:text-white"
                        />
                      </div>
                    </div>

                    <div className="flex flex-wrap items-center justify-between gap-2 pt-1">
                      <div className="flex flex-wrap items-center gap-4">
                        <label className="inline-flex items-center gap-2 text-xs text-slate-700 dark:text-slate-300 cursor-pointer">
                          <input
                            type="checkbox"
                            checked={editIsPinned}
                            onChange={(e) => setEditIsPinned(e.target.checked)}
                            className="w-4 h-4 rounded border-slate-300 text-indigo-600"
                          />
                          <span>Pin to Top</span>
                        </label>
                        <label className="inline-flex items-center gap-2 text-xs text-slate-700 dark:text-slate-300 cursor-pointer">
                          <input
                            type="checkbox"
                            checked={editIsFeatured}
                            onChange={(e) => setEditIsFeatured(e.target.checked)}
                            className="w-4 h-4 rounded border-slate-300 text-indigo-600"
                          />
                          <span>Spotlight Card</span>
                        </label>
                      </div>

                      <div className="flex items-center gap-2">
                        <button
                          type="button"
                          onClick={() => setEditingId(null)}
                          className="min-h-[36px] px-3 py-1.5 rounded-lg border border-slate-200 dark:border-slate-700 text-xs font-semibold text-slate-600 dark:text-slate-300 inline-flex items-center gap-1 cursor-pointer"
                        >
                          <X className="w-3.5 h-3.5" />
                          <span>Cancel</span>
                        </button>
                        <button
                          type="button"
                          disabled={busy || uploadingThumb}
                          onClick={() => handleSaveEdit(link)}
                          className="min-h-[36px] px-3.5 py-1.5 rounded-lg bg-indigo-600 text-white text-xs font-semibold inline-flex items-center gap-1 cursor-pointer"
                        >
                          <Check className="w-3.5 h-3.5" />
                          <span>Save</span>
                        </button>
                      </div>
                    </div>
                  </div>
                ) : (
                  <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4">
                    <div className="flex items-start gap-3.5 min-w-0">
                      {link.thumbnailUrl ? (
                        <img
                          src={link.thumbnailUrl}
                          alt=""
                          referrerPolicy="no-referrer"
                          className="w-11 h-11 rounded-xl object-cover border border-slate-200 dark:border-slate-700 shrink-0 mt-0.5"
                        />
                      ) : (
                        <div className="w-10 h-10 rounded-xl bg-slate-100 dark:bg-slate-800 text-slate-700 dark:text-slate-200 flex items-center justify-center shrink-0 mt-0.5">
                          <PlatformIcon platform={link.platform} className="w-4 h-4" />
                        </div>
                      )}
                      <div className="min-w-0">
                        {link.sectionTitle && (
                          <p className="text-[11px] font-semibold text-indigo-600 dark:text-indigo-400 mb-0.5">
                            Section: {link.sectionTitle}
                          </p>
                        )}
                        <div className="flex items-center gap-2 min-w-0">
                          <h4 className="text-sm font-bold text-slate-900 dark:text-white truncate">
                            {link.title}
                          </h4>
                          {link.priceLabel && (
                            <span className="text-xs font-mono font-semibold text-slate-700 dark:text-slate-300 tabular-nums shrink-0">
                              · {link.priceLabel}
                            </span>
                          )}
                        </div>
                        {link.subtitle && (
                          <p className="text-xs text-slate-600 dark:text-slate-300 truncate max-w-md mt-0.5">
                            {link.subtitle}
                          </p>
                        )}
                        <p className="text-xs font-mono text-slate-500 dark:text-slate-400 truncate max-w-md mt-0.5">
                          {link.url}
                        </p>
                        <div className="mt-1.5 flex flex-wrap items-center gap-2 text-xs text-slate-500 dark:text-slate-400 tabular-nums">
                          <span>{link.clicks} clicks</span>
                          <span aria-hidden="true">·</span>
                          <span>{link.enabled ? 'Visible' : 'Hidden'}</span>
                          {link.isPinned && (
                            <>
                              <span aria-hidden="true">·</span>
                              <span className="text-indigo-600 dark:text-indigo-400 font-semibold">
                                Pinned Top
                              </span>
                            </>
                          )}
                          {scheduleState === 'scheduled' && (
                            <>
                              <span aria-hidden="true">·</span>
                              <span className="inline-flex items-center gap-1 text-amber-600 dark:text-amber-400 font-semibold">
                                <CalendarClock className="w-3 h-3" />
                                Scheduled
                              </span>
                            </>
                          )}
                          {scheduleState === 'expired' && (
                            <>
                              <span aria-hidden="true">·</span>
                              <span className="text-red-600 dark:text-red-400 font-semibold">
                                Expired
                              </span>
                            </>
                          )}
                          {link.embedType && link.embedType !== 'none' && (
                            <>
                              <span aria-hidden="true">·</span>
                              <span className="inline-flex items-center gap-1 text-emerald-600 dark:text-emerald-400 font-semibold capitalize">
                                <PlayCircle className="w-3 h-3" />
                                {link.embedType} Embed
                              </span>
                            </>
                          )}
                          {link.isFeatured && (
                            <>
                              <span aria-hidden="true">·</span>
                              <span className="text-amber-600 dark:text-amber-400 font-semibold">
                                Spotlight
                              </span>
                            </>
                          )}
                          {link.badgeText && (
                            <>
                              <span aria-hidden="true">·</span>
                              <span>Label: {link.badgeText}</span>
                            </>
                          )}
                          {link.isSocialIcon && (
                            <>
                              <span aria-hidden="true">·</span>
                              <span>Social bar icon</span>
                            </>
                          )}
                        </div>
                      </div>
                    </div>

                    <div className="flex flex-wrap items-center gap-1.5 shrink-0">
                      <button
                        type="button"
                        disabled={fullIdx <= 0 || busy || reorderLocked}
                        onClick={() => handleMove(fullIdx, -1)}
                        aria-label={`Move ${link.title} up`}
                        title="Move up"
                        className="w-9 h-9 rounded-lg border border-slate-200 dark:border-slate-700 flex items-center justify-center text-slate-600 dark:text-slate-300 hover:bg-slate-50 dark:hover:bg-slate-800 disabled:opacity-35 cursor-pointer"
                      >
                        <ArrowUp className="w-4 h-4" />
                      </button>
                      <button
                        type="button"
                        disabled={fullIdx === links.length - 1 || busy || reorderLocked}
                        onClick={() => handleMove(fullIdx, 1)}
                        aria-label={`Move ${link.title} down`}
                        title="Move down"
                        className="w-9 h-9 rounded-lg border border-slate-200 dark:border-slate-700 flex items-center justify-center text-slate-600 dark:text-slate-300 hover:bg-slate-50 dark:hover:bg-slate-800 disabled:opacity-35 cursor-pointer"
                      >
                        <ArrowDown className="w-4 h-4" />
                      </button>
                      <button
                        type="button"
                        onClick={() => handleTogglePinnedTop(link)}
                        aria-label="Pin link to top"
                        title={link.isPinned ? 'Unpin from top' : 'Pin link to top of bio page'}
                        className={`w-9 h-9 rounded-lg border flex items-center justify-center cursor-pointer ${
                          link.isPinned
                            ? 'border-indigo-300 bg-indigo-50 text-indigo-700 dark:border-indigo-800 dark:bg-indigo-950/60 dark:text-indigo-300'
                            : 'border-slate-200 dark:border-slate-700 text-slate-500 hover:bg-slate-50 dark:hover:bg-slate-800'
                        }`}
                      >
                        <Pin className="w-4 h-4" />
                      </button>
                      <button
                        type="button"
                        onClick={() => handleToggleSpotlight(link)}
                        aria-label="Toggle spotlight emphasis"
                        title={link.isFeatured ? 'Remove spotlight' : 'Highlight as spotlight card'}
                        className={`w-9 h-9 rounded-lg border flex items-center justify-center cursor-pointer ${
                          link.isFeatured
                            ? 'border-amber-300 bg-amber-50 text-amber-600 dark:border-amber-800 dark:bg-amber-950/50 dark:text-amber-400'
                            : 'border-slate-200 dark:border-slate-700 text-slate-500 hover:bg-slate-50 dark:hover:bg-slate-800'
                        }`}
                      >
                        <Star className={`w-4 h-4 ${link.isFeatured ? 'fill-current' : ''}`} />
                      </button>
                      <button
                        type="button"
                        onClick={() => handleToggleSocialPin(link)}
                        aria-label="Toggle social icon row pin"
                        title={link.isSocialIcon ? 'Remove from social bar' : 'Pin to social bar'}
                        className={`w-9 h-9 rounded-lg border flex items-center justify-center cursor-pointer ${
                          link.isSocialIcon
                            ? 'border-indigo-300 bg-indigo-50 text-indigo-700 dark:border-indigo-800 dark:bg-indigo-950/60 dark:text-indigo-300'
                            : 'border-slate-200 dark:border-slate-700 text-slate-500 hover:bg-slate-50 dark:hover:bg-slate-800'
                        }`}
                      >
                        {link.platform === 'whatsapp' ? (
                          <MessageCircle className="w-4 h-4" />
                        ) : (
                          <Share2 className="w-4 h-4" />
                        )}
                      </button>
                      <button
                        type="button"
                        disabled={busy || limitReached}
                        onClick={() => handleDuplicate(link)}
                        aria-label={`Duplicate ${link.title}`}
                        title="Duplicate link"
                        className="w-9 h-9 rounded-lg border border-slate-200 dark:border-slate-700 flex items-center justify-center text-slate-600 dark:text-slate-300 hover:bg-slate-50 dark:hover:bg-slate-800 disabled:opacity-35 cursor-pointer"
                      >
                        <CopyPlus className="w-4 h-4" />
                      </button>
                      <button
                        type="button"
                        onClick={() => handleToggleEnabled(link)}
                        aria-label={link.enabled ? 'Hide link' : 'Enable link'}
                        title={link.enabled ? 'Hide from public page' : 'Show on public page'}
                        className="w-9 h-9 rounded-lg border border-slate-200 dark:border-slate-700 flex items-center justify-center text-slate-600 dark:text-slate-300 hover:bg-slate-50 dark:hover:bg-slate-800 cursor-pointer"
                      >
                        {link.enabled ? (
                          <Eye className="w-4 h-4" />
                        ) : (
                          <EyeOff className="w-4 h-4" />
                        )}
                      </button>
                      <button
                        type="button"
                        onClick={() => handleStartEdit(link)}
                        aria-label={`Edit ${link.title}`}
                        title="Edit link"
                        className="w-9 h-9 rounded-lg border border-slate-200 dark:border-slate-700 flex items-center justify-center text-slate-600 dark:text-slate-300 hover:bg-slate-50 dark:hover:bg-slate-800 cursor-pointer"
                      >
                        <Edit3 className="w-4 h-4" />
                      </button>
                      <button
                        type="button"
                        onClick={() => setDeleteTarget(link)}
                        aria-label={`Delete ${link.title}`}
                        title="Delete link"
                        className="w-9 h-9 rounded-lg border border-red-200 dark:border-red-900/60 flex items-center justify-center text-red-600 dark:text-red-400 hover:bg-red-50 dark:hover:bg-red-950/40 cursor-pointer"
                      >
                        <Trash2 className="w-4 h-4" />
                      </button>
                    </div>
                  </div>
                )}
              </div>
            );
          })
        )}
      </div>

      <ConfirmModal
        isOpen={Boolean(deleteTarget)}
        title="Delete this link?"
        description={`"${deleteTarget?.title || ''}" will be permanently removed from your Linkora page.`}
        confirmLabel="Delete Link"
        busy={busy}
        onCancel={() => setDeleteTarget(null)}
        onConfirm={handleConfirmDelete}
      />
    </div>
  );
};
