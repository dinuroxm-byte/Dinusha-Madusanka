import React, { useState } from 'react';
import {
  AlertCircle,
  Building2,
  CheckCircle2,
  Eye,
  EyeOff,
  Globe,
  KeyRound,
  Lock,
  LogIn,
  Mail,
  Plane,
  Shield,
  ShieldAlert,
  ShieldCheck,
  Sparkles,
  UserCheck
} from 'lucide-react';
import { isSupabaseConfigured, supabase } from '../lib/supabase';
import { LogoData, UserProfile, UserRole } from '../types';
import { fetchUserProfile } from '../utils/supabaseStorage';

interface LoginPageProps {
  logo: LogoData | null;
  onSuccess: (user: UserProfile) => void;
  showToast: (msg: string) => void;
}

export const LoginPage: React.FC<LoginPageProps> = ({
  logo,
  onSuccess,
  showToast
}) => {
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [showPassword, setShowPassword] = useState(false);
  const [isLoading, setIsLoading] = useState(false);
  const [errorMsg, setErrorMsg] = useState('');
  const [isResetMode, setIsResetMode] = useState(false);
  const [resetSuccessMsg, setResetSuccessMsg] = useState('');

  const isConfigured = isSupabaseConfigured();

  const handleSignIn = async (e: React.FormEvent) => {
    e.preventDefault();
    setErrorMsg('');
    setResetSuccessMsg('');

    const trimmedEmail = email.trim();
    if (!trimmedEmail) {
      setErrorMsg('Please enter your company email address.');
      return;
    }
    if (!password) {
      setErrorMsg('Please enter your account password.');
      return;
    }

    setIsLoading(true);

    // If Supabase is not configured (e.g., local preview without .env)
    if (!isConfigured) {
      setTimeout(() => {
        const isAdminEmail = trimmedEmail.toLowerCase().includes('admin');
        const localProfile: UserProfile = {
          id: 'local_user_' + Date.now(),
          email: trimmedEmail,
          fullName: isAdminEmail ? 'Voya Lanka Administrator' : 'Staff Member',
          role: isAdminEmail ? 'ADMIN' : 'STAFF'
        };
        try {
          localStorage.setItem('voya_lanka_active_user', JSON.stringify(localProfile));
        } catch (_) {}
        setIsLoading(false);
        showToast(`Welcome back, ${localProfile.fullName}!`);
        onSuccess(localProfile);
      }, 400);
      return;
    }

    try {
      const { data, error } = await supabase.auth.signInWithPassword({
        email: trimmedEmail,
        password: password
      });

      if (error) {
        setErrorMsg(error.message);
        setIsLoading(false);
        return;
      }

      if (data?.user) {
        // Fetch custom role and profile from public.profiles table
        const profile = await fetchUserProfile(data.user.id);
        const resolvedProfile: UserProfile = profile || {
          id: data.user.id,
          email: data.user.email || trimmedEmail,
          fullName: data.user.user_metadata?.full_name || trimmedEmail.split('@')[0],
          role: (data.user.user_metadata?.role as UserRole) || 'STAFF'
        };

        showToast(`Welcome back, ${resolvedProfile.fullName}!`);
        onSuccess(resolvedProfile);
      }
    } catch (err: any) {
      console.error('Sign-in error:', err);
      setErrorMsg(err.message || 'Authentication failed. Please verify your credentials.');
    } finally {
      setIsLoading(false);
    }
  };

  const handlePasswordReset = async (e: React.FormEvent) => {
    e.preventDefault();
    setErrorMsg('');
    setResetSuccessMsg('');

    const trimmedEmail = email.trim();
    if (!trimmedEmail) {
      setErrorMsg('Please enter your registered email address.');
      return;
    }

    if (!isConfigured) {
      setResetSuccessMsg('In offline demo mode, you can sign in directly with your email.');
      return;
    }

    setIsLoading(true);
    try {
      const { error } = await supabase.auth.resetPasswordForEmail(trimmedEmail, {
        redirectTo: window.location.origin
      });

      if (error) {
        setErrorMsg(error.message);
        return;
      }

      setResetSuccessMsg('Password reset instructions sent. Please check your inbox.');
    } catch (err: any) {
      setErrorMsg(err.message || 'Could not dispatch password reset email.');
    } finally {
      setIsLoading(false);
    }
  };

  const handleQuickDemoFill = (role: 'ADMIN' | 'STAFF') => {
    if (role === 'ADMIN') {
      setEmail('admin@voyalankatours.com');
      setPassword('Admin@123');
    } else {
      setEmail('staff@voyalankatours.com');
      setPassword('Staff@123');
    }
    setErrorMsg('');
  };

  return (
    <div className="min-h-screen bg-slate-950 text-slate-100 flex flex-col justify-between relative overflow-hidden font-sans selection:bg-sky-500 selection:text-white">
      {/* Background Ambience Gradient */}
      <div className="absolute inset-0 bg-[radial-gradient(ellipse_at_top,_var(--tw-gradient-stops))] from-sky-950/40 via-slate-950 to-slate-950 pointer-events-none" />
      <div className="absolute -top-40 -right-40 w-96 h-96 bg-sky-600/10 rounded-full blur-3xl pointer-events-none" />
      <div className="absolute -bottom-40 -left-40 w-96 h-96 bg-amber-600/10 rounded-full blur-3xl pointer-events-none" />

      {/* Top Header Bar */}
      <header className="relative z-10 px-6 py-4 border-b border-slate-800/80 bg-slate-950/80 backdrop-blur-md flex items-center justify-between">
        <div className="flex items-center gap-3">
          {logo && logo.data ? (
            <img
              src={logo.data}
              alt="Voya Lanka Tours"
              className="h-11 w-auto max-w-[140px] object-contain rounded-lg bg-white p-1 shadow-sm"
            />
          ) : (
            <div className="w-10 h-10 rounded-xl bg-gradient-to-tr from-sky-700 to-teal-600 flex items-center justify-center text-white shadow-md shadow-sky-900/40">
              <Plane className="w-5 h-5 -rotate-45" />
            </div>
          )}
          <div>
            <h1 className="text-sm font-bold text-slate-100 leading-tight">
              Voya Lanka Tours (Pvt) Ltd.
            </h1>
            <p className="text-[9px] font-medium italic tracking-wider text-amber-400 uppercase leading-tight">
              MORE THAN A DESTINATION
            </p>
          </div>
        </div>

        <div className="flex items-center gap-2">
          {isConfigured ? (
            <span className="inline-flex items-center gap-1.5 px-3 py-1 rounded-full text-[11px] font-semibold bg-emerald-950/80 border border-emerald-700 text-emerald-300">
              <span className="w-2 h-2 rounded-full bg-emerald-400 animate-pulse" />
              <span>Cloud Database Active</span>
            </span>
          ) : (
            <span className="inline-flex items-center gap-1.5 px-3 py-1 rounded-full text-[11px] font-semibold bg-amber-950/80 border border-amber-700 text-amber-300">
              <ShieldAlert className="w-3.5 h-3.5 text-amber-400" />
              <span>Preview Mode</span>
            </span>
          )}
        </div>
      </header>

      {/* Main Authentication Center Box */}
      <main className="relative z-10 flex-1 flex items-center justify-center p-4 sm:p-6 my-auto">
        <div className="w-full max-w-md bg-slate-900/90 border border-slate-800 rounded-3xl shadow-2xl p-6 sm:p-8 backdrop-blur-xl relative">
          {/* Subtle Top Glow Line */}
          <div className="absolute top-0 inset-x-8 h-px bg-gradient-to-r from-transparent via-sky-500/50 to-transparent" />

          {/* Heading */}
          <div className="text-center mb-6">
            <div className="w-14 h-14 mx-auto rounded-2xl bg-gradient-to-tr from-sky-600/20 to-teal-600/20 border border-sky-500/30 flex items-center justify-center text-sky-400 shadow-inner mb-3">
              <Shield className="w-7 h-7 text-sky-400" />
            </div>
            <h2 className="text-xl font-extrabold text-slate-100 tracking-tight">
              {isResetMode ? 'Reset Workspace Password' : 'Staff Operations Portal'}
            </h2>
            <p className="text-xs text-slate-400 mt-1 max-w-xs mx-auto">
              {isResetMode
                ? 'Enter your registered email to receive account recovery instructions.'
                : 'Authorized personnel sign-in for quotations, costing, and customer management.'}
            </p>
          </div>

          {/* Error Message */}
          {errorMsg && (
            <div className="mb-4 p-3 rounded-xl bg-rose-950/70 border border-rose-800 text-xs text-rose-200 flex items-start gap-2.5 animate-in fade-in duration-150">
              <AlertCircle className="w-4 h-4 text-rose-400 shrink-0 mt-0.5" />
              <span className="leading-relaxed">{errorMsg}</span>
            </div>
          )}

          {/* Success Message */}
          {resetSuccessMsg && (
            <div className="mb-4 p-3 rounded-xl bg-emerald-950/70 border border-emerald-800 text-xs text-emerald-200 flex items-start gap-2.5 animate-in fade-in duration-150">
              <CheckCircle2 className="w-4 h-4 text-emerald-400 shrink-0 mt-0.5" />
              <span className="leading-relaxed">{resetSuccessMsg}</span>
            </div>
          )}

          {/* Sign In Form */}
          {!isResetMode ? (
            <form onSubmit={handleSignIn} className="space-y-4">
              <div>
                <label className="block text-xs font-semibold text-slate-300 mb-1.5">
                  Company Email
                </label>
                <div className="relative">
                  <Mail className="w-4 h-4 text-slate-400 absolute left-3.5 top-3" />
                  <input
                    type="email"
                    required
                    value={email}
                    onChange={e => setEmail(e.target.value)}
                    placeholder="e.g. staff@voyalankatours.com"
                    className="w-full bg-slate-950 border border-slate-800 rounded-xl pl-10 pr-3 py-2.5 text-xs text-slate-100 placeholder-slate-500 focus:outline-none focus:border-sky-500 transition-colors"
                  />
                </div>
              </div>

              <div>
                <div className="flex items-center justify-between mb-1.5">
                  <label className="block text-xs font-semibold text-slate-300">
                    Password
                  </label>
                  <button
                    type="button"
                    onClick={() => {
                      setIsResetMode(true);
                      setErrorMsg('');
                    }}
                    className="text-[11px] text-sky-400 hover:text-sky-300 font-semibold cursor-pointer"
                  >
                    Forgot Password?
                  </button>
                </div>
                <div className="relative">
                  <Lock className="w-4 h-4 text-slate-400 absolute left-3.5 top-3" />
                  <input
                    type={showPassword ? 'text' : 'password'}
                    required
                    value={password}
                    onChange={e => setPassword(e.target.value)}
                    placeholder="Enter your security password"
                    className="w-full bg-slate-950 border border-slate-800 rounded-xl pl-10 pr-10 py-2.5 text-xs text-slate-100 placeholder-slate-500 focus:outline-none focus:border-sky-500 transition-colors"
                  />
                  <button
                    type="button"
                    onClick={() => setShowPassword(!showPassword)}
                    className="absolute right-3.5 top-3 text-slate-400 hover:text-slate-200 cursor-pointer"
                  >
                    {showPassword ? <EyeOff className="w-4 h-4" /> : <Eye className="w-4 h-4" />}
                  </button>
                </div>
              </div>

              <button
                type="submit"
                disabled={isLoading}
                className="w-full mt-2 py-3 px-4 rounded-xl bg-gradient-to-r from-sky-600 to-sky-500 hover:from-sky-500 hover:to-sky-400 text-white text-xs font-bold shadow-lg shadow-sky-950/60 transition-all flex items-center justify-center gap-2 cursor-pointer disabled:opacity-50 disabled:cursor-not-allowed"
              >
                {isLoading ? (
                  <>
                    <span className="w-4 h-4 border-2 border-white/30 border-t-white rounded-full animate-spin" />
                    <span>Verifying Credentials...</span>
                  </>
                ) : (
                  <>
                    <LogIn className="w-4 h-4" />
                    <span>Sign In to Workspace</span>
                  </>
                )}
              </button>
            </form>
          ) : (
            /* Reset Password Form */
            <form onSubmit={handlePasswordReset} className="space-y-4">
              <div>
                <label className="block text-xs font-semibold text-slate-300 mb-1.5">
                  Registered Email Address
                </label>
                <div className="relative">
                  <Mail className="w-4 h-4 text-slate-400 absolute left-3.5 top-3" />
                  <input
                    type="email"
                    required
                    value={email}
                    onChange={e => setEmail(e.target.value)}
                    placeholder="e.g. staff@voyalankatours.com"
                    className="w-full bg-slate-950 border border-slate-800 rounded-xl pl-10 pr-3 py-2.5 text-xs text-slate-100 placeholder-slate-500 focus:outline-none focus:border-sky-500"
                  />
                </div>
              </div>

              <div className="flex items-center gap-2 pt-2">
                <button
                  type="button"
                  onClick={() => {
                    setIsResetMode(false);
                    setErrorMsg('');
                    setResetSuccessMsg('');
                  }}
                  className="flex-1 py-2.5 text-xs font-semibold rounded-xl border border-slate-700 hover:bg-slate-800 text-slate-300 transition-colors cursor-pointer"
                >
                  Back to Sign In
                </button>
                <button
                  type="submit"
                  disabled={isLoading}
                  className="flex-1 py-2.5 text-xs font-bold rounded-xl bg-sky-600 hover:bg-sky-500 text-white transition-colors cursor-pointer disabled:opacity-50"
                >
                  {isLoading ? 'Sending...' : 'Send Recovery Link'}
                </button>
              </div>
            </form>
          )}

          {/* Quick Helper / Demo Credentials Pill */}
          <div className="mt-6 pt-5 border-t border-slate-800/80">
            <div className="flex items-center justify-between text-[11px] text-slate-400 mb-2 font-medium">
              <span>Quick Login Shortcuts:</span>
            </div>
            <div className="grid grid-cols-2 gap-2">
              <button
                type="button"
                onClick={() => handleQuickDemoFill('ADMIN')}
                className="flex items-center justify-center gap-1.5 py-1.5 px-2 rounded-lg bg-amber-950/40 border border-amber-800/50 hover:bg-amber-900/60 text-amber-300 text-[11px] font-semibold transition-colors cursor-pointer"
              >
                <ShieldCheck className="w-3 h-3 text-amber-400" />
                <span>Admin Login</span>
              </button>
              <button
                type="button"
                onClick={() => handleQuickDemoFill('STAFF')}
                className="flex items-center justify-center gap-1.5 py-1.5 px-2 rounded-lg bg-sky-950/40 border border-sky-800/50 hover:bg-sky-900/60 text-sky-300 text-[11px] font-semibold transition-colors cursor-pointer"
              >
                <UserCheck className="w-3 h-3 text-sky-400" />
                <span>Staff Login</span>
              </button>
            </div>
          </div>
        </div>
      </main>

      {/* Footer Branding & Registration */}
      <footer className="relative z-10 px-6 py-4 border-t border-slate-900 bg-slate-950/80 backdrop-blur-md flex flex-col sm:flex-row items-center justify-between gap-2 text-[11px] text-slate-500">
        <div className="flex items-center gap-2">
          <Building2 className="w-3.5 h-3.5 text-slate-400" />
          <span>Voya Lanka Tours (Pvt) Ltd. • Registration: SLTDA/SQA/PRO/01294</span>
        </div>
        <div className="text-slate-500">
          Centralized Supabase Cloud Security with Row Level Security (RLS)
        </div>
      </footer>
    </div>
  );
};
