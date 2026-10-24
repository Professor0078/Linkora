import React, { useEffect, useState } from 'react';
import { Link } from 'react-router-dom';
import { ArrowLeft, CheckCircle2 } from 'lucide-react';

type DocType = 'privacy' | 'terms' | 'about' | 'contact';

export const LegalAndInfoPage: React.FC<{ page: DocType }> = ({ page }) => {
  const [contactName, setContactName] = useState('');
  const [contactEmail, setContactEmail] = useState('');
  const [contactMessage, setContactMessage] = useState('');
  const [submitted, setSubmitted] = useState(false);

  useEffect(() => {
    const titles: Record<DocType, string> = {
      privacy: 'Privacy Policy – Linkora',
      terms: 'Terms of Service – Linkora',
      about: 'About Linkora – Your Links, One Beautiful Page',
      contact: 'Contact Linkora',
    };
    document.title = titles[page];
    setSubmitted(false);
  }, [page]);

  const handleContactSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    if (!contactEmail.includes('@') || contactMessage.trim().length < 10) return;
    setSubmitted(true);
  };

  return (
    <div className="min-h-screen bg-white text-slate-900 flex flex-col">
      <header className="border-b border-slate-200">
        <div className="max-w-4xl mx-auto px-4 sm:px-6 h-16 flex items-center justify-between">
          <Link to="/" className="text-lg font-bold tracking-tight text-slate-950">
            Linkora
          </Link>
          <Link
            to="/"
            className="inline-flex items-center gap-1.5 text-xs font-semibold text-slate-600 hover:text-slate-950"
          >
            <ArrowLeft className="w-4 h-4" />
            <span>Back Home</span>
          </Link>
        </div>
      </header>

      <main className="flex-1 max-w-3xl w-full mx-auto px-4 sm:px-6 py-14">
        {page === 'privacy' && (
          <article className="space-y-6">
            <h1 className="text-3xl font-bold tracking-tight text-slate-950">Privacy Policy</h1>
            <p className="text-xs text-slate-500">Effective October 2026 · Linkora Platform</p>
            <section className="space-y-2 text-sm text-slate-700 leading-relaxed">
              <h2 className="text-base font-bold text-slate-900">1. Data Minimization</h2>
              <p>
                Linkora collects only the data necessary to operate your account and render your
                public bio page. Account email addresses and subscription records are stored in
                isolated Firestore collections readable only by the authenticated account owner and
                authorized platform administrators.
              </p>
            </section>
            <section className="space-y-2 text-sm text-slate-700 leading-relaxed">
              <h2 className="text-base font-bold text-slate-900">
                2. Public Bio Pages vs. Private Dashboard Data
              </h2>
              <p>
                Information you choose to publish on your bio page (display name, username slug,
                short bio, profile image, and enabled links) becomes publicly accessible while your
                page is set to Published. Unpublishing your page immediately blocks public read
                access to your profile configuration.
              </p>
            </section>
            <section className="space-y-2 text-sm text-slate-700 leading-relaxed">
              <h2 className="text-base font-bold text-slate-900">3. Privacy-Conscious Analytics</h2>
              <p>
                When visitors open a public Linkora page or click a link, Linkora records coarse
                interaction counters (date bucket, viewport class, and referrer domain hostname)
                without storing visitor IP addresses, tracking cookies, or cross-site behavioral
                profiles.
              </p>
            </section>
          </article>
        )}

        {page === 'terms' && (
          <article className="space-y-6">
            <h1 className="text-3xl font-bold tracking-tight text-slate-950">Terms of Service</h1>
            <p className="text-xs text-slate-500">Effective October 2026 · Linkora Platform</p>
            <section className="space-y-2 text-sm text-slate-700 leading-relaxed">
              <h2 className="text-base font-bold text-slate-900">1. Acceptable Use</h2>
              <p>
                You are responsible for all links and content published on your Linkora page. You
                may not publish phishing links, malware, impersonation pages, unlawful goods, or
                deceptive redirects. Reported pages violating these rules may be unpublished or
                suspended by platform administrators.
              </p>
            </section>
            <section className="space-y-2 text-sm text-slate-700 leading-relaxed">
              <h2 className="text-base font-bold text-slate-900">2. Username Reservations</h2>
              <p>
                Usernames are claimed on a first-come, transactional basis. Squatting on trademarked
                names for impersonation or resale is prohibited.
              </p>
            </section>
            <section className="space-y-2 text-sm text-slate-700 leading-relaxed">
              <h2 className="text-base font-bold text-slate-900">3. Free &amp; Premium Plans</h2>
              <p>
                Plan limits (such as link counts and premium theme availability) are enforced at the
                database security layer. Paid upgrades are only activated upon verified billing
                confirmation.
              </p>
            </section>
          </article>
        )}

        {page === 'about' && (
          <article className="space-y-6">
            <h1 className="text-3xl font-bold tracking-tight text-slate-950">About Linkora</h1>
            <p className="text-base text-slate-600 leading-relaxed">
              Linkora was created to give independent creators, freelancers, educators, YouTubers,
              and small businesses a fast, clutter-free home for every link they share online.
            </p>
            <div className="grid grid-cols-1 sm:grid-cols-2 gap-5 pt-4">
              <div className="rounded-xl border border-slate-200 p-5">
                <h2 className="text-sm font-bold text-slate-900">Mobile-First Speed</h2>
                <p className="mt-1.5 text-xs text-slate-600 leading-relaxed">
                  Designed specifically for social app browsers on Android and iOS, with clean
                  touch targets and instant visual clarity.
                </p>
              </div>
              <div className="rounded-xl border border-slate-200 p-5">
                <h2 className="text-sm font-bold text-slate-900">Security by Default</h2>
                <p className="mt-1.5 text-xs text-slate-600 leading-relaxed">
                  Strict URL validation, zero arbitrary script injection, and isolated Cloud
                  Firestore security rules protect both creators and visitors.
                </p>
              </div>
            </div>
          </article>
        )}

        {page === 'contact' && (
          <div className="space-y-6">
            <div>
              <h1 className="text-3xl font-bold tracking-tight text-slate-950">Contact Us</h1>
              <p className="mt-2 text-sm text-slate-600">
                Registered users can submit tracked tickets directly from{' '}
                <Link to="/dashboard?tab=support" className="text-indigo-600 font-semibold underline">
                  Dashboard → Help &amp; Support
                </Link>
                . For general inquiries, use the form below.
              </p>
            </div>

            {submitted ? (
              <div className="rounded-2xl border border-emerald-200 bg-emerald-50 p-6 flex items-start gap-3">
                <CheckCircle2 className="w-5 h-5 text-emerald-600 shrink-0 mt-0.5" />
                <div>
                  <h2 className="text-sm font-bold text-emerald-950">Message received</h2>
                  <p className="mt-1 text-xs text-emerald-800">
                    Thank you, {contactName || 'friend'}. For faster account-specific assistance,
                    sign in and open a ticket in Help &amp; Support.
                  </p>
                </div>
              </div>
            ) : (
              <form onSubmit={handleContactSubmit} className="space-y-4 max-w-lg">
                <div>
                  <label htmlFor="c-name" className="block text-xs font-semibold text-slate-700 mb-1">
                    Your Name
                  </label>
                  <input
                    id="c-name"
                    type="text"
                    required
                    value={contactName}
                    onChange={(e) => setContactName(e.target.value)}
                    className="w-full min-h-[42px] px-3.5 py-2 rounded-xl border border-slate-300 text-sm"
                  />
                </div>
                <div>
                  <label htmlFor="c-email" className="block text-xs font-semibold text-slate-700 mb-1">
                    Email Address
                  </label>
                  <input
                    id="c-email"
                    type="email"
                    required
                    value={contactEmail}
                    onChange={(e) => setContactEmail(e.target.value)}
                    className="w-full min-h-[42px] px-3.5 py-2 rounded-xl border border-slate-300 text-sm"
                  />
                </div>
                <div>
                  <label htmlFor="c-msg" className="block text-xs font-semibold text-slate-700 mb-1">
                    How can we help?
                  </label>
                  <textarea
                    id="c-msg"
                    rows={4}
                    required
                    minLength={10}
                    value={contactMessage}
                    onChange={(e) => setContactMessage(e.target.value)}
                    className="w-full p-3.5 rounded-xl border border-slate-300 text-sm"
                  />
                </div>
                <button
                  type="submit"
                  className="min-h-[44px] px-5 py-2.5 rounded-xl bg-indigo-600 hover:bg-indigo-700 text-white text-sm font-semibold cursor-pointer"
                >
                  Send Inquiry
                </button>
              </form>
            )}
          </div>
        )}
      </main>
    </div>
  );
};
