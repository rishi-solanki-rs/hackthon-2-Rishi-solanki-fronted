import React, { useState, useEffect, useMemo } from 'react';
import { Link, useSearchParams } from 'react-router-dom';
import { Search, Plus } from 'lucide-react';
import { CATEGORY_LABELS, LISTING_CATEGORIES, Listing, ListingCategory, ListingMode } from '@sidekit/shared';
import { sidekitService } from '../services';
import { SampleBadge } from '../components/shared/SampleBadge';
import { listingPriceLabel } from '../components/shared/listingPrice';
import { MODE_STYLES } from '../components/shared/modeStyles';
import { ItemHero } from '../components/brand/itemIcons';
import { EmptyState, BrandLoader } from '../components/brand/BrandStates';

const MODES: { id: ListingMode | 'all'; label: string }[] = [
  { id: 'all', label: 'Any way' },
  { id: 'lend', label: 'Free borrow' },
  { id: 'rent', label: 'Rent' },
  { id: 'sell_used', label: 'Buy used' },
];

type SortKey = 'recommended' | 'price_low' | 'newest';
const SORTS: { id: SortKey; label: string }[] = [
  { id: 'recommended', label: 'Free first' },
  { id: 'price_low', label: 'Price: low to high' },
  { id: 'newest', label: 'Newest' },
];

const MODE_ORDER: Record<ListingMode, number> = { lend: 0, rent: 1, sell_used: 2 };

/** Unknown prices sort after known ones; they are never treated as ₹0. */
function priceForSort(l: Listing): number {
  if (l.mode === 'lend') return 0;
  return l.price === null ? Number.POSITIVE_INFINITY : l.price;
}

function sortListings(listings: Listing[], sort: SortKey): Listing[] {
  const out = [...listings];
  if (sort === 'newest') return out.sort((a, b) => b.createdAt.localeCompare(a.createdAt));
  if (sort === 'price_low') return out.sort((a, b) => priceForSort(a) - priceForSort(b));
  return out.sort((a, b) => MODE_ORDER[a.mode] - MODE_ORDER[b.mode] || priceForSort(a) - priceForSort(b) || a.title.localeCompare(b.title));
}

export const BrowseCatalogPage: React.FC = () => {
  const [params, setParams] = useSearchParams();
  const category = (params.get('category') as ListingCategory | null) || 'all';
  const [all, setAll] = useState<Listing[]>([]);
  const [query, setQuery] = useState(params.get('q') || '');
  const [mode, setMode] = useState<ListingMode | 'all'>('all');
  const [sort, setSort] = useState<SortKey>('recommended');
  const [onlyAvailable, setOnlyAvailable] = useState(false);
  const [isLoading, setIsLoading] = useState(true);
  const [loadError, setLoadError] = useState('');

  const fetchListings = async (q = query) => {
    setIsLoading(true);
    setLoadError('');
    try {
      setAll(await sidekitService.searchListings({ query: q.trim() || undefined, onlyAvailable }));
    } catch (err: any) {
      setAll([]);
      setLoadError(err?.message || 'Could not load the catalog.');
    }
    setIsLoading(false);
  };

  useEffect(() => {
    fetchListings();
  }, [onlyAvailable]);

  const setCategory = (c: string) => {
    const next = new URLSearchParams(params);
    if (c === 'all') next.delete('category');
    else next.set('category', c);
    setParams(next, { replace: true });
  };

  const byMode = useMemo(() => (mode === 'all' ? all : all.filter((l) => l.mode === mode)), [all, mode]);
  const categoryCounts = useMemo(() => {
    const counts: Record<string, number> = {};
    byMode.forEach((l) => (counts[l.category] = (counts[l.category] || 0) + 1));
    return counts;
  }, [byMode]);
  const listings = useMemo(
    () => sortListings(category === 'all' ? byMode : byMode.filter((l) => l.category === category), sort),
    [byMode, category, sort]
  );
  const visibleCategories = LISTING_CATEGORIES.filter((c) => categoryCounts[c] || c === category);

  const clearFilters = () => {
    setQuery('');
    setMode('all');
    setOnlyAvailable(false);
    setParams({}, { replace: true });
    fetchListings('');
  };

  return (
    <div className="max-w-6xl mx-auto py-8 px-4 space-y-6">
      <div className="flex items-center justify-between gap-4">
        <div>
          <h1 className="text-xl font-bold text-ink">Community catalog</h1>
          <p className="text-xs text-ink-muted mt-0.5">Borrow, rent or buy second-hand from neighbours in Palm Grove. Photos are illustrative.</p>
        </div>
        <Link
          to="/my/listings/new"
          className="flex items-center gap-1.5 px-4 py-2 bg-brand hover:bg-brand-dark text-white rounded-xl text-xs font-semibold shrink-0 focus-ring"
        >
          <Plus className="w-3.5 h-3.5" />
          List item
        </Link>
      </div>

      <div className="space-y-3">
        <form
          role="search"
          onSubmit={(e) => {
            e.preventDefault();
            fetchListings();
          }}
          className="flex gap-2"
        >
          <label className="relative flex-1">
            <span className="sr-only">Search the catalog</span>
            <Search className="w-3.5 h-3.5 text-ink-muted absolute left-3 top-1/2 -translate-y-1/2" aria-hidden="true" />
            <input
              type="search"
              value={query}
              onChange={(e) => setQuery(e.target.value)}
              placeholder="Search drills, easels, tents…"
              className="w-full pl-9 pr-3 py-2 text-sm bg-surface border border-surface-border rounded-xl focus-ring"
            />
          </label>
          <button
            type="submit"
            className="px-4 py-2 bg-surface border border-surface-border rounded-xl text-xs font-semibold text-ink hover:bg-surface-secondary focus-ring"
          >
            Search
          </button>
        </form>

        <div className="-mx-4 px-4 overflow-x-auto">
          <div className="flex gap-1.5 min-w-max pb-1" role="group" aria-label="Category">
            {(['all', ...visibleCategories] as const).map((c) => {
              const active = category === c;
              const count = c === 'all' ? byMode.length : categoryCounts[c] || 0;
              return (
                <button
                  key={c}
                  type="button"
                  aria-pressed={active}
                  onClick={() => setCategory(c)}
                  className={`px-3 py-1.5 rounded-full text-xs font-medium transition-colors border whitespace-nowrap focus-ring ${
                    active ? 'bg-ink text-canvas border-ink' : 'bg-surface border-surface-border text-ink-muted hover:text-ink'
                  }`}
                >
                  {c === 'all' ? 'All' : CATEGORY_LABELS[c]} <span className="opacity-70 tabular-nums">{count}</span>
                </button>
              );
            })}
          </div>
        </div>

        <div className="flex flex-wrap gap-2 items-center">
          <div className="flex gap-1 flex-wrap" role="group" aria-label="How to get it">
            {MODES.map((m) => {
              const active = mode === m.id;
              const style = m.id === 'all' ? null : MODE_STYLES[m.id];
              return (
                <button
                  key={m.id}
                  type="button"
                  aria-pressed={active}
                  onClick={() => setMode(m.id)}
                  className={`px-3 py-1 rounded-lg text-xs font-medium transition-colors border focus-ring ${
                    active ? (style ? `${style.solid} border-transparent` : 'bg-ink text-canvas border-ink') : 'bg-surface border-surface-border text-ink-muted hover:text-ink'
                  }`}
                >
                  {m.label}
                </button>
              );
            })}
          </div>
          <label className="flex items-center gap-1.5 text-xs text-ink-muted cursor-pointer ml-1">
            <input type="checkbox" checked={onlyAvailable} onChange={(e) => setOnlyAvailable(e.target.checked)} className="rounded text-evergreen" />
            Available only
          </label>
          <label className="ml-auto flex items-center gap-1.5 text-xs text-ink-muted">
            Sort
            <select
              value={sort}
              onChange={(e) => setSort(e.target.value as SortKey)}
              className="px-2 py-1 text-xs bg-surface border border-surface-border rounded-lg focus-ring"
            >
              {SORTS.map((s) => (
                <option key={s.id} value={s.id}>
                  {s.label}
                </option>
              ))}
            </select>
          </label>
        </div>
      </div>

      {isLoading ? (
        <BrandLoader label="Loading catalog…" />
      ) : loadError ? (
        <div role="alert">
          <EmptyState
            illustration="offline"
            title="Catalog unavailable"
            description={loadError}
            action={
              <button onClick={() => fetchListings()} className="text-xs text-evergreen font-semibold hover:underline">
                Try again
              </button>
            }
          />
        </div>
      ) : listings.length === 0 ? (
        <EmptyState
          illustration="no-results"
          title="No listings match your filters"
          action={
            <button onClick={clearFilters} className="text-xs text-evergreen font-semibold hover:underline">
              Clear filters
            </button>
          }
        />
      ) : (
        <>
          <p className="text-xs text-ink-muted" aria-live="polite">
            {listings.length} item{listings.length !== 1 ? 's' : ''}
            {category !== 'all' && ` in ${CATEGORY_LABELS[category]}`}
          </p>
          <ul className="grid grid-cols-2 sm:grid-cols-3 lg:grid-cols-4 gap-4">
            {listings.map((l) => {
              const m = MODE_STYLES[l.mode];
              return (
                <li key={l.id}>
                  <Link
                    to={`/listing/${l.id}`}
                    className="group h-full bg-surface rounded-2xl border border-surface-border overflow-hidden hover:border-evergreen/30 hover:shadow-sm transition-all flex flex-col focus-ring"
                  >
                    <div className="aspect-[4/3] relative overflow-hidden">
                      <ItemHero
                        itemKey={l.itemKey}
                        title={l.title}
                        category={l.category}
                        imageUrl={l.photos?.[0]}
                        className="w-full h-full motion-safe:group-hover:scale-105 motion-safe:transition-transform motion-safe:duration-300"
                      />
                      <span className={`absolute top-2 left-2 text-[10px] font-bold px-2 py-0.5 rounded ${m.solid}`}>{m.short}</span>
                      {l.isSample && <SampleBadge className="absolute top-2 right-2" />}
                    </div>
                    <div className="p-3 flex-1 flex flex-col gap-1">
                      <h2 className="text-xs font-bold text-ink line-clamp-2 leading-snug group-hover:text-evergreen">{l.title}</h2>
                      <p className="text-[11px] text-ink-muted truncate">
                        {l.ownerDisplayName} · {l.ownerTower}
                      </p>
                      <div className="flex items-center justify-between text-xs mt-auto pt-2 border-t border-surface-border">
                        <span className="text-ink-muted capitalize">{l.condition.replace('_', ' ')}</span>
                        <span className={`font-bold ${l.mode === 'lend' ? 'text-emerald-600' : 'text-ink'}`}>{listingPriceLabel(l)}</span>
                      </div>
                    </div>
                  </Link>
                </li>
              );
            })}
          </ul>
        </>
      )}
    </div>
  );
};
