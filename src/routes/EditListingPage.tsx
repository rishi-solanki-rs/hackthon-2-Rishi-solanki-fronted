import React, { useState, useEffect } from 'react';
import { useParams, useNavigate, Link } from 'react-router-dom';
import { AlertCircle, ArrowLeft } from 'lucide-react';
import { Listing, ListingCondition } from '@sidekit/shared';
import { sidekitService } from '../services';
import { useAuth } from '../context/AuthContext';

export const EditListingPage: React.FC = () => {
  const { id } = useParams<{ id: string }>();
  const navigate = useNavigate();
  const { currentUser } = useAuth();

  const [listing, setListing] = useState<Listing | null>(null);
  const [title, setTitle] = useState('');
  const [description, setDescription] = useState('');
  const [price, setPrice] = useState<number | ''>('');
  const [condition, setCondition] = useState<ListingCondition>('good');
  const [totalQuantity, setTotalQuantity] = useState(1);
  const [pickupNote, setPickupNote] = useState('');
  const [isLoading, setIsLoading] = useState(true);
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    const fetch = async () => {
      if (!id) return;
      try {
        setIsLoading(true);
        const data = await sidekitService.getListing(id);
        if (data) {
          setListing(data);
          setTitle(data.title);
          setDescription(data.description);
          setPrice(data.price !== null ? data.price : '');
          setCondition(data.condition);
          setTotalQuantity(data.totalQuantity);
          setPickupNote(data.pickupNote || '');
        }
      } catch (err) {
        console.error(err);
      } finally {
        setIsLoading(false);
      }
    };
    fetch();
  }, [id]);

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!id) return;
    try {
      setIsSubmitting(true);
      setError(null);
      await sidekitService.updateListing(id, {
        title: title.trim(),
        description: description.trim(),
        price: price === '' ? null : Number(price),
        condition,
        totalQuantity: Math.max(1, totalQuantity),
        pickupNote: pickupNote.trim() || undefined,
      });
      navigate('/my/listings');
    } catch (err: any) {
      setError(err.message || 'Failed to update listing.');
    } finally {
      setIsSubmitting(false);
    }
  };

  if (isLoading) {
    return <div className="py-20 text-center text-xs text-ink-muted">Loading listing details...</div>;
  }

  if (!listing) {
    return <div className="py-20 text-center text-xs text-ink-muted">Listing not found.</div>;
  }

  return (
    <div className="max-w-2xl mx-auto py-8 px-4 space-y-6">
      <div>
        <Link
          to="/my/listings"
          className="text-xs font-semibold text-ink-muted hover:text-ink flex items-center gap-1.5"
        >
          <ArrowLeft className="w-3.5 h-3.5" />
          <span>Back to My Listings</span>
        </Link>
      </div>

      <div className="space-y-1">
        <h1 className="text-2xl font-bold tracking-tight text-ink">Edit Listing</h1>
        <p className="text-xs text-ink-muted font-mono">ID: {listing.id}</p>
      </div>

      {error && (
        <div className="p-3 bg-red-50 border border-red-200 rounded-xl text-xs text-red-700 flex items-center gap-2">
          <AlertCircle className="w-4 h-4 shrink-0" />
          <span>{error}</span>
        </div>
      )}

      <form onSubmit={handleSubmit} className="p-6 bg-surface rounded-3xl border border-surface-border shadow-sm space-y-6">
        <div>
          <label className="block text-xs font-bold text-ink uppercase tracking-wider mb-1">
            Title
          </label>
          <input
            type="text"
            value={title}
            onChange={(e) => setTitle(e.target.value)}
            className="w-full px-3 py-2 text-sm bg-surface-secondary border border-surface-border rounded-xl focus-ring"
            required
          />
        </div>

        <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
          <div>
            <label className="block text-xs font-bold text-ink uppercase tracking-wider mb-1">
              Condition
            </label>
            <select
              value={condition}
              onChange={(e) => setCondition(e.target.value as ListingCondition)}
              className="w-full px-3 py-2 text-sm bg-surface-secondary border border-surface-border rounded-xl focus-ring"
            >
              <option value="like_new">Like New</option>
              <option value="good">Good</option>
              <option value="fair">Fair</option>
            </select>
          </div>

          <div>
            <label className="block text-xs font-bold text-ink uppercase tracking-wider mb-1">
              Quantity Available
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

        {listing.mode !== 'lend' && (
          <div>
            <label className="block text-xs font-bold text-ink uppercase tracking-wider mb-1">
              Price (₹)
            </label>
            <input
              type="number"
              min="0"
              value={price}
              onChange={(e) => setPrice(e.target.value === '' ? '' : parseInt(e.target.value))}
              className="w-full px-3 py-2 text-sm bg-surface-secondary border border-surface-border rounded-xl focus-ring font-mono"
            />
          </div>
        )}

        <div>
          <label className="block text-xs font-bold text-ink uppercase tracking-wider mb-1">
            Description
          </label>
          <textarea
            rows={3}
            value={description}
            onChange={(e) => setDescription(e.target.value)}
            className="w-full p-3 text-sm bg-surface-secondary border border-surface-border rounded-xl focus-ring"
            required
          />
        </div>

        <div>
          <label className="block text-xs font-bold text-ink uppercase tracking-wider mb-1">
            Pickup Instructions
          </label>
          <input
            type="text"
            value={pickupNote}
            onChange={(e) => setPickupNote(e.target.value)}
            className="w-full px-3 py-2 text-sm bg-surface-secondary border border-surface-border rounded-xl focus-ring"
          />
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
            className="px-6 py-2 bg-evergreen hover:bg-evergreen-dark text-white rounded-xl font-semibold text-xs transition-colors shadow-sm disabled:opacity-50"
          >
            {isSubmitting ? 'Saving...' : 'Save Changes'}
          </button>
        </div>
      </form>
    </div>
  );
};

