import React, { useEffect, useState } from 'react';
import { Link, useNavigate, useSearchParams } from 'react-router-dom';
import { ArrowLeft, CheckCircle2, Mail, RefreshCw, ShieldAlert } from 'lucide-react';
import { useAuth } from '../context/AuthContext';

type AuthMode = 'login' | 'signup' | 'reset';

export const AuthPage: React.FC<{ initialMode: AuthMode }> = ({ initialMode }) => {
  const {
    firebaseUser,
    needsEmailVerification,
    signInWithGoogle,
    signInWithEmail,
    registerWithEmail,
    sendPasswordReset,
    resendVerificationEmail,
    refreshVerificationStatus,
    logout,
  } = useAuth();

  const navigate = useNavigate();
  const [searchParams] = useSearchParams();
  const [mode, setMode] = useState<AuthMode>(initialMode);

  const [displayName, setDisplayName] = useState('');
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');

  const [busy, setBusy] = useState(false);
  const [error, setError] = useState('');
  const [infoMessage, setInfoMessage] = useState('');

  useEffect(() => {
    setMode(initialMode);
    setError('');
    setInfoMessage('');
  }, [initialMode]);

  useEffect(() => {
    const titles: Record<AuthMode, string> = {
      login: 'Sign In – Linkora',
      signup: 'Create Your Free Page – Linkora',
      reset: 'Reset Password – Linkora',
    };
    document.title = titles[mode];
  }, [mode]);

  useEffect(() => {
    if (firebaseUser && !needsEmailVerification) {
      const requestedSlug = searchParams.get('username');
      const requestedTheme = searchParams.get('theme');
      const params = new URLSearchParams();
      if (requestedSlug) params.set('claim', requestedSlug);
      if (requestedTheme) params.set('theme', requestedTheme);
      const queryStr = params.toString();
      navigate(queryStr ? `/dashboard?${queryStr}` : '/dashboard', { replace: true });
    }
  }, [firebaseUser, needsEmailVerification, navigate, searchParams]);

  const handleGoogleLogin = async () => {
    setError('');
    setInfoMessage('');
    setBusy(true);
    try {
      await signInWithGoogle();
    } catch (err) {
      setError(err instanceof Error ? err.message : 'Google sign-in failed.');
    } finally {
      setBusy(false);
    }
  };

  const handleFormSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setError('');
    setInfoMessage('');
    setBusy(true);

    try {
      if (mode === 'login') {
        await signInWithEmail(email, password);
      } else if (mode === 'signup') {
        if (displayName.trim().length < 2) {
          throw new Error('Please enter your name (at least 2 characters).');
        }
        if (password.length < 6) {
          throw new Error('Password must be at least 6 characters.');
        }
        await registerWithEmail(displayName, email, password);
        setInfoMessage(
          'Account created! Please click the verification link sent to your email to activate your workspace.'
        );
      } else {
        await sendPasswordReset(email);
        setInfoMessage('Password reset instructions have been sent to your email address.');
      }
    } catch (err) {
      setError(err instanceof Error ? err.message : 'Unable to complete request.');
    } finally {
      setBusy(false);
    }
  };

  const handleRefreshVerified = async () => {
    setBusy(true);
    setError('');
    try {
      const verified = await refreshVerificationStatus();
      if (!verified) {
        setError('Your email is not marked verified yet. Check your inbox and spam folder, then try again.');
      }
    } catch (err) {
      setError(err instanceof Error ? err.message : 'Could not verify status.');
    } finally {
      setBusy(false);
    }
  };

  const handleResendVerification = async () => {
    setBusy(true);
    setError('');
    setInfoMessage('');
    try {
      await resendVerificationEmail();
      setInfoMessage('A fresh verification email has been sent.');
    } catch (err) {
      setError(err instanceof Error ? err.message : 'Could not resend verification email.');
    } finally {
      setBusy(false);
    }
  };

  const isProviderNotEnabledError = error.startsWith('PROVIDER_NOT_ENABLED:');

  return (
    <div className="min-h-screen bg-slate-50 flex flex-col justify-between p-4 sm:p-6">
      <div className="max-w-5xl w-full mx-auto pt-2">
        <Link
          to="/"
          className="inline-flex items-center gap-1.5 text-xs font-semibold text-slate-600 hover:text-slate-950 transition-colors"
        >
          <ArrowLeft className="w-4 h-4" />
          <span>Back to Linkora</span>
        </Link>
      </div>

      <main className="w-full max-w-md mx-auto my-8">
        <div className="rounded-2xl bg-white border border-slate-200 p-7 sm:p-8 shadow-xs">
          {needsEmailVerification ? (
            <div>
              <div className="w-11 h-11 rounded-xl bg-indigo-50 text-indigo-600 flex items-center justify-center mb-4">
                <Mail className="w-5 h-5" />
              </div>
              <h1 className="text-xl font-bold text-slate-950">Verify your email address</h1>
              <p className="mt-2 text-sm text-slate-600 leading-relaxed">
                To protect Linkora usernames and enforce verified account isolation, please open the
                verification link sent to{' '}
                <span className="font-semibold text-slate-900">{firebaseUser?.email}</span>.
              </p>

              {error && (
                <div className="mt-4 p-3.5 rounded-xl bg-red-50 border border-red-200 text-xs text-red-700">
                  {error}
                </div>
              )}
              {infoMessage && (
                <div className="mt-4 p-3.5 rounded-xl bg-emerald-50 border border-emerald-200 text-xs text-emerald-800 flex items-start gap-2">
                  <CheckCircle2 className="w-4 h-4 shrink-0 mt-0.5" />
                  <span>{infoMessage}</span>
                </div>
              )}

              <div className="mt-6 space-y-2.5">
                <button
                  type="button"
                  disabled={busy}
                  onClick={handleRefreshVerified}
                  className="w-full min-h-[44px] px-4 py-2.5 rounded-xl bg-indigo-600 hover:bg-indigo-700 text-white text-sm font-semibold flex items-center justify-center gap-2 transition-colors cursor-pointer disabled:opacity-50"
                >
                  <RefreshCw className="w-4 h-4" />
                  <span>{busy ? 'Checking...' : "I've Verified My Email"}</span>
                </button>
                <button
                  type="button"
                  disabled={busy}
                  onClick={handleResendVerification}
                  className="w-full min-h-[44px] px-4 py-2.5 rounded-xl border border-slate-200 text-slate-700 hover:bg-slate-50 text-xs font-semibold transition-colors cursor-pointer"
                >
                  Resend Verification Link
                </button>
                <button
                  type="button"
                  onClick={() => logout()}
                  className="w-full py-2 text-xs text-slate-500 hover:text-slate-800 cursor-pointer"
                >
                  Sign out and use a different account
                </button>
              </div>
            </div>
          ) : (
            <>
              <div className="mb-6">
                <Link to="/" className="text-base font-bold tracking-tight text-indigo-600">
                  Linkora
                </Link>
                <h1 className="mt-2 text-2xl font-bold tracking-tight text-slate-950">
                  {mode === 'login'
                    ? 'Welcome back'
                    : mode === 'signup'
                    ? 'Create your Linkora page'
                    : 'Reset your password'}
                </h1>
                <p className="mt-1 text-sm text-slate-600">
                  {mode === 'login'
                    ? 'Sign in to manage your links, themes, and analytics.'
                    : mode === 'signup'
                    ? 'Claim your unique bio URL in seconds.'
                    : 'Enter your account email and we will send a reset link.'}
                </p>
              </div>

              {error && (
                <div className="mb-5 p-3.5 rounded-xl bg-red-50 border border-red-200 text-xs text-red-700 leading-relaxed">
                  {isProviderNotEnabledError ? (
                    <div className="space-y-1.5">
                      <p className="font-semibold flex items-center gap-1.5">
                        <ShieldAlert className="w-4 h-4 shrink-0" />
                        <span>Email/Password Provider Setup Needed</span>
                      </p>
                      <p>
                        To use email/password registration, open your Firebase Console →{' '}
                        <strong>Authentication</strong> → <strong>Sign-in method</strong> and enable{' '}
                        <strong>Email/Password</strong>. You can sign in immediately with Google
                        below.
                      </p>
                    </div>
                  ) : (
                    error
                  )}
                </div>
              )}

              {infoMessage && (
                <div className="mb-5 p-3.5 rounded-xl bg-emerald-50 border border-emerald-200 text-xs text-emerald-800 flex items-start gap-2">
                  <CheckCircle2 className="w-4 h-4 shrink-0 mt-0.5" />
                  <span>{infoMessage}</span>
                </div>
              )}

              {mode !== 'reset' && (
                <>
                  <button
                    type="button"
                    disabled={busy}
                    onClick={handleGoogleLogin}
                    className="w-full min-h-[46px] px-4 py-2.5 rounded-xl border border-slate-300 bg-white hover:bg-slate-50 text-slate-900 text-sm font-semibold flex items-center justify-center gap-2.5 transition-colors cursor-pointer disabled:opacity-50"
                  >
                    <svg className="w-4 h-4 shrink-0" viewBox="0 0 24 24" aria-hidden="true">
                      <path
                        fill="#4285F4"
                        d="M23.745 12.27c0-.7-.06-1.4-.19-2.07H12v4.51h6.6c-.29 1.52-1.14 2.82-2.4 3.68v3.05h3.88c2.27-2.09 3.665-5.17 3.665-9.17Z"
                      />
                      <path
                        fill="#34A853"
                        d="M12 24c3.24 0 5.95-1.08 7.93-2.91l-3.88-3.05c-1.08.72-2.45 1.16-4.05 1.16-3.12 0-5.77-2.11-6.72-4.96H1.29v3.14C3.26 21.3 7.31 24 12 24Z"
                      />
                      <path
                        fill="#FBBC05"
                        d="M5.28 14.24c-.24-.72-.38-1.49-.38-2.24s.14-1.52.38-2.24V6.62H1.29C.47 8.24 0 10.06 0 12s.47 3.76 1.29 5.38l3.99-3.14Z"
                      />
                      <path
                        fill="#EA4335"
                        d="M12 4.75c1.77 0 3.35.61 4.6 1.8l3.42-3.42C17.95 1.19 15.24 0 12 0 7.31 0 3.26 2.7 1.29 6.62l3.99 3.14c.95-2.85 3.6-4.96 6.72-4.96Z"
                      />
                    </svg>
                    <span>Continue with Google</span>
                  </button>

                  <div className="my-5 flex items-center gap-3">
                    <div className="h-px flex-1 bg-slate-200" />
                    <span className="text-xs text-slate-400">or with email</span>
                    <div className="h-px flex-1 bg-slate-200" />
                  </div>
                </>
              )}

              <form onSubmit={handleFormSubmit} className="space-y-4">
                {mode === 'signup' && (
                  <div>
                    <label
                      htmlFor="auth-name"
                      className="block text-xs font-semibold text-slate-700 mb-1.5"
                    >
                      Display Name
                    </label>
                    <input
                      id="auth-name"
                      type="text"
                      required
                      maxLength={80}
                      value={displayName}
                      onChange={(e) => setDisplayName(e.target.value)}
                      placeholder="Usman Malik"
                      className="w-full min-h-[44px] px-3.5 py-2 rounded-xl border border-slate-300 text-sm text-slate-900 focus:outline-none focus:border-indigo-600"
                    />
                  </div>
                )}

                <div>
                  <label
                    htmlFor="auth-email"
                    className="block text-xs font-semibold text-slate-700 mb-1.5"
                  >
                    Email Address
                  </label>
                  <input
                    id="auth-email"
                    type="email"
                    required
                    maxLength={254}
                    value={email}
                    onChange={(e) => setEmail(e.target.value)}
                    placeholder="you@example.com"
                    className="w-full min-h-[44px] px-3.5 py-2 rounded-xl border border-slate-300 text-sm text-slate-900 focus:outline-none focus:border-indigo-600"
                  />
                </div>

                {mode !== 'reset' && (
                  <div>
                    <div className="flex items-center justify-between mb-1.5">
                      <label
                        htmlFor="auth-password"
                        className="text-xs font-semibold text-slate-700"
                      >
                        Password
                      </label>
                      {mode === 'login' && (
                        <button
                          type="button"
                          onClick={() => setMode('reset')}
                          className="text-xs font-medium text-indigo-600 hover:underline cursor-pointer"
                        >
                          Forgot password?
                        </button>
                      )}
                    </div>
                    <input
                      id="auth-password"
                      type="password"
                      required
                      minLength={6}
                      value={password}
                      onChange={(e) => setPassword(e.target.value)}
                      placeholder="••••••••"
                      className="w-full min-h-[44px] px-3.5 py-2 rounded-xl border border-slate-300 text-sm text-slate-900 focus:outline-none focus:border-indigo-600"
                    />
                  </div>
                )}

                <button
                  type="submit"
                  disabled={busy}
                  className="w-full min-h-[46px] px-4 py-2.5 rounded-xl bg-indigo-600 hover:bg-indigo-700 text-white text-sm font-semibold transition-colors cursor-pointer disabled:opacity-50"
                >
                  {busy
                    ? 'Please wait...'
                    : mode === 'login'
                    ? 'Sign In'
                    : mode === 'signup'
                    ? 'Create Free Account'
                    : 'Send Reset Link'}
                </button>
              </form>

              <div className="mt-6 pt-5 border-t border-slate-100 text-center text-xs text-slate-600">
                {mode === 'login' ? (
                  <p>
                    Don’t have a Linkora page yet?{' '}
                    <Link to="/signup" className="font-semibold text-indigo-600 hover:underline">
                      Create one free
                    </Link>
                  </p>
                ) : (
                  <p>
                    Already have an account?{' '}
                    <Link to="/login" className="font-semibold text-indigo-600 hover:underline">
                      Sign in
                    </Link>
                  </p>
                )}
              </div>
            </>
          )}
        </div>
      </main>

      <footer className="text-center text-xs text-slate-400 pb-2">
        Protected by Firebase Authentication &amp; isolated Firestore security rules
      </footer>
    </div>
  );
};
