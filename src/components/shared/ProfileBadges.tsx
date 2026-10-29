import React from 'react';
import { ProfileBadge } from '@sidekit/shared';
import { Badge, BADGE_LABELS } from '../brand/sidekit-art';

export const ProfileBadges: React.FC<{ badges: ProfileBadge[]; showLocked?: boolean }> = ({ badges, showLocked = true }) => {
  const shown = showLocked ? badges : badges.filter((b) => b.earned);
  if (shown.length === 0) {
    return <p className="text-xs text-ink-muted">No badges earned yet.</p>;
  }
  return (
    <ul className="grid grid-cols-3 sm:grid-cols-6 gap-3">
      {shown.map((b) => (
        <li key={b.name} className="flex flex-col items-center text-center gap-1.5" title={b.rule}>
          <span className={b.earned ? '' : 'opacity-60'}>
            <Badge name={b.name} locked={!b.earned} size={52} />
          </span>
          <span className={`text-[11px] font-semibold leading-tight ${b.earned ? 'text-ink' : 'text-ink-subtle'}`}>
            {BADGE_LABELS[b.name]}
          </span>
          <span className="sr-only">{b.earned ? 'Earned' : 'Not earned yet'}: {b.rule}</span>
        </li>
      ))}
    </ul>
  );
};
