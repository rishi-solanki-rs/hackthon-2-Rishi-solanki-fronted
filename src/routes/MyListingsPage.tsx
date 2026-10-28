import React, { useState, useEffect } from 'react';
import { Link } from 'react-router-dom';
import {
  Plus,
  Edit,
  Pause,
  Play,
  XCircle,
  Wrench,
  AlertTriangle,
  Layers,
} from 'lucide-react';
import { Listing, ListingStatus } from '@sidekit/shared';
import { sidekitService } from '../services';
import { SampleBadge } from '../components/shared/SampleBadge';
import { useAuth } from '../context/AuthContext';

export const MyListingsPage: React.FC = () => {
  const { currentUser } = useAuth();
  const [listings, setListings] = useState<Listing[]>([]);
  const [activeTab, setActiveTab] = useState<'all' | 'active' | 'paused' | 'closed'>('all');
  const [isLoading, setIsLoading] = useState(true);

  const fetchMyListings = async () => {
    try {
      setIsLoading(true);
      const all = await sidekitService.searchListings();
      const my = all.filter((l) => l.ownerId === currentUser?.id);
      setListings(my);
    } catch (err) {
      console.error(err);
    } finally {
      setIsLoading(false);
    }
  };

  useEffect(() => {
    fetchMyListings();
  }, [currentUser]);

  const handleTogglePause = async (listing: Listing) => {
    try {
      const nextStatus: ListingStatus = listing.status === 'active' ? 'paused' : 'active';
      await sidekitService.setListingStatus(listing.id, nextStatus);
      fetchMyListings();
    } catch (err) {
      console.error(err);
    }
  };

  const handleCloseListing = async (id: string) => {
    if (window.confirm('Are you sure you want to close this listing? It will no longer appear in search results.')) {
      try {
        await sidekitService.setListingStatus(id, 'closed');
        fetchMyListings();
      } catch (err) {
        console.error(err);
      }
    }
  };

  const filtered = listings.filter((l) => {
    if (activeTab === 'all') return true;
    return l.status === activeTab;
  });

  return (
    <div className="max-w-5xl mx-auto py-8 px-4 space-y-6">
      {/* Header */}
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4 pb-4 border-b border-surface-border">
        <div>
          <h1 className="text-2xl sm:text-3xl font-bold tracking-tight text-ink">My Shared Items</h1>
          <p className="text-xs text-ink-muted mt-1">
            Manage your tools and equipment currently listed for neighbours in Palm Grove.
          </p>
        </div>

        <Link
          to="/my/listings/new"
          className="py-2.5 px-4 bg-evergreen hover:bg-evergreen-dark text-white rounded-xl text-xs font-semibold flex items-center gap-1.5 shadow-sm shrink-0 self-start sm:self-auto"
        >
          <Plus className="w-4 h-4" />
          <span>Add New Listing</span>
        </Link>
      </div>

      {/* Tabs */}
      <div className="flex items-center gap-2 border-b border-surface-border pb-2">
        {(['all', 'active', 'paused', 'closed'] as const).map((tab) => (
          <button
            key={tab}
            type="button"
            onClick={() => setActiveTab(tab)}
            className={`px-3 py-1.5 rounded-xl text-xs font-bold capitalize transition-colors ${
              activeTab === tab
                ? 'bg-evergreen-light text-evergreen-dark'
                : 'text-ink-muted hover:text-ink'
            }`}
          >
            {tab} ({tab === 'all' ? listings.length : listings.filter((l) => l.status === tab).length})
          </button>
        ))}
      </div>

      {/* List */}
      {isLoading ? (
        <div className="py-16 text-center text-xs text-ink-muted">Loading your listings...</div>
      ) : filtered.length === 0 ? (
        <div className="py-16 text-center bg-surface rounded-3xl border border-surface-border space-y-3">
          <Wrench className="w-8 h-8 text-ink-muted mx-auto" />
          <h3 className="text-sm font-bold text-ink">No {activeTab !== 'all' ? activeTab : ''} listings found</h3>
          <p className="text-xs text-ink-muted max-w-sm mx-auto">
            You don't have any items in this state. List your idle equipment to earn goodwill or modest rent.
          </p>
          <Link
            to="/my/listings/new"
            className="inline-block mt-2 py-2 px-4 bg-evergreen text-white rounded-xl text-xs font-semibold shadow-sm"
          >
            List an Item
          </Link>
        </div>
      ) : (
        <div className="space-y-3">
          {filtered.map((l) => (
            <div
              key={l.id}
              className="p-4 bg-surface rounded-2xl border border-surface-border flex flex-col sm:flex-row sm:items-center justify-between gap-4 shadow-sm"
            >
              <div className="flex items-start sm:items-center gap-3">
                <img
                  src={l.photos[0]}
                  alt={l.title}
                  className="w-16 h-16 rounded-xl object-cover border border-surface-border shrink-0"
                />
                <div className="space-y-1">
                  <div className="flex items-center gap-2 flex-wrap">
                    <h3 className="text-sm font-bold text-ink">{l.title}</h3>
                    <SampleBadge />
                    <span
                      className={`text-[10px] font-bold px-2 py-0.5 rounded uppercase ${
                        l.status === 'active'
                          ? 'bg-emerald-50 text-emerald-800 border border-emerald-200'
                          : l.status === 'paused'
                          ? 'bg-amber-50 text-amber-800 border border-amber-200'
                          : 'bg-slate-100 text-slate-700'
                      }`}
                    >
                      {l.status}
                    </span>
                  </div>

                  <div className="text-xs text-ink-muted flex items-center gap-2 flex-wrap">
                    <span>Quantity: <strong>{l.totalQuantity}</strong></span>
                    <span>·</span>
                    <span className="capitalize">{l.mode.replace('_', ' ')}</span>
                    <span>·</span>
                    <span>
                      {l.mode === 'lend'
                        ? 'Free Borrow'
                        : l.price === null
                        ? 'Unpriced'
                        : `₹${l.price}${l.priceUnit === 'day' ? '/day' : ''}`}
                    </span>
                  </div>

                  {l.reportsCount > 0 && (
                    <div className="text-[11px] text-amber-700 flex items-center gap-1 font-semibold">
                      <AlertTriangle className="w-3.5 h-3.5" />
                      <span>{l.reportsCount} Community Report(s)</span>
                    </div>
                  )}
                </div>
              </div>

              {/* Action Buttons */}
              <div className="flex items-center gap-2 pt-2 sm:pt-0 border-t sm:border-t-0 border-surface-border">
                <Link
                  to={`/my/listings/${l.id}/edit`}
                  className="p-2 text-ink-muted hover:text-ink hover:bg-surface-secondary rounded-xl border border-surface-border text-xs flex items-center gap-1"
                  title="Edit details"
                >
                  <Edit className="w-3.5 h-3.5" />
                  <span className="sm:hidden">Edit</span>
                </Link>

                <button
                  type="button"
                  onClick={() => handleTogglePause(l)}
                  className="px-3 py-1.5 text-ink-muted hover:text-ink hover:bg-surface-secondary rounded-xl border border-surface-border text-xs font-semibold flex items-center gap-1"
                >
                  {l.status === 'active' ? (
                    <>
                      <Pause className="w-3.5 h-3.5 text-amber-600" />
                      <span>Pause</span>
                    </>
                  ) : (
                    <>
                      <Play className="w-3.5 h-3.5 text-emerald-600" />
                      <span>Resume</span>
                    </>
                  )}
                </button>

                {l.status !== 'closed' && (
                  <button
                    type="button"
                    onClick={() => handleCloseListing(l.id)}
                    className="p-2 text-ink-muted hover:text-rose-600 hover:bg-rose-50 rounded-xl border border-surface-border text-xs"
                    title="Close listing"
                  >
                    <XCircle className="w-3.5 h-3.5" />
                  </button>
                )}
              </div>
            </div>
          ))}
        </div>
      )}
    </div>
  );
};

