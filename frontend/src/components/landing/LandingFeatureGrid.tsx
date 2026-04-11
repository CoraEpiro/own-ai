import React from 'react';
import type { LucideIcon } from 'lucide-react';
import { BookOpen, BrainCircuit, Database, Globe2, Mic, ShieldCheck } from 'lucide-react';

interface FeatureCard {
  title: string;
  description: string;
  eyebrow: string;
  icon: LucideIcon;
  colSpan: string;
  iconColor?: string;
}

const features: FeatureCard[] = [
  {
    title: 'Every major model in one workspace',
    description:
      'Switch between OpenAI, Claude, and Gemini without leaving the same interface, memory layer, or billing system. The model changes — your context does not.',
    eyebrow: 'Model convergence',
    icon: BrainCircuit,
    colSpan: 'md:col-span-4',
    iconColor: '#10B981',
  },
  {
    title: 'Voice mode',
    description:
      'Talk through ideas, get recaps, and use AI like a live collaborator instead of a static text box.',
    eyebrow: 'Spoken workflows',
    icon: Mic,
    colSpan: 'md:col-span-2',
    iconColor: '#F59E0B',
  },
  {
    title: 'Knowledge buckets',
    description:
      'Save project context once, then bring it into future chats when you need the same project brain again.',
    eyebrow: 'Persistent context',
    icon: Database,
    colSpan: 'md:col-span-2',
  },
  {
    title: 'Live web-backed answers with source transparency',
    description:
      'Use search when current information matters. Keep your research inside the same product flow — not bouncing between tabs.',
    eyebrow: 'Reality check',
    icon: Globe2,
    colSpan: 'md:col-span-4',
    iconColor: '#3B82F6',
  },
  {
    title: 'Built for studying and deep work',
    description:
      'From PDF digestion to structured revision plans, the product leans toward real student workflows over AI novelty.',
    eyebrow: 'Usefulness first',
    icon: BookOpen,
    colSpan: 'md:col-span-3',
  },
  {
    title: 'Visible cost and clear control',
    description:
      'Provider choice, pricing visibility, and cross-device continuity make the product feel owned instead of rented.',
    eyebrow: 'Control surface',
    icon: ShieldCheck,
    colSpan: 'md:col-span-3',
  },
];

const LandingFeatureGrid: React.FC = () => (
  <section
    id="features"
    className="px-4 py-20 sm:px-6 lg:px-8 lg:py-28"
    style={{ background: 'var(--surface-1)' }}
  >
    <div className="mx-auto max-w-7xl">
      <div className="max-w-2xl">
        <div className="landing-eyebrow">What's inside</div>
        <h2 className="mt-5 font-display text-4xl font-bold tracking-[-0.03em] text-[var(--text-primary)] sm:text-5xl">
          One surface for the capabilities people normally piece together.
        </h2>
        <p className="mt-4 text-base leading-8 text-[var(--text-secondary)]">
          Not another AI wrapper. A polished operating layer for how modern students actually work.
        </p>
      </div>

      <div className="mt-12 grid gap-3 md:grid-cols-6">
        {features.map(({ icon: Icon, title, description, eyebrow, colSpan, iconColor }) => (
          <article
            key={title}
            className={`group relative overflow-hidden rounded-[20px] border border-[var(--border-default)] bg-[var(--bg-base)] p-6 transition-shadow hover:shadow-[var(--shadow-elevated)] ${colSpan}`}
          >
            <div
              className="flex h-9 w-9 items-center justify-center rounded-xl"
              style={{
                background: iconColor ? `${iconColor}14` : 'var(--surface-2)',
                border: iconColor ? `1px solid ${iconColor}28` : '1px solid var(--border-default)',
              }}
            >
              <Icon
                className="h-4 w-4"
                style={{ color: iconColor ?? 'var(--text-secondary)' }}
              />
            </div>
            <div className="mt-5 text-[0.6875rem] font-semibold uppercase tracking-[0.2em] text-[var(--text-muted)]">
              {eyebrow}
            </div>
            <h3 className="mt-2.5 text-[1.0625rem] font-semibold tracking-tight text-[var(--text-primary)]">
              {title}
            </h3>
            <p className="mt-3 text-sm leading-7 text-[var(--text-secondary)]">{description}</p>
          </article>
        ))}
      </div>
    </div>
  </section>
);

export default LandingFeatureGrid;
