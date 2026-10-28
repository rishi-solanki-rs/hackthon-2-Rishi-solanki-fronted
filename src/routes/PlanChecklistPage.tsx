import React, { useState, useEffect } from 'react';
import { useParams, useNavigate, Link } from 'react-router-dom';
import {
  CheckCircle,
  Plus,
  Trash2,
  ArrowRight,
  ShieldAlert,
  Sparkles,
  Info,
  Check,
  CheckCircle2,
  PackageCheck,
  Wrench,
} from 'lucide-react';
import { Plan, PlanChecklistItem } from '@sidekit/shared';
import { sidekitService } from '../services';

export const PlanChecklistPage: React.FC = () => {
  const { id } = useParams<{ id: string }>();
  const navigate = useNavigate();

  const [plan, setPlan] = useState<Plan | null>(null);
  const [items, setItems] = useState<PlanChecklistItem[]>([]);
  const [isLoading, setIsLoading] = useState(true);
  const [isSaving, setIsSaving] = useState(false);

  // New custom item modal state
  const [isAddingItem, setIsAddingItem] = useState(false);
  const [newItemName, setNewItemName] = useState('');
  const [newItemQty, setNewItemQty] = useState(1);
  const [newItemConsumable, setNewItemConsumable] = useState(false);

  useEffect(() => {
    const fetchPlan = async () => {
      if (!id) return;
      try {
        setIsLoading(true);
        const data = await sidekitService.getPlan(id);
        if (data) {
          setPlan(data);
          setItems(data.items);
        }
      } catch (err) {
        console.error(err);
      } finally {
        setIsLoading(false);
      }
    };
    fetchPlan();
  }, [id]);

  const handleToggleOwned = (index: number) => {
    const next = [...items];
    const item = next[index];
    if (item.ownedQuantity >= item.neededQuantity) {
      item.ownedQuantity = 0;
    } else {
      item.ownedQuantity = item.neededQuantity;
    }
    item.missingQuantity = Math.max(0, item.neededQuantity - item.ownedQuantity);
    setItems(next);
  };

  const handleUpdateQty = (index: number, delta: number) => {
    const next = [...items];
    const item = next[index];
    item.neededQuantity = Math.max(1, item.neededQuantity + delta);
    item.missingQuantity = Math.max(0, item.neededQuantity - item.ownedQuantity);
    setItems(next);
  };

  const handleRemoveItem = (index: number) => {
    const next = items.filter((_, i) => i !== index);
    setItems(next);
  };

  const handleAddCustomItem = (e: React.FormEvent) => {
    e.preventDefault();
    if (!newItemName.trim()) return;

    const newItem: PlanChecklistItem = {
      id: `custom_${Date.now()}`,
      itemKey: newItemName.toLowerCase().replace(/[^a-z0-9]+/g, '_'),
      name: newItemName.trim(),
      neededQuantity: newItemQty,
      ownedQuantity: 0,
      missingQuantity: newItemQty,
      reason: 'User added item',
      isConsumable: newItemConsumable,
      safetyClass: newItemConsumable ? 'consumable' : 'none',
      source: 'user_added',
    };

    setItems([...items, newItem]);
    setNewItemName('');
    setNewItemQty(1);
    setNewItemConsumable(false);
    setIsAddingItem(false);
  };

  const handleProceedToOptions = async () => {
    if (!id) return;
    try {
      setIsSaving(true);
      await sidekitService.updatePlanChecklist(id, items);
      navigate(`/plan/${id}/options`);
    } catch (err) {
      console.error(err);
    } finally {
      setIsSaving(false);
    }
  };

  if (isLoading) {
    return (
      <div className="max-w-3xl mx-auto py-16 text-center text-ink-muted">
        Loading checklist requirements...
      </div>
    );
  }

  if (!plan) {
    return (
      <div className="max-w-3xl mx-auto py-16 text-center space-y-4">
        <h2 className="text-xl font-bold text-ink">Plan not found</h2>
        <Link to="/plan/new" className="text-evergreen hover:underline font-semibold text-sm">
          Create a new plan
        </Link>
      </div>
    );
  }

  const missingItems = items.filter((i) => i.missingQuantity > 0);
  const allOwned = items.length > 0 && missingItems.length === 0;

  return (
    <div className="max-w-3xl mx-auto py-8 px-4 space-y-6">
      {/* Header */}
      <div className="space-y-2">
        <div className="flex items-center justify-between">
          <span className="text-xs font-semibold uppercase tracking-wider text-evergreen bg-evergreen-light px-2.5 py-1 rounded-lg">
            Step 2 · Inventory Subtraction
          </span>
          <span className="text-xs text-ink-muted font-mono">Plan #{plan.id.slice(0, 8)}</span>
        </div>
        <h1 className="text-2xl sm:text-3xl font-bold tracking-tight text-ink">
          {plan.taskDescription}
        </h1>
        <p className="text-xs sm:text-sm text-ink-muted leading-relaxed">
          Tick off items you already own. We'll only search our community catalog for the remaining items you actually need.
        </p>
      </div>

      {/* Checklist Table */}
      <div className="bg-surface rounded-3xl border border-surface-border shadow-sm overflow-hidden">
        <div className="p-4 bg-surface-secondary/50 border-b border-surface-border flex items-center justify-between">
          <span className="text-xs font-bold text-ink uppercase tracking-wider">Required Items</span>
          <span className="text-xs text-ink-muted">
            {missingItems.length} of {items.length} items missing
          </span>
        </div>

        <div className="divide-y divide-surface-border">
          {items.map((item, idx) => {
            const isOwned = item.ownedQuantity >= item.neededQuantity;

            return (
              <div
                key={item.id}
                className={`p-4 transition-colors flex flex-col sm:flex-row sm:items-center justify-between gap-4 ${
                  isOwned ? 'bg-surface-secondary/30 opacity-75' : 'bg-surface'
                }`}
              >
                <div className="flex items-start gap-3 flex-1 min-w-0">
                  <button
                    type="button"
                    onClick={() => handleToggleOwned(idx)}
                    className={`mt-0.5 w-6 h-6 rounded-lg border flex items-center justify-center transition-colors shrink-0 ${
                      isOwned
                        ? 'bg-evergreen border-evergreen text-white'
                        : 'border-surface-border bg-surface hover:border-evergreen text-transparent'
                    }`}
                    title={isOwned ? 'Mark as needed' : 'Mark as already owned'}
                  >
                    <Check className="w-4 h-4 stroke-[3]" />
                  </button>

                  <div className="space-y-1">
                    <div className="flex flex-wrap items-center gap-2">
                      <span className={`text-sm font-bold ${isOwned ? 'line-through text-ink-muted' : 'text-ink'}`}>
                        {item.name}
                      </span>
                      {item.isConsumable && (
                        <span className="text-[10px] px-1.5 py-0.5 rounded bg-amber-50 text-amber-800 border border-amber-200 font-semibold">
                          Consumable (Buy only)
                        </span>
                      )}
                      {isOwned && (
                        <span className="text-[10px] px-1.5 py-0.5 rounded bg-emerald-50 text-emerald-800 font-semibold">
                          Already Owned
                        </span>
                      )}
                    </div>
                    <p className="text-xs text-ink-muted leading-relaxed">{item.reason}</p>
                  </div>
                </div>

                {/* Quantity Controls & Delete */}
                <div className="flex items-center justify-between sm:justify-end gap-3 pt-2 sm:pt-0 border-t sm:border-t-0 border-surface-border">
                  <div className="flex items-center gap-2 bg-surface-secondary rounded-xl p-1 border border-surface-border">
                    <button
                      type="button"
                      onClick={() => handleUpdateQty(idx, -1)}
                      className="w-6 h-6 rounded-lg bg-surface text-ink hover:bg-surface-border flex items-center justify-center font-bold text-xs"
                    >
                      -
                    </button>
                    <span className="text-xs font-bold text-ink w-8 text-center font-mono">
                      {item.neededQuantity}
                    </span>
                    <button
                      type="button"
                      onClick={() => handleUpdateQty(idx, 1)}
                      className="w-6 h-6 rounded-lg bg-surface text-ink hover:bg-surface-border flex items-center justify-center font-bold text-xs"
                    >
                      +
                    </button>
                  </div>

                  <button
                    type="button"
                    onClick={() => handleRemoveItem(idx)}
                    className="p-1.5 text-ink-muted hover:text-red-600 rounded-lg hover:bg-red-50 transition-colors"
                    title="Remove item"
                  >
                    <Trash2 className="w-4 h-4" />
                  </button>
                </div>
              </div>
            );
          })}
        </div>

        {/* Add custom item trigger */}
        <div className="p-4 bg-surface border-t border-surface-border">
          {isAddingItem ? (
            <form onSubmit={handleAddCustomItem} className="p-3 bg-surface-secondary rounded-2xl border border-surface-border space-y-3">
              <div className="font-bold text-xs text-ink">Add Custom Checklist Item</div>
              <div className="grid grid-cols-1 sm:grid-cols-3 gap-2">
                <input
                  type="text"
                  value={newItemName}
                  onChange={(e) => setNewItemName(e.target.value)}
                  placeholder="Item name (e.g. Safety goggles)"
                  className="sm:col-span-2 px-3 py-1.5 text-xs bg-surface border border-surface-border rounded-xl focus-ring"
                  required
                />
                <input
                  type="number"
                  min="1"
                  value={newItemQty}
                  onChange={(e) => setNewItemQty(parseInt(e.target.value) || 1)}
                  className="px-3 py-1.5 text-xs bg-surface border border-surface-border rounded-xl focus-ring"
                  placeholder="Quantity"
                />
              </div>
              <div className="flex items-center gap-2">
                <input
                  type="checkbox"
                  id="chkConsumable"
                  checked={newItemConsumable}
                  onChange={(e) => setNewItemConsumable(e.target.checked)}
                  className="rounded text-evergreen focus:ring-evergreen"
                />
                <label htmlFor="chkConsumable" className="text-xs text-ink-muted select-none">
                  Is this a consumable item? (e.g. tape, glue, nails)
                </label>
              </div>
              <div className="flex justify-end gap-2 pt-1">
                <button
                  type="button"
                  onClick={() => setIsAddingItem(false)}
                  className="px-3 py-1.5 text-xs text-ink-muted hover:bg-surface rounded-xl"
                >
                  Cancel
                </button>
                <button
                  type="submit"
                  className="px-4 py-1.5 text-xs bg-evergreen text-white font-semibold rounded-xl hover:bg-evergreen-dark"
                >
                  Add Item
                </button>
              </div>
            </form>
          ) : (
            <button
              type="button"
              onClick={() => setIsAddingItem(true)}
              className="text-xs text-evergreen hover:text-evergreen-dark font-semibold flex items-center gap-1.5"
            >
              <Plus className="w-4 h-4" />
              <span>Add another item to checklist</span>
            </button>
          )}
        </div>
      </div>

      {/* All Owned Banner */}
      {allOwned && (
        <div className="p-4 bg-emerald-50 border border-emerald-200 rounded-2xl flex items-center gap-3 text-emerald-900">
          <PackageCheck className="w-6 h-6 text-emerald-600 shrink-0" />
          <div className="text-xs leading-relaxed">
            <strong>All items owned!</strong> You have all required equipment sitting in your home. You're ready to complete this task without borrowing or purchasing anything.
          </div>
        </div>
      )}

      {/* Bottom Action Bar */}
      <div className="flex items-center justify-between pt-4">
        <Link to="/plan/new" className="text-xs text-ink-muted hover:text-ink font-medium">
          ← Start over
        </Link>

        <button
          type="button"
          onClick={handleProceedToOptions}
          disabled={isSaving || items.length === 0}
          className="py-3 px-6 bg-evergreen hover:bg-evergreen-dark text-white rounded-xl font-semibold text-sm transition-colors flex items-center gap-2 shadow-sm disabled:opacity-50"
        >
          <span>{allOwned ? 'View Options Anyway' : `Find ${missingItems.length} Missing Item(s)`}</span>
          <ArrowRight className="w-4 h-4" />
        </button>
      </div>
    </div>
  );
};

