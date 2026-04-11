import React from 'react';
import { Link } from 'react-router-dom';
import LandingCallToAction from '../components/landing/LandingCallToAction';
import LandingFeatureGrid from '../components/landing/LandingFeatureGrid';
import LandingFooter from '../components/landing/LandingFooter';
import LandingHero from '../components/landing/LandingHero';
import LandingPlatformSection from '../components/landing/LandingPlatformSection';
import LandingPricingSection from '../components/landing/LandingPricingSection';
import OwnAILogo from '../components/brand/OwnAILogo';
import useThemePreference from '../hooks/useThemePreference';

const navItems = [
  { label: 'Features', href: '#features' },
  { label: 'Pricing', href: '#pricing' },
  { label: 'Platforms', href: '#platforms' },
];

const LandingPage: React.FC = () => {
  const { isDark, toggleTheme } = useThemePreference();

  return (
    <div className="landing-shell relative min-h-screen overflow-hidden">
      {/* Grain texture — fixed overlay, z-index above everything */}
      <div className="grain-overlay" />

      {/* Navbar */}
      <header className="fixed inset-x-0 top-0 z-50 border-b border-[var(--border-subtle)]"
        style={{ background: isDark ? 'rgba(12,12,11,0.82)' : 'rgba(250,250,248,0.82)', backdropFilter: 'blur(20px)', WebkitBackdropFilter: 'blur(20px)' }}
      >
        <div className="mx-auto flex max-w-7xl items-center justify-between gap-4 px-4 py-4 sm:px-6 lg:px-8">
          <OwnAILogo size={28} />

          <nav className="hidden items-center gap-7 md:flex">
            {navItems.map((item) => (
              <a
                key={item.label}
                href={item.href}
                className="text-[0.8125rem] font-medium tracking-wide text-[var(--text-secondary)] transition-colors hover:text-[var(--text-primary)]"
              >
                {item.label}
              </a>
            ))}
          </nav>

          <div className="flex items-center gap-2 sm:gap-3">
            <button
              type="button"
              onClick={toggleTheme}
              className="flex h-9 w-9 items-center justify-center rounded-full border border-[var(--border-default)] text-[var(--text-muted)] transition-colors hover:text-[var(--text-primary)]"
              aria-label="Toggle theme"
            >
              <svg className="h-4 w-4" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={1.75}>
                {isDark
                  ? <path strokeLinecap="round" strokeLinejoin="round" d="M12 3v1m0 16v1m9-9h-1M4 12H3m15.364-6.364l-.707.707M6.343 17.657l-.707.707M17.657 17.657l-.707-.707M6.343 6.343l-.707-.707M12 7a5 5 0 000 10A5 5 0 0012 7z" />
                  : <path strokeLinecap="round" strokeLinejoin="round" d="M20.354 15.354A9 9 0 018.646 3.646 9.003 9.003 0 0012 21a9.003 9.003 0 008.354-5.646z" />
                }
              </svg>
            </button>
            <Link
              to="/auth"
              className="hidden text-[0.8125rem] font-medium text-[var(--text-secondary)] transition-colors hover:text-[var(--text-primary)] sm:inline-flex"
            >
              Log in
            </Link>
            <Link to="/auth" className="btn-primary px-5 py-2 text-[0.8125rem]">
              Get started
            </Link>
          </div>
        </div>
      </header>

      <main>
        <LandingHero />
        <LandingPricingSection />
        <LandingFeatureGrid />
        <LandingPlatformSection />
        <LandingCallToAction />
      </main>

      <LandingFooter />
    </div>
  );
};

export default LandingPage;
