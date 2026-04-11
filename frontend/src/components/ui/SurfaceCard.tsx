import React from 'react';

interface SurfaceCardProps {
  children: React.ReactNode;
  title?: string;
  description?: string;
  icon?: React.ReactNode;
  actions?: React.ReactNode;
  className?: string;
  bodyClassName?: string;
}

const SurfaceCard: React.FC<SurfaceCardProps> = ({
  children,
  title,
  description,
  icon,
  actions,
  className = '',
  bodyClassName = '',
}) => {
  return (
    <section className={`surface-panel ${className}`.trim()}>
      {(title || description || icon || actions) ? (
        <div className="mb-5 flex items-start justify-between gap-4">
          <div className="min-w-0">
            {(title || icon) ? (
              <div className="flex items-center gap-3">
                {icon ? <div className="surface-icon-wrap">{icon}</div> : null}
                {title ? <h2 className="text-base font-semibold text-[var(--text-primary)]">{title}</h2> : null}
              </div>
            ) : null}
            {description ? (
              <p className={`mt-2 text-sm leading-6 text-[var(--text-secondary)] ${icon ? 'pl-11' : ''}`.trim()}>
                {description}
              </p>
            ) : null}
          </div>
          {actions ? <div className="flex items-center gap-2">{actions}</div> : null}
        </div>
      ) : null}
      <div className={bodyClassName}>{children}</div>
    </section>
  );
};

export default SurfaceCard;
