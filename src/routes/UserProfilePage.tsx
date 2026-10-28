import React, { useState, useEffect } from 'react';
import { useParams, Link } from 'react-router-dom';
import {
  Star,
  Award,
  CheckCircle,
  Heart,
  Wrench,
  ArrowLeft,
  Calendar,
} from 'lucide-react';
import { User, Listing } from '@sidekit/shared';
import { sidekitService } from '../services';
import { SampleBadge } from '../components/shared/SampleBadge';

export const UserProfilePage: React.FC = () => {
  const { id } = useParams<{ id: string }>();
  const [user, setUser] = useState<User | null>(null);
  const [userListings, setUserListings] = useState<Listing[]>([]);
  const [isLoading, setIsLoading] = useState(true);

  useEffect(() => {
    const fetchUser = async () => {
      if (!id) return;
      try {
        setIsLoading(true);
        const [u, allListings] = await Promise.all([
          sidekitService.getUserById(id),
          sidekitService.searchListings(),
        ]);
        if (u) {
          setUser(u);
          setUserListings(allListings.filter((l) => l.ownerId === u.id && l.status === 'active'));
        }
      } catch (err) {
        console.error(err);
      } finally {
        setIsLoading(false);
      }
    };
    fetchUser();
  }, [id]);

  if (isLoading) {
    return <div className="py-20 text-center text-xs text-ink-muted">Loading neighbour profile...</div>;
  }

  if (!user) {
    return (
      <div className="py-20 text-center space-y-3">
        <h2 className="text-xl font-bold text-ink">Neighbour not found</h2>
        <Link to="/browse" className="text-xs text-evergreen hover:underline font-semibold">
          ← Back to Catalog
        </Link>
      </div>
    );
  }

  return (
    <div className="max-w-3xl mx-auto py-8 px-4 space-y-6">
      <div>
        <Link to="/browse" className="text-xs font-semibold text-ink-muted hover:text-ink flex items-center gap-1.5">
          <ArrowLeft className="w-3.5 h-3.5" />
          <span>Back to Catalog</span>
        </Link>
      </div>

      {/* Header */}
      <div className="p-6 bg-surface rounded-3xl border border-surface-border shadow-sm flex items-center gap-4">
        <div className="w-16 h-16 rounded-2xl bg-evergreen/10 text-evergreen font-bold text-2xl flex items-center justify-center border border-evergreen/20">
          {user.name.charAt(0)}
        </div>
        <div>
          <h1 className="text-2xl font-bold tracking-tight text-ink">{user.displayName}</h1>
          <div className="text-xs text-ink-muted mt-0.5 flex items-center gap-2">
            <span>{user.tower}</span>
            <span>·</span>
            <span>Verified Resident</span>
          </div>
          <div className="flex items-center gap-1 text-xs text-amber-600 font-bold mt-1">
            <Star className="w-3.5 h-3.5 fill-current" />
            <span>{user.rating}</span>
            <span className="text-ink-muted font-normal">({user.reviewCount} community reviews)</span>
          </div>
        </div>
      </div>

      {/* Stats (FIX-PROFILE-01) */}
      <div className="grid grid-cols-3 gap-4">
        <div className="p-4 bg-surface rounded-2xl border border-surface-border text-center space-y-1">
          <div className="text-2xl font-black text-evergreen">{user.itemsSharedCount}</div>
          <div className="text-[11px] font-semibold text-ink-muted uppercase">Lent Items</div>
        </div>

        <div className="p-4 bg-surface rounded-2xl border border-surface-border text-center space-y-1">
          <div className="text-2xl font-black text-ink">1</div>
          <div className="text-[11px] font-semibold text-ink-muted uppercase">Borrowed</div>
        </div>

        <div className="p-4 bg-surface rounded-2xl border border-surface-border text-center space-y-1">
          <div className="text-2xl font-black text-emerald-600">100%</div>
          <div className="text-[11px] font-semibold text-ink-muted uppercase">On-Time Return Rate</div>
        </div>
      </div>

      {/* Badges */}
      <div className="p-6 bg-surface rounded-3xl border border-surface-border shadow-sm space-y-3">
        <h3 className="text-xs font-bold text-ink uppercase tracking-wider">Verified Badges</h3>
        <div className="flex flex-wrap gap-2">
          <span className="px-3 py-1.5 rounded-xl bg-evergreen-light text-evergreen-dark text-xs font-semibold flex items-center gap-1.5">
            <Award className="w-4 h-4 text-evergreen" />
            <span>Helper</span>
          </span>
          <span className="px-3 py-1.5 rounded-xl bg-evergreen-light text-evergreen-dark text-xs font-semibold flex items-center gap-1.5">
            <CheckCircle className="w-4 h-4 text-emerald-600" />
            <span>Toolkeeper</span>
          </span>
          <span className="px-3 py-1.5 rounded-xl bg-evergreen-light text-evergreen-dark text-xs font-semibold flex items-center gap-1.5">
            <Heart className="w-4 h-4 text-rose-500" />
            <span>Reliable Resident</span>
          </span>
        </div>
      </div>

      {/* Thank You Notes Received (FIX-SOCIAL-01) */}
      <div className="p-6 bg-surface rounded-3xl border border-surface-border shadow-sm space-y-4">
        <h3 className="text-xs font-bold text-ink uppercase tracking-wider flex items-center gap-2">
          <Heart className="w-4 h-4 text-rose-500" />
          <span>Public Thank-You Notes</span>
        </h3>

        {user.thankYouNotes && user.thankYouNotes.length > 0 ? (
          <div className="space-y-3">
            {user.thankYouNotes.map((n) => (
              <div key={n.id} className="p-3.5 bg-surface-secondary rounded-2xl text-xs space-y-1">
                <div className="flex items-center justify-between text-[11px] text-ink-muted">
                  <span className="font-bold text-ink">{n.fromUserName}</span>
                  <span>{new Date(n.createdAt).toLocaleDateString()}</span>
                </div>
                <p className="text-ink italic">"{n.message}"</p>
              </div>
            ))}
          </div>
        ) : (
          <p className="text-xs text-ink-muted">No notes posted yet.</p>
        )}
      </div>

      {/* Active Listings by User */}
      <div className="space-y-3">
        <h3 className="text-xs font-bold text-ink uppercase tracking-wider">
          Items Shared by {user.displayName} ({userListings.length})
        </h3>

        <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
          {userListings.map((l) => (
            <Link
              key={l.id}
              to={`/listing/${l.id}`}
              className="p-3.5 bg-surface rounded-2xl border border-surface-border hover:border-evergreen/40 transition-colors flex items-center gap-3"
            >
              <img
                src={l.photos[0]}
                alt={l.title}
                className="w-12 h-12 rounded-xl object-cover border border-surface-border shrink-0"
              />
              <div className="min-w-0 flex-1">
                <h4 className="text-xs font-bold text-ink truncate">{l.title}</h4>
                <div className="text-[11px] text-ink-muted mt-0.5">
                  {l.mode === 'lend' ? 'Free Borrow' : `₹${l.price}${l.priceUnit === 'day' ? '/day' : ''}`}
                </div>
              </div>
            </Link>
          ))}
        </div>
      </div>
    </div>
  );
};

