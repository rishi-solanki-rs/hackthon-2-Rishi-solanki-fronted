import React, { useState } from 'react';
import { useNavigate, Link } from 'react-router-dom';
import {
  Sparkles,
  ArrowRight,
  ShieldCheck,
  AlertCircle,
  HelpCircle,
  Check,
} from 'lucide-react';
import { ListingCategory, ListingMode, ListingCondition, evaluateItemSafety } from '@sidekit/shared';
import { sidekitService } from '../services';
import { useAuth } from '../context/AuthContext';

export const CreateListingPage: React.FC = () => {
  const navigate = useNavigate();
  const { currentUser } = useAuth();

  const [title, setTitle] = useState('');
  const [description, setDescription] = useState('');
  const [category, setCategory] = useState<ListingCategory>('diy');
  const [mode, setMode] = useState<ListingMode>('lend');
  const [price, setPrice] = useState<number | ''>('');
  const [condition, setCondition] = useState<ListingCondition>('good');
  const [totalQuantity, setTotalQuantity] = useState(1);
  const [pickupNote, setPickupNote] = useState('');

  // Comfort rules
  const [returnClean, setReturnClean] = useState(true);
  const [noCommercialUse, setNoCommercialUse] = useState(true);
  const [depositRequired, setDepositRequired] = useState(false);
  const [depositAmount, setDepositAmount] = useState(500);

  const [error, setError] = useState<string | null>(null);
  const [isSubmitting, setIsSubmitting] = useState(false);

  // Template suggestions
  const catalogTemplates = [
    { title: 'Hammer Drill 550W', category: 'diy' as const, key: 'drill_machine', mode: 'lend' as const },
    { title: 'High-Pressure Washer 110 Bar', category: 'cleaning' as const, key: 'pressure_washer', mode: 'rent' as const, price: 250 },
    { title: '5-Step Aluminium Folding Ladder', category: 'diy' as const, key: 'step_ladder', mode: 'lend' as const },
    { title: '15-Metre Heavy Extension Reel', category: 'diy' as const, key: 'extension_cord', mode: 'lend' as const },
  ];

  const handleApplyTemplate = (t: typeof catalogTemplates[0]) => {
    setTitle(t.title);
    setCategory(t.category);
    setMode(t.mode);
    if (t.price) setPrice(t.price);
    else setPrice('');
    setDescription(`Standard ${t.title} in good condition, ready to use.`);
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setError(null);

    // Safety check
    const safety = evaluateItemSafety(title);
    if (safety.isBlocked) {
      setError(safety.warning || 'Item blocked by community safety policies.');
      return;
    }

    try {
      setIsSubmitting(true);
      const itemKey = title.toLowerCase().replace(/[^a-z0-9]+/g, '_');
      await sidekitService.createListing({
        itemKey,
        title: title.trim(),
        description: description.trim(),
        category,
        mode,
        price: mode === 'lend' ? null : price === '' ? null : Number(price),
        priceUnit: mode === 'sell_used' ? 'item' : 'day',
        condition,
        totalQuantity: Math.max(1, totalQuantity),
        pickupNote: pickupNote.trim() || undefined,
        comfortRules: {
          returnClean,
          noCommercialUse,
          depositRequired,
          depositAmount: depositRequired ? depositAmount : undefined,
        },
      });

      navigate('/my/listings');
    } catch (err: any) {
      setError(err.message || 'Failed to create listing.');
    } finally {
      setIsSubmitting(false);
    }
  };

  return (
    <div className="max-w-2xl mx-auto py-8 px-4 space-y-6">
      <div className="space-y-1">
        <h1 className="text-2xl font-bold tracking-tight text-ink">List an Item for Neighbours</h1>
        <p className="text-xs text-ink-muted">
          Share your tools, appliances, or equipment with trusted residents in Palm Grove.
        </p>
      </div>

      {/* Template Autocomplete Chips */}
      <div className="space-y-2">
        <span className="text-[11px] font-bold text-ink uppercase tracking-wider">Quick Fill from Common Catalog</span>
        <div className="flex flex-wrap gap-2">
          {catalogTemplates.map((t, idx) => (
            <button
              key={idx}
              type="button"
              onClick={() => handleApplyTemplate(t)}
              className="text-xs px-3 py-1.5 bg-surface hover:bg-surface-secondary text-ink rounded-xl border border-surface-border transition-colors font-medium"
            >
              + {t.title}
            </button>
          ))}
        </div>
      </div>

      {error && (
        <div className="p-3 bg-red-50 border border-red-200 rounded-xl flex items-center gap-2 text-xs text-red-700">
          <AlertCircle className="w-4 h-4 shrink-0" />
          <span>{error}</span>
        </div>
      )}

      {/* Main Form */}
      <form onSubmit={handleSubmit} className="p-6 bg-surface rounded-3xl border border-surface-border shadow-sm space-y-6">
        <div>
          <label className="block text-xs font-bold text-ink uppercase tracking-wider mb-1">
            Item Title *
          </label>
          <input
            type="text"
            value={title}
            onChange={(e) => setTitle(e.target.value)}
            placeholder="e.g. Bosch Impact Drill GSB 500W"
            className="w-full px-3 py-2 text-sm bg-surface-secondary border border-surface-border rounded-xl focus-ring"
            required
          />
          {title.trim().length > 0 && evaluateItemSafety(title).isBlocked && (
            <div className="mt-2 p-3 bg-red-50 border border-red-200 rounded-xl flex items-center gap-2 text-xs text-red-700">
              <AlertCircle className="w-4 h-4 shrink-0 text-red-600" />
              <span>{evaluateItemSafety(title).warning || 'Prohibited item under community safety guidelines.'}</span>
            </div>
          )}
        </div>

        <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
          <div>
            <label className="block text-xs font-bold text-ink uppercase tracking-wider mb-1">
              Category *
            </label>
            <select
              value={category}
              onChange={(e) => setCategory(e.target.value as ListingCategory)}
              className="w-full px-3 py-2 text-sm bg-surface-secondary border border-surface-border rounded-xl focus-ring"
            >
              <option value="diy">DIY & Tools</option>
              <option value="cleaning">Deep Cleaning</option>
              <option value="gardening">Gardening</option>
              <option value="electronics">Electronics</option>
              <option value="kitchen">Kitchen Appliances</option>
              <option value="general">General Household</option>
            </select>
          </div>

          <div>
            <label className="block text-xs font-bold text-ink uppercase tracking-wider mb-1">
              Sharing Mode *
            </label>
            <select
              value={mode}
              onChange={(e) => setMode(e.target.value as ListingMode)}
              className="w-full px-3 py-2 text-sm bg-surface-secondary border border-surface-border rounded-xl focus-ring"
            >
              <option value="lend">Free Community Borrow (₹0)</option>
              <option value="rent">Daily Rental</option>
              <option value="sell_used">Sell Pre-Owned Item</option>
            </select>
          </div>
        </div>

        {mode !== 'lend' && (
          <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
            <div>
              <label className="block text-xs font-bold text-ink uppercase tracking-wider mb-1">
                {mode === 'rent' ? 'Daily Rental Rate (₹) *' : 'Asking Price (₹) *'}
              </label>
              <input
                type="number"
                min="0"
                value={price}
                onChange={(e) => setPrice(e.target.value === '' ? '' : parseInt(e.target.value))}
                placeholder={mode === 'rent' ? '150' : '1200'}
                className="w-full px-3 py-2 text-sm bg-surface-secondary border border-surface-border rounded-xl focus-ring font-mono"
                required
              />
              <span className="text-[10px] text-ink-muted mt-1 block">
                Leave empty only if rate will be decided directly with borrower.
              </span>
            </div>

            <div>
              <label className="block text-xs font-bold text-ink uppercase tracking-wider mb-1">
                Total Units Available *
              </label>
              <input
                type="number"
                min="1"
                value={totalQuantity}
                onChange={(e) => setTotalQuantity(parseInt(e.target.value) || 1)}
                className="w-full px-3 py-2 text-sm bg-surface-secondary border border-surface-border rounded-xl focus-ring font-mono"
                required
              />
            </div>
          </div>
        )}

        <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
          <div>
            <label className="block text-xs font-bold text-ink uppercase tracking-wider mb-1">
              Condition *
            </label>
            <select
              value={condition}
              onChange={(e) => setCondition(e.target.value as ListingCondition)}
              className="w-full px-3 py-2 text-sm bg-surface-secondary border border-surface-border rounded-xl focus-ring"
            >
              <option value="like_new">Like New (flawless condition)</option>
              <option value="good">Good (fully working, minor cosmetic wear)</option>
              <option value="fair">Fair (functional, noticeable signs of use)</option>
            </select>
          </div>

          <div>
            <label className="block text-xs font-bold text-ink uppercase tracking-wider mb-1">
              Quantity
            </label>
            <input
              type="number"
              min="1"
              value={totalQuantity}
              onChange={(e) => setTotalQuantity(parseInt(e.target.value) || 1)}
              className="w-full px-3 py-2 text-sm bg-surface-secondary border border-surface-border rounded-xl focus-ring font-mono"
            />
          </div>
        </div>

        <div>
          <label className="block text-xs font-bold text-ink uppercase tracking-wider mb-1">
            Description
          </label>
          <textarea
            rows={3}
            value={description}
            onChange={(e) => setDescription(e.target.value)}
            placeholder="Details about power specs, included accessories, or usage notes..."
            className="w-full p-3 text-sm bg-surface-secondary border border-surface-border rounded-xl focus-ring"
            required
          />
        </div>

        <div>
          <label className="block text-xs font-bold text-ink uppercase tracking-wider mb-1">
            Pickup Instructions (e.g. Lobby collection, evening timings)
          </label>
          <input
            type="text"
            value={pickupNote}
            onChange={(e) => setPickupNote(e.target.value)}
            placeholder="e.g. Collect from Flat A-402 on weekday evenings after 6 PM"
            className="w-full px-3 py-2 text-sm bg-surface-secondary border border-surface-border rounded-xl focus-ring"
          />
        </div>

        {/* Comfort Rules */}
        <div className="space-y-3 pt-2 border-t border-surface-border">
          <span className="text-xs font-bold text-ink uppercase tracking-wider block">
            Owner Comfort Rules
          </span>
          <div className="space-y-2 text-xs text-ink">
            <label className="flex items-center gap-2 cursor-pointer">
              <input
                type="checkbox"
                checked={returnClean}
                onChange={(e) => setReturnClean(e.target.checked)}
                className="rounded text-evergreen focus:ring-evergreen"
              />
              <span>Borrower must return item wiped down and clean</span>
            </label>

            <label className="flex items-center gap-2 cursor-pointer">
              <input
                type="checkbox"
                checked={noCommercialUse}
                onChange={(e) => setNoCommercialUse(e.target.checked)}
                className="rounded text-evergreen focus:ring-evergreen"
              />
              <span>For personal apartment use only (no commercial contractor use)</span>
            </label>
          </div>
        </div>

        <div className="pt-2 flex items-center justify-end gap-3">
          <Link
            to="/my/listings"
            className="px-4 py-2 text-xs font-semibold text-ink-muted hover:bg-surface-secondary rounded-xl"
          >
            Cancel
          </Link>
          <button
            type="submit"
            disabled={isSubmitting}
            className="px-6 py-2.5 bg-evergreen hover:bg-evergreen-dark text-white rounded-xl font-semibold text-sm transition-colors shadow-sm disabled:opacity-50"
          >
            {isSubmitting ? 'Publishing...' : 'Publish Listing'}
          </button>
        </div>
      </form>
    </div>
  );
};
