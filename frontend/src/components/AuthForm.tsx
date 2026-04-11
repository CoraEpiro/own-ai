import React, { useState } from 'react';
import { useAuth } from '../contexts/AuthContext';
import { useNavigate } from 'react-router-dom';
import toast from 'react-hot-toast';
import { Eye, EyeOff, Mail, Lock, Loader2, Sparkles, Check } from 'lucide-react';

// ── Brand logo mark ────────────────────────────────────────────────────────
const LogoMark: React.FC<{ size?: number }> = ({ size = 32 }) => (
  <svg width={size} height={size} viewBox="0 0 32 32" fill="none">
    <defs>
      <linearGradient id="logoGrad" x1="0%" y1="0%" x2="100%" y2="100%">
        <stop offset="0%"   stopColor="#6366F1" />
        <stop offset="50%"  stopColor="#8B5CF6" />
        <stop offset="100%" stopColor="#D946EF" />
      </linearGradient>
    </defs>
    <circle cx="16" cy="16" r="14" fill="url(#logoGrad)" opacity="0.15" />
    <path d="M8 16 C8 11.6 11.6 8 16 8 C20.4 8 24 11.6 24 16" stroke="url(#logoGrad)" strokeWidth="2.5" strokeLinecap="round" fill="none"/>
    <path d="M24 16 C24 20.4 20.4 24 16 24 C11.6 24 8 20.4 8 16" stroke="url(#logoGrad)" strokeWidth="2.5" strokeLinecap="round" fill="none" strokeDasharray="4 2"/>
    <circle cx="16" cy="16" r="3" fill="url(#logoGrad)" />
  </svg>
);

// ── Provider icon placeholders ─────────────────────────────────────────────
const GoogleIcon: React.FC = () => (
  <svg width="18" height="18" viewBox="0 0 24 24">
    <path d="M22.56 12.25c0-.78-.07-1.53-.2-2.25H12v4.26h5.92c-.26 1.37-1.04 2.53-2.21 3.31v2.77h3.57c2.08-1.92 3.28-4.74 3.28-8.09z" fill="#4285F4"/>
    <path d="M12 23c2.97 0 5.46-.98 7.28-2.66l-3.57-2.77c-.98.66-2.23 1.06-3.71 1.06-2.86 0-5.29-1.93-6.16-4.53H2.18v2.84C3.99 20.53 7.7 23 12 23z" fill="#34A853"/>
    <path d="M5.84 14.09c-.22-.66-.35-1.36-.35-2.09s.13-1.43.35-2.09V7.07H2.18C1.43 8.55 1 10.22 1 12s.43 3.45 1.18 4.93l2.85-2.22.81-.62z" fill="#FBBC05"/>
    <path d="M12 5.38c1.62 0 3.06.56 4.21 1.64l3.15-3.15C17.45 2.09 14.97 1 12 1 7.7 1 3.99 3.47 2.18 7.07l3.66 2.84c.87-2.6 3.3-4.53 6.16-4.53z" fill="#EA4335"/>
  </svg>
);

const AppleIcon: React.FC = () => (
  <svg width="18" height="18" viewBox="0 0 24 24" fill="currentColor">
    <path d="M18.71 19.5c-.83 1.24-1.71 2.45-3.05 2.47-1.34.03-1.77-.79-3.29-.79-1.53 0-2 .77-3.27.82-1.31.05-2.3-1.32-3.14-2.53C4.25 17 2.94 12.45 4.7 9.39c.87-1.52 2.43-2.48 4.12-2.51 1.28-.02 2.5.87 3.29.87.78 0 2.26-1.07 3.8-.91.65.03 2.47.26 3.64 1.98-.09.06-2.17 1.28-2.15 3.81.03 3.02 2.65 4.03 2.68 4.04-.03.07-.42 1.44-1.38 2.83M13 3.5c.73-.83 1.94-1.46 2.94-1.5.13 1.17-.34 2.35-1.04 3.19-.69.85-1.83 1.51-2.95 1.42-.15-1.15.41-2.35 1.05-3.11z"/>
  </svg>
);

// ── Feature pills for left panel ───────────────────────────────────────────
const features = [
  { icon: '✦', text: 'ChatGPT · Claude · Gemini in one place' },
  { icon: '€', text: '€2 free credits — no card required' },
  { icon: '⚡', text: 'Pay only for what you actually use' },
];

const AuthForm: React.FC = () => {
  const [isLogin, setIsLogin]           = useState(true);
  const [email, setEmail]               = useState('');
  const [password, setPassword]         = useState('');
  const [confirmPassword, setConfirmPassword] = useState('');
  const [showPassword, setShowPassword] = useState(false);
  const [loading, setLoading]           = useState(false);
  const [success, setSuccess]           = useState(false);

  const { login, register } = useAuth();
  const navigate = useNavigate();

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!isLogin && password !== confirmPassword) {
      toast.error('Passwords do not match');
      return;
    }
    setLoading(true);
    try {
      if (isLogin) {
        await login(email, password);
        toast.success('Welcome back!');
      } else {
        await register(email, password);
        setSuccess(true);
        toast.success('Account created! €2 credit added.');
        setTimeout(() => navigate('/chat'), 1800);
        return;
      }
      navigate('/chat');
    } catch (error: any) {
      toast.error(error.message || 'Something went wrong');
    } finally {
      setLoading(false);
    }
  };

  // Password strength
  const getPasswordStrength = (p: string) => {
    if (p.length === 0) return 0;
    let score = 0;
    if (p.length >= 8)  score++;
    if (/[A-Z]/.test(p)) score++;
    if (/[0-9]/.test(p)) score++;
    if (/[^A-Za-z0-9]/.test(p)) score++;
    return score;
  };
  const strength = getPasswordStrength(password);
  const strengthColors = ['', '#EF4444', '#F59E0B', '#10B981', '#10B981'];
  const strengthLabels = ['', 'Weak', 'Fair', 'Good', 'Strong'];

  const switchMode = (login: boolean) => {
    setIsLogin(login);
    setEmail('');
    setPassword('');
    setConfirmPassword('');
    setSuccess(false);
  };

  return (
    <div className="min-h-screen flex bg-[var(--bg-base)]">

      {/* ── LEFT PANEL — decorative, desktop only ─────────────────────────── */}
      <div
        className="hidden lg:flex lg:w-[55%] relative overflow-hidden flex-col items-center justify-center p-12"
        style={{ background: '#0A0A0A' }}
      >
        {/* Animated gradient orbs */}
        <div
          className="absolute w-[600px] h-[600px] rounded-full pointer-events-none"
          style={{
            background: 'radial-gradient(circle, rgba(99,102,241,0.18) 0%, transparent 70%)',
            top: '10%', left: '10%',
            animation: 'drift1 28s ease-in-out infinite',
          }}
        />
        <div
          className="absolute w-[500px] h-[500px] rounded-full pointer-events-none"
          style={{
            background: 'radial-gradient(circle, rgba(139,92,246,0.15) 0%, transparent 70%)',
            bottom: '15%', right: '5%',
            animation: 'drift2 34s ease-in-out infinite',
          }}
        />
        <div
          className="absolute w-[400px] h-[400px] rounded-full pointer-events-none"
          style={{
            background: 'radial-gradient(circle, rgba(217,70,239,0.1) 0%, transparent 70%)',
            top: '50%', left: '50%',
            animation: 'drift3 22s ease-in-out infinite',
          }}
        />

        {/* Content */}
        <div className="relative z-10 max-w-md text-center">
          {/* Logo */}
          <div className="flex items-center justify-center gap-3 mb-10">
            <LogoMark size={40} />
            <span className="font-display text-2xl font-bold text-white tracking-tight">Own AI</span>
          </div>

          {/* Headline */}
          <h1 className="font-display text-5xl font-800 leading-tight mb-6" style={{ fontWeight: 800 }}>
            <span className="text-white">All the AI.</span>
            <br />
            <span className="text-gradient">None of the waste.</span>
          </h1>

          <p className="text-lg text-zinc-400 leading-relaxed mb-10">
            Access every major AI model in one app.
            Pay only for what you use — not $60/month
            in subscriptions you barely use.
          </p>

          {/* Feature pills */}
          <div className="flex flex-col gap-3">
            {features.map((f, i) => (
              <div
                key={i}
                className="flex items-center gap-3 px-4 py-3 rounded-xl text-left animate-slide-left"
                style={{
                  background: 'rgba(255,255,255,0.04)',
                  border: '1px solid rgba(255,255,255,0.07)',
                  animationDelay: `${i * 100 + 300}ms`,
                }}
              >
                <span className="text-gradient text-lg w-6 text-center flex-shrink-0">{f.icon}</span>
                <span className="text-sm text-zinc-300">{f.text}</span>
              </div>
            ))}
          </div>

          {/* Provider logos row */}
          <div className="flex items-center justify-center gap-6 mt-10 opacity-40">
            <span className="text-xs text-zinc-500 uppercase tracking-widest">Powered by</span>
            <span className="text-xs text-zinc-400 font-medium">OpenAI</span>
            <span className="text-zinc-700">·</span>
            <span className="text-xs text-zinc-400 font-medium">Anthropic</span>
            <span className="text-zinc-700">·</span>
            <span className="text-xs text-zinc-400 font-medium">Google</span>
          </div>
        </div>
      </div>

      {/* ── RIGHT PANEL — auth form ────────────────────────────────────────── */}
      <div className="flex-1 flex flex-col items-center justify-center px-6 py-12 sm:px-12">

        {/* Mobile logo */}
        <div className="flex items-center gap-2.5 mb-8 lg:hidden">
          <LogoMark size={32} />
          <span className="font-display text-xl font-bold tracking-tight" style={{ color: 'var(--text-primary)' }}>Own AI</span>
        </div>

        <div className="w-full max-w-sm">

          {/* Success state */}
          {success ? (
            <div className="text-center animate-modal-in">
              <div
                className="w-16 h-16 rounded-full flex items-center justify-center mx-auto mb-4"
                style={{ background: 'linear-gradient(135deg, #6366F1, #D946EF)' }}
              >
                <Check className="w-8 h-8 text-white" />
              </div>
              <h2 className="font-display text-2xl font-bold mb-2" style={{ color: 'var(--text-primary)' }}>You're in!</h2>
              <p style={{ color: 'var(--text-secondary)' }}>€2.00 credit added to your account.</p>
              <div
                className="mt-4 h-1 rounded-full overflow-hidden"
                style={{ background: 'var(--surface-3)' }}
              >
                <div
                  className="h-full rounded-full"
                  style={{
                    background: 'var(--brand-gradient)',
                    animation: 'shimmer 1.5s ease-in-out',
                    width: '100%',
                  }}
                />
              </div>
            </div>
          ) : (
            <>
              {/* Tab toggle */}
              <div
                className="flex p-1 mb-8 rounded-xl"
                style={{ background: 'var(--surface-2)', border: '1px solid var(--border-subtle)' }}
              >
                {(['Sign in', 'Create account'] as const).map((label, i) => {
                  const active = (i === 0) === isLogin;
                  return (
                    <button
                      key={label}
                      onClick={() => switchMode(i === 0)}
                      className="flex-1 py-2.5 text-sm font-medium rounded-lg transition-all duration-200"
                      style={{
                        background: active ? 'var(--surface-1)' : 'transparent',
                        color: active ? 'var(--text-primary)' : 'var(--text-muted)',
                        boxShadow: active ? 'var(--shadow-card)' : 'none',
                      }}
                    >
                      {label}
                    </button>
                  );
                })}
              </div>

              {/* Heading */}
              <div className="mb-6">
                <h2 className="font-display text-2xl font-bold" style={{ color: 'var(--text-primary)' }}>
                  {isLogin ? 'Welcome back' : 'Create your account'}
                </h2>
                {!isLogin && (
                  <p className="mt-1 text-sm" style={{ color: 'var(--text-secondary)' }}>
                    Get €2 in free AI credits — no card required.
                  </p>
                )}
              </div>

              {/* OAuth buttons */}
              <div className="flex gap-3 mb-5">
                <button
                  type="button"
                  className="flex-1 flex items-center justify-center gap-2 py-2.5 rounded-xl text-sm font-medium transition-all duration-200 hover:scale-[1.02] active:scale-[0.98]"
                  style={{
                    background: 'var(--surface-2)',
                    border: '1px solid var(--border-default)',
                    color: 'var(--text-primary)',
                  }}
                  onClick={() => toast('Google login coming soon!')}
                >
                  <GoogleIcon />
                  Google
                </button>
                <button
                  type="button"
                  className="flex-1 flex items-center justify-center gap-2 py-2.5 rounded-xl text-sm font-medium transition-all duration-200 hover:scale-[1.02] active:scale-[0.98]"
                  style={{
                    background: '#000',
                    border: '1px solid rgba(255,255,255,0.15)',
                    color: '#fff',
                  }}
                  onClick={() => toast('Apple login coming soon!')}
                >
                  <AppleIcon />
                  Apple
                </button>
              </div>

              {/* Divider */}
              <div className="flex items-center gap-3 mb-5">
                <div className="flex-1 h-px" style={{ background: 'var(--border-subtle)' }} />
                <span className="text-xs" style={{ color: 'var(--text-muted)' }}>or continue with email</span>
                <div className="flex-1 h-px" style={{ background: 'var(--border-subtle)' }} />
              </div>

              {/* Form */}
              <form onSubmit={handleSubmit} className="space-y-4">

                {/* Email */}
                <div>
                  <label className="block text-sm font-medium mb-1.5" style={{ color: 'var(--text-secondary)' }}>
                    Email
                  </label>
                  <div className="relative">
                    <Mail className="absolute left-3.5 top-1/2 -translate-y-1/2 w-4 h-4" style={{ color: 'var(--text-muted)' }} />
                    <input
                      type="email"
                      value={email}
                      onChange={e => setEmail(e.target.value)}
                      required
                      placeholder="you@university.edu"
                      className="input-brand w-full pl-10 pr-4 py-3 rounded-xl text-sm transition-all duration-200"
                      style={{
                        background: 'var(--surface-2)',
                        border: '1.5px solid var(--border-default)',
                        color: 'var(--text-primary)',
                      }}
                    />
                  </div>
                </div>

                {/* Password */}
                <div>
                  <div className="flex items-center justify-between mb-1.5">
                    <label className="text-sm font-medium" style={{ color: 'var(--text-secondary)' }}>Password</label>
                    {isLogin && (
                      <button type="button" className="text-xs hover:underline" style={{ color: '#6366F1' }}>
                        Forgot password?
                      </button>
                    )}
                  </div>
                  <div className="relative">
                    <Lock className="absolute left-3.5 top-1/2 -translate-y-1/2 w-4 h-4" style={{ color: 'var(--text-muted)' }} />
                    <input
                      type={showPassword ? 'text' : 'password'}
                      value={password}
                      onChange={e => setPassword(e.target.value)}
                      required
                      placeholder="••••••••"
                      className="input-brand w-full pl-10 pr-12 py-3 rounded-xl text-sm transition-all duration-200"
                      style={{
                        background: 'var(--surface-2)',
                        border: '1.5px solid var(--border-default)',
                        color: 'var(--text-primary)',
                      }}
                    />
                    <button
                      type="button"
                      onClick={() => setShowPassword(!showPassword)}
                      className="absolute right-3.5 top-1/2 -translate-y-1/2 transition-opacity hover:opacity-100"
                      style={{ color: 'var(--text-muted)', opacity: 0.6 }}
                    >
                      {showPassword ? <EyeOff className="w-4 h-4" /> : <Eye className="w-4 h-4" />}
                    </button>
                  </div>
                  {/* Strength bar (signup only) */}
                  {!isLogin && password.length > 0 && (
                    <div className="mt-2 flex items-center gap-2">
                      <div className="flex-1 flex gap-1">
                        {[1,2,3,4].map(i => (
                          <div
                            key={i}
                            className="flex-1 h-1 rounded-full transition-all duration-300"
                            style={{ background: i <= strength ? strengthColors[strength] : 'var(--surface-3)' }}
                          />
                        ))}
                      </div>
                      <span className="text-xs" style={{ color: strengthColors[strength] }}>
                        {strengthLabels[strength]}
                      </span>
                    </div>
                  )}
                </div>

                {/* Confirm password (signup) */}
                {!isLogin && (
                  <div>
                    <label className="block text-sm font-medium mb-1.5" style={{ color: 'var(--text-secondary)' }}>
                      Confirm password
                    </label>
                    <div className="relative">
                      <Lock className="absolute left-3.5 top-1/2 -translate-y-1/2 w-4 h-4" style={{ color: 'var(--text-muted)' }} />
                      <input
                        type={showPassword ? 'text' : 'password'}
                        value={confirmPassword}
                        onChange={e => setConfirmPassword(e.target.value)}
                        required
                        placeholder="••••••••"
                        className="input-brand w-full pl-10 pr-4 py-3 rounded-xl text-sm transition-all duration-200"
                        style={{
                          background: 'var(--surface-2)',
                          border: `1.5px solid ${confirmPassword && confirmPassword !== password ? '#EF4444' : 'var(--border-default)'}`,
                          color: 'var(--text-primary)',
                        }}
                      />
                      {confirmPassword && confirmPassword === password && (
                        <Check className="absolute right-3.5 top-1/2 -translate-y-1/2 w-4 h-4 text-emerald-500" />
                      )}
                    </div>
                  </div>
                )}

                {/* Submit */}
                <button
                  type="submit"
                  disabled={loading}
                  className="btn-gradient w-full justify-center mt-2"
                  style={{ fontSize: '15px', padding: '13px 24px' }}
                >
                  {loading ? (
                    <Loader2 className="w-4 h-4 animate-spin" />
                  ) : (
                    <Sparkles className="w-4 h-4" />
                  )}
                  {loading ? 'Please wait...' : (isLogin ? 'Sign in' : 'Create account')}
                </button>

                {/* Trust note (signup) */}
                {!isLogin && (
                  <p className="text-center text-xs mt-1" style={{ color: 'var(--text-muted)' }}>
                    By signing up you agree to our{' '}
                    <a href="#" className="hover:underline" style={{ color: '#6366F1' }}>Terms</a>
                    {' '}and{' '}
                    <a href="#" className="hover:underline" style={{ color: '#6366F1' }}>Privacy Policy</a>
                  </p>
                )}
              </form>

              {/* Switch mode */}
              <p className="text-center text-sm mt-6" style={{ color: 'var(--text-muted)' }}>
                {isLogin ? "Don't have an account? " : 'Already have an account? '}
                <button
                  onClick={() => switchMode(!isLogin)}
                  className="font-medium hover:underline"
                  style={{ color: '#6366F1' }}
                >
                  {isLogin ? 'Create one' : 'Sign in'}
                </button>
              </p>
            </>
          )}
        </div>
      </div>
    </div>
  );
};

export default AuthForm;
