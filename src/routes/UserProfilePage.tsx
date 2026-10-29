import React, { useState, useEffect } from 'react';
import { useParams, Link } from 'react-router-dom';
import { Star, Heart, ArrowLeft } from 'lucide-react';
import { User, Listing } from '@sidekit/shared';
import { sidekitService } from '../services';
import { SampleBadge } from '../components/shared/SampleBadge';
import { listingPriceLabel } from '../components/shared/listingPrice';

export const UserProfilePage: React.FC = () => {
  const { id } = useParams<{ id: string }>();
  const [user, setUser] = useState<User | null>(null);
  const [listings, setListings] = useState<Listing[]>([]);
  const [isLoading, setIsLoading] = useState(true);

  useEffect(() => {
    if (!id) return;
    Promise.all([
      sidekitService.getUserById(id),
      sidekitService.searchListings(),
    ]).then(([u, all]) => {
      if (u) {
        setUser(u);
        setListings(all.filter((l) => l.ownerId === u.id && l.status === 'active'));
      }
      setIsLoading(false);
    }).catch(() => setIsLoading(false));
  }, [id]);

  if (isLoading) return <div className="py-20 text-center text-sm text-ink-muted">Loading...</div>;
  if (!user) return (
    <div className="py-20 text-center space-y-4">
      <p className="text-ink-muted text-sm">Neighbour not found.</p>
      <Link to="/browse" className="text-sm text-evergreen font-semibold hover:underline">← Browse</Link>
    </div>
  );

  return (
    <div className="max-w-2xl mx-auto py-10 px-4 space-y-6">
      <Link to="/browse" className="flex items-center gap-1.5 text-xs text-ink-muted hover:text-ink">
        <ArrowLeft className="w-3.5 h-3.5" />
        Back to Catalog
      </Link>

      {/* Header */}
      <div className="bg-white rounded-2xl border border-surface-border p-6 flex items-center gap-4">
        <div className="w-14 h-14 rounded-2xl bg-evergreen/10 text-evergreen font-bold text-xl flex items-center justify-center border border-evergreen/20 shrink-0">
          {user.name.charAt(0)}
        </div>
        <div>
          <h1 className="text-xl font-bold text-ink">{user.displayName}</h1>
          <p className="text-xs text-ink-muted">{user.tower} · Verified Resident</p>
          <div className="flex items-center gap-1 text-xs text-amber-600 font-semibold mt-1">
            <Star className="w-3 h-3 fill-current" />
            {user.rating} · {user.reviewCount} reviews
          </div>
        </div>
      </div>

      {/* Stats */}
      <div className="grid grid-cols-3 gap-4">
        {[
          { label: 'Items Shared', value: user.itemsSharedCount, cls: 'text-evergreen' },
          { label: 'Active Listings', value: listings.length, cls: 'text-ink' },
          { label: 'Return Rate', value: '100%', cls: 'text-emerald-600' },
        ].map(({ label, value, cls }) => (
          <div key={label} className="p-4 bg-white rounded-2xl border border-surface-border text-center">
            <div className={`text-xl font-bold ${cls}`}>{value}</div>
            <div className="text-[11px] text-ink-muted mt-1">{label}</div>
          </div>
        ))}
      </div>

      {/* Thank-you notes */}
      {user.thankYouNotes && user.thankYouNotes.length > 0 && (
        <div className="bg-white rounded-2xl border border-surface-border p-5 space-y-3">
          <h2 className="text-sm font-bold text-ink flex items-center gap-2">
            <Heart className="w-4 h-4 text-rose-500" />
            Community Notes
          </h2>
          <div className="space-y-3">
            {user.thankYouNotes.map((n) => (
              <div key={n.id} className="p-3.5 bg-surface-secondary rounded-xl border-l-2 border-rose-200">
                <div className="flex items-center justify-between text-[11px] text-ink-muted mb-1">
                  <span className="font-semibold text-ink">{n.fromUserName}</span>
                  <span>{new Date(n.createdAt).toLocaleDateString()}</span>
                </div>
                <p className="text-xs text-ink italic">"{n.message}"</p>
              </div>
            ))}
          </div>
        </div>
      )}

      {/* Active listings */}
      <div className="space-y-3">
        <h2 className="text-sm font-bold text-ink">
          Sharing right now ({listings.length})
        </h2>
        {listings.length === 0 ? (
          <p className="text-xs text-ink-muted">No active listings at the moment.</p>
        ) : (
          <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
            {listings.map((l) => (
              <Link key={l.id} to={`/listing/${l.id}`}
                className="flex items-center gap-3 p-3 bg-white rounded-xl border border-surface-border hover:border-evergreen/30 transition-colors">
                <img src={l.photos[0]} alt={l.title}
                  className="w-12 h-12 rounded-lg object-cover border border-surface-border shrink-0" />
                <div className="min-w-0 flex-1">
                  <p className="text-xs font-semibold text-ink truncate">{l.title}</p>
                  <p className="text-[11px] text-ink-muted mt-0.5 flex items-center gap-1.5">
                    {listingPriceLabel(l)}
                    {l.isSample && <SampleBadge />}
                  </p>
                </div>
              </Link>
            ))}
          </div>
        )}
      </div>
    </div>
  );
};
