// Static brand art. Copy /badges and /illustrations from the asset pack into client/public/brand/ first.
export type BadgeName = 'founding-lender' | 'helper' | 'toolkeeper' | 'reliable' | 'neighbour-of-month' | 'thank-you';
export type IllustrationName = 'hero-flow' | 'no-results' | 'no-requests' | 'inbox-empty' | 'no-listings' | 'all-owned' | 'ai-unavailable' | 'error' | 'offline' | 'not-found' | 'request-sent' | 'safety-professional' | 'join-society';

export const BADGE_LABELS: Record<BadgeName, string> = {
  'founding-lender': 'Founding Lender',
  helper: 'Helper',
  toolkeeper: 'Toolkeeper',
  reliable: 'Reliable',
  'neighbour-of-month': 'Neighbour of the Month',
  'thank-you': 'Thank-you',
};

export function Badge({ name, locked = false, size = 56 }: { name: BadgeName; locked?: boolean; size?: number }) {
  return (
    <img
      src={`/brand/badges/${name}${locked ? '-locked' : ''}.svg`}
      width={size}
      height={size}
      alt={`${BADGE_LABELS[name]} badge${locked ? ' (not earned yet)' : ''}`}
      draggable={false}
    />
  );
}

/** Decorative by default (alt=""): the surrounding text carries the meaning. Pass alt if it stands alone. */
export function Illustration({ name, width = 280, alt = '', className }: { name: IllustrationName; width?: number; alt?: string; className?: string }) {
  return <img src={`/brand/illustrations/${name}.svg`} width={width} alt={alt} className={className} draggable={false} loading="lazy" />;
}
