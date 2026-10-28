import React from 'react';

interface SampleBadgeProps {
  size?: 'sm' | 'md';
  className?: string;
}

export const SampleBadge: React.FC<SampleBadgeProps> = ({ size = 'sm', className = '' }) => {
  const sizeClasses = size === 'sm' ? 'text-[10px] px-1.5 py-0.5' : 'text-xs px-2 py-0.5';
  return (
    <span
      className={`inline-flex items-center font-bold tracking-wider rounded uppercase bg-surface-secondary text-ink-muted border border-surface-border select-none ${sizeClasses} ${className}`}
      title="Sample demo listing - not real inventory"
    >
      SAMPLE
    </span>
  );
};

