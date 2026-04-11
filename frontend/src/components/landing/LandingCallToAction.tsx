import React from 'react';
import { ArrowRight, Sparkles } from 'lucide-react';
import { Link } from 'react-router-dom';

const LandingCallToAction: React.FC = () => (
  <section className="px-4 pb-16 pt-8 sm:px-6 lg:px-8 lg:pb-24">
    <div className="mx-auto max-w-7xl">
      <div className="relative overflow-hidden rounded-[36px] border border-[rgba(99,102,241,0.2)] bg-[linear-gradient(135deg,rgba(99,102,241,0.14),rgba(217,70,239,0.08))] px-6 py-10 shadow-[var(--shadow-elevated)] sm:px-10 lg:px-14 lg:py-14">
        <div className="landing-orb landing-orb-mini landing-orb-mini-left" />
        <div className="landing-orb landing-orb-mini landing-orb-mini-right" />

        <div className="relative z-10 flex flex-col gap-8 lg:flex-row lg:items-end lg:justify-between">
          <div className="max-w-3xl">
            <div className="landing-eyebrow bg-white/40 text-[var(--text-primary)] dark:bg-white/8 dark:text-white/80">
              <Sparkles className="h-4 w-4" />
              Ready to make the frontend feel like the actual product
            </div>
            <h2 className="mt-5 font-display text-4xl font-bold tracking-tight text-[var(--text-primary)] sm:text-5xl">
              Start with real credits, real models, and a surface designed to scale.
            </h2>
            <p className="mt-5 text-base leading-8 text-[var(--text-secondary)] sm:text-lg">
              The public flow should already communicate trust, pricing logic, and cross-platform intent. From here the
              deeper app screens can inherit the same quality bar instead of compensating for a weak first impression.
            </p>
          </div>

          <div className="flex flex-col gap-3 sm:flex-row">
            <Link to="/auth" className="btn-gradient justify-center px-7 py-3.5 text-sm sm:text-base">
              Create account
              <ArrowRight className="h-4 w-4" />
            </Link>
            <a href="#features" className="landing-secondary-button">
              Explore capabilities
            </a>
          </div>
        </div>
      </div>
    </div>
  </section>
);

export default LandingCallToAction;
