import React from 'react';
import { Moon, Sun } from 'lucide-react';
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
    <div className="landing-shell relative min-h-screen overflow-hidden bg-[var(--bg-base)] text-[var(--text-primary)]">
      <div className="landing-mesh" />

      <header className="fixed inset-x-0 top-0 z-50 border-b border-transparent bg-[rgba(255,255,255,0.7)] backdrop-blur-xl dark:bg-[rgba(10,10,10,0.65)]">
        <div className="mx-auto flex max-w-7xl items-center justify-between gap-4 px-4 py-4 sm:px-6 lg:px-8">
          <OwnAILogo size={32} />

          <nav className="hidden items-center gap-6 md:flex">
            {navItems.map((item) => (
              <a
                key={item.label}
                href={item.href}
                className="text-sm font-medium text-[var(--text-secondary)] transition-colors hover:text-[var(--text-primary)]"
              >
                {item.label}
              </a>
            ))}
          </nav>

          <div className="flex items-center gap-2 sm:gap-3">
            <button type="button" onClick={toggleTheme} className="shell-icon-button" aria-label="Toggle theme">
              {isDark ? <Sun className="h-4 w-4" /> : <Moon className="h-4 w-4" />}
            </button>
            <Link
              to="/auth"
              className="hidden rounded-full border border-[var(--border-default)] px-4 py-2 text-sm font-medium text-[var(--text-secondary)] transition-colors hover:bg-[var(--surface-2)] hover:text-[var(--text-primary)] sm:inline-flex"
            >
              Log in
            </Link>
            <Link to="/auth" className="btn-gradient px-5 py-2.5 text-sm">
              Get started free
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
