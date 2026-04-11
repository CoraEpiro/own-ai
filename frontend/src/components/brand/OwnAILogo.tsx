import React, { useId } from 'react';

interface OwnAILogoMarkProps {
  size?: number;
  className?: string;
}

export const OwnAILogoMark: React.FC<OwnAILogoMarkProps> = ({ size = 32, className = '' }) => {
  const gradientId = useId().replace(/:/g, '');

  return (
    <svg width={size} height={size} viewBox="0 0 32 32" fill="none" className={className} aria-hidden="true">
      <defs>
        <linearGradient id={gradientId} x1="0%" y1="0%" x2="100%" y2="100%">
          <stop offset="0%" stopColor="#6366F1" />
          <stop offset="50%" stopColor="#8B5CF6" />
          <stop offset="100%" stopColor="#D946EF" />
        </linearGradient>
      </defs>
      <circle cx="16" cy="16" r="14" fill={`url(#${gradientId})`} opacity="0.15" />
      <path
        d="M8 16 C8 11.6 11.6 8 16 8 C20.4 8 24 11.6 24 16"
        stroke={`url(#${gradientId})`}
        strokeWidth="2.5"
        strokeLinecap="round"
        fill="none"
      />
      <path
        d="M24 16 C24 20.4 20.4 24 16 24 C11.6 24 8 20.4 8 16"
        stroke={`url(#${gradientId})`}
        strokeWidth="2.5"
        strokeLinecap="round"
        fill="none"
        strokeDasharray="4 2"
      />
      <circle cx="16" cy="16" r="3" fill={`url(#${gradientId})`} />
    </svg>
  );
};

interface OwnAILogoProps {
  size?: number;
  className?: string;
  wordmarkClassName?: string;
  iconClassName?: string;
  tone?: 'default' | 'light' | 'gradient';
}

const toneClasses: Record<NonNullable<OwnAILogoProps['tone']>, string> = {
  default: 'text-[var(--text-primary)]',
  light: 'text-white',
  gradient: 'text-gradient',
};

const OwnAILogo: React.FC<OwnAILogoProps> = ({
  size = 32,
  className = '',
  wordmarkClassName = '',
  iconClassName = '',
  tone = 'default',
}) => (
  <div className={`flex items-center gap-3 ${className}`}>
    <OwnAILogoMark size={size} className={iconClassName} />
    <span className={`font-display text-xl font-bold tracking-tight ${toneClasses[tone]} ${wordmarkClassName}`.trim()}>
      Own AI
    </span>
  </div>
);

export default OwnAILogo;
