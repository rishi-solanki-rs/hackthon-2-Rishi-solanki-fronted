import React, { useState, useEffect } from 'react';
import { useParams, useNavigate, Link } from 'react-router-dom';
import {
  ShieldAlert,
  Calendar,
  CheckCircle2,
  Clock,
  MapPin,
  Flag,
  Share2,
  ArrowLeft,
  Sparkles,
  Info,
  Edit,
} from 'lucide-react';
import { Listing } from '@sidekit/shared';
import { sidekitService } from '../services';
import { SampleBadge } from '../components/shared/SampleBadge';
import { useAuth } from '../context/AuthContext';

export const ListingDetailPage: React.FC = () => {
  const { id } = useParams<{ id: string }>();
  const navigate = useNavigate();
  const { currentUser } = useAuth();

  const [listing, setListing] = useState<Listing | null>(null);
  const [isLoading, setIsLoading] = useState(true);

  // Request Booking Modal
  const [isRequestModalOpen, setIsRequestModalOpen] = useState(false);
  const [neededFrom, setNeededFrom] = useState('');
  const [neededTo, setNeededTo] = useState('');
  const [requestedQuantity, setRequestedQuantity] = useState(1);
  const [requestNote, setRequestNote] = useState('');
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [submitError, setSubmitError] = useState<string | null>(null);
  const [submitSuccess, setSubmitSuccess] = useState<string | null>(null);

  // Reporting Modal
  const [isReportModalOpen, setIsReportModalOpen] = useState(false);
  const [reportReason, setReportReason] = useState('Unsafe or broken tool');
  const [reportSuccess, setReportSuccess] = useState<string | null>(null);

  useEffect(() => {
    const fetchListing = async () => {
      if (!id) return;
      try {
        setIsLoading(true);
        const data = await sidekitService.getListing(id);
        if (data) setListing(data);
      } catch (err) {
        console.error(err);
      } finally {
        setIsLoading(false);
      }
    };
    fetchListing();

    // Default dates
    const tomorrow = new Date();
    tomorrow.setDate(tomorrow.getDate() + 1);
    const dayAfter = new Date();
    dayAfter.setDate(dayAfter.getDate() + 2);
    setNeededFrom(tomorrow.toISOString().split('T')[0]);
    setNeededTo(dayAfter.toISOString().split('T')[0]);
  }, [id]);

  const handleBookingSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!listing) return;

    // Idempotent protection
    if (isSubmitting) return;

    try {
      setIsSubmitting(true);
      setSubmitError(null);

      const kind = listing.mode === 'lend' ? 'borrow' : listing.mode === 'rent' ? 'rent' : 'buy';

      await sidekitService.createRequest({
        listingId: listing.id,
        kind,
        requestedQuantity,
        neededFrom: kind !== 'buy' ? neededFrom : undefined,
        neededTo: kind !== 'buy' ? neededTo : undefined,
        note: requestNote.trim() || undefined,
      });

      setSubmitSuccess('Booking request sent to owner! Tracking available under My Requests.');
      setTimeout(() => {
        setIsRequestModalOpen(false);
        setSubmitSuccess(null);
        navigate('/my/requests');
      }, 1500);
    } catch (err: any) {
      setSubmitError(err.message || 'Failed to submit booking request.');
    } finally {
      setIsSubmitting(false);
    }
  };

  const handleReportListing = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!listing) return;
    try {
      const res = await sidekitService.reportListing(listing.id, reportReason);
      setReportSuccess(
        res.hidden
          ? 'Listing has received 3+ reports and has been temporarily hidden for admin review.'
          : 'Report submitted for review.'
      );
      setTimeout(() => {
        setIsReportModalOpen(false);
        setReportSuccess(null);
        if (res.hidden) {
          navigate('/browse');
        }
      }, 2000);
    } catch (err: any) {
      alert(err.message || 'Failed to report listing.');
    }
  };

  if (isLoading) {
    return <div className="max-w-4xl mx-auto py-20 text-center text-xs text-ink-muted">Loading listing...</div>;
  }

  if (!listing) {
    return (
      <div className="max-w-4xl mx-auto py-20 text-center space-y-4">
        <h2 className="text-xl font-bold text-ink">Listing not found</h2>
        <Link to="/browse" className="text-evergreen hover:underline text-xs font-semibold">
          ← Back to Community Catalog
        </Link>
      </div>
    );
  }

  const isOwner = currentUser?.id === listing.ownerId;
  const isLend = listing.mode === 'lend';
  const isRent = listing.mode === 'rent';
  const isSell = listing.mode === 'sell_used';

  return (
    <div className="max-w-4xl mx-auto py-8 px-4 space-y-8">
      {/* Back button */}
      <div>
        <button
          onClick={() => navigate(-1)}
          className="text-xs font-semibold text-ink-muted hover:text-ink flex items-center gap-1.5"
        >
          <ArrowLeft className="w-3.5 h-3.5" />
          <span>Back to results</span>
        </button>
      </div>

      <div className="grid grid-cols-1 md:grid-cols-2 gap-8">
        {/* Photos Column */}
        <div className="space-y-4">
          <div className="aspect-[4/3] rounded-3xl bg-surface-secondary overflow-hidden border border-surface-border relative shadow-sm">
            <img
              src={listing.photos[0]}
              alt={listing.title}
              className="w-full h-full object-cover"
            />
            <div className="absolute top-3 left-3 flex items-center gap-2">
              <SampleBadge size="md" />
              {isLend ? (
                <span className="text-xs font-extrabold px-2.5 py-1 rounded bg-emerald-600 text-white uppercase tracking-wider">
                  FREE BORROW
                </span>
              ) : isRent ? (
                <span className="text-xs font-bold px-2.5 py-1 rounded bg-blue-600 text-white uppercase tracking-wider">
                  RENTAL
                </span>
              ) : (
                <span className="text-xs font-bold px-2.5 py-1 rounded bg-purple-600 text-white uppercase tracking-wider">
                  PRE-OWNED SALE
                </span>
              )}
            </div>
          </div>
        </div>

        {/* Details Column */}
        <div className="space-y-6">
          <div>
            <div className="flex items-center justify-between text-xs text-ink-muted mb-1">
              <span className="capitalize font-semibold text-evergreen">{listing.category}</span>
              <span className="font-mono">ID: {listing.id}</span>
            </div>
            <h1 className="text-2xl font-bold tracking-tight text-ink">{listing.title}</h1>
            <div className="mt-2 flex items-center gap-3">
              <div className="text-2xl font-black text-ink">
                {isLend ? (
                  <span className="text-evergreen">₹0 (Free Borrow)</span>
                ) : listing.price === null ? (
                  <span className="text-sm font-semibold text-ink-muted">Price not available (ask owner)</span>
                ) : (
                  `₹${listing.price}${listing.priceUnit === 'day' ? ' / day' : ''}`
                )}
              </div>
            </div>
          </div>

          <p className="text-xs sm:text-sm text-ink-muted leading-relaxed whitespace-pre-line">
            {listing.description}
          </p>

          {/* Quick Specifications */}
          <div className="p-4 bg-surface rounded-2xl border border-surface-border grid grid-cols-2 gap-3 text-xs">
            <div>
              <span className="text-ink-muted block text-[11px]">Condition</span>
              <span className="font-bold text-ink capitalize">{listing.condition.replace('_', ' ')}</span>
            </div>
            <div>
              <span className="text-ink-muted block text-[11px]">Quantity Available</span>
              <span className="font-bold text-ink">{listing.totalQuantity} item(s)</span>
            </div>
            <div>
              <span className="text-ink-muted block text-[11px]">Owner Location</span>
              <span className="font-bold text-ink">{listing.ownerTower}</span>
            </div>
            <div>
              <span className="text-ink-muted block text-[11px]">Contact Privacy</span>
              <span className="font-bold text-emerald-700">Masked until accepted</span>
            </div>
          </div>

          {/* Pickup & Comfort Rules */}
          {listing.pickupNote && (
            <div className="p-3.5 bg-surface-secondary/70 rounded-2xl border border-surface-border text-xs space-y-1">
              <span className="font-bold text-ink">Pickup Coordination:</span>
              <p className="text-ink-muted">{listing.pickupNote}</p>
            </div>
          )}

          {/* Request Action Button */}
          <div className="pt-2 space-y-3">
            {isOwner ? (
              // FIX-REQ-07: Own Listing prevention
              <div className="p-4 bg-surface-secondary rounded-2xl border border-surface-border flex items-center justify-between">
                <span className="text-xs font-semibold text-ink-muted">This is your listing</span>
                <Link
                  to={`/my/listings/${listing.id}/edit`}
                  className="px-4 py-2 bg-surface hover:bg-surface-border border border-surface-border text-xs font-bold rounded-xl text-ink flex items-center gap-1.5"
                >
                  <Edit className="w-3.5 h-3.5" />
                  <span>Edit Listing</span>
                </Link>
              </div>
            ) : (
              <button
                type="button"
                onClick={() => setIsRequestModalOpen(true)}
                className="w-full py-3.5 bg-evergreen hover:bg-evergreen-dark text-white rounded-xl font-bold text-sm transition-colors shadow-sm"
              >
                {isLend ? 'Request Free Borrow' : isRent ? 'Request Rental Booking' : 'Request to Buy'}
              </button>
            )}

            <div className="flex items-center justify-between text-xs pt-1">
              <button
                type="button"
                onClick={() => setIsReportModalOpen(true)}
                className="text-ink-muted hover:text-red-600 flex items-center gap-1"
              >
                <Flag className="w-3.5 h-3.5" />
                <span>Report Inaccurate or Unsafe Listing</span>
              </button>
            </div>
          </div>
        </div>
      </div>

      {/* Booking Modal */}
      {isRequestModalOpen && (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-ink/40 backdrop-blur-sm">
          <div className="bg-surface rounded-3xl max-w-md w-full p-6 shadow-2xl border border-surface-border animate-in fade-in zoom-in-95 duration-150">
            <h3 className="text-lg font-bold text-ink">
              Send Request to {listing.ownerDisplayName}
            </h3>
            <p className="text-xs text-ink-muted mt-1 mb-4">{listing.title}</p>

            {submitSuccess ? (
              <div className="p-4 bg-emerald-50 border border-emerald-200 rounded-2xl flex items-center gap-2 text-xs text-emerald-800">
                <CheckCircle2 className="w-5 h-5 text-emerald-600 shrink-0" />
                <span>{submitSuccess}</span>
              </div>
            ) : (
              <form onSubmit={handleBookingSubmit} className="space-y-4">
                {submitError && (
                  <div className="p-3 bg-red-50 border border-red-200 rounded-xl text-xs text-red-700">
                    {submitError}
                  </div>
                )}

                {!isSell && (
                  <div className="grid grid-cols-2 gap-3">
                    <div>
                      <label className="block text-[11px] font-bold text-ink uppercase tracking-wider mb-1">
                        Needed From *
                      </label>
                      <input
                        type="date"
                        value={neededFrom}
                        onChange={(e) => setNeededFrom(e.target.value)}
                        className="w-full px-2.5 py-1.5 text-xs bg-surface-secondary border border-surface-border rounded-xl focus-ring font-mono"
                        required
                      />
                    </div>
                    <div>
                      <label className="block text-[11px] font-bold text-ink uppercase tracking-wider mb-1">
                        Needed To *
                      </label>
                      <input
                        type="date"
                        value={neededTo}
                        onChange={(e) => setNeededTo(e.target.value)}
                        className="w-full px-2.5 py-1.5 text-xs bg-surface-secondary border border-surface-border rounded-xl focus-ring font-mono"
                        required
                      />
                    </div>
                  </div>
                )}

                <div>
                  <label className="block text-[11px] font-bold text-ink uppercase tracking-wider mb-1">
                    Quantity
                  </label>
                  <input
                    type="number"
                    min="1"
                    max={listing.totalQuantity}
                    value={requestedQuantity}
                    onChange={(e) => setRequestedQuantity(parseInt(e.target.value) || 1)}
                    className="w-full px-2.5 py-1.5 text-xs bg-surface-secondary border border-surface-border rounded-xl focus-ring font-mono"
                  />
                </div>

                <div>
                  <label className="block text-[11px] font-bold text-ink uppercase tracking-wider mb-1">
                    Pickup Note / Message to Owner
                  </label>
                  <textarea
                    rows={2}
                    value={requestNote}
                    onChange={(e) => setRequestNote(e.target.value)}
                    placeholder="Hi! I need this for half a day to mount my curtain rods..."
                    className="w-full p-2.5 text-xs bg-surface-secondary border border-surface-border rounded-xl focus-ring"
                  />
                </div>

                <div className="flex items-center justify-end gap-2 pt-2">
                  <button
                    type="button"
                    onClick={() => setIsRequestModalOpen(false)}
                    className="px-4 py-2 text-xs font-semibold text-ink-muted hover:bg-surface-secondary rounded-xl"
                  >
                    Cancel
                  </button>
                  <button
                    type="submit"
                    disabled={isSubmitting}
                    className="px-5 py-2 text-xs font-semibold bg-evergreen hover:bg-evergreen-dark text-white rounded-xl shadow-sm disabled:opacity-50"
                  >
                    {isSubmitting ? 'Sending Request...' : 'Send Request'}
                  </button>
                </div>
              </form>
            )}
          </div>
        </div>
      )}

      {/* Report Listing Modal */}
      {isReportModalOpen && (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-ink/40 backdrop-blur-sm">
          <div className="bg-surface rounded-3xl max-w-md w-full p-6 shadow-2xl border border-surface-border animate-in fade-in zoom-in-95 duration-150">
            <h3 className="text-base font-bold text-ink flex items-center gap-2">
              <ShieldAlert className="w-5 h-5 text-amber-600" />
              <span>Report Community Listing</span>
            </h3>
            <p className="text-xs text-ink-muted mt-1 mb-4">
              Help maintain a safe and accurate society sharing catalog. 3 reports will automatically hide this listing for admin review.
            </p>

            {reportSuccess ? (
              <div className="p-4 bg-emerald-50 border border-emerald-200 rounded-2xl text-xs text-emerald-800">
                {reportSuccess}
              </div>
            ) : (
              <form onSubmit={handleReportListing} className="space-y-4">
                <div>
                  <label className="block text-[11px] font-bold text-ink uppercase tracking-wider mb-2">
                    Reason for report
                  </label>
                  <div className="space-y-2 text-xs text-ink">
                    {[
                      'Unsafe, damaged or broken tool',
                      'Prohibited or dangerous substance',
                      'Inaccurate description or commercial spam',
                      'Unreasonable pricing or non-resident listing',
                    ].map((r) => (
                      <label key={r} className="flex items-center gap-2 p-2 rounded-xl hover:bg-surface-secondary cursor-pointer">
                        <input
                          type="radio"
                          name="reportReason"
                          value={r}
                          checked={reportReason === r}
                          onChange={(e) => setReportReason(e.target.value)}
                          className="text-evergreen focus:ring-evergreen"
                        />
                        <span>{r}</span>
                      </label>
                    ))}
                  </div>
                </div>

                <div className="flex items-center justify-end gap-2 pt-2">
                  <button
                    type="button"
                    onClick={() => setIsReportModalOpen(false)}
                    className="px-4 py-2 text-xs font-semibold text-ink-muted hover:bg-surface-secondary rounded-xl"
                  >
                    Cancel
                  </button>
                  <button
                    type="submit"
                    className="px-5 py-2 text-xs font-semibold bg-rose-600 hover:bg-rose-700 text-white rounded-xl shadow-sm"
                  >
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

