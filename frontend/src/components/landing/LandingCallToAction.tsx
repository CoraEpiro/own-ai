import React from 'react';
import { ArrowRight } from 'lucide-react';
import { Link } from 'react-router-dom';

const LandingCallToAction: React.FC = () => (
  <section className="px-4 pb-20 pt-8 sm:px-6 lg:px-8 lg:pb-28">
    <div className="mx-auto max-w-7xl">
      {/* Full-bleed dark editorial block */}
      <div
        className="relative overflow-hidden rounded-[28px] px-8 py-14 sm:px-12 lg:px-16 lg:py-20"
        style={{ background: '#0C0C0B', border: '1px solid rgba(255,255,255,0.07)' }}
      >
        {/* Subtle provider color accents — background glow dots */}
        <div className="pointer-events-none absolute left-[-4rem] top-[-4rem] h-[20rem] w-[20rem] rounded-full opacity-[0.07]"
          style={{ background: 'radial-gradient(circle, #10B981, transparent 70%)' }} />
        <div className="pointer-events-none absolute bottom-[-4rem] right-[-4rem] h-[20rem] w-[20rem] rounded-full opacity-[0.07]"
          style={{ background: 'radial-gradient(circle, #3B82F6, transparent 70%)' }} />
        <div className="pointer-events-none absolute bottom-0 left-1/2 h-[16rem] w-[16rem] -translate-x-1/2 rounded-full opacity-[0.05]"
          style={{ background: 'radial-gradient(circle, #F59E0B, transparent 70%)' }} />

        <div className="relative z-10 flex flex-col gap-10 lg:flex-row lg:items-end lg:justify-between">
          <div className="max-w-2xl">
            {/* Provider pills */}
            <div className="flex flex-wrap gap-2">
              {[
                { label: 'OpenAI', color: '#10B981' },
                { label: 'Anthropic', color: '#F59E0B' },
                { label: 'Google', color: '#3B82F6' },
              ].map(({ label, color }) => (
                <span
                  key={label}
                  className="flex items-center gap-1.5 rounded-full px-3 py-1 text-[11px] font-semibold uppercase tracking-[0.16em]"
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

            <h2
              className="mt-7 font-display font-extrabold leading-[0.94] tracking-[-0.05em] text-white"
              style={{ fontSize: 'clamp(2.5rem, 5vw, 4rem)' }}
            >
              Start using AI
              <br />
              on your terms.
            </h2>

            <p className="mt-6 max-w-xl text-[1.0625rem] leading-[1.75] text-white/58">
              Get access to GPT, Claude, and Gemini in one workspace.
              Transparent pricing, personal memory, and no wasted subscriptions.
              Start with €2 free — no card required.
            </p>
          </div>

          <div className="shrink-0">
            {/* Inverted button on dark bg — white bg, dark text */}
            <Link
              to="/auth"
              className="inline-flex items-center gap-2.5 rounded-full bg-white px-8 py-4 text-[0.9375rem] font-semibold text-[#0C0C0B] transition-opacity hover:opacity-85"
            >
              Create account
              <ArrowRight className="h-4 w-4" />
            </Link>
            <p className="mt-3 text-center text-[11px] tracking-wide text-white/35 uppercase">
              €2 free · no card · cancel anytime
            </p>
          </div>
        </div>
      </div>
    </div>
  </section>
);

export default LandingCallToAction;
