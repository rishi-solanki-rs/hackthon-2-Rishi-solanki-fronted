import React, { useState } from 'react';
import { useNavigate, Link } from 'react-router-dom';
import {
  User as UserIcon,
  ShieldAlert,
  Award,
  Star,
  CheckCircle,
  Heart,
  TrendingUp,
  Trash2,
  AlertCircle,
} from 'lucide-react';
import { useAuth } from '../context/AuthContext';
import { sidekitService } from '../services';

export const MyProfilePage: React.FC = () => {
  const { currentUser, refreshCurrentUser } = useAuth();
  const navigate = useNavigate();

  const [deleteError, setDeleteError] = useState<string | null>(null);
  const [isDeleting, setIsDeleting] = useState(false);
  const [showDeleteModal, setShowDeleteModal] = useState(false);

  if (!currentUser) {
    return <div className="py-20 text-center text-xs text-ink-muted">Loading profile...</div>;
  }

  const handleDeleteAccount = async () => {
    try {
      setIsDeleting(true);
      setDeleteError(null);
      await sidekitService.deleteAccount(currentUser.id);
      alert('Your account has been deleted.');
      navigate('/');
      window.location.reload();
    } catch (err: any) {
      setDeleteError(err.message || 'Cannot delete account at this time.');
    } finally {
      setIsDeleting(false);
    }
  };

  return (
    <div className="max-w-3xl mx-auto py-8 px-4 space-y-6">
      {/* Profile Header */}
      <div className="p-6 bg-surface rounded-3xl border border-surface-border shadow-sm flex flex-col sm:flex-row sm:items-center justify-between gap-6">
        <div className="flex items-center gap-4">
          <div className="w-16 h-16 rounded-2xl bg-evergreen/10 text-evergreen font-bold text-2xl flex items-center justify-center border border-evergreen/20">
            {currentUser.name.charAt(0)}
          </div>
          <div>
            <h1 className="text-xl sm:text-2xl font-bold tracking-tight text-ink">
              {currentUser.name}
            </h1>
            <div className="text-xs text-ink-muted mt-0.5 flex items-center gap-2">
              <span>{currentUser.tower}</span>
              <span>·</span>
              <span>Flat {currentUser.flat}</span>
              <span>·</span>
              <span className="capitalize font-semibold text-evergreen">{currentUser.role}</span>
            </div>
            <div className="flex items-center gap-1.5 text-xs text-amber-600 font-bold mt-1">
              <Star className="w-3.5 h-3.5 fill-current" />
              <span>{currentUser.rating}</span>
              <span className="text-ink-muted font-normal">({currentUser.reviewCount} community reviews)</span>
            </div>
          </div>
        </div>

        {/* Action Link to Public View */}
        <Link
          to={`/u/${currentUser.id}`}
          className="px-4 py-2 bg-surface-secondary hover:bg-surface-border text-xs font-semibold rounded-xl text-ink self-start sm:self-auto"
        >
          View Public Profile
        </Link>
      </div>

      {/* Stats Counter (FIX-PROFILE-01) */}
      <div className="grid grid-cols-3 gap-4">
        <div className="p-4 bg-surface rounded-2xl border border-surface-border text-center space-y-1">
          <div className="text-2xl font-black text-evergreen">{currentUser.itemsSharedCount}</div>
          <div className="text-[11px] font-semibold text-ink-muted uppercase">Items Shared</div>
        </div>

        <div className="p-4 bg-surface rounded-2xl border border-surface-border text-center space-y-1">
          <div className="text-2xl font-black text-ink">
            ₹{currentUser.totalEstimatedSavings.toLocaleString('en-IN')}
          </div>
          <div className="text-[11px] font-semibold text-ink-muted uppercase">Community Savings</div>
        </div>

        <div className="p-4 bg-surface rounded-2xl border border-surface-border text-center space-y-1">
          <div className="text-2xl font-black text-emerald-600">100%</div>
          <div className="text-[11px] font-semibold text-ink-muted uppercase">On-Time Return Rate</div>
        </div>
      </div>

      {/* Trust Badges */}
      <div className="p-6 bg-surface rounded-3xl border border-surface-border shadow-sm space-y-3">
        <h3 className="text-xs font-bold text-ink uppercase tracking-wider">Community Badges</h3>
        <div className="grid grid-cols-1 sm:grid-cols-3 gap-3">
          <div className="p-3 bg-evergreen-light/40 border border-evergreen/20 rounded-2xl flex items-center gap-3">
            <Award className="w-5 h-5 text-evergreen shrink-0" />
            <div>
              <div className="text-xs font-bold text-ink">Verified Neighbour</div>
              <div className="text-[10px] text-ink-muted">Resident Welfare Association approved</div>
            </div>
          </div>

          <div className="p-3 bg-evergreen-light/40 border border-evergreen/20 rounded-2xl flex items-center gap-3">
            <CheckCircle className="w-5 h-5 text-emerald-600 shrink-0" />
            <div>
              <div className="text-xs font-bold text-ink">Master Toolkeeper</div>
              <div className="text-[10px] text-ink-muted">Shared over 5 quality tools</div>
            </div>
          </div>

          <div className="p-3 bg-evergreen-light/40 border border-evergreen/20 rounded-2xl flex items-center gap-3">
            <Heart className="w-5 h-5 text-rose-500 shrink-0" />
            <div>
              <div className="text-xs font-bold text-ink">Community Helper</div>
              <div className="text-[10px] text-ink-muted">High helpfulness rating</div>
            </div>
          </div>
        </div>
      </div>

      {/* Thank You Notes Received (FIX-SOCIAL-01) */}
      <div className="p-6 bg-surface rounded-3xl border border-surface-border shadow-sm space-y-4">
        <h3 className="text-xs font-bold text-ink uppercase tracking-wider flex items-center gap-2">
          <Heart className="w-4 h-4 text-rose-500" />
          <span>Thank-You Notes from Neighbours</span>
        </h3>

        {currentUser.thankYouNotes && currentUser.thankYouNotes.length > 0 ? (
          <div className="space-y-3">
            {currentUser.thankYouNotes.map((note) => (
              <div key={note.id} className="p-3.5 bg-surface-secondary rounded-2xl text-xs space-y-1">
                <div className="flex items-center justify-between text-ink-muted text-[11px]">
                  <span className="font-bold text-ink">{note.fromUserName}</span>
                  <span>{new Date(note.createdAt).toLocaleDateString()}</span>
                </div>
                <p className="text-ink leading-relaxed italic">"{note.message}"</p>
              </div>
            ))}
          </div>
        ) : (
          <p className="text-xs text-ink-muted">
            Complete loans to collect public thank-you notes on your profile.
          </p>
        )}
      </div>

      {/* Account Deletion Guard (FIX-AUTH-03) */}
      <div className="p-6 bg-surface rounded-3xl border border-surface-border shadow-sm flex items-center justify-between">
        <div>
          <h4 className="text-xs font-bold text-rose-700 uppercase tracking-wider">Danger Zone</h4>
          <p className="text-xs text-ink-muted mt-0.5">
            Permanently remove your account and active listings from Palm Grove.
          </p>
        </div>

        <button
          type="button"
          onClick={() => setShowDeleteModal(true)}
          className="px-4 py-2 bg-rose-50 hover:bg-rose-100 text-rose-700 text-xs font-bold rounded-xl border border-rose-200 transition-colors"
        >
          Delete My Account
        </button>
      </div>

      {/* Account Deletion Confirmation Modal */}
      {showDeleteModal && (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-ink/40 backdrop-blur-sm">
          <div className="bg-surface rounded-3xl max-w-md w-full p-6 shadow-2xl border border-surface-border animate-in fade-in zoom-in-95 duration-150">
            <h3 className="text-base font-bold text-ink flex items-center gap-2 text-rose-700">
              <Trash2 className="w-5 h-5" />
              <span>Delete Society Account</span>
            </h3>
            <p className="text-xs text-ink-muted mt-2 mb-4 leading-relaxed">
              Are you sure? You cannot delete your account while you have open loans or active borrowings.
            </p>

            {deleteError && (
              <div className="p-3 bg-red-50 border border-red-200 rounded-xl text-xs text-red-700 flex items-start gap-2 mb-4">
                <AlertCircle className="w-4 h-4 shrink-0 mt-0.5" />
                <span>{deleteError}</span>
              </div>
            )}

            <div className="flex items-center justify-end gap-2">
              <button
                type="button"
                onClick={() => {
                  setShowDeleteModal(false);
                  setDeleteError(null);
                }}
                className="px-4 py-2 text-xs font-semibold text-ink-muted hover:bg-surface-secondary rounded-xl"
              >
                Keep Account
              </button>
              <button
                type="button"
                disabled={isDeleting}
                onClick={handleDeleteAccount}
                className="px-5 py-2 text-xs font-semibold bg-rose-600 hover:bg-rose-700 text-white rounded-xl shadow-sm disabled:opacity-50"
              >
                {isDeleting ? 'Checking...' : 'Yes, Delete'}
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
};

