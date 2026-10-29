import React, { useState, useEffect, useMemo } from 'react';
import { Link, useSearchParams } from 'react-router-dom';
import { Search, Plus, X } from 'lucide-react';
import { CATEGORY_LABELS, LISTING_CATEGORIES, Listing, ListingCategory } from '@sidekit/shared';
import { sidekitService } from '../services';
import { ListingCard } from '../components/shared/ListingCard';
import { FilterDropdown, FilterOption } from '../components/shared/FilterDropdown';
import { MODE_STYLES } from '../components/shared/modeStyles';
import { EmptyState, BrandLoader } from '../components/brand/BrandStates';

type SortKey = 'recommended' | 'price_low' | 'price_high' | 'newest';
const SORTS: FilterOption[] = [
  { value: 'recommended', label: 'Free first' },
  { value: 'price_low', label: 'Price: low to high' },
  { value: 'price_high', label: 'Price: high to low' },
  { value: 'newest', label: 'Newest' },
];

const PRICE_BANDS: { value: string; label: string; test: (l: Listing) => boolean }[] = [
  { value: 'all', label: 'Any price', test: () => true },
  { value: 'free', label: 'Free', test: (l) => l.mode === 'lend' },
  { value: 'under100', label: 'Under ₹100', test: (l) => l.mode !== 'lend' && l.price !== null && l.price < 100 },
  { value: '100to500', label: '₹100 – ₹500', test: (l) => l.price !== null && l.price >= 100 && l.price <= 500 },
  { value: 'over500', label: 'Over ₹500', test: (l) => l.price !== null && l.price > 500 },
];

const CONDITIONS: FilterOption[] = [
  { value: 'all', label: 'Any condition' },
  { value: 'like_new', label: 'Like new' },
  { value: 'good', label: 'Good' },
  { value: 'fair', label: 'Fair' },
];

const MODE_ORDER: Record<string, number> = { lend: 0, rent: 1, sell_used: 2 };

/** Unknown prices sort after known ones; they are never treated as ₹0. */
function priceForSort(l: Listing, unknown: number): number {
  if (l.mode === 'lend') return 0;
  return l.price === null ? unknown : l.price;
}

function sortListings(listings: Listing[], sort: SortKey): Listing[] {
  const out = [...listings];
  switch (sort) {
    case 'newest':
      return out.sort((a, b) => b.createdAt.localeCompare(a.createdAt));
    case 'price_low':
      return out.sort((a, b) => priceForSort(a, Infinity) - priceForSort(b, Infinity));
    case 'price_high':
      return out.sort((a, b) => priceForSort(b, -Infinity) - priceForSort(a, -Infinity));
    default:
      return out.sort(
        (a, b) => MODE_ORDER[a.mode] - MODE_ORDER[b.mode] || priceForSort(a, Infinity) - priceForSort(b, Infinity) || a.title.localeCompare(b.title)
      );
  }
}

const countBy = (items: Listing[], key: (l: Listing) => string) =>
  items.reduce<Record<string, number>>((acc, l) => ((acc[key(l)] = (acc[key(l)] || 0) + 1), acc), {});

export const BrowseCatalogPage: React.FC = () => {
  const [params, setParams] = useSearchParams();
  const get = (k: string, d = 'all') => params.get(k) || d;
  const category = get('category');
  const mode = get('mode');
  const price = get('price');
  const tower = get('tower');
  const condition = get('condition');
  const sort = get('sort', 'recommended') as SortKey;

  const [all, setAll] = useState<Listing[]>([]);
  const [query, setQuery] = useState(params.get('q') || '');
  const [isLoading, setIsLoading] = useState(true);
  const [loadError, setLoadError] = useState('');

  const setFilter = (key: string, value: string, defaultValue = 'all') => {
    const next = new URLSearchParams(params);
    if (value === defaultValue) next.delete(key);
    else next.set(key, value);
    setParams(next, { replace: true });
  };

  const fetchListings = async (q = query) => {
    setIsLoading(true);
    setLoadError('');
    try {
      setAll(await sidekitService.searchListings({ query: q.trim() || undefined }));
    } catch (err: any) {
      setAll([]);
      setLoadError(err?.message || 'Could not load the catalog.');
    }
    setIsLoading(false);
  };

  useEffect(() => {
    fetchListings(params.get('q') || '');
  }, []);

  // Each filter's counts reflect the other active filters, like modern store filters
  const filtersExcept = (skip: string) => (l: Listing) =>
    (skip === 'category' || category === 'all' || l.category === category) &&
    (skip === 'mode' || mode === 'all' || l.mode === mode) &&
    (skip === 'price' || PRICE_BANDS.find((b) => b.value === price)?.test(l) !== false) &&
    (skip === 'tower' || tower === 'all' || l.ownerTower === tower) &&
    (skip === 'condition' || condition === 'all' || l.condition === condition);

  const listings = useMemo(() => sortListings(all.filter(filtersExcept('')), sort), [all, category, mode, price, tower, condition, sort]);

  const categoryOptions: FilterOption[] = useMemo(() => {
    const counts = countBy(all.filter(filtersExcept('category')), (l) => l.category);
    return [
      { value: 'all', label: 'All categories', count: Object.values(counts).reduce((a, b) => a + b, 0) },
      ...LISTING_CATEGORIES.filter((c) => counts[c] || c === category).map((c) => ({ value: c, label: CATEGORY_LABELS[c], count: counts[c] || 0 })),
    ];
  }, [all, mode, price, tower, condition, category]);

  const modeOptions: FilterOption[] = useMemo(() => {
    const counts = countBy(all.filter(filtersExcept('mode')), (l) => l.mode);
    return [
      { value: 'all', label: 'Any way' },
      { value: 'lend', label: MODE_STYLES.lend.label, count: counts.lend || 0 },
      { value: 'rent', label: MODE_STYLES.rent.label, count: counts.rent || 0 },
      { value: 'sell_used', label: MODE_STYLES.sell_used.label, count: counts.sell_used || 0 },
    ];
  }, [all, category, price, tower, condition]);

  const towerOptions: FilterOption[] = useMemo(() => {
    const counts = countBy(all.filter(filtersExcept('tower')), (l) => l.ownerTower || 'Unknown');
    return [{ value: 'all', label: 'All towers' }, ...Object.keys(counts).sort().map((t) => ({ value: t, label: t, count: counts[t] }))];
  }, [all, category, mode, price, condition]);

  const activeChips = [
    category !== 'all' && { key: 'category', label: CATEGORY_LABELS[category as ListingCategory] || category },
    mode !== 'all' && { key: 'mode', label: modeOptions.find((o) => o.value === mode)?.label || mode },
    price !== 'all' && { key: 'price', label: PRICE_BANDS.find((b) => b.value === price)?.label || price },
    tower !== 'all' && { key: 'tower', label: tower },
    condition !== 'all' && { key: 'condition', label: CONDITIONS.find((c) => c.value === condition)?.label || condition },
  ].filter(Boolean) as { key: string; label: string }[];

  const clearFilters = () => {
    setQuery('');
    setParams({}, { replace: true });
    fetchListings('');
  };

  return (
    <div className="max-w-6xl mx-auto py-8 px-4 space-y-5">
      <div className="flex items-end justify-between gap-4">
        <div>
          <h1 className="text-xl sm:text-2xl font-bold text-ink">Community catalog</h1>
          <p className="text-xs text-ink-muted mt-1">Borrow, rent or buy second-hand from neighbours in Palm Grove. Photos are illustrative.</p>
        </div>
        <Link
          to="/my/listings/new"
          className="flex items-center gap-1.5 px-4 py-2 bg-brand hover:bg-brand-dark text-white rounded-xl text-xs font-semibold shrink-0 focus-ring"
        >
          <Plus className="w-3.5 h-3.5" />
          List item
        </Link>
      </div>

      <div data-tour="browse-filters" className="sm:sticky sm:top-14 z-30 -mx-4 px-4 py-3 bg-canvas/95 backdrop-blur border-b border-surface-border space-y-3">
        <form
          role="search"
          onSubmit={(e) => {
            e.preventDefault();
            const next = new URLSearchParams(params);
            if (query.trim()) next.set('q', query.trim());
            else next.delete('q');
            setParams(next, { replace: true });
            fetchListings();
          }}
          className="flex gap-2"
        >
          <label className="relative flex-1">
            <span className="sr-only">Search the catalog</span>
            <Search className="w-4 h-4 text-ink-muted absolute left-3.5 top-1/2 -translate-y-1/2" aria-hidden="true" />
            <input
              type="search"
              value={query}
              onChange={(e) => setQuery(e.target.value)}
              placeholder="Search drills, easels, tents…"
              className="w-full h-10 pl-10 pr-3 text-sm bg-surface border border-surface-border rounded-full focus-ring"
            />
          </label>
          <button type="submit" className="h-10 px-5 bg-ink text-canvas rounded-full text-xs font-semibold hover:opacity-90 focus-ring">
            Search
          </button>
        </form>

        <div className="flex flex-wrap items-center gap-2" role="group" aria-label="Filters">
          <FilterDropdown label="Category" value={category} options={categoryOptions} onChange={(v) => setFilter('category', v)} />
          <FilterDropdown label="Get it by" value={mode} options={modeOptions} onChange={(v) => setFilter('mode', v)} />
          <FilterDropdown label="Price" value={price} options={PRICE_BANDS.map(({ value, label }) => ({ value, label }))} onChange={(v) => setFilter('price', v)} />
          <FilterDropdown label="Tower" value={tower} options={towerOptions} onChange={(v) => setFilter('tower', v)} />
          <FilterDropdown label="Condition" value={condition} options={CONDITIONS} onChange={(v) => setFilter('condition', v)} />
          <div className="ml-auto">
            <FilterDropdown label="Sort" value={sort} options={SORTS} defaultValue="recommended" align="right" onChange={(v) => setFilter('sort', v, 'recommended')} />
          </div>
        </div>
      </div>

      {(activeChips.length > 0 || params.get('q')) && (
        <div className="flex flex-wrap items-center gap-2">
          {params.get('q') && (
            <span className="inline-flex items-center gap-1 text-xs px-2.5 py-1 rounded-full bg-surface-secondary border border-surface-border text-ink">
              “{params.get('q')}”
            </span>
          )}
          {activeChips.map((c) => (
            <button
              key={c.key}
              type="button"
              onClick={() => setFilter(c.key, 'all')}
              className="inline-flex items-center gap-1 text-xs px-2.5 py-1 rounded-full bg-evergreen/10 text-evergreen font-medium hover:bg-evergreen/20 focus-ring"
              aria-label={`Remove filter ${c.label}`}
            >
              {c.label}
              <X className="w-3 h-3" aria-hidden="true" />
            </button>
          ))}
          <button type="button" onClick={clearFilters} className="text-xs font-semibold text-ink-muted hover:text-ink underline-offset-2 hover:underline">
            Clear all
          </button>
        </div>
      )}

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
          </p>
          <ul data-tour="browse-results" className="grid grid-cols-2 sm:grid-cols-3 lg:grid-cols-4 gap-4">
            {listings.map((l) => (
              <li key={l.id}>
                <ListingCard listing={l} />
              </li>
            ))}
          </ul>
        </>
      )}
    </div>
  );
};
