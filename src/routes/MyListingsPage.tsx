import React, { useState, useEffect } from 'react';
import { Link, useLocation } from 'react-router-dom';
import { Plus, Edit, Pause, Play, X, CheckCircle } from 'lucide-react';
import { Listing } from '@sidekit/shared';
import { sidekitService } from '../services';
import { SampleBadge } from '../components/shared/SampleBadge';
import { listingPriceLabel } from '../components/shared/listingPrice';
import { ItemThumb } from '../components/brand/itemIcons';
import { BrandLoader, EmptyState } from '../components/brand/BrandStates';
import { useAuth } from '../context/AuthContext';

const STATUS_STYLES: Record<string, string> = {
  active: 'bg-emerald-50 text-emerald-700 border-emerald-200',
  paused: 'bg-amber-50 text-amber-700 border-amber-200',
  closed: 'bg-slate-100 text-slate-600 border-slate-200',
};

export const MyListingsPage: React.FC = () => {
  const { currentUser } = useAuth();
  const notice = (useLocation().state as { notice?: string } | null)?.notice;
  const [listings, setListings] = useState<Listing[]>([]);
  const [tab, setTab] = useState<'all' | 'active' | 'paused' | 'closed'>('all');
  const [isLoading, setIsLoading] = useState(true);

  const fetchMyListings = async () => {
    setIsLoading(true);
    try {
      if (currentUser) setListings(await sidekitService.searchListings({ ownerId: currentUser.id }));
    } catch {}
    setIsLoading(false);
  };

  useEffect(() => { fetchMyListings(); }, [currentUser]);

  const [actionError, setActionError] = useState('');

  const togglePause = async (l: Listing) => {
    setActionError('');
    try {
      await sidekitService.setListingStatus(l.id, l.status === 'active' ? 'paused' : 'active');
      fetchMyListings();
    } catch (err: any) { setActionError(err?.message || 'Could not update the listing.'); }
  };

  const closeListing = async (id: string) => {
    if (!window.confirm('Close this listing? It will be hidden from search.')) return;
    setActionError('');
    try { await sidekitService.setListingStatus(id, 'closed'); fetchMyListings(); }
    catch (err: any) { setActionError(err?.message || 'Could not close the listing.'); }
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
          className="flex items-center gap-1.5 px-4 py-2 bg-brand hover:bg-brand-dark text-white rounded-xl text-xs font-semibold">
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

      {notice && (
        <p role="status" className="flex items-center gap-2 p-3 bg-emerald-50 border border-emerald-200 rounded-xl text-xs text-emerald-800">
          <CheckCircle className="w-4 h-4 text-emerald-600 shrink-0" aria-hidden="true" />
          {notice}
        </p>
      )}

      {actionError && (
        <p role="alert" className="p-3 bg-red-50 border border-red-200 rounded-xl text-xs text-red-700">{actionError}</p>
      )}

      {isLoading ? (
        <BrandLoader label="Loading listings…" />
      ) : filtered.length === 0 ? (
        <div className="bg-surface rounded-2xl border border-surface-border">
          <EmptyState
            illustration="no-listings"
            title={`No ${tab !== 'all' ? tab + ' ' : ''}listings`}
            description="Share a tool you rarely use and help a neighbour finish their task."
            action={
              <Link to="/my/listings/new" className="inline-block px-4 py-2 bg-brand text-white rounded-xl text-xs font-semibold">
                List an Item
              </Link>
            }
          />
        </div>
      ) : (
        <div className="space-y-2">
          {filtered.map((l) => (
            <div key={l.id}
              className="bg-surface rounded-xl border border-surface-border p-4 flex flex-col sm:flex-row sm:items-center gap-4">
              <ItemThumb itemKey={l.itemKey} title={l.title} category={l.category} imageUrl={l.photos?.[0]} size={56} />

              <div className="flex-1 min-w-0">
                <div className="flex items-center gap-2 flex-wrap">
                  <h3 className="text-sm font-bold text-ink truncate">{l.title}</h3>
                  {l.isSample && <SampleBadge />}
                  <span className={`text-[10px] font-bold px-2 py-0.5 rounded border capitalize ${STATUS_STYLES[l.status]}`}>
                    {l.status}
                  </span>
                  {l.moderationStatus === 'hidden_by_admin' && (
                    <span className="text-[10px] font-bold px-2 py-0.5 rounded bg-rose-50 text-rose-700 border border-rose-200">
                      Hidden · under review
                    </span>
                  )}
                  {l.moderationStatus === 'pending_review' && (
                    <span className="text-[10px] font-bold px-2 py-0.5 rounded bg-amber-50 text-amber-800 border border-amber-200">
                      Awaiting approval
                    </span>
                  )}
                  {l.moderationStatus === 'rejected' && (
                    <span className="text-[10px] font-bold px-2 py-0.5 rounded bg-slate-100 text-slate-700 border border-slate-200">
                      Not approved
                    </span>
                  )}
                  {l.reportsCount > 0 && (
                    <span className="text-[10px] font-bold px-2 py-0.5 rounded bg-amber-50 text-amber-700 border border-amber-200">
                      {l.reportsCount} report{l.reportsCount > 1 ? 's' : ''}
                    </span>
                  )}
                </div>
                <p className="text-xs text-ink-muted mt-0.5">
                  Qty: {l.totalQuantity} · {listingPriceLabel(l)}
                </p>
                {l.moderationStatus === 'pending_review' && (
                  <p className="text-xs text-amber-800 mt-1">Only you can see this until the Estate Office approves it.</p>
                )}
                {l.moderationStatus === 'rejected' && (
                  <p className="text-xs text-ink-muted mt-1">
                    <span className="font-semibold text-ink">Reason:</span> {l.rejectionReason || 'No reason given.'} Edit the listing to resubmit it.
                  </p>
                )}
              </div>

              <div className="flex items-center gap-2 shrink-0">
                {l.moderationStatus !== 'hidden_by_admin' && (
                  <Link to={`/my/listings/${l.id}/edit`}
                    className="p-2 text-ink-muted hover:text-ink hover:bg-surface-secondary rounded-lg border border-surface-border transition-colors"
                    title="Edit" aria-label={`Edit ${l.title}`}>
                    <Edit className="w-3.5 h-3.5" />
                  </Link>
                )}
                {l.status !== 'closed' && l.moderationStatus !== 'hidden_by_admin' && (
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
