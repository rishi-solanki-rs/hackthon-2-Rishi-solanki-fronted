import React, { useState } from 'react';
import { useNavigate, Link } from 'react-router-dom';
import { Star, Award, Heart, AlertCircle, ExternalLink } from 'lucide-react';
import { useAuth } from '../context/AuthContext';
import { sidekitService } from '../services';

export const MyProfilePage: React.FC = () => {
  const { currentUser } = useAuth();
  const navigate = useNavigate();
  const [deleteError, setDeleteError] = useState('');
  const [isDeleting, setIsDeleting] = useState(false);
  const [showDeleteModal, setShowDeleteModal] = useState(false);

  if (!currentUser) return <div className="py-20 text-center text-sm text-ink-muted">Loading profile...</div>;

  const handleDelete = async () => {
    setIsDeleting(true); setDeleteError('');
    try {
      await sidekitService.deleteAccount(currentUser.id);
      navigate('/');
      window.location.reload();
    } catch (err: any) { setDeleteError(err.message || 'Cannot delete account.'); }
    setIsDeleting(false);
  };

  return (
    <div className="max-w-2xl mx-auto py-10 px-4 space-y-6">
      {/* Profile header */}
      <div className="bg-white rounded-2xl border border-surface-border p-6 flex items-center gap-5">
        <div className="w-16 h-16 rounded-2xl bg-evergreen/10 text-evergreen font-bold text-2xl flex items-center justify-center border border-evergreen/20 shrink-0">
          {currentUser.name.charAt(0)}
        </div>
        <div className="flex-1 min-w-0">
          <h1 className="text-xl font-bold text-ink truncate">{currentUser.name}</h1>
          <p className="text-xs text-ink-muted mt-0.5">
            {currentUser.tower} · Flat {currentUser.flat}
            <span className="ml-2 px-1.5 py-0.5 rounded bg-evergreen/8 text-evergreen text-[10px] font-semibold capitalize"
              style={{ background: 'rgba(23,107,84,0.06)' }}>
              {currentUser.role}
            </span>
          </p>
          <div className="flex items-center gap-1 text-xs text-amber-600 font-semibold mt-1">
            <Star className="w-3 h-3 fill-current" />
            {currentUser.rating} · {currentUser.reviewCount} reviews
          </div>
        </div>
        <Link to={`/u/${currentUser.id}`}
          className="flex items-center gap-1 text-xs text-ink-muted hover:text-ink shrink-0">
          <ExternalLink className="w-3.5 h-3.5" />
          Public view
        </Link>
      </div>

      {/* Stats */}
      <div className="grid grid-cols-3 gap-4">
        {[
          { label: 'Items Shared', value: currentUser.itemsSharedCount, cls: 'text-evergreen' },
          { label: 'Savings', value: `₹${currentUser.totalEstimatedSavings.toLocaleString('en-IN')}`, cls: 'text-ink' },
          { label: 'Return Rate', value: '100%', cls: 'text-emerald-600' },
        ].map(({ label, value, cls }) => (
          <div key={label} className="p-4 bg-white rounded-2xl border border-surface-border text-center">
            <div className={`text-xl font-bold ${cls}`}>{value}</div>
            <div className="text-[11px] text-ink-muted mt-1">{label}</div>
          </div>
        ))}
      </div>

      {/* Badges */}
      <div className="bg-white rounded-2xl border border-surface-border p-5 space-y-3">
        <h2 className="text-sm font-bold text-ink">Badges</h2>
        <div className="flex flex-wrap gap-2">
          {[
            { icon: Award, label: 'Verified Neighbour', cls: 'text-evergreen' },
            { icon: Heart, label: 'Community Helper', cls: 'text-rose-500' },
          ].map(({ icon: Icon, label, cls }) => (
            <div key={label} className="flex items-center gap-2 px-3 py-2 rounded-xl border border-surface-border bg-surface-secondary text-xs font-medium text-ink">
              <Icon className={`w-4 h-4 ${cls}`} />
              {label}
            </div>
          ))}
        </div>
      </div>

      {/* Thank-you notes */}
      <div className="bg-white rounded-2xl border border-surface-border p-5 space-y-3">
        <h2 className="text-sm font-bold text-ink flex items-center gap-2">
          <Heart className="w-4 h-4 text-rose-500" />
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
          <p className="text-xs text-ink-muted">Complete loans to receive notes.</p>
        )}
      </div>

      {/* Danger zone */}
      <div className="bg-white rounded-2xl border border-surface-border p-5 flex items-center justify-between">
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
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-ink/40 backdrop-blur-sm">
          <div className="bg-white rounded-2xl max-w-sm w-full p-6 shadow-2xl border border-surface-border">
            <h3 className="text-sm font-bold text-rose-700 mb-2">Delete Account?</h3>
            <p className="text-xs text-ink-muted mb-4">Cannot delete while you have active loans.</p>
            {deleteError && (
              <div className="flex items-start gap-2 p-3 bg-red-50 border border-red-200 rounded-xl text-xs text-red-700 mb-4">
                <AlertCircle className="w-4 h-4 shrink-0 mt-0.5" />
                {deleteError}
              </div>
            )}
            <div className="flex justify-end gap-2">
              <button onClick={() => { setShowDeleteModal(false); setDeleteError(''); }}
                className="px-4 py-2 text-xs text-ink-muted hover:bg-surface-secondary rounded-lg">Keep</button>
              <button onClick={handleDelete} disabled={isDeleting}
                className="px-4 py-2 text-xs font-semibold bg-rose-600 hover:bg-rose-700 text-white rounded-xl disabled:opacity-50">
                {isDeleting ? '...' : 'Delete'}
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
};
