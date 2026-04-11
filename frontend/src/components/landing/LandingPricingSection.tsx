import React from 'react';
import { CreditCard, Eye, Receipt } from 'lucide-react';
import { Link } from 'react-router-dom';

const legacyCosts = [
  { label: 'ChatGPT Plus', value: '$20 / month', color: '#10B981' },
  { label: 'Claude Pro', value: '$20 / month', color: '#F59E0B' },
  { label: 'Gemini Advanced', value: '$20 / month', color: '#3B82F6' },
];

const ownAIBreakdown = [
  { label: '€2 starter credit', value: 'Free', note: 'No card needed' },
  { label: 'Platform access', value: '€2 / mo', note: 'After first €2' },
  { label: 'Model usage', value: 'API rate', note: 'Only what you send' },
];

const billingNotes = [
  {
    icon: Receipt,
    title: 'Start free, stay honest',
    description: 'New accounts begin with €2 in credits. Real usage, real models, no trial strings attached.',
  },
  {
    icon: Eye,
    title: 'See the math every time',
    description: 'Per-message cost is visible in the product before and after every send — not buried in a monthly invoice.',
  },
  {
    icon: CreditCard,
    title: 'One combined bill',
    description: 'Platform fee and model usage stay in a single monthly charge instead of three scattered subscriptions.',
  },
];

const LandingPricingSection: React.FC = () => (
  <section id="pricing" className="px-4 py-20 sm:px-6 lg:px-8 lg:py-28">
    <div className="mx-auto max-w-7xl">
      <div className="max-w-3xl">
        <div className="landing-eyebrow">Pricing that respects your schedule</div>
        <h2 className="mt-5 font-display text-4xl font-bold tracking-[-0.03em] text-[var(--text-primary)] sm:text-5xl">
          Stop paying $60 a month for AI you barely touch.
        </h2>
        <p className="mt-5 text-base leading-8 text-[var(--text-secondary)] sm:text-lg">
          Exam weeks demand heavy AI. Summer break doesn't. Own AI charges you
          for what you actually send — nothing more.
        </p>
      </div>

      <div className="mt-12 grid gap-6 lg:grid-cols-[minmax(0,0.92fr)_minmax(0,1.08fr)]">

        {/* Old way */}
        <div
          className="landing-pricing-card"
          style={{ background: 'rgba(239,68,68,0.04)', borderColor: 'rgba(239,68,68,0.15)' }}
        >
          <div className="flex items-start justify-between gap-3">
            <div>
              <p className="text-xs font-semibold uppercase tracking-[0.28em] text-red-400">
                The old way
              </p>
              <h3 className="mt-2 text-xl font-semibold tracking-tight text-[var(--text-primary)]">
                Three subscriptions,<br />one expensive habit
              </h3>
            </div>
            <div className="shrink-0 rounded-full border border-red-500/20 bg-red-500/10 px-3 py-1 text-xs font-medium text-red-400">
              Fixed monthly
            </div>
          </div>

          <div className="mt-8 space-y-2.5">
            {legacyCosts.map((item) => (
              <div
                key={item.label}
                className="flex items-center justify-between rounded-2xl px-4 py-3.5"
                style={{
                  background: 'rgba(0,0,0,0.04)',
                  border: '1px solid rgba(239,68,68,0.1)',
                }}
              >
                <div className="flex items-center gap-2.5">
                  <span
                    className="h-2 w-2 rounded-full shrink-0"
                    style={{ background: item.color }}
                  />
                  <span className="text-sm text-[var(--text-secondary)]">{item.label}</span>
                </div>
                <span className="font-semibold text-[var(--text-primary)]">{item.value}</span>
              </div>
            ))}
          </div>

          <div className="mt-8 flex items-end justify-between border-t border-red-500/10 pt-6">
            <div>
              <div className="text-sm text-[var(--text-secondary)]">Combined, every month</div>
              <div className="mt-1 text-[10px] font-semibold uppercase tracking-[0.22em] text-red-400">
                Pay whether you use them or not
              </div>
            </div>
            <div className="font-display text-4xl font-bold tracking-tight text-red-400">$60+</div>
          </div>
        </div>

        {/* Own AI way */}
        <div
          className="landing-pricing-card"
          style={{
            background: 'rgba(16,185,129,0.04)',
            borderColor: 'rgba(16,185,129,0.18)',
          }}
        >
          <div className="flex items-start justify-between gap-3">
            <div>
              <p className="text-xs font-semibold uppercase tracking-[0.28em]" style={{ color: '#10B981' }}>
                The Own AI way
              </p>
              <h3 className="mt-2 text-xl font-semibold tracking-tight text-[var(--text-primary)]">
                One workspace.<br />Transparent usage.
              </h3>
            </div>
            <div
              className="shrink-0 rounded-full px-3 py-1 text-xs font-medium"
              style={{
                background: 'rgba(16,185,129,0.1)',
                border: '1px solid rgba(16,185,129,0.22)',
                color: '#10B981',
              }}
            >
              Pay-as-you-go
            </div>
          </div>

          <div className="mt-8 grid gap-3 sm:grid-cols-3">
            {ownAIBreakdown.map((item) => (
              <div
                key={item.label}
                className="rounded-[20px] px-4 py-5 bg-white dark:bg-[#1C1C1F]"
                style={{ border: '1px solid var(--border-default)' }}
              >
                <div className="text-[10px] font-semibold uppercase tracking-[0.22em] text-[var(--text-muted)]">
                  {item.label}
                </div>
                <div className="mt-3 text-base font-bold tracking-tight text-[var(--text-primary)]">
                  {item.value}
                </div>
                <div className="mt-1 text-[11px] text-[var(--text-muted)]">{item.note}</div>
              </div>
            ))}
          </div>

          <div className="mt-4 grid gap-4 sm:grid-cols-2">
            <div
              className="rounded-[20px] p-5 bg-white dark:bg-[#1C1C1F]"
              style={{ border: '1px solid var(--border-default)' }}
            >
              <div className="text-[10px] font-semibold uppercase tracking-[0.22em] text-[var(--text-muted)]">
                Typical student month
              </div>
              <div
                className="mt-3 font-display text-4xl font-bold tracking-tight"
                style={{ color: '#10B981' }}
              >
                €4–€8
              </div>
              <p className="mt-3 text-sm leading-6 text-[var(--text-secondary)]">
                Light months stay cheap. Heavy months still cost less than a single premium subscription.
              </p>
            </div>
            <div
              className="rounded-[20px] p-5 bg-white dark:bg-[#1C1C1F]"
              style={{ border: '1px solid var(--border-default)' }}
            >
              <div className="text-[10px] font-semibold uppercase tracking-[0.22em] text-[var(--text-muted)]">
                Cost transparency
              </div>
              <div className="mt-3 text-base font-semibold tracking-tight text-[var(--text-primary)]">
                Per-message cost displayed in real time
              </div>
              <p className="mt-3 text-sm leading-6 text-[var(--text-secondary)]">
                See exactly what each response costs before and after you send — no surprises at month end.
              </p>
            </div>
          </div>

          <div className="mt-6 flex items-end justify-between border-t pt-5"
            style={{ borderColor: 'rgba(16,185,129,0.12)' }}>
            <div>
              <div className="text-sm text-[var(--text-secondary)]">vs. $60+ fixed</div>
              <div className="mt-1 text-[10px] font-semibold uppercase tracking-[0.22em]" style={{ color: '#10B981' }}>
                Save €30–50 every month you don't need all three
              </div>
            </div>
            <div className="font-display text-4xl font-bold tracking-tight" style={{ color: '#10B981' }}>
              €2–€8
            </div>
          </div>
        </div>
      </div>

      {/* Billing notes */}
      <div className="mt-10 grid gap-4 lg:grid-cols-3">
        {billingNotes.map(({ icon: Icon, title, description }) => (
          <div key={title} className="landing-outline-card">
            <div className="surface-icon-wrap">
              <Icon className="h-4 w-4" />
            </div>
            <h3 className="mt-5 text-base font-semibold tracking-tight text-[var(--text-primary)]">
              {title}
            </h3>
            <p className="mt-3 text-sm leading-7 text-[var(--text-secondary)]">{description}</p>
          </div>
        ))}
      </div>

      <div className="mt-8 text-center">
        <Link to="/auth" className="btn-primary px-8 py-3.5 text-sm">
          Start with €2 free credit
          <svg className="ml-2 h-4 w-4 inline" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={2}>
            <path strokeLinecap="round" strokeLinejoin="round" d="M17 8l4 4m0 0l-4 4m4-4H3" />
          </svg>
        </Link>
        <p className="mt-3 text-[11px] uppercase tracking-wide text-[var(--text-muted)]">
          No card required · cancel anytime
        </p>
      </div>
    </div>
  </section>
);

export default LandingPricingSection;
