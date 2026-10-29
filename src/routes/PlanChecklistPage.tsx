import React, { useState, useEffect } from 'react';
import { useParams, useNavigate, Link } from 'react-router-dom';
import { ArrowRight, Plus, Trash2, Check, PackageCheck, AlertCircle, Sparkles } from 'lucide-react';
import { Plan, PlanChecklistItem, evaluateItemSafety, isItemSuppressedByGate } from '@sidekit/shared';
import { sidekitService } from '../services';
import { SafetyGateNotice } from '../components/shared/SafetyGateNotice';

export const PlanChecklistPage: React.FC = () => {
  const { id } = useParams<{ id: string }>();
  const navigate = useNavigate();
  const [plan, setPlan] = useState<Plan | null>(null);
  const [items, setItems] = useState<PlanChecklistItem[]>([]);
  const [isLoading, setIsLoading] = useState(true);
  const [isSaving, setIsSaving] = useState(false);
  const [isAdding, setIsAdding] = useState(false);
  const [newName, setNewName] = useState('');
  const [newQty, setNewQty] = useState(1);
  const [newConsumable, setNewConsumable] = useState(false);
  const [addError, setAddError] = useState<string | null>(null);
  const [saveError, setSaveError] = useState<string | null>(null);

  useEffect(() => {
    if (!id) return;
    sidekitService.getPlan(id).then((data) => {
      if (data) { setPlan(data); setItems(data.items); }
      setIsLoading(false);
    }).catch(() => setIsLoading(false));
  }, [id]);

  const toggle = (i: number) => {
    const next = [...items];
    const item = next[i];
    item.ownedQuantity = item.ownedQuantity >= item.neededQuantity ? 0 : item.neededQuantity;
    item.missingQuantity = Math.max(0, item.neededQuantity - item.ownedQuantity);
    setItems(next);
  };

  const adjustQty = (i: number, delta: number) => {
    const next = [...items];
    const item = next[i];
    item.neededQuantity = Math.max(1, item.neededQuantity + delta);
    item.missingQuantity = Math.max(0, item.neededQuantity - item.ownedQuantity);
    setItems(next);
  };

  const removeItem = (i: number) => setItems(items.filter((_, idx) => idx !== i));

  const addItem = (e: React.FormEvent) => {
    e.preventDefault();
    const name = newName.trim();
    if (!name) return;
    const itemKey = name.toLowerCase().replace(/[^a-z0-9]+/g, '_').replace(/^_+|_+$/g, '');
    const safety = evaluateItemSafety(name);
    if (safety.isBlocked) {
      setAddError(safety.warning || 'This item is not allowed on Sidekit.');
      return;
    }
    if (isItemSuppressedByGate({ itemKey, name }, plan?.safetyGate)) {
      setAddError('This tool is hidden for this task for safety reasons. Please hire a professional.');
      return;
    }
    const isConsumable = newConsumable || safety.isConsumable;
    setItems([...items, {
      id: `custom_${Date.now()}`,
      itemKey,
      name,
      neededQuantity: newQty,
      ownedQuantity: 0,
      missingQuantity: newQty,
      reason: 'Added manually',
      isConsumable,
      safetyClass: isConsumable ? 'consumable' : safety.safetyClass,
      source: 'user_added',
    }]);
    setNewName(''); setNewQty(1); setNewConsumable(false); setIsAdding(false); setAddError(null);
  };

  const proceed = async () => {
    if (!id) return;
    setIsSaving(true);
    setSaveError(null);
    try {
      await sidekitService.updatePlanChecklist(id, items);
      navigate(`/plan/${id}/options`);
    } catch (err: any) {
      setSaveError(err?.message || 'Could not save your checklist. Please try again.');
      setIsSaving(false);
    }
  };

  if (isLoading) {
    return <div className="max-w-2xl mx-auto py-20 text-center text-sm text-ink-muted">Loading checklist...</div>;
  }

  if (!plan) {
    return (
      <div className="max-w-2xl mx-auto py-20 text-center space-y-4">
        <p className="text-ink-muted text-sm">Plan not found.</p>
        <Link to="/plan/new" className="text-sm text-evergreen font-semibold hover:underline">← New Plan</Link>
      </div>
    );
  }

  const missing = items.filter((i) => i.missingQuantity > 0);
  const allOwned = items.length > 0 && missing.length === 0;

  return (
    <div className="max-w-2xl mx-auto py-10 px-4 space-y-6">
      {/* Header */}
      <div className="space-y-1">
        <div className="text-xs font-semibold text-evergreen uppercase tracking-wider">Checklist</div>
        <h1 className="text-xl font-bold text-ink leading-snug">{plan.taskDescription}</h1>
        <p className="text-xs text-ink-muted">
          Tick off items you already own — we'll only find the rest.
        </p>
        {plan.aiSource && (
          <p className="flex items-center gap-1 text-[11px] text-ink-subtle">
            <Sparkles className="w-3 h-3" aria-hidden="true" />
            {plan.aiSource === 'gemini'
              ? 'Checklist suggested by AI — review it before you continue.'
              : 'Checklist from a standard template (AI unavailable right now).'}
          </p>
        )}
      </div>

      {plan.safetyGate && <SafetyGateNotice gate={plan.safetyGate} />}

      {/* Items */}
      <div className="bg-white rounded-2xl border border-surface-border overflow-hidden">
        {items.length === 0 ? (
          <div className="py-10 text-center text-sm text-ink-muted">No items. Add one below.</div>
        ) : (
          <div>
            {items.map((item, idx) => {
              const owned = item.ownedQuantity >= item.neededQuantity;
              return (
                <div
                  key={item.id}
                  className={`flex items-center gap-3 p-4 border-b border-surface-border last:border-0 transition-colors ${
                    owned ? 'bg-surface-secondary/40' : 'bg-white'
                  }`}
                >
                  {/* Checkbox */}
                  <button
                    type="button"
                    onClick={() => toggle(idx)}
                    className={`w-5 h-5 rounded-md border-2 flex items-center justify-center shrink-0 transition-colors ${
                      owned ? 'bg-evergreen border-evergreen' : 'border-surface-border hover:border-evergreen'
                    }`}
                    aria-label={owned ? 'Mark as needed' : 'Mark as owned'}
                  >
                    {owned && <Check className="w-3 h-3 text-white stroke-[3]" />}
                  </button>

                  {/* Name + reason */}
                  <div className="flex-1 min-w-0">
                    <div className="flex items-center gap-2 flex-wrap">
                      <span className={`text-sm font-semibold ${owned ? 'line-through text-ink-muted' : 'text-ink'}`}>
                        {item.name}
                      </span>
                      {item.isConsumable && (
                        <span className="text-[10px] px-1.5 py-0.5 rounded bg-amber-50 text-amber-700 border border-amber-200 font-semibold">
                          Consumable
                        </span>
                      )}
                      {owned && (
                        <span className="text-[10px] px-1.5 py-0.5 rounded bg-emerald-50 text-emerald-700 font-semibold">
                          Owned ✓
                        </span>
                      )}
                    </div>
                    <p className="text-xs text-ink-muted mt-0.5 leading-relaxed line-clamp-1">{item.reason}</p>
                  </div>

                  {/* Quantity control */}
                  <div className="flex items-center gap-1 shrink-0">
                    <button
                      type="button"
                      onClick={() => adjustQty(idx, -1)}
                      className="w-6 h-6 rounded border border-surface-border flex items-center justify-center text-ink-muted hover:text-ink text-sm"
                    >
                      −
                    </button>
                    <span className="w-6 text-center text-xs font-bold text-ink font-mono">{item.neededQuantity}</span>
                    <button
                      type="button"
                      onClick={() => adjustQty(idx, 1)}
                      className="w-6 h-6 rounded border border-surface-border flex items-center justify-center text-ink-muted hover:text-ink text-sm"
                    >
                      +
                    </button>
                  </div>

                  <button
                    type="button"
                    onClick={() => removeItem(idx)}
                    className="p-1.5 text-ink-subtle hover:text-red-500 transition-colors shrink-0"
                    aria-label="Remove item"
                  >
                    <Trash2 className="w-3.5 h-3.5" />
                  </button>
                </div>
              );
            })}
          </div>
        )}

        {/* Add item */}
        <div className="p-3 border-t border-surface-border bg-surface-secondary/30">
          {isAdding ? (
            <form onSubmit={addItem} className="space-y-2">
              <div className="flex gap-2">
                <input
                  type="text"
                  value={newName}
                  onChange={(e) => setNewName(e.target.value)}
                  placeholder="Item name"
                  className="flex-1 px-2.5 py-1.5 text-xs bg-white border border-surface-border rounded-lg focus-ring"
                  required
                  autoFocus
                />
                <input
                  type="number"
                  min="1"
                  value={newQty}
                  onChange={(e) => setNewQty(parseInt(e.target.value) || 1)}
                  className="w-16 px-2.5 py-1.5 text-xs bg-white border border-surface-border rounded-lg focus-ring font-mono"
                />
              </div>
              {addError && (
                <p role="alert" className="flex items-start gap-1.5 text-xs text-red-700">
                  <AlertCircle className="w-3.5 h-3.5 shrink-0 mt-0.5" aria-hidden="true" />
                  <span>{addError}</span>
                </p>
              )}
              <div className="flex items-center justify-between">
                <label className="flex items-center gap-1.5 text-xs text-ink-muted cursor-pointer">
                  <input
                    type="checkbox"
                    checked={newConsumable}
                    onChange={(e) => setNewConsumable(e.target.checked)}
                    className="rounded text-evergreen"
                  />
                  Consumable item
                </label>
                <div className="flex gap-2">
                  <button type="button" onClick={() => { setIsAdding(false); setAddError(null); }} className="text-xs text-ink-muted px-2 py-1 hover:bg-surface rounded">
                    Cancel
                  </button>
                  <button type="submit" className="text-xs text-evergreen font-semibold px-2 py-1 hover:bg-evergreen/5 rounded">
                    Add
                  </button>
                </div>
              </div>
            </form>
          ) : (
            <button
              type="button"
              onClick={() => setIsAdding(true)}
              className="flex items-center gap-1.5 text-xs text-ink-muted hover:text-evergreen font-medium transition-colors"
            >
              <Plus className="w-3.5 h-3.5" />
              Add item
            </button>
          )}
        </div>
      </div>

      {/* All owned banner */}
      {allOwned && (
        <div className="flex items-center gap-3 p-4 bg-emerald-50 border border-emerald-200 rounded-2xl text-sm text-emerald-800">
          <PackageCheck className="w-5 h-5 text-emerald-600 shrink-0" />
          <span>You own everything needed. You're ready to start!</span>
        </div>
      )}

      {saveError && (
        <div role="alert" className="flex items-start gap-2 p-3 bg-red-50 border border-red-200 rounded-xl text-xs text-red-700">
          <AlertCircle className="w-4 h-4 shrink-0 mt-0.5" aria-hidden="true" />
          <span>{saveError}</span>
        </div>
      )}

      {/* Footer actions */}
      <div className="flex items-center justify-between pt-2">
        <Link to="/plan/new" className="text-xs text-ink-muted hover:text-ink">← Start over</Link>
        <button
          type="button"
          onClick={proceed}
          disabled={isSaving || items.length === 0}
          className="px-5 py-2.5 bg-evergreen hover:bg-evergreen-dark text-white rounded-xl font-semibold text-sm transition-colors flex items-center gap-2 disabled:opacity-50"
        >
          {isSaving ? (
            <><span className="w-4 h-4 border-2 border-white/30 border-t-white rounded-full animate-spin" /><span>Saving...</span></>
          ) : (
            <>
              <span>{allOwned ? 'View Options' : `Find ${missing.length} missing item${missing.length !== 1 ? 's' : ''}`}</span>
              <ArrowRight className="w-4 h-4" />
            </>
          )}
        </button>
      </div>
    </div>
  );
};
