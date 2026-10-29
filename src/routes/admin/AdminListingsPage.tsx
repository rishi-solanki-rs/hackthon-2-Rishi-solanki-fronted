import React, { useCallback, useEffect, useState } from 'react';
import { useOutletContext } from 'react-router-dom';
import { Search } from 'lucide-react';
import { CATEGORY_LABELS, LISTING_CATEGORIES, Listing, ModerationStatus } from '@sidekit/shared';
import { sidekitService } from '../../services';
import { BrandLoader, EmptyState } from '../../components/brand/BrandStates';
import { AdminPageHeader, ListingModerationRow, MODERATION_META, useNotice } from './adminUi';
import type { AdminOutletContext } from './AdminLayout';

const MODERATION_FILTERS: (ModerationStatus | 'all')[] = ['all', 'pending_review', 'approved', 'reported', 'hidden_by_admin', 'rejected'];

export const AdminListingsPage: React.FC = () => {
  const { refreshCounts } = useOutletContext<AdminOutletContext>();
  const [listings, setListings] = useState<Listing[] | null>(null);
  const [moderation, setModeration] = useState<ModerationStatus | 'all'>('all');
  const [category, setCategory] = useState('all');
  const [q, setQ] = useState('');
  const { show, node } = useNotice();

  const load = useCallback(() => {
    sidekitService
      .getAdminListings({ moderation, category, q })
      .then(setListings)
      .catch((e) => show('error', e?.message || 'Could not load listings.'));
  }, [moderation, category, q]);

  useEffect(() => {
    const t = window.setTimeout(load, 200);
    return () => window.clearTimeout(t);
  }, [load]);

  const done = (msg: string) => {
    show('success', msg);
    load();
    refreshCounts();
  };

  return (
    <>
      <AdminPageHeader title="Listings" description="Every listing in the society, including private, rejected and hidden ones." />
      {node}
      <div className="flex flex-col sm:flex-row gap-2">
        <label className="relative flex-1">
          <span className="sr-only">Search listings</span>
          <Search className="w-4 h-4 text-ink-subtle absolute left-3 top-1/2 -translate-y-1/2" aria-hidden="true" />
          <input
            type="search"
            value={q}
            onChange={(e) => setQ(e.target.value)}
            placeholder="Search title, owner or item"
            className="w-full pl-9 pr-3 py-2 text-sm rounded-xl border border-surface-border bg-surface focus-ring"
          />
        </label>
        <label>
          <span className="sr-only">Moderation status</span>
          <select
            value={moderation}
            onChange={(e) => setModeration(e.target.value as ModerationStatus | 'all')}
            className="w-full sm:w-auto px-3 py-2 text-sm rounded-xl border border-surface-border bg-surface focus-ring"
          >
            {MODERATION_FILTERS.map((m) => (
              <option key={m} value={m}>
                {m === 'all' ? 'All statuses' : MODERATION_META[m].label}
              </option>
            ))}
          </select>
        </label>
        <label>
          <span className="sr-only">Category</span>
          <select
            value={category}
            onChange={(e) => setCategory(e.target.value)}
            className="w-full sm:w-auto px-3 py-2 text-sm rounded-xl border border-surface-border bg-surface focus-ring"
          >
            <option value="all">All categories</option>
            {LISTING_CATEGORIES.map((c) => (
              <option key={c} value={c}>
                {CATEGORY_LABELS[c]}
              </option>
            ))}
          </select>
        </label>
      </div>

      <div className="bg-surface rounded-2xl border border-surface-border overflow-hidden">
        {!listings ? (
          <BrandLoader label="Loading listings…" />
        ) : listings.length === 0 ? (
          <EmptyState illustration="no-results" title="No listings match" description="Try a different filter or search term." width={160} />
        ) : (
          <>
            <p className="px-5 py-2 text-xs text-ink-muted border-b border-surface-border">{listings.length} listings</p>
            <ul className="divide-y divide-surface-border">
              {listings.map((l) => (
                <ListingModerationRow key={l.id} listing={l} onDone={done} onError={(m) => show('error', m)} showReports />
              ))}
            </ul>
          </>
        )}
      </div>
    </>
  );
};
