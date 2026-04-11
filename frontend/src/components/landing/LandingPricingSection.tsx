import React from 'react';
import { CreditCard, Receipt, WalletCards } from 'lucide-react';

const legacyCosts = [
  { label: 'ChatGPT Plus', value: '$20 / month' },
  { label: 'Claude Pro', value: '$20 / month' },
  { label: 'Gemini Advanced', value: '$20 / month' },
];

const ownAIBreakdown = [
  { label: '€2 starter credit', value: 'Included' },
  { label: 'Platform access after credits', value: '€2 / month' },
  { label: 'Usage-based model costs', value: 'Only what you send' },
];

const billingNotes = [
  {
    icon: WalletCards,
    title: 'Start free',
    description: 'New accounts begin with €2 in credits, so students can try real usage before committing.',
  },
  {
    icon: Receipt,
    title: 'Pay one combined bill',
    description: 'Platform fee and model usage stay in one monthly charge instead of scattered subscriptions.',
  },
  {
    icon: CreditCard,
    title: 'See the math',
    description: 'Per-message cost stays visible in-product so trust comes from clarity, not surprise invoices.',
  },
];

const LandingPricingSection: React.FC = () => (
  <section id="pricing" className="px-4 py-20 sm:px-6 lg:px-8 lg:py-28">
    <div className="mx-auto max-w-7xl">
      <div className="max-w-3xl">
        <div className="landing-eyebrow">Pricing with receipts, not mystery</div>
        <h2 className="mt-5 font-display text-4xl font-bold tracking-tight text-[var(--text-primary)] sm:text-5xl">
          Stop stacking subscriptions for AI you barely touch.
        </h2>
        <p className="mt-5 text-base leading-8 text-[var(--text-secondary)] sm:text-lg">
          Own AI is built around exam weeks, deadlines, and project sprints. Some months you need AI constantly. Other
          months you do not. The pricing should respect that.
        </p>
      </div>

      <div className="mt-12 grid gap-6 lg:grid-cols-[minmax(0,0.92fr)_minmax(0,1.08fr)]">
        <div className="landing-pricing-card border-red-500/15 bg-red-500/[0.04]">
          <div className="flex items-center justify-between gap-3">
            <div>
              <p className="text-xs uppercase tracking-[0.28em] text-red-400">The old way</p>
              <h3 className="mt-2 text-2xl font-semibold tracking-tight text-[var(--text-primary)]">Three subscriptions, one expensive habit</h3>
            </div>
            <div className="rounded-full border border-red-500/20 bg-red-500/10 px-3 py-1 text-xs font-medium text-red-400">
              Static monthly cost
            </div>
          </div>

          <div className="mt-8 space-y-4">
            {legacyCosts.map((item) => (
              <div key={item.label} className="flex items-center justify-between rounded-2xl border border-red-500/10 bg-black/10 px-4 py-4">
                <span className="text-sm text-[var(--text-secondary)]">{item.label}</span>
                <span className="font-medium text-[var(--text-primary)]">{item.value}</span>
              </div>
            ))}
          </div>

          <div className="mt-8 flex items-end justify-between border-t border-red-500/12 pt-6">
            <div>
              <div className="text-sm text-[var(--text-secondary)]">Total before usage</div>
              <div className="mt-1 text-xs uppercase tracking-[0.22em] text-red-400">Pay whether you use them or not</div>
            </div>
            <div className="text-4xl font-display font-bold tracking-tight text-red-400">$60+</div>
          </div>
        </div>

        <div className="landing-pricing-card border-[rgba(99,102,241,0.22)] bg-[linear-gradient(180deg,rgba(99,102,241,0.08),rgba(217,70,239,0.04))]">
          <div className="flex items-center justify-between gap-3">
            <div>
              <p className="text-xs uppercase tracking-[0.28em] text-[var(--brand-indigo)]">The Own AI way</p>
              <h3 className="mt-2 text-2xl font-semibold tracking-tight text-[var(--text-primary)]">
                One workspace. Transparent usage. Real control.
              </h3>
            </div>
            <div className="rounded-full border border-[rgba(99,102,241,0.24)] bg-[rgba(99,102,241,0.12)] px-3 py-1 text-xs font-medium text-[var(--brand-indigo)]">
              Flexible by design
            </div>
          </div>

          <div className="mt-8 grid gap-4 sm:grid-cols-3">
            {ownAIBreakdown.map((item) => (
              <div key={item.label} className="rounded-[24px] border border-[var(--border-default)] bg-[var(--surface-1)] px-4 py-5 shadow-[var(--shadow-card)]">
                <div className="text-xs uppercase tracking-[0.24em] text-[var(--text-muted)]">{item.label}</div>
                <div className="mt-4 text-lg font-semibold tracking-tight text-[var(--text-primary)]">{item.value}</div>
              </div>
            ))}
          </div>

          <div className="mt-8 grid gap-4 sm:grid-cols-2">
            <div className="rounded-[26px] border border-[var(--border-default)] bg-[var(--surface-1)] p-5">
              <div className="text-xs uppercase tracking-[0.24em] text-[var(--text-muted)]">Typical student month</div>
              <div className="mt-3 text-4xl font-display font-bold tracking-tight text-[var(--text-primary)]">€4–€8</div>
              <p className="mt-3 text-sm leading-6 text-[var(--text-secondary)]">
                Light months stay cheap. Heavy months still cost less than keeping three premium subscriptions alive.
              </p>
            </div>
            <div className="rounded-[26px] border border-[var(--border-default)] bg-[var(--surface-1)] p-5">
              <div className="text-xs uppercase tracking-[0.24em] text-[var(--text-muted)]">Trust signal</div>
              <div className="mt-3 text-lg font-semibold tracking-tight text-[var(--text-primary)]">Per-message costs stay visible in the product</div>
              <p className="mt-3 text-sm leading-6 text-[var(--text-secondary)]">
                The platform should explain where money goes every time you use it, not hide the logic behind a vague plan.
              </p>
            </div>
          </div>
        </div>
      </div>

      <div className="mt-10 grid gap-4 lg:grid-cols-3">
        {billingNotes.map(({ icon: Icon, title, description }) => (
          <div key={title} className="landing-outline-card">
            <div className="surface-icon-wrap">
              <Icon className="h-4 w-4" />
            </div>
            <h3 className="mt-5 text-xl font-semibold tracking-tight text-[var(--text-primary)]">{title}</h3>
            <p className="mt-3 text-sm leading-7 text-[var(--text-secondary)]">{description}</p>
          </div>
        ))}
      </div>
    </div>
  </section>
);

export default LandingPricingSection;
