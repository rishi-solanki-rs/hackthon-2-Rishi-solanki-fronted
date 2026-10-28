import React, { useState, useEffect } from 'react';
import { useParams, Link } from 'react-router-dom';
import {
  Sparkles,
  ShieldAlert,
  ArrowRight,
  Store,
  Calendar,
  AlertTriangle,
  CheckCircle2,
  HelpCircle,
  Clock,
  MapPin,
  ExternalLink,
  ChevronDown,
  Info,
} from 'lucide-react';
import { PlanOptionsMatrix, RankedOption } from '@sidekit/shared';
import { sidekitService } from '../services';
import { SampleBadge } from '../components/shared/SampleBadge';
import { useAuth } from '../context/AuthContext';

export const PlanOptionsPage: React.FC = () => {
  const { id } = useParams<{ id: string }>();
  const { currentUser } = useAuth();

  const [matrix, setMatrix] = useState<PlanOptionsMatrix | null>(null);
  const [newOnly, setNewOnly] = useState(false);
  const [isLoading, setIsLoading] = useState(true);

  // Request Modal State
  const [selectedOption, setSelectedOption] = useState<RankedOption | null>(null);
  const [neededFrom, setNeededFrom] = useState('');
  const [neededTo, setNeededTo] = useState('');
  const [requestQty, setRequestQty] = useState(1);
  const [requestNote, setRequestNote] = useState('');
  const [isSubmittingRequest, setIsSubmittingRequest] = useState(false);
  const [requestSuccess, setRequestSuccess] = useState<string | null>(null);
  const [requestError, setRequestError] = useState<string | null>(null);

  // Demand tracking state (FIX-DEMAND-01)
  const [notifiedItems, setNotifiedItems] = useState<Record<string, boolean>>({});

  const loadOptions = async (onlyNew = newOnly) => {
    if (!id) return;
    try {
      setIsLoading(true);
      const data = await sidekitService.getPlanOptions(id, onlyNew);
      setMatrix(data);
    } catch (err) {
      console.error(err);
    } finally {
      setIsLoading(false);
    }
  };

  useEffect(() => {
    // Set default needed dates to tomorrow and day after
    const tomorrow = new Date();
    tomorrow.setDate(tomorrow.getDate() + 1);
    const dayAfter = new Date();
    dayAfter.setDate(dayAfter.getDate() + 2);

    setNeededFrom(tomorrow.toISOString().split('T')[0]);
    setNeededTo(dayAfter.toISOString().split('T')[0]);

    loadOptions();
  }, [id]);

  const handleToggleNewOnly = (val: boolean) => {
    setNewOnly(val);
    loadOptions(val);
  };

  const handleOpenBooking = (option: RankedOption, defaultQty: number) => {
    setSelectedOption(option);
    setRequestQty(defaultQty);
    setRequestNote('');
    setRequestError(null);
    setRequestSuccess(null);
  };

  const handleSubmitBooking = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!selectedOption || !selectedOption.listingId) return;

    // Idempotent guard
    if (isSubmittingRequest) return;

    try {
      setIsSubmittingRequest(true);
      setRequestError(null);

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

      setRequestSuccess(`Request sent to ${selectedOption.ownerDisplayName}! You can track it in My Requests.`);
      setTimeout(() => {
        setSelectedOption(null);
        setRequestSuccess(null);
      }, 2000);
    } catch (err: any) {
      setRequestError(err.message || 'Failed to submit request.');
    } finally {
      setIsSubmittingRequest(false);
    }
  };

  const handleNotifyDemand = (itemKey: string) => {
    setNotifiedItems((prev) => ({ ...prev, [itemKey]: true }));
  };

  if (isLoading) {
    return (
      <div className="max-w-4xl mx-auto py-16 text-center text-ink-muted">
        Evaluating society listings and external store pricing...
      </div>
    );
  }

  if (!matrix || matrix.items.length === 0) {
    return (
      <div className="max-w-4xl mx-auto py-16 text-center space-y-4">
        <h2 className="text-xl font-bold text-ink">All items already in your possession!</h2>
        <p className="text-xs text-ink-muted">
          Your plan has zero missing items. You can proceed directly to starting your task.
        </p>
        <Link to={`/plan/${id}`} className="text-xs font-semibold text-evergreen hover:underline">
          ← Back to checklist
        </Link>
      </div>
    );
  }

  return (
    <div className="max-w-4xl mx-auto py-8 px-4 space-y-8">
      {/* Page Title & Filter Bar */}
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4 pb-4 border-b border-surface-border">
        <div>
          <div className="text-xs font-semibold text-evergreen uppercase tracking-wider mb-1">
            Step 3 · Options Matrix
          </div>
          <h1 className="text-2xl sm:text-3xl font-bold tracking-tight text-ink">
            Compare & Obtain Missing Items
          </h1>
          <p className="text-xs text-ink-muted mt-1">
            Deterministic 4-tier ranking: Free Borrow → Lowest Rental / Fair Used → Demoted Used → Unknown Price.
          </p>
        </div>

        {/* Second Hand Toggle */}
        <div className="flex items-center gap-2 bg-surface p-1.5 rounded-2xl border border-surface-border shrink-0 self-start sm:self-auto">
          <button
            type="button"
            onClick={() => handleToggleNewOnly(false)}
            className={`px-3 py-1.5 rounded-xl text-xs font-semibold transition-colors ${
              !newOnly ? 'bg-evergreen text-white shadow-sm' : 'text-ink-muted hover:text-ink'
            }`}
          >
            Second-hand is fine
          </button>
          <button
            type="button"
            onClick={() => handleToggleNewOnly(true)}
            className={`px-3 py-1.5 rounded-xl text-xs font-semibold transition-colors ${
              newOnly ? 'bg-evergreen text-white shadow-sm' : 'text-ink-muted hover:text-ink'
            }`}
          >
            New only
          </button>
        </div>
      </div>

      {/* Item Sections */}
      <div className="space-y-8">
        {matrix.items.map((itemSection) => (
          <div
            key={itemSection.itemKey}
            className="bg-surface rounded-3xl border border-surface-border p-6 shadow-sm space-y-4"
          >
            <div className="flex flex-wrap items-center justify-between gap-2 border-b border-surface-border pb-3">
              <div>
                <h3 className="text-base font-bold text-ink">{itemSection.itemName}</h3>
                <span className="text-xs text-ink-muted">
                  Required: {itemSection.missingQuantity} unit(s)
                </span>
              </div>
              {itemSection.isConsumable && (
                <span className="text-[11px] px-2 py-0.5 rounded-full bg-amber-50 text-amber-800 border border-amber-200 font-semibold">
                  Consumable item (Buy/Keep Only)
                </span>
              )}
            </div>

            {/* Options List */}
            {itemSection.rankedOptions.length === 0 ? (
              // Demand miss card (FIX-DEMAND-01)
              <div className="p-4 bg-surface-secondary/60 rounded-2xl border border-surface-border flex flex-col sm:flex-row sm:items-center justify-between gap-3">
                <div className="space-y-1">
                  <div className="text-xs font-bold text-ink flex items-center gap-1.5">
                    <Info className="w-4 h-4 text-ink-muted" />
                    <span>No neighbour has listed this item yet</span>
                  </div>
                  <p className="text-[11px] text-ink-muted">
                    We've registered this demand in the society leaderboard so neighbours who own one can list it.
                  </p>
                </div>
                <button
                  type="button"
                  onClick={() => handleNotifyDemand(itemSection.itemKey)}
                  disabled={notifiedItems[itemSection.itemKey]}
                  className="px-3 py-1.5 bg-surface text-ink hover:bg-surface-border rounded-xl text-xs font-semibold border border-surface-border transition-colors shrink-0 disabled:opacity-50"
                >
                  {notifiedItems[itemSection.itemKey] ? 'Subscribed to Alerts ✓' : 'Notify Me When Available'}
                </button>
              </div>
            ) : (
              <div className="grid grid-cols-1 md:grid-cols-2 gap-3">
                {itemSection.rankedOptions.map((opt) => {
                  const isFree = opt.tier === 'tier1_free';
                  const isDemoted = opt.tier === 'tier2b_demoted';
                  const isUnknownPrice = opt.tier === 'tier3_unknown';
                  const isShop = opt.source === 'external_shop';

                  return (
                    <div
                      key={opt.id}
                      className={`p-4 rounded-2xl border transition-all flex flex-col justify-between gap-3 ${
                        isFree
                          ? 'bg-evergreen-light/40 border-evergreen/30 shadow-sm'
                          : isDemoted
                          ? 'bg-amber-50/30 border-amber-200/60'
                          : 'bg-surface border-surface-border'
                      }`}
                    >
                      <div className="space-y-2">
                        {/* Badges Bar */}
                        <div className="flex items-center justify-between gap-2">
                          <div className="flex items-center gap-1.5 flex-wrap">
                            <SampleBadge />
                            {isFree ? (
                              <span className="text-[10px] font-extrabold px-2 py-0.5 rounded bg-emerald-600 text-white uppercase tracking-wider">
                                FREE BORROW
                              </span>
                            ) : opt.mode === 'rent' ? (
                              <span className="text-[10px] font-bold px-2 py-0.5 rounded bg-blue-50 text-blue-700 border border-blue-200 uppercase">
                                RENT
                              </span>
                            ) : opt.mode === 'sell_used' ? (
                              <span className="text-[10px] font-bold px-2 py-0.5 rounded bg-purple-50 text-purple-700 border border-purple-200 uppercase">
                                BUY PRE-OWNED
                              </span>
                            ) : (
                              <span className="text-[10px] font-bold px-2 py-0.5 rounded bg-slate-100 text-slate-700 border border-slate-200 uppercase">
                                LOCAL RETAIL STORE
                              </span>
                            )}

                            {opt.isSameTower && (
                              <span className="text-[10px] font-semibold px-1.5 py-0.5 rounded bg-lime text-ink">
                                Same Tower
                              </span>
                            )}
                          </div>

                          {/* Pricing Display */}
                          <div className="text-right">
                            {isFree ? (
                              <span className="text-base font-extrabold text-evergreen">₹0</span>
                            ) : isUnknownPrice ? (
                              <span className="text-xs font-semibold text-ink-muted">
                                Price on request
                              </span>
                            ) : (
                              <div>
                                <span className="text-base font-extrabold text-ink">
                                  ₹{opt.totalEstimatedCost?.toLocaleString('en-IN')}
                                </span>
                                {opt.priceUnit === 'day' && (
                                  <span className="text-[10px] text-ink-muted"> /day</span>
                                )}
                              </div>
                            )}
                          </div>
                        </div>

                        {/* Title & Owner */}
                        <div>
                          <h4 className="text-sm font-bold text-ink leading-snug">{opt.title}</h4>
                          <div className="text-xs text-ink-muted mt-0.5 flex items-center gap-1">
                            <span>{opt.ownerDisplayName}</span>
                            <span>·</span>
                            <span>{opt.ownerTower}</span>
                            <span>·</span>
                            <span className="capitalize">{opt.condition.replace('_', ' ')}</span>
                          </div>
                        </div>

                        {/* Warnings / Explanations */}
                        {opt.warningNote && (
                          <div className="p-2 bg-amber-50 border border-amber-200 rounded-xl text-[11px] text-amber-800 flex items-start gap-1.5">
                            <AlertTriangle className="w-3.5 h-3.5 shrink-0 mt-0.5" />
                            <span>{opt.warningNote}</span>
                          </div>
                        )}

                        <p className="text-[11px] text-ink-muted leading-relaxed line-clamp-2">
                          {opt.explanation}
                        </p>
                      </div>

                      {/* Action Button */}
                      <div className="pt-2 border-t border-surface-border">
                        {isShop ? (
                          // External Store Non-Requestable Button (FIX-SHOP-01)
                          <div className="flex items-center justify-between text-xs">
                            <span className="text-ink-muted font-mono text-[11px]">
                              Ph: {opt.shopPhone}
                            </span>
                            <span className="px-3 py-1.5 bg-surface-secondary text-ink font-semibold rounded-xl text-xs flex items-center gap-1">
                              <Store className="w-3.5 h-3.5" />
                              <span>Visit Store</span>
                            </span>
                          </div>
                        ) : (
                          <button
                            type="button"
                            onClick={() => handleOpenBooking(opt, itemSection.missingQuantity)}
                            className={`w-full py-2 px-3 rounded-xl text-xs font-semibold transition-colors flex items-center justify-center gap-1.5 ${
                              isFree
                                ? 'bg-evergreen hover:bg-evergreen-dark text-white'
                                : 'bg-surface-secondary hover:bg-surface-border text-ink'
                            }`}
                          >
                            <span>
                              {isFree
                                ? 'Request Free Borrow'
                                : opt.mode === 'rent'
                                ? 'Request Rental'
                                : 'Request to Buy'}
                            </span>
                            <ArrowRight className="w-3.5 h-3.5" />
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
      </div>

      {/* Booking Modal */}
      {selectedOption && (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-ink/40 backdrop-blur-sm">
          <div className="bg-surface rounded-3xl max-w-md w-full p-6 shadow-2xl border border-surface-border animate-in fade-in zoom-in-95 duration-200">
            <h3 className="text-lg font-bold text-ink">
              Request {selectedOption.mode === 'lend' ? 'Borrow' : selectedOption.mode === 'rent' ? 'Rental' : 'Purchase'}
            </h3>
            <p className="text-xs text-ink-muted mt-1 mb-4">{selectedOption.title}</p>

            {requestSuccess ? (
              <div className="p-4 bg-emerald-50 border border-emerald-200 rounded-2xl flex items-center gap-2 text-xs text-emerald-800">
                <CheckCircle2 className="w-5 h-5 text-emerald-600 shrink-0" />
                <span>{requestSuccess}</span>
              </div>
            ) : (
              <form onSubmit={handleSubmitBooking} className="space-y-4">
                {requestError && (
                  <div className="p-3 bg-red-50 border border-red-200 rounded-xl text-xs text-red-700">
                    {requestError}
                  </div>
                )}

                {selectedOption.mode !== 'sell_used' && (
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
                    Quantity Needed
                  </label>
                  <input
                    type="number"
                    min="1"
                    max={selectedOption.availableQuantity}
                    value={requestQty}
                    onChange={(e) => setRequestQty(parseInt(e.target.value) || 1)}
                    className="w-full px-2.5 py-1.5 text-xs bg-surface-secondary border border-surface-border rounded-xl focus-ring font-mono"
                  />
                </div>

                <div>
                  <label className="block text-[11px] font-bold text-ink uppercase tracking-wider mb-1">
                    Message to Owner (Optional)
                  </label>
                  <textarea
                    rows={2}
                    value={requestNote}
                    onChange={(e) => setRequestNote(e.target.value)}
                    placeholder="Hi! Would love to borrow this for my balcony cleaning tomorrow..."
                    className="w-full p-2.5 text-xs bg-surface-secondary border border-surface-border rounded-xl focus-ring"
                  />
                </div>

                <div className="flex items-center justify-end gap-2 pt-2">
                  <button
                    type="button"
                    onClick={() => setSelectedOption(null)}
                    className="px-4 py-2 text-xs font-semibold text-ink-muted hover:bg-surface-secondary rounded-xl"
                  >
                    Cancel
                  </button>
                  <button
                    type="submit"
                    disabled={isSubmittingRequest}
                    className="px-5 py-2 text-xs font-semibold bg-evergreen hover:bg-evergreen-dark text-white rounded-xl shadow-sm disabled:opacity-50"
                  >
                    {isSubmittingRequest ? 'Sending Request...' : 'Send Request'}
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

