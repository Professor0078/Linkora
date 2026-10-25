import React, { useEffect, useState } from 'react';
import { Link, useNavigate } from 'react-router-dom';
import {
  ArrowRight,
  BarChart3,
  Check,
  ChevronDown,
  Contact,
  Globe,
  Inbox,
  Layers,
  Menu,
  PlaySquare,
  ShieldCheck,
  Smartphone,
  X,
} from 'lucide-react';
import creatorSampleAvatar from '../assets/images/avatar_sample_creator_1792771608665.jpg';
import creatorSaraAvatar from '../assets/images/avatar_creator_sara_1792771608674.jpg';
import creatorDavidAvatar from '../assets/images/avatar_creator_david_1792771608347.jpg';
import { BioPageRenderer } from '../components/BioPageRenderer';
import { useAuth } from '../context/AuthContext';
import { ThemeToggleButton } from '../context/ThemeContext';
import {
  DEFAULT_FAQS,
  DEFAULT_PLATFORM_SETTINGS,
  fetchPublicPlatformContent,
} from '../lib/firestoreService';
import { BUILT_IN_THEMES } from '../lib/themes';
import { normalizeUsername } from '../lib/validation';
import { BioLink, FaqRecord, PlatformSettingsRecord, ThemeId } from '../types/linkora';

const SAMPLE_LINKS: BioLink[] = [
  {
    id: 'sample_1',
    uid: 'sample',
    title: 'Design Systems & UI Component Kit',
    subtitle: '140+ responsive Figma tokens & React primitives',
    badgeText: 'Bestseller',
    priceLabel: '$29',
    sectionTitle: 'Featured Work & Products',
    isFeatured: true,
    isPinned: true,
    embedType: 'none',
    url: 'https://example.com/shop',
    platform: 'shop',
    isSocialIcon: false,
    enabled: true,
    isProfilePublished: true,
    order: 0,
    clicks: 214,
  },
  {
    id: 'sample_2',
    uid: 'sample',
    title: 'Latest Breakdown: Design System Architecture',
    subtitle: 'Tap Watch Video to preview inline without leaving this page',
    embedType: 'youtube',
    url: 'https://www.youtube.com/watch?v=M7lc1UVf-VE',
    platform: 'youtube',
    isSocialIcon: true,
    enabled: true,
    isProfilePublished: true,
    order: 1,
    clicks: 168,
  },
  {
    id: 'sample_3',
    uid: 'sample',
    title: 'Product Design Portfolio & Case Studies',
    subtitle: 'Selected SaaS, fintech & mobile commerce builds',
    embedType: 'none',
    url: 'https://example.com/portfolio',
    platform: 'portfolio',
    isSocialIcon: false,
    enabled: true,
    isProfilePublished: true,
    order: 2,
    clicks: 148,
  },
  {
    id: 'sample_4',
    uid: 'sample',
    title: 'Message on WhatsApp for Project Inquiries',
    subtitle: 'Direct studio chat · Replies within 2 hours',
    sectionTitle: 'Connect & Channels',
    embedType: 'none',
    url: 'https://wa.me/15550192834',
    platform: 'whatsapp',
    isSocialIcon: true,
    enabled: true,
    isProfilePublished: true,
    order: 3,
    clicks: 97,
  },
  {
    id: 'sample_5',
    uid: 'sample',
    title: 'Connect on LinkedIn',
    embedType: 'none',
    url: 'https://linkedin.com',
    platform: 'linkedin',
    isSocialIcon: true,
    enabled: true,
    isProfilePublished: true,
    order: 4,
    clicks: 53,
  },
];

type TemplateGalleryFilter = 'all' | 'free' | 'premium' | 'light' | 'dark';

export const LandingPage: React.FC = () => {
  const { firebaseUser } = useAuth();
  const navigate = useNavigate();

  const [mobileMenuOpen, setMobileMenuOpen] = useState(false);
  const [claimSlug, setClaimSlug] = useState('');
  const [sampleTheme, setSampleTheme] = useState<ThemeId>('minimal-white');
  const [templateFilter, setTemplateFilter] = useState<TemplateGalleryFilter>('all');
  const [openFaqId, setOpenFaqId] = useState<string>('faq_1');
  const [settings, setSettings] = useState<PlatformSettingsRecord>(DEFAULT_PLATFORM_SETTINGS);
  const [faqs, setFaqs] = useState<FaqRecord[]>(DEFAULT_FAQS);

  useEffect(() => {
    document.title = 'Linkora – Your Links, One Beautiful Page';
    let mounted = true;
    fetchPublicPlatformContent().then((res) => {
      if (!mounted) return;
      setSettings(res.settings);
      setFaqs(res.faqs);
      if (res.faqs[0]) setOpenFaqId(res.faqs[0].id);
    });
    return () => {
      mounted = false;
    };
  }, []);

  const enabledThemes = BUILT_IN_THEMES.filter((t) => !settings.disabledThemes.includes(t.id));
  const freeThemeCount = enabledThemes.filter((t) => t.tier === 'free').length;
  const premiumThemeCount = enabledThemes.filter((t) => t.tier === 'premium').length;

  const visibleThemes = enabledThemes.filter((t) => {
    if (templateFilter === 'all') return true;
    if (templateFilter === 'free' || templateFilter === 'premium') {
      return t.tier === templateFilter;
    }
    return templateFilter === 'dark' ? t.isDark : !t.isDark;
  });

  const selectedThemeMeta =
    BUILT_IN_THEMES.find((t) => t.id === sampleTheme) || BUILT_IN_THEMES[0];

  const handleClaimSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    const cleaned = normalizeUsername(claimSlug);
    if (firebaseUser) {
      navigate('/dashboard');
      return;
    }
    navigate(cleaned ? `/signup?username=${encodeURIComponent(cleaned)}` : '/signup');
  };

  return (
    <div
      id="top"
      className="min-h-screen bg-white dark:bg-slate-950 text-slate-900 dark:text-slate-100 flex flex-col transition-colors duration-150"
    >
      {/* Top Bar Contract: 3 exact zones separated by gap-8 */}
      <header className="sticky top-0 z-40 bg-white/95 dark:bg-slate-950/95 backdrop-blur-md border-b border-slate-200 dark:border-slate-800">
        <div className="max-w-6xl mx-auto px-4 sm:px-6 h-16 flex items-center justify-between gap-8">
          {/* Zone 1: Single wordmark */}
          <a
            href="#top"
            className="text-lg font-bold tracking-tight text-slate-950 dark:text-white whitespace-nowrap shrink-0"
          >
            Linkora
          </a>

          {/* Zone 2: 5 concise single-line text links */}
          <nav
            aria-label="Primary"
            className="hidden md:flex items-center gap-7 text-sm font-medium text-slate-600 dark:text-slate-300"
          >
            <a
              href="#top"
              className="hover:text-slate-950 dark:hover:text-white hover:underline underline-offset-4 transition-colors whitespace-nowrap shrink-0"
            >
              Home
            </a>
            <a
              href="#features"
              className="hover:text-slate-950 dark:hover:text-white hover:underline underline-offset-4 transition-colors whitespace-nowrap shrink-0"
            >
              Features
            </a>
            <a
              href="#templates"
              className="hover:text-slate-950 dark:hover:text-white hover:underline underline-offset-4 transition-colors whitespace-nowrap shrink-0"
            >
              Templates
            </a>
            <a
              href="#pricing"
              className="hover:text-slate-950 dark:hover:text-white hover:underline underline-offset-4 transition-colors whitespace-nowrap shrink-0"
            >
              Pricing
            </a>
            <Link
              to={firebaseUser ? '/dashboard' : '/login'}
              className="hover:text-slate-950 dark:hover:text-white hover:underline underline-offset-4 transition-colors whitespace-nowrap shrink-0"
            >
              {firebaseUser ? 'Dashboard' : 'Login'}
            </Link>
          </nav>

          {/* Zone 3: 1 primary action */}
          <div className="flex items-center gap-2 shrink-0">
            <Link
              to={firebaseUser ? '/dashboard' : '/signup'}
              className="hidden sm:inline-flex items-center justify-center min-h-[40px] px-4 py-2 rounded-lg bg-indigo-600 hover:bg-indigo-700 text-white text-xs font-semibold transition-colors whitespace-nowrap shrink-0"
            >
              {firebaseUser ? 'Open Dashboard' : 'Create Your Free Page'}
            </Link>
            <button
              type="button"
              onClick={() => setMobileMenuOpen((v) => !v)}
              aria-label="Toggle navigation menu"
              aria-expanded={mobileMenuOpen}
              className="md:hidden w-10 h-10 rounded-lg border border-slate-200 dark:border-slate-800 flex items-center justify-center text-slate-700 dark:text-slate-200 hover:bg-slate-50 dark:hover:bg-slate-900 cursor-pointer"
            >
              {mobileMenuOpen ? <X className="w-5 h-5" /> : <Menu className="w-5 h-5" />}
            </button>
          </div>
        </div>

        {/* Mobile Navigation Drawer */}
        {mobileMenuOpen && (
          <div className="md:hidden border-t border-slate-200 dark:border-slate-800 bg-white dark:bg-slate-950 px-4 py-4 space-y-3">
            <div className="flex flex-col space-y-2.5 text-sm font-medium text-slate-700 dark:text-slate-200">
              <a href="#top" onClick={() => setMobileMenuOpen(false)} className="py-1.5">
                Home
              </a>
              <a href="#features" onClick={() => setMobileMenuOpen(false)} className="py-1.5">
                Features
              </a>
              <a href="#templates" onClick={() => setMobileMenuOpen(false)} className="py-1.5">
                Templates
              </a>
              <a href="#pricing" onClick={() => setMobileMenuOpen(false)} className="py-1.5">
                Pricing
              </a>
              <Link
                to={firebaseUser ? '/dashboard' : '/login'}
                onClick={() => setMobileMenuOpen(false)}
                className="py-1.5"
              >
                {firebaseUser ? 'Dashboard' : 'Login'}
              </Link>
            </div>
            <div className="pt-2 border-t border-slate-200 dark:border-slate-800 flex items-center justify-between gap-3">
              <span className="text-xs text-slate-500 dark:text-slate-400">Interface appearance</span>
              <ThemeToggleButton />
            </div>
            <Link
              to={firebaseUser ? '/dashboard' : '/signup'}
              onClick={() => setMobileMenuOpen(false)}
              className="w-full min-h-[44px] px-4 py-2.5 rounded-lg bg-indigo-600 hover:bg-indigo-700 text-white text-sm font-semibold flex items-center justify-center"
            >
              {firebaseUser ? 'Open Dashboard' : 'Create Your Free Page'}
            </Link>
          </div>
        )}
      </header>

      <main className="flex-1">
        {/* Hero Section */}
        <section className="max-w-6xl mx-auto px-4 sm:px-6 pt-10 pb-20 lg:pt-16 lg:pb-24">
          <div className="grid grid-cols-1 lg:grid-cols-12 gap-12 lg:gap-10 items-center">
            {/* Left Copy & Claim Form */}
            <div className="lg:col-span-7">
              <div className="flex flex-wrap items-center justify-between gap-4 mb-4">
                <p className="text-xs font-semibold text-indigo-600 dark:text-indigo-400 tracking-normal">
                  Your Links · Inline Media · Light &amp; Dark Themes
                </p>
                <ThemeToggleButton className="hidden sm:inline-flex" />
              </div>

              <h1 className="text-4xl sm:text-5xl lg:text-[3.5rem] font-bold tracking-tight text-slate-950 dark:text-white leading-[1.08] text-balance">
                {settings.heroHeadline}
              </h1>
              <p className="mt-5 text-base sm:text-lg text-slate-600 dark:text-slate-300 dark:tracking-[0.01em] leading-relaxed max-w-xl">
                {settings.heroSubheadline}
              </p>

              {/* Interactive Slug Claim Form */}
              <form
                onSubmit={handleClaimSubmit}
                className="mt-8 flex flex-col sm:flex-row items-stretch sm:items-center gap-3 max-w-xl"
              >
                <div className="flex-1 flex items-center rounded-xl border border-slate-300 dark:border-slate-700 bg-slate-50/80 dark:bg-slate-900 px-3.5 min-h-[48px] focus-within:border-indigo-600 dark:focus-within:border-indigo-500 focus-within:bg-white dark:focus-within:bg-slate-900 transition-colors">
                  <span className="text-sm font-mono text-slate-500 dark:text-slate-400 select-none shrink-0">
                    linkora.app/
                  </span>
                  <input
                    type="text"
                    value={claimSlug}
                    onChange={(e) => setClaimSlug(normalizeUsername(e.target.value))}
                    placeholder="usman"
                    aria-label="Desired Linkora username"
                    className="w-full bg-transparent text-sm font-mono text-slate-900 dark:text-white placeholder:text-slate-400 dark:placeholder:text-slate-500 focus:outline-none py-2"
                  />
                </div>
                <button
                  type="submit"
                  className="min-h-[48px] px-6 py-3 rounded-xl bg-indigo-600 hover:bg-indigo-700 text-white text-sm font-semibold inline-flex items-center justify-center gap-2 transition-colors cursor-pointer whitespace-nowrap shrink-0"
                >
                  <span>Create Your Free Page</span>
                  <ArrowRight className="w-4 h-4" aria-hidden="true" />
                </button>
              </form>

              <div className="mt-4 flex flex-wrap items-center gap-4 text-sm">
                <a
                  href="#templates"
                  className="font-semibold text-slate-700 dark:text-slate-200 hover:text-indigo-600 dark:hover:text-indigo-400 inline-flex items-center gap-1.5 transition-colors whitespace-nowrap"
                >
                  <span>Explore Templates</span>
                  <ArrowRight className="w-3.5 h-3.5" aria-hidden="true" />
                </a>
                <span className="text-slate-300 dark:text-slate-700" aria-hidden="true">
                  ·
                </span>
                <span className="text-xs text-slate-500 dark:text-slate-400">
                  Free plan includes 10 rich links, YouTube/Spotify embeds, vCard, Tip Jar &amp; QR Studio
                </span>
              </div>
            </div>

            {/* Right Interactive Live Sample Bio Page */}
            <div className="lg:col-span-5 flex flex-col items-center">
              <div className="w-full max-w-[368px] rounded-[2rem] p-2.5 bg-slate-900 dark:bg-slate-900 shadow-xl border border-slate-800 dark:border-slate-700">
                <div className="flex items-center justify-between px-4 py-2 text-[11px] font-mono text-slate-400">
                  <span>linkora.app/usman</span>
                  <span>Interactive Preview</span>
                </div>
                <BioPageRenderer
                  compactPreview
                  profile={{
                    username: 'usman',
                    displayName: 'Usman Malik',
                    headline: 'Product Designer & Educator',
                    location: 'Lahore · Worldwide',
                    bio: 'Helping founders and studios launch clear, conversion-focused digital products.',
                    announcementText: 'New Figma Design Kit live below · Watch preview inline',
                    availabilityStatus: 'available',
                    availabilityText: 'Available for Q2 product design projects',
                    visitorThemeSwitchEnabled: true,
                    tipJarEnabled: true,
                    tipJarLabel: 'Support my tutorials · Buy me a coffee',
                    tipJarUrl: 'https://buymeacoffee.com',
                    isVerifiedCreator: true,
                    avatarUrl: creatorSampleAvatar,
                    backgroundImageUrl: '',
                    themeId: sampleTheme,
                    customBgColor: '',
                    customBgGradient: '',
                    customButtonColor: '',
                    customTextColor: '',
                    buttonShape: selectedThemeMeta.defaultShape,
                    buttonStyle: selectedThemeMeta.defaultStyle,
                    fontFamily: 'jakarta',
                    avatarShape: 'circle',
                    layoutWidth: 'compact',
                    ctaLabel: 'Book a 20-Min Design Consultation',
                    ctaUrl: 'https://example.com/consult',
                    seoTitle: '',
                    seoDescription: '',
                    vcardEnabled: true,
                    vcardEmail: 'usman@example.com',
                    vcardPhone: '+15550192834',
                    leadCaptureEnabled: false,
                    leadCaptureTitle: '',
                    isPublished: true,
                  }}
                  links={SAMPLE_LINKS}
                />
              </div>

              {/* Interactive Sample Theme Switcher */}
              <div
                role="group"
                aria-label="Preview sample themes"
                className="mt-4 flex flex-wrap items-center justify-center gap-1 p-1.5 rounded-xl bg-slate-100 dark:bg-slate-900 border border-slate-200 dark:border-slate-800"
              >
                {(
                  [
                    'minimal-white',
                    'nordic-frost',
                    'dark-pro',
                    'emerald-luxe',
                    'cyber-aurora',
                  ] as ThemeId[]
                ).map((tid) => {
                  const meta = BUILT_IN_THEMES.find((t) => t.id === tid)!;
                  const active = sampleTheme === tid;
                  return (
                    <button
                      key={tid}
                      type="button"
                      onClick={() => setSampleTheme(tid)}
                      className={`px-3 py-1.5 rounded-lg text-xs font-medium transition-colors cursor-pointer whitespace-nowrap shrink-0 ${
                        active
                          ? 'bg-white dark:bg-slate-800 text-slate-950 dark:text-white shadow-xs'
                          : 'text-slate-600 dark:text-slate-400 hover:text-slate-900 dark:hover:text-white'
                      }`}
                    >
                      {meta.name}
                    </button>
                  );
                })}
              </div>
            </div>
          </div>
        </section>

        {/* Three-Step Workflow Strip */}
        <section className="border-y border-slate-200 dark:border-slate-800 bg-slate-50/70 dark:bg-slate-900/50">
          <div className="max-w-6xl mx-auto px-4 sm:px-6 py-16">
            <div className="max-w-2xl mb-10">
              <h2 className="text-2xl sm:text-3xl font-bold tracking-tight text-slate-950 dark:text-white text-balance">
                Publish your page in under two minutes
              </h2>
              <p className="mt-2 text-sm sm:text-base text-slate-600 dark:text-slate-400">
                No layout coding, DNS configuration, or external plugins required.
              </p>
            </div>

            <div className="grid grid-cols-1 md:grid-cols-3 gap-8">
              <div className="border-t-2 border-slate-900 dark:border-indigo-500 pt-5">
                <p className="text-xs font-mono text-indigo-600 dark:text-indigo-400 font-semibold">
                  01. Sign up
                </p>
                <h3 className="mt-2 text-lg font-bold text-slate-900 dark:text-white">
                  Claim your unique Linkora slug
                </h3>
                <p className="mt-2 text-sm text-slate-600 dark:text-slate-400 leading-relaxed">
                  Register with Google or email and reserve your personal URL like{' '}
                  <span className="font-mono text-slate-800 dark:text-slate-200">
                    linkora.app/usman
                  </span>{' '}
                  backed by transactional duplicate protection.
                </p>
              </div>

              <div className="border-t-2 border-slate-200 dark:border-slate-800 pt-5">
                <p className="text-xs font-mono text-indigo-600 dark:text-indigo-400 font-semibold">
                  02. Customize
                </p>
                <h3 className="mt-2 text-lg font-bold text-slate-900 dark:text-white">
                  Add rich links, media players &amp; schedules
                </h3>
                <p className="mt-2 text-sm text-slate-600 dark:text-slate-400 leading-relaxed">
                  Pin key releases, embed YouTube videos or Spotify tracks inline, schedule timed
                  campaign drops, and fine-tune Light or Dark themes with instant previewing.
                </p>
              </div>

              <div className="border-t-2 border-slate-200 dark:border-slate-800 pt-5">
                <p className="text-xs font-mono text-indigo-600 dark:text-indigo-400 font-semibold">
                  03. Share
                </p>
                <h3 className="mt-2 text-lg font-bold text-slate-900 dark:text-white">
                  Place one link across every channel
                </h3>
                <p className="mt-2 text-sm text-slate-600 dark:text-slate-400 leading-relaxed">
                  Paste your URL into Instagram, TikTok, YouTube, and LinkedIn—or download a
                  high-resolution branded QR share card and copyable HTML website badge.
                </p>
              </div>
            </div>
          </div>
        </section>

        {/* Asymmetric Bento Feature Section */}
        <section id="features" className="max-w-6xl mx-auto px-4 sm:px-6 py-20">
          <div className="max-w-2xl mb-12">
            <h2 className="text-3xl sm:text-4xl font-bold tracking-tight text-slate-950 dark:text-white text-balance">
              Everything creators and businesses need in one clean workspace
            </h2>
            <p className="mt-3 text-base text-slate-600 dark:text-slate-400">
              Built for speed on mobile networks, strict account security, and measurable visitor
              conversion.
            </p>
          </div>

          <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
            <div className="md:col-span-2 rounded-2xl border border-slate-200 dark:border-slate-800 p-7 bg-white dark:bg-slate-900 flex flex-col justify-between">
              <div>
                <div className="w-10 h-10 rounded-xl bg-indigo-50 dark:bg-indigo-950/60 text-indigo-600 dark:text-indigo-400 flex items-center justify-center mb-5">
                  <PlaySquare className="w-5 h-5" aria-hidden="true" />
                </div>
                <h3 className="text-xl font-bold text-slate-900 dark:text-white">
                  01. Rich cards, scheduled drops &amp; inline YouTube / Spotify players
                </h3>
                <p className="mt-2.5 text-sm sm:text-base text-slate-600 dark:text-slate-300 leading-relaxed max-w-xl">
                  Pin priority links to the top, schedule start and expiration windows for product
                  launches, and let visitors play YouTube videos or Spotify tracks right inside your
                  bio page—alongside thumbnails, price tags, and pre-filled WhatsApp inquiry links.
                </p>
              </div>
              <div className="mt-6 pt-5 border-t border-slate-100 dark:border-slate-800 flex flex-wrap items-center gap-3 text-xs text-slate-500 dark:text-slate-400">
                <span>14 Supported Platforms</span>
                <span aria-hidden="true">·</span>
                <span>Scheduled Publish &amp; Expiry</span>
                <span aria-hidden="true">·</span>
                <span>Inline Media Drawers</span>
              </div>
            </div>

            <div className="rounded-2xl border border-slate-200 dark:border-slate-800 p-7 bg-slate-50/60 dark:bg-slate-900/60 flex flex-col justify-between">
              <div>
                <div className="w-10 h-10 rounded-xl bg-indigo-50 dark:bg-indigo-950/60 text-indigo-600 dark:text-indigo-400 flex items-center justify-center mb-5">
                  <Contact className="w-5 h-5" aria-hidden="true" />
                </div>
                <h3 className="text-xl font-bold text-slate-900 dark:text-white">
                  02. vCard (.vcf), Tip Jar &amp; QR Share Studio
                </h3>
                <p className="mt-2.5 text-sm text-slate-600 dark:text-slate-300 leading-relaxed">
                  Let visitors save your contact card into iOS &amp; Android Contacts, support your
                  work via a dedicated Tip Jar button, or scan custom-colored QR share cards.
                </p>
              </div>
              <p className="mt-6 pt-5 border-t border-slate-200/70 dark:border-slate-800 text-xs text-slate-500 dark:text-slate-400">
                Includes downloadable PNG card &amp; HTML site badge
              </p>
            </div>

            <div className="rounded-2xl border border-slate-200 dark:border-slate-800 p-7 bg-slate-50/60 dark:bg-slate-900/60 flex flex-col justify-between">
              <div>
                <div className="w-10 h-10 rounded-xl bg-indigo-50 dark:bg-indigo-950/60 text-indigo-600 dark:text-indigo-400 flex items-center justify-center mb-5">
                  <Inbox className="w-5 h-5" aria-hidden="true" />
                </div>
                <h3 className="text-xl font-bold text-slate-900 dark:text-white">
                  03. Availability status &amp; private lead inbox
                </h3>
                <p className="mt-2.5 text-sm text-slate-600 dark:text-slate-300 leading-relaxed">
                  Display your live booking availability at the top of your profile, capture client
                  inquiries directly, reply via WhatsApp or Email, and export leads to CSV.
                </p>
              </div>
              <p className="mt-6 pt-5 border-t border-slate-200/70 dark:border-slate-800 text-xs text-slate-500 dark:text-slate-400">
                Firestore-isolated creator inbox
              </p>
            </div>

            <div className="md:col-span-2 rounded-2xl border border-slate-200 dark:border-slate-800 p-7 bg-white dark:bg-slate-900 flex flex-col justify-between">
              <div>
                <div className="w-10 h-10 rounded-xl bg-indigo-50 dark:bg-indigo-950/60 text-indigo-600 dark:text-indigo-400 flex items-center justify-center mb-5">
                  <Layers className="w-5 h-5" aria-hidden="true" />
                </div>
                <h3 className="text-xl font-bold text-slate-900 dark:text-white">
                  04. Light &amp; Dark mode, 16 curated themes &amp; 30-day CSV analytics
                </h3>
                <p className="mt-2.5 text-sm sm:text-base text-slate-600 dark:text-slate-300 leading-relaxed max-w-xl">
                  Work comfortably in Light or Dark mode across the entire dashboard with{' '}
                  <span className="font-mono text-xs">Ctrl+K</span> quick navigation, enable an
                  optional visitor surface toggle on your public page, and measure 7, 14, and 30-day
                  click-share trends.
                </p>
              </div>
              <div className="mt-6 pt-5 border-t border-slate-100 dark:border-slate-800 flex flex-wrap items-center gap-3 text-xs text-slate-500 dark:text-slate-400">
                <span className="inline-flex items-center gap-1.5">
                  <Smartphone className="w-3.5 h-3.5 text-slate-400" aria-hidden="true" />
                  Visitor Link Search &amp; Surface Toggle
                </span>
                <span aria-hidden="true">·</span>
                <span className="inline-flex items-center gap-1.5">
                  <BarChart3 className="w-3.5 h-3.5 text-slate-400" aria-hidden="true" />
                  Click-share % &amp; CSV Export
                </span>
                <span aria-hidden="true">·</span>
                <span className="inline-flex items-center gap-1.5">
                  <ShieldCheck className="w-3.5 h-3.5 text-slate-400" aria-hidden="true" />
                  Verified Creator Badges
                </span>
              </div>
            </div>
          </div>
        </section>

        {/* Proof / Attributable Creator Outcomes (Adjacent to Capabilities) */}
        <section className="bg-slate-950 dark:bg-slate-900/90 border-y border-slate-900 dark:border-slate-800 text-white py-20">
          <div className="max-w-6xl mx-auto px-4 sm:px-6">
            <div className="max-w-2xl mb-12">
              <h2 className="text-3xl sm:text-4xl font-bold tracking-tight text-balance">
                Used by independent sellers, educators, and studios
              </h2>
              <p className="mt-3 text-slate-400 text-base">
                Real workflows turning social profile traffic into direct inquiries and product
                orders.
              </p>
            </div>

            <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
              <article className="rounded-2xl border border-slate-800 bg-slate-900/80 dark:bg-slate-950/70 p-7 flex flex-col justify-between">
                <div>
                  <p className="text-xs font-mono text-indigo-400 tabular-nums">
                    +38% Direct WhatsApp Custom Orders in 60 Days
                  </p>
                  <blockquote className="mt-3 text-base text-slate-200 leading-relaxed">
                    “Before Linkora, customers on Instagram kept asking in comments how to order
                    custom stoneware sets. Putting our seasonal catalog, studio hours, and a
                    pre-filled WhatsApp order button on one page cut back-and-forth messages in
                    half.”
                  </blockquote>
                </div>
                <div className="mt-6 pt-5 border-t border-slate-800 flex items-center gap-3.5">
                  <img
                    src={creatorSaraAvatar}
                    alt="Sara Lindqvist in her ceramic studio"
                    referrerPolicy="no-referrer"
                    loading="lazy"
                    className="w-11 h-11 rounded-full object-cover border border-slate-700 shrink-0"
                  />
                  <div>
                    <p className="text-sm font-semibold text-white">Sara Lindqvist</p>
                    <p className="text-xs text-slate-400">
                      Founder &amp; Ceramicist · Nord Studio Goods
                    </p>
                  </div>
                </div>
              </article>

              <article className="rounded-2xl border border-slate-800 bg-slate-900/80 dark:bg-slate-950/70 p-7 flex flex-col justify-between">
                <div>
                  <p className="text-xs font-mono text-indigo-400 tabular-nums">
                    24.6% Bio Click-Through Rate Across 18k Monthly Visits
                  </p>
                  <blockquote className="mt-3 text-base text-slate-200 leading-relaxed">
                    “Embedding our latest YouTube breakdown directly inside Linkora’s Dark Pro
                    theme—with pinned gear guides and scheduled sponsor drops—made our bio page load
                    instantaneously inside mobile in-app browsers.”
                  </blockquote>
                </div>
                <div className="mt-6 pt-5 border-t border-slate-800 flex items-center gap-3.5">
                  <img
                    src={creatorDavidAvatar}
                    alt="David Morales portrait"
                    referrerPolicy="no-referrer"
                    loading="lazy"
                    className="w-11 h-11 rounded-full object-cover border border-slate-700 shrink-0"
                  />
                  <div>
                    <p className="text-sm font-semibold text-white">David Morales</p>
                    <p className="text-xs text-slate-400">
                      Tech Filmmaker &amp; YouTuber · Framecraft Lab
                    </p>
                  </div>
                </div>
              </article>
            </div>
          </div>
        </section>

        {/* Template Gallery */}
        <section id="templates" className="max-w-6xl mx-auto px-4 sm:px-6 py-20">
          <div className="flex flex-col lg:flex-row lg:items-end justify-between gap-6 mb-10">
            <div>
              <h2 className="text-3xl sm:text-4xl font-bold tracking-tight text-slate-950 dark:text-white text-balance tabular-nums">
                {enabledThemes.length} built-in Light &amp; Dark themes crafted for readability
              </h2>
              <p className="mt-2 text-base text-slate-600 dark:text-slate-400">
                Select any template to test it in the interactive hero preview above, or start
                customizing immediately.
              </p>
            </div>

            {/* Functional Filter Controls */}
            <div
              role="group"
              aria-label="Filter templates by tier or color palette"
              className="inline-flex flex-wrap items-center gap-1 p-1 rounded-xl bg-slate-100 dark:bg-slate-900 border border-slate-200 dark:border-slate-800 self-start"
            >
              {(
                [
                  { id: 'all', label: `All (${enabledThemes.length})` },
                  { id: 'free', label: `Free (${freeThemeCount})` },
                  { id: 'premium', label: `Premium (${premiumThemeCount})` },
                  { id: 'light', label: 'Light' },
                  { id: 'dark', label: 'Dark' },
                ] as { id: TemplateGalleryFilter; label: string }[]
              ).map((tab) => (
                <button
                  key={tab.id}
                  type="button"
                  onClick={() => setTemplateFilter(tab.id)}
                  className={`px-3 py-1.5 rounded-lg text-xs font-semibold transition-colors cursor-pointer whitespace-nowrap shrink-0 tabular-nums ${
                    templateFilter === tab.id
                      ? 'bg-white dark:bg-slate-800 text-slate-950 dark:text-white shadow-xs'
                      : 'text-slate-600 dark:text-slate-400 hover:text-slate-900 dark:hover:text-white'
                  }`}
                >
                  {tab.label}
                </button>
              ))}
            </div>
          </div>

          <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-5">
            {visibleThemes.map((theme) => (
              <div
                key={theme.id}
                className="rounded-2xl border border-slate-200 dark:border-slate-800 overflow-hidden bg-white dark:bg-slate-900 flex flex-col justify-between hover:border-slate-300 dark:hover:border-slate-700 transition-colors"
              >
                {/* Mini Visual Swatch */}
                <div className="p-4 border-b border-slate-100 dark:border-slate-800 bg-slate-50 dark:bg-slate-950/60">
                  <MiniThemeCard themeId={theme.id} />
                </div>

                <div className="p-5 flex-1 flex flex-col justify-between">
                  <div>
                    <div className="flex items-center gap-2 text-xs text-slate-500 dark:text-slate-400 mb-1">
                      <span className="capitalize">{theme.tier} tier</span>
                      <span aria-hidden="true">·</span>
                      <span>{theme.isDark ? 'Dark palette' : 'Light palette'}</span>
                    </div>
                    <h3 className="text-base font-bold text-slate-900 dark:text-white">
                      {theme.name}
                    </h3>
                    <p className="mt-1.5 text-xs text-slate-600 dark:text-slate-400 leading-relaxed">
                      {theme.description}
                    </p>
                  </div>

                  <div className="mt-5 flex items-center gap-2">
                    <button
                      type="button"
                      onClick={() => {
                        setSampleTheme(theme.id);
                        window.scrollTo({ top: 0, behavior: 'smooth' });
                      }}
                      className="flex-1 min-h-[38px] px-3 py-1.5 rounded-lg border border-slate-200 dark:border-slate-700 text-xs font-semibold text-slate-700 dark:text-slate-200 hover:bg-slate-50 dark:hover:bg-slate-800 transition-colors cursor-pointer whitespace-nowrap"
                    >
                      Preview Above
                    </button>
                    <Link
                      to={firebaseUser ? '/dashboard' : `/signup?theme=${theme.id}`}
                      className="min-h-[38px] px-3 py-1.5 rounded-lg bg-slate-900 dark:bg-indigo-600 hover:bg-slate-800 dark:hover:bg-indigo-700 text-white text-xs font-semibold inline-flex items-center justify-center transition-colors whitespace-nowrap"
                    >
                      Use
                    </Link>
                  </div>
                </div>
              </div>
            ))}
          </div>
        </section>

        {/* Free vs Premium Comparison Section */}
        <section
          id="pricing"
          className="border-t border-slate-200 dark:border-slate-800 bg-slate-50/70 dark:bg-slate-900/50 py-20"
        >
          <div className="max-w-5xl mx-auto px-4 sm:px-6">
            <div className="max-w-2xl mb-12">
              <h2 className="text-3xl sm:text-4xl font-bold tracking-tight text-slate-950 dark:text-white text-balance">
                Simple, transparent plans enforced fairly
              </h2>
              <p className="mt-3 text-base text-slate-600 dark:text-slate-400">
                Start for free with no credit card required. Upgrade when you need expanded link
                capacity, signature Light &amp; Dark themes, and custom search metadata.
              </p>
            </div>

            <div className="grid grid-cols-1 md:grid-cols-2 gap-6 items-stretch">
              {/* Free Plan */}
              <div className="rounded-2xl border border-slate-200 dark:border-slate-800 bg-white dark:bg-slate-900 p-8 flex flex-col justify-between">
                <div>
                  <p className="text-xs font-semibold text-slate-500 dark:text-slate-400">
                    For individual creators
                  </p>
                  <h3 className="mt-1 text-2xl font-bold text-slate-900 dark:text-white">
                    Free Plan
                  </h3>
                  <div className="mt-4 flex items-baseline gap-1.5">
                    <span className="text-4xl font-bold text-slate-950 dark:text-white tabular-nums">
                      $0
                    </span>
                    <span className="text-sm text-slate-500 dark:text-slate-400">/ forever</span>
                  </div>
                  <p className="mt-3 text-sm text-slate-600 dark:text-slate-300">
                    Everything you need to launch a clean, reliable public bio page today.
                  </p>

                  <ul className="mt-6 space-y-3 text-sm text-slate-700 dark:text-slate-300 border-t border-slate-100 dark:border-slate-800 pt-6">
                    <li className="flex items-center gap-2.5">
                      <Check className="w-4 h-4 text-emerald-600 dark:text-emerald-400 shrink-0" />
                      <span>
                        1 public Linkora page, availability status &amp; visitor theme switch
                      </span>
                    </li>
                    <li className="flex items-center gap-2.5">
                      <Check className="w-4 h-4 text-emerald-600 dark:text-emerald-400 shrink-0" />
                      <span className="tabular-nums">
                        Up to {settings.freeMaxLinks} rich cards with inline YouTube/Spotify &amp;
                        schedules
                      </span>
                    </li>
                    <li className="flex items-center gap-2.5">
                      <Check className="w-4 h-4 text-emerald-600 dark:text-emerald-400 shrink-0" />
                      <span className="tabular-nums">
                        {freeThemeCount} Free Light &amp; Dark themes + custom colors &amp; shapes
                      </span>
                    </li>
                    <li className="flex items-center gap-2.5">
                      <Check className="w-4 h-4 text-emerald-600 dark:text-emerald-400 shrink-0" />
                      <span>
                        Save Contact (.vcf), Creator Tip Jar &amp; Visitor Lead Capture inbox
                      </span>
                    </li>
                    <li className="flex items-center gap-2.5">
                      <Check className="w-4 h-4 text-emerald-600 dark:text-emerald-400 shrink-0" />
                      <span>Branded QR Share Card &amp; 7-day analytics with CSV export</span>
                    </li>
                  </ul>
                </div>

                <Link
                  to={firebaseUser ? '/dashboard' : '/signup'}
                  className="mt-8 w-full min-h-[46px] px-5 py-3 rounded-xl bg-slate-900 dark:bg-slate-800 hover:bg-slate-800 dark:hover:bg-slate-700 text-white text-sm font-semibold flex items-center justify-center transition-colors"
                >
                  {firebaseUser ? 'Go to Your Dashboard' : 'Start Free Today'}
                </Link>
              </div>

              {/* Premium Plan */}
              <div className="rounded-2xl border-2 border-indigo-600 dark:border-indigo-500 bg-white dark:bg-slate-900 p-8 flex flex-col justify-between">
                <div>
                  <p className="text-xs font-semibold text-indigo-600 dark:text-indigo-400">
                    For growing brands, studios &amp; sellers
                  </p>
                  <h3 className="mt-1 text-2xl font-bold text-slate-900 dark:text-white">
                    Premium Plan
                  </h3>
                  <div className="mt-4 flex items-baseline gap-1.5">
                    <span className="text-4xl font-bold text-slate-950 dark:text-white tabular-nums">
                      ${settings.premiumPriceMonthly}
                    </span>
                    <span className="text-sm text-slate-500 dark:text-slate-400">/ month</span>
                  </div>
                  <p className="mt-3 text-sm text-slate-600 dark:text-slate-300">
                    Higher link capacity, all {enabledThemes.length} signature themes, custom SEO
                    metadata, and 30-day referrer/device insights.
                  </p>

                  <ul className="mt-6 space-y-3 text-sm text-slate-700 dark:text-slate-300 border-t border-slate-100 dark:border-slate-800 pt-6">
                    <li className="flex items-center gap-2.5">
                      <Check className="w-4 h-4 text-indigo-600 dark:text-indigo-400 shrink-0" />
                      <span className="tabular-nums">
                        Up to {settings.premiumMaxLinks} rich destination cards, embeds &amp;
                        scheduled drops
                      </span>
                    </li>
                    <li className="flex items-center gap-2.5">
                      <Check className="w-4 h-4 text-indigo-600 dark:text-indigo-400 shrink-0" />
                      <span className="tabular-nums">
                        All {enabledThemes.length} themes including Emerald Luxe, Cyber Aurora &amp;
                        Midnight Gold
                      </span>
                    </li>
                    <li className="flex items-center gap-2.5">
                      <Check className="w-4 h-4 text-indigo-600 dark:text-indigo-400 shrink-0" />
                      <span>Custom SEO page title &amp; Open Graph meta description</span>
                    </li>
                    <li className="flex items-center gap-2.5">
                      <Check className="w-4 h-4 text-indigo-600 dark:text-indigo-400 shrink-0" />
                      <span>Expanded 14 &amp; 30-day analytics, device &amp; referrer breakdown</span>
                    </li>
                    <li className="flex items-center gap-2.5">
                      <Check className="w-4 h-4 text-indigo-600 dark:text-indigo-400 shrink-0" />
                      <span>Priority support &amp; verified manual payment protection</span>
                    </li>
                  </ul>
                </div>

                <Link
                  to={firebaseUser ? '/dashboard?tab=subscription' : '/signup'}
                  className="mt-8 w-full min-h-[46px] px-5 py-3 rounded-xl bg-indigo-600 hover:bg-indigo-700 text-white text-sm font-semibold flex items-center justify-center transition-colors"
                >
                  View Upgrade Details
                </Link>
              </div>
            </div>
          </div>
        </section>

        {/* FAQ Section */}
        <section id="faq" className="max-w-3xl mx-auto px-4 sm:px-6 py-20">
          <div className="mb-10">
            <h2 className="text-3xl font-bold tracking-tight text-slate-950 dark:text-white">
              Frequently asked questions
            </h2>
            <p className="mt-2 text-base text-slate-600 dark:text-slate-400">
              Clear answers about usernames, privacy, customization, and plans.
            </p>
          </div>

          <div className="divide-y divide-slate-200 dark:divide-slate-800 border-y border-slate-200 dark:border-slate-800">
            {faqs.map((faq) => {
              const expanded = openFaqId === faq.id;
              return (
                <div key={faq.id} className="py-5">
                  <button
                    type="button"
                    onClick={() => setOpenFaqId(expanded ? '' : faq.id)}
                    aria-expanded={expanded}
                    className="w-full flex items-center justify-between gap-4 text-left cursor-pointer"
                  >
                    <span className="text-base font-semibold text-slate-900 dark:text-white">
                      {faq.question}
                    </span>
                    <ChevronDown
                      className={`w-4 h-4 text-slate-500 dark:text-slate-400 shrink-0 transition-transform duration-150 ${
                        expanded ? 'rotate-180' : ''
                      }`}
                      aria-hidden="true"
                    />
                  </button>
                  {expanded && (
                    <p className="mt-3 text-sm text-slate-600 dark:text-slate-300 leading-relaxed pr-6">
                      {faq.answer}
                    </p>
                  )}
                </div>
              );
            })}
          </div>
        </section>
      </main>

      {/* Quiet Footer */}
      <footer className="border-t border-slate-200 dark:border-slate-800 bg-white dark:bg-slate-950">
        <div className="max-w-6xl mx-auto px-4 sm:px-6 py-10 flex flex-col sm:flex-row items-start sm:items-center justify-between gap-6">
          <div>
            <p className="text-base font-bold tracking-tight text-slate-950 dark:text-white">
              Linkora
            </p>
            <p className="mt-1 text-xs text-slate-500 dark:text-slate-400">
              © {new Date().getFullYear()} Linkora. Your Links, One Beautiful Page.
            </p>
          </div>

          <div className="flex flex-wrap items-center gap-6">
            <nav
              aria-label="Footer"
              className="flex flex-wrap items-center gap-6 text-xs font-medium text-slate-600 dark:text-slate-400"
            >
              <Link
                to="/about"
                className="hover:text-slate-950 dark:hover:text-white transition-colors whitespace-nowrap"
              >
                About
              </Link>
              <Link
                to="/privacy"
                className="hover:text-slate-950 dark:hover:text-white transition-colors whitespace-nowrap"
              >
                Privacy Policy
              </Link>
              <Link
                to="/terms"
                className="hover:text-slate-950 dark:hover:text-white transition-colors whitespace-nowrap"
              >
                Terms
              </Link>
              <Link
                to="/contact"
                className="hover:text-slate-950 dark:hover:text-white transition-colors whitespace-nowrap"
              >
                Contact
              </Link>
            </nav>
            <ThemeToggleButton />
          </div>
        </div>
      </footer>
    </div>
  );
};

const MiniThemeCard: React.FC<{ themeId: ThemeId }> = ({ themeId }) => {
  const theme = BUILT_IN_THEMES.find((t) => t.id === themeId) || BUILT_IN_THEMES[0];
  const scope = `mini-swatch-${themeId}`;
  const css = `
    .${scope} {
      background-color: ${theme.bgColor};
      ${theme.bgGradient ? `background-image: ${theme.bgGradient};` : ''}
      color: ${theme.textColor};
    }
    .${scope} .mini-bar {
      background-color: ${theme.buttonColor};
      opacity: ${theme.defaultStyle === 'glass' ? '0.28' : '1'};
    }
  `;
  const shape =
    theme.defaultShape === 'pill'
      ? 'rounded-full'
      : theme.defaultShape === 'sharp'
      ? 'rounded-none'
      : 'rounded-md';

  return (
    <div
      className={`${scope} h-36 rounded-xl p-4 flex flex-col items-center justify-center border border-black/5 dark:border-white/10`}
    >
      <style>{css}</style>
      <div className="w-8 h-8 rounded-full bg-current/20 mb-2" />
      <div className="w-20 h-2 rounded-full bg-current/40 mb-3" />
      <div className="w-full max-w-[150px] space-y-1.5">
        <div className={`mini-bar h-5 w-full ${shape}`} />
        <div className={`mini-bar h-5 w-full ${shape}`} />
      </div>
    </div>
  );
};
