import React from 'react';
import { Illustration, IllustrationName } from './sidekit-art';

/** Animated brand loader from the asset pack (respects reduced motion). */
export const BrandLoader: React.FC<{ label?: string; size?: number }> = ({ label = 'Loading…', size = 40 }) => (
  <div className="py-16 flex flex-col items-center justify-center gap-3" role="status" aria-live="polite">
    <img src="/brand/motion/loader.svg" width={size} height={size} alt="" draggable={false} />
    <p className="text-sm text-ink-muted">{label}</p>
  </div>
);

interface EmptyStateProps {
  illustration: IllustrationName;
  title: string;
  description?: React.ReactNode;
  action?: React.ReactNode;
  className?: string;
  width?: number;
}

/** Empty, error, offline and AI-unavailable states always use a brand illustration. */
export const EmptyState: React.FC<EmptyStateProps> = ({ illustration, title, description, action, className = '', width = 220 }) => (
  <div className={`py-10 px-4 text-center flex flex-col items-center gap-3 ${className}`}>
    <Illustration name={illustration} width={width} className="brand-art" />
    <h2 className="text-base font-bold text-ink">{title}</h2>
    {description && <div className="text-sm text-ink-muted max-w-md">{description}</div>}
    {action && <div className="pt-1">{action}</div>}
  </div>
);
