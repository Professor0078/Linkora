import React, { useEffect, useState } from 'react';
import {
  Check,
  CheckCircle2,
  Copy,
  CreditCard,
  HelpCircle,
  ImagePlus,
  LogOut,
  Mail,
  RefreshCw,
  Send,
  Trash2,
} from 'lucide-react';
import {
  fetchActivePaymentMethods,
  fetchUserPaymentRequests,
  fetchUserSupportTickets,
  submitPaymentVerificationRequest,
  submitSupportTicket,
  updateAccountDisplayName,
} from '../../lib/firestoreService';
import { compressImageToDataUrl } from '../../lib/validation';
import {
  PaymentMethodRecord,
  PaymentRequestRecord,
  PlanTier,
  ProfileConfig,
  SubscriptionRecord,
  SupportCategory,
  SupportTicketRecord,
  UserAccount,
} from '../../types/linkora';

interface AccountPanelProps {
  account: UserAccount;
  profile: ProfileConfig;
  onSendPasswordReset: (email: string) => Promise<void>;
  onRefresh: () => Promise<void>;
  onLogout: () => Promise<void>;
}

export const AccountSettingsPanel: React.FC<AccountPanelProps> = ({
  account,
  profile,
  onSendPasswordReset,
  onRefresh,
  onLogout,
}) => {
  const [name, setName] = useState(account.displayName);
  const [busy, setBusy] = useState(false);
  const [statusMsg, setStatusMsg] = useState('');
  const [errMsg, setErrMsg] = useState('');

  const handleSaveName = async (e: React.FormEvent) => {
    e.preventDefault();
    setBusy(true);
    setStatusMsg('');
    setErrMsg('');
    try {
      await updateAccountDisplayName(account.uid, name);
      await onRefresh();
      setStatusMsg('Account display name updated.');
    } catch (err) {
      setErrMsg(err instanceof Error ? err.message : 'Could not update account name.');
    } finally {
      setBusy(false);
    }
  };

  const handleResetTrigger = async () => {
    setBusy(true);
    setStatusMsg('');
    setErrMsg('');
    try {
      await onSendPasswordReset(account.email);
      setStatusMsg(`Password reset email sent to ${account.email}.`);
    } catch (err) {
      setErrMsg(err instanceof Error ? err.message : 'Could not send reset email.');
    } finally {
      setBusy(false);
    }
  };

  return (
    <div className="space-y-6 max-w-2xl">
      <div className="rounded-2xl border border-slate-200 dark:border-slate-800 bg-white dark:bg-slate-900 p-6 space-y-5">
        <div>
          <h2 className="text-lg font-bold text-slate-900 dark:text-white">Account Settings</h2>
          <p className="text-xs text-slate-500 dark:text-slate-400 mt-0.5">
            Manage your isolated private account details and authentication security.
          </p>
        </div>

        {statusMsg && (
          <div className="p-3 rounded-xl bg-emerald-50 dark:bg-emerald-950/50 border border-emerald-200 dark:border-emerald-900 text-xs text-emerald-800 dark:text-emerald-300">
            {statusMsg}
          </div>
        )}
        {errMsg && (
          <div className="p-3 rounded-xl bg-red-50 dark:bg-red-950/50 border border-red-200 dark:border-red-900 text-xs text-red-700 dark:text-red-300">
            {errMsg}
          </div>
        )}

        <form onSubmit={handleSaveName} className="space-y-4">
          <div>
            <label
              htmlFor="acct-email"
              className="block text-xs font-semibold text-slate-700 dark:text-slate-300 mb-1"
            >
              Verified Account Email (Private)
            </label>
            <input
              id="acct-email"
              type="email"
              disabled
              value={account.email}
              className="w-full min-h-[42px] px-3.5 py-2 rounded-xl border border-slate-200 dark:border-slate-800 bg-slate-50 dark:bg-slate-950 text-sm text-slate-500"
            />
          </div>

          <div>
            <label
              htmlFor="acct-name"
              className="block text-xs font-semibold text-slate-700 dark:text-slate-300 mb-1"
            >
              Account Owner Name
            </label>
            <input
              id="acct-name"
              type="text"
              required
              maxLength={80}
              value={name}
              onChange={(e) => setName(e.target.value)}
              className="w-full min-h-[42px] px-3.5 py-2 rounded-xl border border-slate-300 dark:border-slate-700 bg-white dark:bg-slate-950 text-sm text-slate-900 dark:text-white"
            />
          </div>

          <div className="flex items-center justify-between pt-2">
            <span className="text-xs text-slate-500 font-mono">
              Public Slug: /{profile.username}
            </span>
            <button
              type="submit"
              disabled={busy}
              className="min-h-[40px] px-4 py-2 rounded-xl bg-indigo-600 hover:bg-indigo-700 text-white text-xs font-semibold cursor-pointer"
            >
              Save Account Name
            </button>
          </div>
        </form>
      </div>

      <div className="rounded-2xl border border-slate-200 dark:border-slate-800 bg-white dark:bg-slate-900 p-6 flex flex-col sm:flex-row sm:items-center justify-between gap-4">
        <div>
          <h3 className="text-sm font-bold text-slate-900 dark:text-white">Password &amp; Session</h3>
          <p className="text-xs text-slate-500 dark:text-slate-400 mt-0.5">
            Send a password reset link to your verified email or sign out of this browser.
          </p>
        </div>
        <div className="flex items-center gap-2.5 shrink-0">
          <button
            type="button"
            disabled={busy}
            onClick={handleResetTrigger}
            className="min-h-[40px] px-3.5 py-2 rounded-xl border border-slate-200 dark:border-slate-700 text-xs font-semibold text-slate-700 dark:text-slate-200 hover:bg-slate-50 dark:hover:bg-slate-800 inline-flex items-center gap-1.5 cursor-pointer whitespace-nowrap"
          >
            <Mail className="w-3.5 h-3.5" />
            <span>Reset Password</span>
          </button>
          <button
            type="button"
            onClick={onLogout}
            className="min-h-[40px] px-3.5 py-2 rounded-xl border border-red-200 dark:border-red-900/60 text-xs font-semibold text-red-600 dark:text-red-400 hover:bg-red-50 dark:hover:bg-red-950/40 inline-flex items-center gap-1.5 cursor-pointer whitespace-nowrap"
          >
            <LogOut className="w-3.5 h-3.5" />
            <span>Sign Out</span>
          </button>
        </div>
      </div>
    </div>
  );
};

interface SubscriptionPanelProps {
  account: UserAccount;
  profile: ProfileConfig;
  plan: PlanTier;
  subscription: SubscriptionRecord | null;
  premiumPriceMonthly: number;
  onRefresh: () => Promise<void>;
  onGoToSupport: () => void;
}

export const SubscriptionPanel: React.FC<SubscriptionPanelProps> = ({
  account,
  profile,
  plan,
  subscription,
  premiumPriceMonthly,
  onRefresh,
  onGoToSupport,
}) => {
  const [methods, setMethods] = useState<PaymentMethodRecord[]>([]);
  const [requests, setRequests] = useState<PaymentRequestRecord[]>([]);
  const [loadingData, setLoadingData] = useState(true);
  const [selectedMethodId, setSelectedMethodId] = useState<string>('');
  const [copiedId, setCopiedId] = useState<string>('');

  // Manual payment verification form state
  const [senderName, setSenderName] = useState(account.displayName || '');
  const [senderAccount, setSenderAccount] = useState('');
  const [transactionId, setTransactionId] = useState('');
  const [receiptDataUrl, setReceiptDataUrl] = useState('');
  const [userNote, setUserNote] = useState('');

  const [submitting, setSubmitting] = useState(false);
  const [uploadingReceipt, setUploadingReceipt] = useState(false);
  const [successMsg, setSuccessMsg] = useState('');
  const [errorMsg, setErrorMsg] = useState('');

  const loadPaymentData = async () => {
    setLoadingData(true);
    try {
      const [activeMethods, userRequests] = await Promise.all([
        fetchActivePaymentMethods(),
        fetchUserPaymentRequests(account.uid),
      ]);
      setMethods(activeMethods);
      setRequests(userRequests);
      if (activeMethods.length > 0 && !selectedMethodId) {
        setSelectedMethodId(activeMethods[0].id);
      }
    } catch {
      // Non-fatal if empty on initial setup
    } finally {
      setLoadingData(false);
    }
  };

  useEffect(() => {
    void loadPaymentData();
  }, [account.uid]);

  const selectedMethod =
    methods.find((m) => m.id === selectedMethodId) || methods[0] || null;
  const hasPendingRequest = requests.some((r) => r.status === 'pending');

  const handleCopyAccount = async (method: PaymentMethodRecord) => {
    try {
      await navigator.clipboard.writeText(method.accountNumber);
      setCopiedId(method.id);
      setTimeout(() => setCopiedId(''), 2200);
    } catch {
      // Clipboard fallback ignored
    }
  };

  const handleReceiptChange = async (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (!file) return;
    setUploadingReceipt(true);
    setErrorMsg('');
    try {
      const compressed = await compressImageToDataUrl(file, 900, 145000);
      setReceiptDataUrl(compressed);
    } catch (err) {
      setErrorMsg(err instanceof Error ? err.message : 'Could not process receipt image.');
    } finally {
      setUploadingReceipt(false);
      e.target.value = '';
    }
  };

  const handleSubmitPayment = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!selectedMethod) {
      setErrorMsg('Please select a payment method first.');
      return;
    }
    setSubmitting(true);
    setErrorMsg('');
    setSuccessMsg('');
    try {
      await submitPaymentVerificationRequest({
        uid: account.uid,
        userEmail: account.email,
        username: profile.username,
        method: selectedMethod,
        amountUsd: premiumPriceMonthly,
        senderName,
        senderAccount,
        transactionId,
        receiptDataUrl,
        userNote,
      });
      setSenderAccount('');
      setTransactionId('');
      setReceiptDataUrl('');
      setUserNote('');
      setSuccessMsg(
        'Payment verification request submitted! An administrator will review your proof and activate your Premium plan.'
      );
      await loadPaymentData();
    } catch (err) {
      setErrorMsg(err instanceof Error ? err.message : 'Failed to submit payment verification.');
    } finally {
      setSubmitting(false);
    }
  };

  const handleRefreshAll = async () => {
    await Promise.all([loadPaymentData(), onRefresh()]);
  };

  return (
    <div className="space-y-6 max-w-4xl">
      {/* Current Plan Summary */}
      <div className="rounded-2xl border border-slate-200 dark:border-slate-800 bg-white dark:bg-slate-900 p-6 flex flex-col sm:flex-row sm:items-center justify-between gap-4">
        <div>
          <p className="text-xs text-slate-500 dark:text-slate-400">Current Active Tier</p>
          <h2 className="text-xl font-bold capitalize text-slate-900 dark:text-white mt-0.5">
            {plan} Plan
          </h2>
          <p className="text-xs text-slate-500 dark:text-slate-400 mt-1">
            Status: <span className="font-semibold capitalize">{subscription?.status || 'active'}</span>{' '}
            <span aria-hidden="true">·</span> Enforced by server-side Firestore security rules
          </p>
        </div>
        <button
          type="button"
          onClick={handleRefreshAll}
          className="min-h-[38px] px-3.5 py-1.5 rounded-xl border border-slate-200 dark:border-slate-700 text-xs font-semibold text-slate-700 dark:text-slate-200 hover:bg-slate-50 dark:hover:bg-slate-800 inline-flex items-center gap-1.5 cursor-pointer self-start sm:self-auto whitespace-nowrap"
        >
          <RefreshCw className={`w-3.5 h-3.5 ${loadingData ? 'animate-spin' : ''}`} />
          <span>Refresh Plan Status</span>
        </button>
      </div>

      {/* Plan Comparison Grid */}
      <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
        <div className="rounded-2xl border border-slate-200 dark:border-slate-800 bg-white dark:bg-slate-900 p-6 flex flex-col justify-between">
          <div>
            <h3 className="text-lg font-bold text-slate-900 dark:text-white">Free Plan</h3>
            <p className="text-2xl font-bold font-mono tabular-nums text-slate-900 dark:text-white mt-2">
              $0 <span className="text-xs font-sans font-normal text-slate-500">/ month</span>
            </p>
            <ul className="mt-5 space-y-2.5 text-xs text-slate-600 dark:text-slate-300">
              <li className="flex items-center gap-2">
                <Check className="w-4 h-4 text-emerald-600 shrink-0" />
                <span>1 bio page &amp; custom public URL</span>
              </li>
              <li className="flex items-center gap-2">
                <Check className="w-4 h-4 text-emerald-600 shrink-0" />
                <span>Up to 10 links</span>
              </li>
              <li className="flex items-center gap-2">
                <Check className="w-4 h-4 text-emerald-600 shrink-0" />
                <span>5 Basic themes &amp; color customization</span>
              </li>
              <li className="flex items-center gap-2">
                <Check className="w-4 h-4 text-emerald-600 shrink-0" />
                <span>QR code sharing &amp; core analytics</span>
              </li>
            </ul>
          </div>
          <div className="mt-6 pt-4 border-t border-slate-100 dark:border-slate-800 text-xs font-semibold text-slate-500">
            {plan === 'free' ? 'Currently active on your account' : 'Included in your account'}
          </div>
        </div>

        <div className="rounded-2xl border-2 border-indigo-600 bg-white dark:bg-slate-900 p-6 flex flex-col justify-between">
          <div>
            <h3 className="text-lg font-bold text-slate-900 dark:text-white">Premium Plan</h3>
            <p className="text-2xl font-bold font-mono tabular-nums text-slate-900 dark:text-white mt-2">
              ${premiumPriceMonthly}{' '}
              <span className="text-xs font-sans font-normal text-slate-500">/ month</span>
            </p>
            <ul className="mt-5 space-y-2.5 text-xs text-slate-600 dark:text-slate-300">
              <li className="flex items-center gap-2">
                <Check className="w-4 h-4 text-indigo-600 shrink-0" />
                <span>Up to 50 active destination links</span>
              </li>
              <li className="flex items-center gap-2">
                <Check className="w-4 h-4 text-indigo-600 shrink-0" />
                <span>All 8 themes (Glassmorphism, Creator Neon, Pink Aesthetic)</span>
              </li>
              <li className="flex items-center gap-2">
                <Check className="w-4 h-4 text-indigo-600 shrink-0" />
                <span>Custom SEO title &amp; meta description</span>
              </li>
              <li className="flex items-center gap-2">
                <Check className="w-4 h-4 text-indigo-600 shrink-0" />
                <span>Expanded analytics &amp; priority support</span>
              </li>
            </ul>
          </div>

          <div className="mt-6 pt-4 border-t border-slate-100 dark:border-slate-800">
            {plan === 'premium' ? (
              <p className="text-xs font-semibold text-emerald-700 dark:text-emerald-400">
                Premium Plan is active on your account
              </p>
            ) : (
              <p className="text-xs text-slate-600 dark:text-slate-300">
                Complete manual payment below and submit your transaction proof for admin approval.
              </p>
            )}
          </div>
        </div>
      </div>

      {/* Manual Payment & Admin Verification Section */}
      {plan !== 'premium' && (
        <div className="rounded-2xl border border-slate-200 dark:border-slate-800 bg-white dark:bg-slate-900 p-6 space-y-6">
          <div className="flex items-start gap-3">
            <div className="w-10 h-10 rounded-xl bg-indigo-50 dark:bg-indigo-950/60 text-indigo-600 dark:text-indigo-400 flex items-center justify-center shrink-0">
              <CreditCard className="w-5 h-5" />
            </div>
            <div>
              <h3 className="text-base font-bold text-slate-900 dark:text-white">
                Upgrade via Manual Payment
              </h3>
              <p className="text-xs text-slate-500 dark:text-slate-400 mt-0.5 leading-relaxed">
                Choose a payment method below, send{' '}
                <strong className="font-mono tabular-nums text-slate-800 dark:text-slate-200">
                  ${premiumPriceMonthly}
                </strong>{' '}
                (or local currency equivalent as instructed), and submit your Transaction ID &amp;
                screenshot. An administrator will verify and activate your Premium plan.
              </p>
            </div>
          </div>

          {successMsg && (
            <div className="p-3.5 rounded-xl bg-emerald-50 dark:bg-emerald-950/50 border border-emerald-200 dark:border-emerald-900 text-xs text-emerald-800 dark:text-emerald-300 flex items-center gap-2">
              <CheckCircle2 className="w-4 h-4 shrink-0" />
              <span>{successMsg}</span>
            </div>
          )}

          {errorMsg && (
            <div className="p-3.5 rounded-xl bg-red-50 dark:bg-red-950/50 border border-red-200 dark:border-red-900 text-xs text-red-700 dark:text-red-300">
              {errorMsg}
            </div>
          )}

          {loadingData ? (
            <p className="text-xs text-slate-500">Loading available payment methods...</p>
          ) : methods.length === 0 ? (
            <div className="rounded-xl border border-slate-200 dark:border-slate-800 bg-slate-50 dark:bg-slate-950 p-4 text-xs text-slate-600 dark:text-slate-300 space-y-2">
              <p className="font-semibold text-slate-900 dark:text-white">
                No manual payment methods configured yet
              </p>
              <p>
                The platform administrator has not published manual payment account details yet.
                Please check back shortly or{' '}
                <button
                  type="button"
                  onClick={onGoToSupport}
                  className="text-indigo-600 dark:text-indigo-400 font-semibold underline cursor-pointer"
                >
                  contact Support
                </button>
                .
              </p>
            </div>
          ) : (
            <>
              {/* Step 1: Select Payment Method */}
              <div className="space-y-3">
                <p className="text-xs font-bold text-slate-800 dark:text-slate-200">
                  01. Select Payment Method &amp; Copy Account Details
                </p>
                <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
                  {methods.map((m) => {
                    const active = selectedMethod?.id === m.id;
                    return (
                      <button
                        key={m.id}
                        type="button"
                        onClick={() => setSelectedMethodId(m.id)}
                        className={`rounded-xl border p-4 text-left transition-colors cursor-pointer ${
                          active
                            ? 'border-2 border-indigo-600 bg-indigo-50/40 dark:bg-indigo-950/30'
                            : 'border-slate-200 dark:border-slate-800 hover:border-slate-300'
                        }`}
                      >
                        <p className="text-sm font-bold text-slate-900 dark:text-white">
                          {m.providerName}
                        </p>
                        <p className="text-xs text-slate-600 dark:text-slate-300 mt-1">
                          Title: <span className="font-semibold">{m.accountTitle}</span>
                        </p>
                        <p className="text-xs font-mono text-slate-700 dark:text-slate-200 mt-0.5 break-all">
                          {m.accountNumber}
                        </p>
                      </button>
                    );
                  })}
                </div>

                {selectedMethod && (
                  <div className="rounded-xl border border-slate-200 dark:border-slate-800 bg-slate-50 dark:bg-slate-950 p-4 space-y-2.5">
                    <div className="flex flex-wrap items-center justify-between gap-3">
                      <div>
                        <p className="text-xs text-slate-500 dark:text-slate-400">
                          Send payment to ({selectedMethod.providerName})
                        </p>
                        <p className="text-sm font-bold text-slate-900 dark:text-white mt-0.5">
                          {selectedMethod.accountTitle}
                        </p>
                        <p className="text-sm font-mono font-semibold text-indigo-600 dark:text-indigo-400 mt-0.5 break-all">
                          {selectedMethod.accountNumber}
                        </p>
                      </div>
                      <button
                        type="button"
                        onClick={() => handleCopyAccount(selectedMethod)}
                        className="min-h-[38px] px-3.5 py-1.5 rounded-lg border border-slate-300 dark:border-slate-700 bg-white dark:bg-slate-900 text-xs font-semibold text-slate-800 dark:text-slate-200 inline-flex items-center gap-1.5 cursor-pointer shrink-0"
                      >
                        {copiedId === selectedMethod.id ? (
                          <>
                            <Check className="w-3.5 h-3.5 text-emerald-600" />
                            <span>Copied</span>
                          </>
                        ) : (
                          <>
                            <Copy className="w-3.5 h-3.5" />
                            <span>Copy Number</span>
                          </>
                        )}
                      </button>
                    </div>
                    {selectedMethod.instructions && (
                      <p className="text-xs text-slate-600 dark:text-slate-300 pt-2 border-t border-slate-200/70 dark:border-slate-800 whitespace-pre-line">
                        {selectedMethod.instructions}
                      </p>
                    )}
                  </div>
                )}
              </div>

              {/* Step 2: Submit Verification Proof */}
              {hasPendingRequest ? (
                <div className="rounded-xl border border-amber-200 dark:border-amber-900/60 bg-amber-50/70 dark:bg-amber-950/30 p-4 text-xs text-amber-900 dark:text-amber-200">
                  You already have a payment verification request waiting for admin review. Once the
                  administrator approves or responds, your status will update below.
                </div>
              ) : (
                <form onSubmit={handleSubmitPayment} className="space-y-4 pt-2 border-t border-slate-100 dark:border-slate-800">
                  <p className="text-xs font-bold text-slate-800 dark:text-slate-200">
                    02. Submit Payment Details for Manual Verification
                  </p>

                  <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                    <div>
                      <label
                        htmlFor="pay-sender-name"
                        className="block text-xs font-semibold text-slate-700 dark:text-slate-300 mb-1"
                      >
                        Sender Account Name
                      </label>
                      <input
                        id="pay-sender-name"
                        type="text"
                        required
                        minLength={2}
                        maxLength={100}
                        value={senderName}
                        onChange={(e) => setSenderName(e.target.value)}
                        placeholder="e.g. Muhammad Usman"
                        className="w-full min-h-[42px] px-3.5 py-2 rounded-xl border border-slate-300 dark:border-slate-700 bg-white dark:bg-slate-950 text-sm text-slate-900 dark:text-white"
                      />
                    </div>

                    <div>
                      <label
                        htmlFor="pay-sender-acct"
                        className="block text-xs font-semibold text-slate-700 dark:text-slate-300 mb-1"
                      >
                        Sender Phone / Account Number
                      </label>
                      <input
                        id="pay-sender-acct"
                        type="text"
                        required
                        minLength={2}
                        maxLength={120}
                        value={senderAccount}
                        onChange={(e) => setSenderAccount(e.target.value)}
                        placeholder="e.g. 0300-1234567"
                        className="w-full min-h-[42px] px-3.5 py-2 rounded-xl border border-slate-300 dark:border-slate-700 bg-white dark:bg-slate-950 text-sm font-mono text-slate-900 dark:text-white"
                      />
                    </div>
                  </div>

                  <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                    <div>
                      <label
                        htmlFor="pay-trx-id"
                        className="block text-xs font-semibold text-slate-700 dark:text-slate-300 mb-1"
                      >
                        Transaction ID (Trx ID / Reference #)
                      </label>
                      <input
                        id="pay-trx-id"
                        type="text"
                        required
                        minLength={3}
                        maxLength={120}
                        value={transactionId}
                        onChange={(e) => setTransactionId(e.target.value)}
                        placeholder="e.g. 84920174921"
                        className="w-full min-h-[42px] px-3.5 py-2 rounded-xl border border-slate-300 dark:border-slate-700 bg-white dark:bg-slate-950 text-sm font-mono text-slate-900 dark:text-white"
                      />
                    </div>

                    <div>
                      <label className="block text-xs font-semibold text-slate-700 dark:text-slate-300 mb-1">
                        Payment Screenshot (Optional)
                      </label>
                      <div className="flex items-center gap-2">
                        <label className="min-h-[42px] px-3.5 py-2 rounded-xl border border-slate-300 dark:border-slate-700 bg-white dark:bg-slate-950 text-xs font-semibold text-slate-700 dark:text-slate-200 hover:bg-slate-50 dark:hover:bg-slate-900 inline-flex items-center gap-2 cursor-pointer">
                          <ImagePlus className="w-4 h-4 text-indigo-600" />
                          <span>
                            {uploadingReceipt
                              ? 'Compressing...'
                              : receiptDataUrl
                              ? 'Change Screenshot'
                              : 'Upload Screenshot'}
                          </span>
                          <input
                            type="file"
                            accept="image/*"
                            onChange={handleReceiptChange}
                            className="hidden"
                          />
                        </label>
                        {receiptDataUrl && (
                          <button
                            type="button"
                            onClick={() => setReceiptDataUrl('')}
                            aria-label="Remove screenshot"
                            className="min-h-[42px] px-3 rounded-xl border border-red-200 dark:border-red-900/60 text-red-600 dark:text-red-400 inline-flex items-center justify-center cursor-pointer"
                          >
                            <Trash2 className="w-4 h-4" />
                          </button>
                        )}
                      </div>
                    </div>
                  </div>

                  {receiptDataUrl && (
                    <div className="rounded-xl border border-slate-200 dark:border-slate-800 p-2 w-fit bg-slate-50 dark:bg-slate-950">
                      <img
                        src={receiptDataUrl}
                        alt="Payment receipt preview"
                        className="max-h-44 rounded-lg object-contain"
                      />
                    </div>
                  )}

                  <div>
                    <label
                      htmlFor="pay-note"
                      className="block text-xs font-semibold text-slate-700 dark:text-slate-300 mb-1"
                    >
                      Optional Note for Admin
                    </label>
                    <input
                      id="pay-note"
                      type="text"
                      maxLength={500}
                      value={userNote}
                      onChange={(e) => setUserNote(e.target.value)}
                      placeholder="Any helpful note regarding your transfer..."
                      className="w-full min-h-[42px] px-3.5 py-2 rounded-xl border border-slate-300 dark:border-slate-700 bg-white dark:bg-slate-950 text-sm text-slate-900 dark:text-white"
                    />
                  </div>

                  <button
                    type="submit"
                    disabled={submitting || uploadingReceipt}
                    className="min-h-[44px] px-6 py-2.5 rounded-xl bg-indigo-600 hover:bg-indigo-700 text-white text-xs font-semibold inline-flex items-center gap-2 cursor-pointer disabled:opacity-50"
                  >
                    <Send className="w-3.5 h-3.5" />
                    <span>
                      {submitting ? 'Submitting Verification...' : 'Submit Payment for Verification'}
                    </span>
                  </button>
                </form>
              )}
            </>
          )}
        </div>
      )}

      {/* User's Submitted Payment Requests History */}
      {requests.length > 0 && (
        <div className="rounded-2xl border border-slate-200 dark:border-slate-800 bg-white dark:bg-slate-900 p-6 space-y-4">
          <h3 className="text-sm font-bold text-slate-900 dark:text-white">
            Your Payment Verification History
          </h3>
          <div className="divide-y divide-slate-100 dark:divide-slate-800">
            {requests.map((req) => (
              <div key={req.id} className="py-3.5 first:pt-0 last:pb-0 space-y-1.5 text-xs">
                <div className="flex flex-wrap items-center justify-between gap-2">
                  <div className="flex flex-wrap items-center gap-2 text-slate-700 dark:text-slate-200">
                    <span className="font-bold text-slate-900 dark:text-white">
                      {req.methodName}
                    </span>
                    <span aria-hidden="true">·</span>
                    <span className="font-mono tabular-nums">${req.amountUsd}</span>
                    <span aria-hidden="true">·</span>
                    <span className="font-mono text-slate-500">Trx: {req.transactionId}</span>
                  </div>
                  <span
                    className={`font-semibold capitalize ${
                      req.status === 'approved'
                        ? 'text-emerald-700 dark:text-emerald-400'
                        : req.status === 'rejected'
                        ? 'text-red-600 dark:text-red-400'
                        : 'text-amber-600 dark:text-amber-400'
                    }`}
                  >
                    Status: {req.status}
                  </span>
                </div>
                <p className="text-slate-500 dark:text-slate-400">
                  Sender: {req.senderName} ({req.senderAccount})
                </p>
                {req.adminNote && (
                  <p className="text-indigo-700 dark:text-indigo-300 pt-1">
                    <strong>Admin Note:</strong> {req.adminNote}
                  </p>
                )}
              </div>
            ))}
          </div>
        </div>
      )}
    </div>
  );
};

interface SupportPanelProps {
  uid: string;
  email: string;
}

export const HelpAndSupportPanel: React.FC<SupportPanelProps> = ({ uid, email }) => {
  const [tickets, setTickets] = useState<SupportTicketRecord[]>([]);
  const [category, setCategory] = useState<SupportCategory>('technical');
  const [subject, setSubject] = useState('');
  const [message, setMessage] = useState('');
  const [busy, setBusy] = useState(false);
  const [sent, setSent] = useState(false);
  const [err, setErr] = useState('');

  const loadTickets = async () => {
    try {
      const list = await fetchUserSupportTickets(uid);
      setTickets(list);
    } catch {
      // Ignore initial empty errors
    }
  };

  useEffect(() => {
    void loadTickets();
  }, [uid]);

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setBusy(true);
    setErr('');
    setSent(false);
    try {
      await submitSupportTicket(uid, email, { category, subject, message });
      setSubject('');
      setMessage('');
      setSent(true);
      await loadTickets();
    } catch (error) {
      setErr(error instanceof Error ? error.message : 'Could not submit ticket.');
    } finally {
      setBusy(false);
    }
  };

  return (
    <div className="space-y-6 max-w-3xl">
      <div className="rounded-2xl border border-slate-200 dark:border-slate-800 bg-white dark:bg-slate-900 p-6">
        <div className="flex items-start gap-3 mb-5">
          <div className="w-10 h-10 rounded-xl bg-indigo-50 dark:bg-indigo-950/60 text-indigo-600 dark:text-indigo-400 flex items-center justify-center shrink-0">
            <HelpCircle className="w-5 h-5" />
          </div>
          <div>
            <h2 className="text-lg font-bold text-slate-900 dark:text-white">Help &amp; Support</h2>
            <p className="text-xs text-slate-500 dark:text-slate-400 mt-0.5">
              Submit a ticket directly to platform administrators and track responses here.
            </p>
          </div>
        </div>

        {sent && (
          <div className="mb-4 p-3.5 rounded-xl bg-emerald-50 dark:bg-emerald-950/50 border border-emerald-200 dark:border-emerald-900 text-xs text-emerald-800 dark:text-emerald-300 flex items-center gap-2">
            <CheckCircle2 className="w-4 h-4 shrink-0" />
            <span>Support ticket submitted! Replies will appear below.</span>
          </div>
        )}
        {err && (
          <div className="mb-4 p-3.5 rounded-xl bg-red-50 dark:bg-red-950/50 border border-red-200 dark:border-red-900 text-xs text-red-700 dark:text-red-300">
            {err}
          </div>
        )}

        <form onSubmit={handleSubmit} className="space-y-4">
          <div className="grid grid-cols-1 sm:grid-cols-3 gap-4">
            <div>
              <label
                htmlFor="sup-cat"
                className="block text-xs font-semibold text-slate-700 dark:text-slate-300 mb-1"
              >
                Topic
              </label>
              <select
                id="sup-cat"
                value={category}
                onChange={(e) => setCategory(e.target.value as SupportCategory)}
                className="w-full min-h-[42px] px-3 py-2 rounded-xl border border-slate-300 dark:border-slate-700 bg-white dark:bg-slate-950 text-sm text-slate-900 dark:text-white"
              >
                <option value="technical">Technical Help</option>
                <option value="account">Account &amp; Username</option>
                <option value="billing">Subscription &amp; Plans</option>
                <option value="feature">Feature Request</option>
                <option value="abuse">Trust &amp; Safety</option>
              </select>
            </div>
            <div className="sm:col-span-2">
              <label
                htmlFor="sup-sub"
                className="block text-xs font-semibold text-slate-700 dark:text-slate-300 mb-1"
              >
                Subject
              </label>
              <input
                id="sup-sub"
                type="text"
                required
                minLength={3}
                maxLength={120}
                value={subject}
                onChange={(e) => setSubject(e.target.value)}
                placeholder="Brief summary of your question"
                className="w-full min-h-[42px] px-3.5 py-2 rounded-xl border border-slate-300 dark:border-slate-700 bg-white dark:bg-slate-950 text-sm text-slate-900 dark:text-white"
              />
            </div>
          </div>

          <div>
            <label
              htmlFor="sup-msg"
              className="block text-xs font-semibold text-slate-700 dark:text-slate-300 mb-1"
            >
              Details
            </label>
            <textarea
              id="sup-msg"
              rows={4}
              required
              minLength={10}
              maxLength={2000}
              value={message}
              onChange={(e) => setMessage(e.target.value)}
              placeholder="Describe what you need assistance with..."
              className="w-full p-3.5 rounded-xl border border-slate-300 dark:border-slate-700 bg-white dark:bg-slate-950 text-sm text-slate-900 dark:text-white"
            />
          </div>

          <button
            type="submit"
            disabled={busy}
            className="min-h-[42px] px-5 py-2 rounded-xl bg-indigo-600 hover:bg-indigo-700 text-white text-xs font-semibold inline-flex items-center gap-2 cursor-pointer"
          >
            <Send className="w-3.5 h-3.5" />
            <span>{busy ? 'Sending...' : 'Submit Ticket'}</span>
          </button>
        </form>
      </div>

      {/* Submitted Tickets History */}
      <div className="rounded-2xl border border-slate-200 dark:border-slate-800 bg-white dark:bg-slate-900 p-6">
        <h3 className="text-sm font-bold text-slate-900 dark:text-white mb-4">Your Support Tickets</h3>
        {tickets.length === 0 ? (
          <p className="text-xs text-slate-500 dark:text-slate-400">
            You haven’t submitted any support tickets yet.
          </p>
        ) : (
          <div className="space-y-4">
            {tickets.map((t) => (
              <div
                key={t.id}
                className="rounded-xl border border-slate-200 dark:border-slate-800 p-4 space-y-2"
              >
                <div className="flex flex-wrap items-center justify-between gap-2 text-xs">
                  <span className="font-bold text-slate-900 dark:text-white">{t.subject}</span>
                  <span className="text-slate-500 capitalize">
                    {t.category} · Status:{' '}
                    <strong className="text-slate-800 dark:text-slate-200">
                      {t.status.replace('_', ' ')}
                    </strong>
                  </span>
                </div>
                <p className="text-xs text-slate-600 dark:text-slate-300 whitespace-pre-line">
                  {t.message}
                </p>
                {t.adminReply && (
                  <div className="mt-2 pt-2 border-t border-slate-100 dark:border-slate-800 text-xs text-indigo-700 dark:text-indigo-300">
                    <strong>Admin Reply:</strong> {t.adminReply}
                  </div>
                )}
              </div>
            ))}
          </div>
        )}
      </div>
    </div>
  );
};
