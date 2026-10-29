import React, { useState } from 'react';
import { useNavigate, Link } from 'react-router-dom';
import { AlertCircle } from 'lucide-react';
import { ListingCategory, ListingMode, ListingCondition, evaluateItemSafety } from '@sidekit/shared';
import { sidekitService } from '../services';

const CATALOG_TEMPLATES = [
  { title: 'Hammer Drill 550W', category: 'diy' as ListingCategory, key: 'drill_machine', mode: 'lend' as ListingMode },
  { title: 'High-Pressure Washer', category: 'cleaning' as ListingCategory, key: 'pressure_washer', mode: 'rent' as ListingMode, price: 250 },
  { title: '5-Step Aluminium Ladder', category: 'diy' as ListingCategory, key: 'step_ladder', mode: 'lend' as ListingMode },
  { title: '15m Extension Reel', category: 'diy' as ListingCategory, key: 'extension_cord', mode: 'lend' as ListingMode },
  { title: 'Electric Hedge Trimmer', category: 'gardening' as ListingCategory, key: 'hedge_trimmer', mode: 'lend' as ListingMode },
];

export const CreateListingPage: React.FC = () => {
  const navigate = useNavigate();
  const [title, setTitle] = useState('');
  const [description, setDescription] = useState('');
  const [category, setCategory] = useState<ListingCategory>('diy');
  const [mode, setMode] = useState<ListingMode>('lend');
  const [price, setPrice] = useState<number | ''>('');
  const [condition, setCondition] = useState<ListingCondition>('good');
  const [totalQuantity, setTotalQuantity] = useState(1);
  const [pickupNote, setPickupNote] = useState('');
  const [error, setError] = useState('');
  const [isSubmitting, setIsSubmitting] = useState(false);

  const safety = title.trim().length > 0 ? evaluateItemSafety(title) : null;

  const applyTemplate = (t: typeof CATALOG_TEMPLATES[0]) => {
    setTitle(t.title); setCategory(t.category); setMode(t.mode);
    setPrice(('price' in t && t.price) ? t.price : '');
    setDescription(`${t.title} in good working condition, ready to use.`);
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (safety?.isBlocked) { setError(safety.warning || 'Item blocked.'); return; }
    setIsSubmitting(true); setError('');
    try {
      await sidekitService.createListing({
        itemKey: title.toLowerCase().replace(/[^a-z0-9]+/g, '_'),
        title: title.trim(), description: description.trim(),
        category, mode,
        price: mode === 'lend' ? null : price === '' ? null : Number(price),
        priceUnit: mode === 'sell_used' ? 'item' : 'day',
        condition, totalQuantity: Math.max(1, totalQuantity),
        pickupNote: pickupNote.trim() || undefined,
        comfortRules: { returnClean: true, noCommercialUse: true },
      });
      navigate('/my/listings');
    } catch (err: any) { setError(err.message || 'Failed to create listing.'); }
    setIsSubmitting(false);
  };

  return (
    <div className="max-w-2xl mx-auto py-10 px-4 space-y-6">
      <div>
        <h1 className="text-2xl font-bold text-ink">List an Item</h1>
        <p className="text-sm text-ink-muted mt-0.5">Share your tools and equipment with society neighbours.</p>
      </div>

      {/* Quick fill */}
      <div>
        <p className="text-xs font-semibold text-ink mb-2">Quick fill from catalog</p>
        <div className="flex flex-wrap gap-2">
          {CATALOG_TEMPLATES.map((t) => (
            <button key={t.key} type="button" onClick={() => applyTemplate(t)}
              className="text-xs px-3 py-1.5 bg-surface-secondary border border-surface-border rounded-lg text-ink-muted hover:text-ink hover:border-evergreen/30 transition-colors">
              + {t.title}
            </button>
          ))}
        </div>
      </div>

      {error && (
        <div className="flex items-start gap-2 p-3 bg-red-50 border border-red-200 rounded-xl text-xs text-red-700">
          <AlertCircle className="w-4 h-4 shrink-0 mt-0.5" />
          {error}
        </div>
      )}

      <form onSubmit={handleSubmit} className="bg-white rounded-2xl border border-surface-border p-6 space-y-5">
        <div>
          <label className="block text-xs font-semibold text-ink mb-1">Title *</label>
          <input type="text" value={title} onChange={(e) => setTitle(e.target.value)}
            placeholder="e.g. Bosch Impact Drill GSB 500W"
            className="w-full px-3 py-2 text-sm bg-surface-secondary border border-surface-border rounded-xl focus-ring" required />
          {safety?.isBlocked && (
            <div className="mt-1.5 flex items-start gap-2 text-xs text-red-700">
              <AlertCircle className="w-3.5 h-3.5 shrink-0 mt-0.5 text-red-500" />
              {safety.warning}
            </div>
          )}
        </div>

        <div className="grid grid-cols-2 gap-4">
          <div>
            <label className="block text-xs font-semibold text-ink mb-1">Category *</label>
            <select value={category} onChange={(e) => setCategory(e.target.value as ListingCategory)}
              className="w-full px-3 py-2 text-sm bg-surface-secondary border border-surface-border rounded-xl focus-ring">
              <option value="diy">DIY & Tools</option>
              <option value="cleaning">Cleaning</option>
              <option value="gardening">Gardening</option>
              <option value="electronics">Electronics</option>
              <option value="kitchen">Kitchen</option>
              <option value="general">General</option>
            </select>
          </div>
          <div>
            <label className="block text-xs font-semibold text-ink mb-1">Mode *</label>
            <select value={mode} onChange={(e) => setMode(e.target.value as ListingMode)}
              className="w-full px-3 py-2 text-sm bg-surface-secondary border border-surface-border rounded-xl focus-ring">
              <option value="lend">Free Borrow</option>
              <option value="rent">Daily Rental</option>
              <option value="sell_used">Sell Pre-Owned</option>
            </select>
          </div>
        </div>

        <div className="grid grid-cols-2 gap-4">
          {mode !== 'lend' && (
            <div>
              <label className="block text-xs font-semibold text-ink mb-1">
                {mode === 'rent' ? 'Daily Rate (₹) *' : 'Price (₹) *'}
              </label>
              <input type="number" min="0" value={price}
                onChange={(e) => setPrice(e.target.value === '' ? '' : parseInt(e.target.value))}
                className="w-full px-3 py-2 text-sm bg-surface-secondary border border-surface-border rounded-xl focus-ring font-mono"
                placeholder="e.g. 200" />
            </div>
          )}
          <div>
            <label className="block text-xs font-semibold text-ink mb-1">Condition *</label>
            <select value={condition} onChange={(e) => setCondition(e.target.value as ListingCondition)}
              className="w-full px-3 py-2 text-sm bg-surface-secondary border border-surface-border rounded-xl focus-ring">
              <option value="like_new">Like New</option>
              <option value="good">Good</option>
              <option value="fair">Fair</option>
            </select>
          </div>
          <div>
            <label className="block text-xs font-semibold text-ink mb-1">Quantity *</label>
            <input type="number" min="1" value={totalQuantity}
              onChange={(e) => setTotalQuantity(Math.max(1, parseInt(e.target.value) || 1))}
              className="w-full px-3 py-2 text-sm bg-surface-secondary border border-surface-border rounded-xl focus-ring font-mono" />
          </div>
        </div>

        <div>
          <label className="block text-xs font-semibold text-ink mb-1">Description *</label>
          <textarea rows={3} value={description} onChange={(e) => setDescription(e.target.value)}
            placeholder="Specs, included accessories, usage notes..."
            className="w-full p-3 text-sm bg-surface-secondary border border-surface-border rounded-xl focus-ring resize-none" required />
        </div>

        <div>
          <label className="block text-xs font-semibold text-ink mb-1">Pickup Instructions</label>
          <input type="text" value={pickupNote} onChange={(e) => setPickupNote(e.target.value)}
            placeholder="e.g. Collect from A-402 weekday evenings after 6 PM"
            className="w-full px-3 py-2 text-sm bg-surface-secondary border border-surface-border rounded-xl focus-ring" />
        </div>

        <div className="flex justify-end gap-3 pt-2 border-t border-surface-border">
          <Link to="/my/listings" className="px-4 py-2 text-xs text-ink-muted hover:bg-surface-secondary rounded-lg">
            Cancel
          </Link>
          <button type="submit" disabled={isSubmitting || !!safety?.isBlocked}
            className="px-6 py-2.5 bg-evergreen hover:bg-evergreen-dark text-white rounded-xl font-semibold text-sm transition-colors disabled:opacity-50">
            {isSubmitting ? 'Publishing...' : 'Publish Listing'}
          </button>
        </div>
      </form>
    </div>
  );
};
