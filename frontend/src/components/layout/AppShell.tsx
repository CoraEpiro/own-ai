import React, { useEffect, useMemo, useState } from 'react';
import { useLocation, useNavigate } from 'react-router-dom';
import AppSidebar from './AppSidebar';
import AppTopbar from './AppTopbar';
import { getAppNavigation } from '../../config/navigation';
import { useAuth } from '../../contexts/AuthContext';
import useThemePreference from '../../hooks/useThemePreference';

type ContentWidth = 'medium' | 'wide' | 'full';

interface AppShellProps {
  children: React.ReactNode;
  title: string;
  description?: string;
  eyebrow?: string;
  actions?: React.ReactNode;
  contentWidth?: ContentWidth;
  contentClassName?: string;
}

const widthClasses: Record<ContentWidth, string> = {
  medium: 'max-w-4xl',
  wide: 'max-w-7xl',
  full: 'max-w-none',
};

const AppShell: React.FC<AppShellProps> = ({
  children,
  title,
  description,
  eyebrow,
  actions,
  contentWidth = 'wide',
  contentClassName = '',
}) => {
  const { user, logout } = useAuth();
  const location = useLocation();
  const navigate = useNavigate();
  const [mobileOpen, setMobileOpen] = useState(false);
  const { isDark, toggleTheme } = useThemePreference();

  const navItems = useMemo(() => getAppNavigation(!!user?.isAdmin), [user?.isAdmin]);

  useEffect(() => {
    setMobileOpen(false);
  }, [location.pathname]);

  const handleLogout = () => {
    logout();
    navigate('/auth');
  };

  return (
    <div className="relative min-h-screen overflow-hidden bg-[var(--bg-base)] text-[var(--text-primary)]">
      <div className="app-shell-orb app-shell-orb-indigo" />
      <div className="app-shell-orb app-shell-orb-violet" />
      <div className="app-shell-orb app-shell-orb-fuchsia" />

      <AppSidebar
        items={navItems}
        isDark={isDark}
        onToggleTheme={toggleTheme}
        onLogout={handleLogout}
        userEmail={user?.email}
      />

      {mobileOpen ? (
        <>
          <div className="fixed inset-0 z-40 bg-black/55 backdrop-blur-[2px] lg:hidden" onClick={() => setMobileOpen(false)} />
          <AppSidebar
            items={navItems}
            isDark={isDark}
            onToggleTheme={toggleTheme}
            onLogout={handleLogout}
            onClose={() => setMobileOpen(false)}
            userEmail={user?.email}
            mobile
          />
        </>
      ) : null}

      <div className="relative min-h-screen lg:pl-72">
        <AppTopbar
          title={title}
          description={description}
          actions={actions}
          isDark={isDark}
          onOpenSidebar={() => setMobileOpen(true)}
          onToggleTheme={toggleTheme}
          userEmail={user?.email}
        />

        <main className="px-4 pb-12 pt-6 sm:px-6 lg:px-8 lg:pt-8">
          <div className={`mx-auto ${widthClasses[contentWidth]}`}>
            <div className="mb-8 flex flex-col gap-4 md:flex-row md:items-end md:justify-between">
              <div className="max-w-3xl">
                {eyebrow ? (
                  <div className="mb-3 inline-flex rounded-full border border-[var(--border-default)] bg-[var(--surface-2)] px-3 py-1 text-[11px] font-semibold uppercase tracking-[0.22em] text-[var(--text-secondary)]">
                    {eyebrow}
                  </div>
                ) : null}
                <h1 className="font-display text-3xl font-bold tracking-tight text-[var(--text-primary)] sm:text-4xl">
                  {title}
                </h1>
                {description ? (
                  <p className="mt-3 max-w-2xl text-sm leading-7 text-[var(--text-secondary)] sm:text-base">
                    {description}
                  </p>
                ) : null}
              </div>
              {actions ? <div className="flex items-center gap-3 md:hidden">{actions}</div> : null}
            </div>

            <div className={contentClassName}>{children}</div>
          </div>
        </main>
      </div>
    </div>
  );
};

export default AppShell;
