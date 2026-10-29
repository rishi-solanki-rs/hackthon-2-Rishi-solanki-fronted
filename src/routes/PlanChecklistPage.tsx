import React, { useState, useEffect, useMemo } from 'react';
import { useParams, useNavigate, Link } from 'react-router-dom';
import { ArrowRight, Plus, Trash2, Check, AlertCircle, Search, Wand2, X } from 'lucide-react';
import {
  Plan,
  PlanChecklistItem,
  CatalogItem,
  CATEGORY_LABELS,
  ListingCategory,
  evaluateItemSafety,
  isItemSuppressedByGate,
  matchCatalogItem,
  resolveItemImage,
  searchCatalog,
} from '@sidekit/shared';
import { sidekitService } from '../services';
import { SafetyGateNotice } from '../components/shared/SafetyGateNotice';
import { ItemThumb } from '../components/brand/itemIcons';
import { BrandLoader, EmptyState } from '../components/brand/BrandStates';
import { FeatureIcon } from '../components/brand/sidekit-icons';

const categoryLabel = (c?: string) => CATEGORY_LABELS[(c as ListingCategory) || 'general'] || 'Other items';

export const PlanChecklistPage: React.FC = () => {
  const { id } = useParams<{ id: string }>();
  const navigate = useNavigate();
  const [plan, setPlan] = useState<Plan | null>(null);
  const [items, setItems] = useState<PlanChecklistItem[]>([]);
  const [isLoading, setIsLoading] = useState(true);
  const [isSaving, setIsSaving] = useState(false);
  const [saveError, setSaveError] = useState<string | null>(null);

  // Add item (catalog search + free text)
  const [query, setQuery] = useState('');
  const [newQty, setNewQty] = useState(1);
  const [addError, setAddError] = useState<string | null>(null);

  // Suggest more
  const [describe, setDescribe] = useState('');
  const [suggestions, setSuggestions] = useState<PlanChecklistItem[]>([]);
  const [suggesting, setSuggesting] = useState(false);
  const [suggestError, setSuggestError] = useState<string | null>(null);

  useEffect(() => {
    if (!id) return;
    sidekitService.getPlan(id).then((data) => {
      if (data) { setPlan(data); setItems(data.items); }
      setIsLoading(false);
    }).catch(() => setIsLoading(false));
  }, [id]);

  const keys = useMemo(() => new Set(items.map((i) => i.itemKey)), [items]);
  const matches = useMemo(() => searchCatalog(query, 6).filter((c) => !keys.has(c.itemKey)), [query, keys]);

  const update = (itemId: string, fn: (i: PlanChecklistItem) => PlanChecklistItem) =>
    setItems((prev) => prev.map((i) => (i.id === itemId ? fn(i) : i)));

  const toggleOwned = (itemId: string) =>
    update(itemId, (i) => {
      const ownedQuantity = i.ownedQuantity >= i.neededQuantity ? 0 : i.neededQuantity;
      return { ...i, ownedQuantity, missingQuantity: Math.max(0, i.neededQuantity - ownedQuantity) };
    });

  const adjustQty = (itemId: string, delta: number) =>
    update(itemId, (i) => {
      const neededQuantity = Math.max(1, i.neededQuantity + delta);
      const ownedQuantity = Math.min(i.ownedQuantity, neededQuantity);
      return { ...i, neededQuantity, ownedQuantity, missingQuantity: Math.max(0, neededQuantity - ownedQuantity) };
    });

  const setAllOwned = (owned: boolean) =>
    setItems((prev) => prev.map((i) => ({ ...i, ownedQuantity: owned ? i.neededQuantity : 0, missingQuantity: owned ? 0 : i.neededQuantity })));

  const removeItem = (itemId: string) => setItems((prev) => prev.filter((i) => i.id !== itemId));

  const addFromCatalogOrText = (catalogItem?: CatalogItem) => {
    const name = (catalogItem?.name || query).trim();
    if (!name) return;
    const cat = catalogItem || matchCatalogItem(name);
    const itemKey = cat?.itemKey || name.toLowerCase().replace(/[^a-z0-9]+/g, '_').replace(/^_+|_+$/g, '');
    const safety = evaluateItemSafety(name);
    if (safety.isBlocked) {
      setAddError(safety.warning || 'This item is not allowed on Sidekit.');
      return;
    }
    if (keys.has(itemKey)) {
      setAddError(`${cat?.name || name} is already on your list.`);
      return;
    }
    if (isItemSuppressedByGate({ itemKey, name }, plan?.safetyGate)) {
      setAddError('This tool is hidden for this task for safety reasons. Please hire a professional.');
      return;
    }
    const isConsumable = cat ? cat.consumable : safety.isConsumable;
    setItems((prev) => [...prev, {
      id: `custom_${Date.now()}`,
      itemKey,
      name: cat?.name || name,
      neededQuantity: newQty,
      ownedQuantity: 0,
      missingQuantity: newQty,
      reason: 'Added by you',
      isConsumable,
      safetyClass: isConsumable ? 'consumable' : safety.safetyClass,
      source: 'user_added',
      category: cat?.category,
      imageUrl: resolveItemImage(itemKey, name, cat?.category),
    }]);
    setQuery(''); setNewQty(1); setAddError(null);
  };

  const askForMore = async () => {
    if (!id) return;
    setSuggesting(true); setSuggestError(null);
    try {
      // Save current edits first so the suggestions know what is already on the list
      await sidekitService.updatePlanChecklist(id, items);
      const res = await sidekitService.suggestPlanItems(id, describe.trim());
      const fresh = res.items.filter((s) => !keys.has(s.itemKey));
      setSuggestions(fresh);
      if (fresh.length === 0) setSuggestError('No new items to suggest. Try describing what else you need.');
    } catch (err: any) {
      setSuggestError(err?.message || 'Could not get suggestions right now.');
    }
    setSuggesting(false);
  };

  const acceptSuggestion = (s: PlanChecklistItem) => {
    setItems((prev) => (prev.some((i) => i.itemKey === s.itemKey) ? prev : [...prev, s]));
    setSuggestions((prev) => prev.filter((p) => p.itemKey !== s.itemKey));
  };

  const acceptAll = () => {
    setItems((prev) => [...prev, ...suggestions.filter((s) => !prev.some((i) => i.itemKey === s.itemKey))]);
    setSuggestions([]);
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

  if (isLoading) return <BrandLoader label="Loading checklist…" />;

  if (!plan) {
    return (
      <div className="max-w-2xl mx-auto py-10 px-4">
        <EmptyState illustration="not-found" title="Plan not found"
          description="Plans belong to the persona that created them. Switch back, or start a new plan."
          action={<Link to="/plan/new" className="text-sm text-evergreen font-semibold hover:underline">← New Plan</Link>} />
      </div>
    );
  }

  const missing = items.filter((i) => i.missingQuantity > 0);
  const ownedCount = items.length - missing.length;
  const allOwned = items.length > 0 && missing.length === 0;

  const groups = new Map<string, PlanChecklistItem[]>();
  for (const item of items) {
    const label = categoryLabel(item.category);
    groups.set(label, [...(groups.get(label) || []), item]);
  }

  return (
    <div className="max-w-3xl mx-auto py-10 px-4 space-y-6">
      {/* Header */}
      <div className="space-y-1">
        <div className="text-xs font-semibold text-evergreen uppercase tracking-wider">Checklist</div>
        <h1 className="text-xl font-bold text-ink leading-snug">{plan.taskDescription}</h1>
        <p className="text-xs text-ink-muted">
          Tick off items you already own — we'll only find the rest. Add anything that's missing below.
        </p>
        {plan.aiSource && (
          <p className="flex items-center gap-1 text-[11px] text-ink-subtle">
            <FeatureIcon name="sparkle" size={14} />
            {plan.aiSource === 'gemini'
              ? 'Checklist suggested by AI — review it before you continue.'
              : 'Checklist from a standard template (AI unavailable right now).'}
          </p>
        )}
      </div>

      {plan.safetyGate && <SafetyGateNotice gate={plan.safetyGate} />}

      {/* Summary + bulk actions */}
      <div className="flex flex-wrap items-center justify-between gap-3 text-xs">
        <p className="text-ink-muted">
          <strong className="text-ink">{items.length}</strong> items · <strong className="text-ink">{ownedCount}</strong> owned ·{' '}
          <strong className="text-ink">{missing.length}</strong> to find
        </p>
        {items.length > 0 && (
          <div className="flex gap-2">
            <button type="button" onClick={() => setAllOwned(true)} className="px-2.5 py-1 rounded-lg border border-surface-border text-ink-muted hover:text-ink hover:bg-surface-secondary">
              I own everything
            </button>
            <button type="button" onClick={() => setAllOwned(false)} className="px-2.5 py-1 rounded-lg border border-surface-border text-ink-muted hover:text-ink hover:bg-surface-secondary">
              Clear ticks
            </button>
          </div>
        )}
      </div>

      {/* Items grouped by category */}
      {items.length === 0 ? (
        <div className="bg-surface rounded-2xl border border-surface-border py-10 text-center text-sm text-ink-muted">
          No items yet. Search the catalog or ask for suggestions below.
        </div>
      ) : (
        <div className="space-y-4">
          {Array.from(groups.entries()).map(([label, groupItems]) => (
            <section key={label} className="bg-surface rounded-2xl border border-surface-border overflow-hidden" aria-label={label}>
              <h2 className="px-4 py-2 text-[11px] font-bold uppercase tracking-wider text-ink-muted bg-surface-secondary/60 border-b border-surface-border">
                {label} <span className="font-medium normal-case tracking-normal">({groupItems.length})</span>
              </h2>
              {groupItems.map((item) => {
                const owned = item.ownedQuantity >= item.neededQuantity;
                return (
                  <div
                    key={item.id}
                    className={`flex items-center gap-3 p-3 sm:p-4 border-b border-surface-border last:border-0 transition-colors ${owned ? 'bg-surface-secondary/40' : 'bg-surface'}`}
                  >
                    <button
                      type="button"
                      onClick={() => toggleOwned(item.id)}
                      role="checkbox"
                      aria-checked={owned}
                      className={`w-5 h-5 rounded-md border-2 flex items-center justify-center shrink-0 transition-colors focus-ring ${owned ? 'bg-brand border-brand' : 'border-surface-border hover:border-evergreen'}`}
                      aria-label={`I already own ${item.name}`}
                    >
                      {owned && <Check className="w-3 h-3 text-white stroke-[3]" />}
                    </button>

                    <ItemThumb itemKey={item.itemKey} title={item.name} category={item.category} imageUrl={item.imageUrl} size={48} />

                    <div className="flex-1 min-w-0">
                      <div className="flex items-center gap-2 flex-wrap">
                        <span className={`text-sm font-semibold ${owned ? 'line-through text-ink-muted' : 'text-ink'}`}>{item.name}</span>
                        {item.isConsumable && (
                          <span className="text-[10px] px-1.5 py-0.5 rounded bg-amber-50 text-amber-700 border border-amber-200 font-semibold">Consumable</span>
                        )}
                        {item.source === 'user_added' && (
                          <span className="text-[10px] px-1.5 py-0.5 rounded bg-surface-secondary text-ink-muted border border-surface-border font-semibold">Added by you</span>
                        )}
                        {owned && (
                          <span className="text-[10px] px-1.5 py-0.5 rounded bg-emerald-50 text-emerald-700 font-semibold">Owned ✓</span>
                        )}
                      </div>
                      <p className="text-xs text-ink-muted mt-0.5 leading-relaxed line-clamp-2">{item.reason}</p>
                    </div>

                    <div className="flex items-center gap-1 shrink-0">
                      <button type="button" onClick={() => adjustQty(item.id, -1)} aria-label={`Decrease quantity of ${item.name}`}
                        className="w-6 h-6 rounded border border-surface-border flex items-center justify-center text-ink-muted hover:text-ink text-sm">−</button>
                      <span className="w-7 text-center text-xs font-bold text-ink font-mono" aria-label="Quantity">{item.neededQuantity}</span>
                      <button type="button" onClick={() => adjustQty(item.id, 1)} aria-label={`Increase quantity of ${item.name}`}
                        className="w-6 h-6 rounded border border-surface-border flex items-center justify-center text-ink-muted hover:text-ink text-sm">+</button>
                    </div>

                    <button type="button" onClick={() => removeItem(item.id)} className="p-1.5 text-ink-subtle hover:text-red-500 transition-colors shrink-0" aria-label={`Remove ${item.name}`}>
                      <Trash2 className="w-3.5 h-3.5" />
                    </button>
                  </div>
                );
              })}
            </section>
          ))}
        </div>
      )}

      {/* Add an item: catalog search or free text */}
      <section className="bg-surface rounded-2xl border border-surface-border p-4 space-y-3" aria-labelledby="add-item-title">
        <h2 id="add-item-title" className="text-sm font-bold text-ink flex items-center gap-2">
          <Plus className="w-4 h-4" aria-hidden="true" /> Add an item
        </h2>
        <form
          onSubmit={(e) => { e.preventDefault(); addFromCatalogOrText(matches[0] && matches[0].name.toLowerCase() === query.trim().toLowerCase() ? matches[0] : undefined); }}
          className="flex gap-2"
        >
          <div className="relative flex-1">
            <Search className="w-4 h-4 text-ink-subtle absolute left-2.5 top-1/2 -translate-y-1/2" aria-hidden="true" />
            <input
              type="text"
              value={query}
              onChange={(e) => { setQuery(e.target.value); setAddError(null); }}
              placeholder="Search e.g. colour paper, glitter pen, ladder…"
              aria-label="Search the item catalog or type a custom item"
              className="w-full pl-8 pr-3 py-2 text-sm bg-surface-secondary border border-surface-border rounded-xl focus-ring"
            />
          </div>
          <input type="number" min={1} max={100} value={newQty} onChange={(e) => setNewQty(Math.max(1, parseInt(e.target.value) || 1))}
            aria-label="Quantity" className="w-16 px-2 py-2 text-sm bg-surface-secondary border border-surface-border rounded-xl focus-ring font-mono" />
          <button type="submit" disabled={!query.trim()} className="px-3 py-2 rounded-xl text-xs font-semibold bg-brand hover:bg-brand-dark text-white disabled:opacity-50">
            Add
          </button>
        </form>

        {matches.length > 0 && (
          <ul className="grid grid-cols-1 sm:grid-cols-2 gap-2" aria-label="Catalog matches">
            {matches.map((m) => (
              <li key={m.itemKey}>
                <button type="button" onClick={() => addFromCatalogOrText(m)}
                  className="w-full flex items-center gap-2.5 p-2 rounded-xl border border-surface-border hover:border-evergreen/40 hover:bg-evergreen-light/40 text-left transition-colors">
                  <ItemThumb itemKey={m.itemKey} title={m.name} category={m.category} size={36} />
                  <span className="flex-1 min-w-0">
                    <span className="block text-xs font-semibold text-ink truncate">{m.name}</span>
                    <span className="block text-[11px] text-ink-muted">{categoryLabel(m.category)}{m.consumable ? ' · consumable' : ''}</span>
                  </span>
                  <Plus className="w-3.5 h-3.5 text-evergreen shrink-0" aria-hidden="true" />
                </button>
              </li>
            ))}
          </ul>
        )}
        {query.trim().length >= 2 && matches.length === 0 && (
          <p className="text-xs text-ink-muted">Not in the catalog — press Add to include "{query.trim()}" as a custom item.</p>
        )}
        {addError && (
          <p role="alert" className="flex items-start gap-1.5 text-xs text-red-700">
            <AlertCircle className="w-3.5 h-3.5 shrink-0 mt-0.5" aria-hidden="true" />
            <span>{addError}</span>
          </p>
        )}
      </section>

      {/* Suggest more */}
      <section className="bg-surface rounded-2xl border border-surface-border p-4 space-y-3" aria-labelledby="suggest-title">
        <div>
          <h2 id="suggest-title" className="text-sm font-bold text-ink flex items-center gap-2">
            <Wand2 className="w-4 h-4" aria-hidden="true" /> Need something else?
          </h2>
          <p className="text-xs text-ink-muted mt-0.5">Describe it in your own words, or just ask for more ideas.</p>
        </div>
        <textarea
          rows={2}
          value={describe}
          onChange={(e) => setDescribe(e.target.value)}
          maxLength={300}
          placeholder="e.g. I also want coloured paper and something to make it sparkle"
          aria-label="Describe what else you need"
          className="w-full p-2.5 text-sm bg-surface-secondary border border-surface-border rounded-xl focus-ring resize-none"
        />
        <div className="flex items-center justify-between gap-3">
          <button type="button" onClick={askForMore} disabled={suggesting}
            className="flex items-center gap-1.5 px-4 py-2 rounded-xl text-xs font-semibold border border-evergreen/40 text-evergreen hover:bg-evergreen-light disabled:opacity-50">
            {suggesting ? <span className="w-3.5 h-3.5 border-2 border-evergreen/30 border-t-evergreen rounded-full animate-spin" /> : <FeatureIcon name="sparkle" size={14} />}
            {suggesting ? 'Thinking…' : 'Suggest more items'}
          </button>
          {suggestions.length > 1 && (
            <button type="button" onClick={acceptAll} className="text-xs font-semibold text-evergreen hover:underline">
              Add all {suggestions.length}
            </button>
          )}
        </div>
        {suggestError && <p className="text-xs text-ink-muted">{suggestError}</p>}
        {suggestions.length > 0 && (
          <ul className="grid grid-cols-1 sm:grid-cols-2 gap-2" aria-label="Suggested items">
            {suggestions.map((s) => (
              <li key={s.itemKey} className="flex items-center gap-2.5 p-2 rounded-xl border border-surface-border">
                <ItemThumb itemKey={s.itemKey} title={s.name} category={s.category} imageUrl={s.imageUrl} size={40} />
                <span className="flex-1 min-w-0">
                  <span className="block text-xs font-semibold text-ink truncate">{s.name}</span>
                  <span className="block text-[11px] text-ink-muted line-clamp-1">{s.reason}</span>
                </span>
                <button type="button" onClick={() => acceptSuggestion(s)} aria-label={`Add ${s.name}`}
                  className="p-1.5 rounded-lg bg-brand hover:bg-brand-dark text-white"><Plus className="w-3.5 h-3.5" /></button>
                <button type="button" onClick={() => setSuggestions((prev) => prev.filter((p) => p.itemKey !== s.itemKey))} aria-label={`Dismiss ${s.name}`}
                  className="p-1.5 rounded-lg text-ink-subtle hover:text-ink"><X className="w-3.5 h-3.5" /></button>
              </li>
            ))}
          </ul>
        )}
      </section>

      {allOwned && (
        <div className="flex items-center gap-3 p-4 bg-emerald-50 border border-emerald-200 rounded-2xl text-sm text-emerald-800">
          <FeatureIcon name="owned" size={22} className="shrink-0" />
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
      <div className="sticky bottom-0 -mx-4 px-4 py-3 bg-canvas/95 backdrop-blur-sm border-t border-surface-border flex items-center justify-between">
        <Link to="/plan/new" className="text-xs text-ink-muted hover:text-ink">← Start over</Link>
        <button
          type="button"
          onClick={proceed}
          disabled={isSaving || items.length === 0}
          className="px-5 py-2.5 bg-brand hover:bg-brand-dark text-white rounded-xl font-semibold text-sm transition-colors flex items-center gap-2 disabled:opacity-50 focus-ring"
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
