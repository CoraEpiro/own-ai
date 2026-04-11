import React, { useEffect, useMemo, useRef, useState } from 'react';
import { Link, useNavigate } from 'react-router-dom';
import toast from 'react-hot-toast';
import {
  ArrowRight,
  Check,
  Eye,
  EyeOff,
  Loader2,
  Lock,
  Mail,
  ShieldCheck,
} from 'lucide-react';
import { useAuth } from '../contexts/AuthContext';
import OwnAILogo from './brand/OwnAILogo';
import useThemePreference from '../hooks/useThemePreference';

/* ─── Password helpers ────────────────────────────────────── */
const getPasswordStrength = (value: string) => {
  if (!value) return 0;
  let score = 0;
  if (value.length >= 8) score += 1;
  if (/[A-Z]/.test(value)) score += 1;
  if (/[0-9]/.test(value)) score += 1;
  if (/[^A-Za-z0-9]/.test(value)) score += 1;
  return score;
};

const strengthMeta = [
  { label: '', color: 'var(--surface-3)' },
  { label: 'Weak', color: '#EF4444' },
  { label: 'Fair', color: '#F59E0B' },
  { label: 'Good', color: '#10B981' },
  { label: 'Strong', color: '#10B981' },
];

const getErrorMessage = (error: unknown) =>
  error instanceof Error ? error.message : 'Something went wrong';

/* ─── Left panel — editorial near-black ─────────────────────*/
const providers = [
  { label: 'OpenAI', color: '#10B981' },
  { label: 'Anthropic', color: '#F59E0B' },
  { label: 'Google', color: '#3B82F6' },
];

const AuthBrandPanel: React.FC = () => (
  <section className="auth-brand-panel relative hidden min-h-screen flex-col justify-between overflow-hidden px-10 py-10 text-white lg:flex xl:px-14 xl:py-12">
    {/* Grain on left panel */}
    <div className="grain-overlay opacity-[0.045]" />

    {/* Subtle provider glow orbs */}
    <div className="pointer-events-none absolute right-[-6rem] top-[-4rem] h-[28rem] w-[28rem] rounded-full opacity-[0.08]"
      style={{ background: 'radial-gradient(circle, #10B981, transparent 65%)' }} />
    <div className="pointer-events-none absolute bottom-[-6rem] left-[-4rem] h-[24rem] w-[24rem] rounded-full opacity-[0.06]"
      style={{ background: 'radial-gradient(circle, #3B82F6, transparent 65%)' }} />

    {/* Top row — logo links home, no redundant back button */}
    <div className="relative z-10">
      <Link to="/">
        <OwnAILogo size={32} tone="light" wordmarkClassName="text-xl" />
      </Link>
    </div>

    {/* Main content */}
    <div className="relative z-10 max-w-xl">
      {/* Provider pills */}
      <div className="flex flex-wrap gap-2">
        {providers.map(({ label, color }) => (
          <span
            key={label}
            className="flex items-center gap-1.5 rounded-full px-3 py-1 text-[10px] font-semibold uppercase tracking-[0.18em]"
            style={{
              background: `${color}12`,
              border: `1px solid ${color}28`,
              color,
            }}
          >
            <span className="h-1.5 w-1.5 rounded-full" style={{ background: color }} />
            {label}
          </span>
        ))}
      </div>

      {/* Headline */}
      <h1
        className="mt-8 font-display font-extrabold leading-[0.92] tracking-[-0.055em] text-white"
        style={{ fontSize: 'clamp(2.75rem, 4.5vw, 4rem)' }}
      >
        All the AI.
        <br />
        None of
        <br />
        the waste.
      </h1>

      <p className="mt-6 max-w-sm text-[1rem] leading-[1.75] text-white/52">
        One workspace for GPT, Claude, and Gemini.
        Pay only for what you send.
      </p>

      {/* Cost comparison */}
      <div className="mt-10 grid gap-3 sm:grid-cols-2">
        <div
          className="rounded-[18px] p-5"
          style={{ background: 'rgba(239,68,68,0.06)', border: '1px solid rgba(239,68,68,0.14)' }}
        >
          <div className="text-[10px] font-semibold uppercase tracking-[0.2em] text-red-400/80">
            Typical subscription stack
          </div>
          <div className="mt-2 font-display text-3xl font-bold tracking-tight text-red-400">
            $60+
          </div>
          <div className="mt-1 text-[11px] text-red-400/55">per month, whether used or not</div>
        </div>

        <div
          className="rounded-[18px] p-5"
          style={{ background: 'rgba(16,185,129,0.06)', border: '1px solid rgba(16,185,129,0.16)' }}
        >
          <div className="text-[10px] font-semibold uppercase tracking-[0.2em] text-emerald-400/80">
            Own AI typical month
          </div>
          <div className="mt-2 font-display text-3xl font-bold tracking-tight text-emerald-400">
            €4–8
          </div>
          <div className="mt-1 text-[11px] text-emerald-400/55">usage-based, with €2 free to start</div>
        </div>
      </div>

      {/* Credit badge */}
      <div
        className="mt-5 inline-flex items-center gap-2.5 rounded-full px-4 py-2.5 text-sm font-medium text-white/75"
        style={{ background: 'rgba(255,255,255,0.06)', border: '1px solid rgba(255,255,255,0.1)' }}
      >
        <Check className="h-4 w-4 text-emerald-400" />
        €2 free credit added on sign-up · No card required
      </div>
    </div>

    {/* Bottom tagline */}
    <div className="relative z-10 text-[10px] font-medium uppercase tracking-[0.28em] text-white/28">
      One interface · One bill · More control
    </div>
  </section>
);

/* ─── Auth form ───────────────────────────────────────────── */
const AuthForm: React.FC = () => {
  const [isLogin, setIsLogin] = useState(true);
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [confirmPassword, setConfirmPassword] = useState('');
  const [showPassword, setShowPassword] = useState(false);
  const [loading, setLoading] = useState(false);
  const [success, setSuccess] = useState(false);

  const { login, register } = useAuth();
  const { isDark, toggleTheme } = useThemePreference();
  const navigate = useNavigate();
  const redirectTimerRef = useRef<number | null>(null);

  useEffect(() => () => {
    if (redirectTimerRef.current) window.clearTimeout(redirectTimerRef.current);
  }, []);

  const strength = getPasswordStrength(password);
  const passwordChecks = useMemo(() => [
    { label: 'At least 8 characters', valid: password.length >= 8 },
    { label: 'One uppercase letter', valid: /[A-Z]/.test(password) },
    { label: 'One number', valid: /[0-9]/.test(password) },
    { label: 'One symbol', valid: /[^A-Za-z0-9]/.test(password) },
  ], [password]);

  const passwordsMatch = !confirmPassword || password === confirmPassword;
  const submitDisabled =
    loading || !email || !password || (!isLogin && (!confirmPassword || confirmPassword !== password));

  const switchMode = (nextIsLogin: boolean) => {
    setIsLogin(nextIsLogin);
    setEmail(''); setPassword(''); setConfirmPassword('');
    setShowPassword(false); setSuccess(false);
  };

  const handleSubmit = async (event: React.FormEvent) => {
    event.preventDefault();
    if (!isLogin && password !== confirmPassword) { toast.error('Passwords do not match'); return; }
    setLoading(true);
    try {
      if (isLogin) {
        await login(email, password);
        toast.success('Welcome back');
        navigate('/chat');
      } else {
        await register(email, password);
        setSuccess(true);
        toast.success('Account created. €2 credit added.');
        redirectTimerRef.current = window.setTimeout(() => navigate('/chat'), 1600);
      }
    } catch (error) {
      toast.error(getErrorMessage(error));
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="relative min-h-screen overflow-hidden bg-[var(--bg-base)] text-[var(--text-primary)]">
      <div className="grid min-h-screen lg:grid-cols-[minmax(0,1fr)_minmax(460px,0.9fr)]">

        {/* Left — editorial brand panel */}
        <AuthBrandPanel />

        {/* Right — form */}
        <section className="relative flex min-h-screen flex-col justify-center px-5 py-10 sm:px-8 lg:px-10 lg:py-12">

          {/* Top bar — back link left, theme toggle right */}
          <div className="absolute inset-x-5 top-5 z-20 flex items-center justify-between sm:inset-x-8 sm:top-8">
            <Link
              to="/"
              className="flex items-center gap-1.5 text-[0.8125rem] font-medium text-[var(--text-muted)] transition-colors hover:text-[var(--text-primary)]"
            >
              <svg className="h-4 w-4" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={2}>
                <path strokeLinecap="round" strokeLinejoin="round" d="M15 19l-7-7 7-7" />
              </svg>
              Back
            </Link>
            <button
              type="button"
              onClick={toggleTheme}
              className="flex h-9 w-9 items-center justify-center rounded-full border border-[var(--border-default)] text-[var(--text-muted)] transition-colors hover:text-[var(--text-primary)]"
              aria-label="Toggle theme"
            >
              <svg className="h-3.5 w-3.5" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={1.75}>
                {isDark
                  ? <path strokeLinecap="round" strokeLinejoin="round" d="M12 3v1m0 16v1m9-9h-1M4 12H3m15.364-6.364l-.707.707M6.343 17.657l-.707.707M17.657 17.657l-.707-.707M6.343 6.343l-.707-.707M12 7a5 5 0 000 10A5 5 0 0012 7z" />
                  : <path strokeLinecap="round" strokeLinejoin="round" d="M20.354 15.354A9 9 0 018.646 3.646 9.003 9.003 0 0012 21a9.003 9.003 0 008.354-5.646z" />
                }
              </svg>
            </button>
          </div>

          {/* Mobile brand block — shown only below lg */}
          <div className="mb-7 lg:hidden">
            <Link to="/"><OwnAILogo size={28} /></Link>
            <h1 className="mt-5 font-display text-2xl font-bold tracking-tight text-[var(--text-primary)]">
              All the AI. None of the waste.
            </h1>
            <div className="mt-3 flex flex-wrap gap-2">
              {providers.map(({ label, color }) => (
                <span
                  key={label}
                  className="flex items-center gap-1.5 rounded-full px-2.5 py-1 text-[10px] font-semibold uppercase tracking-[0.16em]"
                  style={{ background: `${color}12`, border: `1px solid ${color}28`, color }}
                >
                  <span className="h-1.5 w-1.5 rounded-full" style={{ background: color }} />
                  {label}
                </span>
              ))}
            </div>
          </div>

          {/* Form card */}
          <div className="mx-auto w-full max-w-[440px]">
            <div
              className="rounded-[24px] border border-[var(--border-default)] bg-[var(--bg-base)] p-6 sm:p-8"
              style={{ boxShadow: isDark
                ? '0 8px 40px rgba(0,0,0,0.5), 0 0 0 1px rgba(255,255,255,0.06)'
                : '0 4px 24px rgba(0,0,0,0.07), 0 0 0 1px rgba(0,0,0,0.05)'
              }}
            >
              {success ? (
                /* ── Success state ── */
                <div className="animate-modal-in py-6 text-center">
                  <div className="mx-auto flex h-14 w-14 items-center justify-center rounded-full bg-[var(--text-primary)]">
                    <Check className="h-7 w-7 text-[var(--bg-base)]" />
                  </div>
                  <h2 className="mt-5 font-display text-2xl font-bold tracking-tight text-[var(--text-primary)]">
                    You're in.
                  </h2>
                  <p className="mt-3 text-sm leading-7 text-[var(--text-secondary)]">
                    Account ready. €2 starter credit has been added.
                    Taking you to the workspace now.
                  </p>
                  <div className="mt-6 h-1 overflow-hidden rounded-full bg-[var(--surface-3)]">
                    <div className="shimmer-bar h-full w-full rounded-full bg-[var(--text-primary)]" />
                  </div>
                </div>
              ) : (
                <>
                  {/* ── Mode toggle ── */}
                  <div className="flex w-full rounded-full border border-[var(--border-subtle)] bg-[var(--surface-2)] p-1">
                    {[
                      { label: 'Log in', value: true },
                      { label: 'Sign up', value: false },
                    ].map((item) => {
                      const active = item.value === isLogin;
                      return (
                        <button
                          key={item.label}
                          type="button"
                          onClick={() => switchMode(item.value)}
                          className="flex-1 rounded-full px-4 py-2.5 text-sm font-semibold transition-all duration-200"
                          style={{
                            background: active ? 'var(--bg-base)' : 'transparent',
                            color: active ? 'var(--text-primary)' : 'var(--text-muted)',
                            boxShadow: active
                              ? isDark
                                ? '0 1px 4px rgba(0,0,0,0.5)'
                                : '0 1px 4px rgba(0,0,0,0.08)'
                              : 'none',
                          }}
                        >
                          {item.label}
                        </button>
                      );
                    })}
                  </div>

                  {/* ── Heading ── */}
                  <div className="mt-7">
                    <h2 className="font-display text-[1.625rem] font-bold tracking-tight text-[var(--text-primary)]">
                      {isLogin ? 'Welcome back' : 'Create your account'}
                    </h2>
                    <p className="mt-2 text-[0.875rem] leading-6 text-[var(--text-secondary)]">
                      {isLogin
                        ? 'Pick up where you left off — same models, memory, and billing.'
                        : 'Start with €2 in real credit and pay only for what you use.'}
                    </p>
                  </div>

                  {/* ── OAuth placeholders ── */}
                  <div className="mt-6 grid grid-cols-2 gap-2.5">
                    {(['Google', 'Apple'] as const).map((provider) => (
                      <button
                        key={provider}
                        type="button"
                        disabled
                        className="flex h-11 items-center justify-center gap-2 rounded-xl border border-[var(--border-default)] bg-[var(--surface-1)] text-sm font-medium text-[var(--text-muted)] opacity-60"
                      >
                        <ShieldCheck className="h-3.5 w-3.5" />
                        {provider}
                        <span className="rounded-full border border-[var(--border-default)] px-1.5 py-0.5 text-[9px] uppercase tracking-[0.16em] text-[var(--text-muted)]">
                          Soon
                        </span>
                      </button>
                    ))}
                  </div>

                  {/* ── Divider ── */}
                  <div className="my-5 flex items-center gap-3">
                    <div className="h-px flex-1 bg-[var(--border-subtle)]" />
                    <span className="text-[10px] font-medium uppercase tracking-[0.22em] text-[var(--text-muted)]">
                      or with email
                    </span>
                    <div className="h-px flex-1 bg-[var(--border-subtle)]" />
                  </div>

                  {/* ── Form fields ── */}
                  <form onSubmit={handleSubmit} className="space-y-4">
                    {/* Email */}
                    <div>
                      <label className="mb-2 block text-[11px] font-semibold uppercase tracking-[0.2em] text-[var(--text-secondary)]">
                        Email
                      </label>
                      <div className="relative">
                        <Mail className="pointer-events-none absolute left-4 top-1/2 h-4 w-4 -translate-y-1/2 text-[var(--text-muted)]" />
                        <input
                          type="email"
                          value={email}
                          onChange={(e) => setEmail(e.target.value)}
                          required
                          placeholder="name@university.edu"
                          className="input-brand h-12 w-full rounded-xl border border-[var(--border-default)] bg-[var(--surface-1)] pl-11 pr-4 text-sm text-[var(--text-primary)] outline-none transition-all"
                        />
                      </div>
                    </div>

                    {/* Password */}
                    <div>
                      <div className="mb-2 flex items-center justify-between">
                        <label className="text-[11px] font-semibold uppercase tracking-[0.2em] text-[var(--text-secondary)]">
                          Password
                        </label>
                        {isLogin && (
                          <span className="text-[11px] text-[var(--text-muted)]">Reset coming soon</span>
                        )}
                      </div>
                      <div className="relative">
                        <Lock className="pointer-events-none absolute left-4 top-1/2 h-4 w-4 -translate-y-1/2 text-[var(--text-muted)]" />
                        <input
                          type={showPassword ? 'text' : 'password'}
                          value={password}
                          onChange={(e) => setPassword(e.target.value)}
                          required
                          placeholder="••••••••"
                          className="input-brand h-12 w-full rounded-xl border border-[var(--border-default)] bg-[var(--surface-1)] pl-11 pr-12 text-sm text-[var(--text-primary)] outline-none transition-all"
                        />
                        <button
                          type="button"
                          onClick={() => setShowPassword((p) => !p)}
                          className="absolute right-4 top-1/2 -translate-y-1/2 text-[var(--text-muted)] transition-colors hover:text-[var(--text-primary)]"
                          aria-label={showPassword ? 'Hide password' : 'Show password'}
                        >
                          {showPassword ? <EyeOff className="h-4 w-4" /> : <Eye className="h-4 w-4" />}
                        </button>
                      </div>

                      {/* Strength meter — only on signup */}
                      {!isLogin && password && (
                        <>
                          <div className="mt-2.5 flex items-center gap-2.5">
                            <div className="flex flex-1 gap-1">
                              {[1, 2, 3, 4].map((i) => (
                                <div
                                  key={i}
                                  className="h-1 flex-1 rounded-full transition-all duration-200"
                                  style={{ background: i <= strength ? strengthMeta[strength].color : 'var(--surface-3)' }}
                                />
                              ))}
                            </div>
                            <span className="text-xs font-medium" style={{ color: strengthMeta[strength].color }}>
                              {strengthMeta[strength].label}
                            </span>
                          </div>
                          <div className="mt-2.5 grid gap-1.5 sm:grid-cols-2">
                            {passwordChecks.map((item) => (
                              <div key={item.label} className="flex items-center gap-2 text-xs text-[var(--text-secondary)]">
                                <span
                                  className={`flex h-4 w-4 items-center justify-center rounded-full border text-[9px] ${
                                    item.valid
                                      ? 'border-emerald-500/30 bg-emerald-500/12 text-emerald-500'
                                      : 'border-[var(--border-default)] bg-[var(--surface-2)] text-[var(--text-muted)]'
                                  }`}
                                >
                                  <Check className="h-2.5 w-2.5" />
                                </span>
                                {item.label}
                              </div>
                            ))}
                          </div>
                        </>
                      )}
                    </div>

                    {/* Confirm password */}
                    {!isLogin && (
                      <div>
                        <label className="mb-2 block text-[11px] font-semibold uppercase tracking-[0.2em] text-[var(--text-secondary)]">
                          Confirm password
                        </label>
                        <div className="relative">
                          <Lock className="pointer-events-none absolute left-4 top-1/2 h-4 w-4 -translate-y-1/2 text-[var(--text-muted)]" />
                          <input
                            type={showPassword ? 'text' : 'password'}
                            value={confirmPassword}
                            onChange={(e) => setConfirmPassword(e.target.value)}
                            required
                            placeholder="Re-enter your password"
                            className="input-brand h-12 w-full rounded-xl border bg-[var(--surface-1)] pl-11 pr-12 text-sm text-[var(--text-primary)] outline-none transition-all"
                            style={{ borderColor: confirmPassword && !passwordsMatch ? '#EF4444' : 'var(--border-default)' }}
                          />
                          {confirmPassword && passwordsMatch && (
                            <Check className="absolute right-4 top-1/2 h-4 w-4 -translate-y-1/2 text-emerald-500" />
                          )}
                        </div>
                        {confirmPassword && !passwordsMatch && (
                          <p className="mt-1.5 text-xs text-red-500">Passwords need to match.</p>
                        )}
                      </div>
                    )}

                    {/* Submit */}
                    <button
                      type="submit"
                      disabled={submitDisabled}
                      className="btn-primary mt-1 flex w-full justify-center py-3.5 text-[0.9375rem]"
                    >
                      {loading
                        ? <Loader2 className="h-4 w-4 animate-spin" />
                        : <ArrowRight className="h-4 w-4" />
                      }
                      {loading ? 'Working…' : isLogin ? 'Log in' : 'Create account'}
                    </button>

                    {!isLogin && (
                      <p className="text-center text-[11px] leading-5 text-[var(--text-muted)]">
                        By creating an account you agree to use the product responsibly.
                      </p>
                    )}
                  </form>

                  {/* ── Mode switcher — single text line, no duplicate card ── */}
                  <p className="mt-5 text-center text-sm text-[var(--text-secondary)]">
                    {isLogin ? 'No account yet? ' : 'Already have one? '}
                    <button
                      type="button"
                      onClick={() => switchMode(!isLogin)}
                      className="font-semibold text-[var(--text-primary)] underline underline-offset-4 decoration-[var(--border-strong)] transition-opacity hover:opacity-70"
                    >
                      {isLogin ? 'Sign up free' : 'Log in'}
                    </button>
                  </p>
                </>
              )}
            </div>
          </div>
        </section>
      </div>
    </div>
  );
};

export default AuthForm;
