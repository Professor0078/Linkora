import React, { useEffect, useMemo, useState } from 'react';
import { Link, Navigate } from 'react-router-dom';
import {
  ArrowLeft,
  Check,
  CheckCircle2,
  CreditCard,
  ExternalLink,
  Eye,
  Flag,
  HelpCircle,
  LayoutGrid,
  Palette,
  Plus,
  RefreshCw,
  Save,
  Shield,
  Trash2,
  Users,
  X,
} from 'lucide-react';
import { ConfirmModal } from '../components/ConfirmModal';
import { useAuth } from '../context/AuthContext';
import {
  adminDeleteFaqItem,
  adminDeletePaymentMethod,
  adminGrantPrivilege,
  adminReplySupportTicket,
  adminReviewPaymentRequest,
  adminRevokePrivilege,
  adminSaveFaqItem,
  adminSavePaymentMethod,
  adminSavePlatformSettings,
  adminSetUserStatusAndPlan,
  adminUpdateReportStatus,
  DEFAULT_FAQS,
  DEFAULT_PLATFORM_SETTINGS,
  fetchAdminDashboardData,
} from '../lib/firestoreService';
import { BUILT_IN_THEMES } from '../lib/themes';
import {
  AdminRecord,
  FaqRecord,
  PaymentMethodRecord,
  PaymentRequestRecord,
  PaymentRequestStatus,
  PlanTier,
  PlatformSettingsRecord,
  ProfileConfig,
  ReportRecord,
  ReportStatus,
  SupportStatus,
  SupportTicketRecord,
  ThemeId,
  UserAccount,
} from '../types/linkora';

type AdminTab =
  | 'overview'
  | 'payments'
  | 'users'
  | 'themes'
  | 'reports'
  | 'tickets'
  | 'content';

export const AdminPage: React.FC = () => {
  const { firebaseUser, isAdmin, loading } = useAuth();

  const [tab, setTab] = useState<AdminTab>('overview');
  const [fetching, setFetching] = useState(true);
  const [busy, setBusy] = useState(false);
  const [bannerMsg, setBannerMsg] = useState('');
  const [errorMsg, setErrorMsg] = useState('');

  const [users, setUsers] = useState<UserAccount[]>([]);
  const [profiles, setProfiles] = useState<ProfileConfig[]>([]);
  const [reports, setReports] = useState<ReportRecord[]>([]);
  const [tickets, setTickets] = useState<SupportTicketRecord[]>([]);
  const [admins, setAdmins] = useState<AdminRecord[]>([]);
  const [settings, setSettings] = useState<PlatformSettingsRecord>(DEFAULT_PLATFORM_SETTINGS);
  const [faqs, setFaqs] = useState<FaqRecord[]>([]);
  const [paymentMethods, setPaymentMethods] = useState<PaymentMethodRecord[]>([]);
  const [paymentRequests, setPaymentRequests] = useState<PaymentRequestRecord[]>([]);

  const [userSearch, setUserSearch] = useState('');
  const [newAdminUid, setNewAdminUid] = useState('');
  const [newAdminEmail, setNewAdminEmail] = useState('');

  // Manual Payment Methods editor state
  const [pmEditId, setPmEditId] = useState<string | null>(null);
  const [pmProviderName, setPmProviderName] = useState('');
  const [pmAccountTitle, setPmAccountTitle] = useState('');
  const [pmAccountNumber, setPmAccountNumber] = useState('');
  const [pmInstructions, setPmInstructions] = useState('');
  const [pmOrder, setPmOrder] = useState(1);
  const [pmIsActive, setPmIsActive] = useState(true);
  const [pmDeleteTarget, setPmDeleteTarget] = useState<PaymentMethodRecord | null>(null);

  // Manual Payment Requests verification state
  const [paymentFilter, setPaymentFilter] = useState<'all' | PaymentRequestStatus>('pending');
  const [paymentNoteMap, setPaymentNoteMap] = useState<Record<string, string>>({});
  const [receiptPreviewReq, setReceiptPreviewReq] = useState<PaymentRequestRecord | null>(null);

  // Reply state for tickets
  const [replyTextMap, setReplyTextMap] = useState<Record<string, string>>({});
  const [replyStatusMap, setReplyStatusMap] = useState<Record<string, SupportStatus>>({});

  // FAQ form state
  const [faqIdEdit, setFaqIdEdit] = useState<string | null>(null);
  const [faqQuestion, setFaqQuestion] = useState('');
  const [faqAnswer, setFaqAnswer] = useState('');
  const [faqOrder, setFaqOrder] = useState(1);
  const [faqPublished, setFaqPublished] = useState(true);
  const [faqDeleteTarget, setFaqDeleteTarget] = useState<FaqRecord | null>(null);

  const loadAll = async () => {
    setFetching(true);
    setErrorMsg('');
    try {
      const data = await fetchAdminDashboardData();
      setUsers(data.users);
      setProfiles(data.profiles);
      setReports(data.reports);
      setTickets(data.tickets);
      setAdmins(data.admins);
      setSettings(data.settings);
      setFaqs(data.faqs);
      setPaymentMethods(data.paymentMethods);
      setPaymentRequests(data.paymentRequests);
    } catch (err) {
      setErrorMsg(err instanceof Error ? err.message : 'Failed to load admin data.');
    } finally {
      setFetching(false);
    }
  };

  useEffect(() => {
    document.title = 'Admin Console – Linkora';
    if (firebaseUser && isAdmin) {
      void loadAll();
    }
  }, [firebaseUser, isAdmin]);

  const profileByUid = useMemo(() => {
    const map = new Map<string, ProfileConfig>();
    profiles.forEach((p) => map.set(p.uid, p));
    return map;
  }, [profiles]);

  const filteredUsers = useMemo(() => {
    const q = userSearch.trim().toLowerCase();
    if (!q) return users;
    return users.filter((u) => {
      const p = profileByUid.get(u.uid);
      return (
        u.email.toLowerCase().includes(q) ||
        u.displayName.toLowerCase().includes(q) ||
        u.uid.toLowerCase().includes(q) ||
        (p?.username || '').toLowerCase().includes(q)
      );
    });
  }, [users, userSearch, profileByUid]);

  const filteredPaymentRequests = useMemo(() => {
    if (paymentFilter === 'all') return paymentRequests;
    return paymentRequests.filter((r) => r.status === paymentFilter);
  }, [paymentRequests, paymentFilter]);

  if (loading) {
    return (
      <div className="min-h-screen bg-slate-50 flex items-center justify-center">
        <p className="text-xs text-slate-500">Verifying administrator credentials...</p>
      </div>
    );
  }

  if (!firebaseUser) {
    return <Navigate to="/login" replace />;
  }

  if (!isAdmin) {
    return (
      <div className="min-h-screen bg-slate-50 flex items-center justify-center p-6">
        <div className="max-w-md w-full bg-white border border-slate-200 rounded-2xl p-7 text-center space-y-4">
          <div className="w-11 h-11 rounded-xl bg-red-50 text-red-600 flex items-center justify-center mx-auto">
            <Shield className="w-5 h-5" />
          </div>
          <h1 className="text-lg font-bold text-slate-900">Administrator Access Required</h1>
          <p className="text-xs text-slate-600 leading-relaxed">
            Your account does not hold administrator privileges. All admin operations are enforced
            by trusted Firestore security rules.
          </p>
          <Link
            to="/dashboard"
            className="inline-flex min-h-[40px] px-4 py-2 rounded-xl bg-slate-900 text-white text-xs font-semibold items-center justify-center"
          >
            Return to User Dashboard
          </Link>
        </div>
      </div>
    );
  }

  const publishedCount = profiles.filter((p) => p.isPublished && p.accountStatus === 'active').length;
  const pendingPaymentsCount = paymentRequests.filter((r) => r.status === 'pending').length;
  const pendingReportsCount = reports.filter((r) => r.status === 'pending').length;
  const openTicketsCount = tickets.filter((t) => t.status !== 'resolved').length;

  const notifySuccess = (msg: string) => {
    setBannerMsg(msg);
    setTimeout(() => setBannerMsg(''), 3500);
  };

  const resetPaymentMethodForm = (nextOrder = paymentMethods.length + 1) => {
    setPmEditId(null);
    setPmProviderName('');
    setPmAccountTitle('');
    setPmAccountNumber('');
    setPmInstructions('');
    setPmOrder(nextOrder);
    setPmIsActive(true);
  };

  const handleSavePaymentMethodForm = async (e: React.FormEvent) => {
    e.preventDefault();
    setBusy(true);
    setErrorMsg('');
    try {
      await adminSavePaymentMethod(pmEditId, {
        providerName: pmProviderName,
        accountTitle: pmAccountTitle,
        accountNumber: pmAccountNumber,
        instructions: pmInstructions,
        isActive: pmIsActive,
        order: pmOrder,
      });
      await loadAll();
      resetPaymentMethodForm(paymentMethods.length + 2);
      notifySuccess(pmEditId ? 'Payment method updated.' : 'Manual payment method added.');
    } catch (err) {
      setErrorMsg(err instanceof Error ? err.message : 'Failed to save payment method.');
    } finally {
      setBusy(false);
    }
  };

  const handleTogglePaymentMethodActive = async (method: PaymentMethodRecord) => {
    setBusy(true);
    setErrorMsg('');
    try {
      await adminSavePaymentMethod(method.id, {
        providerName: method.providerName,
        accountTitle: method.accountTitle,
        accountNumber: method.accountNumber,
        instructions: method.instructions,
        isActive: !method.isActive,
        order: method.order,
      });
      await loadAll();
      notifySuccess(
        `${method.providerName} ${!method.isActive ? 'enabled' : 'disabled'} for users.`
      );
    } catch (err) {
      setErrorMsg(err instanceof Error ? err.message : 'Could not update payment method.');
    } finally {
      setBusy(false);
    }
  };

  const handleConfirmDeletePaymentMethod = async () => {
    if (!pmDeleteTarget) return;
    setBusy(true);
    setErrorMsg('');
    try {
      await adminDeletePaymentMethod(pmDeleteTarget.id);
      setPmDeleteTarget(null);
      await loadAll();
      notifySuccess('Payment method deleted.');
    } catch (err) {
      setErrorMsg(err instanceof Error ? err.message : 'Could not delete payment method.');
    } finally {
      setBusy(false);
    }
  };

  const handleReviewPayment = async (
    req: PaymentRequestRecord,
    decision: 'approved' | 'rejected'
  ) => {
    setBusy(true);
    setErrorMsg('');
    try {
      const note = paymentNoteMap[req.id] ?? req.adminNote ?? '';
      await adminReviewPaymentRequest(req, decision, note);
      await loadAll();
      notifySuccess(
        decision === 'approved'
          ? `Approved payment & activated Premium plan for ${req.userEmail}.`
          : `Marked payment request from ${req.userEmail} as rejected.`
      );
    } catch (err) {
      setErrorMsg(err instanceof Error ? err.message : 'Could not review payment request.');
    } finally {
      setBusy(false);
    }
  };

  const handleToggleUserStatus = async (user: UserAccount) => {
    setBusy(true);
    setErrorMsg('');
    try {
      const nextStatus = user.status === 'active' ? 'suspended' : 'active';
      await adminSetUserStatusAndPlan(user, profileByUid.get(user.uid), nextStatus, user.plan);
      await loadAll();
      notifySuccess(`Account ${user.email} set to ${nextStatus}.`);
    } catch (err) {
      setErrorMsg(err instanceof Error ? err.message : 'Failed to update account status.');
    } finally {
      setBusy(false);
    }
  };

  const handleChangeUserPlan = async (user: UserAccount, nextPlan: PlanTier) => {
    setBusy(true);
    setErrorMsg('');
    try {
      await adminSetUserStatusAndPlan(user, profileByUid.get(user.uid), user.status, nextPlan);
      await loadAll();
      notifySuccess(`Updated ${user.email} to ${nextPlan} plan.`);
    } catch (err) {
      setErrorMsg(err instanceof Error ? err.message : 'Failed to update plan.');
    } finally {
      setBusy(false);
    }
  };

  const handleGrantAdmin = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!newAdminUid.trim() || !newAdminEmail.trim()) return;
    setBusy(true);
    setErrorMsg('');
    try {
      await adminGrantPrivilege(firebaseUser.uid, newAdminUid, newAdminEmail);
      setNewAdminUid('');
      setNewAdminEmail('');
      await loadAll();
      notifySuccess('Granted administrator access.');
    } catch (err) {
      setErrorMsg(err instanceof Error ? err.message : 'Could not grant admin access.');
    } finally {
      setBusy(false);
    }
  };

  const handleToggleThemeDisabled = (themeId: ThemeId) => {
    setSettings((prev) => {
      const exists = prev.disabledThemes.includes(themeId);
      return {
        ...prev,
        disabledThemes: exists
          ? prev.disabledThemes.filter((id) => id !== themeId)
          : [...prev.disabledThemes, themeId],
      };
    });
  };

  const handleSaveSettings = async (e: React.FormEvent) => {
    e.preventDefault();
    setBusy(true);
    setErrorMsg('');
    try {
      await adminSavePlatformSettings(settings);
      notifySuccess('Platform settings saved.');
    } catch (err) {
      setErrorMsg(err instanceof Error ? err.message : 'Failed to save platform settings.');
    } finally {
      setBusy(false);
    }
  };

  const handleReportAction = async (
    report: ReportRecord,
    status: ReportStatus,
    suspendTarget = false
  ) => {
    setBusy(true);
    setErrorMsg('');
    try {
      if (suspendTarget) {
        const targetUser = users.find((u) => u.uid === report.reportedUid);
        if (targetUser) {
          await adminSetUserStatusAndPlan(
            targetUser,
            profileByUid.get(targetUser.uid),
            'suspended',
            targetUser.plan
          );
        }
      }
      await adminUpdateReportStatus(report.id, status);
      await loadAll();
      notifySuccess('Moderation report updated.');
    } catch (err) {
      setErrorMsg(err instanceof Error ? err.message : 'Failed to update report.');
    } finally {
      setBusy(false);
    }
  };

  const handleTicketUpdate = async (ticket: SupportTicketRecord) => {
    setBusy(true);
    setErrorMsg('');
    try {
      const reply = replyTextMap[ticket.id] ?? ticket.adminReply;
      const status = replyStatusMap[ticket.id] ?? ticket.status;
      await adminReplySupportTicket(ticket.id, status, reply);
      await loadAll();
      notifySuccess('Support ticket updated.');
    } catch (err) {
      setErrorMsg(err instanceof Error ? err.message : 'Could not update ticket.');
    } finally {
      setBusy(false);
    }
  };

  const handleSeedDefaultFaqs = async () => {
    setBusy(true);
    setErrorMsg('');
    try {
      for (const item of DEFAULT_FAQS) {
        await adminSaveFaqItem(item.id, {
          question: item.question,
          answer: item.answer,
          order: item.order,
          isPublished: true,
        });
      }
      await loadAll();
      notifySuccess('Default FAQs loaded into Firestore.');
    } catch (err) {
      setErrorMsg(err instanceof Error ? err.message : 'Could not seed FAQs.');
    } finally {
      setBusy(false);
    }
  };

  const handleSaveFaqForm = async (e: React.FormEvent) => {
    e.preventDefault();
    setBusy(true);
    setErrorMsg('');
    try {
      await adminSaveFaqItem(faqIdEdit, {
        question: faqQuestion,
        answer: faqAnswer,
        order: faqOrder,
        isPublished: faqPublished,
      });
      setFaqIdEdit(null);
      setFaqQuestion('');
      setFaqAnswer('');
      setFaqOrder(faqs.length + 1);
      await loadAll();
      notifySuccess('FAQ entry saved.');
    } catch (err) {
      setErrorMsg(err instanceof Error ? err.message : 'Could not save FAQ.');
    } finally {
      setBusy(false);
    }
  };

  const handleConfirmDeleteFaq = async () => {
    if (!faqDeleteTarget) return;
    setBusy(true);
    try {
      await adminDeleteFaqItem(faqDeleteTarget.id);
      setFaqDeleteTarget(null);
      await loadAll();
      notifySuccess('FAQ deleted.');
    } catch (err) {
      setErrorMsg(err instanceof Error ? err.message : 'Could not delete FAQ.');
    } finally {
      setBusy(false);
    }
  };

  return (
    <div className="min-h-screen bg-slate-50 text-slate-900 flex flex-col">
      {/* Admin Top Header */}
      <header className="sticky top-0 z-30 bg-white border-b border-slate-200 px-4 sm:px-6 h-16 flex items-center justify-between gap-4">
        <div className="flex items-center gap-3">
          <Shield className="w-5 h-5 text-indigo-600 shrink-0" />
          <span className="text-base font-bold text-slate-950 whitespace-nowrap">
            Linkora Admin Console
          </span>
        </div>

        <div className="flex items-center gap-3">
          <button
            type="button"
            onClick={loadAll}
            aria-label="Refresh admin data"
            className="w-9 h-9 rounded-lg border border-slate-200 flex items-center justify-center text-slate-600 hover:bg-slate-50 cursor-pointer"
          >
            <RefreshCw className={`w-4 h-4 ${fetching ? 'animate-spin' : ''}`} />
          </button>
          <Link
            to="/dashboard"
            className="min-h-[38px] px-3.5 py-1.5 rounded-lg border border-slate-200 text-xs font-semibold text-slate-700 hover:bg-slate-50 inline-flex items-center gap-1.5 whitespace-nowrap"
          >
            <ArrowLeft className="w-3.5 h-3.5" />
            <span>User Dashboard</span>
          </Link>
        </div>
      </header>

      <div className="max-w-7xl w-full mx-auto px-4 sm:px-6 py-8 space-y-6 flex-1">
        {/* Sub-navigation Tabs */}
        <div className="flex flex-wrap items-center gap-1.5 p-1.5 rounded-xl bg-slate-200/70 border border-slate-200 w-fit">
          {(
            [
              ['overview', 'Overview', LayoutGrid],
              ['payments', `Payments (${pendingPaymentsCount})`, CreditCard],
              ['users', 'Users & Pages', Users],
              ['themes', 'Themes & Plans', Palette],
              ['reports', `Reports (${pendingReportsCount})`, Flag],
              ['tickets', `Support (${openTicketsCount})`, HelpCircle],
              ['content', 'Website & FAQs', Save],
            ] as [AdminTab, string, React.FC<{ className?: string }>][]
          ).map(([id, label, Icon]) => (
            <button
              key={id}
              type="button"
              onClick={() => setTab(id)}
              className={`min-h-[36px] px-3.5 py-1.5 rounded-lg text-xs font-semibold inline-flex items-center gap-1.5 cursor-pointer whitespace-nowrap ${
                tab === id ? 'bg-white text-slate-950 shadow-xs' : 'text-slate-600 hover:text-slate-900'
              }`}
            >
              <Icon className="w-3.5 h-3.5" />
              <span>{label}</span>
            </button>
          ))}
        </div>

        {bannerMsg && (
          <div className="p-3.5 rounded-xl bg-emerald-50 border border-emerald-200 text-xs text-emerald-800 flex items-center gap-2">
            <CheckCircle2 className="w-4 h-4 shrink-0" />
            <span>{bannerMsg}</span>
          </div>
        )}
        {errorMsg && (
          <div className="p-3.5 rounded-xl bg-red-50 border border-red-200 text-xs text-red-700">
            {errorMsg}
          </div>
        )}

        {/* 1. OVERVIEW */}
        {tab === 'overview' && (
          <div className="space-y-6">
            <div className="grid grid-cols-2 lg:grid-cols-4 gap-4">
              <div className="rounded-2xl border border-slate-200 bg-white p-5">
                <p className="text-xs text-slate-500">Registered Users</p>
                <p className="mt-2 text-2xl font-bold font-mono tabular-nums text-slate-950">
                  {users.length}
                </p>
              </div>
              <div className="rounded-2xl border border-slate-200 bg-white p-5">
                <p className="text-xs text-slate-500">Published Bio Pages</p>
                <p className="mt-2 text-2xl font-bold font-mono tabular-nums text-emerald-700">
                  {publishedCount}
                </p>
              </div>
              <button
                type="button"
                onClick={() => setTab('payments')}
                className="rounded-2xl border border-slate-200 bg-white p-5 text-left hover:border-indigo-500 transition-colors cursor-pointer"
              >
                <p className="text-xs text-slate-500">Pending Payment Approvals</p>
                <p className="mt-2 text-2xl font-bold font-mono tabular-nums text-indigo-600">
                  {pendingPaymentsCount}
                </p>
              </button>
              <button
                type="button"
                onClick={() => setTab('reports')}
                className="rounded-2xl border border-slate-200 bg-white p-5 text-left hover:border-indigo-500 transition-colors cursor-pointer"
              >
                <p className="text-xs text-slate-500">Pending Abuse Reports</p>
                <p className="mt-2 text-2xl font-bold font-mono tabular-nums text-amber-600">
                  {pendingReportsCount}
                </p>
              </button>
            </div>

            {/* Authorized Administrators Registry */}
            <div className="rounded-2xl border border-slate-200 bg-white p-6 space-y-4">
              <div>
                <h2 className="text-base font-bold text-slate-900">
                  Authorized Platform Administrators
                </h2>
                <p className="text-xs text-slate-500 mt-0.5">
                  Admin privileges are verified server-side via Firestore{' '}
                  <span className="font-mono">/admins/&#123;uid&#125;</span> records. Only an
                  existing admin can grant privileges.
                </p>
              </div>

              <form onSubmit={handleGrantAdmin} className="grid grid-cols-1 sm:grid-cols-3 gap-3">
                <input
                  type="text"
                  required
                  value={newAdminUid}
                  onChange={(e) => setNewAdminUid(e.target.value)}
                  placeholder="Target Firebase Auth UID"
                  className="min-h-[40px] px-3 py-1.5 rounded-xl border border-slate-300 text-xs font-mono"
                />
                <input
                  type="email"
                  required
                  value={newAdminEmail}
                  onChange={(e) => setNewAdminEmail(e.target.value)}
                  placeholder="Target Verified Email"
                  className="min-h-[40px] px-3 py-1.5 rounded-xl border border-slate-300 text-xs"
                />
                <button
                  type="submit"
                  disabled={busy}
                  className="min-h-[40px] px-4 py-1.5 rounded-xl bg-slate-900 text-white text-xs font-semibold cursor-pointer"
                >
                  Grant Admin Privilege
                </button>
              </form>

              {admins.length > 0 && (
                <div className="divide-y divide-slate-100 border-t border-slate-100 pt-2">
                  {admins.map((adm) => (
                    <div
                      key={adm.uid}
                      className="py-2.5 flex items-center justify-between gap-4 text-xs"
                    >
                      <div>
                        <span className="font-semibold text-slate-900">{adm.email}</span>
                        <span className="ml-2 font-mono text-slate-400">({adm.uid})</span>
                      </div>
                      <button
                        type="button"
                        onClick={() => adminRevokePrivilege(adm.uid).then(loadAll)}
                        className="text-red-600 font-semibold hover:underline cursor-pointer"
                      >
                        Revoke
                      </button>
                    </div>
                  ))}
                </div>
              )}
            </div>
          </div>
        )}

        {/* 2. MANUAL PAYMENTS & VERIFICATION */}
        {tab === 'payments' && (
          <div className="space-y-6">
            {/* Section A: Manual Payment Verification Queue */}
            <div className="rounded-2xl border border-slate-200 bg-white p-6 space-y-5">
              <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4">
                <div>
                  <h2 className="text-base font-bold text-slate-900">
                    Manual Payment Verification Queue
                  </h2>
                  <p className="text-xs text-slate-500 mt-0.5">
                    Verify incoming transaction IDs and receipts. Approving a request automatically
                    activates the user’s Premium plan.
                  </p>
                </div>

                {/* Filter Segmented Control */}
                <div className="flex items-center gap-1 p-1 rounded-lg bg-slate-100 border border-slate-200 w-fit">
                  {(
                    [
                      ['pending', 'Pending'],
                      ['approved', 'Approved'],
                      ['rejected', 'Rejected'],
                      ['all', 'All'],
                    ] as const
                  ).map(([val, label]) => (
                    <button
                      key={val}
                      type="button"
                      onClick={() => setPaymentFilter(val)}
                      className={`px-3 py-1 rounded-md text-xs font-semibold cursor-pointer ${
                        paymentFilter === val
                          ? 'bg-white text-slate-950 shadow-xs'
                          : 'text-slate-600 hover:text-slate-900'
                      }`}
                    >
                      {label}
                    </button>
                  ))}
                </div>
              </div>

              {filteredPaymentRequests.length === 0 ? (
                <p className="text-xs text-slate-500 py-4">
                  No {paymentFilter === 'all' ? '' : paymentFilter} payment verification requests
                  found.
                </p>
              ) : (
                <div className="space-y-4">
                  {filteredPaymentRequests.map((req) => (
                    <div
                      key={req.id}
                      className="rounded-xl border border-slate-200 p-5 space-y-4 bg-white"
                    >
                      <div className="flex flex-wrap items-start justify-between gap-3 text-xs">
                        <div className="space-y-1">
                          <div className="flex flex-wrap items-center gap-2">
                            <span className="font-bold text-sm text-slate-900">
                              {req.userEmail}
                            </span>
                            <span aria-hidden="true">·</span>
                            <Link
                              to={`/${req.username}`}
                              className="font-mono text-indigo-600 hover:underline inline-flex items-center gap-1"
                            >
                              <span>@{req.username}</span>
                              <ExternalLink className="w-3 h-3" />
                            </Link>
                          </div>
                          <div className="flex flex-wrap items-center gap-2 text-slate-600">
                            <span>
                              Method: <strong className="text-slate-900">{req.methodName}</strong>
                            </span>
                            <span aria-hidden="true">·</span>
                            <span className="font-mono tabular-nums">
                              Amount: <strong className="text-slate-900">${req.amountUsd}</strong>
                            </span>
                            <span aria-hidden="true">·</span>
                            <span>
                              Sender: <strong className="text-slate-900">{req.senderName}</strong> (
                              <span className="font-mono">{req.senderAccount}</span>)
                            </span>
                          </div>
                          <p className="font-mono text-slate-800 pt-0.5">
                            Transaction ID: <strong>{req.transactionId}</strong>
                          </p>
                          {req.userNote && (
                            <p className="text-slate-600">User Note: {req.userNote}</p>
                          )}
                        </div>

                        <div className="flex items-center gap-3 shrink-0">
                          {req.receiptDataUrl && (
                            <button
                              type="button"
                              onClick={() => setReceiptPreviewReq(req)}
                              className="min-h-[34px] px-3 py-1 rounded-lg border border-slate-200 text-xs font-semibold text-indigo-600 hover:bg-indigo-50 inline-flex items-center gap-1.5 cursor-pointer"
                            >
                              <Eye className="w-3.5 h-3.5" />
                              <span>View Receipt</span>
                            </button>
                          )}
                          <span
                            className={`text-xs font-bold capitalize ${
                              req.status === 'approved'
                                ? 'text-emerald-700'
                                : req.status === 'rejected'
                                ? 'text-red-600'
                                : 'text-amber-600'
                            }`}
                          >
                            {req.status}
                          </span>
                        </div>
                      </div>

                      <div className="flex flex-col sm:flex-row items-stretch sm:items-center gap-2.5 pt-3 border-t border-slate-100">
                        <input
                          type="text"
                          maxLength={500}
                          value={paymentNoteMap[req.id] ?? req.adminNote}
                          onChange={(e) =>
                            setPaymentNoteMap((m) => ({ ...m, [req.id]: e.target.value }))
                          }
                          placeholder="Optional verification note or reason visible to user..."
                          className="flex-1 min-h-[38px] px-3 py-1.5 rounded-xl border border-slate-300 text-xs"
                        />
                        <div className="flex items-center gap-2 shrink-0">
                          <button
                            type="button"
                            disabled={busy}
                            onClick={() => handleReviewPayment(req, 'rejected')}
                            className="min-h-[38px] px-3.5 py-1.5 rounded-xl border border-red-200 text-red-600 hover:bg-red-50 text-xs font-semibold inline-flex items-center gap-1 cursor-pointer"
                          >
                            <X className="w-3.5 h-3.5" />
                            <span>Reject</span>
                          </button>
                          <button
                            type="button"
                            disabled={busy}
                            onClick={() => handleReviewPayment(req, 'approved')}
                            className="min-h-[38px] px-4 py-1.5 rounded-xl bg-emerald-600 hover:bg-emerald-700 text-white text-xs font-semibold inline-flex items-center gap-1.5 cursor-pointer whitespace-nowrap"
                          >
                            <Check className="w-3.5 h-3.5" />
                            <span>Approve &amp; Activate Premium</span>
                          </button>
                        </div>
                      </div>
                    </div>
                  ))}
                </div>
              )}
            </div>

            {/* Section B: Add / Manage Custom Manual Payment Methods */}
            <div className="rounded-2xl border border-slate-200 bg-white p-6 space-y-5">
              <div>
                <h2 className="text-base font-bold text-slate-900">
                  Custom Manual Payment Methods
                </h2>
                <p className="text-xs text-slate-500 mt-0.5">
                  Add any manual payment accounts you want (e.g., EasyPaisa, JazzCash, SadaPay,
                  Meezan Bank, Binance USDT, Wise). Active methods appear immediately in User
                  Dashboard → Subscription &amp; Upgrade.
                </p>
              </div>

              <form
                onSubmit={handleSavePaymentMethodForm}
                className="rounded-xl border border-slate-200 bg-slate-50 p-4 space-y-4"
              >
                <p className="text-xs font-bold text-slate-800">
                  {pmEditId ? 'Edit Manual Payment Method' : 'Add New Manual Payment Method'}
                </p>

                <div className="grid grid-cols-1 sm:grid-cols-4 gap-3">
                  <div>
                    <label className="block text-xs font-semibold text-slate-700 mb-1">
                      Method / Bank Name
                    </label>
                    <input
                      type="text"
                      required
                      minLength={2}
                      maxLength={80}
                      value={pmProviderName}
                      onChange={(e) => setPmProviderName(e.target.value)}
                      placeholder="e.g. EasyPaisa / JazzCash / Bank"
                      className="w-full min-h-[40px] px-3 rounded-lg border border-slate-300 bg-white text-xs"
                    />
                  </div>

                  <div>
                    <label className="block text-xs font-semibold text-slate-700 mb-1">
                      Account Title
                    </label>
                    <input
                      type="text"
                      required
                      minLength={2}
                      maxLength={100}
                      value={pmAccountTitle}
                      onChange={(e) => setPmAccountTitle(e.target.value)}
                      placeholder="e.g. Muhammad Usman"
                      className="w-full min-h-[40px] px-3 rounded-lg border border-slate-300 bg-white text-xs"
                    />
                  </div>

                  <div>
                    <label className="block text-xs font-semibold text-slate-700 mb-1">
                      Account Number / IBAN / Wallet
                    </label>
                    <input
                      type="text"
                      required
                      minLength={3}
                      maxLength={120}
                      value={pmAccountNumber}
                      onChange={(e) => setPmAccountNumber(e.target.value)}
                      placeholder="e.g. 0300-1234567"
                      className="w-full min-h-[40px] px-3 rounded-lg border border-slate-300 bg-white text-xs font-mono"
                    />
                  </div>

                  <div>
                    <label className="block text-xs font-semibold text-slate-700 mb-1">
                      Display Order
                    </label>
                    <input
                      type="number"
                      min={0}
                      max={500}
                      value={pmOrder}
                      onChange={(e) => setPmOrder(Number(e.target.value))}
                      className="w-full min-h-[40px] px-3 rounded-lg border border-slate-300 bg-white text-xs font-mono"
                    />
                  </div>
                </div>

                <div>
                  <label className="block text-xs font-semibold text-slate-700 mb-1">
                    Payment Instructions for Users (Optional)
                  </label>
                  <textarea
                    rows={2}
                    maxLength={600}
                    value={pmInstructions}
                    onChange={(e) => setPmInstructions(e.target.value)}
                    placeholder="e.g. Send PKR 2,500 ($9 equivalent) to this account, then enter your Trx ID and upload the payment screenshot."
                    className="w-full p-3 rounded-lg border border-slate-300 bg-white text-xs"
                  />
                </div>

                <div className="flex flex-wrap items-center justify-between gap-3">
                  <label className="inline-flex items-center gap-2 text-xs text-slate-700 cursor-pointer">
                    <input
                      type="checkbox"
                      checked={pmIsActive}
                      onChange={(e) => setPmIsActive(e.target.checked)}
                      className="w-4 h-4 rounded text-indigo-600"
                    />
                    <span>Active &amp; visible to users on Subscription page</span>
                  </label>

                  <div className="flex items-center gap-2">
                    {pmEditId && (
                      <button
                        type="button"
                        onClick={() => resetPaymentMethodForm()}
                        className="min-h-[38px] px-3.5 py-1.5 rounded-lg border border-slate-200 bg-white text-xs font-semibold cursor-pointer"
                      >
                        Cancel
                      </button>
                    )}
                    <button
                      type="submit"
                      disabled={busy}
                      className="min-h-[38px] px-4 py-1.5 rounded-lg bg-slate-900 hover:bg-slate-800 text-white text-xs font-semibold inline-flex items-center gap-1.5 cursor-pointer"
                    >
                      <Plus className="w-3.5 h-3.5" />
                      <span>{pmEditId ? 'Update Payment Method' : 'Add Payment Method'}</span>
                    </button>
                  </div>
                </div>
              </form>

              {paymentMethods.length === 0 ? (
                <p className="text-xs text-slate-500">
                  No manual payment methods added yet. Use the form above to add your first method.
                </p>
              ) : (
                <div className="divide-y divide-slate-100">
                  {paymentMethods.map((m) => (
                    <div
                      key={m.id}
                      className="py-3.5 flex flex-col sm:flex-row sm:items-center justify-between gap-3 text-xs"
                    >
                      <div className="space-y-0.5">
                        <div className="flex flex-wrap items-center gap-2">
                          <span className="font-bold text-slate-900 text-sm">
                            {m.order}. {m.providerName}
                          </span>
                          <span aria-hidden="true">·</span>
                          <span className="font-semibold text-slate-700">{m.accountTitle}</span>
                          <span aria-hidden="true">·</span>
                          <span className="font-mono text-indigo-600">{m.accountNumber}</span>
                          {!m.isActive && (
                            <span className="text-amber-600 font-semibold">(Disabled)</span>
                          )}
                        </div>
                        {m.instructions && <p className="text-slate-500">{m.instructions}</p>}
                      </div>

                      <div className="flex items-center gap-2 shrink-0">
                        <button
                          type="button"
                          disabled={busy}
                          onClick={() => handleTogglePaymentMethodActive(m)}
                          className="px-2.5 py-1.5 rounded-lg border border-slate-200 font-semibold text-slate-700 hover:bg-slate-50 cursor-pointer"
                        >
                          {m.isActive ? 'Disable' : 'Enable'}
                        </button>
                        <button
                          type="button"
                          onClick={() => {
                            setPmEditId(m.id);
                            setPmProviderName(m.providerName);
                            setPmAccountTitle(m.accountTitle);
                            setPmAccountNumber(m.accountNumber);
                            setPmInstructions(m.instructions);
                            setPmOrder(m.order);
                            setPmIsActive(m.isActive);
                          }}
                          className="px-2.5 py-1.5 rounded-lg border border-slate-200 font-semibold text-slate-700 hover:bg-slate-50 cursor-pointer"
                        >
                          Edit
                        </button>
                        <button
                          type="button"
                          onClick={() => setPmDeleteTarget(m)}
                          aria-label={`Delete ${m.providerName}`}
                          className="w-8 h-8 rounded-lg border border-red-200 text-red-600 flex items-center justify-center cursor-pointer"
                        >
                          <Trash2 className="w-3.5 h-3.5" />
                        </button>
                      </div>
                    </div>
                  ))}
                </div>
              )}
            </div>
          </div>
        )}

        {/* 3. USERS & PAGES */}
        {tab === 'users' && (
          <div className="rounded-2xl border border-slate-200 bg-white overflow-hidden">
            <div className="p-5 border-b border-slate-200 flex flex-col sm:flex-row sm:items-center justify-between gap-4">
              <h2 className="text-base font-bold text-slate-900">Registered Accounts &amp; Slugs</h2>
              <input
                type="search"
                value={userSearch}
                onChange={(e) => setUserSearch(e.target.value)}
                placeholder="Search email, name, @username, or UID..."
                className="w-full sm:w-72 min-h-[38px] px-3.5 py-1.5 rounded-xl border border-slate-300 text-xs"
              />
            </div>

            <div className="overflow-x-auto">
              <table className="w-full text-left text-xs">
                <thead className="bg-slate-50 border-b border-slate-200 text-slate-500">
                  <tr>
                    <th className="px-4 py-3 font-semibold">User</th>
                    <th className="px-4 py-3 font-semibold">Public Slug</th>
                    <th className="px-4 py-3 font-semibold text-right">Views / Clicks</th>
                    <th className="px-4 py-3 font-semibold">Plan</th>
                    <th className="px-4 py-3 font-semibold">Standing</th>
                    <th className="px-4 py-3 font-semibold text-right">Actions</th>
                  </tr>
                </thead>
                <tbody className="divide-y divide-slate-100">
                  {filteredUsers.map((u) => {
                    const p = profileByUid.get(u.uid);
                    return (
                      <tr key={u.uid} className="hover:bg-slate-50/70">
                        <td className="px-4 py-3">
                          <p className="font-semibold text-slate-900">{u.displayName}</p>
                          <p className="text-slate-500">{u.email}</p>
                        </td>
                        <td className="px-4 py-3 font-mono">
                          {p ? (
                            <Link
                              to={`/${p.username}`}
                              className="text-indigo-600 hover:underline inline-flex items-center gap-1"
                            >
                              <span>@{p.username}</span>
                              <ExternalLink className="w-3 h-3" />
                            </Link>
                          ) : (
                            '—'
                          )}
                          {p && (
                            <p className="text-[11px] font-sans text-slate-400">
                              {p.isPublished ? 'Published' : 'Unpublished'} · {p.linkCount} links
                            </p>
                          )}
                        </td>
                        <td className="px-4 py-3 text-right font-mono tabular-nums">
                          {p ? `${p.totalViews} / ${p.totalClicks}` : '0 / 0'}
                        </td>
                        <td className="px-4 py-3">
                          <select
                            value={u.plan}
                            disabled={busy}
                            onChange={(e) => handleChangeUserPlan(u, e.target.value as PlanTier)}
                            aria-label={`Change plan for ${u.email}`}
                            className="px-2.5 py-1 rounded-lg border border-slate-300 bg-white text-xs capitalize"
                          >
                            <option value="free">Free</option>
                            <option value="premium">Premium</option>
                          </select>
                        </td>
                        <td className="px-4 py-3 capitalize font-medium">
                          {u.status === 'active' ? (
                            <span className="text-emerald-700">Active</span>
                          ) : (
                            <span className="text-red-600">Suspended</span>
                          )}
                        </td>
                        <td className="px-4 py-3 text-right">
                          <button
                            type="button"
                            disabled={busy}
                            onClick={() => handleToggleUserStatus(u)}
                            className={`px-3 py-1.5 rounded-lg text-xs font-semibold cursor-pointer ${
                              u.status === 'active'
                                ? 'border border-red-200 text-red-600 hover:bg-red-50'
                                : 'bg-emerald-600 text-white hover:bg-emerald-700'
                            }`}
                          >
                            {u.status === 'active' ? 'Suspend' : 'Restore'}
                          </button>
                        </td>
                      </tr>
                    );
                  })}
                </tbody>
              </table>
            </div>
          </div>
        )}

        {/* 4. THEMES & PLAN CONFIGURATIONS */}
        {tab === 'themes' && (
          <form onSubmit={handleSaveSettings} className="space-y-6">
            <div className="rounded-2xl border border-slate-200 bg-white p-6 space-y-4">
              <div>
                <h2 className="text-base font-bold text-slate-900">Manage Available Built-In Themes</h2>
                <p className="text-xs text-slate-500 mt-0.5">
                  Toggle which themes appear in the public template gallery and user dashboard
                  selector.
                </p>
              </div>
              <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-3">
                {BUILT_IN_THEMES.map((theme) => {
                  const enabled = !settings.disabledThemes.includes(theme.id);
                  return (
                    <label
                      key={theme.id}
                      className="rounded-xl border border-slate-200 p-4 flex items-start justify-between gap-3 cursor-pointer"
                    >
                      <div>
                        <p className="text-xs font-bold text-slate-900">{theme.name}</p>
                        <p className="text-[11px] text-slate-500 capitalize">{theme.tier} tier</p>
                      </div>
                      <input
                        type="checkbox"
                        checked={enabled}
                        onChange={() => handleToggleThemeDisabled(theme.id)}
                        className="w-4 h-4 rounded text-indigo-600 mt-0.5"
                      />
                    </label>
                  );
                })}
              </div>
            </div>

            <div className="rounded-2xl border border-slate-200 bg-white p-6 space-y-4">
              <h3 className="text-base font-bold text-slate-900">Plan Display Configurations</h3>
              <div className="grid grid-cols-1 sm:grid-cols-3 gap-4">
                <div>
                  <label className="block text-xs font-semibold text-slate-700 mb-1">
                    Free Max Links Displayed
                  </label>
                  <input
                    type="number"
                    min={1}
                    max={50}
                    value={settings.freeMaxLinks}
                    onChange={(e) =>
                      setSettings((s) => ({ ...s, freeMaxLinks: Number(e.target.value) }))
                    }
                    className="w-full min-h-[40px] px-3 rounded-xl border border-slate-300 text-sm font-mono"
                  />
                </div>
                <div>
                  <label className="block text-xs font-semibold text-slate-700 mb-1">
                    Premium Max Links Displayed
                  </label>
                  <input
                    type="number"
                    min={10}
                    max={100}
                    value={settings.premiumMaxLinks}
                    onChange={(e) =>
                      setSettings((s) => ({ ...s, premiumMaxLinks: Number(e.target.value) }))
                    }
                    className="w-full min-h-[40px] px-3 rounded-xl border border-slate-300 text-sm font-mono"
                  />
                </div>
                <div>
                  <label className="block text-xs font-semibold text-slate-700 mb-1">
                    Premium Monthly Price (USD)
                  </label>
                  <input
                    type="number"
                    min={1}
                    max={500}
                    value={settings.premiumPriceMonthly}
                    onChange={(e) =>
                      setSettings((s) => ({ ...s, premiumPriceMonthly: Number(e.target.value) }))
                    }
                    className="w-full min-h-[40px] px-3 rounded-xl border border-slate-300 text-sm font-mono"
                  />
                </div>
              </div>

              <button
                type="submit"
                disabled={busy}
                className="min-h-[42px] px-5 py-2 rounded-xl bg-indigo-600 hover:bg-indigo-700 text-white text-xs font-semibold cursor-pointer"
              >
                Save Theme &amp; Plan Settings
              </button>
            </div>
          </form>
        )}

        {/* 5. REPORTED PUBLIC PAGES */}
        {tab === 'reports' && (
          <div className="rounded-2xl border border-slate-200 bg-white p-6 space-y-4">
            <h2 className="text-base font-bold text-slate-900">Reported Public Bio Pages</h2>
            {reports.length === 0 ? (
              <p className="text-xs text-slate-500">No abuse reports have been submitted.</p>
            ) : (
              <div className="space-y-3">
                {reports.map((rpt) => (
                  <div
                    key={rpt.id}
                    className="rounded-xl border border-slate-200 p-4 flex flex-col sm:flex-row sm:items-center justify-between gap-4"
                  >
                    <div className="space-y-1">
                      <div className="flex flex-wrap items-center gap-2 text-xs">
                        <Link
                          to={`/${rpt.reportedUsername}`}
                          className="font-mono font-bold text-indigo-600 hover:underline"
                        >
                          @{rpt.reportedUsername}
                        </Link>
                        <span aria-hidden="true">·</span>
                        <span className="capitalize font-semibold text-slate-700">
                          Reason: {rpt.reason}
                        </span>
                        <span aria-hidden="true">·</span>
                        <span className="capitalize text-slate-500">Status: {rpt.status}</span>
                      </div>
                      <p className="text-xs text-slate-600">{rpt.details}</p>
                    </div>

                    <div className="flex flex-wrap items-center gap-2 shrink-0">
                      <button
                        type="button"
                        disabled={busy}
                        onClick={() => handleReportAction(rpt, 'dismissed')}
                        className="px-3 py-1.5 rounded-lg border border-slate-200 text-xs font-semibold text-slate-700 cursor-pointer"
                      >
                        Dismiss
                      </button>
                      <button
                        type="button"
                        disabled={busy}
                        onClick={() => handleReportAction(rpt, 'actioned', true)}
                        className="px-3 py-1.5 rounded-lg bg-red-600 text-white text-xs font-semibold cursor-pointer"
                      >
                        Suspend Account
                      </button>
                    </div>
                  </div>
                ))}
              </div>
            )}
          </div>
        )}

        {/* 6. SUPPORT REQUESTS */}
        {tab === 'tickets' && (
          <div className="rounded-2xl border border-slate-200 bg-white p-6 space-y-4">
            <h2 className="text-base font-bold text-slate-900">User Support Requests</h2>
            {tickets.length === 0 ? (
              <p className="text-xs text-slate-500">No support requests in the queue.</p>
            ) : (
              <div className="space-y-4">
                {tickets.map((t) => (
                  <div key={t.id} className="rounded-xl border border-slate-200 p-5 space-y-3">
                    <div className="flex flex-wrap items-center justify-between gap-2 text-xs">
                      <div>
                        <span className="font-bold text-slate-900 text-sm">{t.subject}</span>
                        <span className="ml-2 text-slate-500">({t.email})</span>
                      </div>
                      <select
                        value={replyStatusMap[t.id] ?? t.status}
                        onChange={(e) =>
                          setReplyStatusMap((m) => ({
                            ...m,
                            [t.id]: e.target.value as SupportStatus,
                          }))
                        }
                        className="px-2.5 py-1 rounded-lg border border-slate-300 text-xs bg-white"
                      >
                        <option value="open">Open</option>
                        <option value="in_progress">In Progress</option>
                        <option value="resolved">Resolved</option>
                      </select>
                    </div>

                    <p className="text-xs text-slate-700 bg-slate-50 p-3 rounded-lg whitespace-pre-line">
                      {t.message}
                    </p>

                    <div className="flex flex-col sm:flex-row gap-2">
                      <input
                        type="text"
                        value={replyTextMap[t.id] ?? t.adminReply}
                        onChange={(e) =>
                          setReplyTextMap((m) => ({ ...m, [t.id]: e.target.value }))
                        }
                        placeholder="Write official reply visible to user..."
                        className="flex-1 min-h-[38px] px-3 py-1.5 rounded-xl border border-slate-300 text-xs"
                      />
                      <button
                        type="button"
                        disabled={busy}
                        onClick={() => handleTicketUpdate(t)}
                        className="min-h-[38px] px-4 py-1.5 rounded-xl bg-indigo-600 text-white text-xs font-semibold cursor-pointer whitespace-nowrap"
                      >
                        Save Reply &amp; Status
                      </button>
                    </div>
                  </div>
                ))}
              </div>
            )}
          </div>
        )}

        {/* 7. PUBLIC WEBSITE CONTENT & FAQS */}
        {tab === 'content' && (
          <div className="space-y-6">
            <form
              onSubmit={handleSaveSettings}
              className="rounded-2xl border border-slate-200 bg-white p-6 space-y-4"
            >
              <h2 className="text-base font-bold text-slate-900">Homepage Hero Copy</h2>
              <div>
                <label className="block text-xs font-semibold text-slate-700 mb-1">
                  Hero Headline
                </label>
                <input
                  type="text"
                  required
                  maxLength={120}
                  value={settings.heroHeadline}
                  onChange={(e) => setSettings((s) => ({ ...s, heroHeadline: e.target.value }))}
                  className="w-full min-h-[42px] px-3.5 py-2 rounded-xl border border-slate-300 text-sm"
                />
              </div>
              <div>
                <label className="block text-xs font-semibold text-slate-700 mb-1">
                  Hero Supporting Text
                </label>
                <textarea
                  rows={2}
                  required
                  maxLength={300}
                  value={settings.heroSubheadline}
                  onChange={(e) => setSettings((s) => ({ ...s, heroSubheadline: e.target.value }))}
                  className="w-full p-3 rounded-xl border border-slate-300 text-sm"
                />
              </div>
              <button
                type="submit"
                disabled={busy}
                className="min-h-[40px] px-5 py-2 rounded-xl bg-indigo-600 text-white text-xs font-semibold cursor-pointer"
              >
                Update Homepage Copy
              </button>
            </form>

            {/* FAQ Manager */}
            <div className="rounded-2xl border border-slate-200 bg-white p-6 space-y-5">
              <div className="flex flex-wrap items-center justify-between gap-2">
                <h2 className="text-base font-bold text-slate-900">Manage Public FAQs</h2>
                {faqs.length === 0 && (
                  <button
                    type="button"
                    disabled={busy}
                    onClick={handleSeedDefaultFaqs}
                    className="px-3 py-1.5 rounded-lg border border-slate-200 text-xs font-semibold text-slate-700 hover:bg-slate-50 cursor-pointer"
                  >
                    Seed 5 Default FAQs into Database
                  </button>
                )}
              </div>

              <form
                onSubmit={handleSaveFaqForm}
                className="space-y-3 bg-slate-50 p-4 rounded-xl border border-slate-200"
              >
                <p className="text-xs font-bold text-slate-800">
                  {faqIdEdit ? 'Edit FAQ Item' : 'Add New FAQ Item'}
                </p>
                <div className="grid grid-cols-1 sm:grid-cols-4 gap-3">
                  <input
                    type="text"
                    required
                    maxLength={200}
                    value={faqQuestion}
                    onChange={(e) => setFaqQuestion(e.target.value)}
                    placeholder="Question..."
                    className="sm:col-span-3 min-h-[40px] px-3 rounded-lg border border-slate-300 bg-white text-xs"
                  />
                  <input
                    type="number"
                    min={0}
                    max={500}
                    value={faqOrder}
                    onChange={(e) => setFaqOrder(Number(e.target.value))}
                    placeholder="Order"
                    className="min-h-[40px] px-3 rounded-lg border border-slate-300 bg-white text-xs font-mono"
                  />
                </div>
                <textarea
                  rows={2}
                  required
                  maxLength={1500}
                  value={faqAnswer}
                  onChange={(e) => setFaqAnswer(e.target.value)}
                  placeholder="Answer..."
                  className="w-full p-3 rounded-lg border border-slate-300 bg-white text-xs"
                />
                <div className="flex items-center justify-between">
                  <label className="inline-flex items-center gap-2 text-xs text-slate-700 cursor-pointer">
                    <input
                      type="checkbox"
                      checked={faqPublished}
                      onChange={(e) => setFaqPublished(e.target.checked)}
                      className="w-4 h-4 rounded text-indigo-600"
                    />
                    <span>Published on homepage</span>
                  </label>
                  <div className="flex items-center gap-2">
                    {faqIdEdit && (
                      <button
                        type="button"
                        onClick={() => {
                          setFaqIdEdit(null);
                          setFaqQuestion('');
                          setFaqAnswer('');
                        }}
                        className="px-3 py-1.5 rounded-lg border border-slate-200 text-xs font-semibold cursor-pointer"
                      >
                        Cancel
                      </button>
                    )}
                    <button
                      type="submit"
                      disabled={busy}
                      className="min-h-[38px] px-4 py-1.5 rounded-lg bg-slate-900 text-white text-xs font-semibold inline-flex items-center gap-1 cursor-pointer"
                    >
                      <Plus className="w-3.5 h-3.5" />
                      <span>{faqIdEdit ? 'Update FAQ' : 'Add FAQ'}</span>
                    </button>
                  </div>
                </div>
              </form>

              {faqs.length > 0 && (
                <div className="divide-y divide-slate-100">
                  {faqs.map((f) => (
                    <div
                      key={f.id}
                      className="py-3 flex flex-col sm:flex-row sm:items-center justify-between gap-3 text-xs"
                    >
                      <div>
                        <p className="font-bold text-slate-900">
                          {f.order}. {f.question}{' '}
                          {!f.isPublished && (
                            <span className="font-normal text-amber-600">(Hidden)</span>
                          )}
                        </p>
                        <p className="text-slate-600 mt-0.5">{f.answer}</p>
                      </div>
                      <div className="flex items-center gap-2 shrink-0">
                        <button
                          type="button"
                          onClick={() => {
                            setFaqIdEdit(f.id);
                            setFaqQuestion(f.question);
                            setFaqAnswer(f.answer);
                            setFaqOrder(f.order);
                            setFaqPublished(f.isPublished);
                          }}
                          className="px-2.5 py-1 rounded-lg border border-slate-200 font-semibold cursor-pointer"
                        >
                          Edit
                        </button>
                        <button
                          type="button"
                          onClick={() => setFaqDeleteTarget(f)}
                          aria-label="Delete FAQ"
                          className="w-8 h-8 rounded-lg border border-red-200 text-red-600 flex items-center justify-center cursor-pointer"
                        >
                          <Trash2 className="w-3.5 h-3.5" />
                        </button>
                      </div>
                    </div>
                  ))}
                </div>
              )}
            </div>
          </div>
        )}
      </div>

      {/* Receipt Screenshot Preview Modal */}
      {receiptPreviewReq && (
        <div className="fixed inset-0 z-50 bg-slate-950/75 flex items-center justify-center p-4">
          <div className="bg-white rounded-2xl max-w-lg w-full p-5 space-y-4 shadow-xl">
            <div className="flex items-center justify-between gap-3">
              <div>
                <h3 className="text-sm font-bold text-slate-900">Payment Receipt Screenshot</h3>
                <p className="text-xs text-slate-500 font-mono">
                  {receiptPreviewReq.userEmail} · Trx: {receiptPreviewReq.transactionId}
                </p>
              </div>
              <button
                type="button"
                onClick={() => setReceiptPreviewReq(null)}
                aria-label="Close receipt modal"
                className="w-8 h-8 rounded-lg border border-slate-200 flex items-center justify-center text-slate-600 hover:bg-slate-50 cursor-pointer"
              >
                <X className="w-4 h-4" />
              </button>
            </div>
            <div className="rounded-xl border border-slate-200 bg-slate-50 p-2 flex items-center justify-center max-h-[70vh] overflow-y-auto">
              <img
                src={receiptPreviewReq.receiptDataUrl}
                alt="User submitted payment receipt"
                className="max-w-full max-h-[65vh] object-contain rounded-lg"
              />
            </div>
          </div>
        </div>
      )}

      <ConfirmModal
        isOpen={Boolean(pmDeleteTarget)}
        title="Delete payment method?"
        description={`"${pmDeleteTarget?.providerName || ''}" (${pmDeleteTarget?.accountNumber || ''}) will be removed from the manual payment options.`}
        confirmLabel="Delete Method"
        busy={busy}
        onCancel={() => setPmDeleteTarget(null)}
        onConfirm={handleConfirmDeletePaymentMethod}
      />

      <ConfirmModal
        isOpen={Boolean(faqDeleteTarget)}
        title="Delete FAQ item?"
        description={`"${faqDeleteTarget?.question || ''}" will be permanently removed from the homepage.`}
        confirmLabel="Delete FAQ"
        busy={busy}
        onCancel={() => setFaqDeleteTarget(null)}
        onConfirm={handleConfirmDeleteFaq}
      />
    </div>
  );
};
