import React from 'react';
import type { LucideIcon } from 'lucide-react';
import { Apple, Globe, Monitor, Smartphone } from 'lucide-react';

interface PlatformCard {
  title: string;
  status: string;
  description: string;
  icon: LucideIcon;
  points: string[];
}

const platforms: PlatformCard[] = [
  {
    title: 'Web app',
    status: 'Live foundation',
    description: 'The primary product surface already exists on the web, where the design system and workflows are being established first.',
    icon: Globe,
    points: ['Fast shipping loop', 'Responsive from desktop to mobile', 'Best place to refine the core experience'],
  },
  {
    title: 'Desktop',
    status: 'Design-ready',
    description: 'The navigation, memory, and workspace layout are being shaped so they can translate cleanly into a desktop wrapper later.',
    icon: Monitor,
    points: ['macOS and Windows direction', 'Persistent workspace framing', 'Deeper focus-mode potential'],
  },
  {
    title: 'Mobile',
    status: 'Mobile-first planning',
    description: 'The public and auth surfaces already need to collapse elegantly, because that same discipline sets up iOS and Android later.',
    icon: Smartphone,
    points: ['Intentional small-screen hierarchy', 'Touch-ready controls', 'Good runway for a future Capacitor path'],
  },
];

const LandingPlatformSection: React.FC = () => (
  <section id="platforms" className="px-4 py-20 sm:px-6 lg:px-8 lg:py-28">
    <div className="mx-auto max-w-7xl">
      <div className="grid gap-12 lg:grid-cols-[minmax(0,0.92fr)_minmax(0,1.08fr)] lg:items-start">
        <div>
          <div className="landing-eyebrow">Multi-device foundation</div>
          <h2 className="mt-5 font-display text-4xl font-bold tracking-tight text-[var(--text-primary)] sm:text-5xl">
            Designed to feel coherent across web now and other platforms next.
          </h2>
          <p className="mt-5 text-base leading-8 text-[var(--text-secondary)] sm:text-lg">
            The design system should not trap the product inside a single viewport. Layout, memory, billing clarity, and
            navigation structure need to scale into desktop and mobile without a total redesign.
          </p>

          <div className="mt-8 rounded-[30px] border border-[var(--border-default)] bg-white dark:bg-[#1C1C1F] p-6 shadow-[var(--shadow-card)]">
            <div className="flex items-center gap-3">
              <div className="flex h-11 w-11 items-center justify-center rounded-2xl bg-brand-gradient text-white">
                <Apple className="h-4.5 w-4.5" />
              </div>
              <div>
                <div className="text-sm font-semibold text-[var(--text-primary)]">Shared product DNA</div>
                <div className="text-xs uppercase tracking-[0.22em] text-[var(--text-muted)]">One system, multiple surfaces</div>
              </div>
            </div>

            <div className="mt-6 grid gap-4 sm:grid-cols-2">
              <div className="landing-outline-card !p-4">
                <div className="text-xs uppercase tracking-[0.22em] text-[var(--text-muted)]">Carry across devices</div>
                <div className="mt-2 text-lg font-semibold tracking-tight text-[var(--text-primary)]">Identity, memory, usage clarity</div>
              </div>
              <div className="landing-outline-card !p-4">
                <div className="text-xs uppercase tracking-[0.22em] text-[var(--text-muted)]">Adapt by platform</div>
                <div className="mt-2 text-lg font-semibold tracking-tight text-[var(--text-primary)]">Navigation density and input patterns</div>
              </div>
            </div>
          </div>
        </div>

        <div className="grid gap-4">
          {platforms.map(({ title, status, description, icon: Icon, points }) => (
            <article key={title} className="landing-outline-card">
              <div className="flex flex-col gap-6 sm:flex-row sm:items-start sm:justify-between">
                <div className="flex gap-4">
                  <div className="surface-icon-wrap">
                    <Icon className="h-4 w-4" />
                  </div>
                  <div>
                    <div className="text-xs uppercase tracking-[0.24em] text-[var(--text-muted)]">{status}</div>
                    <h3 className="mt-2 text-2xl font-semibold tracking-tight text-[var(--text-primary)]">{title}</h3>
                    <p className="mt-3 max-w-xl text-sm leading-7 text-[var(--text-secondary)]">{description}</p>
                  </div>
                </div>
              </div>

              <div className="mt-6 grid gap-3 sm:grid-cols-3">
                {points.map((point) => (
                  <div key={point} className="rounded-2xl border border-[var(--border-default)] bg-[var(--surface-1)] dark:bg-[var(--surface-2)] px-4 py-3 text-sm text-[var(--text-secondary)]">
                    {point}
                  </div>
                ))}
              </div>
            </article>
          ))}
        </div>
      </div>
    </div>
  </section>
);

export default LandingPlatformSection;
