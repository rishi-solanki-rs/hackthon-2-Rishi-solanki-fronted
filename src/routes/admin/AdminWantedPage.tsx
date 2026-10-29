import React, { useEffect, useState } from 'react';
import { Link } from 'react-router-dom';
import { Plus } from 'lucide-react';
import { AdminWantedItem } from '@sidekit/shared';
import { sidekitService } from '../../services';
import { BrandLoader, EmptyState } from '../../components/brand/BrandStates';
import { ItemThumb } from '../../components/brand/itemIcons';
import { MODE_STYLES } from '../../components/shared/modeStyles';
import { AdminPageHeader, Notice, formatDate } from './adminUi';

type Filter = 'open' | 'available' | 'all';

export const AdminWantedPage: React.FC = () => {
  const [items, setItems] = useState<AdminWantedItem[] | null>(null);
  const [error, setError] = useState('');
  const [filter, setFilter] = useState<Filter>('open');

  useEffect(() => {
    sidekitService.getAdminWanted().then(setItems).catch((e) => setError(e?.message || 'Could not load wanted items.'));
  }, []);

  const counts = {
    open: items?.filter((i) => i.status === 'open').length ?? 0,
    available: items?.filter((i) => i.status === 'available').length ?? 0,
    all: items?.length ?? 0,
  };
  const shown = (items || []).filter((i) => filter === 'all' || i.status === filter);

  return (
    <>
      <AdminPageHeader
        title="Wanted items"
        description="Things residents requested from their plan because nobody lists them yet. Residents are not notified automatically — use this list to source items or add a listing."
      />
      {error && <Notice kind="error">{error}</Notice>}

      <div className="flex flex-wrap gap-1.5" role="group" aria-label="Filter wanted items">
        {(
          [
            ['open', 'Not available yet'],
            ['available', 'Now available'],
            ['all', 'All'],
          ] as [Filter, string][]
        ).map(([value, label]) => (
          <button
            key={value}
            type="button"
            aria-pressed={filter === value}
            onClick={() => setFilter(value)}
            className={`px-3 py-1.5 rounded-full text-xs font-semibold border focus-ring ${
              filter === value ? 'bg-evergreen/10 text-evergreen border-evergreen/30' : 'bg-surface text-ink-muted border-surface-border hover:text-ink'
            }`}
          >
            {label} <span className="opacity-70 tabular-nums">{counts[value]}</span>
          </button>
        ))}
      </div>

      <div className="bg-surface rounded-2xl border border-surface-border overflow-hidden">
        {!items ? (
          <BrandLoader label="Loading wanted items…" />
        ) : shown.length === 0 ? (
          <EmptyState illustration="no-results" title="Nothing here" description="Requests from residents will appear in this list." width={160} />
        ) : (
          <ul className="divide-y divide-surface-border">
            {shown.map((item) => (
              <li key={item.itemKey} className="p-4 sm:p-5 flex flex-col sm:flex-row gap-4">
                <div className="flex items-start gap-3 flex-1 min-w-0">
                  <ItemThumb itemKey={item.itemKey} title={item.itemName} size={56} />
                  <div className="min-w-0 space-y-1.5">
                    <div className="flex items-center gap-2 flex-wrap">
                      <h2 className="text-sm font-bold text-ink">{item.itemName}</h2>
                      <span
                        className={`text-[10px] font-bold px-2 py-0.5 rounded border uppercase tracking-wide ${
                          item.status === 'available' ? 'bg-emerald-50 text-emerald-800 border-emerald-200' : 'bg-amber-50 text-amber-800 border-amber-200'
                        }`}
                      >
                        {item.status === 'available' ? 'Now available' : 'Not available yet'}
                      </span>
                    </div>
                    <p className="text-xs text-ink-muted">
                      <strong className="text-ink">
                        {item.requestCount} resident{item.requestCount === 1 ? '' : 's'}
                      </strong>{' '}
                      asked · first {formatDate(item.firstRequestedAt)} · latest {formatDate(item.lastRequestedAt)}
                    </p>
                    <ul className="flex flex-wrap gap-1.5" aria-label="Residents who asked">
                      {item.requesters.map((r) => (
                        <li key={r.userId}>
                          <Link
                            to={`/u/${r.userId}`}
                            className="inline-flex items-center gap-1 text-[11px] px-2 py-0.5 rounded-full bg-surface-secondary border border-surface-border text-ink-muted hover:text-ink"
                          >
                            {r.displayName} · {r.tower}
                          </Link>
                        </li>
                      ))}
                    </ul>
                    {item.availableListings.length > 0 && (
                      <ul className="space-y-1 pt-1">
                        {item.availableListings.map((l) => (
                          <li key={l.id} className="text-xs flex items-center gap-2">
                            <span className={`text-[9px] font-bold px-1.5 py-0.5 rounded ${MODE_STYLES[l.mode].solid}`}>{MODE_STYLES[l.mode].short}</span>
                            <Link to={`/listing/${l.id}`} className="text-evergreen font-semibold hover:underline truncate">
                              {l.title}
                            </Link>
                            {l.ownerDisplayName && <span className="text-ink-subtle">· {l.ownerDisplayName}</span>}
                          </li>
                        ))}
                      </ul>
                    )}
                  </div>
                </div>
                {item.status === 'open' && (
                  <Link
                    to={`/my/listings/new?${new URLSearchParams({ title: item.itemName, itemKey: item.itemKey }).toString()}`}
                    className="self-start inline-flex items-center gap-1.5 px-3 py-1.5 text-xs font-semibold bg-brand hover:bg-brand-dark text-white rounded-lg focus-ring shrink-0"
                  >
                    <Plus className="w-3.5 h-3.5" aria-hidden="true" />
                    Add a listing
                  </Link>
                )}
              </li>
            ))}
          </ul>
        )}
      </div>
    </>
  );
};
