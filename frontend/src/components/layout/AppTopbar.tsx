import React from 'react';
import { Menu, Moon, Sun } from 'lucide-react';

interface AppTopbarProps {
  title: string;
  description?: string;
  actions?: React.ReactNode;
  isDark: boolean;
  onOpenSidebar: () => void;
  onToggleTheme: () => void;
  userEmail?: string | null;
}

const AppTopbar: React.FC<AppTopbarProps> = ({
  title,
  description,
  actions,
  isDark,
  onOpenSidebar,
  onToggleTheme,
  userEmail,
}) => {
  const initials = (userEmail?.[0] || 'O').toUpperCase();

  return (
    <header className="shell-topbar">
      <div className="flex min-w-0 items-center gap-3">
        <button type="button" onClick={onOpenSidebar} className="shell-icon-button lg:hidden" aria-label="Open navigation">
          <Menu className="h-5 w-5" />
        </button>
        <div className="min-w-0">
          <div className="truncate text-sm font-semibold text-[var(--text-primary)]">{title}</div>
          {description ? (
            <div className="hidden truncate text-xs text-[var(--text-secondary)] sm:block">{description}</div>
          ) : null}
        </div>
      </div>

      <div className="flex items-center gap-2 sm:gap-3">
        {actions ? <div className="hidden items-center gap-3 md:flex">{actions}</div> : null}
        <button type="button" onClick={onToggleTheme} className="shell-icon-button" aria-label="Toggle theme">
          {isDark ? <Sun className="h-4 w-4" /> : <Moon className="h-4 w-4" />}
        </button>
        <div className="flex items-center gap-2 rounded-full border border-[var(--border-default)] bg-[var(--surface-2)] px-2.5 py-1.5">
          <div className="flex h-7 w-7 items-center justify-center rounded-full bg-brand-gradient text-xs font-semibold text-white">
            {initials}
          </div>
          <div className="hidden text-left sm:block">
            <div className="max-w-[12rem] truncate text-xs font-medium text-[var(--text-primary)]">{userEmail || 'Own AI user'}</div>
            <div className="text-[10px] uppercase tracking-[0.22em] text-[var(--text-muted)]">Workspace</div>
          </div>
        </div>
      </div>
    </header>
  );
};

export default AppTopbar;
