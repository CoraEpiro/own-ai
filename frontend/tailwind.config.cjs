module.exports = {
  content: [
    './index.html',
    './src/**/*.{js,ts,jsx,tsx}'
  ],
  darkMode: 'class',
  theme: {
    extend: {
      fontFamily: {
        display: ['Sora', 'sans-serif'],
        sans: ['Inter', 'sans-serif'],
        mono: ['JetBrains Mono', 'monospace'],
      },
      colors: {
        // ── Brand gradient stops ──────────────────────────────────────
        brand: {
          indigo: '#6366F1',
          violet: '#8B5CF6',
          fuchsia: '#D946EF',
        },
        // ── Dark mode surfaces (zinc neutral — no purple tint) ────────
        dark: {
          base:    '#0A0A0A',
          surface1:'#111113',
          surface2:'#18181B',
          surface3:'#27272A',
        },
        // ── Light mode surfaces ───────────────────────────────────────
        light: {
          base:    '#FFFFFF',
          surface1:'#FAFAFA',
          surface2:'#F4F4F5',
          surface3:'#E4E4E7',
        },
        // ── Provider accents ─────────────────────────────────────────
        provider: {
          openai:    '#10B981',
          anthropic: '#F59E0B',
          google:    '#3B82F6',
          auto:      '#8B5CF6',
        },
      },
      backgroundImage: {
        'brand-gradient': 'linear-gradient(135deg, #6366F1 0%, #8B5CF6 50%, #D946EF 100%)',
        'brand-gradient-subtle': 'linear-gradient(135deg, rgba(99,102,241,0.15) 0%, rgba(217,70,239,0.15) 100%)',
      },
      boxShadow: {
        'glow-sm':  '0 0 12px rgba(99,102,241,0.3)',
        'glow':     '0 0 24px rgba(99,102,241,0.4), 0 0 48px rgba(139,92,246,0.2)',
        'glow-lg':  '0 0 40px rgba(99,102,241,0.5), 0 0 80px rgba(139,92,246,0.25)',
        'card-dark':'0 4px 16px rgba(0,0,0,0.4), 0 0 0 1px rgba(255,255,255,0.06)',
        'card-light':'0 4px 16px rgba(0,0,0,0.08), 0 0 0 1px rgba(0,0,0,0.06)',
        'elevated-dark':'0 8px 32px rgba(0,0,0,0.6), 0 0 0 1px rgba(255,255,255,0.08)',
      },
      animation: {
        // ── Existing ──────────────────────────────────────────────────
        'fade-in':    'fadeIn 0.25s ease-out',
        'slide-up':   'slideUp 0.25s ease-out',
        // ── New ───────────────────────────────────────────────────────
        'msg-in':     'msgIn 0.28s cubic-bezier(0.34,1.56,0.64,1)',
        'scale-in':   'scaleIn 0.2s cubic-bezier(0.34,1.56,0.64,1)',
        'modal-in':   'modalIn 0.3s cubic-bezier(0.34,1.56,0.64,1)',
        'slide-left': 'slideLeft 0.3s cubic-bezier(0.34,1.56,0.64,1)',
        'shimmer':    'shimmer 1.4s ease-in-out infinite',
        'drift-1':    'drift1 28s ease-in-out infinite',
        'drift-2':    'drift2 34s ease-in-out infinite',
        'drift-3':    'drift3 22s ease-in-out infinite',
        'float':      'float 4.5s ease-in-out infinite',
        'pulse-glow': 'pulseGlow 3s ease-in-out infinite',
        'bounce-dot': 'bounceDot 1.2s ease-in-out infinite',
        'gradient-x': 'gradientX 3s ease infinite',
        'spin-slow':  'spin 3s linear infinite',
      },
      keyframes: {
        fadeIn: {
          '0%':   { opacity: '0' },
          '100%': { opacity: '1' },
        },
        slideUp: {
          '0%':   { transform: 'translateY(8px)', opacity: '0' },
          '100%': { transform: 'translateY(0)',   opacity: '1' },
        },
        msgIn: {
          '0%':   { transform: 'translateY(14px) scale(0.97)', opacity: '0' },
          '100%': { transform: 'translateY(0)    scale(1)',    opacity: '1' },
        },
        scaleIn: {
          '0%':   { transform: 'scale(0.8)',  opacity: '0' },
          '100%': { transform: 'scale(1)',    opacity: '1' },
        },
        modalIn: {
          '0%':   { transform: 'scale(0.93) translateY(10px)', opacity: '0' },
          '100%': { transform: 'scale(1)    translateY(0)',     opacity: '1' },
        },
        slideLeft: {
          '0%':   { transform: 'translateX(-10px)', opacity: '0' },
          '100%': { transform: 'translateX(0)',      opacity: '1' },
        },
        shimmer: {
          '0%':   { backgroundPosition: '-200% 0' },
          '100%': { backgroundPosition: '200% 0' },
        },
        drift1: {
          '0%,100%': { transform: 'translate(0,0)' },
          '50%':     { transform: 'translate(80px,-60px)' },
        },
        drift2: {
          '0%,100%': { transform: 'translate(0,0)' },
          '50%':     { transform: 'translate(-70px,50px)' },
        },
        drift3: {
          '0%,100%': { transform: 'translate(0,0)' },
          '50%':     { transform: 'translate(50px,80px)' },
        },
        float: {
          '0%,100%': { transform: 'translateY(0px)' },
          '50%':     { transform: 'translateY(-14px)' },
        },
        pulseGlow: {
          '0%,100%': { opacity: '0.4' },
          '50%':     { opacity: '0.8' },
        },
        bounceDot: {
          '0%,80%,100%': { transform: 'translateY(0)' },
          '40%':         { transform: 'translateY(-6px)' },
        },
        gradientX: {
          '0%,100%': { backgroundPosition: '0% 50%' },
          '50%':     { backgroundPosition: '100% 50%' },
        },
      },
    },
  },
  plugins: [
    require('@tailwindcss/typography'),
  ],
};
