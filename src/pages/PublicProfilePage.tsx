import React, { useEffect, useState } from 'react';
import { Link, useParams } from 'react-router-dom';
import { CheckCircle2, EyeOff, SearchX, X } from 'lucide-react';
import { BioPageRenderer } from '../components/BioPageRenderer';
import { QrShareModal } from '../components/QrShareModal';
import {
  fetchPublicProfileByUsername,
  PublicPageResult,
  recordPublicInteraction,
  submitProfileReport,
} from '../lib/firestoreService';
import { normalizeUsername } from '../lib/validation';
import { BioLink, ReportReason } from '../types/linkora';

function setMetaTag(attr: 'name' | 'property', key: string, content: string) {
  let el = document.querySelector(`meta[${attr}="${key}"]`) as HTMLMetaElement | null;
  if (!el) {
    el = document.createElement('meta');
    el.setAttribute(attr, key);
    document.head.appendChild(el);
  }
  el.setAttribute('content', content);
}

export const PublicProfilePage: React.FC = () => {
  const { username = '' } = useParams<{ username: string }>();
  const cleanSlug = normalizeUsername(username);

  const [loading, setLoading] = useState(true);
  const [result, setResult] = useState<PublicPageResult>({ status: 'not_found' });
  const [shareOpen, setShareOpen] = useState(false);

  // Report modal state
  const [reportOpen, setReportOpen] = useState(false);
  const [reportReason, setReportReason] = useState<ReportReason>('spam');
  const [reportDetails, setReportDetails] = useState('');
  const [reportBusy, setReportBusy] = useState(false);
  const [reportError, setReportError] = useState('');
  const [reportSuccess, setReportSuccess] = useState(false);

  useEffect(() => {
    let active = true;
    setLoading(true);

    fetchPublicProfileByUsername(cleanSlug).then((res) => {
      if (!active) return;
      setResult(res);
      setLoading(false);

      if (res.status === 'published') {
        const title =
          res.profile.seoTitle || `${res.profile.displayName} (@${res.profile.username}) – Linkora`;
        const desc =
          res.profile.seoDescription ||
          res.profile.bio ||
          `Explore official links and contacts from ${res.profile.displayName} on Linkora.`;

        document.title = title;
        setMetaTag('name', 'description', desc);
        setMetaTag('property', 'og:title', title);
        setMetaTag('property', 'og:description', desc);
        setMetaTag('name', 'twitter:title', title);
        setMetaTag('name', 'twitter:description', desc);

        void recordPublicInteraction(res.profile.uid, 'view');
      } else if (res.status === 'unpublished') {
        document.title = `@${cleanSlug} – Page Unavailable · Linkora`;
      } else {
        document.title = `Page Not Found – Linkora`;
      }
    });

    return () => {
      active = false;
    };
  }, [cleanSlug]);

  const handleLinkClick = (link: BioLink) => {
    if (result.status !== 'published') return;
    void recordPublicInteraction(result.profile.uid, 'click', {
      id: link.id,
      title: link.title,
    });
  };

  const handleCtaClick = () => {
    if (result.status !== 'published') return;
    void recordPublicInteraction(result.profile.uid, 'click', {
      id: 'cta_primary',
      title: result.profile.ctaLabel || 'Featured Action',
      isCta: true,
    });
  };

  const handleReportSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (result.status !== 'published') return;
    setReportBusy(true);
    setReportError('');
    try {
      await submitProfileReport({
        reportedUid: result.profile.uid,
        reportedUsername: result.profile.username,
        reason: reportReason,
        details: reportDetails,
      });
      setReportSuccess(true);
      setReportDetails('');
    } catch (err) {
      setReportError(err instanceof Error ? err.message : 'Unable to submit report.');
    } finally {
      setReportBusy(false);
    }
  };

  if (loading) {
    return (
      <div className="min-h-screen bg-slate-50 flex flex-col items-center pt-16 px-5">
        <div className="w-full max-w-md flex flex-col items-center animate-pulse">
          <div className="w-24 h-24 rounded-full bg-slate-200 mb-4" />
          <div className="h-6 w-44 rounded-lg bg-slate-200 mb-2" />
          <div className="h-4 w-28 rounded-lg bg-slate-200 mb-6" />
          <div className="w-full space-y-3">
            <div className="h-13 w-full rounded-xl bg-slate-200" />
            <div className="h-13 w-full rounded-xl bg-slate-200" />
            <div className="h-13 w-full rounded-xl bg-slate-200" />
          </div>
        </div>
      </div>
    );
  }

  if (result.status === 'not_found') {
    return (
      <div className="min-h-screen bg-slate-50 flex flex-col items-center justify-center p-6 text-center">
        <div className="max-w-md w-full bg-white border border-slate-200 rounded-2xl p-8 shadow-xs">
          <div className="w-12 h-12 rounded-2xl bg-slate-100 text-slate-700 flex items-center justify-center mx-auto mb-4">
            <SearchX className="w-6 h-6" />
          </div>
          <h1 className="text-xl font-bold text-slate-950">This Linkora page doesn’t exist</h1>
          <p className="mt-2 text-sm text-slate-600 leading-relaxed">
            No public profile was found at{' '}
            <span className="font-mono font-semibold text-slate-900">
              /{cleanSlug || username}
            </span>
            . Want to claim this username for yourself?
          </p>
          <div className="mt-6 flex flex-col sm:flex-row items-center justify-center gap-3">
            {cleanSlug.length >= 3 && (
              <Link
                to={`/signup?username=${encodeURIComponent(cleanSlug)}`}
                className="w-full sm:w-auto min-h-[42px] px-5 py-2.5 rounded-xl bg-indigo-600 hover:bg-indigo-700 text-white text-xs font-semibold flex items-center justify-center transition-colors"
              >
                Claim @{cleanSlug}
              </Link>
            )}
            <Link
              to="/"
              className="w-full sm:w-auto min-h-[42px] px-5 py-2.5 rounded-xl border border-slate-200 text-slate-700 hover:bg-slate-50 text-xs font-semibold flex items-center justify-center transition-colors"
            >
              Go to Linkora Home
            </Link>
          </div>
        </div>
      </div>
    );
  }

  if (result.status === 'unpublished') {
    return (
      <div className="min-h-screen bg-slate-50 flex flex-col items-center justify-center p-6 text-center">
        <div className="max-w-md w-full bg-white border border-slate-200 rounded-2xl p-8 shadow-xs">
          <div className="w-12 h-12 rounded-2xl bg-amber-50 text-amber-600 flex items-center justify-center mx-auto mb-4">
            <EyeOff className="w-6 h-6" />
          </div>
          <h1 className="text-xl font-bold text-slate-950">Page currently unavailable</h1>
          <p className="mt-2 text-sm text-slate-600 leading-relaxed">
            The page <span className="font-mono font-semibold">@{result.username}</span> is
            currently unpublished or temporarily unavailable. Please check back later.
          </p>
          <Link
            to="/"
            className="mt-6 inline-flex min-h-[42px] px-5 py-2.5 rounded-xl bg-slate-900 hover:bg-slate-800 text-white text-xs font-semibold items-center justify-center transition-colors"
          >
            Create Your Own Linkora Page
          </Link>
        </div>
      </div>
    );
  }

  return (
    <>
      <BioPageRenderer
        profile={result.profile}
        links={result.links}
        onLinkClick={handleLinkClick}
        onCtaClick={handleCtaClick}
        onOpenShare={() => setShareOpen(true)}
        onOpenReport={() => {
          setReportSuccess(false);
          setReportError('');
          setReportOpen(true);
        }}
      />

      <QrShareModal
        isOpen={shareOpen}
        onClose={() => setShareOpen(false)}
        username={result.profile.username}
        displayName={result.profile.displayName}
      />

      {reportOpen && (
        <div
          role="dialog"
          aria-modal="true"
          aria-labelledby="report-modal-title"
          className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-slate-950/60 backdrop-blur-xs"
        >
          <div className="w-full max-w-md rounded-2xl bg-white border border-slate-200 p-6 shadow-xl text-slate-900">
            <div className="flex items-center justify-between gap-4 mb-4">
              <h2 id="report-modal-title" className="text-base font-bold text-slate-950">
                Report @{result.profile.username}
              </h2>
              <button
                type="button"
                onClick={() => setReportOpen(false)}
                aria-label="Close report modal"
                className="w-8 h-8 rounded-lg flex items-center justify-center text-slate-500 hover:bg-slate-100 cursor-pointer"
              >
                <X className="w-4 h-4" />
              </button>
            </div>

            {reportSuccess ? (
              <div className="py-4 space-y-3">
                <div className="flex items-start gap-2.5 text-emerald-700 bg-emerald-50 border border-emerald-200 rounded-xl p-4 text-xs">
                  <CheckCircle2 className="w-4 h-4 shrink-0 mt-0.5" />
                  <span>
                    Thank you. Your report has been logged for moderator review by the Linkora Trust
                    &amp; Safety team.
                  </span>
                </div>
                <button
                  type="button"
                  onClick={() => setReportOpen(false)}
                  className="w-full min-h-[40px] rounded-xl bg-slate-900 text-white text-xs font-semibold cursor-pointer"
                >
                  Done
                </button>
              </div>
            ) : (
              <form onSubmit={handleReportSubmit} className="space-y-4">
                {reportError && (
                  <div className="p-3 rounded-xl bg-red-50 border border-red-200 text-xs text-red-700">
                    {reportError}
                  </div>
                )}

                <div>
                  <label
                    htmlFor="report-reason"
                    className="block text-xs font-semibold text-slate-700 mb-1.5"
                  >
                    Reason for report
                  </label>
                  <select
                    id="report-reason"
                    value={reportReason}
                    onChange={(e) => setReportReason(e.target.value as ReportReason)}
                    className="w-full min-h-[42px] px-3 py-2 rounded-xl border border-slate-300 text-sm bg-white"
                  >
                    <option value="spam">Spam or deceptive redirects</option>
                    <option value="phishing">Phishing or malware link</option>
                    <option value="impersonation">Impersonation of a person or brand</option>
                    <option value="inappropriate">Harmful or inappropriate content</option>
                    <option value="other">Other terms violation</option>
                  </select>
                </div>

                <div>
                  <label
                    htmlFor="report-details"
                    className="block text-xs font-semibold text-slate-700 mb-1.5"
                  >
                    Additional context
                  </label>
                  <textarea
                    id="report-details"
                    rows={3}
                    required
                    minLength={5}
                    maxLength={500}
                    value={reportDetails}
                    onChange={(e) => setReportDetails(e.target.value)}
                    placeholder="Briefly describe which link or content violates platform guidelines..."
                    className="w-full p-3 rounded-xl border border-slate-300 text-sm"
                  />
                </div>

                <div className="flex items-center justify-end gap-2 pt-2">
                  <button
                    type="button"
                    onClick={() => setReportOpen(false)}
                    className="min-h-[40px] px-4 py-2 rounded-xl border border-slate-200 text-xs font-semibold text-slate-700 cursor-pointer"
                  >
                    Cancel
                  </button>
                  <button
                    type="submit"
                    disabled={reportBusy}
                    className="min-h-[40px] px-4 py-2 rounded-xl bg-red-600 hover:bg-red-700 text-white text-xs font-semibold cursor-pointer disabled:opacity-50"
                  >
                    {reportBusy ? 'Submitting...' : 'Submit Report'}
                  </button>
                </div>
              </form>
            )}
          </div>
        </div>
      )}
    </>
  );
};
