import React, { useEffect, useMemo, useState } from 'react';
import { Link } from 'react-router-dom';
import { Search, Star } from 'lucide-react';
import { AdminUserRow } from '@sidekit/shared';
import { sidekitService } from '../../services';
import { BrandLoader } from '../../components/brand/BrandStates';
import { AdminPageHeader, Notice, formatDate } from './adminUi';

export const AdminUsersPage: React.FC = () => {
  const [users, setUsers] = useState<AdminUserRow[] | null>(null);
  const [error, setError] = useState('');
  const [q, setQ] = useState('');
  const [tower, setTower] = useState('all');

  useEffect(() => {
    sidekitService.getAdminUsers().then(setUsers).catch((e) => setError(e?.message || 'Could not load residents.'));
  }, []);

  const towers = useMemo(() => Array.from(new Set((users || []).map((u) => u.tower))).sort(), [users]);
  const filtered = (users || []).filter(
    (u) => (tower === 'all' || u.tower === tower) && (!q.trim() || u.displayName.toLowerCase().includes(q.trim().toLowerCase()))
  );

  return (
    <>
      <AdminPageHeader
        title="Residents"
        description="Phone numbers and flats stay masked here too — residents share them only with each other after a request is accepted."
      />
      {error && <Notice kind="error">{error}</Notice>}
      <div className="flex flex-col sm:flex-row gap-2">
        <label className="relative flex-1">
          <span className="sr-only">Search residents</span>
          <Search className="w-4 h-4 text-ink-subtle absolute left-3 top-1/2 -translate-y-1/2" aria-hidden="true" />
          <input
            type="search"
            value={q}
            onChange={(e) => setQ(e.target.value)}
            placeholder="Search by name"
            className="w-full pl-9 pr-3 py-2 text-sm rounded-xl border border-surface-border bg-surface focus-ring"
          />
        </label>
        <label>
          <span className="sr-only">Tower</span>
          <select
            value={tower}
            onChange={(e) => setTower(e.target.value)}
            className="w-full sm:w-auto px-3 py-2 text-sm rounded-xl border border-surface-border bg-surface focus-ring"
          >
            <option value="all">All towers</option>
            {towers.map((t) => (
              <option key={t} value={t}>
                {t}
              </option>
            ))}
          </select>
        </label>
      </div>

      {!users ? (
        <BrandLoader label="Loading residents…" />
      ) : (
        <div className="bg-surface rounded-2xl border border-surface-border overflow-x-auto">
          <table className="w-full text-sm min-w-[640px]">
            <caption className="sr-only">Residents of Palm Grove</caption>
            <thead className="text-xs text-ink-muted bg-surface-secondary/60">
              <tr>
                <th scope="col" className="text-left font-semibold px-4 py-2.5">Resident</th>
                <th scope="col" className="text-left font-semibold px-4 py-2.5">Contact</th>
                <th scope="col" className="text-right font-semibold px-4 py-2.5">Listings</th>
                <th scope="col" className="text-right font-semibold px-4 py-2.5">Requests made</th>
                <th scope="col" className="text-right font-semibold px-4 py-2.5">Items shared</th>
                <th scope="col" className="text-right font-semibold px-4 py-2.5">Rating</th>
                <th scope="col" className="text-left font-semibold px-4 py-2.5">Joined</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-surface-border">
              {filtered.map((u) => (
                <tr key={u.id}>
                  <td className="px-4 py-3">
                    <Link to={`/u/${u.id}`} className="font-semibold text-ink hover:text-evergreen focus-ring rounded">
                      {u.displayName}
                    </Link>
                    <div className="text-xs text-ink-muted">
                      {u.tower}
                      {u.role === 'admin' && ' · Admin'}
                    </div>
                  </td>
                  <td className="px-4 py-3 text-xs text-ink-muted">
                    <div>{u.phone}</div>
                    <div>{u.flat}</div>
                  </td>
                  <td className="px-4 py-3 text-right tabular-nums">{u.listingsCount}</td>
                  <td className="px-4 py-3 text-right tabular-nums">{u.requestsMade}</td>
                  <td className="px-4 py-3 text-right tabular-nums">{u.itemsSharedCount}</td>
                  <td className="px-4 py-3 text-right tabular-nums">
                    <span className="inline-flex items-center gap-1">
                      <Star className="w-3 h-3 text-amber-500 fill-amber-400" aria-hidden="true" />
                      {u.rating.toFixed(1)}
                      <span className="text-ink-subtle">({u.reviewCount})</span>
                    </span>
                  </td>
                  <td className="px-4 py-3 text-xs text-ink-muted">{formatDate(u.joinedAt)}</td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      )}
    </>
  );
};
