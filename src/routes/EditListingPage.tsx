import React, { useState, useEffect } from 'react';
import { useParams, useNavigate, Link } from 'react-router-dom';
import { ArrowLeft, AlertCircle } from 'lucide-react';
import { Listing, ListingCondition } from '@sidekit/shared';
import { sidekitService } from '../services';
import { useAuth } from '../context/AuthContext';
import { BrandLoader, EmptyState } from '../components/brand/BrandStates';

export const EditListingPage: React.FC = () => {
  const { currentUser } = useAuth();
  const { id } = useParams<{ id: string }>();
  const navigate = useNavigate();
  const [listing, setListing] = useState<Listing | null>(null);
  const [title, setTitle] = useState('');
  const [description, setDescription] = useState('');
  const [price, setPrice] = useState<number | ''>('');
  const [condition, setCondition] = useState<ListingCondition>('good');
  const [totalQuantity, setTotalQuantity] = useState(1);
  const [pickupNote, setPickupNote] = useState('');
  const [isLoading, setIsLoading] = useState(true);
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [error, setError] = useState('');

  useEffect(() => {
    if (!id) return;
    sidekitService.getListing(id).then((data) => {
      if (data) {
        setListing(data);
        setTitle(data.title);
        setDescription(data.description);
        setPrice(data.price !== null ? data.price : '');
        setCondition(data.condition);
        setTotalQuantity(data.totalQuantity);
        setPickupNote(data.pickupNote || '');
      }
      setIsLoading(false);
    }).catch(() => setIsLoading(false));
  }, [id]);

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!id) return;
    setIsSubmitting(true); setError('');
    try {
      await sidekitService.updateListing(id, {
        title: title.trim(),
        description: description.trim(),
        price: price === '' ? null : Number(price),
        condition,
        totalQuantity: Math.max(1, totalQuantity),
        pickupNote: pickupNote.trim() || undefined,
      });
      navigate('/my/listings');
    } catch (err: any) { setError(err.message || 'Failed to update.'); }
    setIsSubmitting(false);
  };

  if (isLoading) return <BrandLoader label="Loading listing…" />;
  if (!listing || listing.ownerId !== currentUser?.id) return (
    <div className="max-w-2xl mx-auto py-10 px-4">
      <EmptyState illustration="not-found" title="Listing not found"
        description="You can only edit listings you own."
        action={<Link to="/my/listings" className="text-sm text-evergreen font-semibold hover:underline">← My Listings</Link>} />
    </div>
  );
  if (listing.moderationStatus === 'hidden_by_admin') return (
    <div className="max-w-2xl mx-auto py-10 px-4">
      <EmptyState illustration="safety-professional" title="Under moderation review"
        description="This listing was hidden after community reports. It can't be edited until an admin reviews it."
        action={<Link to="/my/listings" className="text-sm text-evergreen font-semibold hover:underline">← My Listings</Link>} />
    </div>
  );

  return (
    <div className="max-w-2xl mx-auto py-10 px-4 space-y-6">
      <Link to="/my/listings" className="flex items-center gap-1.5 text-xs text-ink-muted hover:text-ink">
        <ArrowLeft className="w-3.5 h-3.5" />
        Back to My Listings
      </Link>

      <div>
        <h1 className="text-2xl font-bold text-ink">Edit Listing</h1>
        <p className="text-xs text-ink-muted mt-0.5 font-mono">{listing.id}</p>
      </div>

      {error && (
        <div className="flex items-start gap-2 p-3 bg-red-50 border border-red-200 rounded-xl text-xs text-red-700">
          <AlertCircle className="w-4 h-4 shrink-0 mt-0.5" />
          {error}
        </div>
      )}

      <form onSubmit={handleSubmit} className="bg-surface rounded-2xl border border-surface-border p-6 space-y-5">
        <div>
          <label className="block text-xs font-semibold text-ink mb-1">Title</label>
          <input type="text" value={title} onChange={(e) => setTitle(e.target.value)}
            className="w-full px-3 py-2 text-sm bg-surface-secondary border border-surface-border rounded-xl focus-ring" required />
        </div>

        <div className="grid grid-cols-2 gap-4">
          <div>
            <label className="block text-xs font-semibold text-ink mb-1">Condition</label>
            <select value={condition} onChange={(e) => setCondition(e.target.value as ListingCondition)}
              className="w-full px-3 py-2 text-sm bg-surface-secondary border border-surface-border rounded-xl focus-ring">
              <option value="like_new">Like New</option>
              <option value="good">Good</option>
              <option value="fair">Fair</option>
            </select>
          </div>
          <div>
            <label className="block text-xs font-semibold text-ink mb-1">Quantity</label>
            <input type="number" min="1" value={totalQuantity}
              onChange={(e) => setTotalQuantity(Math.max(1, parseInt(e.target.value) || 1))}
              className="w-full px-3 py-2 text-sm bg-surface-secondary border border-surface-border rounded-xl focus-ring font-mono" required />
          </div>
        </div>

        {listing.mode !== 'lend' && (
          <div>
            <label className="block text-xs font-semibold text-ink mb-1">
              Price (₹) {listing.priceUnit === 'day' ? '/day' : ''}
            </label>
            <input type="number" min="0" value={price}
              onChange={(e) => setPrice(e.target.value === '' ? '' : parseInt(e.target.value))}
              className="w-full px-3 py-2 text-sm bg-surface-secondary border border-surface-border rounded-xl focus-ring font-mono" />
            <p className="text-[11px] text-ink-muted mt-1">Leave empty if price is to be decided with borrower.</p>
          </div>
        )}

        <div>
          <label className="block text-xs font-semibold text-ink mb-1">Description</label>
          <textarea rows={3} value={description} onChange={(e) => setDescription(e.target.value)}
            className="w-full p-3 text-sm bg-surface-secondary border border-surface-border rounded-xl focus-ring resize-none" required />
        </div>

        <div>
          <label className="block text-xs font-semibold text-ink mb-1">Pickup Instructions</label>
          <input type="text" value={pickupNote} onChange={(e) => setPickupNote(e.target.value)}
            className="w-full px-3 py-2 text-sm bg-surface-secondary border border-surface-border rounded-xl focus-ring" />
        </div>

        <div className="flex justify-end gap-3 pt-2 border-t border-surface-border">
          <Link to="/my/listings" className="px-4 py-2 text-xs text-ink-muted hover:bg-surface-secondary rounded-lg">
            Cancel
          </Link>
          <button type="submit" disabled={isSubmitting}
            className="px-6 py-2.5 bg-brand hover:bg-brand-dark text-white rounded-xl font-semibold text-sm transition-colors disabled:opacity-50">
            {isSubmitting ? 'Saving...' : 'Save Changes'}
          </button>
        </div>
      </form>
    </div>
  );
};
