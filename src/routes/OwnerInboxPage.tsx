import React, { useState, useEffect } from 'react';
import { Link } from 'react-router-dom';
import { Inbox, CheckCircle2, Package, RotateCcw, MessageSquare } from 'lucide-react';
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
  pending: 'Needs Action',
  accepted: 'Accepted',
  handed_over: 'With Borrower',
  completed: 'Returned',
  declined: 'Declined',
  cancelled: 'Cancelled',
};

export const OwnerInboxPage: React.FC = () => {
  const { currentUser } = useAuth();
  const [requests, setRequests] = useState<Request[]>([]);
  const [isLoading, setIsLoading] = useState(true);
  const [toast, setToast] = useState('');
  const [decliningId, setDecliningId] = useState<string | null>(null);
  const [declineReason, setDeclineReason] = useState('Not available during requested dates');
  const [whatsapp, setWhatsapp] = useState({ open: false, name: '', phone: '', item: '' });

  const fetch = async () => {
    setIsLoading(true);
    try { setRequests(await sidekitService.getOwnerRequests()); } catch {}
    setIsLoading(false);
  };

  useEffect(() => { fetch(); }, [currentUser]);

  const showToast = (msg: string) => { setToast(msg); setTimeout(() => setToast(''), 3000); };

  const handleAccept = async (id: string) => {
    try {
      const res = await sidekitService.acceptRequest(id);
      showToast(res.autoDeclinedCount > 0
        ? `Accepted! ${res.autoDeclinedCount} competing request(s) auto-declined.`
        : 'Request accepted. Contact details now visible.');
      fetch();
    } catch (err: any) { alert(err.message); }
  };

  const handleDecline = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!decliningId) return;
    try { await sidekitService.declineRequest(decliningId, declineReason); setDecliningId(null); fetch(); }
    catch (err: any) { alert(err.message); }
  };

  const handleHandover = async (id: string) => {
    try { await sidekitService.handoverRequest(id); showToast('Marked as handed over.'); fetch(); }
    catch (err: any) { alert(err.message); }
  };

  const handleReturn = async (id: string, kind: string) => {
    try {
      await sidekitService.returnRequest(id);
      showToast(kind === 'buy' ? 'Sale completed!' : 'Returned! Inventory released.');
      fetch();
    } catch (err: any) { alert(err.message); }
  };

  return (
    <div className="max-w-4xl mx-auto py-8 px-4 space-y-6">
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-xl font-bold text-ink">Owner Inbox</h1>
          <p className="text-xs text-ink-muted mt-0.5">Requests from neighbours for your listed items.</p>
        </div>
        {toast && (
          <div className="flex items-center gap-2 px-3 py-2 bg-emerald-50 border border-emerald-200 rounded-xl text-xs text-emerald-800">
            <CheckCircle2 className="w-4 h-4 text-emerald-600 shrink-0" />
            {toast}
          </div>
        )}
      </div>

      {isLoading ? (
        <div className="py-16 text-center text-sm text-ink-muted">Loading inbox...</div>
      ) : requests.length === 0 ? (
        <div className="py-16 text-center bg-white rounded-2xl border border-surface-border space-y-3">
          <Inbox className="w-8 h-8 text-ink-muted mx-auto" />
          <p className="text-sm font-semibold text-ink">Inbox is clear</p>
          <p className="text-xs text-ink-muted">No incoming requests right now.</p>
          <Link to="/my/listings/new" className="inline-block mt-2 px-4 py-2 bg-evergreen text-white rounded-xl text-xs font-semibold">
            Add More Items
          </Link>
        </div>
      ) : (
        <div className="space-y-3">
          {requests.map((r) => (
            <div key={r.id} className="bg-white rounded-2xl border border-surface-border p-5 space-y-4">
              {/* Top row */}
              <div className="flex flex-wrap items-start justify-between gap-3">
                <div>
                  <h3 className="text-sm font-bold text-ink">{r.listingTitle}</h3>
                  <p className="text-xs text-ink-muted mt-0.5">
                    From <strong>{r.requesterName}</strong> · {r.requesterTower}
                  </p>
                </div>
                <span className={`text-[11px] font-bold px-2.5 py-1 rounded-full border ${STATUS_STYLES[r.status] || ''}`}>
                  {STATUS_LABELS[r.status] || r.status}
                </span>
              </div>

              {/* Details grid */}
              <div className="grid grid-cols-2 sm:grid-cols-4 gap-3 text-xs">
                <div><span className="text-ink-muted block">Type</span><strong className="capitalize">{r.kind}</strong></div>
                <div><span className="text-ink-muted block">Qty</span><strong>{r.requestedQuantity}</strong></div>
                {r.neededFrom && (
                  <div><span className="text-ink-muted block">Dates</span><strong>{r.neededFrom} → {r.neededTo}</strong></div>
                )}
                <div><span className="text-ink-muted block">Amount</span>
                  <strong>{r.totalPrice ? `₹${r.totalPrice}` : 'Free'}</strong>
                </div>
              </div>

              {/* Message */}
              {r.note && (
                <blockquote className="p-3 bg-surface-secondary rounded-xl border-l-2 border-evergreen/30 text-xs text-ink italic">
                  "{r.note}"
                </blockquote>
              )}

              {/* Contact — only shown when accepted/handed_over */}
              {(r.status === 'accepted' || r.status === 'handed_over') && r.requesterPhone && (
                <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-3 p-3 bg-emerald-50 border border-emerald-200 rounded-xl">
                  <div className="text-xs">
                    <span className="font-bold text-emerald-900">Contact Unlocked: </span>
                    <span className="text-emerald-800 font-mono">{r.requesterFlat} · {r.requesterPhone}</span>
                  </div>
                  <button
                    type="button"
                    onClick={() => setWhatsapp({ open: true, name: r.requesterName || '', phone: r.requesterPhone || '', item: r.listingTitle || '' })}
                    className="flex items-center gap-1.5 px-3 py-1.5 bg-emerald-700 hover:bg-emerald-800 text-white rounded-lg text-xs font-semibold shrink-0"
                  >
                    <MessageSquare className="w-3.5 h-3.5" />
                    Coordinate
                  </button>
                </div>
              )}

              {/* Action buttons */}
              <div className="flex flex-wrap items-center justify-end gap-2 pt-1 border-t border-surface-border">
                {r.status === 'pending' && (
                  <>
                    <button onClick={() => setDecliningId(r.id)}
                      className="px-4 py-1.5 text-xs font-semibold text-rose-600 hover:bg-rose-50 rounded-lg transition-colors">
                      Decline
                    </button>
                    <button onClick={() => handleAccept(r.id)}
                      className="px-4 py-1.5 text-xs font-semibold bg-evergreen hover:bg-evergreen-dark text-white rounded-lg transition-colors">
                      Accept
                    </button>
                  </>
                )}
                {r.status === 'accepted' && (
                  <button onClick={() => handleHandover(r.id)}
                    className="flex items-center gap-1.5 px-4 py-1.5 text-xs font-semibold bg-blue-600 hover:bg-blue-700 text-white rounded-lg">
                    <Package className="w-3.5 h-3.5" />
                    Mark Handed Over
                  </button>
                )}
                {r.status === 'handed_over' && (
                  <button onClick={() => handleReturn(r.id, r.kind)}
                    className="flex items-center gap-1.5 px-4 py-1.5 text-xs font-semibold bg-purple-700 hover:bg-purple-800 text-white rounded-lg">
                    <RotateCcw className="w-3.5 h-3.5" />
                    {r.kind === 'buy' ? 'Mark as Sold' : 'Mark Returned'}
                  </button>
                )}
              </div>
            </div>
          ))}
        </div>
      )}

      {/* Decline modal */}
      {decliningId && (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-ink/40 backdrop-blur-sm">
          <div className="bg-white rounded-2xl max-w-sm w-full p-6 shadow-2xl border border-surface-border">
            <h3 className="text-sm font-bold text-ink mb-1">Decline Request</h3>
            <p className="text-xs text-ink-muted mb-4">Let the resident know why the item is unavailable.</p>
            <form onSubmit={handleDecline} className="space-y-3">
              <div className="space-y-1.5">
                {['Not available during requested dates', 'Item in personal use', 'Undergoing maintenance', 'Unavailable for handover'].map((r) => (
                  <label key={r} className="flex items-center gap-2 p-2 rounded-lg hover:bg-surface-secondary cursor-pointer text-xs">
                    <input type="radio" name="dr" value={r} checked={declineReason === r}
                      onChange={(e) => setDeclineReason(e.target.value)} className="text-evergreen" />
                    {r}
                  </label>
                ))}
              </div>
              <div className="flex justify-end gap-2 pt-1">
                <button type="button" onClick={() => setDecliningId(null)}
                  className="px-4 py-2 text-xs text-ink-muted hover:bg-surface-secondary rounded-lg">Cancel</button>
                <button type="submit"
                  className="px-4 py-2 text-xs font-semibold bg-rose-600 hover:bg-rose-700 text-white rounded-lg">
                  Confirm Decline
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
