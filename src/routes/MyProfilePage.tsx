import React, { useEffect, useState } from 'react';
import { useNavigate, Link } from 'react-router-dom';
import { Star, Heart, AlertCircle, ExternalLink } from 'lucide-react';
import { UserProfileSummary } from '@sidekit/shared';
import { useAuth } from '../context/AuthContext';
import { sidekitService } from '../services';
import { BrandLoader } from '../components/brand/BrandStates';
import { ProfileBadges } from '../components/shared/ProfileBadges';

export const MyProfilePage: React.FC = () => {
  const { currentUser, refreshCurrentUser } = useAuth();
  const navigate = useNavigate();
  const [profile, setProfile] = useState<UserProfileSummary | null>(null);
  const [deleteError, setDeleteError] = useState('');
  const [isDeleting, setIsDeleting] = useState(false);
  const [showDeleteModal, setShowDeleteModal] = useState(false);

  useEffect(() => {
    if (!currentUser) return;
    refreshCurrentUser().catch(() => {});
    sidekitService.getUserProfile(currentUser.id).then(setProfile).catch(() => setProfile(null));
  }, [currentUser?.id]);

  if (!currentUser) return <BrandLoader label="Loading profile…" />;

  const handleDelete = async () => {
    setIsDeleting(true); setDeleteError('');
    try {
      await sidekitService.deleteAccount(currentUser.id);
      navigate('/');
      window.location.reload();
    } catch (err: any) { setDeleteError(err.message || 'Cannot delete account.'); }
    setIsDeleting(false);
  };

  const stats = [
    { label: 'Items lent', value: currentUser.itemsSharedCount },
    { label: 'Active listings', value: profile?.stats.activeListings ?? '—' },
    { label: 'Borrows completed', value: profile?.stats.completedBorrows ?? '—' },
  ];

  return (
    <div className="max-w-2xl mx-auto py-10 px-4 space-y-6">
      {/* Profile header */}
      <div className="bg-surface rounded-2xl border border-surface-border p-5 sm:p-6 flex flex-wrap items-center gap-4 sm:gap-5">
        <div className="w-14 h-14 sm:w-16 sm:h-16 rounded-2xl bg-evergreen-light text-evergreen font-bold text-2xl flex items-center justify-center border border-evergreen/20 shrink-0" aria-hidden="true">
          {currentUser.name.charAt(0)}
        </div>
        <div className="flex-1 min-w-[12rem]">
          <h1 className="text-xl font-bold text-ink break-words">{currentUser.name}</h1>
          <p className="text-xs text-ink-muted mt-0.5">
            {currentUser.tower} · Flat {currentUser.flat}
            <span className="ml-2 px-1.5 py-0.5 rounded bg-evergreen-light text-evergreen text-[10px] font-semibold capitalize">
              {currentUser.role}
            </span>
          </p>
          <p className="text-[11px] text-ink-subtle mt-0.5">Your flat and phone are only shared after you accept a request.</p>
          {currentUser.reviewCount > 0 && (
            <div className="flex items-center gap-1 text-xs text-amber-600 font-semibold mt-1">
              <Star className="w-3 h-3 fill-current" aria-hidden="true" />
              {currentUser.rating} · {currentUser.reviewCount} reviews
            </div>
          )}
        </div>
        <Link to={`/u/${currentUser.id}`}
          className="flex items-center gap-1 text-xs text-ink-muted hover:text-ink shrink-0">
          <ExternalLink className="w-3.5 h-3.5" aria-hidden="true" />
          Public view
        </Link>
      </div>

      {/* Stats */}
      <div className="grid grid-cols-3 gap-4">
        {stats.map(({ label, value }) => (
          <div key={label} className="p-4 bg-surface rounded-2xl border border-surface-border text-center">
            <div className="text-xl font-bold text-ink">{value}</div>
            <div className="text-[11px] text-ink-muted mt-1">{label}</div>
          </div>
        ))}
      </div>

      {/* Badges */}
      <div className="bg-surface rounded-2xl border border-surface-border p-5 space-y-4">
        <div>
          <h2 className="text-sm font-bold text-ink">Badges</h2>
          <p className="text-[11px] text-ink-muted mt-0.5">Earned automatically from completed loans and listings. Hover a badge to see its rule.</p>
        </div>
        {profile ? <ProfileBadges badges={profile.badges} /> : <p className="text-xs text-ink-muted">Loading badges…</p>}
      </div>

      {/* Thank-you notes */}
      <div className="bg-surface rounded-2xl border border-surface-border p-5 space-y-3">
        <h2 className="text-sm font-bold text-ink flex items-center gap-2">
          <Heart className="w-4 h-4 text-rose-500" aria-hidden="true" />
          Thank-You Notes
        </h2>
        {currentUser.thankYouNotes?.length ? (
          <div className="space-y-3">
            {currentUser.thankYouNotes.map((note) => (
              <div key={note.id} className="p-3.5 bg-surface-secondary rounded-xl border-l-2 border-rose-200">
                <div className="flex items-center justify-between text-[11px] text-ink-muted mb-1">
                  <span className="font-semibold text-ink">{note.fromUserName}</span>
                  <span>{new Date(note.createdAt).toLocaleDateString()}</span>
                </div>
                <p className="text-xs text-ink italic">"{note.message}"</p>
              </div>
            ))}
          </div>
        ) : (
          <p className="text-xs text-ink-muted">Lend items to neighbours to receive notes.</p>
        )}
      </div>

      {/* Danger zone */}
      <div className="bg-surface rounded-2xl border border-surface-border p-5 flex items-center justify-between">
        <div>
          <p className="text-xs font-semibold text-rose-700">Danger Zone</p>
          <p className="text-xs text-ink-muted mt-0.5">Permanently remove your account.</p>
        </div>
        <button onClick={() => setShowDeleteModal(true)}
          className="px-4 py-2 bg-rose-50 hover:bg-rose-100 text-rose-700 text-xs font-semibold rounded-xl border border-rose-200 transition-colors">
          Delete Account
        </button>
      </div>

      {showDeleteModal && (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/50 backdrop-blur-sm" role="dialog" aria-modal="true" aria-labelledby="delete-title">
          <div className="bg-surface rounded-2xl max-w-sm w-full p-6 shadow-2xl border border-surface-border">
            <h3 id="delete-title" className="text-sm font-bold text-rose-700 mb-2">Delete Account?</h3>
            <p className="text-xs text-ink-muted mb-4">Cannot delete while you have active loans.</p>
            {deleteError && (
              <div role="alert" className="flex items-start gap-2 p-3 bg-red-50 border border-red-200 rounded-xl text-xs text-red-700 mb-4">
                <AlertCircle className="w-4 h-4 shrink-0 mt-0.5" aria-hidden="true" />
                {deleteError}
              </div>
            )}
            <div className="flex justify-end gap-2">
              <button onClick={() => { setShowDeleteModal(false); setDeleteError(''); }}
                className="px-4 py-2 text-xs text-ink-muted hover:bg-surface-secondary rounded-lg">Keep</button>
              <button onClick={handleDelete} disabled={isDeleting}
                className="px-4 py-2 text-xs font-semibold bg-danger hover:bg-danger/90 text-white rounded-xl disabled:opacity-50">
                {isDeleting ? '...' : 'Delete'}
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
};
