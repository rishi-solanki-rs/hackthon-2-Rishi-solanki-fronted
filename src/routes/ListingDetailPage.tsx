import React, { useState, useEffect, useRef } from 'react';
import { useParams, useNavigate, Link } from 'react-router-dom';
import { ArrowLeft, Edit, Flag, CheckCircle2, AlertCircle, Star, MapPin } from 'lucide-react';
import { CATEGORY_LABELS, Listing, ListingCategory, Request, User } from '@sidekit/shared';
import { sidekitService } from '../services';
import { SampleBadge } from '../components/shared/SampleBadge';
import { PRICE_NOT_AVAILABLE } from '../components/shared/listingPrice';
import { ListingCard } from '../components/shared/ListingCard';
import { ItemHero } from '../components/brand/itemIcons';
import { BrandLoader, EmptyState } from '../components/brand/BrandStates';
import { useAuth } from '../context/AuthContext';
import { MODE_STYLES } from '../components/shared/modeStyles';

const REPORT_REASONS = ['Unsafe or broken tool', 'Prohibited item', 'Inaccurate description', 'Unreasonable pricing'];

/** Closes a modal on Escape and moves focus into it when it opens. */
function useDialog(open: boolean, onClose: () => void) {
  const ref = useRef<HTMLDivElement>(null);
  useEffect(() => {
    if (!open) return;
    const previous = document.activeElement as HTMLElement | null;
    ref.current?.querySelector<HTMLElement>('input, textarea, select, button')?.focus();
    const onKey = (e: KeyboardEvent) => e.key === 'Escape' && onClose();
    window.addEventListener('keydown', onKey);
    return () => {
      window.removeEventListener('keydown', onKey);
      previous?.focus();
    };
  }, [open]);
  return ref;
}

export const ListingDetailPage: React.FC = () => {
  const { id } = useParams<{ id: string }>();
  const navigate = useNavigate();
  const { currentUser } = useAuth();
  const [listing, setListing] = useState<Listing | null>(null);
  const [owner, setOwner] = useState<User | null>(null);
  const [similar, setSimilar] = useState<Listing[]>([]);
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
  const [reportReason, setReportReason] = useState(REPORT_REASONS[0]);
  const [reportSuccess, setReportSuccess] = useState('');
  const [reportError, setReportError] = useState('');

  const [activeRequest, setActiveRequest] = useState<Request | null>(null);

  const requestRef = useDialog(isRequestOpen, () => setIsRequestOpen(false));
  const reportRef = useDialog(isReportOpen, () => setIsReportOpen(false));

  useEffect(() => {
    if (!id) return;
    setIsLoading(true);
    setOwner(null);
    setSimilar([]);
    sidekitService
      .getListing(id)
      .then((data) => {
        setListing(data || null);
        setIsLoading(false);
        if (!data) return;
        sidekitService.getUserById(data.ownerId).then((u) => setOwner(u || null)).catch(() => undefined);
        sidekitService
          .searchListings({ category: data.category })
          .then((all) => {
            const others = all.filter((l) => l.id !== data.id);
            const sameItem = others.filter((l) => l.itemKey === data.itemKey);
            const rest = others.filter((l) => l.itemKey !== data.itemKey);
            setSimilar([...sameItem, ...rest].slice(0, 4));
          })
          .catch(() => undefined);
      })
      .catch(() => setIsLoading(false));
    sidekitService
      .getMyRequests()
      .then((mine) =>
        setActiveRequest(mine.find((r) => r.listingId === id && (r.status === 'pending' || r.status === 'accepted' || r.status === 'handed_over')) || null)
      )
      .catch(() => setActiveRequest(null));

    const tomorrow = new Date();
    tomorrow.setDate(tomorrow.getDate() + 1);
    const dayAfter = new Date();
    dayAfter.setDate(dayAfter.getDate() + 2);
    setNeededFrom(tomorrow.toISOString().split('T')[0]);
    setNeededTo(dayAfter.toISOString().split('T')[0]);
  }, [id]);

  const handleRequest = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!listing || submitting) return;
    setSubmitting(true);
    setSubmitError('');
    try {
      const kind = listing.mode === 'lend' ? 'borrow' : listing.mode === 'rent' ? 'rent' : 'buy';
      await sidekitService.createRequest({
        listingId: listing.id,
        kind,
        requestedQuantity,
        neededFrom: kind !== 'buy' ? neededFrom : undefined,
        neededTo: kind !== 'buy' ? neededTo : undefined,
        note: requestNote.trim() || undefined,
      });
      setSubmitSuccess('Request sent! Tracking in My Requests.');
      setTimeout(() => {
        setIsRequestOpen(false);
        navigate('/my/requests');
      }, 1500);
    } catch (err: any) {
      setSubmitError(err.message || 'Failed to send request.');
    }
    setSubmitting(false);
  };

  const handleReport = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!listing) return;
    setReportError('');
    try {
      const res = await sidekitService.reportListing(listing.id, reportReason);
      setReportSuccess(res.hidden ? 'Thanks — the listing is now hidden until the Estate Office reviews it.' : 'Report submitted. Thank you.');
      setTimeout(() => {
        setIsReportOpen(false);
        if (res.hidden) navigate('/browse');
      }, 2000);
    } catch (err: any) {
      setReportError(err?.message || 'Could not submit the report.');
    }
  };

  if (isLoading) return <BrandLoader label="Loading listing…" />;
  if (!listing)
    return (
      <div className="max-w-4xl mx-auto py-10 px-4">
        <EmptyState
          illustration="not-found"
          title="Listing not found"
          description="It may have been closed by its owner, be awaiting approval, or have been removed by moderation."
          action={
            <Link to="/browse" className="text-sm text-evergreen font-semibold hover:underline">
              ← Browse Catalog
            </Link>
          }
        />
      </div>
    );

  const isOwner = currentUser?.id === listing.ownerId;
  const isHidden = listing.moderationStatus === 'hidden_by_admin';
  const isPrivate = listing.moderationStatus === 'pending_review' || listing.moderationStatus === 'rejected';
  const isUnavailable = listing.status !== 'active' || isHidden || isPrivate;
  const mode = MODE_STYLES[listing.mode];
  const isSell = listing.mode === 'sell_used';
  const categoryLabel = CATEGORY_LABELS[listing.category as ListingCategory] || listing.category;
  const priceDisplay =
    listing.mode === 'lend' ? (
      <span className="text-2xl font-bold text-emerald-600">
        Free <span className="text-sm font-normal text-ink-muted">to borrow</span>
      </span>
    ) : listing.price === null ? (
      <span className="text-sm text-ink-muted italic">{PRICE_NOT_AVAILABLE} — ask the owner</span>
    ) : (
      <span className="text-2xl font-bold text-ink">
        ₹{listing.price.toLocaleString('en-IN')}
        <span className="text-sm font-normal text-ink-muted">{listing.priceUnit === 'day' ? ' / day' : ''}</span>
        {listing.isSample && <SampleBadge className="ml-2 align-middle" />}
      </span>
    );

  return (
    <div className="max-w-5xl mx-auto py-8 px-4 space-y-8">
      <button onClick={() => navigate(-1)} className="flex items-center gap-1.5 text-xs text-ink-muted hover:text-ink focus-ring rounded">
        <ArrowLeft className="w-3.5 h-3.5" />
        Back
      </button>

      {isOwner && listing.moderationStatus === 'pending_review' && (
        <p role="status" className="p-3 bg-amber-50 border border-amber-200 rounded-xl text-xs text-amber-900">
          Awaiting approval — only you and the Estate Office can see this listing for now.
        </p>
      )}
      {isOwner && listing.moderationStatus === 'rejected' && (
        <p role="status" className="p-3 bg-amber-50 border border-amber-200 rounded-xl text-xs text-amber-900">
          Not approved: {listing.rejectionReason || 'No reason given.'} Edit the listing to resubmit it.
        </p>
      )}

      <div className="grid grid-cols-1 md:grid-cols-2 gap-8">
        {/* Photo */}
        <div className="relative rounded-2xl overflow-hidden border border-surface-border aspect-[4/3] md:sticky md:top-20 self-start">
          <ItemHero itemKey={listing.itemKey} title={listing.title} category={listing.category} imageUrl={listing.photos?.[0]} className="w-full h-full" />
          <div className="absolute top-3 left-3 flex gap-2">
            {listing.isSample && <SampleBadge />}
            <span className={`text-[11px] font-bold px-2 py-0.5 rounded uppercase tracking-wide ${mode.solid}`}>{mode.label}</span>
          </div>
        </div>

        {/* Details */}
        <div className="space-y-5">
          <div>
            <Link
              to={`/browse?category=${listing.category}`}
              className="text-xs font-semibold text-evergreen uppercase tracking-wider mb-1 inline-block hover:underline focus-ring rounded"
            >
              {categoryLabel}
            </Link>
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
              <span className="text-ink-muted block">Quantity</span>
              <span className="font-semibold text-ink mt-0.5 block">
                {listing.totalQuantity} unit{listing.totalQuantity !== 1 ? 's' : ''}
              </span>
            </div>
          </div>

          {/* Owner card */}
          <Link
            to={`/u/${listing.ownerId}`}
            className="flex items-center gap-3 p-3 bg-surface border border-surface-border rounded-xl hover:border-evergreen/40 transition-colors focus-ring"
          >
            <span className="w-10 h-10 rounded-full bg-evergreen/10 text-evergreen font-bold flex items-center justify-center shrink-0" aria-hidden="true">
              {(listing.ownerDisplayName || '?').charAt(0)}
            </span>
            <span className="flex-1 min-w-0">
              <span className="block text-sm font-semibold text-ink">{listing.ownerDisplayName}</span>
              <span className="flex items-center gap-2 text-xs text-ink-muted">
                <span className="inline-flex items-center gap-0.5">
                  <MapPin className="w-3 h-3" aria-hidden="true" />
                  {listing.ownerTower}
                </span>
                {owner && (
                  <>
                    <span className="inline-flex items-center gap-0.5">
                      <Star className="w-3 h-3 text-amber-500 fill-amber-400" aria-hidden="true" />
                      {owner.rating.toFixed(1)} ({owner.reviewCount})
                    </span>
                    <span>{owner.itemsSharedCount} items shared</span>
                  </>
                )}
              </span>
            </span>
            <span className="text-xs font-semibold text-evergreen">Profile</span>
          </Link>

          {listing.pickupNote && (
            <div className="p-3 bg-surface border border-surface-border rounded-xl text-xs">
              <span className="font-semibold text-ink block mb-1">Pickup</span>
              <span className="text-ink-muted">{listing.pickupNote}</span>
            </div>
          )}

          {listing.comfortRules && Object.keys(listing.comfortRules).some((k) => (listing.comfortRules as any)[k]) && (
            <div className="p-3 bg-surface border border-surface-border rounded-xl text-xs space-y-1">
              <span className="font-semibold text-ink block">Owner rules</span>
              {listing.comfortRules.returnClean && <p className="text-ink-muted">· Return item clean</p>}
              {listing.comfortRules.noCommercialUse && <p className="text-ink-muted">· Personal use only</p>}
              {listing.comfortRules.depositRequired && <p className="text-ink-muted">· Refundable deposit: ₹{listing.comfortRules.depositAmount}</p>}
            </div>
          )}

          {/* Actions */}
          <div className="space-y-2 pt-1">
            {isOwner ? (
              <div className="flex items-center justify-between p-3 bg-surface-secondary rounded-xl border border-surface-border text-xs">
                <span className="text-ink-muted">{isHidden ? 'This listing is under moderation review and cannot be edited.' : 'This is your listing'}</span>
                {!isHidden && (
                  <Link to={`/my/listings/${listing.id}/edit`} className="flex items-center gap-1 text-ink font-semibold hover:text-evergreen">
                    <Edit className="w-3.5 h-3.5" />
                    Edit
                  </Link>
                )}
              </div>
            ) : activeRequest ? (
              <Link
                to="/my/requests"
                className="w-full py-3 flex items-center justify-center gap-2 bg-surface-secondary border border-surface-border text-ink rounded-xl font-semibold text-sm"
              >
                <CheckCircle2 className="w-4 h-4 text-evergreen" aria-hidden="true" />
                Request already sent · track it
              </Link>
            ) : isUnavailable ? (
              <div className="w-full py-3 text-center bg-surface-secondary border border-surface-border text-ink-muted rounded-xl text-sm">
                Not available right now
              </div>
            ) : (
              <button
                onClick={() => setIsRequestOpen(true)}
                className="w-full py-3 bg-brand hover:bg-brand-dark text-white rounded-xl font-semibold text-sm transition-colors focus-ring"
              >
                {listing.mode === 'lend' ? 'Request free borrow' : listing.mode === 'rent' ? 'Request rental' : 'Request to buy'}
              </button>
            )}

            {!isOwner && !isPrivate && !isHidden && (
              <button
                onClick={() => setIsReportOpen(true)}
                className="flex items-center gap-1.5 text-xs text-ink-muted hover:text-rose-600 transition-colors focus-ring rounded"
              >
                <Flag className="w-3 h-3" />
                Report listing
              </button>
            )}
          </div>
        </div>
      </div>

      {similar.length > 0 && (
        <section aria-labelledby="similar-heading" className="space-y-3">
          <div className="flex items-center justify-between">
            <h2 id="similar-heading" className="text-base font-bold text-ink">
              More in {categoryLabel}
            </h2>
            <Link to={`/browse?category=${listing.category}`} className="text-xs font-semibold text-evergreen hover:underline">
              See all
            </Link>
          </div>
          <ul className="grid grid-cols-2 sm:grid-cols-4 gap-3">
            {similar.map((l) => (
              <li key={l.id}>
                <ListingCard listing={l} compact />
              </li>
            ))}
          </ul>
        </section>
      )}

      {/* Request Modal */}
      {isRequestOpen && (
        <div className="fixed inset-0 z-50 flex items-end sm:items-center justify-center p-4 bg-black/50 backdrop-blur-sm">
          <div
            ref={requestRef}
            role="dialog"
            aria-modal="true"
            aria-labelledby="request-dialog-title"
            className="bg-surface rounded-2xl w-full max-w-md p-6 shadow-2xl border border-surface-border"
          >
            <h3 id="request-dialog-title" className="text-base font-bold text-ink mb-1">
              Send request
            </h3>
            <p className="text-xs text-ink-muted mb-4">
              {listing.title} · {listing.ownerDisplayName}
            </p>

            {submitSuccess ? (
              <div role="status" className="flex items-center gap-2 p-3 bg-emerald-50 border border-emerald-200 rounded-xl text-xs text-emerald-800">
                <CheckCircle2 className="w-4 h-4 text-emerald-600 shrink-0" />
                {submitSuccess}
              </div>
            ) : (
              <form onSubmit={handleRequest} className="space-y-3">
                {submitError && (
                  <div role="alert" className="flex items-start gap-2 p-3 bg-red-50 border border-red-200 rounded-xl text-xs text-red-700">
                    <AlertCircle className="w-4 h-4 shrink-0 mt-0.5" />
                    {submitError}
                  </div>
                )}

                {!isSell && (
                  <div className="grid grid-cols-2 gap-3">
                    <div>
                      <label htmlFor="req-from" className="block text-xs font-semibold text-ink mb-1">
                        From *
                      </label>
                      <input
                        id="req-from"
                        type="date"
                        value={neededFrom}
                        onChange={(e) => setNeededFrom(e.target.value)}
                        className="w-full px-2.5 py-1.5 text-xs bg-surface-secondary border border-surface-border rounded-lg focus-ring font-mono"
                        required
                      />
                    </div>
                    <div>
                      <label htmlFor="req-to" className="block text-xs font-semibold text-ink mb-1">
                        To *
                      </label>
                      <input
                        id="req-to"
                        type="date"
                        value={neededTo}
                        min={neededFrom}
                        onChange={(e) => setNeededTo(e.target.value)}
                        className="w-full px-2.5 py-1.5 text-xs bg-surface-secondary border border-surface-border rounded-lg focus-ring font-mono"
                        required
                      />
                    </div>
                  </div>
                )}

                <div>
                  <label htmlFor="req-qty" className="block text-xs font-semibold text-ink mb-1">
                    Quantity
                  </label>
                  <input
                    id="req-qty"
                    type="number"
                    min="1"
                    max={listing.totalQuantity}
                    value={requestedQuantity}
                    onChange={(e) => setRequestedQuantity(Math.max(1, parseInt(e.target.value) || 1))}
                    className="w-24 px-2.5 py-1.5 text-xs bg-surface-secondary border border-surface-border rounded-lg focus-ring font-mono"
                  />
                </div>

                <div>
                  <label htmlFor="req-note" className="block text-xs font-semibold text-ink mb-1">
                    Note to owner
                  </label>
                  <textarea
                    id="req-note"
                    rows={2}
                    value={requestNote}
                    onChange={(e) => setRequestNote(e.target.value)}
                    placeholder="Hi, I need this for..."
                    className="w-full p-2.5 text-xs bg-surface-secondary border border-surface-border rounded-lg focus-ring resize-none"
                  />
                </div>

                <div className="flex justify-end gap-2 pt-1">
                  <button type="button" onClick={() => setIsRequestOpen(false)} className="px-4 py-2 text-xs text-ink-muted hover:bg-surface-secondary rounded-lg">
                    Cancel
                  </button>
                  <button
                    type="submit"
                    disabled={submitting}
                    className="px-5 py-2 text-xs font-semibold bg-brand hover:bg-brand-dark text-white rounded-xl disabled:opacity-50"
                  >
                    {submitting ? 'Sending…' : 'Send request'}
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
          <div
            ref={reportRef}
            role="dialog"
            aria-modal="true"
            aria-labelledby="report-dialog-title"
            className="bg-surface rounded-2xl max-w-sm w-full p-6 shadow-2xl border border-surface-border"
          >
            <h3 id="report-dialog-title" className="text-sm font-bold text-ink mb-1">
              Report listing
            </h3>
            <p className="text-xs text-ink-muted mb-4">Reports from 3 different residents hide a listing until the Estate Office reviews it.</p>

            {reportSuccess ? (
              <div role="status" className="p-3 bg-emerald-50 border border-emerald-200 rounded-xl text-xs text-emerald-800">
                {reportSuccess}
              </div>
            ) : (
              <form onSubmit={handleReport} className="space-y-3">
                {reportError && (
                  <p role="alert" className="p-2.5 bg-red-50 border border-red-200 rounded-lg text-xs text-red-700">
                    {reportError}
                  </p>
                )}
                <fieldset className="space-y-1.5">
                  <legend className="sr-only">Reason</legend>
                  {REPORT_REASONS.map((r) => (
                    <label key={r} className="flex items-center gap-2 p-2 rounded-lg hover:bg-surface-secondary cursor-pointer text-xs">
                      <input
                        type="radio"
                        name="report-reason"
                        value={r}
                        checked={reportReason === r}
                        onChange={(e) => setReportReason(e.target.value)}
                        className="text-evergreen"
                      />
                      {r}
                    </label>
                  ))}
                </fieldset>
                <div className="flex justify-end gap-2">
                  <button type="button" onClick={() => setIsReportOpen(false)} className="px-4 py-2 text-xs text-ink-muted hover:bg-surface-secondary rounded-lg">
                    Cancel
                  </button>
                  <button type="submit" className="px-4 py-2 text-xs font-semibold bg-danger hover:bg-danger/90 text-white rounded-xl">
                    Submit report
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
