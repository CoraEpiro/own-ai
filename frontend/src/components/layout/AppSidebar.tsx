import React from 'react';
import { Link, useLocation } from 'react-router-dom';
import { LogOut, Moon, Plus, Sparkles, Sun, X } from 'lucide-react';
import { AppNavItem, isNavItemActive } from '../../config/navigation';

interface AppSidebarProps {
  items: AppNavItem[];
  isDark: boolean;
  onToggleTheme: () => void;
  onLogout: () => void;
  onClose?: () => void;
  userEmail?: string | null;
  mobile?: boolean;
}

const AppSidebar: React.FC<AppSidebarProps> = ({
  items,
  isDark,
  onToggleTheme,
  onLogout,
  onClose,
  userEmail,
  mobile = false,
}) => {
  const location = useLocation();
  const userName = userEmail?.split('@')[0]?.replace(/[._-]+/g, ' ') || 'Own AI user';
  const initials = userName.trim().charAt(0).toUpperCase() || 'O';

  return (
    <aside
      className={[
        'shell-sidebar',
        mobile ? 'fixed inset-y-0 left-0 z-50 flex w-72 max-w-[88vw] animate-slide-left lg:hidden' : 'hidden lg:flex',
      ].join(' ')}
    >
      <div className="flex items-start justify-between gap-3 px-1">
        <div className="flex items-center gap-3">
          <div className="flex h-11 w-11 items-center justify-center rounded-2xl bg-brand-gradient shadow-glow-sm">
            <Sparkles className="h-5 w-5 text-white" />
          </div>
          <div>
            <div className="font-display text-lg font-bold tracking-tight text-gradient">Own AI</div>
            <p className="shell-sidebar-meta text-[11px] uppercase tracking-[0.28em]">Unified workspace</p>
          </div>
        </div>
        {mobile ? (
          <button type="button" onClick={onClose} className="shell-icon-button h-10 w-10 lg:hidden" aria-label="Close navigation">
            <X className="h-4 w-4" />
          </button>
        ) : null}
      </div>

      <Link to="/chat" onClick={onClose} className="btn-gradient mt-8 w-full justify-center">
        <Plus className="h-4 w-4" />
        New Chat
      </Link>

      <div className="mt-8 flex-1 overflow-y-auto scrollbar-thin">
        <div className="shell-sidebar-section-title mb-3 px-2 text-[11px] font-semibold uppercase tracking-[0.22em]">
          Workspace
        </div>
        <nav className="space-y-1.5">
          {items.map((item) => {
            const Icon = item.icon;
            const active = isNavItemActive(location.pathname, item.path);

            return (
              <Link
                key={item.path}
                to={item.path}
                onClick={onClose}
                className={`nav-link ${active ? 'nav-link-active' : ''}`}
              >
                <Icon className="h-4 w-4" />
                <div className="min-w-0 flex-1">
                  <div className="truncate text-sm font-medium">{item.label}</div>
                  <div className="shell-sidebar-meta truncate text-[11px]">{item.description}</div>
                </div>
              </Link>
            );
          })}
        </nav>
      </div>

      <div className="mt-6 border-t border-[var(--border-subtle)] pt-5">
        <div className="mb-4 flex items-center gap-3 rounded-2xl border border-[var(--border-default)] bg-[var(--surface-1)] px-3 py-3 shadow-[var(--shadow-card)]">
          <div className="flex h-10 w-10 items-center justify-center rounded-full bg-brand-gradient text-sm font-semibold text-white">
            {initials}
          </div>
          <div className="min-w-0">
            <div className="truncate text-sm font-semibold text-[var(--text-primary)]">{userName}</div>
            <div className="shell-sidebar-meta truncate text-[11px]">{userEmail || 'Workspace member'}</div>
          </div>
        </div>
        <div className="shell-sidebar-section-title mb-3 px-2 text-[11px] font-semibold uppercase tracking-[0.22em]">
          Preferences
        </div>
        <button type="button" onClick={onToggleTheme} className="nav-link w-full">
          {isDark ? <Sun className="h-4 w-4" /> : <Moon className="h-4 w-4" />}
          <div className="min-w-0 flex-1 text-left">
            <div className="text-sm font-medium">{isDark ? 'Light theme' : 'Dark theme'}</div>
            <div className="shell-sidebar-meta text-[11px]">Switch the workspace appearance.</div>
          </div>
        </button>

        <button type="button" onClick={onLogout} className="nav-link mt-1.5 w-full">
          <LogOut className="h-4 w-4" />
          <div className="min-w-0 flex-1 text-left">
            <div className="text-sm font-medium">Log out</div>
            <div className="shell-sidebar-meta truncate text-[11px]">{userName}</div>
          </div>
        </button>
      </div>
    </aside>
  );
};

export default AppSidebar;
