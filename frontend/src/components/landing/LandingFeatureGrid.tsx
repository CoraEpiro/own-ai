import React from 'react';
import type { LucideIcon } from 'lucide-react';
import { BookOpen, BrainCircuit, Database, Globe2, Mic, ShieldCheck } from 'lucide-react';

interface FeatureCard {
  title: string;
  description: string;
  eyebrow: string;
  icon: LucideIcon;
  className: string;
}

const features: FeatureCard[] = [
  {
    title: 'Every major model in one workspace',
    description: 'Switch between OpenAI, Claude, and Gemini without leaving the same interface, memory layer, or billing system.',
    eyebrow: 'Model convergence',
    icon: BrainCircuit,
    className: 'md:col-span-3',
  },
  {
    title: 'Voice mode for lectures, notes, and fast iteration',
    description: 'Talk through ideas, ask for recaps, and use AI like a collaborator instead of a static text box.',
    eyebrow: 'Spoken workflows',
    icon: Mic,
    className: 'md:col-span-3',
  },
  {
    title: 'Knowledge buckets and reusable memory',
    description: 'Save context once, then bring it into future chats when you need the same project brain again.',
    eyebrow: 'Persistent context',
    icon: Database,
    className: 'md:col-span-2',
  },
  {
    title: 'Live web-backed answers',
    description: 'Use search when current information matters and keep your research inside the same product flow.',
    eyebrow: 'Reality check',
    icon: Globe2,
    className: 'md:col-span-2',
  },
  {
    title: 'Built for studying, projects, and deep work',
    description: 'From PDF digestion to structured plans, the product leans toward real student workflows rather than AI novelty.',
    eyebrow: 'Usefulness first',
    icon: BookOpen,
    className: 'md:col-span-2',
  },
  {
    title: 'Trust through visible cost and clear control',
    description: 'Provider choice, pricing visibility, and cross-device continuity make the product feel owned instead of rented.',
    eyebrow: 'Control surface',
    icon: ShieldCheck,
    className: 'md:col-span-6',
  },
];

const LandingFeatureGrid: React.FC = () => (
  <section id="features" className="px-4 py-20 sm:px-6 lg:px-8 lg:py-28">
    <div className="mx-auto max-w-7xl">
      <div className="max-w-3xl">
        <div className="landing-eyebrow">Feature system</div>
        <h2 className="mt-5 font-display text-4xl font-bold tracking-tight text-[var(--text-primary)] sm:text-5xl">
          One premium surface for the capabilities people normally piece together.
        </h2>
        <p className="mt-5 text-base leading-8 text-[var(--text-secondary)] sm:text-lg">
          The goal is not to look like another AI wrapper. The goal is to feel like a polished operating layer for how
          modern users actually work with multiple models.
        </p>
      </div>

      <div className="mt-12 grid gap-4 md:grid-cols-6">
        {features.map(({ icon: Icon, title, description, eyebrow, className }) => (
          <article key={title} className={`landing-feature-card ${className}`}>
            <div className="surface-icon-wrap">
              <Icon className="h-4 w-4" />
            </div>
            <div className="mt-6 text-xs uppercase tracking-[0.24em] text-[var(--text-muted)]">{eyebrow}</div>
            <h3 className="mt-3 text-2xl font-semibold tracking-tight text-[var(--text-primary)]">{title}</h3>
            <p className="mt-4 max-w-2xl text-sm leading-7 text-[var(--text-secondary)]">{description}</p>
          </article>
        ))}
      </div>
    </div>
  </section>
);

export default LandingFeatureGrid;
