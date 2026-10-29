import React, { useState, useEffect } from 'react';
import { useParams, Link } from 'react-router-dom';
import { Star, Heart, ArrowLeft } from 'lucide-react';
import { User, Listing, UserProfileSummary } from '@sidekit/shared';
import { sidekitService } from '../services';
import { ItemThumb } from '../components/brand/itemIcons';
import { BrandLoader, EmptyState } from '../components/brand/BrandStates';
import { ProfileBadges } from '../components/shared/ProfileBadges';
import { SampleBadge } from '../components/shared/SampleBadge';
import { listingPriceLabel } from '../components/shared/listingPrice';

export const UserProfilePage: React.FC = () => {
  const { id } = useParams<{ id: string }>();
  const [user, setUser] = useState<User | null>(null);
  const [listings, setListings] = useState<Listing[]>([]);
  const [isLoading, setIsLoading] = useState(true);
  const [profile, setProfile] = useState<UserProfileSummary | null>(null);

  useEffect(() => {
    if (!id) return;
    setIsLoading(true);
    Promise.all([
      sidekitService.getUserById(id),
      sidekitService.searchListings({ ownerId: id }),
      sidekitService.getUserProfile(id).catch(() => null),
    ]).then(([u, own, summary]) => {
      setUser(u || null);
      setListings(own.filter((l) => l.status === 'active'));
      setProfile(summary);
      setIsLoading(false);
    }).catch(() => setIsLoading(false));
  }, [id]);

  if (isLoading) return <BrandLoader label="Loading profile…" />;
  if (!user) return (
    <div className="max-w-2xl mx-auto py-10 px-4">
      <EmptyState illustration="not-found" title="Neighbour not found"
        action={<Link to="/browse" className="text-sm text-evergreen font-semibold hover:underline">← Browse</Link>} />
    </div>
  );

  return (
    <div className="max-w-2xl mx-auto py-10 px-4 space-y-6">
      <Link to="/browse" className="flex items-center gap-1.5 text-xs text-ink-muted hover:text-ink">
        <ArrowLeft className="w-3.5 h-3.5" />
        Back to Catalog
      </Link>

      {/* Header */}
      <div className="bg-surface rounded-2xl border border-surface-border p-6 flex items-center gap-4">
        <div aria-hidden="true" className="w-14 h-14 rounded-2xl bg-evergreen-light text-evergreen font-bold text-xl flex items-center justify-center border border-evergreen/20 shrink-0">
          {user.name.charAt(0)}
        </div>
        <div>
          <h1 className="text-xl font-bold text-ink">{user.displayName}</h1>
          <p className="text-xs text-ink-muted">{user.tower} · Palm Grove resident</p>
          {user.reviewCount > 0 && (
            <div className="flex items-center gap-1 text-xs text-amber-600 font-semibold mt-1">
              <Star className="w-3 h-3 fill-current" aria-hidden="true" />
              {user.rating} · {user.reviewCount} reviews
            </div>
          )}
        </div>
      </div>

      {/* Stats */}
      <div className="grid grid-cols-3 gap-4">
        {[
          { label: 'Items lent', value: user.itemsSharedCount },
          { label: 'Active listings', value: listings.length },
          { label: 'Thank-you notes', value: user.thankYouNotes?.length ?? 0 },
        ].map(({ label, value }) => (
          <div key={label} className="p-4 bg-surface rounded-2xl border border-surface-border text-center">
            <div className="text-xl font-bold text-ink">{value}</div>
            <div className="text-[11px] text-ink-muted mt-1">{label}</div>
          </div>
        ))}
      </div>

      {profile && profile.badges.some((b) => b.earned) && (
        <div className="bg-surface rounded-2xl border border-surface-border p-5 space-y-3">
          <h2 className="text-sm font-bold text-ink">Badges</h2>
          <ProfileBadges badges={profile.badges} showLocked={false} />
        </div>
      )}

      {/* Thank-you notes */}
      {user.thankYouNotes && user.thankYouNotes.length > 0 && (
        <div className="bg-surface rounded-2xl border border-surface-border p-5 space-y-3">
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
                className="flex items-center gap-3 p-3 bg-surface rounded-xl border border-surface-border hover:border-evergreen/30 transition-colors">
                <ItemThumb itemKey={l.itemKey} title={l.title} category={l.category} size={48} />
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
