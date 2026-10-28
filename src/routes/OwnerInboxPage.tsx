import React, { useState, useEffect } from 'react';
import { Link } from 'react-router-dom';
import {
  Inbox,
  CheckCircle2,
  XCircle,
  Clock,
  ArrowRight,
  MessageSquare,
  PackageCheck,
  Check,
  AlertCircle,
  HelpCircle,
} from 'lucide-react';
import { Request } from '@sidekit/shared';
import { sidekitService } from '../services';
import { useAuth } from '../context/AuthContext';
import { WhatsAppModal } from '../components/shared/WhatsAppModal';

export const OwnerInboxPage: React.FC = () => {
  const { currentUser } = useAuth();
  const [requests, setRequests] = useState<Request[]>([]);
  const [isLoading, setIsLoading] = useState(true);
  const [actionSuccess, setActionSuccess] = useState<string | null>(null);

  // Decline Dialog
  const [decliningRequestId, setDecliningRequestId] = useState<string | null>(null);
  const [declineReason, setDeclineReason] = useState('Not available during these dates');

  // WhatsApp Simulated Modal
  const [whatsAppModalData, setWhatsAppModalData] = useState<{
    isOpen: boolean;
    name: string;
    phone: string;
    itemTitle: string;
  }>({ isOpen: false, name: '', phone: '', itemTitle: '' });

  const fetchInbox = async () => {
    try {
      setIsLoading(true);
      const data = await sidekitService.getOwnerRequests();
      setRequests(data);
    } catch (err) {
      console.error(err);
    } finally {
      setIsLoading(false);
    }
  };

  useEffect(() => {
    fetchInbox();
  }, [currentUser]);

  const handleAccept = async (requestId: string) => {
    try {
      const res = await sidekitService.acceptRequest(requestId);
      if (res.autoDeclinedCount > 0) {
        setActionSuccess(`Request accepted! ${res.autoDeclinedCount} competing request(s) auto-declined due to inventory limits.`);
      } else {
        setActionSuccess('Request accepted! Borrower contact unlocked below.');
      }
      setTimeout(() => setActionSuccess(null), 4000);
      fetchInbox();
    } catch (err: any) {
      alert(err.message || 'Failed to accept request.');
    }
  };

  const handleDecline = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!decliningRequestId) return;
    try {
      await sidekitService.declineRequest(decliningRequestId, declineReason);
      setDecliningRequestId(null);
      fetchInbox();
    } catch (err: any) {
      alert(err.message || 'Failed to decline request.');
    }
  };

  const handleHandover = async (requestId: string) => {
    try {
      await sidekitService.handoverRequest(requestId);
      setActionSuccess('Marked as physically handed over to borrower.');
      setTimeout(() => setActionSuccess(null), 3000);
      fetchInbox();
    } catch (err: any) {
      alert(err.message || 'Failed to confirm handover.');
    }
  };

  const handleReturn = async (requestId: string, kind: string) => {
    try {
      await sidekitService.returnRequest(requestId);
      setActionSuccess(kind === 'buy' ? 'Marked as sold! Listing closed.' : 'Marked as returned! Inventory released back to community.');
      setTimeout(() => setActionSuccess(null), 3000);
      fetchInbox();
    } catch (err: any) {
      alert(err.message || 'Failed to mark return.');
    }
  };

  return (
    <div className="max-w-4xl mx-auto py-8 px-4 space-y-6">
      <div className="space-y-1">
        <h1 className="text-2xl sm:text-3xl font-bold tracking-tight text-ink">Owner Request Inbox</h1>
        <p className="text-xs text-ink-muted">
          Incoming requests from neighbours wishing to borrow, rent, or buy your items.
        </p>
      </div>

      {actionSuccess && (
        <div className="p-4 bg-emerald-50 border border-emerald-200 rounded-2xl flex items-center gap-2 text-xs text-emerald-800 animate-in fade-in duration-200">
          <CheckCircle2 className="w-4 h-4 text-emerald-600 shrink-0" />
          <span>{actionSuccess}</span>
        </div>
      )}

      {isLoading ? (
        <div className="py-20 text-center text-xs text-ink-muted">Loading incoming requests...</div>
      ) : requests.length === 0 ? (
        <div className="py-20 text-center bg-surface rounded-3xl border border-surface-border space-y-3">
          <Inbox className="w-8 h-8 text-ink-muted mx-auto" />
          <h3 className="text-base font-bold text-ink">Your inbox is clear</h3>
          <p className="text-xs text-ink-muted max-w-sm mx-auto">
            You don't have any pending requests for your listed equipment right now.
          </p>
          <Link
            to="/my/listings/new"
            className="inline-block mt-2 py-2 px-4 bg-evergreen text-white rounded-xl text-xs font-semibold shadow-sm"
          >
            Add More Items
          </Link>
        </div>
      ) : (
        <div className="space-y-4">
          {requests.map((r) => {
            const isPending = r.status === 'pending';
            const isAccepted = r.status === 'accepted';
            const isHandedOver = r.status === 'handed_over';
            const isCompleted = r.status === 'completed';
            const isDeclined = r.status === 'declined';
            const isCancelled = r.status === 'cancelled';

            return (
              <div
                key={r.id}
                className="p-5 bg-surface rounded-3xl border border-surface-border shadow-sm space-y-4"
              >
                <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-2 border-b border-surface-border pb-3">
                  <div>
                    <h3 className="text-base font-bold text-ink">{r.listingTitle}</h3>
                    <div className="text-xs text-ink-muted mt-0.5">
                      Requested by <strong>{r.requesterName}</strong> ({r.requesterTower})
                    </div>
                  </div>

                  <div>
                    {isPending && (
                      <span className="px-3 py-1 bg-amber-50 text-amber-800 border border-amber-200 text-xs font-bold rounded-full">
                        Action Required
                      </span>
                    )}
                    {isAccepted && (
                      <span className="px-3 py-1 bg-emerald-50 text-emerald-800 border border-emerald-200 text-xs font-bold rounded-full">
                        Accepted · Awaiting Handover
                      </span>
                    )}
                    {isHandedOver && (
                      <span className="px-3 py-1 bg-blue-50 text-blue-800 border border-blue-200 text-xs font-bold rounded-full">
                        With Borrower
                      </span>
                    )}
                    {isCompleted && (
                      <span className="px-3 py-1 bg-purple-50 text-purple-800 border border-purple-200 text-xs font-bold rounded-full">
                        Completed & Returned
                      </span>
                    )}
                    {isDeclined && (
                      <span className="px-3 py-1 bg-rose-50 text-rose-800 border border-rose-200 text-xs font-bold rounded-full">
                        Declined
                      </span>
                    )}
                    {isCancelled && (
                      <span className="px-3 py-1 bg-slate-100 text-slate-600 text-xs font-bold rounded-full">
                        Cancelled
                      </span>
                    )}
                  </div>
                </div>

                <div className="grid grid-cols-2 sm:grid-cols-4 gap-3 text-xs">
                  <div>
                    <span className="text-ink-muted block text-[11px]">Type</span>
                    <span className="font-semibold text-ink capitalize">{r.kind}</span>
                  </div>
                  <div>
                    <span className="text-ink-muted block text-[11px]">Quantity</span>
                    <span className="font-semibold text-ink">{r.requestedQuantity} item(s)</span>
                  </div>
                  {r.neededFrom && (
                    <div>
                      <span className="text-ink-muted block text-[11px]">Dates</span>
                      <span className="font-semibold text-ink">
                        {r.neededFrom} to {r.neededTo}
                      </span>
                    </div>
                  )}
                  <div>
                    <span className="text-ink-muted block text-[11px]">Price</span>
                    <span className="font-bold text-ink">
                      {r.totalPrice ? `₹${r.totalPrice}` : '₹0 (Free)'}
                    </span>
                  </div>
                </div>

                {r.note && (
                  <div className="p-3 bg-surface-secondary rounded-2xl border border-surface-border text-xs text-ink space-y-0.5">
                    <span className="font-bold text-ink-muted text-[10px] uppercase">Message from Borrower:</span>
                    <p className="italic">"{r.note}"</p>
                  </div>
                )}

                {/* Contact Card when Accepted / Handed Over */}
                {(isAccepted || isHandedOver) && r.requesterPhone && (
                  <div className="p-4 bg-emerald-50/70 rounded-2xl border border-emerald-200 flex flex-col sm:flex-row sm:items-center justify-between gap-3 text-xs">
                    <div>
                      <div className="font-bold text-emerald-950">Borrower Contact Unlocked</div>
                      <div className="text-emerald-900 font-mono mt-0.5">
                        Flat: <strong>{r.requesterFlat || 'A-402'}</strong> · Phone: <strong>{r.requesterPhone}</strong>
                      </div>
                    </div>

                    <button
                      type="button"
                      onClick={() =>
                        setWhatsAppModalData({
                          isOpen: true,
                          name: r.requesterName || 'Borrower',
                          phone: r.requesterPhone || '',
                          itemTitle: r.listingTitle || 'Item',
                        })
                      }
                      className="px-3.5 py-2 bg-emerald-700 hover:bg-emerald-800 text-white font-semibold rounded-xl flex items-center gap-1.5 shrink-0 shadow-sm"
                    >
                      <MessageSquare className="w-4 h-4" />
                      <span>Coordinate Handover</span>
                    </button>
                  </div>
                )}

                {/* Owner Actions */}
                <div className="pt-2 flex flex-wrap items-center justify-end gap-2 border-t border-surface-border">
                  {isPending && (
                    <>
                      <button
                        type="button"
                        onClick={() => setDecliningRequestId(r.id)}
                        className="px-4 py-2 text-xs font-semibold text-rose-600 hover:bg-rose-50 rounded-xl transition-colors"
                      >
                        Decline
                      </button>
                      <button
                        type="button"
                        onClick={() => handleAccept(r.id)}
                        className="px-5 py-2 bg-evergreen hover:bg-evergreen-dark text-white rounded-xl font-semibold text-xs transition-colors shadow-sm"
                      >
                        Accept Request
                      </button>
                    </>
                  )}

                  {isAccepted && (
                    <button
                      type="button"
                      onClick={() => handleHandover(r.id)}
                      className="px-5 py-2 bg-blue-600 hover:bg-blue-700 text-white rounded-xl font-semibold text-xs transition-colors shadow-sm flex items-center gap-1.5"
                    >
                      <PackageCheck className="w-4 h-4" />
                      <span>Mark Physically Handed Over</span>
                    </button>
                  )}

                  {isHandedOver && (
                    <button
                      type="button"
                      onClick={() => handleReturn(r.id, r.kind)}
                      className="px-5 py-2 bg-purple-700 hover:bg-purple-800 text-white rounded-xl font-semibold text-xs transition-colors shadow-sm flex items-center gap-1.5"
                    >
                      <Check className="w-4 h-4" />
                      <span>{r.kind === 'buy' ? 'Mark as Sold' : 'Mark as Returned'}</span>
                    </button>
                  )}
                </div>
              </div>
            );
          })}
        </div>
      )}

      {/* Decline Modal */}
      {decliningRequestId && (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-ink/40 backdrop-blur-sm">
          <div className="bg-surface rounded-3xl max-w-md w-full p-6 shadow-2xl border border-surface-border animate-in fade-in zoom-in-95 duration-150">
            <h3 className="text-base font-bold text-ink">Decline Request</h3>
            <p className="text-xs text-ink-muted mt-1 mb-4">
              Let the resident know why this item is unavailable so they can find an alternative.
            </p>

            <form onSubmit={handleDecline} className="space-y-4">
              <div>
                <label className="block text-[11px] font-bold text-ink uppercase tracking-wider mb-2">
                  Select Reason
                </label>
                <div className="space-y-1.5 text-xs text-ink">
                  {[
                    'Not available during requested dates',
                    'Tool is currently in personal use',
                    'Undergoing maintenance or cleaning',
                    'Out of town / unavailable for handover',
                  ].map((reason) => (
                    <label key={reason} className="flex items-center gap-2 p-2 rounded-xl hover:bg-surface-secondary cursor-pointer">
                      <input
                        type="radio"
                        name="declineReason"
                        value={reason}
                        checked={declineReason === reason}
                        onChange={(e) => setDeclineReason(e.target.value)}
                        className="text-evergreen focus:ring-evergreen"
                      />
                      <span>{reason}</span>
                    </label>
                  ))}
                </div>
              </div>

              <div className="flex items-center justify-end gap-2 pt-2">
                <button
                  type="button"
                  onClick={() => setDecliningRequestId(null)}
                  className="px-4 py-2 text-xs font-semibold text-ink-muted hover:bg-surface-secondary rounded-xl"
                >
                  Cancel
                </button>
                <button
                  type="submit"
                  className="px-5 py-2 text-xs font-semibold bg-rose-600 hover:bg-rose-700 text-white rounded-xl shadow-sm"
                >
                  Confirm Decline
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

