// ═══════════════════════════════════════════════════════════════════════════
//  Provider Theme System
//  Each provider gets a completely distinct visual identity — like visiting
//  ChatGPT, Claude, or Gemini's own website.
// ═══════════════════════════════════════════════════════════════════════════

export interface ProviderTheme {
  name: string;

  // Core accent
  accent: string;
  accentHover: string;
  accentSoft: string;
  accentSoftDark: string;
  accentRing: string;

  // Sidebar
  sidebar: string;
  sidebarHover: string;
  sidebarActive: string;
  sidebarBorder: string;

  // Main area
  mainBg: string;
  mainBgDark: string;

  // Header (kept for compatibility but not visually used)
  headerBg: string;
  headerBgDark: string;
  headerBorder: string;
  headerBorderDark: string;

  // User message bubble
  userBubble: string;
  userBubbleDark: string;
  userBubbleHover: string;
  userBubbleText: string;
  userBubbleTextDark: string;
  userBubbleRadius: string;

  // Assistant area
  assistantBg: string;
  assistantBgDark: string;
  assistantBorder: string;
  assistantBorderDark: string;

  // Input
  inputBg: string;
  inputBgDark: string;
  inputBorder: string;
  inputBorderDark: string;
  inputAreaBg: string;
  inputAreaBgDark: string;

  // Welcome/empty state
  welcomeGradient: string;
  welcomeGradientDark: string;

  // AI icon character (provider-specific)
  aiIcon: string;
  aiIconColor: string;
  aiIconColorDark: string;
  aiIconBg: string;
  aiIconBgDark: string;

  // Text colors
  textPrimary: string;
  textPrimaryDark: string;
  textSecondary: string;
  textSecondaryDark: string;

  // Metadata style
  metaText: string;
  metaTextDark: string;

  // Action buttons (copy, thumbs, retry, TTS)
  actionIcon: string;
  actionIconDark: string;
  actionIconHover: string;
  actionIconHoverDark: string;

  // Disclaimer text
  disclaimer: string;

  // Input placeholder
  placeholder: string;
}

// ── ChatGPT — clean, minimal, spacious ──────────────────────────────────
const openai: ProviderTheme = {
  name: 'OpenAI',
  accent: '#10a37f',
  accentHover: '#0d8c6c',
  accentSoft: '#ecfdf5',
  accentSoftDark: 'rgba(16,163,127,0.08)',
  accentRing: 'rgba(16,163,127,0.45)',
  sidebar: '#202123',
  sidebarHover: '#2A2B32',
  sidebarActive: '#343541',
  sidebarBorder: '#4E4F60',
  mainBg: '#ffffff',
  mainBgDark: '#212121',
  headerBg: '#ffffff',
  headerBgDark: '#212121',
  headerBorder: '#e5e5e5',
  headerBorderDark: '#2f2f2f',
  userBubble: '#f4f4f4',
  userBubbleDark: '#2f2f2f',
  userBubbleHover: '#ebebeb',
  userBubbleText: '#0d0d0d',
  userBubbleTextDark: '#ececec',
  userBubbleRadius: '24px',
  assistantBg: 'transparent',
  assistantBgDark: 'transparent',
  assistantBorder: 'transparent',
  assistantBorderDark: 'transparent',
  inputBg: '#f4f4f4',
  inputBgDark: '#2f2f2f',
  inputBorder: '#e5e5e5',
  inputBorderDark: '#424242',
  inputAreaBg: '#ffffff',
  inputAreaBgDark: '#212121',
  welcomeGradient: 'linear-gradient(135deg, #ecfdf5 0%, #f0fdf4 50%, #fff 100%)',
  welcomeGradientDark: 'linear-gradient(135deg, #1a2f28 0%, #212121 100%)',
  aiIcon: '✦',
  aiIconColor: '#10a37f',
  aiIconColorDark: '#10a37f',
  aiIconBg: '#ecfdf5',
  aiIconBgDark: 'rgba(16,163,127,0.12)',
  textPrimary: '#0d0d0d',
  textPrimaryDark: '#ececec',
  textSecondary: '#6e6e80',
  textSecondaryDark: '#8e8ea0',
  metaText: '#b4b4b4',
  metaTextDark: '#555',
  actionIcon: '#b4b4b4',
  actionIconDark: '#6e6e80',
  actionIconHover: '#0d0d0d',
  actionIconHoverDark: '#ececec',
  disclaimer: 'ChatGPT can make mistakes. Check important info.',
  placeholder: 'Ask anything',
};

// ── Claude — warm cream, elegant, literary ──────────────────────────────
const anthropic: ProviderTheme = {
  name: 'Anthropic',
  accent: '#D97706',
  accentHover: '#B45309',
  accentSoft: '#FFF8ED',
  accentSoftDark: 'rgba(217,119,6,0.08)',
  accentRing: 'rgba(217,119,6,0.45)',
  sidebar: '#1C1917',
  sidebarHover: '#292524',
  sidebarActive: '#3B3733',
  sidebarBorder: '#57534E',
  mainBg: '#FAF9F7',
  mainBgDark: '#1a1816',
  headerBg: '#FAF9F7',
  headerBgDark: '#1a1816',
  headerBorder: '#E8E5E0',
  headerBorderDark: '#2C2926',
  userBubble: '#F0EDE8',
  userBubbleDark: '#2A2724',
  userBubbleHover: '#E8E4DD',
  userBubbleText: '#2D2B28',
  userBubbleTextDark: '#E7E5E0',
  userBubbleRadius: '20px',
  assistantBg: 'transparent',
  assistantBgDark: 'transparent',
  assistantBorder: 'transparent',
  assistantBorderDark: 'transparent',
  inputBg: '#F0EDE8',
  inputBgDark: '#292524',
  inputBorder: '#D6D3CE',
  inputBorderDark: '#44403C',
  inputAreaBg: '#FAF9F7',
  inputAreaBgDark: '#1a1816',
  welcomeGradient: 'linear-gradient(135deg, #FFFBEB 0%, #FEF3C7 50%, #FAF9F7 100%)',
  welcomeGradientDark: 'linear-gradient(135deg, #1C1410 0%, #1a1816 100%)',
  aiIcon: '✸',
  aiIconColor: '#C2703E',
  aiIconColorDark: '#D4956A',
  aiIconBg: '#FFF1E0',
  aiIconBgDark: 'rgba(217,119,6,0.1)',
  textPrimary: '#2D2B28',
  textPrimaryDark: '#E7E5E0',
  textSecondary: '#78756E',
  textSecondaryDark: '#9C998F',
  metaText: '#B8B4AB',
  metaTextDark: '#555250',
  actionIcon: '#B8B4AB',
  actionIconDark: '#78756E',
  actionIconHover: '#2D2B28',
  actionIconHoverDark: '#E7E5E0',
  disclaimer: 'Claude is AI and can make mistakes. Please double-check responses.',
  placeholder: 'Reply...',
};

// ── Gemini — clean Material, light blue ─────────────────────────────────
const google: ProviderTheme = {
  name: 'Google',
  accent: '#4285F4',
  accentHover: '#3367D6',
  accentSoft: '#E8F0FE',
  accentSoftDark: 'rgba(66,133,244,0.08)',
  accentRing: 'rgba(66,133,244,0.45)',
  sidebar: '#131320',
  sidebarHover: '#1E1E33',
  sidebarActive: '#292945',
  sidebarBorder: '#3B3B5C',
  mainBg: '#ffffff',
  mainBgDark: '#1E1F20',
  headerBg: '#ffffff',
  headerBgDark: '#1E1F20',
  headerBorder: '#E3E3E3',
  headerBorderDark: '#353536',
  userBubble: '#E8F0FE',
  userBubbleDark: '#303134',
  userBubbleHover: '#D2E3FC',
  userBubbleText: '#1A1A2E',
  userBubbleTextDark: '#E3E3E3',
  userBubbleRadius: '22px',
  assistantBg: 'transparent',
  assistantBgDark: 'transparent',
  assistantBorder: 'transparent',
  assistantBorderDark: 'transparent',
  inputBg: '#F0F4F9',
  inputBgDark: '#2B2D30',
  inputBorder: '#DFE1E5',
  inputBorderDark: '#444746',
  inputAreaBg: '#ffffff',
  inputAreaBgDark: '#1E1F20',
  welcomeGradient: 'linear-gradient(135deg, #EEF2FF 0%, #E0E7FF 50%, #fff 100%)',
  welcomeGradientDark: 'linear-gradient(135deg, #151530 0%, #1E1F20 100%)',
  aiIcon: '◆',
  aiIconColor: '#4285F4',
  aiIconColorDark: '#8AB4F8',
  aiIconBg: '#E8F0FE',
  aiIconBgDark: 'rgba(66,133,244,0.12)',
  textPrimary: '#1F1F1F',
  textPrimaryDark: '#E3E3E3',
  textSecondary: '#5F6368',
  textSecondaryDark: '#9AA0A6',
  metaText: '#B0B0B0',
  metaTextDark: '#5F6368',
  actionIcon: '#B0B0B0',
  actionIconDark: '#9AA0A6',
  actionIconHover: '#1F1F1F',
  actionIconHoverDark: '#E3E3E3',
  disclaimer: 'Gemini can make mistakes, including about people.',
  placeholder: 'Ask Gemini',
};

// ── Auto — magical purple ───────────────────────────────────────────────
const auto: ProviderTheme = {
  name: 'Auto',
  accent: '#8B5CF6', // Purple-500
  accentHover: '#7C3AED',
  accentSoft: '#F3E8FF',
  accentSoftDark: 'rgba(139,92,246,0.08)',
  accentRing: 'rgba(139,92,246,0.45)',
  sidebar: '#18181b', // Zinc-900 (Neutral dark)
  sidebarHover: '#27272a', // Zinc-800
  sidebarActive: '#3f3f46', // Zinc-700
  sidebarBorder: '#3f3f46', // Neutral border
  mainBg: '#ffffff',
  mainBgDark: '#1E1B24', // Keep purple tint for main window
  headerBg: '#ffffff',
  headerBgDark: '#1E1B24',
  headerBorder: '#E9D5FF',
  headerBorderDark: '#3B2F4E',
  userBubble: '#F3E8FF',
  userBubbleDark: '#3B2F4E',
  userBubbleHover: '#E9D5FF',
  userBubbleText: '#1E1B24',
  userBubbleTextDark: '#E9D5FF',
  userBubbleRadius: '24px',
  assistantBg: 'transparent',
  assistantBgDark: 'transparent',
  assistantBorder: 'transparent',
  assistantBorderDark: 'transparent',
  inputBg: '#F3E8FF',
  inputBgDark: '#3B2F4E',
  inputBorder: '#D8B4FE',
  inputBorderDark: '#5B21B6',
  inputAreaBg: '#ffffff',
  inputAreaBgDark: '#1E1B24',
  welcomeGradient: 'linear-gradient(135deg, #F3E8FF 0%, #E9D5FF 50%, #fff 100%)',
  welcomeGradientDark: 'linear-gradient(135deg, #2E1065 0%, #1E1B24 100%)',
  aiIcon: '✨',
  aiIconColor: '#8B5CF6',
  aiIconColorDark: '#A78BFA',
  aiIconBg: '#F3E8FF',
  aiIconBgDark: 'rgba(139,92,246,0.12)',
  textPrimary: '#1E1B24',
  textPrimaryDark: '#E9D5FF',
  textSecondary: '#6B7280',
  textSecondaryDark: '#9CA3AF',
  metaText: '#9CA3AF',
  metaTextDark: '#6B7280',
  actionIcon: '#9CA3AF',
  actionIconDark: '#6B7280',
  actionIconHover: '#1E1B24',
  actionIconHoverDark: '#E9D5FF',
  disclaimer: 'Auto mode selects the best model for your query.',
  placeholder: 'Ask anything...',
};

export const PROVIDER_THEMES: Record<string, ProviderTheme> = {
  OpenAI: openai,
  Anthropic: anthropic,
  Google: google,
  Auto: auto,
};

export function getProviderTheme(provider: string): ProviderTheme {
  return PROVIDER_THEMES[provider] || openai;
}
