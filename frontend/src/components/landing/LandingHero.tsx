import React from 'react';
import { ArrowRight, Bot, CreditCard, Sparkles } from 'lucide-react';
import { Link } from 'react-router-dom';

const providerPills = [
  { label: 'GPT-4o', accent: 'var(--accent-openai)' },
  { label: 'Claude', accent: 'var(--accent-anthropic)' },
  { label: 'Gemini', accent: 'var(--accent-google)' },
];

const valuePoints = [
  'One account across OpenAI, Claude, and Gemini',
  'Transparent per-message costs before waste stacks up',
  'Memory, voice, search, and study workflows in one workspace',
];

const LandingHero: React.FC = () => (
  <section className="relative overflow-hidden px-4 pb-16 pt-28 sm:px-6 lg:px-8 lg:pb-24 lg:pt-36">
    <div className="landing-orb landing-orb-a" />
    <div className="landing-orb landing-orb-b" />
    <div className="landing-orb landing-orb-c" />

    <div className="mx-auto grid max-w-7xl items-center gap-14 lg:grid-cols-[minmax(0,1.06fr)_minmax(420px,0.94fr)]">
      <div className="relative z-10">
        <div className="landing-eyebrow">
          <Sparkles className="h-4 w-4 text-[var(--brand-indigo)]" />
          Built for students who use AI intensely, not expensively
        </div>

        <h1 className="mt-6 max-w-4xl font-display text-5xl font-extrabold tracking-[-0.05em] text-[var(--text-primary)] sm:text-6xl lg:text-7xl xl:text-[5.25rem] xl:leading-[0.94]">
          All the AI.
          <br />
          <span className="text-gradient">None of the waste.</span>
        </h1>

        <p className="mt-6 max-w-2xl text-base leading-8 text-[var(--text-secondary)] sm:text-lg">
          Own AI gives you one premium workspace for the best models, with usage-based pricing, personal memory,
          and cross-device continuity. You keep the power. You stop paying for subscriptions you barely touch.
        </p>

        <div className="mt-8 flex flex-col gap-3 sm:flex-row">
          <Link to="/auth" className="btn-gradient justify-center px-7 py-3.5 text-sm sm:text-base">
            Start free
            <ArrowRight className="h-4 w-4" />
          </Link>
          <a href="#pricing" className="landing-secondary-button">
            See pricing logic
          </a>
        </div>

        <div className="mt-8 flex flex-wrap gap-3">
          {providerPills.map((pill) => (
            <div
              key={pill.label}
              className="landing-provider-pill"
              style={{ borderColor: `${pill.accent}45`, color: pill.accent, background: `${pill.accent}15` }}
            >
              <span className="h-2 w-2 rounded-full" style={{ background: pill.accent }} />
              {pill.label}
            </div>
          ))}
          <div className="landing-provider-pill border-[var(--border-default)] bg-[var(--surface-2)] text-[var(--text-secondary)]">
            <CreditCard className="h-3.5 w-3.5" />
            €2 free credit, no card required
          </div>
        </div>

        <div className="mt-10 grid gap-3 sm:grid-cols-3">
          {valuePoints.map((point, index) => (
            <div key={point} className="landing-outline-card animate-slide-up" style={{ animationDelay: `${index * 90}ms` }}>
              <div className="mb-3 flex h-9 w-9 items-center justify-center rounded-2xl bg-[rgba(99,102,241,0.12)] text-[var(--brand-indigo)]">
                <Bot className="h-4.5 w-4.5" />
              </div>
              <p className="text-sm leading-6 text-[var(--text-secondary)]">{point}</p>
            </div>
          ))}
        </div>
      </div>

      <div className="relative z-10">
        <div className="landing-device-frame animate-float">
          <div className="landing-device-toolbar">
            <div className="flex gap-2">
              <span className="landing-window-dot bg-white/45" />
              <span className="landing-window-dot bg-white/25" />
              <span className="landing-window-dot bg-white/15" />
            </div>
            <div className="landing-toolbar-badge">Auto mode • Study sprint</div>
          </div>

          <div className="grid gap-4 p-4 lg:grid-cols-[220px_minmax(0,1fr)] lg:p-5">
            <div className="rounded-[24px] border border-white/10 bg-white/6 p-4">
              <div className="mb-4 flex items-center gap-3">
                <div className="flex h-10 w-10 items-center justify-center rounded-2xl bg-brand-gradient shadow-glow-sm">
                  <Sparkles className="h-4 w-4 text-white" />
                </div>
                <div>
                  <div className="text-sm font-semibold text-white">Own AI</div>
                  <div className="text-xs uppercase tracking-[0.24em] text-white/55">Unified workspace</div>
                </div>
              </div>

              <div className="space-y-2">
                {['Exam prep', 'Research mode', 'Voice recap', 'Saved memory'].map((item, index) => (
                  <div
                    key={item}
                    className={`rounded-2xl border px-3 py-3 text-sm ${
                      index === 0
                        ? 'border-[rgba(255,255,255,0.14)] bg-white/12 text-white'
                        : 'border-white/6 bg-black/20 text-white/65'
                    }`}
                  >
                    {item}
                  </div>
                ))}
              </div>
            </div>

            <div className="space-y-4">
              <div className="rounded-[26px] border border-white/10 bg-black/24 p-5">
                <div className="flex items-start justify-between gap-4">
                  <div>
                    <p className="text-xs uppercase tracking-[0.24em] text-white/55">Live conversation</p>
                    <h2 className="mt-2 text-2xl font-semibold tracking-tight text-white">Compare three models in one thread</h2>
                  </div>
                  <div className="rounded-full border border-emerald-400/25 bg-emerald-400/15 px-3 py-1 text-xs font-medium text-emerald-300">
                    Billing visible
                  </div>
                </div>

                <div className="mt-5 space-y-3">
                  <div className="ml-auto max-w-[18rem] rounded-[22px] rounded-br-md bg-white px-4 py-3 text-sm leading-6 text-zinc-900">
                    Summarise this economics lecture, then turn it into a three-day revision plan.
                  </div>
                  <div className="max-w-[21rem] rounded-[24px] rounded-bl-md border border-white/8 bg-white/8 px-4 py-3 text-sm leading-6 text-white/88">
                    Claude: I built a concise summary first. GPT-4o can draft the revision plan. Gemini can fetch live
                    references if you want web-backed notes.
                  </div>
                </div>
              </div>

              <div className="grid gap-4 sm:grid-cols-2">
                <div className="landing-analytics-card">
                  <div className="text-xs uppercase tracking-[0.24em] text-white/55">This message cost</div>
                  <div className="mt-2 text-3xl font-semibold tracking-tight text-white">€0.018</div>
                  <div className="mt-4 h-2 overflow-hidden rounded-full bg-white/8">
                    <div className="h-full w-[62%] rounded-full bg-brand-gradient" />
                  </div>
                  <div className="mt-3 flex items-center justify-between text-xs text-white/60">
                    <span>GPT-4o</span>
                    <span>Claude</span>
                    <span>Gemini</span>
                  </div>
                </div>

                <div className="landing-analytics-card">
                  <div className="text-xs uppercase tracking-[0.24em] text-white/55">Device continuity</div>
                  <div className="mt-3 space-y-3">
                    {['Web workspace synced', 'Desktop-ready layout system', 'Mobile-first surfaces planned'].map((item) => (
                      <div key={item} className="flex items-center gap-3 text-sm text-white/85">
                        <span className="flex h-6 w-6 items-center justify-center rounded-full bg-white/10">
                          <ArrowRight className="h-3.5 w-3.5" />
                        </span>
                        {item}
                      </div>
                    ))}
                  </div>
                </div>
              </div>
            </div>
          </div>
        </div>

        <div className="landing-floating-chip left-[-1rem] top-[4.5rem] hidden lg:flex">
          <span className="landing-chip-icon bg-emerald-400/15 text-emerald-300">$</span>
          <div>
            <div className="text-xs uppercase tracking-[0.22em] text-white/45">Usage pricing</div>
            <div className="text-sm font-semibold text-white">See cost before you send</div>
          </div>
        </div>

        <div className="landing-floating-chip bottom-6 right-[-1.25rem] hidden lg:flex">
          <span className="landing-chip-icon bg-amber-400/15 text-amber-300">AI</span>
          <div>
            <div className="text-xs uppercase tracking-[0.22em] text-white/45">Model switch</div>
            <div className="text-sm font-semibold text-white">OpenAI, Claude, Gemini</div>
          </div>
        </div>
      </div>
    </div>
  </section>
);

export default LandingHero;
