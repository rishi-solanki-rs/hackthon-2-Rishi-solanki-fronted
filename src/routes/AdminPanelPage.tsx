import React, { useState, useEffect } from 'react';
import { Shield, RefreshCw, CheckCircle, AlertTriangle, XCircle, Flag } from 'lucide-react';
import { AdminQueueData } from '@sidekit/shared';
import { sidekitService } from '../services';
import { useAuth } from '../context/AuthContext';

export const AdminPanelPage: React.FC = () => {
  const { currentUser } = useAuth();
  const [queue, setQueue] = useState<AdminQueueData | null>(null);
  const [isLoading, setIsLoading] = useState(true);
  const [toast, setToast] = useState('');

  const fetchQueue = async () => {
    setIsLoading(true);
    try { setQueue(await sidekitService.getAdminQueue()); } catch {}
    setIsLoading(false);
  };

  useEffect(() => { fetchQueue(); }, []);

  // Role guard — hooks must come before this
  if (currentUser && currentUser.role !== 'admin') {
    return (
      <div className="max-w-2xl mx-auto py-20 text-center space-y-4 px-4">
        <div className="w-12 h-12 rounded-2xl bg-rose-50 border border-rose-200 text-rose-600 flex items-center justify-center mx-auto">
          <Shield className="w-6 h-6" />
        </div>
        <h2 className="text-xl font-bold text-ink">Admin Access Only</h2>
        <p className="text-sm text-ink-muted max-w-sm mx-auto">
          Switch to the Estate Office persona to access moderation controls.
        </p>
      </div>
    );
  }

  const showToast = (msg: string) => { setToast(msg); setTimeout(() => setToast(''), 3000); };

  const handleModerate = async (id: string, action: 'approve' | 'remove') => {
    try {
      await sidekitService.adminModerateListing(id, action);
      showToast(action === 'approve' ? 'Listing approved and restored.' : 'Listing removed.');
      fetchQueue();
    } catch (err: any) { alert(err.message); }
  };

  const handleReset = async () => {
    if (!window.confirm('Reset all demo data to factory defaults? This cannot be undone.')) return;
    await sidekitService.resetToFactorySeed();
    showToast('Data reset to factory defaults.');
    setTimeout(() => window.location.reload(), 1000);
  };

  const allReported = [...(queue?.reportedListings || []), ...(queue?.hiddenListings || [])];

  return (
    <div className="max-w-4xl mx-auto py-8 px-4 space-y-6">
      {/* Header */}
      <div className="flex items-center justify-between gap-4">
        <div>
          <div className="flex items-center gap-2 text-xs font-semibold text-evergreen mb-1">
            <Shield className="w-3.5 h-3.5" />
            Admin Panel
          </div>
          <h1 className="text-xl font-bold text-ink">Moderation Controls</h1>
          <p className="text-xs text-ink-muted mt-0.5">Palm Grove Estate Administration</p>
        </div>
        <button onClick={handleReset}
          className="flex items-center gap-1.5 px-4 py-2 bg-rose-50 hover:bg-rose-100 text-rose-700 border border-rose-200 rounded-xl text-xs font-semibold transition-colors">
          <RefreshCw className="w-3.5 h-3.5" />
          Reset Demo Data
        </button>
      </div>

      {toast && (
        <div className="flex items-center gap-2 p-3 bg-emerald-50 border border-emerald-200 rounded-xl text-xs text-emerald-800">
          <CheckCircle className="w-4 h-4 text-emerald-600 shrink-0" />
          {toast}
        </div>
      )}

      {/* Stats */}
      <div className="grid grid-cols-3 gap-4">
        <div className="p-4 bg-white rounded-2xl border border-surface-border text-center">
          <div className="text-2xl font-bold text-amber-600">{queue?.reportedListings.length || 0}</div>
          <div className="text-xs text-ink-muted mt-1">Under Review</div>
        </div>
        <div className="p-4 bg-white rounded-2xl border border-surface-border text-center">
          <div className="text-2xl font-bold text-rose-600">{queue?.hiddenListings.length || 0}</div>
          <div className="text-xs text-ink-muted mt-1">Hidden</div>
        </div>
        <div className="p-4 bg-white rounded-2xl border border-surface-border text-center">
          <div className="text-2xl font-bold text-ink">{queue?.totalReportsCount || 0}</div>
          <div className="text-xs text-ink-muted mt-1">Total Reports</div>
        </div>
      </div>

      {/* Queue */}
      <div className="bg-white rounded-2xl border border-surface-border overflow-hidden">
        <div className="flex items-center gap-2 px-5 py-3 border-b border-surface-border bg-surface-secondary/50">
          <Flag className="w-4 h-4 text-amber-600" />
          <h2 className="text-sm font-bold text-ink">Flagged Listings</h2>
          <span className="ml-auto text-xs text-ink-muted">{allReported.length} items</span>
        </div>

        {isLoading ? (
          <div className="py-12 text-center text-sm text-ink-muted">Loading queue...</div>
        ) : allReported.length === 0 ? (
          <div className="py-12 text-center space-y-2">
            <CheckCircle className="w-8 h-8 text-emerald-500 mx-auto" />
            <p className="text-sm text-ink-muted">All clear — no flagged listings.</p>
          </div>
        ) : (
          <div className="divide-y divide-surface-border">
            {allReported.map((l) => (
              <div key={l.id} className="p-5 flex flex-col sm:flex-row sm:items-start justify-between gap-4">
                <div className="flex-1 min-w-0 space-y-1.5">
                  <div className="flex items-center gap-2 flex-wrap">
                    <h3 className="text-sm font-bold text-ink">{l.title}</h3>
                    <span className={`text-[10px] font-bold px-2 py-0.5 rounded border uppercase ${
                      l.moderationStatus === 'hidden_by_admin'
                        ? 'bg-rose-50 text-rose-700 border-rose-200'
                        : 'bg-amber-50 text-amber-700 border-amber-200'
                    }`}>
                      {l.moderationStatus === 'hidden_by_admin' ? 'Hidden' : `${l.reportsCount} Reports`}
                    </span>
                  </div>
                  <p className="text-xs text-ink-muted">{l.ownerDisplayName} · {l.ownerTower} · {l.mode}</p>
                  <p className="text-xs text-ink-subtle line-clamp-1 italic">"{l.description}"</p>
                </div>
                <div className="flex items-center gap-2 shrink-0">
                  <button onClick={() => handleModerate(l.id, 'approve')}
                    className="px-3 py-1.5 text-xs font-semibold bg-emerald-700 hover:bg-emerald-800 text-white rounded-lg transition-colors">
                    Approve
                  </button>
                  <button onClick={() => handleModerate(l.id, 'remove')}
                    className="px-3 py-1.5 text-xs font-semibold bg-rose-600 hover:bg-rose-700 text-white rounded-lg transition-colors">
                    Remove
                  </button>
                </div>
              </div>
            ))}
          </div>
        )}
      </div>

      {/* Policy info */}
      <div className="p-4 bg-surface-secondary rounded-2xl border border-surface-border text-xs text-ink-muted space-y-1">
        <p className="font-semibold text-ink">Auto-moderation policy</p>
        <p>Listings with 3+ reports are automatically hidden pending review. The 70% price demotion rule is applied deterministically by the ranking engine.</p>
      </div>
    </div>
  );
};
