import React, { useState, useEffect } from 'react';
import { useParams, Link, useNavigate } from 'react-router-dom';
import { AlertTriangle, AlertCircle, Bell, CheckCircle2, Info, Store } from 'lucide-react';
import { PlanOptionsMatrix, RankedOption } from '@sidekit/shared';
import { sidekitService } from '../services';
import { SampleBadge } from '../components/shared/SampleBadge';
import { SafetyGateNotice } from '../components/shared/SafetyGateNotice';

const modeLabelMap: Record<string, string> = {
  lend: 'Free Borrow',
  rent: 'Rent',
  sell_used: 'Buy Used',
  buy_new: 'Buy New',
};

const modeBadgeClass: Record<string, string> = {
  lend: 'bg-emerald-50 text-emerald-700 border-emerald-200',
  rent: 'bg-blue-50 text-blue-700 border-blue-200',
  sell_used: 'bg-purple-50 text-purple-700 border-purple-200',
  buy_new: 'bg-slate-50 text-slate-600 border-slate-200',
};

export const PlanOptionsPage: React.FC = () => {
  const { id } = useParams<{ id: string }>();
  const navigate = useNavigate();
  const [matrix, setMatrix] = useState<PlanOptionsMatrix | null>(null);
  const [newOnly, setNewOnly] = useState(false);
  const [isLoading, setIsLoading] = useState(true);

  // Booking modal
  const [selectedOption, setSelectedOption] = useState<RankedOption | null>(null);
  const [neededFrom, setNeededFrom] = useState('');
  const [neededTo, setNeededTo] = useState('');
  const [requestQty, setRequestQty] = useState(1);
  const [requestNote, setRequestNote] = useState('');
  const [submitting, setSubmitting] = useState(false);
  const [success, setSuccess] = useState('');
  const [error, setError] = useState('');
  const [loadError, setLoadError] = useState('');
  const [demandState, setDemandState] = useState<Record<string, 'saving' | 'done' | 'error'>>({});

  const load = async (onlyNew = newOnly) => {
    if (!id) return;
    setIsLoading(true);
    setLoadError('');
    try {
      const data = await sidekitService.getPlanOptions(id, onlyNew);
      setMatrix(data);
    } catch (err: any) {
      setMatrix(null);
      setLoadError(err?.message || 'Could not load options for this plan.');
    }
    setIsLoading(false);
  };

  const notifyMe = async (itemKey: string, itemName: string) => {
    setDemandState((s) => ({ ...s, [itemKey]: 'saving' }));
    try {
      await sidekitService.registerDemand(itemKey, itemName);
      setDemandState((s) => ({ ...s, [itemKey]: 'done' }));
    } catch {
      setDemandState((s) => ({ ...s, [itemKey]: 'error' }));
    }
  };

  useEffect(() => {
    const tomorrow = new Date(); tomorrow.setDate(tomorrow.getDate() + 1);
    const dayAfter = new Date(); dayAfter.setDate(dayAfter.getDate() + 2);
    setNeededFrom(tomorrow.toISOString().split('T')[0]);
    setNeededTo(dayAfter.toISOString().split('T')[0]);
    load();
  }, [id]);

  const toggle = (val: boolean) => { setNewOnly(val); load(val); };

  const openBooking = (opt: RankedOption, qty: number) => {
    setSelectedOption(opt); setRequestQty(Math.max(1, Math.min(qty, opt.availableQuantity)));
    setError(''); setSuccess(''); setRequestNote('');
  };

  const submitBooking = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!selectedOption?.listingId || submitting) return;
    setSubmitting(true); setError('');
    try {
      const kind = selectedOption.mode === 'lend' ? 'borrow' : selectedOption.mode === 'rent' ? 'rent' : 'buy';
      await sidekitService.createRequest({
        listingId: selectedOption.listingId,
        planId: id,
        kind,
        requestedQuantity: requestQty,
        neededFrom: kind !== 'buy' ? neededFrom : undefined,
        neededTo: kind !== 'buy' ? neededTo : undefined,
        note: requestNote.trim() || undefined,
      });
      setSuccess('Request sent! Track it in My Requests.');
      setTimeout(() => { setSelectedOption(null); setSuccess(''); navigate('/my/requests'); }, 2000);
    } catch (err: any) {
      setError(err.message || 'Failed to send request.');
    }
    setSubmitting(false);
  };

  if (isLoading) {
    return (
      <div className="max-w-3xl mx-auto py-20 text-center space-y-3">
        <div className="w-6 h-6 border-2 border-evergreen/30 border-t-evergreen rounded-full animate-spin mx-auto" />
        <p className="text-sm text-ink-muted">Ranking options from your community...</p>
      </div>
    );
  }

  if (loadError || !matrix) {
    return (
      <div className="max-w-3xl mx-auto py-20 px-4 text-center space-y-4">
        <AlertCircle className="w-10 h-10 text-red-500 mx-auto" aria-hidden="true" />
        <h2 className="text-lg font-bold text-ink">Options unavailable</h2>
        <p className="text-sm text-ink-muted">{loadError || 'Plan not found.'}</p>
        <div className="flex items-center justify-center gap-4">
          <button type="button" onClick={() => load()} className="text-sm text-evergreen font-semibold hover:underline">
            Try again
          </button>
          <Link to="/plan/new" className="text-sm text-ink-muted hover:text-ink">New plan</Link>
        </div>
      </div>
    );
  }

  if (matrix.items.length === 0) {
    return (
      <div className="max-w-3xl mx-auto py-10 px-4 space-y-6">
        {matrix.safetyGate && <SafetyGateNotice gate={matrix.safetyGate} suppressedItemNames={matrix.suppressedItemNames} />}
        <div className="py-10 text-center space-y-4">
          <CheckCircle2 className="w-10 h-10 text-evergreen mx-auto" aria-hidden="true" />
          <h2 className="text-lg font-bold text-ink">
            {matrix.safetyGate ? 'Nothing else to source' : 'All items accounted for!'}
          </h2>
          <p className="text-sm text-ink-muted">
            {matrix.safetyGate
              ? 'The remaining work needs a professional, so there are no items to borrow or buy.'
              : 'You already own everything needed for this task.'}
          </p>
          <Link to={`/plan/${id}`} className="text-sm text-evergreen font-semibold hover:underline">← Back to checklist</Link>
        </div>
      </div>
    );
  }

  return (
    <div className="max-w-3xl mx-auto py-10 px-4 space-y-8">
      {/* Header */}
      <div className="flex items-center justify-between gap-4">
        <div>
          <div className="text-xs font-semibold text-evergreen uppercase tracking-wider mb-1">Options Matrix</div>
          <h1 className="text-xl font-bold text-ink">Find what you need</h1>
          <p className="text-xs text-ink-muted mt-0.5">Free borrows first, then lowest cost, then retail.</p>
        </div>
        <div className="flex items-center rounded-xl border border-surface-border overflow-hidden shrink-0">
          <button
            onClick={() => toggle(false)}
            className={`px-3 py-1.5 text-xs font-semibold transition-colors ${!newOnly ? 'bg-evergreen text-white' : 'text-ink-muted hover:text-ink'}`}
          >
            All options
          </button>
          <button
            onClick={() => toggle(true)}
            className={`px-3 py-1.5 text-xs font-semibold transition-colors ${newOnly ? 'bg-evergreen text-white' : 'text-ink-muted hover:text-ink'}`}
          >
            New only
          </button>
        </div>
      </div>

      {matrix.safetyGate && <SafetyGateNotice gate={matrix.safetyGate} suppressedItemNames={matrix.suppressedItemNames} />}

      {/* Items */}
      {matrix.items.map((section) => (
        <div key={section.itemKey} className="space-y-3">
          <div className="flex items-center justify-between gap-2">
            <h3 className="text-sm font-bold text-ink flex items-center gap-2">
              {section.itemName}
              {section.isConsumable && (
                <span className="text-[10px] px-1.5 py-0.5 rounded bg-amber-50 text-amber-700 border border-amber-200 font-semibold">
                  Consumable · buy only
                </span>
              )}
            </h3>
            <span className="text-xs text-ink-muted shrink-0">Need {section.missingQuantity} unit{section.missingQuantity !== 1 ? 's' : ''}</span>
          </div>

          {section.rankedOptions.length === 0 ? (
            <div className="p-4 bg-surface-secondary rounded-xl border border-surface-border flex flex-col sm:flex-row sm:items-center gap-3 text-sm text-ink-muted">
              <div className="flex items-center gap-3 flex-1">
                <Info className="w-4 h-4 shrink-0" aria-hidden="true" />
                <span>No listings available yet. Get notified when a neighbour lists one.</span>
              </div>
              {demandState[section.itemKey] === 'done' ? (
                <span className="text-xs font-semibold text-evergreen flex items-center gap-1">
                  <CheckCircle2 className="w-3.5 h-3.5" aria-hidden="true" /> You'll be notified
                </span>
              ) : (
                <button
                  type="button"
                  onClick={() => notifyMe(section.itemKey, section.itemName)}
                  disabled={demandState[section.itemKey] === 'saving'}
                  className="px-3 py-1.5 rounded-lg text-xs font-semibold border border-surface-border bg-white text-ink hover:border-evergreen/40 flex items-center gap-1.5 disabled:opacity-50 shrink-0"
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

                return (
                  <div
                    key={opt.id}
                    className={`p-4 rounded-2xl border flex flex-col sm:flex-row sm:items-center justify-between gap-4 ${
                      isFree
                        ? 'bg-emerald-50/50 border-emerald-200/60'
                        : opt.tier === 'tier2b_demoted'
                        ? 'bg-amber-50/40 border-amber-200/50'
                        : 'bg-white border-surface-border'
                    }`}
                  >
                    <div className="flex-1 min-w-0 space-y-1.5">
                      <div className="flex items-center gap-2 flex-wrap">
                        <span className={`text-[10px] font-bold px-2 py-0.5 rounded border uppercase tracking-wider ${modeBadgeClass[opt.mode] || ''}`}>
                          {modeLabelMap[opt.mode] || opt.mode}
                        </span>
                        {isFree && (
                          <span className="text-[10px] font-bold px-2 py-0.5 rounded bg-emerald-100 text-emerald-700">
                            FREE
                          </span>
                        )}
                        {opt.isSameTower && (
                          <span className="text-[10px] px-1.5 py-0.5 rounded bg-lime/80 text-ink font-semibold">
                            Same Tower
                          </span>
                        )}
                        {opt.isSample && <SampleBadge />}
                      </div>

                      <div className="flex items-baseline gap-2">
                        <span className="text-sm font-bold text-ink truncate">{opt.title}</span>
                      </div>

                      <div className="text-xs text-ink-muted flex flex-wrap gap-x-3 gap-y-0.5">
                        <span>{opt.ownerDisplayName} · {opt.ownerTower}</span>
                        <span className="capitalize">{opt.condition.replace('_', ' ')}</span>
                      </div>

                      {opt.warningNote && (
                        <div className="flex items-start gap-1.5 text-xs text-amber-700 bg-amber-50 border border-amber-200 rounded-lg px-2.5 py-1.5">
                          <AlertTriangle className="w-3.5 h-3.5 shrink-0 mt-0.5" />
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
                            {section.missingQuantity > 1 && <span className="text-xs text-ink-muted"> each</span>}
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
                      ) : (
                        <button
                          type="button"
                          onClick={() => openBooking(opt, section.missingQuantity)}
                          className={`px-4 py-2 rounded-xl text-xs font-semibold transition-colors ${
                            isFree
                              ? 'bg-evergreen hover:bg-evergreen-dark text-white'
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
        </div>
      ))}

      {/* Booking modal */}
      {selectedOption && (
        <div className="fixed inset-0 z-50 flex items-end sm:items-center justify-center p-4 bg-ink/40 backdrop-blur-sm">
          <div className="bg-white rounded-2xl w-full max-w-md p-6 shadow-2xl border border-surface-border">
            <h3 className="text-base font-bold text-ink mb-1">Send Request</h3>
            <p className="text-xs text-ink-muted mb-4">{selectedOption.title} · {selectedOption.ownerDisplayName}</p>

            {success ? (
              <div className="flex items-center gap-2 p-3 bg-emerald-50 border border-emerald-200 rounded-xl text-xs text-emerald-800">
                <CheckCircle2 className="w-4 h-4 text-emerald-600 shrink-0" />
                <span>{success}</span>
              </div>
            ) : (
              <form onSubmit={submitBooking} className="space-y-3">
                {error && <div className="p-3 bg-red-50 border border-red-200 rounded-xl text-xs text-red-700">{error}</div>}

                {selectedOption.mode !== 'sell_used' && (
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
                  <input type="number" min="1" max={selectedOption.availableQuantity}
                    value={requestQty} onChange={(e) => setRequestQty(parseInt(e.target.value) || 1)}
                    className="w-24 px-2.5 py-1.5 text-xs bg-surface-secondary border border-surface-border rounded-lg focus-ring font-mono" />
                </div>

                <div>
                  <label className="block text-xs font-semibold text-ink mb-1">Note to owner (optional)</label>
                  <textarea rows={2} value={requestNote} onChange={(e) => setRequestNote(e.target.value)}
                    placeholder="Hi! I need this for..."
                    className="w-full p-2.5 text-xs bg-surface-secondary border border-surface-border rounded-lg focus-ring resize-none" />
                </div>

                <div className="flex items-center justify-end gap-2 pt-1">
                  <button type="button" onClick={() => setSelectedOption(null)}
                    className="px-4 py-2 text-xs text-ink-muted hover:bg-surface-secondary rounded-lg">
                    Cancel
                  </button>
                  <button type="submit" disabled={submitting}
                    className="px-5 py-2 text-xs font-semibold bg-evergreen hover:bg-evergreen-dark text-white rounded-xl disabled:opacity-50">
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
