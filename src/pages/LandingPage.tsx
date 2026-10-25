import React, { useEffect, useState } from 'react';
import { Link, useNavigate } from 'react-router-dom';
import {
  ArrowRight,
  BarChart3,
  Check,
  ChevronDown,
  Globe,
  Layers,
  Menu,
  QrCode,
  ShieldCheck,
  Smartphone,
  X,
} from 'lucide-react';
import creatorSampleAvatar from '../assets/images/avatar_sample_creator_1792771608665.jpg';
import creatorSaraAvatar from '../assets/images/avatar_creator_sara_1792771608674.jpg';
import creatorDavidAvatar from '../assets/images/avatar_creator_david_1792771608347.jpg';
import { BioPageRenderer } from '../components/BioPageRenderer';
import { useAuth } from '../context/AuthContext';
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
    title: 'Product Design Portfolio & Case Studies',
    url: 'https://example.com/portfolio',
    platform: 'portfolio',
    isSocialIcon: false,
    enabled: true,
    isProfilePublished: true,
    order: 0,
    clicks: 148,
  },
  {
    id: 'sample_2',
    uid: 'sample',
    title: 'Latest YouTube Breakdown: Design Systems',
    url: 'https://youtube.com',
    platform: 'youtube',
    isSocialIcon: true,
    enabled: true,
    isProfilePublished: true,
    order: 1,
    clicks: 94,
  },
  {
    id: 'sample_3',
    uid: 'sample',
    title: 'Message on WhatsApp for Project Inquiries',
    url: 'https://wa.me/15550192834',
    platform: 'whatsapp',
    isSocialIcon: true,
    enabled: true,
    isProfilePublished: true,
    order: 2,
    clicks: 67,
  },
  {
    id: 'sample_4',
    uid: 'sample',
    title: 'Figma Component Kit & Digital Store',
    url: 'https://example.com/shop',
    platform: 'shop',
    isSocialIcon: false,
    enabled: true,
    isProfilePublished: true,
    order: 3,
    clicks: 112,
  },
  {
    id: 'sample_5',
    uid: 'sample',
    title: 'Connect on LinkedIn',
    url: 'https://linkedin.com',
    platform: 'linkedin',
    isSocialIcon: true,
    enabled: true,
    isProfilePublished: true,
    order: 4,
    clicks: 53,
  },
];

export const LandingPage: React.FC = () => {
  const { firebaseUser } = useAuth();
  const navigate = useNavigate();

  const [mobileMenuOpen, setMobileMenuOpen] = useState(false);
  const [claimSlug, setClaimSlug] = useState('');
  const [sampleTheme, setSampleTheme] = useState<ThemeId>('minimal-white');
  const [templateFilter, setTemplateFilter] = useState<'all' | 'free' | 'premium'>('all');
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

  const visibleThemes = BUILT_IN_THEMES.filter(
    (t) =>
      !settings.disabledThemes.includes(t.id) &&
      (templateFilter === 'all' || t.tier === templateFilter)
  );

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
    <div id="top" className="min-h-screen bg-white text-slate-900 flex flex-col">
      {/* Top Bar Contract: 3 exact zones separated by gap-8 */}
      <header className="sticky top-0 z-40 bg-white/95 backdrop-blur-md border-b border-slate-200">
        <div className="max-w-6xl mx-auto px-4 sm:px-6 h-16 flex items-center justify-between gap-8">
          {/* Zone 1: Single wordmark */}
          <a
            href="#top"
            className="text-lg font-bold tracking-tight text-slate-950 whitespace-nowrap shrink-0"
          >
            Linkora
          </a>

          {/* Zone 2: 5 concise single-line text links */}
          <nav
            aria-label="Primary"
            className="hidden md:flex items-center gap-7 text-sm font-medium text-slate-600"
          >
            <a
              href="#top"
              className="hover:text-slate-950 hover:underline underline-offset-4 transition-colors whitespace-nowrap shrink-0"
            >
              Home
            </a>
            <a
              href="#features"
              className="hover:text-slate-950 hover:underline underline-offset-4 transition-colors whitespace-nowrap shrink-0"
            >
              Features
            </a>
            <a
              href="#templates"
              className="hover:text-slate-950 hover:underline underline-offset-4 transition-colors whitespace-nowrap shrink-0"
            >
              Templates
            </a>
            <a
              href="#pricing"
              className="hover:text-slate-950 hover:underline underline-offset-4 transition-colors whitespace-nowrap shrink-0"
            >
              Pricing
            </a>
            <Link
              to={firebaseUser ? '/dashboard' : '/login'}
              className="hover:text-slate-950 hover:underline underline-offset-4 transition-colors whitespace-nowrap shrink-0"
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
              className="md:hidden w-10 h-10 rounded-lg border border-slate-200 flex items-center justify-center text-slate-700 hover:bg-slate-50 cursor-pointer"
            >
              {mobileMenuOpen ? <X className="w-5 h-5" /> : <Menu className="w-5 h-5" />}
            </button>
          </div>
        </div>

        {/* Mobile Navigation Drawer */}
        {mobileMenuOpen && (
          <div className="md:hidden border-t border-slate-200 bg-white px-4 py-4 space-y-3">
            <div className="flex flex-col space-y-2.5 text-sm font-medium text-slate-700">
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
            <Link
              to={firebaseUser ? '/dashboard' : '/signup'}
              onClick={() => setMobileMenuOpen(false)}
              className="w-full min-h-[44px] px-4 py-2.5 rounded-lg bg-indigo-600 text-white text-sm font-semibold flex items-center justify-center"
            >
              {firebaseUser ? 'Open Dashboard' : 'Create Your Free Page'}
            </Link>
          </div>
        )}
      </header>

      <main className="flex-1">
        {/* Hero Section */}
        <section className="max-w-6xl mx-auto px-4 sm:px-6 pt-12 pb-20 lg:pt-20 lg:pb-24">
          <div className="grid grid-cols-1 lg:grid-cols-12 gap-12 lg:gap-10 items-center">
            {/* Left Copy & Claim Form */}
            <div className="lg:col-span-7">
              <p className="text-xs font-semibold text-indigo-600 tracking-normal mb-3">
                Your Links · One Public URL · Built for Mobile
              </p>
              <h1 className="text-4xl sm:text-5xl lg:text-[3.5rem] font-bold tracking-tight text-slate-950 leading-[1.08] text-balance">
                {settings.heroHeadline}
              </h1>
              <p className="mt-5 text-base sm:text-lg text-slate-600 leading-relaxed max-w-xl">
                {settings.heroSubheadline}
              </p>

              {/* Interactive Slug Claim Form */}
              <form
                onSubmit={handleClaimSubmit}
                className="mt-8 flex flex-col sm:flex-row items-stretch sm:items-center gap-3 max-w-xl"
              >
                <div className="flex-1 flex items-center rounded-xl border border-slate-300 bg-slate-50/70 px-3.5 min-h-[48px] focus-within:border-indigo-600 focus-within:bg-white transition-colors">
                  <span className="text-sm font-mono text-slate-500 select-none shrink-0">
                    linkora.app/
                  </span>
                  <input
                    type="text"
                    value={claimSlug}
                    onChange={(e) => setClaimSlug(normalizeUsername(e.target.value))}
                    placeholder="usman"
                    aria-label="Desired Linkora username"
                    className="w-full bg-transparent text-sm font-mono text-slate-900 placeholder:text-slate-400 focus:outline-none py-2"
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

              <div className="mt-4 flex flex-wrap items-center gap-5 text-sm">
                <a
                  href="#templates"
                  className="font-semibold text-slate-700 hover:text-indigo-600 inline-flex items-center gap-1.5 transition-colors whitespace-nowrap"
                >
                  <span>Explore Templates</span>
                  <ArrowRight className="w-3.5 h-3.5" aria-hidden="true" />
                </a>
                <span className="text-slate-300" aria-hidden="true">
                  ·
                </span>
                <span className="text-xs text-slate-500">
                  Free plan includes 10 links, QR code &amp; visit analytics
                </span>
              </div>
            </div>

            {/* Right Interactive Live Sample Bio Page */}
            <div className="lg:col-span-5 flex flex-col items-center">
              <div className="w-full max-w-[360px] rounded-[2rem] p-2.5 bg-slate-900 shadow-xl border border-slate-800">
                <div className="flex items-center justify-between px-4 py-2 text-[11px] font-mono text-slate-400">
                  <span>linkora.app/usman</span>
                  <span>Live Preview</span>
                </div>
                <BioPageRenderer
                  compactPreview
                  profile={{
                    username: 'usman',
                    displayName: 'Usman Malik',
                    bio: 'Independent Product Designer & Educator helping founders ship clear digital products.',
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
                    isPublished: true,
                  }}
                  links={SAMPLE_LINKS}
                />
              </div>

              {/* Interactive Sample Theme Switcher */}
              <div
                role="group"
                aria-label="Preview sample themes"
                className="mt-4 flex flex-wrap items-center justify-center gap-1.5 p-1.5 rounded-xl bg-slate-100 border border-slate-200"
              >
                {(['minimal-white', 'dark-pro', 'gradient-dream', 'glassmorphism'] as ThemeId[]).map(
                  (tid) => {
                    const meta = BUILT_IN_THEMES.find((t) => t.id === tid)!;
                    const active = sampleTheme === tid;
                    return (
                      <button
                        key={tid}
                        type="button"
                        onClick={() => setSampleTheme(tid)}
                        className={`px-3 py-1.5 rounded-lg text-xs font-medium transition-colors cursor-pointer whitespace-nowrap shrink-0 ${
                          active
                            ? 'bg-white text-slate-950 shadow-xs'
                            : 'text-slate-600 hover:text-slate-900'
                        }`}
                      >
                        {meta.name}
                      </button>
                    );
                  }
                )}
              </div>
            </div>
          </div>
        </section>

        {/* Three-Step Workflow Strip */}
        <section className="border-y border-slate-200 bg-slate-50/70">
          <div className="max-w-6xl mx-auto px-4 sm:px-6 py-16">
            <div className="max-w-2xl mb-10">
              <h2 className="text-2xl sm:text-3xl font-bold tracking-tight text-slate-950 text-balance">
                Publish your page in under two minutes
              </h2>
              <p className="mt-2 text-sm sm:text-base text-slate-600">
                No layout coding, DNS configuration, or external plugins required.
              </p>
            </div>

            <div className="grid grid-cols-1 md:grid-cols-3 gap-8">
              <div className="border-t-2 border-slate-900 pt-5">
                <p className="text-xs font-mono text-indigo-600 font-semibold">01. Sign up</p>
                <h3 className="mt-2 text-lg font-bold text-slate-900">
                  Claim your unique Linkora slug
                </h3>
                <p className="mt-2 text-sm text-slate-600 leading-relaxed">
                  Register with Google or email and reserve your personal URL like{' '}
                  <span className="font-mono text-slate-800">linkora.app/usman</span> backed by
                  transactional duplicate protection.
                </p>
              </div>

              <div className="border-t-2 border-slate-200 pt-5">
                <p className="text-xs font-mono text-indigo-600 font-semibold">02. Customize</p>
                <h3 className="mt-2 text-lg font-bold text-slate-900">
                  Add links, WhatsApp &amp; brand styling
                </h3>
                <p className="mt-2 text-sm text-slate-600 leading-relaxed">
                  Organize your social channels, portfolio, online shop, direct WhatsApp chat, and
                  featured call-to-action with instant mobile previewing.
                </p>
              </div>

              <div className="border-t-2 border-slate-200 pt-5">
                <p className="text-xs font-mono text-indigo-600 font-semibold">03. Share</p>
                <h3 className="mt-2 text-lg font-bold text-slate-900">
                  Place one link across every bio
                </h3>
                <p className="mt-2 text-sm text-slate-600 leading-relaxed">
                  Paste your URL into Instagram, TikTok, YouTube, and LinkedIn—or download your
                  custom QR code for business cards and product packaging.
                </p>
              </div>
            </div>
          </div>
        </section>

        {/* Asymmetric Bento Feature Section */}
        <section id="features" className="max-w-6xl mx-auto px-4 sm:px-6 py-20">
          <div className="max-w-2xl mb-12">
            <h2 className="text-3xl sm:text-4xl font-bold tracking-tight text-slate-950 text-balance">
              Everything creators and businesses need in one clean workspace
            </h2>
            <p className="mt-3 text-base text-slate-600">
              Built for speed on mobile networks, strict account security, and clear visitor
              conversion.
            </p>
          </div>

          <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
            <div className="md:col-span-2 rounded-2xl border border-slate-200 p-7 bg-white flex flex-col justify-between">
              <div>
                <div className="w-10 h-10 rounded-xl bg-indigo-50 text-indigo-600 flex items-center justify-center mb-5">
                  <Globe className="w-5 h-5" aria-hidden="true" />
                </div>
                <h3 className="text-xl font-bold text-slate-900">
                  01. Multi-destination links &amp; instant WhatsApp contact
                </h3>
                <p className="mt-2.5 text-sm sm:text-base text-slate-600 leading-relaxed max-w-xl">
                  Combine YouTube videos, Instagram profiles, portfolios, digital product stores,
                  mailto email links, direct phone buttons, and pre-filled WhatsApp inquiry links on
                  a single page. Reorder, pause, or highlight links in real time.
                </p>
              </div>
              <div className="mt-6 pt-5 border-t border-slate-100 flex flex-wrap items-center gap-3 text-xs text-slate-500">
                <span>14 Supported Link Types</span>
                <span aria-hidden="true">·</span>
                <span>Social Icon Row Pinning</span>
                <span aria-hidden="true">·</span>
                <span>Featured CTA Button</span>
              </div>
            </div>

            <div className="rounded-2xl border border-slate-200 p-7 bg-slate-50/60 flex flex-col justify-between">
              <div>
                <div className="w-10 h-10 rounded-xl bg-indigo-50 text-indigo-600 flex items-center justify-center mb-5">
                  <QrCode className="w-5 h-5" aria-hidden="true" />
                </div>
                <h3 className="text-xl font-bold text-slate-900">
                  02. Built-in QR codes &amp; native sharing
                </h3>
                <p className="mt-2.5 text-sm text-slate-600 leading-relaxed">
                  Every published Linkora page generates a downloadable high-contrast PNG QR code
                  ready for flyers, booths, menus, and packaging.
                </p>
              </div>
              <p className="mt-6 pt-5 border-t border-slate-200/70 text-xs text-slate-500">
                Zero external paid QR services required
              </p>
            </div>

            <div className="rounded-2xl border border-slate-200 p-7 bg-slate-50/60 flex flex-col justify-between">
              <div>
                <div className="w-10 h-10 rounded-xl bg-indigo-50 text-indigo-600 flex items-center justify-center mb-5">
                  <BarChart3 className="w-5 h-5" aria-hidden="true" />
                </div>
                <h3 className="text-xl font-bold text-slate-900">
                  03. Privacy-conscious click analytics
                </h3>
                <p className="mt-2.5 text-sm text-slate-600 leading-relaxed">
                  Track total profile visits, individual link clicks, click-through rate, and daily
                  trends without invasive third-party ad trackers.
                </p>
              </div>
              <p className="mt-6 pt-5 border-t border-slate-200/70 text-xs text-slate-500 tabular-nums">
                Daily &amp; 7-day trend breakdowns
              </p>
            </div>

            <div className="md:col-span-2 rounded-2xl border border-slate-200 p-7 bg-white flex flex-col justify-between">
              <div>
                <div className="w-10 h-10 rounded-xl bg-indigo-50 text-indigo-600 flex items-center justify-center mb-5">
                  <Layers className="w-5 h-5" aria-hidden="true" />
                </div>
                <h3 className="text-xl font-bold text-slate-900">
                  04. Fine-grained theme &amp; appearance control
                </h3>
                <p className="mt-2.5 text-sm sm:text-base text-slate-600 leading-relaxed max-w-xl">
                  Start from 8 curated themes and customize background colors, gradients, button
                  geometry, button styles, safe typography pairings, profile photo framing, and
                  layout width—with every adjustment reflected live before you publish.
                </p>
              </div>
              <div className="mt-6 pt-5 border-t border-slate-100 flex flex-wrap items-center gap-3 text-xs text-slate-500">
                <span className="inline-flex items-center gap-1.5">
                  <Smartphone className="w-3.5 h-3.5 text-slate-400" aria-hidden="true" />
                  Responsive down to 320px Android screens
                </span>
                <span aria-hidden="true">·</span>
                <span className="inline-flex items-center gap-1.5">
                  <ShieldCheck className="w-3.5 h-3.5 text-slate-400" aria-hidden="true" />
                  Sanitized URLs &amp; Firestore security isolation
                </span>
              </div>
            </div>
          </div>
        </section>

        {/* Proof / Attributable Creator Outcomes (Adjacent to Capabilities) */}
        <section className="bg-slate-950 text-white py-20">
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
              <article className="rounded-2xl border border-slate-800 bg-slate-900/70 p-7 flex flex-col justify-between">
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

              <article className="rounded-2xl border border-slate-800 bg-slate-900/70 p-7 flex flex-col justify-between">
                <div>
                  <p className="text-xs font-mono text-indigo-400 tabular-nums">
                    24.6% Bio Click-Through Rate Across 18k Monthly Visits
                  </p>
                  <blockquote className="mt-3 text-base text-slate-200 leading-relaxed">
                    “Switching from a cluttered multi-column website to Linkora’s Dark Pro theme
                    made our gear guides, sponsor links, and newsletter signup load instantaneously
                    inside mobile in-app browsers.”
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
          <div className="flex flex-col sm:flex-row sm:items-end justify-between gap-6 mb-10">
            <div>
              <h2 className="text-3xl sm:text-4xl font-bold tracking-tight text-slate-950 text-balance">
                8 built-in themes crafted for readability
              </h2>
              <p className="mt-2 text-base text-slate-600">
                Select any template to test it in the hero preview above, or start customizing
                immediately.
              </p>
            </div>

            {/* Functional Filter Controls */}
            <div
              role="group"
              aria-label="Filter templates by plan"
              className="inline-flex items-center gap-1 p-1 rounded-xl bg-slate-100 border border-slate-200 self-start"
            >
              {(['all', 'free', 'premium'] as const).map((tier) => (
                <button
                  key={tier}
                  type="button"
                  onClick={() => setTemplateFilter(tier)}
                  className={`px-3.5 py-1.5 rounded-lg text-xs font-semibold capitalize transition-colors cursor-pointer whitespace-nowrap shrink-0 ${
                    templateFilter === tier
                      ? 'bg-white text-slate-950 shadow-xs'
                      : 'text-slate-600 hover:text-slate-900'
                  }`}
                >
                  {tier === 'all' ? 'All Themes' : `${tier} Themes`}
                </button>
              ))}
            </div>
          </div>

          <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-5">
            {visibleThemes.map((theme) => (
              <div
                key={theme.id}
                className="rounded-2xl border border-slate-200 overflow-hidden bg-white flex flex-col justify-between hover:border-slate-300 transition-colors"
              >
                {/* Mini Visual Swatch */}
                <div className="p-4 border-b border-slate-100 bg-slate-50">
                  <MiniThemeCard themeId={theme.id} />
                </div>

                <div className="p-5 flex-1 flex flex-col justify-between">
                  <div>
                    <div className="flex items-center justify-between gap-2 text-xs text-slate-500 mb-1">
                      <span className="capitalize">{theme.tier} tier</span>
                      <span aria-hidden="true">·</span>
                      <span className="capitalize">{theme.defaultShape} buttons</span>
                    </div>
                    <h3 className="text-base font-bold text-slate-900">{theme.name}</h3>
                    <p className="mt-1.5 text-xs text-slate-600 leading-relaxed">
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
                      className="flex-1 min-h-[38px] px-3 py-1.5 rounded-lg border border-slate-200 text-xs font-semibold text-slate-700 hover:bg-slate-50 transition-colors cursor-pointer whitespace-nowrap"
                    >
                      Preview Above
                    </button>
                    <Link
                      to={firebaseUser ? '/dashboard' : `/signup?theme=${theme.id}`}
                      className="min-h-[38px] px-3 py-1.5 rounded-lg bg-slate-900 hover:bg-slate-800 text-white text-xs font-semibold inline-flex items-center justify-center transition-colors whitespace-nowrap"
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
        <section id="pricing" className="border-t border-slate-200 bg-slate-50/70 py-20">
          <div className="max-w-5xl mx-auto px-4 sm:px-6">
            <div className="max-w-2xl mb-12">
              <h2 className="text-3xl sm:text-4xl font-bold tracking-tight text-slate-950 text-balance">
                Simple, transparent plans enforced fairly
              </h2>
              <p className="mt-3 text-base text-slate-600">
                Start for free with no credit card required. Upgrade when you need expanded link
                capacity, premium themes, and custom search metadata.
              </p>
            </div>

            <div className="grid grid-cols-1 md:grid-cols-2 gap-6 items-stretch">
              {/* Free Plan */}
              <div className="rounded-2xl border border-slate-200 bg-white p-8 flex flex-col justify-between">
                <div>
                  <p className="text-xs font-semibold text-slate-500">For individual creators</p>
                  <h3 className="mt-1 text-2xl font-bold text-slate-900">Free Plan</h3>
                  <div className="mt-4 flex items-baseline gap-1.5">
                    <span className="text-4xl font-bold text-slate-950 tabular-nums">$0</span>
                    <span className="text-sm text-slate-500">/ forever</span>
                  </div>
                  <p className="mt-3 text-sm text-slate-600">
                    Everything you need to launch a clean, reliable public bio page today.
                  </p>

                  <ul className="mt-6 space-y-3 text-sm text-slate-700 border-t border-slate-100 pt-6">
                    <li className="flex items-center gap-2.5">
                      <Check className="w-4 h-4 text-emerald-600 shrink-0" />
                      <span>1 public Linkora page &amp; unique slug</span>
                    </li>
                    <li className="flex items-center gap-2.5">
                      <Check className="w-4 h-4 text-emerald-600 shrink-0" />
                      <span className="tabular-nums">
                        Up to {settings.freeMaxLinks} active destination links
                      </span>
                    </li>
                    <li className="flex items-center gap-2.5">
                      <Check className="w-4 h-4 text-emerald-600 shrink-0" />
                      <span>5 Basic themes + custom colors &amp; button shapes</span>
                    </li>
                    <li className="flex items-center gap-2.5">
                      <Check className="w-4 h-4 text-emerald-600 shrink-0" />
                      <span>WhatsApp, social icons, email &amp; phone links</span>
                    </li>
                    <li className="flex items-center gap-2.5">
                      <Check className="w-4 h-4 text-emerald-600 shrink-0" />
                      <span>QR code download &amp; core visit/click analytics</span>
                    </li>
                  </ul>
                </div>

                <Link
                  to={firebaseUser ? '/dashboard' : '/signup'}
                  className="mt-8 w-full min-h-[46px] px-5 py-3 rounded-xl bg-slate-900 hover:bg-slate-800 text-white text-sm font-semibold flex items-center justify-center transition-colors"
                >
                  {firebaseUser ? 'Go to Your Dashboard' : 'Start Free Today'}
                </Link>
              </div>

              {/* Premium Plan */}
              <div className="rounded-2xl border-2 border-indigo-600 bg-white p-8 flex flex-col justify-between">
                <div>
                  <p className="text-xs font-semibold text-indigo-600">
                    For growing brands, studios &amp; sellers
                  </p>
                  <h3 className="mt-1 text-2xl font-bold text-slate-900">Premium Plan</h3>
                  <div className="mt-4 flex items-baseline gap-1.5">
                    <span className="text-4xl font-bold text-slate-950 tabular-nums">
                      ${settings.premiumPriceMonthly}
                    </span>
                    <span className="text-sm text-slate-500">/ month</span>
                  </div>
                  <p className="mt-3 text-sm text-slate-600">
                    Higher link capacity, signature themes, custom SEO controls, and expanded
                    referrer/device insights.
                  </p>

                  <ul className="mt-6 space-y-3 text-sm text-slate-700 border-t border-slate-100 pt-6">
                    <li className="flex items-center gap-2.5">
                      <Check className="w-4 h-4 text-indigo-600 shrink-0" />
                      <span className="tabular-nums">
                        Up to {settings.premiumMaxLinks} destination links
                      </span>
                    </li>
                    <li className="flex items-center gap-2.5">
                      <Check className="w-4 h-4 text-indigo-600 shrink-0" />
                      <span>
                        All 8 themes including Glassmorphism, Creator Neon &amp; Pink Aesthetic
                      </span>
                    </li>
                    <li className="flex items-center gap-2.5">
                      <Check className="w-4 h-4 text-indigo-600 shrink-0" />
                      <span>Custom SEO page title &amp; meta description</span>
                    </li>
                    <li className="flex items-center gap-2.5">
                      <Check className="w-4 h-4 text-indigo-600 shrink-0" />
                      <span>Expanded 14-day analytics, device &amp; referrer breakdown</span>
                    </li>
                    <li className="flex items-center gap-2.5">
                      <Check className="w-4 h-4 text-indigo-600 shrink-0" />
                      <span>Priority support &amp; verified payment protection</span>
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
            <h2 className="text-3xl font-bold tracking-tight text-slate-950">
              Frequently asked questions
            </h2>
            <p className="mt-2 text-base text-slate-600">
              Clear answers about usernames, privacy, customization, and plans.
            </p>
          </div>

          <div className="divide-y divide-slate-200 border-y border-slate-200">
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
                    <span className="text-base font-semibold text-slate-900">{faq.question}</span>
                    <ChevronDown
                      className={`w-4 h-4 text-slate-500 shrink-0 transition-transform duration-150 ${
                        expanded ? 'rotate-180' : ''
                      }`}
                      aria-hidden="true"
                    />
                  </button>
                  {expanded && (
                    <p className="mt-3 text-sm text-slate-600 leading-relaxed pr-6">{faq.answer}</p>
                  )}
                </div>
              );
            })}
          </div>
        </section>
      </main>

      {/* Quiet Footer */}
      <footer className="border-t border-slate-200 bg-white">
        <div className="max-w-6xl mx-auto px-4 sm:px-6 py-10 flex flex-col sm:flex-row items-start sm:items-center justify-between gap-6">
          <div>
            <p className="text-base font-bold tracking-tight text-slate-950">Linkora</p>
            <p className="mt-1 text-xs text-slate-500">
              © {new Date().getFullYear()} Linkora. Your Links, One Beautiful Page.
            </p>
          </div>

          <nav aria-label="Footer" className="flex flex-wrap items-center gap-6 text-xs font-medium text-slate-600">
            <Link to="/about" className="hover:text-slate-950 transition-colors whitespace-nowrap">
              About
            </Link>
            <Link to="/privacy" className="hover:text-slate-950 transition-colors whitespace-nowrap">
              Privacy Policy
            </Link>
            <Link to="/terms" className="hover:text-slate-950 transition-colors whitespace-nowrap">
              Terms
            </Link>
            <Link to="/contact" className="hover:text-slate-950 transition-colors whitespace-nowrap">
              Contact
            </Link>
          </nav>
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
    <div className={`${scope} h-36 rounded-xl p-4 flex flex-col items-center justify-center border border-black/5`}>
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
