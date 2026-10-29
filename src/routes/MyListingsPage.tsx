import React, { useState, useEffect } from 'react';
import { Link } from 'react-router-dom';
import { Plus, Edit, Pause, Play, X, Package } from 'lucide-react';
import { Listing } from '@sidekit/shared';
import { sidekitService } from '../services';
import { SampleBadge } from '../components/shared/SampleBadge';
import { listingPriceLabel } from '../components/shared/listingPrice';
import { useAuth } from '../context/AuthContext';

const STATUS_STYLES: Record<string, string> = {
  active: 'bg-emerald-50 text-emerald-700 border-emerald-200',
  paused: 'bg-amber-50 text-amber-700 border-amber-200',
  closed: 'bg-slate-100 text-slate-600 border-slate-200',
};

export const MyListingsPage: React.FC = () => {
  const { currentUser } = useAuth();
  const [listings, setListings] = useState<Listing[]>([]);
  const [tab, setTab] = useState<'all' | 'active' | 'paused' | 'closed'>('all');
  const [isLoading, setIsLoading] = useState(true);

  const fetchMyListings = async () => {
    setIsLoading(true);
    try {
      const all = await sidekitService.searchListings();
      setListings(all.filter((l) => l.ownerId === currentUser?.id));
    } catch {}
    setIsLoading(false);
  };

  useEffect(() => { fetchMyListings(); }, [currentUser]);

  const togglePause = async (l: Listing) => {
    try {
      await sidekitService.setListingStatus(l.id, l.status === 'active' ? 'paused' : 'active');
      fetchMyListings();
    } catch {}
  };

  const closeListing = async (id: string) => {
    if (!window.confirm('Close this listing? It will be hidden from search.')) return;
    try { await sidekitService.setListingStatus(id, 'closed'); fetchMyListings(); }
    catch (err: any) { alert(err.message); }
  };

  const counts = { all: listings.length, active: listings.filter(l => l.status === 'active').length, paused: listings.filter(l => l.status === 'paused').length, closed: listings.filter(l => l.status === 'closed').length };
  const filtered = tab === 'all' ? listings : listings.filter((l) => l.status === tab);

  return (
    <div className="max-w-4xl mx-auto py-8 px-4 space-y-6">
      <div className="flex items-center justify-between gap-4">
        <div>
          <h1 className="text-xl font-bold text-ink">My Listings</h1>
          <p className="text-xs text-ink-muted mt-0.5">Items you've shared with the community.</p>
        </div>
        <Link to="/my/listings/new"
          className="flex items-center gap-1.5 px-4 py-2 bg-evergreen hover:bg-evergreen-dark text-white rounded-xl text-xs font-semibold">
          <Plus className="w-3.5 h-3.5" />
          New Listing
        </Link>
      </div>

      {/* Tabs */}
      <div className="flex gap-1 border-b border-surface-border pb-0">
        {(['all', 'active', 'paused', 'closed'] as const).map((t) => (
          <button key={t} onClick={() => setTab(t)}
            className={`px-3 py-2 text-xs font-semibold capitalize rounded-t-lg border-b-2 transition-colors ${
              tab === t ? 'border-evergreen text-evergreen' : 'border-transparent text-ink-muted hover:text-ink'
            }`}>
            {t} <span className="text-[10px]">({counts[t]})</span>
          </button>
        ))}
      </div>

      {isLoading ? (
        <div className="py-16 text-center text-sm text-ink-muted">Loading listings...</div>
      ) : filtered.length === 0 ? (
        <div className="py-16 text-center bg-white rounded-2xl border border-surface-border space-y-3">
          <Package className="w-8 h-8 text-ink-muted mx-auto" />
          <p className="text-sm font-semibold text-ink">No {tab !== 'all' ? tab : ''} listings</p>
          <Link to="/my/listings/new" className="inline-block px-4 py-2 bg-evergreen text-white rounded-xl text-xs font-semibold">
            List an Item
          </Link>
        </div>
      ) : (
        <div className="space-y-2">
          {filtered.map((l) => (
            <div key={l.id}
              className="bg-white rounded-xl border border-surface-border p-4 flex flex-col sm:flex-row sm:items-center gap-4">
              <img src={l.photos[0]} alt={l.title}
                className="w-14 h-14 rounded-xl object-cover border border-surface-border shrink-0" />

              <div className="flex-1 min-w-0">
                <div className="flex items-center gap-2 flex-wrap">
                  <h3 className="text-sm font-bold text-ink truncate">{l.title}</h3>
                  {l.isSample && <SampleBadge />}
                  <span className={`text-[10px] font-bold px-2 py-0.5 rounded border capitalize ${STATUS_STYLES[l.status]}`}>
                    {l.status}
                  </span>
                  {l.reportsCount > 0 && (
                    <span className="text-[10px] font-bold px-2 py-0.5 rounded bg-amber-50 text-amber-700 border border-amber-200">
                      {l.reportsCount} report{l.reportsCount > 1 ? 's' : ''}
                    </span>
                  )}
                </div>
                <p className="text-xs text-ink-muted mt-0.5">
                  Qty: {l.totalQuantity} · {listingPriceLabel(l)}
                </p>
              </div>

              <div className="flex items-center gap-2 shrink-0">
                <Link to={`/my/listings/${l.id}/edit`}
                  className="p-2 text-ink-muted hover:text-ink hover:bg-surface-secondary rounded-lg border border-surface-border transition-colors"
                  title="Edit">
                  <Edit className="w-3.5 h-3.5" />
                </Link>
                {l.status !== 'closed' && (
                  <>
                    <button onClick={() => togglePause(l)}
                      className="p-2 text-ink-muted hover:text-ink hover:bg-surface-secondary rounded-lg border border-surface-border transition-colors"
                      title={l.status === 'active' ? 'Pause' : 'Resume'}>
                      {l.status === 'active' ? <Pause className="w-3.5 h-3.5 text-amber-600" /> : <Play className="w-3.5 h-3.5 text-emerald-600" />}
                    </button>
                    <button onClick={() => closeListing(l.id)}
                      className="p-2 text-ink-muted hover:text-rose-600 hover:bg-rose-50 rounded-lg border border-surface-border transition-colors"
                      title="Close">
                      <X className="w-3.5 h-3.5" />
                    </button>
                  </>
                )}
              </div>
            </div>
          ))}
        </div>
      )}
    </div>
  );
};
