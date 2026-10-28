import React, { useState, useEffect } from 'react';
import { Link, useSearchParams } from 'react-router-dom';
import {
  Search,
  Filter,
  Sparkles,
  SlidersHorizontal,
  Plus,
  Wrench,
  CheckCircle,
} from 'lucide-react';
import { Listing, ListingCategory, ListingMode } from '@sidekit/shared';
import { sidekitService } from '../services';
import { SampleBadge } from '../components/shared/SampleBadge';

export const BrowseCatalogPage: React.FC = () => {
  const [searchParams, setSearchParams] = useSearchParams();

  const [listings, setListings] = useState<Listing[]>([]);
  const [query, setQuery] = useState(searchParams.get('q') || '');
  const [category, setCategory] = useState<string>(searchParams.get('category') || 'all');
  const [mode, setMode] = useState<string>(searchParams.get('mode') || 'all');
  const [tower, setTower] = useState<string>(searchParams.get('tower') || '');
  const [onlyAvailable, setOnlyAvailable] = useState(false);
  const [isLoading, setIsLoading] = useState(true);

  const fetchListings = async () => {
    try {
      setIsLoading(true);
      const data = await sidekitService.searchListings({
        query: query.trim() || undefined,
        category: category !== 'all' ? (category as ListingCategory) : undefined,
        mode: mode !== 'all' ? (mode as ListingMode) : undefined,
        tower: tower || undefined,
        onlyAvailable,
      });
      setListings(data);
    } catch (err) {
      console.error(err);
    } finally {
      setIsLoading(false);
    }
  };

  useEffect(() => {
    fetchListings();
  }, [category, mode, tower, onlyAvailable]);

  const handleSearchSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    fetchListings();
  };

  const categories = [
    { id: 'all', label: 'All Categories' },
    { id: 'diy', label: 'DIY & Tools' },
    { id: 'cleaning', label: 'Deep Cleaning' },
    { id: 'gardening', label: 'Gardening' },
    { id: 'electronics', label: 'Electronics' },
    { id: 'general', label: 'General Household' },
  ];

  const modes = [
    { id: 'all', label: 'All Modes' },
    { id: 'lend', label: 'Free Borrow' },
    { id: 'rent', label: 'Rental' },
    { id: 'sell_used', label: 'Pre-Owned For Sale' },
  ];

  return (
    <div className="max-w-7xl mx-auto py-8 px-4 sm:px-6 lg:px-8 space-y-6">
      {/* Top Banner & Search */}
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4 pb-4 border-b border-surface-border">
        <div>
          <h1 className="text-2xl sm:text-3xl font-bold tracking-tight text-ink">
            Palm Grove Community Catalog
          </h1>
          <p className="text-xs text-ink-muted mt-1">
            Browse tools, equipment and appliances shared by verified residents in your towers.
          </p>
        </div>

        <Link
          to="/my/listings/new"
          className="py-2.5 px-4 bg-evergreen hover:bg-evergreen-dark text-white rounded-xl text-xs font-semibold flex items-center gap-1.5 shadow-sm shrink-0 self-start sm:self-auto"
        >
          <Plus className="w-4 h-4" />
          <span>List an Item</span>
        </Link>
      </div>

      {/* Filter and Search Bar */}
      <div className="space-y-4">
        {/* Search Input */}
        <form onSubmit={handleSearchSubmit} className="flex gap-2">
          <div className="relative flex-1">
            <Search className="w-4 h-4 text-ink-muted absolute left-3 top-3" />
            <input
              type="text"
              value={query}
              onChange={(e) => setQuery(e.target.value)}
              placeholder="Search by tool name, model or keyword (e.g. Bosch, ladder, trimmer)..."
              className="w-full pl-9 pr-3 py-2 text-xs sm:text-sm bg-surface border border-surface-border rounded-xl focus-ring"
            />
          </div>
          <button
            type="submit"
            className="px-4 py-2 bg-surface hover:bg-surface-secondary border border-surface-border rounded-xl text-xs font-semibold text-ink"
          >
            Search
          </button>
        </form>

        {/* Faceted Filter Chips (FIX-BROWSE-01) */}
        <div className="flex flex-wrap items-center gap-2">
          <div className="flex items-center gap-1 overflow-x-auto py-1 max-w-full">
            {categories.map((c) => (
              <button
                key={c.id}
                type="button"
                onClick={() => setCategory(c.id)}
                className={`px-3 py-1.5 rounded-xl text-xs font-semibold whitespace-nowrap transition-colors border ${
                  category === c.id
                    ? 'bg-evergreen text-white border-evergreen shadow-sm'
                    : 'bg-surface text-ink border-surface-border hover:bg-surface-secondary'
                }`}
              >
                {c.label}
              </button>
            ))}
          </div>

          <div className="h-4 w-px bg-surface-border hidden sm:block mx-1" />

          {/* Mode Chips */}
          <div className="flex items-center gap-1 overflow-x-auto py-1 max-w-full">
            {modes.map((m) => (
              <button
                key={m.id}
                type="button"
                onClick={() => setMode(m.id)}
                className={`px-3 py-1.5 rounded-xl text-xs font-semibold whitespace-nowrap transition-colors border ${
                  mode === m.id
                    ? 'bg-ink text-white border-ink shadow-sm'
                    : 'bg-surface text-ink border-surface-border hover:bg-surface-secondary'
                }`}
              >
                {m.label}
              </button>
            ))}
          </div>

          {/* Tower Selector */}
          <select
            value={tower}
            onChange={(e) => setTower(e.target.value)}
            className="px-3 py-1.5 rounded-xl text-xs font-semibold bg-surface border border-surface-border text-ink focus-ring"
          >
            <option value="">All Towers</option>
            <option value="Tower A">Tower A</option>
            <option value="Tower B">Tower B</option>
            <option value="Tower C">Tower C</option>
          </select>
        </div>
      </div>

      {/* Grid of Listings */}
      {isLoading ? (
        <div className="py-20 text-center text-xs text-ink-muted">Loading community catalog...</div>
      ) : listings.length === 0 ? (
        <div className="py-20 text-center bg-surface rounded-3xl border border-surface-border space-y-3">
          <Wrench className="w-8 h-8 text-ink-muted mx-auto" />
          <h3 className="text-base font-bold text-ink">No items found</h3>
          <p className="text-xs text-ink-muted max-w-md mx-auto">
            Try adjusting your search keywords or clearing active category filters.
          </p>
          <button
            type="button"
            onClick={() => {
              setQuery('');
              setCategory('all');
              setMode('all');
              setTower('');
            }}
            className="px-4 py-2 bg-surface-secondary hover:bg-surface-border text-xs font-semibold rounded-xl text-ink"
          >
            Reset Filters
          </button>
        </div>
      ) : (
        <div className="grid grid-cols-1 sm:grid-cols-2 md:grid-cols-3 lg:grid-cols-4 gap-4">
          {listings.map((l) => {
            const isLend = l.mode === 'lend';
            const isRent = l.mode === 'rent';
            const isSell = l.mode === 'sell_used';

            return (
              <Link
                key={l.id}
                to={`/listing/${l.id}`}
                className="bg-surface rounded-2xl border border-surface-border overflow-hidden hover:border-evergreen/40 hover:shadow-md transition-all flex flex-col group"
              >
                {/* Image */}
                <div className="aspect-[4/3] bg-surface-secondary relative overflow-hidden">
                  <img
                    src={l.photos[0]}
                    alt={l.title}
                    className="w-full h-full object-cover group-hover:scale-105 transition-transform duration-300"
                    loading="lazy"
                  />
                  <div className="absolute top-2.5 left-2.5 flex items-center gap-1.5">
                    <SampleBadge />
                    {isLend ? (
                      <span className="text-[10px] font-extrabold px-2 py-0.5 rounded bg-emerald-600 text-white uppercase tracking-wider">
                        FREE BORROW
                      </span>
                    ) : isRent ? (
                      <span className="text-[10px] font-bold px-2 py-0.5 rounded bg-blue-600 text-white uppercase tracking-wider">
                        RENT
                      </span>
                    ) : (
                      <span className="text-[10px] font-bold px-2 py-0.5 rounded bg-purple-600 text-white uppercase tracking-wider">
                        PRE-OWNED
                      </span>
                    )}
                  </div>

                  <div className="absolute bottom-2 right-2 px-2 py-0.5 rounded bg-ink/80 text-white text-[10px] font-semibold backdrop-blur-sm">
                    {l.ownerTower}
                  </div>
                </div>

                {/* Details */}
                <div className="p-4 flex-1 flex flex-col justify-between space-y-3">
                  <div>
                    <h3 className="text-sm font-bold text-ink line-clamp-1 group-hover:text-evergreen transition-colors">
                      {l.title}
                    </h3>
                    <p className="text-xs text-ink-muted line-clamp-2 mt-1 leading-relaxed">
                      {l.description}
                    </p>
                  </div>

                  <div className="pt-2 border-t border-surface-border flex items-center justify-between text-xs">
                    <span className="text-ink-muted">
                      By <strong>{l.ownerDisplayName}</strong>
                    </span>
                    <span className="font-extrabold text-ink">
                      {isLend ? (
                        <span className="text-evergreen">₹0</span>
                      ) : l.price === null ? (
                        <span className="text-ink-muted text-[11px]">Unpriced</span>
                      ) : (
                        `₹${l.price}${l.priceUnit === 'day' ? '/day' : ''}`
                      )}
                    </span>
                  </div>
                </div>
              </Link>
            );
          })}
        </div>
      )}
    </div>
  );
};

