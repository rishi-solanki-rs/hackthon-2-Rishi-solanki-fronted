import React, { useEffect, useState } from 'react';
import { Link } from 'react-router-dom';
import { AdminLeaderboard } from '@sidekit/shared';
import { sidekitService } from '../../services';
import { BrandLoader } from '../../components/brand/BrandStates';
import { ItemThumb } from '../../components/brand/itemIcons';
import { AdminPageHeader, Notice } from './adminUi';

export const AdminLeaderboardPage: React.FC = () => {
  const [data, setData] = useState<AdminLeaderboard | null>(null);
  const [error, setError] = useState('');

  useEffect(() => {
    sidekitService.getAdminLeaderboard().then(setData).catch((e) => setError(e?.message || 'Could not load the leaderboard.'));
  }, []);

  if (error) return <Notice kind="error">{error}</Notice>;
  if (!data) return <BrandLoader label="Loading leaderboard…" />;

  const maxTower = Math.max(1, ...data.towers.map((t) => t.itemsShared));

  return (
    <>
      <AdminPageHeader
        title="Leaderboard"
        description="Residents ranked by completed loans. Use it to thank helpful neighbours — it is not shown publicly. Includes SAMPLE seed counts."
      />

      <div className="bg-surface rounded-2xl border border-surface-border overflow-hidden">
        <h2 className="px-5 py-3 border-b border-surface-border text-sm font-bold text-ink">Top lenders</h2>
        <ol className="divide-y divide-surface-border">
          {data.lenders.map((u, i) => (
            <li key={u.id} className="px-5 py-3 flex items-center gap-3">
              <span
                className={`w-7 h-7 rounded-full inline-flex items-center justify-center text-xs font-bold shrink-0 ${
                  i === 0 ? 'bg-lime text-ink' : i < 3 ? 'bg-evergreen/15 text-evergreen' : 'bg-surface-secondary text-ink-muted'
                }`}
                aria-label={`Rank ${i + 1}`}
              >
                {i + 1}
              </span>
              <div className="flex-1 min-w-0">
                <Link to={`/u/${u.id}`} className="text-sm font-semibold text-ink hover:text-evergreen">
                  {u.displayName}
                </Link>
                <p className="text-xs text-ink-muted">
                  {u.tower} · {u.activeListings} public listing{u.activeListings === 1 ? '' : 's'} ({u.freeListings} free) · {u.thankYouNotes} thank-you
                  note{u.thankYouNotes === 1 ? '' : 's'}
                </p>
              </div>
              <div className="text-right">
                <div className="text-sm font-bold text-ink tabular-nums">{u.itemsSharedCount}</div>
                <div className="text-[11px] text-ink-muted">items shared</div>
              </div>
            </li>
          ))}
        </ol>
      </div>

      <div className="grid md:grid-cols-2 gap-4">
        <div className="bg-surface rounded-2xl border border-surface-border p-5">
          <h2 className="text-sm font-bold text-ink mb-3">Towers</h2>
          <ul className="space-y-3">
            {data.towers.map((t) => (
              <li key={t.tower} className="text-xs">
                <div className="flex justify-between mb-1">
                  <span className="font-semibold text-ink">{t.tower}</span>
                  <span className="text-ink-muted tabular-nums">
                    {t.itemsShared} shared · {t.activeListings} listings · {t.residents} residents
                  </span>
                </div>
                <div className="h-1.5 rounded-full bg-surface-secondary overflow-hidden">
                  <div className="h-full bg-evergreen rounded-full" style={{ width: `${(t.itemsShared / maxTower) * 100}%` }} />
                </div>
              </li>
            ))}
          </ul>
        </div>

        <div className="bg-surface rounded-2xl border border-surface-border p-5">
          <h2 className="text-sm font-bold text-ink mb-3">Most requested items</h2>
          {data.popularItems.length === 0 ? (
            <p className="text-xs text-ink-muted">No requests yet.</p>
          ) : (
            <ul className="space-y-2">
              {data.popularItems.map((p) => (
                <li key={p.itemKey} className="flex items-center gap-3">
                  <ItemThumb itemKey={p.itemKey} title={p.title} size={36} />
                  <span className="flex-1 min-w-0 text-sm text-ink truncate">{p.title}</span>
                  <span className="text-xs text-ink-muted tabular-nums">
                    {p.requests} request{p.requests === 1 ? '' : 's'}
                  </span>
                </li>
              ))}
            </ul>
          )}
        </div>
      </div>
    </>
  );
};
