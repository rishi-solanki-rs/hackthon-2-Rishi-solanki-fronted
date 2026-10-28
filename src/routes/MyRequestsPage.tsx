import React, { useState, useEffect } from 'react';
import { Link } from 'react-router-dom';
import {
  Clock,
  CheckCircle2,
  XCircle,
  AlertTriangle,
  MessageSquare,
  HelpCircle,
  Send,
  Calendar,
  Lock,
  Unlock,
  Heart,
} from 'lucide-react';
import { Request } from '@sidekit/shared';
import { sidekitService } from '../services';
import { useAuth } from '../context/AuthContext';
import { WhatsAppModal } from '../components/shared/WhatsAppModal';

export const MyRequestsPage: React.FC = () => {
  const { currentUser, simulatedTime } = useAuth();
  const [requests, setRequests] = useState<Request[]>([]);
  const [isLoading, setIsLoading] = useState(true);

  // Cancellation Modal
  const [cancellingRequestId, setCancellingRequestId] = useState<string | null>(null);
  const [cancelReason, setCancelReason] = useState('');
  const [isSubmittingCancel, setIsSubmittingCancel] = useState(false);
  const [cancelError, setCancelError] = useState<string | null>(null);

  // Thank-You Note Modal (FIX-SOCIAL-01)
  const [thankYouRequestId, setThankYouRequestId] = useState<string | null>(null);
  const [thankYouMessage, setThankYouMessage] = useState('');
  const [isSubmittingThankYou, setIsSubmittingThankYou] = useState(false);

  // WhatsApp Simulated Modal
  const [whatsAppModalData, setWhatsAppModalData] = useState<{
    isOpen: boolean;
    name: string;
    phone: string;
    itemTitle: string;
  }>({ isOpen: false, name: '', phone: '', itemTitle: '' });

  const fetchRequests = async () => {
    try {
      setIsLoading(true);
      const data = await sidekitService.getMyRequests();
      setRequests(data);
    } catch (err) {
      console.error(err);
    } finally {
      setIsLoading(false);
    }
  };

  useEffect(() => {
    fetchRequests();
  }, [currentUser, simulatedTime]);

  const handleConfirmCancel = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!cancellingRequestId) return;
    if (!cancelReason.trim()) {
      setCancelError('Please enter a cancellation reason.');
      return;
    }

    try {
      setIsSubmittingCancel(true);
      setCancelError(null);
      await sidekitService.cancelRequest(cancellingRequestId, cancelReason.trim());
      setCancellingRequestId(null);
      setCancelReason('');
      fetchRequests();
    } catch (err: any) {
      setCancelError(err.message || 'Failed to cancel request.');
    } finally {
      setIsSubmittingCancel(false);
    }
  };

  const handleSendThankYou = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!thankYouRequestId || !thankYouMessage.trim()) return;

    try {
      setIsSubmittingThankYou(true);
      await sidekitService.returnRequest(thankYouRequestId, thankYouMessage.trim());
      setThankYouRequestId(null);
      setThankYouMessage('');
      fetchRequests();
    } catch (err) {
      console.error(err);
    } finally {
      setIsSubmittingThankYou(false);
    }
  };

  return (
    <div className="max-w-4xl mx-auto py-8 px-4 space-y-6">
      <div className="space-y-1">
        <h1 className="text-2xl sm:text-3xl font-bold tracking-tight text-ink">My Outgoing Requests</h1>
        <p className="text-xs text-ink-muted">
          Track items you have requested to borrow, rent, or buy from neighbours in Palm Grove.
        </p>
      </div>

      {isLoading ? (
        <div className="py-20 text-center text-xs text-ink-muted">Loading your requests...</div>
      ) : requests.length === 0 ? (
        <div className="py-20 text-center bg-surface rounded-3xl border border-surface-border space-y-3">
          <Send className="w-8 h-8 text-ink-muted mx-auto" />
          <h3 className="text-base font-bold text-ink">No requests sent yet</h3>
          <p className="text-xs text-ink-muted max-w-sm mx-auto">
            You haven't requested any tools yet. Start a project plan or browse the community catalog to get started.
          </p>
          <Link
            to="/plan/new"
            className="inline-block mt-2 py-2 px-4 bg-evergreen text-white rounded-xl text-xs font-semibold shadow-sm"
          >
            Plan a Task
          </Link>
        </div>
      ) : (
        <div className="space-y-4">
          {requests.map((r) => {
            const isAccepted = r.status === 'accepted';
            const isHandedOver = r.status === 'handed_over';
            const isCompleted = r.status === 'completed';
            const isCancelled = r.status === 'cancelled';
            const isDeclined = r.status === 'declined';
            const isPending = r.status === 'pending';

            // Check 72h expiry against simulatedTime (FIX-TIMED-01)
            const createdTime = new Date(r.createdAt).getTime();
            const elapsedHours = (simulatedTime.getTime() - createdTime) / (3600 * 1000);
            const isExpired = isPending && elapsedHours >= 72;

            return (
              <div
                key={r.id}
                className="p-5 bg-surface rounded-3xl border border-surface-border shadow-sm space-y-4"
              >
                {/* Header row */}
                <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-2 border-b border-surface-border pb-3">
                  <div>
                    <h3 className="text-base font-bold text-ink">{r.listingTitle}</h3>
                    <div className="text-xs text-ink-muted mt-0.5">
                      Requested from <strong>{r.ownerName}</strong> ({r.ownerTower})
                    </div>
                  </div>

                  {/* Status Badge */}
                  <div>
                    {isExpired ? (
                      <span className="px-3 py-1 bg-slate-100 text-slate-700 text-xs font-bold rounded-full">
                        Expired (72h)
                      </span>
                    ) : isAccepted ? (
                      <span className="px-3 py-1 bg-emerald-50 text-emerald-800 border border-emerald-200 text-xs font-bold rounded-full flex items-center gap-1.5">
                        <CheckCircle2 className="w-3.5 h-3.5" />
                        <span>Accepted</span>
                      </span>
                    ) : isHandedOver ? (
                      <span className="px-3 py-1 bg-blue-50 text-blue-800 border border-blue-200 text-xs font-bold rounded-full">
                        In Your Hands (With Borrower)
                      </span>
                    ) : isCompleted ? (
                      <span className="px-3 py-1 bg-purple-50 text-purple-800 border border-purple-200 text-xs font-bold rounded-full">
                        Completed & Returned
                      </span>
                    ) : isDeclined ? (
                      <span className="px-3 py-1 bg-rose-50 text-rose-800 border border-rose-200 text-xs font-bold rounded-full">
                        Declined
                      </span>
                    ) : isCancelled ? (
                      <span className="px-3 py-1 bg-slate-100 text-slate-600 text-xs font-bold rounded-full">
                        Cancelled
                      </span>
                    ) : (
                      <span className="px-3 py-1 bg-amber-50 text-amber-800 border border-amber-200 text-xs font-bold rounded-full flex items-center gap-1.5">
                        <Clock className="w-3.5 h-3.5" />
                        <span>Awaiting Owner Response</span>
                      </span>
                    )}
                  </div>
                </div>

                {/* Details row */}
                <div className="grid grid-cols-2 sm:grid-cols-4 gap-3 text-xs">
                  <div>
                    <span className="text-ink-muted block text-[11px]">Sharing Mode</span>
                    <span className="font-semibold text-ink capitalize">{r.kind}</span>
                  </div>
                  <div>
                    <span className="text-ink-muted block text-[11px]">Quantity</span>
                    <span className="font-semibold text-ink">{r.requestedQuantity} unit(s)</span>
                  </div>
                  {r.neededFrom && (
                    <div>
                      <span className="text-ink-muted block text-[11px]">Booking Dates</span>
                      <span className="font-semibold text-ink">
                        {r.neededFrom} to {r.neededTo}
                      </span>
                    </div>
                  )}
                  <div>
                    <span className="text-ink-muted block text-[11px]">Total Cost</span>
                    <span className="font-bold text-ink">
                      {r.totalPrice ? `₹${r.totalPrice}` : '₹0 (Free)'}
                    </span>
                  </div>
                </div>

                {/* Contact Card & Privacy (FIX-PRIVACY-01) */}
                {(isAccepted || isHandedOver) && r.ownerPhone && (
                  <div className="p-4 bg-emerald-50/60 rounded-2xl border border-emerald-200/80 flex flex-col sm:flex-row sm:items-center justify-between gap-3 text-xs">
                    <div className="space-y-1">
                      <div className="font-bold text-emerald-950 flex items-center gap-1.5">
                        <Unlock className="w-3.5 h-3.5 text-emerald-700" />
                        <span>Owner Contact Details Unlocked</span>
                      </div>
                      <div className="text-emerald-900 font-mono">
                        Flat: <strong>{r.ownerFlat || 'B-704'}</strong> · Phone: <strong>{r.ownerPhone}</strong>
                      </div>
                    </div>

                    <button
                      type="button"
                      onClick={() =>
                        setWhatsAppModalData({
                          isOpen: true,
                          name: r.ownerName || 'Neighbour',
                          phone: r.ownerPhone || '',
                          itemTitle: r.listingTitle || 'Tool',
                        })
                      }
                      className="px-3.5 py-2 bg-emerald-700 hover:bg-emerald-800 text-white font-semibold rounded-xl flex items-center gap-1.5 shrink-0 shadow-sm"
                    >
                      <MessageSquare className="w-4 h-4" />
                      <span>Coordinate via WhatsApp</span>
                    </button>
                  </div>
                )}

                {/* Re-masked note if cancelled (FIX-PRIVACY-01) */}
                {isCancelled && (
                  <div className="p-3 bg-surface-secondary rounded-2xl border border-surface-border text-xs text-ink-muted flex items-center gap-2">
                    <Lock className="w-4 h-4 text-ink-muted shrink-0" />
                    <span>Request was cancelled. Contact details re-masked to protect resident privacy.</span>
                  </div>
                )}

                {/* Thank You Note Prompt if Completed (FIX-SOCIAL-01) */}
                {isCompleted && !r.thankYouNote && (
                  <div className="p-3.5 bg-purple-50/70 border border-purple-200 rounded-2xl flex items-center justify-between gap-2 text-xs">
                    <span className="text-purple-950">
                      Returned smoothly? Send a quick public thank-you note to {r.ownerName}!
                    </span>
                    <button
                      type="button"
                      onClick={() => setThankYouRequestId(r.id)}
                      className="px-3 py-1.5 bg-purple-700 hover:bg-purple-800 text-white rounded-xl font-semibold shrink-0"
                    >
                      Write Note
                    </button>
                  </div>
                )}

                {isCompleted && r.thankYouNote && (
                  <div className="p-3 bg-surface-secondary rounded-2xl border border-surface-border text-xs space-y-1">
                    <span className="font-bold text-ink flex items-center gap-1 text-purple-700">
                      <Heart className="w-3.5 h-3.5" />
                      <span>Your Thank-You Note:</span>
                    </span>
                    <p className="text-ink-muted italic">"{r.thankYouNote}"</p>
                  </div>
                )}

                {/* Action Row */}
                {(isPending || (isAccepted && !isHandedOver)) && !isExpired && (
                  <div className="pt-2 flex justify-end">
                    <button
                      type="button"
                      onClick={() => setCancellingRequestId(r.id)}
                      className="text-xs font-semibold text-rose-600 hover:text-rose-700"
                    >
                      Cancel Request
                    </button>
                  </div>
                )}
              </div>
            );
          })}
        </div>
      )}

      {/* Cancellation Dialog (FIX-REQ-05, OD-01) */}
      {cancellingRequestId && (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-ink/40 backdrop-blur-sm">
          <div className="bg-surface rounded-3xl max-w-md w-full p-6 shadow-2xl border border-surface-border animate-in fade-in zoom-in-95 duration-150">
            <h3 className="text-base font-bold text-ink">Cancel Booking Request</h3>
            <p className="text-xs text-ink-muted mt-1 mb-4 leading-relaxed">
              Cancelling frees the booked dates immediately for other neighbours. Please provide a brief reason for the owner.
            </p>

            {cancelError && (
              <div className="p-3 bg-red-50 border border-red-200 rounded-xl text-xs text-red-700 mb-3">
                {cancelError}
              </div>
            )}

            <form onSubmit={handleConfirmCancel} className="space-y-4">
              <div>
                <label className="block text-[11px] font-bold text-ink uppercase tracking-wider mb-1">
                  Reason for Cancellation *
                </label>
                <textarea
                  rows={3}
                  value={cancelReason}
                  onChange={(e) => setCancelReason(e.target.value)}
                  placeholder="e.g. Project delayed, borrowed from a family member instead..."
                  className="w-full p-3 text-xs bg-surface-secondary border border-surface-border rounded-xl focus-ring"
                  required
                />
              </div>

              <div className="flex items-center justify-end gap-2 pt-2">
                <button
                  type="button"
                  onClick={() => setCancellingRequestId(null)}
                  className="px-4 py-2 text-xs font-semibold text-ink-muted hover:bg-surface-secondary rounded-xl"
                >
                  Keep Booking
                </button>
                <button
                  type="submit"
                  disabled={isSubmittingCancel}
                  className="px-5 py-2 text-xs font-semibold bg-rose-600 hover:bg-rose-700 text-white rounded-xl shadow-sm disabled:opacity-50"
                >
                  {isSubmittingCancel ? 'Cancelling...' : 'Confirm Cancellation'}
                </button>
              </div>
            </form>
          </div>
        </div>
      )}

      {/* Thank You Note Dialog (FIX-SOCIAL-01) */}
      {thankYouRequestId && (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-ink/40 backdrop-blur-sm">
          <div className="bg-surface rounded-3xl max-w-md w-full p-6 shadow-2xl border border-surface-border animate-in fade-in zoom-in-95 duration-150">
            <h3 className="text-base font-bold text-ink">Write a Thank-You Note</h3>
            <p className="text-xs text-ink-muted mt-1 mb-4">
              This note will be posted on your neighbour's community profile to build society trust.
            </p>

            <form onSubmit={handleSendThankYou} className="space-y-4">
              <div>
                <textarea
                  rows={3}
                  value={thankYouMessage}
                  onChange={(e) => setThankYouMessage(e.target.value)}
                  placeholder="e.g. Thanks Amit! Drill worked smoothly and helped mount our pictures perfectly."
                  className="w-full p-3 text-xs bg-surface-secondary border border-surface-border rounded-xl focus-ring"
                  required
                />
              </div>

              <div className="flex items-center justify-end gap-2">
                <button
                  type="button"
                  onClick={() => setThankYouRequestId(null)}
                  className="px-4 py-2 text-xs font-semibold text-ink-muted hover:bg-surface-secondary rounded-xl"
                >
                  Skip
                </button>
                <button
                  type="submit"
                  disabled={isSubmittingThankYou}
                  className="px-5 py-2 text-xs font-semibold bg-evergreen hover:bg-evergreen-dark text-white rounded-xl shadow-sm"
                >
                  Send Note
                </button>
              </div>
            </form>
          </div>
        </div>
      )}

      {/* WhatsApp Simulation Modal */}
      <WhatsAppModal
        isOpen={whatsAppModalData.isOpen}
        onClose={() => setWhatsAppModalData((prev) => ({ ...prev, isOpen: false }))}
        contactName={whatsAppModalData.name}
        phone={whatsAppModalData.phone}
        itemTitle={whatsAppModalData.itemTitle}
      />
    </div>
  );
};

