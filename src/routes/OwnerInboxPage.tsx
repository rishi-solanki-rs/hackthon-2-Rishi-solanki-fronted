import React, { useState, useEffect } from 'react';
import { Link } from 'react-router-dom';
import { CheckCircle2, Package, RotateCcw, MessageSquare, AlertCircle } from 'lucide-react';
import { Request } from '@sidekit/shared';
import { sidekitService } from '../services';
import { useAuth } from '../context/AuthContext';
import { WhatsAppModal } from '../components/shared/WhatsAppModal';
import { BrandLoader, EmptyState } from '../components/brand/BrandStates';
import { ItemThumb } from '../components/brand/itemIcons';
import { requestTotalLabel } from '../components/shared/listingPrice';

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

  const [actionError, setActionError] = useState('');
  const [loadError, setLoadError] = useState('');

  const fetch = async () => {
    setIsLoading(true);
    setLoadError('');
    try {
      const incoming = await sidekitService.getOwnerRequests();
      // Pending requests first, then most recently updated
      setRequests([...incoming].sort((a, b) =>
        Number(b.status === 'pending') - Number(a.status === 'pending') ||
        new Date(b.updatedAt).getTime() - new Date(a.updatedAt).getTime()));
    } catch (err: any) {
      setLoadError(err?.message || 'Could not load your inbox.');
    }
    setIsLoading(false);
  };

  useEffect(() => { fetch(); }, [currentUser]);

  const showToast = (msg: string) => { setActionError(''); setToast(msg); setTimeout(() => setToast(''), 3000); };
  const run = async (action: () => Promise<unknown>, success: string) => {
    try { await action(); showToast(success); fetch(); }
    catch (err: any) { setToast(''); setActionError(err?.message || 'Action failed.'); }
  };

  const handleAccept = async (id: string) => {
    setActionError('');
    try {
      const res = await sidekitService.acceptRequest(id);
      showToast(res.autoDeclinedCount > 0
        ? `Accepted! ${res.autoDeclinedCount} competing request(s) auto-declined.`
        : 'Request accepted. Contact details now visible.');
      fetch();
    } catch (err: any) { setActionError(err?.message || 'Could not accept.'); }
  };

  const handleDecline = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!decliningId) return;
    const target = decliningId;
    setDecliningId(null);
    await run(() => sidekitService.declineRequest(target, declineReason), 'Request declined.');
  };

  const handleHandover = (id: string) => run(() => sidekitService.handoverRequest(id), 'Marked as handed over.');

  const handleReturn = (id: string, kind: string) =>
    run(() => sidekitService.returnRequest(id), kind === 'buy' ? 'Sale completed!' : 'Returned! Inventory released.');

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

      {actionError && (
        <div role="alert" className="flex items-start gap-2 p-3 bg-red-50 border border-red-200 rounded-xl text-xs text-red-700">
          <AlertCircle className="w-4 h-4 shrink-0 mt-0.5" aria-hidden="true" />
          <span>{actionError}</span>
        </div>
      )}

      {isLoading ? (
        <BrandLoader label="Loading inbox…" />
      ) : loadError ? (
        <EmptyState illustration="offline" title="Couldn't load your inbox" description={loadError}
          action={<button onClick={fetch} className="text-xs text-evergreen font-semibold hover:underline">Try again</button>} />
      ) : requests.length === 0 ? (
        <div className="bg-surface rounded-2xl border border-surface-border">
          <EmptyState
            illustration="inbox-empty"
            title="Inbox is clear"
            description="No incoming requests right now."
            action={
              <Link to="/my/listings/new" className="inline-block px-4 py-2 bg-brand text-white rounded-xl text-xs font-semibold">
                Add More Items
              </Link>
            }
          />
        </div>
      ) : (
        <div className="space-y-3">
          {requests.map((r) => (
            <div key={r.id} className="bg-surface rounded-2xl border border-surface-border p-5 space-y-4">
              {/* Top row */}
              <div className="flex flex-wrap items-start justify-between gap-3">
                <div className="flex items-start gap-3 min-w-0">
                  <ItemThumb title={r.listingTitle} size={40} />
                  <div className="min-w-0">
                    <Link to={`/listing/${r.listingId}`} className="text-sm font-bold text-ink hover:text-evergreen">{r.listingTitle}</Link>
                    <p className="text-xs text-ink-muted mt-0.5">
                      From <Link to={`/u/${r.requesterId}`} className="font-semibold hover:text-evergreen">{r.requesterName}</Link> · {r.requesterTower}
                    </p>
                  </div>
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
                  <strong>{requestTotalLabel(r)}</strong>
                </div>
              </div>

              {/* Message */}
              {r.note && (
                <blockquote className="p-3 bg-surface-secondary rounded-xl border-l-2 border-evergreen/30 text-xs text-ink italic">
                  "{r.note}"
                </blockquote>
              )}

              {r.status === 'completed' && r.thankYouNote && (
                <p className="text-xs text-evergreen italic">Thank-you from {r.requesterName}: "{r.thankYouNote}"</p>
              )}
              {r.status === 'declined' && r.declineReason && (
                <p className="text-xs text-ink-muted italic">Declined: "{r.declineReason}"</p>
              )}
              {r.status === 'cancelled' && r.cancellationReason && (
                <p className="text-xs text-ink-muted italic">Cancelled: "{r.cancellationReason}"</p>
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
                    className="flex items-center gap-1.5 px-3 py-1.5 bg-brand hover:bg-brand-dark text-white rounded-lg text-xs font-semibold shrink-0"
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
                      className="px-4 py-1.5 text-xs font-semibold bg-brand hover:bg-brand-dark text-white rounded-lg transition-colors">
                      Accept
                    </button>
                  </>
                )}
                {r.status === 'accepted' && (
                  <button onClick={() => handleHandover(r.id)}
                    className="flex items-center gap-1.5 px-4 py-1.5 text-xs font-semibold bg-info hover:bg-info/90 text-white rounded-lg">
                    <Package className="w-3.5 h-3.5" />
                    Mark Handed Over
                  </button>
                )}
                {r.status === 'handed_over' && (
                  <button onClick={() => handleReturn(r.id, r.kind)}
                    className="flex items-center gap-1.5 px-4 py-1.5 text-xs font-semibold bg-used hover:bg-used/90 text-white rounded-lg">
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
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/50 backdrop-blur-sm">
          <div className="bg-surface rounded-2xl max-w-sm w-full p-6 shadow-2xl border border-surface-border">
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
                  className="px-4 py-2 text-xs font-semibold bg-danger hover:bg-danger/90 text-white rounded-lg">
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
