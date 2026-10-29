import React, { useState, useEffect } from 'react';
import { useParams, useNavigate, Link } from 'react-router-dom';
import { ArrowLeft, Edit, Flag, CheckCircle2, AlertCircle } from 'lucide-react';
import { Listing, Request } from '@sidekit/shared';
import { sidekitService } from '../services';
import { SampleBadge } from '../components/shared/SampleBadge';
import { PRICE_NOT_AVAILABLE } from '../components/shared/listingPrice';
import { ItemHero } from '../components/brand/itemIcons';
import { BrandLoader, EmptyState } from '../components/brand/BrandStates';
import { useAuth } from '../context/AuthContext';

const modeBadge = (mode: string) => {
  if (mode === 'lend') return { label: 'Free Borrow', cls: 'bg-brand text-white' };
  if (mode === 'rent') return { label: 'Rental', cls: 'bg-info text-white' };
  return { label: 'Pre-Owned Sale', cls: 'bg-used text-white' };
};

export const ListingDetailPage: React.FC = () => {
  const { id } = useParams<{ id: string }>();
  const navigate = useNavigate();
  const { currentUser } = useAuth();
  const [listing, setListing] = useState<Listing | null>(null);
  const [isLoading, setIsLoading] = useState(true);

  // Request modal
  const [isRequestOpen, setIsRequestOpen] = useState(false);
  const [neededFrom, setNeededFrom] = useState('');
  const [neededTo, setNeededTo] = useState('');
  const [requestedQuantity, setRequestedQuantity] = useState(1);
  const [requestNote, setRequestNote] = useState('');
  const [submitting, setSubmitting] = useState(false);
  const [submitError, setSubmitError] = useState('');
  const [submitSuccess, setSubmitSuccess] = useState('');

  // Report modal
  const [isReportOpen, setIsReportOpen] = useState(false);
  const [reportReason, setReportReason] = useState('Unsafe or broken tool');
  const [reportSuccess, setReportSuccess] = useState('');

  const [activeRequest, setActiveRequest] = useState<Request | null>(null);

  useEffect(() => {
    if (!id) return;
    sidekitService.getListing(id).then((data) => {
      if (data) setListing(data);
      setIsLoading(false);
    }).catch(() => setIsLoading(false));
    sidekitService.getMyRequests()
      .then((mine) => setActiveRequest(
        mine.find((r) => r.listingId === id && (r.status === 'pending' || r.status === 'accepted' || r.status === 'handed_over')) || null
      ))
      .catch(() => setActiveRequest(null));

    const tomorrow = new Date(); tomorrow.setDate(tomorrow.getDate() + 1);
    const dayAfter = new Date(); dayAfter.setDate(dayAfter.getDate() + 2);
    setNeededFrom(tomorrow.toISOString().split('T')[0]);
    setNeededTo(dayAfter.toISOString().split('T')[0]);
  }, [id]);

  const handleRequest = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!listing || submitting) return;
    setSubmitting(true); setSubmitError('');
    try {
      const kind = listing.mode === 'lend' ? 'borrow' : listing.mode === 'rent' ? 'rent' : 'buy';
      await sidekitService.createRequest({
        listingId: listing.id, kind, requestedQuantity,
        neededFrom: kind !== 'buy' ? neededFrom : undefined,
        neededTo: kind !== 'buy' ? neededTo : undefined,
        note: requestNote.trim() || undefined,
      });
      setSubmitSuccess('Request sent! Tracking in My Requests.');
      setTimeout(() => { setIsRequestOpen(false); navigate('/my/requests'); }, 1500);
    } catch (err: any) { setSubmitError(err.message || 'Failed to send request.'); }
    setSubmitting(false);
  };

  const handleReport = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!listing) return;
    try {
      const res = await sidekitService.reportListing(listing.id, reportReason);
      setReportSuccess(res.hidden ? 'Listing hidden after 3+ reports.' : 'Report submitted.');
      setTimeout(() => { setIsReportOpen(false); if (res.hidden) navigate('/browse'); }, 2000);
    } catch (err: any) { alert(err.message); }
  };

  if (isLoading) return <BrandLoader label="Loading listing…" />;
  if (!listing) return (
    <div className="max-w-4xl mx-auto py-10 px-4">
      <EmptyState
        illustration="not-found"
        title="Listing not found"
        description="It may have been closed by its owner or removed by moderation."
        action={<Link to="/browse" className="text-sm text-evergreen font-semibold hover:underline">← Browse Catalog</Link>}
      />
    </div>
  );

  const isOwner = currentUser?.id === listing.ownerId;
  const isHidden = listing.moderationStatus === 'hidden_by_admin';
  const isUnavailable = listing.status !== 'active' || isHidden;
  const badge = modeBadge(listing.mode);
  const isSell = listing.mode === 'sell_used';
  const priceDisplay = listing.mode === 'lend'
    ? <span className="text-2xl font-bold text-emerald-600">₹0 <span className="text-sm font-normal text-ink-muted">Free Borrow</span></span>
    : listing.price === null
    ? <span className="text-sm text-ink-muted italic">{PRICE_NOT_AVAILABLE} — ask the owner</span>
    : <span className="text-2xl font-bold text-ink">₹{listing.price}<span className="text-sm font-normal text-ink-muted">{listing.priceUnit === 'day' ? '/day' : ''}</span></span>;

  return (
    <div className="max-w-4xl mx-auto py-8 px-4 space-y-8">
      <button onClick={() => navigate(-1)} className="flex items-center gap-1.5 text-xs text-ink-muted hover:text-ink">
        <ArrowLeft className="w-3.5 h-3.5" />
        Back
      </button>

      <div className="grid grid-cols-1 md:grid-cols-2 gap-8">
        {/* Photo */}
        <div className="relative rounded-2xl overflow-hidden border border-surface-border aspect-[4/3]">
          <ItemHero itemKey={listing.itemKey} title={listing.title} category={listing.category} imageUrl={listing.photos?.[0]} iconSize={120} className="w-full h-full" />
          <div className="absolute top-3 left-3 flex gap-2">
            {listing.isSample && <SampleBadge />}
            <span className={`text-[11px] font-bold px-2 py-0.5 rounded uppercase tracking-wide ${badge.cls}`}>
              {badge.label}
            </span>
          </div>
        </div>

        {/* Details */}
        <div className="space-y-5">
          <div>
            <p className="text-xs font-semibold text-evergreen uppercase tracking-wider mb-1 capitalize">{listing.category}</p>
            <h1 className="text-xl font-bold text-ink leading-snug">{listing.title}</h1>
            <div className="mt-2">{priceDisplay}</div>
          </div>

          <p className="text-sm text-ink-muted leading-relaxed">{listing.description}</p>

          <div className="grid grid-cols-2 gap-3 text-xs">
            <div className="p-3 bg-surface-secondary rounded-xl">
              <span className="text-ink-muted block">Condition</span>
              <span className="font-semibold text-ink capitalize mt-0.5 block">{listing.condition.replace('_', ' ')}</span>
            </div>
            <div className="p-3 bg-surface-secondary rounded-xl">
              <span className="text-ink-muted block">Available</span>
              <span className="font-semibold text-ink mt-0.5 block">{listing.totalQuantity} unit{listing.totalQuantity !== 1 ? 's' : ''}</span>
            </div>
            <div className="p-3 bg-surface-secondary rounded-xl">
              <span className="text-ink-muted block">Owner</span>
              <Link to={`/u/${listing.ownerId}`} className="font-semibold text-ink mt-0.5 block hover:text-evergreen">
                {listing.ownerDisplayName}
              </Link>
            </div>
            <div className="p-3 bg-surface-secondary rounded-xl">
              <span className="text-ink-muted block">Tower</span>
              <span className="font-semibold text-ink mt-0.5 block">{listing.ownerTower}</span>
            </div>
          </div>

          {listing.pickupNote && (
            <div className="p-3 bg-surface border border-surface-border rounded-xl text-xs">
              <span className="font-semibold text-ink block mb-1">Pickup</span>
              <span className="text-ink-muted">{listing.pickupNote}</span>
            </div>
          )}

          {listing.comfortRules && Object.keys(listing.comfortRules).some((k) => (listing.comfortRules as any)[k]) && (
            <div className="p-3 bg-surface border border-surface-border rounded-xl text-xs space-y-1">
              <span className="font-semibold text-ink block">Owner Rules</span>
              {listing.comfortRules.returnClean && <p className="text-ink-muted">· Return item clean</p>}
              {listing.comfortRules.noCommercialUse && <p className="text-ink-muted">· Personal use only</p>}
              {listing.comfortRules.depositRequired && (
                <p className="text-ink-muted">· Deposit: ₹{listing.comfortRules.depositAmount}</p>
              )}
            </div>
          )}

          {/* Actions */}
          <div className="space-y-2 pt-1">
            {isOwner ? (
              <div className="flex items-center justify-between p-3 bg-surface-secondary rounded-xl border border-surface-border text-xs">
                <span className="text-ink-muted">
                  {isHidden ? 'This listing is under moderation review and cannot be edited.' : 'This is your listing'}
                </span>
                {!isHidden && (
                  <Link to={`/my/listings/${listing.id}/edit`}
                    className="flex items-center gap-1 text-ink font-semibold hover:text-evergreen">
                    <Edit className="w-3.5 h-3.5" />
                    Edit
                  </Link>
                )}
              </div>
            ) : activeRequest ? (
              <Link to="/my/requests"
                className="w-full py-3 flex items-center justify-center gap-2 bg-surface-secondary border border-surface-border text-ink rounded-xl font-semibold text-sm">
                <CheckCircle2 className="w-4 h-4 text-evergreen" aria-hidden="true" />
                Request already sent · track it
              </Link>
            ) : isUnavailable ? (
              <div className="w-full py-3 text-center bg-surface-secondary border border-surface-border text-ink-muted rounded-xl text-sm">
                Not available right now
              </div>
            ) : (
              <button onClick={() => setIsRequestOpen(true)}
                className="w-full py-3 bg-brand hover:bg-brand-dark text-white rounded-xl font-semibold text-sm transition-colors focus-ring">
                {listing.mode === 'lend' ? 'Request Free Borrow' : listing.mode === 'rent' ? 'Request Rental' : 'Request to Buy'}
              </button>
            )}

            {!isOwner && (
              <button onClick={() => setIsReportOpen(true)}
                className="flex items-center gap-1.5 text-xs text-ink-muted hover:text-rose-600 transition-colors">
                <Flag className="w-3 h-3" />
                Report listing
              </button>
            )}
          </div>
        </div>
      </div>

      {/* Request Modal */}
      {isRequestOpen && (
        <div className="fixed inset-0 z-50 flex items-end sm:items-center justify-center p-4 bg-black/50 backdrop-blur-sm">
          <div className="bg-surface rounded-2xl w-full max-w-md p-6 shadow-2xl border border-surface-border">
            <h3 className="text-base font-bold text-ink mb-1">Send Request</h3>
            <p className="text-xs text-ink-muted mb-4">{listing.title} · {listing.ownerDisplayName}</p>

            {submitSuccess ? (
              <div className="flex items-center gap-2 p-3 bg-emerald-50 border border-emerald-200 rounded-xl text-xs text-emerald-800">
                <CheckCircle2 className="w-4 h-4 text-emerald-600 shrink-0" />
                {submitSuccess}
              </div>
            ) : (
              <form onSubmit={handleRequest} className="space-y-3">
                {submitError && (
                  <div className="flex items-start gap-2 p-3 bg-red-50 border border-red-200 rounded-xl text-xs text-red-700">
                    <AlertCircle className="w-4 h-4 shrink-0 mt-0.5" />
                    {submitError}
                  </div>
                )}

                {!isSell && (
                  <div className="grid grid-cols-2 gap-3">
                    <div>
                      <label className="block text-xs font-semibold text-ink mb-1">From *</label>
                      <input type="date" value={neededFrom} onChange={(e) => setNeededFrom(e.target.value)}
                        className="w-full px-2.5 py-1.5 text-xs bg-surface-secondary border border-surface-border rounded-lg focus-ring font-mono" required />
                    </div>
                    <div>
                      <label className="block text-xs font-semibold text-ink mb-1">To *</label>
                      <input type="date" value={neededTo} onChange={(e) => setNeededTo(e.target.value)}
                        className="w-full px-2.5 py-1.5 text-xs bg-surface-secondary border border-surface-border rounded-lg focus-ring font-mono" required />
                    </div>
                  </div>
                )}

                <div>
                  <label className="block text-xs font-semibold text-ink mb-1">Quantity</label>
                  <input type="number" min="1" max={listing.totalQuantity} value={requestedQuantity}
                    onChange={(e) => setRequestedQuantity(Math.max(1, parseInt(e.target.value) || 1))}
                    className="w-24 px-2.5 py-1.5 text-xs bg-surface-secondary border border-surface-border rounded-lg focus-ring font-mono" />
                </div>

                <div>
                  <label className="block text-xs font-semibold text-ink mb-1">Note to owner</label>
                  <textarea rows={2} value={requestNote} onChange={(e) => setRequestNote(e.target.value)}
                    placeholder="Hi, I need this for..."
                    className="w-full p-2.5 text-xs bg-surface-secondary border border-surface-border rounded-lg focus-ring resize-none" />
                </div>

                <div className="flex justify-end gap-2 pt-1">
                  <button type="button" onClick={() => setIsRequestOpen(false)}
                    className="px-4 py-2 text-xs text-ink-muted hover:bg-surface-secondary rounded-lg">Cancel</button>
                  <button type="submit" disabled={submitting}
                    className="px-5 py-2 text-xs font-semibold bg-brand hover:bg-brand-dark text-white rounded-xl disabled:opacity-50">
                    {submitting ? 'Sending...' : 'Send Request'}
                  </button>
                </div>
              </form>
            )}
          </div>
        </div>
      )}

      {/* Report Modal */}
      {isReportOpen && (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/50 backdrop-blur-sm">
          <div className="bg-surface rounded-2xl max-w-sm w-full p-6 shadow-2xl border border-surface-border">
            <h3 className="text-sm font-bold text-ink mb-1">Report Listing</h3>
            <p className="text-xs text-ink-muted mb-4">3 distinct reports will automatically hide this listing.</p>

            {reportSuccess ? (
              <div className="p-3 bg-emerald-50 border border-emerald-200 rounded-xl text-xs text-emerald-800">{reportSuccess}</div>
            ) : (
              <form onSubmit={handleReport} className="space-y-3">
                <div className="space-y-1.5">
                  {['Unsafe or broken tool', 'Prohibited item', 'Inaccurate description', 'Unreasonable pricing'].map((r) => (
                    <label key={r} className="flex items-center gap-2 p-2 rounded-lg hover:bg-surface-secondary cursor-pointer text-xs">
                      <input type="radio" name="rr" value={r} checked={reportReason === r}
                        onChange={(e) => setReportReason(e.target.value)} className="text-evergreen" />
                      {r}
                    </label>
                  ))}
                </div>
                <div className="flex justify-end gap-2">
                  <button type="button" onClick={() => setIsReportOpen(false)}
                    className="px-4 py-2 text-xs text-ink-muted hover:bg-surface-secondary rounded-lg">Cancel</button>
                  <button type="submit"
                    className="px-4 py-2 text-xs font-semibold bg-danger hover:bg-danger/90 text-white rounded-xl">
                    Submit Report
                  </button>
                </div>
              </form>
            )}
          </div>
        </div>
      )}
    </div>
  );
};
