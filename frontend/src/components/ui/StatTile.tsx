import React from 'react';

interface StatTileProps {
  icon: React.ReactNode;
  label: string;
  value: string;
}

const StatTile: React.FC<StatTileProps> = ({ icon, label, value }) => (
  <div className="surface-panel-muted">
    <div className="mb-2 flex items-center gap-2 text-xs text-[var(--text-secondary)]">
      {icon}
      <span>{label}</span>
    </div>
    <div className="font-display text-2xl font-bold tracking-tight text-[var(--text-primary)]">{value}</div>
  </div>
);

export default StatTile;
