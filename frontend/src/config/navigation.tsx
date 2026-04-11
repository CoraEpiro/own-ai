import type { LucideIcon } from 'lucide-react';
import { BarChart3, Database, MessageSquare, Settings, Shield } from 'lucide-react';

export interface AppNavItem {
  label: string;
  shortLabel: string;
  path: string;
  icon: LucideIcon;
  description: string;
  adminOnly?: boolean;
}

const APP_NAV_ITEMS: AppNavItem[] = [
  {
    label: 'Chat',
    shortLabel: 'Chat',
    path: '/chat',
    icon: MessageSquare,
    description: 'Conversations and live model work.',
  },
  {
    label: 'Analytics',
    shortLabel: 'Analytics',
    path: '/dashboard',
    icon: BarChart3,
    description: 'Usage, costs, and model activity.',
  },
  {
    label: 'AI Studio',
    shortLabel: 'Studio',
    path: '/buckets',
    icon: Database,
    description: 'Knowledge, memory, and reusable context.',
  },
  {
    label: 'Settings',
    shortLabel: 'Settings',
    path: '/profile',
    icon: Settings,
    description: 'Profile, voice, and account preferences.',
  },
  {
    label: 'Admin',
    shortLabel: 'Admin',
    path: '/admin',
    icon: Shield,
    description: 'Operations, moderation, and control tools.',
    adminOnly: true,
  },
];

export const getAppNavigation = (isAdmin = false): AppNavItem[] =>
  APP_NAV_ITEMS.filter((item) => !item.adminOnly || isAdmin);

export const isNavItemActive = (pathname: string, itemPath: string): boolean => {
  if (itemPath === '/chat') return pathname === '/chat';
  return pathname === itemPath || pathname.startsWith(`${itemPath}/`);
};
