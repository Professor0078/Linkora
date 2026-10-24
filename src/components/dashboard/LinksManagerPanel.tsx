import React, { useState } from 'react';
import {
  ArrowDown,
  ArrowUp,
  Check,
  Edit3,
  Eye,
  EyeOff,
  Link2,
  MessageCircle,
  Plus,
  Share2,
  Trash2,
  X,
} from 'lucide-react';
import { ConfirmModal } from '../ConfirmModal';
import { PLATFORM_OPTIONS, PlatformIcon } from '../PlatformIcon';
import {
  addBioLink,
  deleteBioLink,
  reorderBioLinks,
  updateBioLink,
} from '../../lib/firestoreService';
import { buildWhatsAppLink } from '../../lib/validation';
import { BioLink, LinkPlatform, PlanTier, ProfileConfig } from '../../types/linkora';

interface LinksManagerPanelProps {
  uid: string;
  profile: ProfileConfig;
  links: BioLink[];
  plan: PlanTier;
  onRefresh: () => Promise<void>;
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

  const [busy, setBusy] = useState(false);
  const [error, setError] = useState('');
  const [editingId, setEditingId] = useState<string | null>(null);
  const [editTitle, setEditTitle] = useState('');
  const [editUrl, setEditUrl] = useState('');
  const [editPlatform, setEditPlatform] = useState<LinkPlatform>('website');

  const [deleteTarget, setDeleteTarget] = useState<BioLink | null>(null);

  const selectedMeta =
    PLATFORM_OPTIONS.find((p) => p.id === platform) || PLATFORM_OPTIONS[0];

  const handleQuickPreset = (presetPlatform: LinkPlatform, defaultTitle: string) => {
    setPlatform(presetPlatform);
    if (!title) setTitle(defaultTitle);
    if (
      ['instagram', 'youtube', 'tiktok', 'linkedin', 'x', 'facebook', 'github', 'whatsapp'].includes(
        presetPlatform
      )
    ) {
      setIsSocialIcon(true);
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
        order: links.length,
      });

      setTitle('');
      setUrl('');
      setWaPhone('');
      setWaMessage('');
      setIsSocialIcon(false);
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
  };

  const handleSaveEdit = async (link: BioLink) => {
    setError('');
    setBusy(true);
    try {
      await updateBioLink(uid, link.id, {
        title: editTitle,
        url: editUrl,
        platform: editPlatform,
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

  return (
    <div className="space-y-6">
      {/* Plan Usage Header */}
      <div className="rounded-2xl border border-slate-200 dark:border-slate-800 bg-white dark:bg-slate-900 p-5 flex flex-col sm:flex-row sm:items-center justify-between gap-4">
        <div>
          <h2 className="text-base font-bold text-slate-900 dark:text-white">
            Destination Links &amp; Social Channels
          </h2>
          <p className="text-xs text-slate-500 dark:text-slate-400 mt-0.5">
            Add websites, WhatsApp contacts, social profiles, portfolios, email, or phone buttons.
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
                ['whatsapp', 'WhatsApp'],
                ['instagram', 'Instagram'],
                ['youtube', 'YouTube'],
                ['portfolio', 'Portfolio'],
                ['shop', 'Store'],
              ] as [LinkPlatform, string][]
            ).map(([pid, label]) => (
              <button
                key={pid}
                type="button"
                onClick={() => handleQuickPreset(pid, label)}
                className={`px-2.5 py-1 rounded-lg text-xs font-medium border transition-colors cursor-pointer whitespace-nowrap ${
                  platform === pid
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
              Button Title
            </label>
            <input
              id="new-link-title"
              type="text"
              required
              maxLength={100}
              value={title}
              onChange={(e) => setTitle(e.target.value)}
              placeholder="e.g., Message me on WhatsApp, View Design Portfolio"
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
                placeholder="+1 555 234 5678"
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
                  placeholder="https://wa.me/15552345678"
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
              placeholder={selectedMeta.placeholder}
              className="w-full min-h-[42px] px-3.5 py-2 rounded-xl border border-slate-300 dark:border-slate-700 bg-white dark:bg-slate-950 text-sm text-slate-900 dark:text-white font-mono"
            />
          </div>
        )}

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
            disabled={busy || limitReached}
            className="min-h-[42px] px-5 py-2 rounded-xl bg-indigo-600 hover:bg-indigo-700 text-white text-xs font-semibold inline-flex items-center justify-center gap-2 transition-colors cursor-pointer disabled:opacity-50 whitespace-nowrap"
          >
            <Plus className="w-4 h-4" />
            <span>{limitReached ? 'Plan Link Limit Reached' : 'Add Link to Page'}</span>
          </button>
        </div>
      </form>

      {/* Existing Links List */}
      <div className="space-y-3">
        {links.length === 0 ? (
          <div className="rounded-2xl border border-dashed border-slate-300 dark:border-slate-700 p-10 text-center bg-white dark:bg-slate-900">
            <div className="w-11 h-11 rounded-xl bg-slate-100 dark:bg-slate-800 text-slate-500 flex items-center justify-center mx-auto mb-3">
              <Link2 className="w-5 h-5" />
            </div>
            <h3 className="text-sm font-bold text-slate-900 dark:text-white">No links added yet</h3>
            <p className="mt-1 text-xs text-slate-500 dark:text-slate-400 max-w-sm mx-auto">
              Use the form above to add your website, social channels, WhatsApp inquiry button, or
              portfolio. They will appear immediately in your live preview.
            </p>
          </div>
        ) : (
          links.map((link, idx) => {
            const isEditing = editingId === link.id;
            return (
              <div
                key={link.id}
                className={`rounded-2xl border bg-white dark:bg-slate-900 p-4 sm:p-5 transition-colors ${
                  link.enabled
                    ? 'border-slate-200 dark:border-slate-800'
                    : 'border-slate-200/70 dark:border-slate-800/70 opacity-65'
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
                    <div className="flex items-center justify-end gap-2">
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
                        disabled={busy}
                        onClick={() => handleSaveEdit(link)}
                        className="min-h-[36px] px-3.5 py-1.5 rounded-lg bg-indigo-600 text-white text-xs font-semibold inline-flex items-center gap-1 cursor-pointer"
                      >
                        <Check className="w-3.5 h-3.5" />
                        <span>Save</span>
                      </button>
                    </div>
                  </div>
                ) : (
                  <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4">
                    <div className="flex items-start gap-3.5 min-w-0">
                      <div className="w-10 h-10 rounded-xl bg-slate-100 dark:bg-slate-800 text-slate-700 dark:text-slate-200 flex items-center justify-center shrink-0 mt-0.5">
                        <PlatformIcon platform={link.platform} className="w-4 h-4" />
                      </div>
                      <div className="min-w-0">
                        <h4 className="text-sm font-bold text-slate-900 dark:text-white truncate">
                          {link.title}
                        </h4>
                        <p className="text-xs font-mono text-slate-500 dark:text-slate-400 truncate max-w-md mt-0.5">
                          {link.url}
                        </p>
                        <div className="mt-1.5 flex flex-wrap items-center gap-2 text-xs text-slate-500 dark:text-slate-400 tabular-nums">
                          <span>{link.clicks} clicks</span>
                          <span aria-hidden="true">·</span>
                          <span>{link.enabled ? 'Visible' : 'Hidden'}</span>
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
                        disabled={idx === 0 || busy}
                        onClick={() => handleMove(idx, -1)}
                        aria-label={`Move ${link.title} up`}
                        title="Move up"
                        className="w-9 h-9 rounded-lg border border-slate-200 dark:border-slate-700 flex items-center justify-center text-slate-600 dark:text-slate-300 hover:bg-slate-50 dark:hover:bg-slate-800 disabled:opacity-35 cursor-pointer"
                      >
                        <ArrowUp className="w-4 h-4" />
                      </button>
                      <button
                        type="button"
                        disabled={idx === links.length - 1 || busy}
                        onClick={() => handleMove(idx, 1)}
                        aria-label={`Move ${link.title} down`}
                        title="Move down"
                        className="w-9 h-9 rounded-lg border border-slate-200 dark:border-slate-700 flex items-center justify-center text-slate-600 dark:text-slate-300 hover:bg-slate-50 dark:hover:bg-slate-800 disabled:opacity-35 cursor-pointer"
                      >
                        <ArrowDown className="w-4 h-4" />
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
