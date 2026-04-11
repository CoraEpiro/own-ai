import React, { useEffect, useMemo, useRef, useState } from 'react';
import { Link, useNavigate } from 'react-router-dom';
import toast from 'react-hot-toast';
import {
  ArrowLeft,
  Check,
  CheckCircle2,
  Eye,
  EyeOff,
  Loader2,
  Lock,
  Mail,
  Moon,
  ShieldCheck,
  Sparkles,
  Sun,
} from 'lucide-react';
import { useAuth } from '../contexts/AuthContext';
import OwnAILogo from './brand/OwnAILogo';
import useThemePreference from '../hooks/useThemePreference';

const desktopValuePoints = [
  'OpenAI, Claude, and Gemini in one premium workspace',
  '€2 free credit to explore the product with no card required',
  'Usage-based billing that fits deadline months better than fixed subscriptions',
];

const mobileValuePoints = ['€2 free to start', 'Visible usage cost', 'Built for web now, ready for more'];

const authHighlights = [
  { label: 'Shared context', value: 'Memory, instructions, and voice settings stay aligned' },
  { label: 'Trust signal', value: 'Per-message cost remains visible before waste compounds' },
];

const oauthProviders = ['Google', 'Apple'] as const;

const getPasswordStrength = (value: string) => {
  if (!value) {
    return 0;
  }

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

const getErrorMessage = (error: unknown) => {
  if (error instanceof Error) {
    return error.message;
  }

  return 'Something went wrong';
};

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

  useEffect(() => {
    return () => {
      if (redirectTimerRef.current) {
        window.clearTimeout(redirectTimerRef.current);
      }
    };
  }, []);

  const strength = getPasswordStrength(password);
  const passwordChecks = useMemo(
    () => [
      { label: 'At least 8 characters', valid: password.length >= 8 },
      { label: 'One uppercase letter', valid: /[A-Z]/.test(password) },
      { label: 'One number', valid: /[0-9]/.test(password) },
      { label: 'One symbol', valid: /[^A-Za-z0-9]/.test(password) },
    ],
    [password]
  );

  const passwordsMatch = !confirmPassword || password === confirmPassword;
  const submitDisabled =
    loading || !email || !password || (!isLogin && (!confirmPassword || confirmPassword !== password));

  const switchMode = (nextIsLogin: boolean) => {
    setIsLogin(nextIsLogin);
    setEmail('');
    setPassword('');
    setConfirmPassword('');
    setShowPassword(false);
    setSuccess(false);
  };

  const handleSubmit = async (event: React.FormEvent) => {
    event.preventDefault();

    if (!isLogin && password !== confirmPassword) {
      toast.error('Passwords do not match');
      return;
    }

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
      <div className="landing-mesh opacity-70" />
      <div className="landing-orb landing-orb-a opacity-70" />
      <div className="landing-orb landing-orb-b opacity-60" />
      <div className="landing-orb landing-orb-c opacity-50" />

      <div className="relative grid min-h-screen lg:grid-cols-[minmax(0,1.05fr)_minmax(420px,0.95fr)]">
        <section className="auth-brand-panel relative hidden min-h-screen flex-col justify-between overflow-hidden px-10 py-10 lg:flex xl:px-14 xl:py-12">
          <div className="auth-brand-panel-glow auth-brand-panel-glow-a" />
          <div className="auth-brand-panel-glow auth-brand-panel-glow-b" />
          <div className="auth-brand-panel-grid" />

          <div className="relative z-10 flex items-center justify-between gap-4">
            <OwnAILogo size={36} tone="light" wordmarkClassName="text-2xl" />
            <Link
              to="/"
              className="inline-flex items-center gap-2 rounded-full border border-white/18 bg-white/10 px-4 py-2 text-sm font-medium text-white/88 transition-colors hover:bg-white/16"
            >
              <ArrowLeft className="h-4 w-4" />
              Back home
            </Link>
          </div>

          <div className="relative z-10 max-w-2xl">
            <div className="inline-flex items-center gap-2 rounded-full border border-white/16 bg-white/10 px-4 py-2 text-xs font-medium uppercase tracking-[0.24em] text-white/75">
              Premium multi-model workspace
            </div>

            <h1 className="mt-8 font-display text-5xl font-extrabold tracking-[-0.05em] text-white xl:text-6xl xl:leading-[1.02]">
              All the AI.
              <br />
              None of the waste.
            </h1>

            <p className="mt-6 max-w-xl text-base leading-8 text-white/78 xl:text-lg">
              A cleaner way into OpenAI, Claude, and Gemini, with visible pricing and a design system that already thinks
              in web, desktop, and mobile terms.
            </p>

            <div className="mt-8 space-y-3">
              {desktopValuePoints.map((point) => (
                <div key={point} className="auth-value-pill">
                  <CheckCircle2 className="h-4.5 w-4.5 text-white" />
                  <span className="text-sm text-white/88">{point}</span>
                </div>
              ))}
            </div>

            <div className="mt-10 grid gap-4 xl:grid-cols-[minmax(0,1.08fr)_minmax(250px,0.92fr)]">
              <div className="auth-desktop-mockup">
                <div className="flex items-center justify-between">
                  <div className="flex gap-2">
                    <span className="landing-window-dot bg-white/45" />
                    <span className="landing-window-dot bg-white/28" />
                    <span className="landing-window-dot bg-white/15" />
                  </div>
                  <div className="rounded-full border border-white/12 bg-white/8 px-3 py-1 text-[11px] uppercase tracking-[0.24em] text-white/65">
                    GPT-4o active
                  </div>
                </div>

                <div className="mt-6 space-y-4">
                  <div className="h-4 w-4/5 rounded-full bg-white/14" />
                  <div className="h-4 w-full rounded-full bg-white/9" />
                  <div className="h-4 w-3/5 rounded-full bg-white/11" />
                </div>

                <div className="mt-8 grid gap-3 sm:grid-cols-2">
                  <div className="rounded-[24px] border border-white/10 bg-black/16 p-4">
                    <div className="text-xs uppercase tracking-[0.22em] text-white/48">This exchange cost</div>
                    <div className="mt-2 text-3xl font-semibold tracking-tight text-white">€0.018</div>
                    <div className="mt-4 h-2 overflow-hidden rounded-full bg-white/10">
                      <div className="h-full w-[58%] rounded-full bg-white" />
                    </div>
                  </div>
                  <div className="rounded-[24px] border border-white/10 bg-black/16 p-4">
                    <div className="text-xs uppercase tracking-[0.22em] text-white/48">Models available</div>
                    <div className="mt-3 flex flex-wrap gap-2">
                      {['GPT-4o', 'Claude', 'Gemini'].map((item) => (
                        <span key={item} className="rounded-full border border-white/10 bg-white/8 px-3 py-1 text-xs font-medium text-white/88">
                          {item}
                        </span>
                      ))}
                    </div>
                  </div>
                </div>
              </div>

              <div className="space-y-4">
                {authHighlights.map((item) => (
                  <div key={item.label} className="auth-side-note">
                    <div className="text-xs uppercase tracking-[0.22em] text-white/48">{item.label}</div>
                    <div className="mt-2 text-sm leading-6 text-white/84">{item.value}</div>
                  </div>
                ))}
              </div>
            </div>
          </div>

          <div className="relative z-10 text-[11px] uppercase tracking-[0.26em] text-white/50">
            One interface. One bill. More control.
          </div>
        </section>

        <section className="relative flex min-h-screen flex-col justify-center px-4 py-8 sm:px-6 lg:px-10 lg:py-10">
          <div className="absolute right-4 top-4 z-20 flex items-center gap-2 sm:right-6 sm:top-6">
            <button type="button" onClick={toggleTheme} className="shell-icon-button" aria-label="Toggle theme">
              {isDark ? <Sun className="h-4 w-4" /> : <Moon className="h-4 w-4" />}
            </button>
            <Link
              to="/"
              className="inline-flex items-center gap-2 rounded-full border border-[var(--border-default)] bg-[var(--surface-1)] px-4 py-2 text-sm font-medium text-[var(--text-secondary)] transition-colors hover:bg-[var(--surface-2)] hover:text-[var(--text-primary)]"
            >
              <ArrowLeft className="h-4 w-4" />
              Home
            </Link>
          </div>

          <div className="mx-auto flex w-full max-w-lg flex-col">
            <div className="mb-6 lg:hidden">
              <OwnAILogo size={34} wordmarkClassName="text-2xl" />
              <div className="mt-5 rounded-[28px] border border-[var(--border-default)] bg-[var(--surface-1)] p-5 shadow-[var(--shadow-card)]">
                <div className="inline-flex items-center gap-2 rounded-full border border-[rgba(99,102,241,0.2)] bg-[rgba(99,102,241,0.08)] px-3 py-1 text-[11px] font-medium uppercase tracking-[0.22em] text-[var(--brand-indigo)]">
                  <Sparkles className="h-3.5 w-3.5" />
                  Premium entry flow
                </div>
                <h1 className="mt-4 font-display text-3xl font-bold tracking-tight text-[var(--text-primary)]">
                  Join every major model in one place.
                </h1>
                <div className="mt-4 flex flex-wrap gap-2">
                  {mobileValuePoints.map((item) => (
                    <span
                      key={item}
                      className="rounded-full border border-[var(--border-default)] bg-[var(--surface-2)] px-3 py-1.5 text-xs font-medium text-[var(--text-secondary)]"
                    >
                      {item}
                    </span>
                  ))}
                </div>
              </div>
            </div>

            <div className="rounded-[32px] border border-[var(--border-default)] bg-[rgba(255,255,255,0.74)] p-5 shadow-[var(--shadow-elevated)] backdrop-blur-2xl dark:bg-[rgba(17,17,19,0.8)] sm:p-7">
              {success ? (
                <div className="animate-modal-in text-center">
                  <div className="mx-auto flex h-16 w-16 items-center justify-center rounded-full bg-brand-gradient shadow-glow-sm">
                    <Check className="h-8 w-8 text-white" />
                  </div>
                  <h2 className="mt-5 font-display text-3xl font-bold tracking-tight text-[var(--text-primary)]">You&apos;re in.</h2>
                  <p className="mt-3 text-sm leading-7 text-[var(--text-secondary)]">
                    Your account is ready and the €2 starter credit has been added. Redirecting you into the workspace now.
                  </p>
                  <div className="mt-6 h-1.5 overflow-hidden rounded-full bg-[var(--surface-3)]">
                    <div className="h-full w-full rounded-full bg-brand-gradient shimmer-bar" />
                  </div>
                </div>
              ) : (
                <>
                  <div className="flex justify-center">
                    <div className="flex w-full max-w-[290px] rounded-full border border-[var(--border-subtle)] bg-[var(--surface-2)] p-1">
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
                              background: active ? 'var(--surface-1)' : 'transparent',
                              color: active ? 'var(--text-primary)' : 'var(--text-secondary)',
                              boxShadow: active ? 'var(--shadow-card)' : 'none',
                            }}
                          >
                            {item.label}
                          </button>
                        );
                      })}
                    </div>
                  </div>

                  <div className="mt-8">
                    <h2 className="font-display text-3xl font-bold tracking-tight text-[var(--text-primary)]">
                      {isLogin ? 'Welcome back' : 'Create your account'}
                    </h2>
                    <p className="mt-3 text-sm leading-7 text-[var(--text-secondary)]">
                      {isLogin
                        ? 'Pick up your workspace where you left it, with the same models, memory, and billing clarity.'
                        : 'Start with €2 in real credit and a pricing model that fits bursts of actual usage.'}
                    </p>
                  </div>

                  <div className="mt-6 grid gap-3 sm:grid-cols-2">
                    {oauthProviders.map((provider) => (
                      <button
                        key={provider}
                        type="button"
                        disabled
                        className="flex h-12 items-center justify-center gap-2 rounded-2xl border border-[var(--border-default)] bg-[var(--surface-2)] px-4 text-sm font-medium text-[var(--text-secondary)] opacity-80"
                      >
                        <ShieldCheck className="h-4 w-4" />
                        {provider}
                        <span className="rounded-full border border-[var(--border-default)] px-2 py-0.5 text-[10px] uppercase tracking-[0.18em] text-[var(--text-muted)]">
                          Soon
                        </span>
                      </button>
                    ))}
                  </div>

                  <div className="my-6 flex items-center gap-3">
                    <div className="h-px flex-1 bg-[var(--border-subtle)]" />
                    <span className="text-[11px] uppercase tracking-[0.24em] text-[var(--text-muted)]">or continue with email</span>
                    <div className="h-px flex-1 bg-[var(--border-subtle)]" />
                  </div>

                  <form onSubmit={handleSubmit} className="space-y-5">
                    <div>
                      <label className="mb-2 block text-[11px] font-semibold uppercase tracking-[0.22em] text-[var(--text-secondary)]">
                        Email address
                      </label>
                      <div className="relative">
                        <Mail className="pointer-events-none absolute left-4 top-1/2 h-4 w-4 -translate-y-1/2 text-[var(--text-muted)]" />
                        <input
                          type="email"
                          value={email}
                          onChange={(event) => setEmail(event.target.value)}
                          required
                          placeholder="name@university.edu"
                          className="input-brand h-14 w-full rounded-2xl border border-[var(--border-default)] bg-[var(--surface-2)] pl-11 pr-4 text-sm text-[var(--text-primary)] outline-none transition-all duration-200"
                        />
                      </div>
                    </div>

                    <div>
                      <div className="mb-2 flex items-center justify-between gap-3">
                        <label className="text-[11px] font-semibold uppercase tracking-[0.22em] text-[var(--text-secondary)]">
                          Password
                        </label>
                        {isLogin ? (
                          <span className="text-[11px] text-[var(--text-muted)]">Password reset is coming soon</span>
                        ) : null}
                      </div>

                      <div className="relative">
                        <Lock className="pointer-events-none absolute left-4 top-1/2 h-4 w-4 -translate-y-1/2 text-[var(--text-muted)]" />
                        <input
                          type={showPassword ? 'text' : 'password'}
                          value={password}
                          onChange={(event) => setPassword(event.target.value)}
                          required
                          placeholder="••••••••"
                          className="input-brand h-14 w-full rounded-2xl border border-[var(--border-default)] bg-[var(--surface-2)] pl-11 pr-12 text-sm text-[var(--text-primary)] outline-none transition-all duration-200"
                        />
                        <button
                          type="button"
                          onClick={() => setShowPassword((current) => !current)}
                          className="absolute right-4 top-1/2 -translate-y-1/2 text-[var(--text-muted)] transition-colors hover:text-[var(--text-primary)]"
                          aria-label={showPassword ? 'Hide password' : 'Show password'}
                        >
                          {showPassword ? <EyeOff className="h-4 w-4" /> : <Eye className="h-4 w-4" />}
                        </button>
                      </div>

                      {!isLogin && password ? (
                        <>
                          <div className="mt-3 flex items-center gap-3">
                            <div className="flex flex-1 gap-1">
                              {[1, 2, 3, 4].map((index) => (
                                <div
                                  key={index}
                                  className="h-1.5 flex-1 rounded-full transition-all duration-200"
                                  style={{
                                    background: index <= strength ? strengthMeta[strength].color : 'var(--surface-3)',
                                  }}
                                />
                              ))}
                            </div>
                            <span className="text-xs font-medium" style={{ color: strengthMeta[strength].color }}>
                              {strengthMeta[strength].label}
                            </span>
                          </div>

                          <div className="mt-3 grid gap-2 sm:grid-cols-2">
                            {passwordChecks.map((item) => (
                              <div key={item.label} className="flex items-center gap-2 text-xs text-[var(--text-secondary)]">
                                <span
                                  className={`flex h-5 w-5 items-center justify-center rounded-full border ${
                                    item.valid
                                      ? 'border-emerald-500/30 bg-emerald-500/12 text-emerald-500'
                                      : 'border-[var(--border-default)] bg-[var(--surface-2)] text-[var(--text-muted)]'
                                  }`}
                                >
                                  <Check className="h-3 w-3" />
                                </span>
                                {item.label}
                              </div>
                            ))}
                          </div>
                        </>
                      ) : null}
                    </div>

                    {!isLogin ? (
                      <div>
                        <label className="mb-2 block text-[11px] font-semibold uppercase tracking-[0.22em] text-[var(--text-secondary)]">
                          Confirm password
                        </label>
                        <div className="relative">
                          <Lock className="pointer-events-none absolute left-4 top-1/2 h-4 w-4 -translate-y-1/2 text-[var(--text-muted)]" />
                          <input
                            type={showPassword ? 'text' : 'password'}
                            value={confirmPassword}
                            onChange={(event) => setConfirmPassword(event.target.value)}
                            required
                            placeholder="Re-enter your password"
                            className="input-brand h-14 w-full rounded-2xl border bg-[var(--surface-2)] pl-11 pr-12 text-sm text-[var(--text-primary)] outline-none transition-all duration-200"
                            style={{
                              borderColor: confirmPassword && !passwordsMatch ? '#EF4444' : 'var(--border-default)',
                            }}
                          />
                          {confirmPassword && passwordsMatch ? (
                            <Check className="absolute right-4 top-1/2 h-4 w-4 -translate-y-1/2 text-emerald-500" />
                          ) : null}
                        </div>
                        {confirmPassword && !passwordsMatch ? (
                          <p className="mt-2 text-xs text-red-500">Passwords need to match before we can create the account.</p>
                        ) : null}
                      </div>
                    ) : null}

                    <button type="submit" disabled={submitDisabled} className="btn-gradient mt-2 flex w-full justify-center py-3.5 text-sm sm:text-base">
                      {loading ? <Loader2 className="h-4 w-4 animate-spin" /> : <Sparkles className="h-4 w-4" />}
                      {loading ? 'Working...' : isLogin ? 'Log in' : 'Create account'}
                    </button>

                    {!isLogin ? (
                      <p className="text-center text-xs leading-6 text-[var(--text-muted)]">
                        By creating an account, you agree to use the product responsibly. OAuth and password reset can be
                        layered in later without rethinking this screen.
                      </p>
                    ) : null}
                  </form>

                  <div className="mt-6 flex items-center justify-between gap-3 rounded-[22px] border border-[var(--border-default)] bg-[var(--surface-1)] px-4 py-3">
                    <div>
                      <div className="text-sm font-medium text-[var(--text-primary)]">
                        {isLogin ? 'Need an account?' : 'Already have one?'}
                      </div>
                      <div className="text-xs text-[var(--text-secondary)]">
                        {isLogin
                          ? 'Create one and start with real credits.'
                          : 'Sign in and continue from your existing workspace.'}
                      </div>
                    </div>
                    <button
                      type="button"
                      onClick={() => switchMode(!isLogin)}
                      className="rounded-full border border-[var(--border-default)] px-4 py-2 text-sm font-semibold text-[var(--text-primary)] transition-colors hover:bg-[var(--surface-2)]"
                    >
                      {isLogin ? 'Sign up' : 'Log in'}
                    </button>
                  </div>
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
