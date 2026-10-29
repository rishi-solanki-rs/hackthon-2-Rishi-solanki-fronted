import React, { useState, useEffect } from 'react';
import { Link } from 'react-router-dom';
import { Send, X, Lock, Unlock, MessageSquare } from 'lucide-react';
import { Request } from '@sidekit/shared';
import { sidekitService } from '../services';
import { useAuth } from '../context/AuthContext';
import { WhatsAppModal } from '../components/shared/WhatsAppModal';

const STATUS_STYLES: Record<string, string> = {
  pending: 'bg-amber-50 text-amber-700 border-amber-200',
  accepted: 'bg-emerald-50 text-emerald-700 border-emerald-200',
  handed_over: 'bg-blue-50 text-blue-700 border-blue-200',
  completed: 'bg-purple-50 text-purple-700 border-purple-200',
  declined: 'bg-rose-50 text-rose-700 border-rose-200',
  cancelled: 'bg-slate-100 text-slate-600 border-slate-200',
};

const STATUS_LABELS: Record<string, string> = {
  pending: 'Pending',
  accepted: 'Accepted',
  handed_over: 'In Use',
  completed: 'Completed',
  declined: 'Declined',
  cancelled: 'Cancelled',
};

export const MyRequestsPage: React.FC = () => {
  const { currentUser } = useAuth();
  const [requests, setRequests] = useState<Request[]>([]);
  const [isLoading, setIsLoading] = useState(true);
  const [cancellingId, setCancellingId] = useState<string | null>(null);
  const [cancelReason, setCancelReason] = useState('');
  const [cancelError, setCancelError] = useState('');
  const [submitting, setSubmitting] = useState(false);
  const [whatsapp, setWhatsapp] = useState({ open: false, name: '', phone: '', item: '' });

  const fetch = async () => {
    setIsLoading(true);
    try { setRequests(await sidekitService.getMyRequests()); } catch {}
    setIsLoading(false);
  };

  useEffect(() => { fetch(); }, [currentUser]);

  const confirmCancel = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!cancellingId || !cancelReason.trim()) { setCancelError('Please enter a reason.'); return; }
    setSubmitting(true); setCancelError('');
    try {
      await sidekitService.cancelRequest(cancellingId, cancelReason.trim());
      setCancellingId(null); setCancelReason(''); fetch();
    } catch (err: any) { setCancelError(err.message || 'Failed to cancel.'); }
    setSubmitting(false);
  };

  return (
    <div className="max-w-4xl mx-auto py-8 px-4 space-y-6">
      <div>
        <h1 className="text-xl font-bold text-ink">My Requests</h1>
        <p className="text-xs text-ink-muted mt-0.5">Items you've requested from neighbours.</p>
      </div>

      {isLoading ? (
        <div className="py-16 text-center text-sm text-ink-muted">Loading requests...</div>
      ) : requests.length === 0 ? (
        <div className="py-16 text-center bg-white rounded-2xl border border-surface-border space-y-3">
          <Send className="w-8 h-8 text-ink-muted mx-auto" />
          <p className="text-sm font-semibold text-ink">No requests yet</p>
          <Link to="/browse" className="inline-block px-4 py-2 bg-evergreen text-white rounded-xl text-xs font-semibold">
            Browse Catalog
          </Link>
        </div>
      ) : (
        <div className="space-y-3">
          {requests.map((r) => {
            const contactVisible = r.status === 'accepted' || r.status === 'handed_over';
            return (
              <div key={r.id} className="bg-white rounded-2xl border border-surface-border p-5 space-y-4">
                {/* Top */}
                <div className="flex flex-wrap items-start justify-between gap-3">
                  <div>
                    <h3 className="text-sm font-bold text-ink">{r.listingTitle}</h3>
                    <p className="text-xs text-ink-muted mt-0.5">
                      From <strong>{r.ownerName}</strong> · {r.ownerTower}
                    </p>
                  </div>
                  <span className={`text-[11px] font-bold px-2.5 py-1 rounded-full border ${STATUS_STYLES[r.status] || ''}`}>
                    {STATUS_LABELS[r.status] || r.status}
                  </span>
                </div>

                {/* Details */}
                <div className="grid grid-cols-2 sm:grid-cols-4 gap-3 text-xs">
                  <div><span className="text-ink-muted block">Type</span><strong className="capitalize">{r.kind}</strong></div>
                  <div><span className="text-ink-muted block">Qty</span><strong>{r.requestedQuantity}</strong></div>
                  {r.neededFrom && <div><span className="text-ink-muted block">Dates</span><strong>{r.neededFrom} → {r.neededTo}</strong></div>}
                  <div><span className="text-ink-muted block">Total</span><strong>{r.totalPrice ? `₹${r.totalPrice}` : 'Free'}</strong></div>
                </div>

                {/* Privacy indicator + contact */}
                <div className={`flex flex-col sm:flex-row sm:items-center justify-between gap-3 p-3 rounded-xl border ${
                  contactVisible ? 'bg-emerald-50 border-emerald-200' : 'bg-surface-secondary border-surface-border'
                }`}>
                  <div className="flex items-center gap-2 text-xs">
                    {contactVisible
                      ? <Unlock className="w-3.5 h-3.5 text-emerald-600" />
                      : <Lock className="w-3.5 h-3.5 text-ink-muted" />}
                    <span className={contactVisible ? 'text-emerald-800' : 'text-ink-muted'}>
                      {contactVisible
                        ? <>Owner: <strong className="font-mono">{r.ownerFlat} · {r.ownerPhone}</strong></>
                        : 'Owner contact visible after acceptance'}
                    </span>
                  </div>
                  {contactVisible && r.ownerPhone && (
                    <button
                      onClick={() => setWhatsapp({ open: true, name: r.ownerName || '', phone: r.ownerPhone || '', item: r.listingTitle || '' })}
                      className="flex items-center gap-1.5 px-3 py-1.5 bg-emerald-700 hover:bg-emerald-800 text-white rounded-lg text-xs font-semibold shrink-0"
                    >
                      <MessageSquare className="w-3.5 h-3.5" />
                      Contact Owner
                    </button>
                  )}
                </div>

                {/* Cancellation note */}
                {r.cancellationReason && (
                  <p className="text-xs text-ink-muted italic">Cancelled: "{r.cancellationReason}"</p>
                )}
                {r.declineReason && (
                  <p className="text-xs text-rose-600 italic">Declined: "{r.declineReason}"</p>
                )}

                {/* Cancel button */}
                {(r.status === 'pending' || r.status === 'accepted') && (
                  <div className="flex justify-end pt-1 border-t border-surface-border">
                    <button
                      onClick={() => { setCancellingId(r.id); setCancelReason(''); setCancelError(''); }}
                      className="flex items-center gap-1.5 px-3 py-1.5 text-xs text-rose-600 hover:bg-rose-50 rounded-lg transition-colors"
                    >
                      <X className="w-3.5 h-3.5" />
                      Cancel Request
                    </button>
                  </div>
                )}
              </div>
            );
          })}
        </div>
      )}

      {/* Cancel modal */}
      {cancellingId && (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-ink/40 backdrop-blur-sm">
          <div className="bg-white rounded-2xl max-w-sm w-full p-6 shadow-2xl border border-surface-border">
            <h3 className="text-sm font-bold text-ink mb-1">Cancel Request</h3>
            <p className="text-xs text-ink-muted mb-4">Please tell the owner why you're cancelling.</p>
            <form onSubmit={confirmCancel} className="space-y-3">
              <textarea
                rows={3}
                value={cancelReason}
                onChange={(e) => setCancelReason(e.target.value)}
                placeholder="e.g. Project delayed by a week..."
                className="w-full p-2.5 text-xs bg-surface-secondary border border-surface-border rounded-xl focus-ring resize-none"
                required
              />
              {cancelError && <p className="text-xs text-red-600">{cancelError}</p>}
              <div className="flex justify-end gap-2">
                <button type="button" onClick={() => setCancellingId(null)}
                  className="px-4 py-2 text-xs text-ink-muted hover:bg-surface-secondary rounded-lg">Keep</button>
                <button type="submit" disabled={submitting}
                  className="px-4 py-2 text-xs font-semibold bg-rose-600 hover:bg-rose-700 text-white rounded-lg disabled:opacity-50">
                  {submitting ? '...' : 'Cancel Request'}
                </button>
              </div>
            </form>
          </div>
        </div>
      )}

      <WhatsAppModal isOpen={whatsapp.open} onClose={() => setWhatsapp({ ...whatsapp, open: false })}
        contactName={whatsapp.name} phone={whatsapp.phone} itemTitle={whatsapp.item} />
    </div>
  );
};
