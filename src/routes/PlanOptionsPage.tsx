import React, { useState, useEffect } from 'react';
import { useParams, Link, useNavigate } from 'react-router-dom';
import { AlertTriangle, Bell, CheckCircle2, Store } from 'lucide-react';
import {
  PlanOptionsMatrix,
  RankedOption,
  Request,
  computeRequestTotal,
  bookingDays,
  suggestedBookingDays,
} from '@sidekit/shared';
import { sidekitService } from '../services';
import { SampleBadge } from '../components/shared/SampleBadge';
import { SafetyGateNotice } from '../components/shared/SafetyGateNotice';
import { ItemThumb } from '../components/brand/itemIcons';
import { BrandLoader, EmptyState } from '../components/brand/BrandStates';
import { Illustration } from '../components/brand/sidekit-art';
import { FeatureIcon, FeatureIconName } from '../components/brand/sidekit-icons';

const MODE_META: Record<string, { label: string; icon: FeatureIconName; cls: string }> = {
  lend: { label: 'Free Borrow', icon: 'borrow', cls: 'bg-emerald-50 text-emerald-700 border-emerald-200' },
  rent: { label: 'Rent', icon: 'rent', cls: 'bg-blue-50 text-blue-700 border-blue-200' },
  sell_used: { label: 'Buy Used', icon: 'buy-used', cls: 'bg-purple-50 text-purple-700 border-purple-200' },
  buy_new: { label: 'Buy New', icon: 'buy-new', cls: 'bg-slate-50 text-slate-600 border-slate-200' },
};

const ACTIVE_STATUSES = new Set(['pending', 'accepted', 'handed_over']);

function localDate(offsetDays: number): string {
  const d = new Date();
  d.setDate(d.getDate() + offsetDays);
  const pad = (n: number) => String(n).padStart(2, '0');
  return `${d.getFullYear()}-${pad(d.getMonth() + 1)}-${pad(d.getDate())}`;
}

function kindFor(opt: RankedOption): 'borrow' | 'rent' | 'buy' {
  return opt.mode === 'lend' ? 'borrow' : opt.mode === 'rent' ? 'rent' : 'buy';
}

export const PlanOptionsPage: React.FC = () => {
  const { id } = useParams<{ id: string }>();
  const navigate = useNavigate();
  const [matrix, setMatrix] = useState<PlanOptionsMatrix | null>(null);
  const [newOnly, setNewOnly] = useState(false);
  const [isLoading, setIsLoading] = useState(true);
  const [loadError, setLoadError] = useState('');
  const [bookingLength, setBookingLength] = useState(1);
  const [activeRequests, setActiveRequests] = useState<Map<string, Request>>(new Map());
  const [demandState, setDemandState] = useState<Record<string, 'saving' | 'done' | 'error'>>({});

  // Booking modal
  const [selectedOption, setSelectedOption] = useState<RankedOption | null>(null);
  const [neededFrom, setNeededFrom] = useState('');
  const [neededTo, setNeededTo] = useState('');
  const [requestQty, setRequestQty] = useState(1);
  const [requestNote, setRequestNote] = useState('');
  const [submitting, setSubmitting] = useState(false);
  const [success, setSuccess] = useState(false);
  const [error, setError] = useState('');

  const loadRequests = () =>
    sidekitService
      .getMyRequests()
      .then((mine) => setActiveRequests(new Map(mine.filter((r) => ACTIVE_STATUSES.has(r.status)).map((r) => [r.listingId, r]))))
      .catch(() => setActiveRequests(new Map()));

  const load = async (onlyNew = newOnly) => {
    if (!id) return;
    setIsLoading(true);
    setLoadError('');
    try {
      setMatrix(await sidekitService.getPlanOptions(id, onlyNew));
    } catch (err: any) {
      setMatrix(null);
      setLoadError(err?.message || 'Could not load options for this plan.');
    }
    setIsLoading(false);
  };

  useEffect(() => {
    if (!id) return;
    load();
    loadRequests();
    sidekitService.getPlan(id).then((plan) => setBookingLength(suggestedBookingDays(plan?.clarificationAnswers))).catch(() => {});
  }, [id]);

  const notifyMe = async (itemKey: string, itemName: string) => {
    setDemandState((s) => ({ ...s, [itemKey]: 'saving' }));
    try {
      await sidekitService.registerDemand(itemKey, itemName);
      setDemandState((s) => ({ ...s, [itemKey]: 'done' }));
    } catch {
      setDemandState((s) => ({ ...s, [itemKey]: 'error' }));
    }
  };

  const toggle = (val: boolean) => { setNewOnly(val); load(val); };

  const openBooking = (opt: RankedOption, qty: number) => {
    setSelectedOption(opt);
    setRequestQty(Math.max(1, Math.min(qty, opt.availableQuantity)));
    setNeededFrom(localDate(1));
    setNeededTo(localDate(1 + bookingLength));
    setError(''); setSuccess(false); setRequestNote('');
  };

  const submitBooking = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!selectedOption?.listingId || submitting) return;
    setSubmitting(true); setError('');
    try {
      const kind = kindFor(selectedOption);
      await sidekitService.createRequest({
        listingId: selectedOption.listingId,
        planId: id,
        kind,
        requestedQuantity: requestQty,
        neededFrom: kind !== 'buy' ? neededFrom : undefined,
        neededTo: kind !== 'buy' ? neededTo : undefined,
        note: requestNote.trim() || undefined,
      });
      setSuccess(true);
      loadRequests();
      setTimeout(() => { setSelectedOption(null); setSuccess(false); navigate('/my/requests'); }, 1800);
    } catch (err: any) {
      setError(err.message || 'Failed to send request.');
    }
    setSubmitting(false);
  };

  if (isLoading) return <BrandLoader label="Ranking options from your community…" />;

  if (loadError || !matrix) {
    return (
      <div className="max-w-3xl mx-auto py-10 px-4">
        <EmptyState
          illustration="error"
          title="Options unavailable"
          description={loadError || 'Plan not found.'}
          action={
            <div className="flex items-center justify-center gap-4">
              <button type="button" onClick={() => load()} className="text-sm text-evergreen font-semibold hover:underline">Try again</button>
              <Link to="/plan/new" className="text-sm text-ink-muted hover:text-ink">New plan</Link>
            </div>
          }
        />
      </div>
    );
  }

  if (matrix.items.length === 0) {
    return (
      <div className="max-w-3xl mx-auto py-10 px-4 space-y-6">
        {matrix.safetyGate && <SafetyGateNotice gate={matrix.safetyGate} suppressedItemNames={matrix.suppressedItemNames} />}
        <EmptyState
          illustration={matrix.safetyGate ? 'safety-professional' : 'all-owned'}
          title={matrix.safetyGate ? 'Nothing else to source' : 'All items accounted for!'}
          description={matrix.safetyGate
            ? 'The remaining work needs a professional, so there are no items to borrow or buy.'
            : 'You already own everything needed for this task.'}
          action={<Link to={`/plan/${id}`} className="text-sm text-evergreen font-semibold hover:underline">← Back to checklist</Link>}
        />
      </div>
    );
  }

  const modalKind = selectedOption ? kindFor(selectedOption) : 'borrow';
  const modalTotal = selectedOption
    ? computeRequestTotal(selectedOption.unitPrice, modalKind, requestQty, neededFrom, neededTo)
    : null;

  return (
    <div className="max-w-3xl mx-auto py-10 px-4 space-y-8">
      {/* Header */}
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4">
        <div>
          <div className="text-xs font-semibold text-evergreen uppercase tracking-wider mb-1">Options Matrix</div>
          <h1 className="text-xl font-bold text-ink">Find what you need</h1>
          <p className="text-xs text-ink-muted mt-0.5">Free borrows first, then lowest cost, then retail.</p>
        </div>
        <div className="flex items-center rounded-xl border border-surface-border overflow-hidden shrink-0 self-start" role="group" aria-label="Filter options">
          <button
            onClick={() => toggle(false)}
            aria-pressed={!newOnly}
            className={`px-3 py-1.5 text-xs font-semibold transition-colors ${!newOnly ? 'bg-brand text-white' : 'text-ink-muted hover:text-ink'}`}
          >
            All options
          </button>
          <button
            onClick={() => toggle(true)}
            aria-pressed={newOnly}
            className={`px-3 py-1.5 text-xs font-semibold transition-colors ${newOnly ? 'bg-brand text-white' : 'text-ink-muted hover:text-ink'}`}
          >
            New only
          </button>
        </div>
      </div>

      {matrix.safetyGate && <SafetyGateNotice gate={matrix.safetyGate} suppressedItemNames={matrix.suppressedItemNames} />}

      {/* Items */}
      {matrix.items.map((section) => (
        <section key={section.itemKey} className="space-y-3" aria-label={section.itemName}>
          <div className="flex items-center justify-between gap-3">
            <div className="flex items-center gap-3 min-w-0">
              <ItemThumb itemKey={section.itemKey} title={section.itemName} size={40} />
              <h2 className="text-sm font-bold text-ink flex items-center gap-2 flex-wrap">
                {section.itemName}
                {section.isConsumable && (
                  <span className="text-[10px] px-1.5 py-0.5 rounded bg-amber-50 text-amber-700 border border-amber-200 font-semibold">
                    Consumable · buy only
                  </span>
                )}
              </h2>
            </div>
            <span className="text-xs text-ink-muted shrink-0">Need {section.missingQuantity} unit{section.missingQuantity !== 1 ? 's' : ''}</span>
          </div>

          {section.requesterListsItem && (
            <div className="flex items-start gap-2 p-3 rounded-xl border border-evergreen/20 bg-evergreen-light text-xs text-ink">
              <FeatureIcon name="owned" size={18} className="shrink-0" />
              <span>
                You list this item yourself, so it isn't offered back to you.{' '}
                <Link to={`/plan/${id}`} className="font-semibold text-evergreen hover:underline">Mark it as owned</Link> in your checklist.
              </span>
            </div>
          )}

          {section.rankedOptions.length === 0 ? (
            <div className="p-4 bg-surface-secondary rounded-xl border border-surface-border flex flex-col sm:flex-row sm:items-center gap-3 text-sm text-ink-muted">
              <span className="flex-1">No other listings yet. Get notified when a neighbour lists one.</span>
              {demandState[section.itemKey] === 'done' ? (
                <span className="text-xs font-semibold text-evergreen flex items-center gap-1">
                  <CheckCircle2 className="w-3.5 h-3.5" aria-hidden="true" /> You'll be notified
                </span>
              ) : (
                <button
                  type="button"
                  onClick={() => notifyMe(section.itemKey, section.itemName)}
                  disabled={demandState[section.itemKey] === 'saving'}
                  className="px-3 py-1.5 rounded-lg text-xs font-semibold border border-surface-border bg-surface text-ink hover:border-evergreen/40 flex items-center gap-1.5 disabled:opacity-50 shrink-0 focus-ring"
                >
                  <Bell className="w-3.5 h-3.5" aria-hidden="true" />
                  {demandState[section.itemKey] === 'error' ? 'Retry' : 'Notify me when available'}
                </button>
              )}
            </div>
          ) : (
            <div className="space-y-2">
              {section.rankedOptions.map((opt) => {
                const isShop = opt.source === 'external_shop';
                const isFree = opt.tier === 'tier1_free';
                const meta = MODE_META[opt.mode];
                const existing = opt.listingId ? activeRequests.get(opt.listingId) : undefined;

                return (
                  <div
                    key={opt.id}
                    className={`p-4 rounded-2xl border flex flex-col sm:flex-row sm:items-center justify-between gap-4 ${
                      isFree
                        ? 'bg-emerald-50/50 border-emerald-200/60'
                        : opt.tier === 'tier2b_demoted'
                        ? 'bg-amber-50/40 border-amber-200/50'
                        : 'bg-surface border-surface-border'
                    }`}
                  >
                    <div className="flex-1 min-w-0 space-y-1.5">
                      <div className="flex items-center gap-2 flex-wrap">
                        <span className={`inline-flex items-center gap-1 text-[10px] font-bold px-2 py-0.5 rounded border uppercase tracking-wider ${meta?.cls || ''}`}>
                          {meta && <FeatureIcon name={meta.icon} size={13} duotone={false} color="currentColor" />}
                          {meta?.label || opt.mode}
                        </span>
                        {opt.isSameTower && (
                          <span className="text-[10px] px-1.5 py-0.5 rounded bg-lime/80 text-[#17231F] font-semibold">Same Tower</span>
                        )}
                        {opt.isSample && <SampleBadge />}
                      </div>

                      <p className="text-sm font-bold text-ink truncate">{opt.title}</p>

                      <div className="text-xs text-ink-muted flex flex-wrap gap-x-3 gap-y-0.5">
                        <span>{opt.ownerDisplayName} · {opt.ownerTower}</span>
                        <span className="capitalize">{opt.condition.replace('_', ' ')}</span>
                      </div>

                      <p className="text-[11px] text-ink-subtle leading-relaxed">{opt.explanation}</p>

                      {opt.warningNote && (
                        <div className="flex items-start gap-1.5 text-xs text-amber-700 bg-amber-50 border border-amber-200 rounded-lg px-2.5 py-1.5">
                          <AlertTriangle className="w-3.5 h-3.5 shrink-0 mt-0.5" aria-hidden="true" />
                          <span>{opt.warningNote}</span>
                        </div>
                      )}
                    </div>

                    <div className="flex items-center justify-between sm:flex-col sm:items-end gap-3 shrink-0">
                      <div className="text-right">
                        {isFree ? (
                          <span className="text-xl font-bold text-emerald-600">₹0</span>
                        ) : opt.priceUnknown || opt.unitPrice === null ? (
                          <span className="text-xs text-ink-muted font-medium">Price not available</span>
                        ) : opt.priceUnit === 'day' ? (
                          <div>
                            <span className="text-base font-bold text-ink">₹{opt.unitPrice.toLocaleString('en-IN')}</span>
                            <span className="text-xs text-ink-muted">/day</span>
                          </div>
                        ) : (
                          <div>
                            <span className="text-base font-bold text-ink">₹{opt.unitPrice.toLocaleString('en-IN')}</span>
                            {section.missingQuantity > 1 && (
                              <span className="block text-[11px] text-ink-muted">
                                ₹{(opt.totalEstimatedCost ?? 0).toLocaleString('en-IN')} for {section.missingQuantity}
                              </span>
                            )}
                          </div>
                        )}
                      </div>

                      {isShop ? (
                        <div
                          className="flex items-center gap-1.5 px-3 py-1.5 bg-surface-secondary border border-surface-border rounded-lg text-xs text-ink-muted"
                          title={opt.shopAddress}
                        >
                          <Store className="w-3.5 h-3.5" aria-hidden="true" />
                          <span>Visit store · info only</span>
                        </div>
                      ) : existing ? (
                        <Link
                          to="/my/requests"
                          className="flex items-center gap-1.5 px-3 py-1.5 bg-surface-secondary border border-surface-border rounded-lg text-xs font-semibold text-ink"
                        >
                          <FeatureIcon name="pending" size={14} />
                          Request sent
                        </Link>
                      ) : (
                        <button
                          type="button"
                          onClick={() => openBooking(opt, section.missingQuantity)}
                          className={`px-4 py-2 rounded-xl text-xs font-semibold transition-colors focus-ring ${
                            isFree
                              ? 'bg-brand hover:bg-brand-dark text-white'
                              : 'bg-surface-secondary hover:bg-surface-border text-ink border border-surface-border'
                          }`}
                        >
                          {isFree ? 'Request Borrow' : opt.mode === 'rent' ? 'Request Rental' : 'Request to Buy'}
                        </button>
                      )}
                    </div>
                  </div>
                );
              })}
            </div>
          )}
        </section>
      ))}

      {/* Booking modal */}
      {selectedOption && (
        <div className="fixed inset-0 z-50 flex items-end sm:items-center justify-center p-4 bg-black/50 backdrop-blur-sm" role="dialog" aria-modal="true" aria-labelledby="booking-title">
          <div className="bg-surface rounded-2xl w-full max-w-md p-6 shadow-2xl border border-surface-border">
            <h3 id="booking-title" className="text-base font-bold text-ink mb-1">Send Request</h3>
            <p className="text-xs text-ink-muted mb-4">{selectedOption.title} · {selectedOption.ownerDisplayName}</p>

            {success ? (
              <div className="flex flex-col items-center text-center gap-2 py-2">
                <Illustration name="request-sent" width={180} className="brand-art" />
                <p className="text-sm font-semibold text-ink">Request sent!</p>
                <p className="text-xs text-ink-muted">Track it in My Requests. Contact details unlock once the owner accepts.</p>
              </div>
            ) : (
              <form onSubmit={submitBooking} className="space-y-3">
                {error && <div role="alert" className="p-3 bg-red-50 border border-red-200 rounded-xl text-xs text-red-700">{error}</div>}

                {modalKind !== 'buy' && (
                  <div className="grid grid-cols-2 gap-3">
                    <div>
                      <label htmlFor="needed-from" className="block text-xs font-semibold text-ink mb-1">From *</label>
                      <input id="needed-from" type="date" value={neededFrom} min={localDate(0)} onChange={(e) => setNeededFrom(e.target.value)}
                        className="w-full px-2.5 py-1.5 text-xs bg-surface-secondary border border-surface-border rounded-lg focus-ring font-mono" required />
                    </div>
                    <div>
                      <label htmlFor="needed-to" className="block text-xs font-semibold text-ink mb-1">Return by *</label>
                      <input id="needed-to" type="date" value={neededTo} min={neededFrom} onChange={(e) => setNeededTo(e.target.value)}
                        className="w-full px-2.5 py-1.5 text-xs bg-surface-secondary border border-surface-border rounded-lg focus-ring font-mono" required />
                    </div>
                  </div>
                )}

                <div>
                  <label htmlFor="request-qty" className="block text-xs font-semibold text-ink mb-1">Quantity</label>
                  <input id="request-qty" type="number" min="1" max={selectedOption.availableQuantity}
                    value={requestQty} onChange={(e) => setRequestQty(Math.max(1, Math.min(selectedOption.availableQuantity, parseInt(e.target.value) || 1)))}
                    className="w-24 px-2.5 py-1.5 text-xs bg-surface-secondary border border-surface-border rounded-lg focus-ring font-mono" />
                </div>

                <div className="flex items-center justify-between p-3 rounded-xl bg-surface-secondary border border-surface-border text-xs">
                  <span className="text-ink-muted">
                    Estimated total{modalKind === 'rent' ? ` · ${bookingDays(neededFrom, neededTo)} day(s)` : ''}
                  </span>
                  <span className="font-bold text-ink">
                    {modalTotal === null ? 'Price not available' : `₹${modalTotal.toLocaleString('en-IN')}`}
                  </span>
                </div>

                <div>
                  <label htmlFor="request-note" className="block text-xs font-semibold text-ink mb-1">Note to owner (optional)</label>
                  <textarea id="request-note" rows={2} value={requestNote} onChange={(e) => setRequestNote(e.target.value)}
                    placeholder="Hi! I need this for..." maxLength={500}
                    className="w-full p-2.5 text-xs bg-surface-secondary border border-surface-border rounded-lg focus-ring resize-none" />
                </div>

                <div className="flex items-center justify-end gap-2 pt-1">
                  <button type="button" onClick={() => setSelectedOption(null)}
                    className="px-4 py-2 text-xs text-ink-muted hover:bg-surface-secondary rounded-lg">
                    Cancel
                  </button>
                  <button type="submit" disabled={submitting}
                    className="px-5 py-2 text-xs font-semibold bg-brand hover:bg-brand-dark text-white rounded-xl disabled:opacity-50 focus-ring">
                    {submitting ? 'Sending...' : 'Send Request'}
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
