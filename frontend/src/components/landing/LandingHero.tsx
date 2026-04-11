import React, { useState, useEffect } from 'react';
import { ArrowRight, CreditCard } from 'lucide-react';
import { Link } from 'react-router-dom';

/* ─── Provider card data ─────────────────────────────────── */
const providers = [
  {
    key: 'gpt',
    name: 'GPT-4o',
    label: 'OpenAI',
    initial: 'O',
    accent: '#10B981',
    cost: '€0.018',
    tag: 'Writing assistant',
    tagIcon: 'zap',
    prompt: 'Make my essay intro stronger and more compelling',
    response:
      'Your opening can hook readers immediately. Start with a bold claim or a counterintuitive fact, then narrow into your thesis...',
  },
  {
    key: 'claude',
    name: 'Claude Opus',
    label: 'Anthropic',
    initial: 'A',
    accent: '#F59E0B',
    cost: '€0.021',
    tag: 'Deep analysis',
    tagIcon: 'book',
    prompt: 'Help me outline my thesis on renewable energy policy',
    response:
      'I\'d structure this in three chapters: historical context (1970s–2000s), the current regulatory landscape, and a forward-looking policy framework...',
  },
  {
    key: 'gemini',
    name: 'Gemini Flash',
    label: 'Google',
    initial: 'G',
    accent: '#3B82F6',
    cost: '€0.004',
    tag: 'Web search',
    tagIcon: 'globe',
    prompt: 'Search for the latest AI research from this month',
    response:
      'Found 8 relevant papers published this week. Top result: "Scaling laws for mixture-of-experts" — proposes a new architecture that reduces inference cost by 40%...',
  },
] as const;

/* ─── Marquee data ─────────────────────────────────────────── */
const marqueeItems = [
  { model: 'GPT-4o', price: 'Input $2.50 / 1M tokens', color: '#10B981' },
  { model: 'Claude Opus', price: 'Input $15.00 / 1M tokens', color: '#F59E0B' },
  { model: 'Gemini 1.5 Flash', price: 'Input $0.075 / 1M tokens', color: '#3B82F6' },
  { model: 'GPT-4o mini', price: 'Input $0.15 / 1M tokens', color: '#10B981' },
  { model: 'Claude Haiku', price: 'Input $0.25 / 1M tokens', color: '#F59E0B' },
  { model: 'Gemini 1.5 Pro', price: 'Input $3.50 / 1M tokens', color: '#3B82F6' },
];

/* ─── Position styles for stacked cards ─────────────────────── */
const positionStyles = [
  // front (position 0)
  {
    transform: 'rotate(0deg) scale(1) translateY(0px)',
    zIndex: 30,
    opacity: 1,
  },
  // middle (position 1)
  {
    transform: 'rotate(-3deg) scale(0.93) translateY(-16px)',
    zIndex: 20,
    opacity: 0.82,
  },
  // back (position 2)
  {
    transform: 'rotate(-6deg) scale(0.86) translateY(-32px)',
    zIndex: 10,
    opacity: 0.58,
  },
];

/* ─── Animated word span ─────────────────────────────────── */
interface WordProps { text: string; delay: number; className?: string }
const W: React.FC<WordProps> = ({ text, delay, className = '' }) => (
  <span
    className={`word-reveal inline-block ${className}`}
    style={{ animationDelay: `${delay}ms` }}
  >
    {text}
  </span>
);

/* ─── Provider card ──────────────────────────────────────── */
interface CardProps {
  provider: typeof providers[number];
  position: number;
}

const ProviderCard: React.FC<CardProps> = ({ provider, position }) => {
  const style = positionStyles[position];
  const isFront = position === 0;

  return (
    <div
      className="absolute inset-0 h-full w-full"
      style={{
        transform: style.transform,
        zIndex: style.zIndex,
        opacity: style.opacity,
        transformOrigin: 'bottom center',
        transition:
          'transform 0.75s cubic-bezier(0.34, 1.56, 0.64, 1), opacity 0.55s cubic-bezier(0.16, 1, 0.3, 1)',
      }}
    >
      <div
        className="h-full w-full overflow-hidden rounded-[28px] p-5"
        style={{
          background:
            'linear-gradient(155deg, rgba(22,22,25,0.99) 0%, rgba(10,10,10,0.97) 100%)',
          border: isFront
            ? `1px solid ${provider.accent}30`
            : '1px solid rgba(255,255,255,0.08)',
          boxShadow: isFront
            ? `0 32px 80px rgba(0,0,0,0.55), 0 0 0 1px rgba(255,255,255,0.05), 0 0 40px ${provider.accent}0A`
            : '0 16px 40px rgba(0,0,0,0.4)',
        }}
      >
        {/* Header */}
        <div className="flex items-center justify-between">
          <div className="flex items-center gap-2.5">
            <span
              className="flex h-7 w-7 items-center justify-center rounded-full text-[11px] font-bold text-white"
              style={{
                background: `${provider.accent}18`,
                border: `1px solid ${provider.accent}35`,
              }}
            >
              {provider.initial}
            </span>
            <div>
              <div className="text-[13px] font-semibold tracking-tight text-white">
                {provider.name}
              </div>
              <div className="text-[10px] uppercase tracking-[0.18em] text-white/38">
                {provider.label}
              </div>
            </div>
          </div>
          <div
            className="flex items-center gap-1.5 rounded-full px-2.5 py-1 text-[10px] font-semibold uppercase tracking-[0.12em]"
            style={{ background: `${provider.accent}14`, color: provider.accent }}
          >
            <span
              className="h-1.5 w-1.5 rounded-full animate-pulse-dot"
              style={{ background: provider.accent }}
            />
            Live
          </div>
        </div>

        {/* Chat preview */}
        <div className="mt-4 space-y-2.5">
          {/* User bubble */}
          <div className="flex justify-end">
            <div
              className="max-w-[82%] rounded-2xl rounded-tr-sm px-3 py-2 text-[11px] leading-relaxed text-white/70"
              style={{ background: 'rgba(255,255,255,0.07)' }}
            >
              {provider.prompt}
            </div>
          </div>

          {/* AI response */}
          <div className="flex gap-2">
            <div
              className="mt-0.5 h-5 w-5 shrink-0 flex items-center justify-center rounded-full text-[9px] font-bold text-white"
              style={{
                background: `${provider.accent}22`,
                border: `1px solid ${provider.accent}35`,
              }}
            >
              {provider.initial}
            </div>
            <div
              className="rounded-2xl rounded-tl-sm px-3 py-2 text-[11px] leading-relaxed"
              style={{
                background: `${provider.accent}10`,
                border: `1px solid ${provider.accent}20`,
                color: 'rgba(255,255,255,0.72)',
              }}
            >
              {provider.response}
            </div>
          </div>
        </div>

        <div className="my-4 h-px bg-white/[0.06]" />

        {/* Cost row */}
        <div className="flex items-center justify-between">
          <div>
            <div className="text-[10px] uppercase tracking-[0.18em] text-white/30">
              Message cost
            </div>
            <div className="mt-0.5 font-mono text-[1.5rem] font-semibold leading-none tracking-tight text-white">
              {provider.cost}
            </div>
          </div>
          <div
            className="rounded-xl px-3 py-1.5 text-[10px] font-semibold uppercase tracking-[0.12em]"
            style={{
              background: `${provider.accent}16`,
              border: `1px solid ${provider.accent}28`,
              color: provider.accent,
            }}
          >
            {provider.label}
          </div>
        </div>

        {/* Accent bar */}
        <div className="mt-3.5 h-[3px] overflow-hidden rounded-full bg-white/[0.05]">
          <div
            className="h-full w-3/5 rounded-full"
            style={{
              background: `linear-gradient(90deg, ${provider.accent}80, ${provider.accent}20)`,
            }}
          />
        </div>
      </div>
    </div>
  );
};

/* ─── Hero ───────────────────────────────────────────────── */
const LandingHero: React.FC = () => {
  const [activeIdx, setActiveIdx] = useState(0);

  useEffect(() => {
    const id = setInterval(() => setActiveIdx((i) => (i + 1) % providers.length), 3800);
    return () => clearInterval(id);
  }, []);

  const getPosition = (cardIdx: number) =>
    (cardIdx - activeIdx + providers.length) % providers.length;

  const featureChips = [
    { label: 'GPT · Claude · Gemini', color: '#10B981' },
    { label: 'Pay per message', color: '#F59E0B' },
    { label: 'Memory & voice', color: '#3B82F6' },
    { label: 'Web search built in', color: '#10B981' },
    { label: 'No subscription', color: '#F59E0B' },
  ];

  return (
    <section className="relative flex min-h-[95dvh] flex-col overflow-hidden px-4 pb-0 pt-24 sm:px-6 lg:px-8 lg:pt-28">
      <div className="mx-auto grid w-full max-w-7xl flex-1 items-center gap-10 pb-12 lg:grid-cols-[minmax(0,1.15fr)_minmax(340px,0.85fr)] lg:pb-0">

        {/* ── Left column ── */}
        <div className="relative z-10 flex flex-col">
          <div className="landing-eyebrow">
            OpenAI · Claude · Gemini · Usage-based pricing
          </div>

          {/* Staggered headline */}
          <h1
            className="mt-7 font-display font-extrabold leading-[0.92] tracking-[-0.055em] text-[var(--text-primary)]"
            style={{ fontSize: 'clamp(3.25rem, 7.5vw, 6.25rem)' }}
          >
            <W text="All" delay={60} />
            {' '}
            <W text="the" delay={140} />
            {' '}
            <W text="AI." delay={220} />
            <br />
            <W text="None" delay={340} />
            {' '}
            <W text="of" delay={410} />
            {' '}
            <W text="the" delay={480} />
            <br />
            <W text="waste." delay={560} />
          </h1>

          <p
            className="word-reveal mt-7 max-w-[440px] text-[1.0625rem] leading-[1.75] text-[var(--text-secondary)]"
            style={{ animationDelay: '700ms' }}
          >
            One workspace for GPT, Claude, and Gemini. Pay only for the tokens
            you actually send — not a flat subscription you barely use.
          </p>

          {/* CTA row */}
          <div className="mt-8 flex flex-wrap items-center gap-3">
            <Link to="/auth" className="btn-primary px-7 py-3.5 text-[0.9375rem]">
              Start free
              <ArrowRight className="h-4 w-4" />
            </Link>
            <div className="flex items-center gap-2 rounded-full border border-[var(--border-default)] px-4 py-3 text-sm font-medium text-[var(--text-muted)]">
              <CreditCard className="h-3.5 w-3.5" />
              €2 credit · no card required
            </div>
          </div>

          {/* Feature chips — scannable, not a text wall */}
          <div className="mt-9 flex flex-wrap gap-2">
            {featureChips.map(({ label, color }, i) => (
              <span
                key={label}
                className="word-reveal inline-flex items-center gap-1.5 rounded-full px-3.5 py-1.5 text-[0.8125rem] font-medium"
                style={{
                  animationDelay: `${820 + i * 60}ms`,
                  background: `${color}0D`,
                  border: `1px solid ${color}28`,
                  color: 'var(--text-secondary)',
                }}
              >
                <span
                  className="h-1.5 w-1.5 shrink-0 rounded-full"
                  style={{ background: color }}
                />
                {label}
              </span>
            ))}
          </div>
        </div>

        {/* ── Right column — animated stacked provider cards ── */}
        <div className="relative z-10 flex flex-col items-center gap-6 lg:items-end">
          {/* Card stack */}
          <div
            className="relative w-full"
            style={{ maxWidth: '360px', height: '400px' }}
          >
            {providers.map((provider, cardIdx) => (
              <ProviderCard
                key={provider.key}
                provider={provider}
                position={getPosition(cardIdx)}
              />
            ))}
          </div>

          {/* Indicator dots + label */}
          <div className="flex flex-col items-center gap-2">
            <div className="flex items-center gap-2">
              {providers.map((provider, i) => (
                <button
                  key={provider.key}
                  onClick={() => setActiveIdx(i)}
                  className="rounded-full transition-all duration-300"
                  style={{
                    width: activeIdx === i ? '24px' : '7px',
                    height: '7px',
                    background:
                      activeIdx === i ? providers[i].accent : 'var(--border-strong)',
                  }}
                  aria-label={`Show ${provider.name}`}
                />
              ))}
            </div>
            <span className="text-[10px] uppercase tracking-[0.18em] text-[var(--text-muted)]">
              {providers[activeIdx].name} · {providers[activeIdx].label}
            </span>
          </div>
        </div>
      </div>

      {/* ── Marquee ticker — spans full bleed ── */}
      <div className="relative z-10 mx-[-1rem] overflow-hidden border-t border-[var(--border-subtle)] sm:mx-[-1.5rem] lg:mx-[-2rem]">
        <div className="marquee-track py-0">
          {[...marqueeItems, ...marqueeItems].map((item, i) => (
            <div
              key={i}
              className="flex shrink-0 items-center gap-2.5 px-6 py-3"
            >
              <span
                className="font-mono text-[0.6875rem] font-semibold tracking-wide"
                style={{ color: item.color }}
              >
                {item.model}
              </span>
              <span className="text-[0.6875rem] text-[var(--text-muted)]">{item.price}</span>
              <span className="text-[var(--border-strong)] select-none">·</span>
            </div>
          ))}
        </div>
      </div>
    </section>
  );
};

export default LandingHero;
