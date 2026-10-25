import React from 'react';
import { BrowserRouter, Link, Route, Routes } from 'react-router-dom';
import { SearchX } from 'lucide-react';
import { ErrorBoundary } from './components/ErrorBoundary';
import { AuthProvider } from './context/AuthContext';
import { ThemeProvider, ThemeToggleButton } from './context/ThemeContext';
import { AdminPage } from './pages/AdminPage';
import { AuthPage } from './pages/AuthPage';
import { DashboardPage } from './pages/DashboardPage';
import { LandingPage } from './pages/LandingPage';
import { LegalAndInfoPage } from './pages/LegalAndInfoPage';
import { PublicProfilePage } from './pages/PublicProfilePage';

const NotFoundPage: React.FC = () => (
  <div className="min-h-screen bg-slate-50 dark:bg-slate-950 text-slate-900 dark:text-slate-100 flex flex-col justify-between p-6">
    <div className="max-w-5xl w-full mx-auto flex justify-end">
      <ThemeToggleButton />
    </div>
    <div className="max-w-md w-full mx-auto my-auto bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-800 rounded-2xl p-8 shadow-xs text-center">
      <div className="w-12 h-12 rounded-2xl bg-slate-100 dark:bg-slate-800 text-slate-700 dark:text-slate-300 flex items-center justify-center mx-auto mb-4">
        <SearchX className="w-6 h-6" />
      </div>
      <h1 className="text-xl font-bold text-slate-950 dark:text-white">404 – Page Not Found</h1>
      <p className="mt-2 text-sm text-slate-600 dark:text-slate-400">
        The address you entered doesn’t match any Linkora route or profile.
      </p>
      <Link
        to="/"
        className="mt-6 inline-flex min-h-[42px] px-5 py-2.5 rounded-xl bg-indigo-600 hover:bg-indigo-700 text-white text-xs font-semibold items-center justify-center transition-colors"
      >
        Return to Linkora Home
      </Link>
    </div>
    <div className="h-6" />
  </div>
);

export default function App() {
  return (
    <ErrorBoundary>
      <ThemeProvider>
        <AuthProvider>
          <BrowserRouter>
            <Routes>
              <Route path="/" element={<LandingPage />} />
              <Route path="/login" element={<AuthPage initialMode="login" />} />
              <Route path="/signup" element={<AuthPage initialMode="signup" />} />
              <Route path="/reset-password" element={<AuthPage initialMode="reset" />} />
              <Route path="/dashboard" element={<DashboardPage />} />
              <Route path="/admin" element={<AdminPage />} />
              <Route path="/privacy" element={<LegalAndInfoPage page="privacy" />} />
              <Route path="/terms" element={<LegalAndInfoPage page="terms" />} />
              <Route path="/about" element={<LegalAndInfoPage page="about" />} />
              <Route path="/contact" element={<LegalAndInfoPage page="contact" />} />
              <Route path="/:username" element={<PublicProfilePage />} />
              <Route path="*" element={<NotFoundPage />} />
            </Routes>
          </BrowserRouter>
        </AuthProvider>
      </ThemeProvider>
    </ErrorBoundary>
  );
}
