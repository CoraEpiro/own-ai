import React from 'react';
import { Link } from 'react-router-dom';
import OwnAILogo from '../brand/OwnAILogo';

const footerLinks = [
  { label: 'Features', href: '#features' },
  { label: 'Pricing', href: '#pricing' },
  { label: 'Platforms', href: '#platforms' },
];

const LandingFooter: React.FC = () => (
  <footer className="border-t border-[var(--border-subtle)] px-4 py-8 sm:px-6 lg:px-8">
    <div className="mx-auto flex max-w-7xl flex-col gap-6 lg:flex-row lg:items-center lg:justify-between">
      <div>
        <OwnAILogo size={30} wordmarkClassName="text-lg" />
        <p className="mt-3 max-w-lg text-sm leading-6 text-[var(--text-secondary)]">
          Premium multi-model AI access with usage-based pricing, built to feel trustworthy from the first click.
        </p>
      </div>

      <div className="flex flex-col gap-5 sm:flex-row sm:items-center">
        <div className="flex flex-wrap gap-4 text-sm text-[var(--text-secondary)]">
          {footerLinks.map((item) => (
            <a key={item.label} href={item.href} className="transition-colors hover:text-[var(--text-primary)]">
              {item.label}
            </a>
          ))}
        </div>

        <Link to="/auth" className="landing-secondary-button !px-5 !py-2.5">
          Log in / Sign up
        </Link>
      </div>
    </div>
  </footer>
);

export default LandingFooter;
