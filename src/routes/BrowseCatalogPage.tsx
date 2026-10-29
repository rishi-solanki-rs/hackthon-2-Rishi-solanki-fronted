import React, { useState, useEffect } from 'react';
import { Link } from 'react-router-dom';
import { Search, Plus, SlidersHorizontal } from 'lucide-react';
import { Listing, ListingCategory, ListingMode } from '@sidekit/shared';
import { sidekitService } from '../services';
import { SampleBadge } from '../components/shared/SampleBadge';
import { listingPriceLabel } from '../components/shared/listingPrice';
import { ItemHero } from '../components/brand/itemIcons';
import { EmptyState, BrandLoader } from '../components/brand/BrandStates';

const CATEGORIES = [
  { id: 'all', label: 'All' },
  { id: 'diy', label: 'DIY & Tools' },
  { id: 'cleaning', label: 'Cleaning' },
  { id: 'gardening', label: 'Gardening' },
  { id: 'electronics', label: 'Electronics' },
  { id: 'general', label: 'General' },
];

const MODES = [
  { id: 'all', label: 'All' },
  { id: 'lend', label: 'Free Borrow' },
  { id: 'rent', label: 'Rent' },
  { id: 'sell_used', label: 'Used Sale' },
];

function modeBadge(mode: string) {
  if (mode === 'lend') return 'bg-emerald-50 text-emerald-700 border-emerald-200';
  if (mode === 'rent') return 'bg-blue-50 text-blue-700 border-blue-200';
  return 'bg-purple-50 text-purple-700 border-purple-200';
}

export const BrowseCatalogPage: React.FC = () => {
  const [listings, setListings] = useState<Listing[]>([]);
  const [query, setQuery] = useState('');
  const [category, setCategory] = useState('all');
  const [mode, setMode] = useState('all');
  const [onlyAvailable, setOnlyAvailable] = useState(false);
  const [isLoading, setIsLoading] = useState(true);

  const [loadError, setLoadError] = useState('');

  const fetchListings = async (q = query) => {
    setIsLoading(true);
    setLoadError('');
    try {
      const data = await sidekitService.searchListings({
        query: q.trim() || undefined,
        category: category !== 'all' ? category as ListingCategory : undefined,
        mode: mode !== 'all' ? mode as ListingMode : undefined,
        onlyAvailable,
      });
      setListings(data.filter((l) => l.status !== 'closed'));
    } catch (err: any) {
      setListings([]);
      setLoadError(err?.message || 'Could not load the catalog.');
    }
    setIsLoading(false);
  };

  useEffect(() => { fetchListings(); }, [category, mode, onlyAvailable]);

  return (
    <div className="max-w-6xl mx-auto py-8 px-4 space-y-6">
      {/* Top */}
      <div className="flex items-center justify-between gap-4">
        <h1 className="text-xl font-bold text-ink">Community Catalog</h1>
        <Link to="/my/listings/new"
          className="flex items-center gap-1.5 px-4 py-2 bg-brand hover:bg-brand-dark text-white rounded-xl text-xs font-semibold">
          <Plus className="w-3.5 h-3.5" />
          List Item
        </Link>
      </div>

      {/* Filters */}
      <div className="space-y-3">
        <form onSubmit={(e) => { e.preventDefault(); fetchListings(); }} className="flex gap-2">
          <div className="relative flex-1">
            <Search className="w-3.5 h-3.5 text-ink-muted absolute left-3 top-2.5" />
            <input
              type="text"
              value={query}
              onChange={(e) => setQuery(e.target.value)}
              placeholder="Search tools, models, categories..."
              className="w-full pl-9 pr-3 py-2 text-sm bg-surface border border-surface-border rounded-xl focus-ring"
            />
          </div>
          <button type="submit"
            className="px-4 py-2 bg-surface border border-surface-border rounded-xl text-xs font-semibold text-ink hover:bg-surface-secondary">
            Search
          </button>
        </form>

        <div className="flex flex-wrap gap-2 items-center">
          {/* Category chips */}
          <div className="flex gap-1 flex-wrap">
            {CATEGORIES.map((c) => (
              <button key={c.id} onClick={() => setCategory(c.id)}
                className={`px-3 py-1 rounded-lg text-xs font-medium transition-colors border ${
                  category === c.id
                    ? 'bg-ink text-canvas border-ink'
                    : 'bg-surface border-surface-border text-ink-muted hover:text-ink'
                }`}>
                {c.label}
              </button>
            ))}
          </div>
          <div className="h-4 w-px bg-surface-border hidden sm:block" />
          <div className="flex gap-1 flex-wrap">
            {MODES.map((m) => (
              <button key={m.id} onClick={() => setMode(m.id)}
                className={`px-3 py-1 rounded-lg text-xs font-medium transition-colors border ${
                  mode === m.id
                    ? 'bg-brand text-white border-evergreen'
                    : 'bg-surface border-surface-border text-ink-muted hover:text-ink'
                }`}>
                {m.label}
              </button>
            ))}
          </div>
          <label className="flex items-center gap-1.5 text-xs text-ink-muted cursor-pointer ml-1">
            <input type="checkbox" checked={onlyAvailable} onChange={(e) => setOnlyAvailable(e.target.checked)}
              className="rounded text-evergreen" />
            Available only
          </label>
        </div>
      </div>

      {/* Grid */}
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
            <button onClick={() => { setQuery(''); setCategory('all'); setMode('all'); setOnlyAvailable(false); }}
              className="text-xs text-evergreen font-semibold hover:underline">
              Clear filters
            </button>
          }
        />
      ) : (
        <>
          <p className="text-xs text-ink-muted">{listings.length} item{listings.length !== 1 ? 's' : ''} found</p>
          <div className="grid grid-cols-2 sm:grid-cols-3 lg:grid-cols-4 gap-4">
            {listings.map((l) => (
              <Link key={l.id} to={`/listing/${l.id}`}
                className="group bg-surface rounded-2xl border border-surface-border overflow-hidden hover:border-evergreen/30 hover:shadow-sm transition-all flex flex-col">
                <div className="aspect-[4/3] relative overflow-hidden">
                  <ItemHero itemKey={l.itemKey} title={l.title} category={l.category} imageUrl={l.photos?.[0]} iconSize={64}
                    className="w-full h-full group-hover:scale-105 transition-transform duration-300" />
                  <span className={`absolute top-2 left-2 text-[10px] font-bold px-2 py-0.5 rounded border ${modeBadge(l.mode)}`}>
                    {l.mode === 'lend' ? 'FREE' : l.mode === 'rent' ? 'RENT' : 'SALE'}
                  </span>
                  {l.isSample && <SampleBadge className="absolute top-2 right-2" />}
                </div>
                <div className="p-3 flex-1 flex flex-col justify-between">
                  <h3 className="text-xs font-bold text-ink line-clamp-2 leading-snug mb-1">{l.title}</h3>
                  <div className="flex items-center justify-between text-xs mt-auto pt-2 border-t border-surface-border">
                    <span className="text-ink-muted">{l.ownerTower}</span>
                    <span className={`font-bold ${l.mode === 'lend' ? 'text-emerald-600' : 'text-ink'}`}>
                      {listingPriceLabel(l)}
                    </span>
                  </div>
                </div>
              </Link>
            ))}
          </div>
        </>
      )}
    </div>
  );
};
