import React, { useEffect, useState } from 'react';
import { Link } from 'react-router-dom';
import { AdminOverview, CATEGORY_LABELS, ListingCategory } from '@sidekit/shared';
import { sidekitService } from '../../services';
import { BrandLoader } from '../../components/brand/BrandStates';
import { ItemThumb } from '../../components/brand/itemIcons';
import { AdminPageHeader, ModerationBadge, StatTile, Notice, formatDate } from './adminUi';
import { REQUEST_STATUS_LABELS } from './AdminRequestsPage';

export const AdminOverviewPage: React.FC = () => {
  const [data, setData] = useState<AdminOverview | null>(null);
  const [error, setError] = useState('');

  useEffect(() => {
    sidekitService.getAdminOverview().then(setData).catch((e) => setError(e?.message || 'Could not load the overview.'));
  }, []);

  if (error) return <Notice kind="error">{error}</Notice>;
  if (!data) return <BrandLoader label="Loading overview…" />;

  const { counts } = data;
  const categories = Object.entries(data.listingsByCategory).sort((a, b) => b[1] - a[1]);
  const maxCategory = Math.max(1, ...categories.map(([, n]) => n));

  return (
    <>
      <AdminPageHeader
        title="Overview"
        description="What needs your attention in Palm Grove today. Counts include SAMPLE seed data."
      />

      <div className="grid grid-cols-2 sm:grid-cols-4 gap-3">
        <StatTile label="Awaiting approval" value={counts.pendingApprovals} to="/admin/approvals" tone={counts.pendingApprovals ? 'warn' : 'default'} />
        <StatTile label="Reported or hidden" value={counts.reported + counts.hidden} to="/admin/reports" tone={counts.reported + counts.hidden ? 'danger' : 'default'} />
        <StatTile label="Public listings" value={counts.activeListings} to="/admin/listings" />
        <StatTile label="Open requests" value={counts.openRequests} to="/admin/requests" />
        <StatTile label="Residents" value={counts.users} to="/admin/users" />
        <StatTile label="Wanted, not listed" value={counts.wantedItems} to="/admin/wanted" tone={counts.wantedItems ? 'warn' : 'default'} />
        <StatTile label="All requests" value={counts.requests} />
        <StatTile label="Completed requests" value={data.requestsByStatus.completed || 0} />
      </div>

      <div className="grid md:grid-cols-2 gap-4">
        <div className="bg-surface rounded-2xl border border-surface-border p-5">
          <h2 className="text-sm font-bold text-ink mb-3">Listings by category</h2>
          <ul className="space-y-2">
            {categories.map(([cat, n]) => (
              <li key={cat} className="text-xs">
                <div className="flex justify-between text-ink-muted mb-1">
                  <span>{CATEGORY_LABELS[cat as ListingCategory] || cat}</span>
                  <span className="tabular-nums">{n}</span>
                </div>
                <div className="h-1.5 rounded-full bg-surface-secondary overflow-hidden">
                  <div className="h-full bg-evergreen rounded-full" style={{ width: `${(n / maxCategory) * 100}%` }} />
                </div>
              </li>
            ))}
          </ul>
        </div>

        <div className="bg-surface rounded-2xl border border-surface-border p-5">
          <h2 className="text-sm font-bold text-ink mb-3">Requests by status</h2>
          <ul className="grid grid-cols-2 gap-2">
            {Object.entries(REQUEST_STATUS_LABELS).map(([status, label]) => (
              <li key={status}>
                <Link
                  to={`/admin/requests?status=${status}`}
                  className="flex items-center justify-between px-3 py-2 rounded-xl bg-surface-secondary text-xs hover:bg-surface-border/60 focus-ring"
                >
                  <span className="text-ink-muted">{label}</span>
                  <span className="font-bold text-ink tabular-nums">{data.requestsByStatus[status as keyof typeof data.requestsByStatus] || 0}</span>
                </Link>
              </li>
            ))}
          </ul>
        </div>
      </div>

      <div className="bg-surface rounded-2xl border border-surface-border overflow-hidden">
        <div className="px-5 py-3 border-b border-surface-border flex items-center justify-between">
          <h2 className="text-sm font-bold text-ink">Newest listings</h2>
          <Link to="/admin/listings" className="text-xs font-semibold text-evergreen hover:underline focus-ring rounded">
            View all
          </Link>
        </div>
        <ul className="divide-y divide-surface-border">
          {data.recentListings.map((l) => (
            <li key={l.id} className="px-5 py-3 flex items-center gap-3">
              <ItemThumb itemKey={l.itemKey} title={l.title} category={l.category} size={40} />
              <div className="flex-1 min-w-0">
                <Link to={`/listing/${l.id}`} className="text-sm font-semibold text-ink truncate block hover:text-evergreen">
                  {l.title}
                </Link>
                <p className="text-xs text-ink-muted">
                  {l.ownerDisplayName} · {formatDate(l.createdAt)}
                </p>
              </div>
              <ModerationBadge status={l.moderationStatus} />
            </li>
          ))}
        </ul>
      </div>
    </>
  );
};
