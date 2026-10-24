import React, { useEffect, useMemo, useState } from 'react';
import { Link, Navigate, useSearchParams } from 'react-router-dom';
import {
  BarChart3,
  Check,
  CheckCircle2,
  Copy,
  CreditCard,
  ExternalLink,
  Eye,
  FileEdit,
  HelpCircle,
  LayoutDashboard,
  Link2,
  Lock,
  Menu,
  Moon,
  Palette,
  QrCode,
  Save,
  Settings,
  Shield,
  Sliders,
  Smartphone,
  Sun,
  Upload,
  X,
} from 'lucide-react';
import studioCoverPreset from '../assets/images/cover_studio_minimal_1792771609515.jpg';
import sampleCreatorAvatar from '../assets/images/avatar_sample_creator_1792771608665.jpg';
import { BioPageRenderer } from '../components/BioPageRenderer';
import { QrShareModal } from '../components/QrShareModal';
import { AnalyticsPanel } from '../components/dashboard/AnalyticsPanel';
import { LinksManagerPanel } from '../components/dashboard/LinksManagerPanel';
import {
  AccountSettingsPanel,
  HelpAndSupportPanel,
  SubscriptionPanel,
} from '../components/dashboard/SupportAndSettingsPanel';
import { useAuth } from '../context/AuthContext';
import {
  checkUsernameAvailable,
  fetchPublicPlatformContent,
  ProfileUpdateInput,
  saveProfileChanges,
} from '../lib/firestoreService';
import {
  BUILT_IN_THEMES,
  SAFE_FONTS,
  SAFE_GRADIENT_PRESETS,
} from '../lib/themes';
import {
  compressImageToDataUrl,
  normalizeUsername,
  validateUsername,
} from '../lib/validation';
import {
  AvatarShape,
  ButtonShape,
  ButtonStyle,
  FontToken,
  LayoutWidth,
  ThemeId,
} from '../types/linkora';

type DashboardTab =
  | 'overview'
  | 'editor'
  | 'links'
  | 'appearance'
  | 'themes'
  | 'analytics'
  | 'settings'
  | 'subscription'
  | 'support';

const NAV_ITEMS: { id: DashboardTab; label: string; icon: React.FC<{ className?: string }> }[] = [
  { id: 'overview', label: 'Overview', icon: LayoutDashboard },
  { id: 'editor', label: 'My Bio Page', icon: FileEdit },
  { id: 'links', label: 'Manage Links', icon: Link2 },
  { id: 'appearance', label: 'Appearance', icon: Sliders },
  { id: 'themes', label: 'Themes', icon: Palette },
  { id: 'analytics', label: 'Analytics', icon: BarChart3 },
  { id: 'settings', label: 'Account Settings', icon: Settings },
  { id: 'subscription', label: 'Subscription & Upgrade', icon: CreditCard },
  { id: 'support', label: 'Help & Support', icon: HelpCircle },
];

export const DashboardPage: React.FC = () => {
  const {
    firebaseUser,
    account,
    profile,
    subscription,
    links,
    isAdmin,
    loading,
    needsEmailVerification,
    sendPasswordReset,
    refreshUserData,
    logout,
  } = useAuth();

  const [searchParams, setSearchParams] = useSearchParams();
  const initialTab = (searchParams.get('tab') as DashboardTab) || 'overview';
  const [activeTab, setActiveTab] = useState<DashboardTab>(
    NAV_ITEMS.some((i) => i.id === initialTab) ? initialTab : 'overview'
  );

  const [darkMode, setDarkMode] = useState<boolean>(() => {
    try {
      return localStorage.getItem('linkora_dash_dark') === '1';
    } catch {
      return false;
    }
  });

  const [mobileNavOpen, setMobileNavOpen] = useState(false);
  const [mobilePreviewOpen, setMobilePreviewOpen] = useState(false);
  const [qrOpen, setQrOpen] = useState(false);
  const [copiedUrl, setCopiedUrl] = useState(false);
  const [disabledThemes, setDisabledThemes] = useState<ThemeId[]>([]);
  const [premiumPriceMonthly, setPremiumPriceMonthly] = useState<number>(9);

  // Draft Editor & Appearance State (synced with profile and immediately reflected in live preview)
  const [draft, setDraft] = useState<ProfileUpdateInput | null>(null);
  const [slugStatus, setSlugStatus] = useState<'idle' | 'checking' | 'available' | 'taken'>('idle');
  const [slugReason, setSlugReason] = useState('');
  const [saving, setSaving] = useState(false);
  const [saveSuccess, setSaveSuccess] = useState('');
  const [saveError, setSaveError] = useState('');

  useEffect(() => {
    document.title = 'Dashboard – Linkora';
    fetchPublicPlatformContent().then((res) => {
      setDisabledThemes(res.settings.disabledThemes || []);
      if (res.settings.premiumPriceMonthly) {
        setPremiumPriceMonthly(res.settings.premiumPriceMonthly);
      }
    });
  }, []);

  useEffect(() => {
    try {
      localStorage.setItem('linkora_dash_dark', darkMode ? '1' : '0');
    } catch {
      // Ignore storage error
    }
  }, [darkMode]);

  // Populate draft whenever profile loads initially
  useEffect(() => {
    if (!profile) return;
    setDraft((prev) => {
      if (prev) return prev;
      const claimParam = searchParams.get('claim');
      const themeParam = searchParams.get('theme') as ThemeId | null;
      return {
        username: claimParam ? normalizeUsername(claimParam) : profile.username,
        displayName: profile.displayName,
        bio: profile.bio,
        avatarUrl: profile.avatarUrl,
        backgroundImageUrl: profile.backgroundImageUrl,
        themeId:
          themeParam && BUILT_IN_THEMES.some((t) => t.id === themeParam)
            ? themeParam
            : profile.themeId,
        customBgColor: profile.customBgColor,
        customBgGradient: profile.customBgGradient,
        customButtonColor: profile.customButtonColor,
        customTextColor: profile.customTextColor,
        buttonShape: profile.buttonShape,
        buttonStyle: profile.buttonStyle,
        fontFamily: profile.fontFamily,
        avatarShape: profile.avatarShape,
        layoutWidth: profile.layoutWidth,
        ctaLabel: profile.ctaLabel,
        ctaUrl: profile.ctaUrl,
        seoTitle: profile.seoTitle,
        seoDescription: profile.seoDescription,
        isPublished: profile.isPublished,
      };
    });
  }, [profile, searchParams]);

  const selectTab = (tab: DashboardTab) => {
    setActiveTab(tab);
    setMobileNavOpen(false);
    setSaveError('');
    setSaveSuccess('');
    setSearchParams(tab === 'overview' ? {} : { tab });
  };

  // Live username availability check
  useEffect(() => {
    if (!draft || !profile) return;
    const normalized = normalizeUsername(draft.username);
    if (normalized === profile.username) {
      setSlugStatus('available');
      setSlugReason('Current reserved username');
      return;
    }
    const localCheck = validateUsername(normalized);
    if (!localCheck.valid) {
      setSlugStatus('taken');
      setSlugReason(localCheck.error || 'Invalid username');
      return;
    }
    setSlugStatus('checking');
    const timer = setTimeout(async () => {
      const res = await checkUsernameAvailable(normalized, profile.uid);
      if (res.available) {
        setSlugStatus('available');
        setSlugReason(`@${normalized} is available`);
      } else {
        setSlugStatus('taken');
        setSlugReason(res.reason || 'Unavailable');
      }
    }, 350);
    return () => clearTimeout(timer);
  }, [draft?.username, profile]);

  const hasUnsavedChanges = useMemo(() => {
    if (!draft || !profile) return false;
    return (
      draft.username !== profile.username ||
      draft.displayName !== profile.displayName ||
      draft.bio !== profile.bio ||
      draft.avatarUrl !== profile.avatarUrl ||
      draft.backgroundImageUrl !== profile.backgroundImageUrl ||
      draft.themeId !== profile.themeId ||
      draft.customBgColor !== profile.customBgColor ||
      draft.customBgGradient !== profile.customBgGradient ||
      draft.customButtonColor !== profile.customButtonColor ||
      draft.customTextColor !== profile.customTextColor ||
      draft.buttonShape !== profile.buttonShape ||
      draft.buttonStyle !== profile.buttonStyle ||
      draft.fontFamily !== profile.fontFamily ||
      draft.avatarShape !== profile.avatarShape ||
      draft.layoutWidth !== profile.layoutWidth ||
      draft.ctaLabel !== profile.ctaLabel ||
      draft.ctaUrl !== profile.ctaUrl ||
      draft.seoTitle !== profile.seoTitle ||
      draft.seoDescription !== profile.seoDescription ||
      draft.isPublished !== profile.isPublished
    );
  }, [draft, profile]);

  if (loading) {
    return (
      <div className="min-h-screen bg-slate-50 flex items-center justify-center p-6">
        <div className="text-center space-y-3">
          <div className="w-10 h-10 rounded-full border-2 border-indigo-600 border-t-transparent animate-spin mx-auto" />
          <p className="text-xs font-medium text-slate-500">Loading your Linkora workspace...</p>
        </div>
      </div>
    );
  }

  if (!firebaseUser || needsEmailVerification) {
    return <Navigate to="/login" replace />;
  }

  if (!account || !profile || !draft) {
    return (
      <div className="min-h-screen bg-slate-50 flex items-center justify-center p-6">
        <p className="text-sm text-slate-600">Preparing your profile...</p>
      </div>
    );
  }

  if (account.status === 'suspended') {
    return (
      <div className="min-h-screen bg-slate-50 flex items-center justify-center p-6">
        <div className="max-w-md w-full bg-white border border-red-200 rounded-2xl p-7 text-center space-y-4">
          <h1 className="text-lg font-bold text-slate-900">Account Suspended</h1>
          <p className="text-xs text-slate-600 leading-relaxed">
            Your Linkora account has been suspended by a platform moderator. Your public page is
            currently offline.
          </p>
          <button
            type="button"
            onClick={() => logout()}
            className="min-h-[40px] px-4 py-2 rounded-xl bg-slate-900 text-white text-xs font-semibold cursor-pointer"
          >
            Sign Out
          </button>
        </div>
      </div>
    );
  }

  const plan = account.plan;
  const publicUrl = `${window.location.origin}/${profile.username}`;
  const activeLinksCount = links.filter((l) => l.enabled).length;

  const handleCopyPublicUrl = async () => {
    try {
      await navigator.clipboard.writeText(publicUrl);
      setCopiedUrl(true);
      setTimeout(() => setCopiedUrl(false), 2000);
    } catch {
      // Ignore clipboard failure
    }
  };

  const handleSaveDraft = async (overridePublished?: boolean) => {
    setSaveError('');
    setSaveSuccess('');

    const selectedThemeMeta = BUILT_IN_THEMES.find((t) => t.id === draft.themeId);
    if (plan === 'free' && selectedThemeMeta?.tier === 'premium') {
      setSaveError(
        `"${selectedThemeMeta.name}" is a Premium theme. Choose one of the 5 Free themes to save, or upgrade to Premium.`
      );
      return;
    }

    setSaving(true);
    try {
      const nextPayload: ProfileUpdateInput = {
        ...draft,
        isPublished: overridePublished !== undefined ? overridePublished : draft.isPublished,
      };
      await saveProfileChanges(account.uid, profile, nextPayload, links, plan);
      setDraft(nextPayload);
      await refreshUserData();
      setSaveSuccess(
        overridePublished !== undefined
          ? overridePublished
            ? 'Bio page published live!'
            : 'Bio page unpublished.'
          : 'All changes saved.'
      );
      setTimeout(() => setSaveSuccess(''), 3500);
    } catch (err) {
      setSaveError(err instanceof Error ? err.message : 'Could not save changes.');
    } finally {
      setSaving(false);
    }
  };

  const handleImageUpload = async (
    e: React.ChangeEvent<HTMLInputElement>,
    field: 'avatarUrl' | 'backgroundImageUrl'
  ) => {
    const file = e.target.files?.[0];
    if (!file) return;
    setSaveError('');
    try {
      const dataUrl = await compressImageToDataUrl(
        file,
        field === 'avatarUrl' ? 360 : 960,
        field === 'avatarUrl' ? 110_000 : 165_000
      );
      setDraft((prev) => (prev ? { ...prev, [field]: dataUrl } : prev));
    } catch (err) {
      setSaveError(err instanceof Error ? err.message : 'Image upload failed.');
    } finally {
      e.target.value = '';
    }
  };

  const showSidePreview = ['editor', 'links', 'appearance', 'themes'].includes(activeTab);

  return (
    <div className={darkMode ? 'dark' : ''}>
      <div className="min-h-screen bg-slate-50 dark:bg-slate-950 text-slate-900 dark:text-slate-100 flex">
        {/* Desktop Sidebar */}
        <aside className="hidden lg:flex w-64 shrink-0 flex-col justify-between border-r border-slate-200 dark:border-slate-800 bg-white dark:bg-slate-900 sticky top-0 h-screen">
          <div className="p-5 overflow-y-auto">
            <div className="flex items-center justify-between mb-6 px-2">
              <Link
                to="/"
                className="text-lg font-bold tracking-tight text-slate-950 dark:text-white"
              >
                Linkora
              </Link>
              <span className="text-[11px] font-mono text-slate-500 capitalize">{plan}</span>
            </div>

            <nav aria-label="Dashboard sections" className="space-y-1">
              {NAV_ITEMS.map((item) => {
                const Icon = item.icon;
                const active = activeTab === item.id;
                return (
                  <button
                    key={item.id}
                    type="button"
                    onClick={() => selectTab(item.id)}
                    className={`w-full min-h-[40px] px-3 py-2 rounded-xl text-xs font-semibold flex items-center gap-3 transition-colors cursor-pointer whitespace-nowrap ${
                      active
                        ? 'bg-indigo-50 text-indigo-700 dark:bg-indigo-950/70 dark:text-indigo-300'
                        : 'text-slate-600 dark:text-slate-400 hover:bg-slate-100 dark:hover:bg-slate-800 hover:text-slate-900 dark:hover:text-white'
                    }`}
                  >
                    <Icon className="w-4 h-4 shrink-0" />
                    <span className="truncate">{item.label}</span>
                  </button>
                );
              })}

              {isAdmin && (
                <div className="pt-4 mt-4 border-t border-slate-200 dark:border-slate-800">
                  <Link
                    to="/admin"
                    className="w-full min-h-[40px] px-3 py-2 rounded-xl text-xs font-semibold flex items-center gap-3 text-amber-700 dark:text-amber-400 hover:bg-amber-50 dark:hover:bg-amber-950/40 transition-colors"
                  >
                    <Shield className="w-4 h-4 shrink-0" />
                    <span>Admin Console</span>
                  </Link>
                </div>
              )}
            </nav>
          </div>

          <div className="p-4 border-t border-slate-200 dark:border-slate-800 flex items-center justify-between gap-2">
            <div className="min-w-0">
              <p className="text-xs font-bold text-slate-900 dark:text-white truncate">
                {profile.displayName}
              </p>
              <p className="text-[11px] font-mono text-slate-500 truncate">@{profile.username}</p>
            </div>
            <button
              type="button"
              onClick={() => setDarkMode((d) => !d)}
              aria-label="Toggle light and dark dashboard mode"
              className="w-9 h-9 rounded-lg border border-slate-200 dark:border-slate-700 flex items-center justify-center text-slate-600 dark:text-slate-300 hover:bg-slate-100 dark:hover:bg-slate-800 cursor-pointer shrink-0"
            >
              {darkMode ? <Sun className="w-4 h-4" /> : <Moon className="w-4 h-4" />}
            </button>
          </div>
        </aside>

        {/* Main Workspace Column */}
        <div className="flex-1 min-w-0 flex flex-col">
          {/* Top Workspace Bar */}
          <header className="sticky top-0 z-30 h-15 bg-white/95 dark:bg-slate-900/95 backdrop-blur-md border-b border-slate-200 dark:border-slate-800 px-4 sm:px-6 flex items-center justify-between gap-4">
            <div className="flex items-center gap-3 min-w-0">
              <button
                type="button"
                onClick={() => setMobileNavOpen(true)}
                aria-label="Open dashboard menu"
                className="lg:hidden w-9 h-9 rounded-lg border border-slate-200 dark:border-slate-700 flex items-center justify-center text-slate-700 dark:text-slate-200 cursor-pointer shrink-0"
              >
                <Menu className="w-4 h-4" />
              </button>
              <div className="flex items-center gap-2 text-xs sm:text-sm font-medium text-slate-500 dark:text-slate-400 truncate">
                <span className="hidden sm:inline">Workspace</span>
                <span className="hidden sm:inline" aria-hidden="true">
                  /
                </span>
                <span className="font-bold text-slate-900 dark:text-white truncate">
                  {NAV_ITEMS.find((i) => i.id === activeTab)?.label}
                </span>
              </div>
            </div>

            {/* Right Action Cluster: View My Page + QR/Copy + Mobile Preview */}
            <div className="flex items-center gap-2 shrink-0">
              {showSidePreview && (
                <button
                  type="button"
                  onClick={() => setMobilePreviewOpen(true)}
                  className="xl:hidden min-h-[38px] px-3 py-1.5 rounded-lg border border-slate-200 dark:border-slate-700 text-xs font-semibold text-slate-700 dark:text-slate-200 inline-flex items-center gap-1.5 cursor-pointer whitespace-nowrap"
                >
                  <Smartphone className="w-3.5 h-3.5" />
                  <span>Preview</span>
                </button>
              )}

              <button
                type="button"
                onClick={() => setQrOpen(true)}
                aria-label="Share and QR Code"
                className="min-h-[38px] px-3 py-1.5 rounded-lg border border-slate-200 dark:border-slate-700 text-xs font-semibold text-slate-700 dark:text-slate-200 hover:bg-slate-50 dark:hover:bg-slate-800 inline-flex items-center gap-1.5 cursor-pointer whitespace-nowrap"
              >
                <QrCode className="w-3.5 h-3.5" />
                <span className="hidden sm:inline">Share / QR</span>
              </button>

              <Link
                to={`/${profile.username}`}
                className="min-h-[38px] px-3.5 py-1.5 rounded-lg bg-indigo-600 hover:bg-indigo-700 text-white text-xs font-semibold inline-flex items-center gap-1.5 transition-colors whitespace-nowrap shrink-0"
              >
                <span>View My Page</span>
                <ExternalLink className="w-3.5 h-3.5" />
              </Link>
            </div>
          </header>

          {/* Mobile Drawer Navigation */}
          {mobileNavOpen && (
            <div className="fixed inset-0 z-50 lg:hidden flex">
              <div
                className="fixed inset-0 bg-slate-950/60"
                onClick={() => setMobileNavOpen(false)}
              />
              <div className="relative z-10 w-72 max-w-[85vw] bg-white dark:bg-slate-900 h-full p-5 flex flex-col justify-between overflow-y-auto">
                <div>
                  <div className="flex items-center justify-between mb-6">
                    <span className="text-lg font-bold text-slate-950 dark:text-white">Linkora</span>
                    <button
                      type="button"
                      onClick={() => setMobileNavOpen(false)}
                      aria-label="Close menu"
                      className="w-8 h-8 rounded-lg flex items-center justify-center text-slate-500 cursor-pointer"
                    >
                      <X className="w-4 h-4" />
                    </button>
                  </div>
                  <div className="space-y-1">
                    {NAV_ITEMS.map((item) => {
                      const Icon = item.icon;
                      const active = activeTab === item.id;
                      return (
                        <button
                          key={item.id}
                          type="button"
                          onClick={() => selectTab(item.id)}
                          className={`w-full min-h-[42px] px-3 py-2 rounded-xl text-xs font-semibold flex items-center gap-3 cursor-pointer ${
                            active
                              ? 'bg-indigo-50 text-indigo-700 dark:bg-indigo-950/70 dark:text-indigo-300'
                              : 'text-slate-600 dark:text-slate-300'
                          }`}
                        >
                          <Icon className="w-4 h-4 shrink-0" />
                          <span>{item.label}</span>
                        </button>
                      );
                    })}
                    {isAdmin && (
                      <Link
                        to="/admin"
                        className="w-full min-h-[42px] px-3 py-2 rounded-xl text-xs font-semibold flex items-center gap-3 text-amber-700 dark:text-amber-400"
                      >
                        <Shield className="w-4 h-4 shrink-0" />
                        <span>Admin Console</span>
                      </Link>
                    )}
                  </div>
                </div>

                <div className="pt-4 border-t border-slate-200 dark:border-slate-800 flex items-center justify-between">
                  <span className="text-xs text-slate-500">Theme Mode</span>
                  <button
                    type="button"
                    onClick={() => setDarkMode((d) => !d)}
                    className="px-3 py-1.5 rounded-lg border border-slate-200 dark:border-slate-700 text-xs font-semibold inline-flex items-center gap-1.5 cursor-pointer"
                  >
                    {darkMode ? <Sun className="w-3.5 h-3.5" /> : <Moon className="w-3.5 h-3.5" />}
                    <span>{darkMode ? 'Light' : 'Dark'}</span>
                  </button>
                </div>
              </div>
            </div>
          )}

          {/* Save Status Banner */}
          {(saveSuccess || saveError || hasUnsavedChanges) && showSidePreview && (
            <div className="border-b border-slate-200 dark:border-slate-800 bg-white dark:bg-slate-900 px-4 sm:px-6 py-2.5 flex flex-wrap items-center justify-between gap-3">
              <div className="text-xs">
                {saveError ? (
                  <span className="text-red-600 dark:text-red-400 font-medium">{saveError}</span>
                ) : saveSuccess ? (
                  <span className="text-emerald-700 dark:text-emerald-400 font-medium inline-flex items-center gap-1.5">
                    <CheckCircle2 className="w-4 h-4" />
                    {saveSuccess}
                  </span>
                ) : (
                  <span className="text-slate-600 dark:text-slate-300">
                    You have unsaved changes in your live preview.
                  </span>
                )}
              </div>

              <div className="flex items-center gap-2">
                <button
                  type="button"
                  disabled={saving || slugStatus === 'taken'}
                  onClick={() => handleSaveDraft()}
                  className="min-h-[36px] px-4 py-1.5 rounded-lg bg-indigo-600 hover:bg-indigo-700 text-white text-xs font-semibold inline-flex items-center gap-1.5 cursor-pointer disabled:opacity-50 whitespace-nowrap"
                >
                  <Save className="w-3.5 h-3.5" />
                  <span>{saving ? 'Saving...' : 'Save Changes'}</span>
                </button>
              </div>
            </div>
          )}

          {/* Content Body + Side-by-Side Live Preview */}
          <div className="flex-1 max-w-7xl w-full mx-auto p-4 sm:p-6 lg:p-8 flex gap-8 items-start">
            <div className="flex-1 min-w-0">
              {/* 1. OVERVIEW */}
              {activeTab === 'overview' && (
                <div className="space-y-6">
                  {/* Public URL Bar */}
                  <div className="rounded-2xl border border-slate-200 dark:border-slate-800 bg-white dark:bg-slate-900 p-6 flex flex-col sm:flex-row sm:items-center justify-between gap-4">
                    <div className="min-w-0">
                      <p className="text-xs text-slate-500 dark:text-slate-400">
                        Your Unique Public URL ·{' '}
                        <span className="font-semibold text-slate-800 dark:text-slate-200">
                          {profile.isPublished ? 'Published Live' : 'Unpublished Draft'}
                        </span>
                      </p>
                      <p className="mt-1 text-base sm:text-lg font-mono font-bold text-slate-900 dark:text-white truncate">
                        {publicUrl}
                      </p>
                    </div>
                    <div className="flex flex-wrap items-center gap-2 shrink-0">
                      <button
                        type="button"
                        onClick={handleCopyPublicUrl}
                        className="min-h-[40px] px-4 py-2 rounded-xl bg-slate-900 dark:bg-white text-white dark:text-slate-950 text-xs font-semibold inline-flex items-center gap-1.5 cursor-pointer whitespace-nowrap"
                      >
                        {copiedUrl ? <Check className="w-3.5 h-3.5" /> : <Copy className="w-3.5 h-3.5" />}
                        <span>{copiedUrl ? 'Copied URL' : 'Copy URL'}</span>
                      </button>
                      <button
                        type="button"
                        onClick={() => setQrOpen(true)}
                        className="min-h-[40px] px-4 py-2 rounded-xl border border-slate-200 dark:border-slate-700 text-xs font-semibold text-slate-700 dark:text-slate-200 hover:bg-slate-50 dark:hover:bg-slate-800 inline-flex items-center gap-1.5 cursor-pointer whitespace-nowrap"
                      >
                        <QrCode className="w-3.5 h-3.5" />
                        <span>QR Code</span>
                      </button>
                    </div>
                  </div>

                  {/* Core Metrics Strip */}
                  <div className="grid grid-cols-2 lg:grid-cols-4 gap-4">
                    <div className="rounded-2xl border border-slate-200 dark:border-slate-800 bg-white dark:bg-slate-900 p-5">
                      <p className="text-xs text-slate-500 dark:text-slate-400">Total Page Views</p>
                      <p className="mt-2 text-2xl font-bold font-mono tabular-nums text-slate-900 dark:text-white">
                        {profile.totalViews.toLocaleString()}
                      </p>
                    </div>
                    <div className="rounded-2xl border border-slate-200 dark:border-slate-800 bg-white dark:bg-slate-900 p-5">
                      <p className="text-xs text-slate-500 dark:text-slate-400">Total Link Clicks</p>
                      <p className="mt-2 text-2xl font-bold font-mono tabular-nums text-slate-900 dark:text-white">
                        {profile.totalClicks.toLocaleString()}
                      </p>
                    </div>
                    <div className="rounded-2xl border border-slate-200 dark:border-slate-800 bg-white dark:bg-slate-900 p-5">
                      <p className="text-xs text-slate-500 dark:text-slate-400">Active Links</p>
                      <p className="mt-2 text-2xl font-bold font-mono tabular-nums text-slate-900 dark:text-white">
                        {activeLinksCount}{' '}
                        <span className="text-xs font-normal text-slate-400">
                          / {plan === 'premium' ? 50 : 10}
                        </span>
                      </p>
                    </div>
                    <div className="rounded-2xl border border-slate-200 dark:border-slate-800 bg-white dark:bg-slate-900 p-5">
                      <p className="text-xs text-slate-500 dark:text-slate-400">Page Status</p>
                      <p className="mt-2 text-lg font-bold text-slate-900 dark:text-white">
                        {profile.isPublished ? 'Published' : 'Unpublished'}
                      </p>
                    </div>
                  </div>

                  {/* Quick Actions Grid */}
                  <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
                    <button
                      type="button"
                      onClick={() => selectTab('editor')}
                      className="rounded-2xl border border-slate-200 dark:border-slate-800 bg-white dark:bg-slate-900 p-5 text-left hover:border-indigo-500 transition-colors cursor-pointer"
                    >
                      <FileEdit className="w-5 h-5 text-indigo-600 mb-3" />
                      <h3 className="text-sm font-bold text-slate-900 dark:text-white">
                        Edit Profile &amp; Bio
                      </h3>
                      <p className="mt-1 text-xs text-slate-500 dark:text-slate-400">
                        Update your photo, username slug, bio text, and featured CTA button.
                      </p>
                    </button>

                    <button
                      type="button"
                      onClick={() => selectTab('links')}
                      className="rounded-2xl border border-slate-200 dark:border-slate-800 bg-white dark:bg-slate-900 p-5 text-left hover:border-indigo-500 transition-colors cursor-pointer"
                    >
                      <Link2 className="w-5 h-5 text-indigo-600 mb-3" />
                      <h3 className="text-sm font-bold text-slate-900 dark:text-white">
                        Manage Destination Links
                      </h3>
                      <p className="mt-1 text-xs text-slate-500 dark:text-slate-400">
                        Add WhatsApp, YouTube, Instagram, portfolio, or store links.
                      </p>
                    </button>

                    <button
                      type="button"
                      onClick={() => selectTab('themes')}
                      className="rounded-2xl border border-slate-200 dark:border-slate-800 bg-white dark:bg-slate-900 p-5 text-left hover:border-indigo-500 transition-colors cursor-pointer"
                    >
                      <Palette className="w-5 h-5 text-indigo-600 mb-3" />
                      <h3 className="text-sm font-bold text-slate-900 dark:text-white">
                        Customize Theme &amp; Colors
                      </h3>
                      <p className="mt-1 text-xs text-slate-500 dark:text-slate-400">
                        Switch among 8 curated themes, button shapes, and typography.
                      </p>
                    </button>
                  </div>
                </div>
              )}

              {/* 2. MY BIO PAGE EDITOR */}
              {activeTab === 'editor' && (
                <div className="space-y-6">
                  {/* Publish Status Card */}
                  <div className="rounded-2xl border border-slate-200 dark:border-slate-800 bg-white dark:bg-slate-900 p-6 flex flex-col sm:flex-row sm:items-center justify-between gap-4">
                    <div>
                      <h2 className="text-base font-bold text-slate-900 dark:text-white">
                        Publishing Status: {draft.isPublished ? 'Published Live' : 'Unpublished'}
                      </h2>
                      <p className="text-xs text-slate-500 dark:text-slate-400 mt-0.5">
                        {draft.isPublished
                          ? 'Anyone visiting your Linkora URL can view your active links.'
                          : 'Your page is hidden from the public while keeping your username reserved.'}
                      </p>
                    </div>
                    <button
                      type="button"
                      disabled={saving}
                      onClick={() => handleSaveDraft(!draft.isPublished)}
                      className={`min-h-[40px] px-4 py-2 rounded-xl text-xs font-semibold cursor-pointer whitespace-nowrap shrink-0 ${
                        draft.isPublished
                          ? 'border border-slate-300 dark:border-slate-700 text-slate-700 dark:text-slate-200 hover:bg-slate-50 dark:hover:bg-slate-800'
                          : 'bg-emerald-600 hover:bg-emerald-700 text-white'
                      }`}
                    >
                      {draft.isPublished ? 'Unpublish Page' : 'Publish Page Now'}
                    </button>
                  </div>

                  {/* Profile Identity & Photos */}
                  <div className="rounded-2xl border border-slate-200 dark:border-slate-800 bg-white dark:bg-slate-900 p-6 space-y-5">
                    <h3 className="text-sm font-bold text-slate-900 dark:text-white">
                      Profile Identity &amp; Media
                    </h3>

                    {/* Avatar Upload */}
                    <div className="flex flex-col sm:flex-row sm:items-center gap-4">
                      <div className="w-20 h-20 rounded-2xl overflow-hidden bg-slate-100 dark:bg-slate-800 border border-slate-200 dark:border-slate-700 flex items-center justify-center shrink-0">
                        {draft.avatarUrl ? (
                          <img
                            src={draft.avatarUrl}
                            alt="Profile avatar preview"
                            referrerPolicy="no-referrer"
                            className="w-full h-full object-cover"
                          />
                        ) : (
                          <span className="text-xs text-slate-400">No Photo</span>
                        )}
                      </div>

                      <div className="space-y-2">
                        <div className="flex flex-wrap items-center gap-2">
                          <label className="min-h-[38px] px-3.5 py-2 rounded-xl bg-slate-900 dark:bg-white text-white dark:text-slate-950 text-xs font-semibold inline-flex items-center gap-1.5 cursor-pointer">
                            <Upload className="w-3.5 h-3.5" />
                            <span>Upload Photo</span>
                            <input
                              type="file"
                              accept="image/png,image/jpeg,image/webp"
                              onChange={(e) => handleImageUpload(e, 'avatarUrl')}
                              className="hidden"
                            />
                          </label>
                          <button
                            type="button"
                            onClick={() =>
                              setDraft((p) => (p ? { ...p, avatarUrl: sampleCreatorAvatar } : p))
                            }
                            className="min-h-[38px] px-3 py-2 rounded-xl border border-slate-200 dark:border-slate-700 text-xs font-semibold text-slate-700 dark:text-slate-300 cursor-pointer"
                          >
                            Use Sample Portrait
                          </button>
                          {draft.avatarUrl && (
                            <button
                              type="button"
                              onClick={() => setDraft((p) => (p ? { ...p, avatarUrl: '' } : p))}
                              className="min-h-[38px] px-3 py-2 rounded-xl text-xs font-semibold text-red-600 cursor-pointer"
                            >
                              Remove
                            </button>
                          )}
                        </div>
                        <p className="text-[11px] text-slate-500">
                          JPG, PNG, or WebP. Automatically resized and optimized in your browser.
                        </p>
                      </div>
                    </div>

                    {/* Username & Display Name */}
                    <div className="grid grid-cols-1 sm:grid-cols-2 gap-4 pt-2">
                      <div>
                        <label
                          htmlFor="ed-username"
                          className="block text-xs font-semibold text-slate-700 dark:text-slate-300 mb-1.5"
                        >
                          Unique Public Username
                        </label>
                        <div className="flex items-center rounded-xl border border-slate-300 dark:border-slate-700 bg-slate-50 dark:bg-slate-950 px-3 min-h-[42px]">
                          <span className="text-xs font-mono text-slate-400 select-none">/</span>
                          <input
                            id="ed-username"
                            type="text"
                            maxLength={30}
                            value={draft.username}
                            onChange={(e) =>
                              setDraft((p) =>
                                p ? { ...p, username: normalizeUsername(e.target.value) } : p
                              )
                            }
                            className="w-full bg-transparent text-sm font-mono text-slate-900 dark:text-white focus:outline-none pl-1"
                          />
                        </div>
                        <p
                          className={`mt-1 text-[11px] ${
                            slugStatus === 'taken'
                              ? 'text-red-600'
                              : slugStatus === 'available'
                              ? 'text-emerald-600 dark:text-emerald-400'
                              : 'text-slate-500'
                          }`}
                        >
                          {slugStatus === 'checking' ? 'Checking availability...' : slugReason}
                        </p>
                      </div>

                      <div>
                        <label
                          htmlFor="ed-displayname"
                          className="block text-xs font-semibold text-slate-700 dark:text-slate-300 mb-1.5"
                        >
                          Display Name
                        </label>
                        <input
                          id="ed-displayname"
                          type="text"
                          maxLength={80}
                          value={draft.displayName}
                          onChange={(e) =>
                            setDraft((p) => (p ? { ...p, displayName: e.target.value } : p))
                          }
                          placeholder="Your Name or Brand"
                          className="w-full min-h-[42px] px-3.5 py-2 rounded-xl border border-slate-300 dark:border-slate-700 bg-white dark:bg-slate-950 text-sm text-slate-900 dark:text-white"
                        />
                      </div>
                    </div>

                    {/* Bio */}
                    <div>
                      <div className="flex items-center justify-between mb-1.5">
                        <label
                          htmlFor="ed-bio"
                          className="text-xs font-semibold text-slate-700 dark:text-slate-300"
                        >
                          Short Bio
                        </label>
                        <span className="text-[11px] font-mono text-slate-400 tabular-nums">
                          {draft.bio.length}/280
                        </span>
                      </div>
                      <textarea
                        id="ed-bio"
                        rows={3}
                        maxLength={280}
                        value={draft.bio}
                        onChange={(e) => setDraft((p) => (p ? { ...p, bio: e.target.value } : p))}
                        placeholder="Tell visitors what you create, offer, or share..."
                        className="w-full p-3.5 rounded-xl border border-slate-300 dark:border-slate-700 bg-white dark:bg-slate-950 text-sm text-slate-900 dark:text-white"
                      />
                    </div>

                    {/* Optional Background Image */}
                    <div className="pt-2 border-t border-slate-100 dark:border-slate-800">
                      <p className="text-xs font-semibold text-slate-700 dark:text-slate-300 mb-2">
                        Optional Page Background Image
                      </p>
                      <div className="flex flex-wrap items-center gap-2">
                        <label className="min-h-[38px] px-3.5 py-2 rounded-xl border border-slate-300 dark:border-slate-700 text-xs font-semibold text-slate-700 dark:text-slate-200 inline-flex items-center gap-1.5 cursor-pointer">
                          <Upload className="w-3.5 h-3.5" />
                          <span>Upload Cover Image</span>
                          <input
                            type="file"
                            accept="image/png,image/jpeg,image/webp"
                            onChange={(e) => handleImageUpload(e, 'backgroundImageUrl')}
                            className="hidden"
                          />
                        </label>
                        <button
                          type="button"
                          onClick={() =>
                            setDraft((p) =>
                              p ? { ...p, backgroundImageUrl: studioCoverPreset } : p
                            )
                          }
                          className="min-h-[38px] px-3 py-2 rounded-xl border border-slate-200 dark:border-slate-700 text-xs font-semibold text-slate-600 dark:text-slate-300 cursor-pointer"
                        >
                          Use Minimal Studio Backdrop
                        </button>
                        {draft.backgroundImageUrl && (
                          <button
                            type="button"
                            onClick={() =>
                              setDraft((p) => (p ? { ...p, backgroundImageUrl: '' } : p))
                            }
                            className="min-h-[38px] px-3 py-2 rounded-xl text-xs font-semibold text-red-600 cursor-pointer"
                          >
                            Clear Background Image
                          </button>
                        )}
                      </div>
                    </div>
                  </div>

                  {/* Custom Featured Call-To-Action Button */}
                  <div className="rounded-2xl border border-slate-200 dark:border-slate-800 bg-white dark:bg-slate-900 p-6 space-y-4">
                    <div>
                      <h3 className="text-sm font-bold text-slate-900 dark:text-white">
                        Featured Call-to-Action Button (Optional)
                      </h3>
                      <p className="text-xs text-slate-500 dark:text-slate-400 mt-0.5">
                        Pinned prominently above your link stack for bookings, launches, or lead
                        inquiries.
                      </p>
                    </div>
                    <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                      <div>
                        <label
                          htmlFor="ed-cta-label"
                          className="block text-xs font-semibold text-slate-700 dark:text-slate-300 mb-1"
                        >
                          CTA Button Label
                        </label>
                        <input
                          id="ed-cta-label"
                          type="text"
                          maxLength={60}
                          value={draft.ctaLabel}
                          onChange={(e) =>
                            setDraft((p) => (p ? { ...p, ctaLabel: e.target.value } : p))
                          }
                          placeholder="e.g., Book a Free Discovery Call"
                          className="w-full min-h-[42px] px-3.5 py-2 rounded-xl border border-slate-300 dark:border-slate-700 bg-white dark:bg-slate-950 text-sm text-slate-900 dark:text-white"
                        />
                      </div>
                      <div>
                        <label
                          htmlFor="ed-cta-url"
                          className="block text-xs font-semibold text-slate-700 dark:text-slate-300 mb-1"
                        >
                          CTA Destination URL
                        </label>
                        <input
                          id="ed-cta-url"
                          type="text"
                          maxLength={500}
                          value={draft.ctaUrl}
                          onChange={(e) =>
                            setDraft((p) => (p ? { ...p, ctaUrl: e.target.value } : p))
                          }
                          placeholder="https://cal.com/yourname"
                          className="w-full min-h-[42px] px-3.5 py-2 rounded-xl border border-slate-300 dark:border-slate-700 bg-white dark:bg-slate-950 text-sm font-mono text-slate-900 dark:text-white"
                        />
                      </div>
                    </div>
                  </div>

                  <div className="flex justify-end">
                    <button
                      type="button"
                      disabled={saving || slugStatus === 'taken'}
                      onClick={() => handleSaveDraft()}
                      className="min-h-[44px] px-6 py-2.5 rounded-xl bg-indigo-600 hover:bg-indigo-700 text-white text-sm font-semibold inline-flex items-center gap-2 cursor-pointer disabled:opacity-50"
                    >
                      <Save className="w-4 h-4" />
                      <span>{saving ? 'Saving Profile...' : 'Save Bio Page'}</span>
                    </button>
                  </div>
                </div>
              )}

              {/* 3. MANAGE LINKS */}
              {activeTab === 'links' && (
                <LinksManagerPanel
                  uid={account.uid}
                  profile={profile}
                  links={links}
                  plan={plan}
                  onRefresh={refreshUserData}
                />
              )}

              {/* 4. APPEARANCE CUSTOMIZER */}
              {activeTab === 'appearance' && (
                <div className="space-y-6">
                  {/* Colors & Gradient */}
                  <div className="rounded-2xl border border-slate-200 dark:border-slate-800 bg-white dark:bg-slate-900 p-6 space-y-5">
                    <div className="flex items-center justify-between gap-2">
                      <div>
                        <h2 className="text-base font-bold text-slate-900 dark:text-white">
                          Colors &amp; Background Gradient
                        </h2>
                        <p className="text-xs text-slate-500 dark:text-slate-400 mt-0.5">
                          Override your base theme colors or reset to use the selected theme defaults.
                        </p>
                      </div>
                      <button
                        type="button"
                        onClick={() =>
                          setDraft((p) =>
                            p
                              ? {
                                  ...p,
                                  customBgColor: '',
                                  customBgGradient: '',
                                  customButtonColor: '',
                                  customTextColor: '',
                                }
                              : p
                          )
                        }
                        className="text-xs font-semibold text-indigo-600 dark:text-indigo-400 hover:underline cursor-pointer whitespace-nowrap"
                      >
                        Reset to Theme Defaults
                      </button>
                    </div>

                    <div className="grid grid-cols-1 sm:grid-cols-3 gap-4">
                      <div>
                        <label
                          htmlFor="col-bg"
                          className="block text-xs font-semibold text-slate-700 dark:text-slate-300 mb-1.5"
                        >
                          Background Color
                        </label>
                        <div className="flex items-center gap-2">
                          <input
                            id="col-bg"
                            type="color"
                            value={draft.customBgColor || '#FFFFFF'}
                            onChange={(e) =>
                              setDraft((p) => (p ? { ...p, customBgColor: e.target.value } : p))
                            }
                            className="w-10 h-10 rounded-lg border border-slate-300 cursor-pointer p-0.5 bg-white"
                          />
                          <input
                            type="text"
                            value={draft.customBgColor}
                            onChange={(e) =>
                              setDraft((p) => (p ? { ...p, customBgColor: e.target.value } : p))
                            }
                            placeholder="Theme default"
                            className="flex-1 min-h-[40px] px-3 rounded-xl border border-slate-300 dark:border-slate-700 bg-white dark:bg-slate-950 text-xs font-mono"
                          />
                        </div>
                      </div>

                      <div>
                        <label
                          htmlFor="col-btn"
                          className="block text-xs font-semibold text-slate-700 dark:text-slate-300 mb-1.5"
                        >
                          Button Color
                        </label>
                        <div className="flex items-center gap-2">
                          <input
                            id="col-btn"
                            type="color"
                            value={draft.customButtonColor || '#0F172A'}
                            onChange={(e) =>
                              setDraft((p) => (p ? { ...p, customButtonColor: e.target.value } : p))
                            }
                            className="w-10 h-10 rounded-lg border border-slate-300 cursor-pointer p-0.5 bg-white"
                          />
                          <input
                            type="text"
                            value={draft.customButtonColor}
                            onChange={(e) =>
                              setDraft((p) => (p ? { ...p, customButtonColor: e.target.value } : p))
                            }
                            placeholder="Theme default"
                            className="flex-1 min-h-[40px] px-3 rounded-xl border border-slate-300 dark:border-slate-700 bg-white dark:bg-slate-950 text-xs font-mono"
                          />
                        </div>
                      </div>

                      <div>
                        <label
                          htmlFor="col-txt"
                          className="block text-xs font-semibold text-slate-700 dark:text-slate-300 mb-1.5"
                        >
                          Text Color
                        </label>
                        <div className="flex items-center gap-2">
                          <input
                            id="col-txt"
                            type="color"
                            value={draft.customTextColor || '#0F172A'}
                            onChange={(e) =>
                              setDraft((p) => (p ? { ...p, customTextColor: e.target.value } : p))
                            }
                            className="w-10 h-10 rounded-lg border border-slate-300 cursor-pointer p-0.5 bg-white"
                          />
                          <input
                            type="text"
                            value={draft.customTextColor}
                            onChange={(e) =>
                              setDraft((p) => (p ? { ...p, customTextColor: e.target.value } : p))
                            }
                            placeholder="Theme default"
                            className="flex-1 min-h-[40px] px-3 rounded-xl border border-slate-300 dark:border-slate-700 bg-white dark:bg-slate-950 text-xs font-mono"
                          />
                        </div>
                      </div>
                    </div>

                    <div>
                      <label className="block text-xs font-semibold text-slate-700 dark:text-slate-300 mb-2">
                        Background Gradient Preset
                      </label>
                      <div className="flex flex-wrap gap-2">
                        {SAFE_GRADIENT_PRESETS.map((g) => (
                          <button
                            key={g.id}
                            type="button"
                            onClick={() =>
                              setDraft((p) => (p ? { ...p, customBgGradient: g.value } : p))
                            }
                            className={`min-h-[38px] px-3.5 py-1.5 rounded-xl border text-xs font-semibold cursor-pointer whitespace-nowrap ${
                              draft.customBgGradient === g.value
                                ? 'border-indigo-600 bg-indigo-50 text-indigo-700 dark:bg-indigo-950/60 dark:text-indigo-300'
                                : 'border-slate-200 dark:border-slate-700 text-slate-700 dark:text-slate-300'
                            }`}
                          >
                            {g.label}
                          </button>
                        ))}
                      </div>
                    </div>
                  </div>

                  {/* Shapes, Typography & Layout */}
                  <div className="rounded-2xl border border-slate-200 dark:border-slate-800 bg-white dark:bg-slate-900 p-6 space-y-5">
                    <h3 className="text-base font-bold text-slate-900 dark:text-white">
                      Buttons, Typography &amp; Layout
                    </h3>

                    <div className="grid grid-cols-1 sm:grid-cols-2 gap-5">
                      <div>
                        <label className="block text-xs font-semibold text-slate-700 dark:text-slate-300 mb-2">
                          Button Shape
                        </label>
                        <div className="grid grid-cols-3 gap-2">
                          {(['sharp', 'rounded', 'pill'] as ButtonShape[]).map((sh) => (
                            <button
                              key={sh}
                              type="button"
                              onClick={() => setDraft((p) => (p ? { ...p, buttonShape: sh } : p))}
                              className={`min-h-[40px] px-3 py-2 rounded-xl border text-xs font-semibold capitalize cursor-pointer ${
                                draft.buttonShape === sh
                                  ? 'border-indigo-600 bg-indigo-50 text-indigo-700 dark:bg-indigo-950/60 dark:text-indigo-300'
                                  : 'border-slate-200 dark:border-slate-700 text-slate-700 dark:text-slate-300'
                              }`}
                            >
                              {sh}
                            </button>
                          ))}
                        </div>
                      </div>

                      <div>
                        <label className="block text-xs font-semibold text-slate-700 dark:text-slate-300 mb-2">
                          Link Button Style
                        </label>
                        <div className="grid grid-cols-3 sm:grid-cols-5 gap-2">
                          {(['solid', 'outline', 'soft', 'shadow', 'glass'] as ButtonStyle[]).map(
                            (st) => (
                              <button
                                key={st}
                                type="button"
                                onClick={() => setDraft((p) => (p ? { ...p, buttonStyle: st } : p))}
                                className={`min-h-[40px] px-2.5 py-2 rounded-xl border text-xs font-semibold capitalize cursor-pointer ${
                                  draft.buttonStyle === st
                                    ? 'border-indigo-600 bg-indigo-50 text-indigo-700 dark:bg-indigo-950/60 dark:text-indigo-300'
                                    : 'border-slate-200 dark:border-slate-700 text-slate-700 dark:text-slate-300'
                                }`}
                              >
                                {st}
                              </button>
                            )
                          )}
                        </div>
                      </div>

                      <div>
                        <label className="block text-xs font-semibold text-slate-700 dark:text-slate-300 mb-2">
                          Profile Image Shape
                        </label>
                        <div className="grid grid-cols-3 gap-2">
                          {(['circle', 'rounded', 'square'] as AvatarShape[]).map((av) => (
                            <button
                              key={av}
                              type="button"
                              onClick={() => setDraft((p) => (p ? { ...p, avatarShape: av } : p))}
                              className={`min-h-[40px] px-3 py-2 rounded-xl border text-xs font-semibold capitalize cursor-pointer ${
                                draft.avatarShape === av
                                  ? 'border-indigo-600 bg-indigo-50 text-indigo-700 dark:bg-indigo-950/60 dark:text-indigo-300'
                                  : 'border-slate-200 dark:border-slate-700 text-slate-700 dark:text-slate-300'
                              }`}
                            >
                              {av}
                            </button>
                          ))}
                        </div>
                      </div>

                      <div>
                        <label className="block text-xs font-semibold text-slate-700 dark:text-slate-300 mb-2">
                          Page Layout Width
                        </label>
                        <div className="grid grid-cols-3 gap-2">
                          {(['compact', 'standard', 'wide'] as LayoutWidth[]).map((lw) => (
                            <button
                              key={lw}
                              type="button"
                              onClick={() => setDraft((p) => (p ? { ...p, layoutWidth: lw } : p))}
                              className={`min-h-[40px] px-3 py-2 rounded-xl border text-xs font-semibold capitalize cursor-pointer ${
                                draft.layoutWidth === lw
                                  ? 'border-indigo-600 bg-indigo-50 text-indigo-700 dark:bg-indigo-950/60 dark:text-indigo-300'
                                  : 'border-slate-200 dark:border-slate-700 text-slate-700 dark:text-slate-300'
                              }`}
                            >
                              {lw}
                            </button>
                          ))}
                        </div>
                      </div>
                    </div>

                    <div>
                      <label
                        htmlFor="font-select"
                        className="block text-xs font-semibold text-slate-700 dark:text-slate-300 mb-2"
                      >
                        Typography Pairing
                      </label>
                      <select
                        id="font-select"
                        value={draft.fontFamily}
                        onChange={(e) =>
                          setDraft((p) =>
                            p ? { ...p, fontFamily: e.target.value as FontToken } : p
                          )
                        }
                        className="w-full sm:w-72 min-h-[42px] px-3.5 py-2 rounded-xl border border-slate-300 dark:border-slate-700 bg-white dark:bg-slate-950 text-sm text-slate-900 dark:text-white"
                      >
                        {SAFE_FONTS.map((f) => (
                          <option key={f.id} value={f.id}>
                            {f.label}
                          </option>
                        ))}
                      </select>
                    </div>
                  </div>

                  {/* Custom SEO Metadata (Premium Feature) */}
                  <div className="rounded-2xl border border-slate-200 dark:border-slate-800 bg-white dark:bg-slate-900 p-6 space-y-4">
                    <div className="flex items-center justify-between gap-2">
                      <div>
                        <h3 className="text-sm font-bold text-slate-900 dark:text-white">
                          Custom SEO Title &amp; Description
                        </h3>
                        <p className="text-xs text-slate-500 dark:text-slate-400 mt-0.5">
                          Customize browser tab and Open Graph sharing metadata for your public URL.
                        </p>
                      </div>
                      {plan === 'free' && (
                        <span className="inline-flex items-center gap-1 text-xs font-semibold text-amber-600 dark:text-amber-400">
                          <Lock className="w-3.5 h-3.5" />
                          Premium Feature
                        </span>
                      )}
                    </div>

                    <div className="space-y-3">
                      <div>
                        <label
                          htmlFor="seo-title"
                          className="block text-xs font-semibold text-slate-700 dark:text-slate-300 mb-1"
                        >
                          Custom Page Title (max 70 chars)
                        </label>
                        <input
                          id="seo-title"
                          type="text"
                          disabled={plan === 'free'}
                          maxLength={70}
                          value={draft.seoTitle}
                          onChange={(e) =>
                            setDraft((p) => (p ? { ...p, seoTitle: e.target.value } : p))
                          }
                          placeholder={`${draft.displayName} – Official Links`}
                          className="w-full min-h-[42px] px-3.5 py-2 rounded-xl border border-slate-300 dark:border-slate-700 bg-white dark:bg-slate-950 text-sm disabled:opacity-50"
                        />
                      </div>
                      <div>
                        <label
                          htmlFor="seo-desc"
                          className="block text-xs font-semibold text-slate-700 dark:text-slate-300 mb-1"
                        >
                          Custom Meta Description (max 160 chars)
                        </label>
                        <textarea
                          id="seo-desc"
                          rows={2}
                          disabled={plan === 'free'}
                          maxLength={160}
                          value={draft.seoDescription}
                          onChange={(e) =>
                            setDraft((p) => (p ? { ...p, seoDescription: e.target.value } : p))
                          }
                          placeholder="Explore portfolio projects, videos, and contact links..."
                          className="w-full p-3 rounded-xl border border-slate-300 dark:border-slate-700 bg-white dark:bg-slate-950 text-sm disabled:opacity-50"
                        />
                      </div>
                    </div>
                  </div>

                  <div className="flex justify-end">
                    <button
                      type="button"
                      disabled={saving}
                      onClick={() => handleSaveDraft()}
                      className="min-h-[44px] px-6 py-2.5 rounded-xl bg-indigo-600 hover:bg-indigo-700 text-white text-sm font-semibold inline-flex items-center gap-2 cursor-pointer disabled:opacity-50"
                    >
                      <Save className="w-4 h-4" />
                      <span>{saving ? 'Saving...' : 'Save Appearance'}</span>
                    </button>
                  </div>
                </div>
              )}

              {/* 5. THEMES GALLERY */}
              {activeTab === 'themes' && (
                <div className="space-y-6">
                  <div>
                    <h2 className="text-lg font-bold text-slate-900 dark:text-white">
                      Built-In Themes
                    </h2>
                    <p className="text-xs text-slate-500 dark:text-slate-400 mt-0.5">
                      Click any theme to preview it immediately. Free accounts can publish all 5
                      Basic themes; Premium unlocks Creator Neon, Pink Aesthetic, and Glassmorphism.
                    </p>
                  </div>

                  <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                    {BUILT_IN_THEMES.filter((t) => !disabledThemes.includes(t.id)).map((theme) => {
                      const selected = draft.themeId === theme.id;
                      const lockedForFree = plan === 'free' && theme.tier === 'premium';
                      return (
                        <button
                          key={theme.id}
                          type="button"
                          onClick={() =>
                            setDraft((p) =>
                              p
                                ? {
                                    ...p,
                                    themeId: theme.id,
                                    buttonShape: theme.defaultShape,
                                    buttonStyle: theme.defaultStyle,
                                    customBgColor: '',
                                    customBgGradient: '',
                                    customButtonColor: '',
                                    customTextColor: '',
                                  }
                                : p
                            )
                          }
                          className={`rounded-2xl border p-5 text-left transition-all cursor-pointer flex flex-col justify-between ${
                            selected
                              ? 'border-2 border-indigo-600 bg-white dark:bg-slate-900 shadow-xs'
                              : 'border-slate-200 dark:border-slate-800 bg-white dark:bg-slate-900 hover:border-slate-300'
                          }`}
                        >
                          <div>
                            <div className="flex items-center justify-between gap-2 text-xs mb-2">
                              <span className="font-bold text-slate-900 dark:text-white text-sm">
                                {theme.name}
                              </span>
                              <span className="text-slate-500 capitalize inline-flex items-center gap-1">
                                {lockedForFree && <Lock className="w-3 h-3 text-amber-500" />}
                                {theme.tier}
                              </span>
                            </div>
                            <p className="text-xs text-slate-500 dark:text-slate-400 leading-relaxed">
                              {theme.description}
                            </p>
                          </div>

                          <div className="mt-4 pt-3 border-t border-slate-100 dark:border-slate-800 flex items-center justify-between text-xs">
                            <span className="text-slate-400 capitalize">
                              {theme.defaultShape} · {theme.defaultStyle}
                            </span>
                            <span className="font-semibold text-indigo-600 dark:text-indigo-400">
                              {selected ? 'Selected in Preview' : 'Apply to Preview'}
                            </span>
                          </div>
                        </button>
                      );
                    })}
                  </div>

                  <div className="flex justify-end">
                    <button
                      type="button"
                      disabled={saving}
                      onClick={() => handleSaveDraft()}
                      className="min-h-[44px] px-6 py-2.5 rounded-xl bg-indigo-600 hover:bg-indigo-700 text-white text-sm font-semibold inline-flex items-center gap-2 cursor-pointer disabled:opacity-50"
                    >
                      <Save className="w-4 h-4" />
                      <span>{saving ? 'Saving Theme...' : 'Save Selected Theme'}</span>
                    </button>
                  </div>
                </div>
              )}

              {/* 6. ANALYTICS */}
              {activeTab === 'analytics' && (
                <AnalyticsPanel uid={account.uid} profile={profile} links={links} plan={plan} />
              )}

              {/* 7. ACCOUNT SETTINGS */}
              {activeTab === 'settings' && (
                <AccountSettingsPanel
                  account={account}
                  profile={profile}
                  onSendPasswordReset={sendPasswordReset}
                  onRefresh={refreshUserData}
                  onLogout={logout}
                />
              )}

              {/* 8. SUBSCRIPTION & UPGRADE */}
              {activeTab === 'subscription' && (
                <SubscriptionPanel
                  account={account}
                  profile={profile}
                  plan={plan}
                  subscription={subscription}
                  premiumPriceMonthly={premiumPriceMonthly}
                  onRefresh={refreshUserData}
                  onGoToSupport={() => selectTab('support')}
                />
              )}

              {/* 9. HELP & SUPPORT */}
              {activeTab === 'support' && (
                <HelpAndSupportPanel uid={account.uid} email={account.email} />
              )}
            </div>

            {/* Sticky Live Mobile Preview Column on XL Desktop */}
            {showSidePreview && (
              <div className="hidden xl:flex w-[360px] shrink-0 flex-col items-center sticky top-24">
                <div className="w-full rounded-[2rem] p-2.5 bg-slate-900 border border-slate-800 shadow-lg">
                  <div className="flex items-center justify-between px-4 py-2 text-[11px] font-mono text-slate-400">
                    <span>/{draft.username || 'username'}</span>
                    <span className="inline-flex items-center gap-1">
                      <Eye className="w-3 h-3" />
                      Live Preview
                    </span>
                  </div>
                  <BioPageRenderer compactPreview profile={draft} links={links} />
                </div>
              </div>
            )}
          </div>
        </div>

        {/* Mobile Live Preview Modal */}
        {mobilePreviewOpen && (
          <div className="fixed inset-0 z-50 xl:hidden bg-slate-950/75 flex flex-col items-center justify-center p-4">
            <div className="w-full max-w-[360px] flex items-center justify-between text-white mb-2 px-1">
              <span className="text-xs font-semibold">Live Mobile Preview</span>
              <button
                type="button"
                onClick={() => setMobilePreviewOpen(false)}
                className="px-3 py-1 rounded-lg bg-white/15 text-xs font-semibold cursor-pointer"
              >
                Close
              </button>
            </div>
            <div className="w-full max-w-[360px] max-h-[82vh] overflow-y-auto rounded-[2rem] p-2 bg-slate-900 border border-slate-800">
              <BioPageRenderer compactPreview profile={draft} links={links} />
            </div>
          </div>
        )}

        <QrShareModal
          isOpen={qrOpen}
          onClose={() => setQrOpen(false)}
          username={profile.username}
          displayName={profile.displayName}
        />
      </div>
    </div>
  );
};
