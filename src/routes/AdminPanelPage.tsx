import React, { useState, useEffect } from 'react';
import {
  Shield,
  AlertTriangle,
  CheckCircle,
  XCircle,
  RefreshCw,
  Eye,
  Sliders,
  Flag,
} from 'lucide-react';
import { AdminQueueData, Listing } from '@sidekit/shared';
import { sidekitService } from '../services';
import { SampleBadge } from '../components/shared/SampleBadge';
import { useAuth } from '../context/AuthContext';

export const AdminPanelPage: React.FC = () => {
  const { currentUser } = useAuth();
  const [queue, setQueue] = useState<AdminQueueData | null>(null);
  const [isLoading, setIsLoading] = useState(true);
  const [thresholdRatio, setThresholdRatio] = useState(70);
  const [actionNotice, setActionNotice] = useState<string | null>(null);

  const fetchQueue = async () => {
    try {
      setIsLoading(true);
      const data = await sidekitService.getAdminQueue();
      setQueue(data);
    } catch (err) {
      console.error(err);
    } finally {
      setIsLoading(false);
    }
  };

  useEffect(() => {
    fetchQueue();
  }, []);

  const handleModerate = async (listingId: string, action: 'approve' | 'remove') => {
    try {
      await sidekitService.adminModerateListing(listingId, action);
      setActionNotice(action === 'approve' ? 'Listing approved and restored to catalog.' : 'Listing removed and permanently closed.');
      setTimeout(() => setActionNotice(null), 3000);
      fetchQueue();
    } catch (err: any) {
      alert(err.message || 'Failed to moderate listing.');
    }
  };

  const handleResetData = async () => {
    if (window.confirm('Reset all demo state back to pristine factory fixtures? All test loans and custom listings will be restored.')) {
      await sidekitService.resetToFactorySeed();
      window.location.reload();
    }
  };

  return (
    <div className="max-w-5xl mx-auto py-8 px-4 space-y-8">
      {/* Header */}
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4 pb-4 border-b border-surface-border">
        <div>
          <div className="inline-flex items-center gap-1.5 text-xs font-semibold text-evergreen bg-evergreen-light px-2.5 py-1 rounded-lg mb-1">
            <Shield className="w-3.5 h-3.5" />
            <span>Palm Grove Estate Administration Block</span>
          </div>
          <h1 className="text-2xl sm:text-3xl font-bold tracking-tight text-ink">
            Moderation & System Controls
          </h1>
          <p className="text-xs text-ink-muted mt-1">
            Review community reported tools, manage listing approvals, and configure society policies.
          </p>
        </div>

        <button
          type="button"
          onClick={handleResetData}
          className="py-2.5 px-4 bg-rose-50 hover:bg-rose-100 text-rose-700 text-xs font-semibold rounded-xl border border-rose-200 transition-colors flex items-center gap-2 self-start sm:self-auto shadow-sm"
        >
          <RefreshCw className="w-4 h-4" />
          <span>Reset Sample Data (FIX-ADMIN-02)</span>
        </button>
      </div>

      {actionNotice && (
        <div className="p-4 bg-emerald-50 border border-emerald-200 rounded-2xl flex items-center gap-2 text-xs text-emerald-800 animate-in fade-in duration-150">
          <CheckCircle className="w-4 h-4 text-emerald-600 shrink-0" />
          <span>{actionNotice}</span>
        </div>
      )}

      {/* System Tuning Settings (FIX-ADMIN-02) */}
      <div className="p-6 bg-surface rounded-3xl border border-surface-border shadow-sm space-y-4">
        <h3 className="text-sm font-bold text-ink uppercase tracking-wider flex items-center gap-2">
          <Sliders className="w-4 h-4 text-evergreen" />
          <span>Platform Policy Configuration</span>
        </h3>

        <div className="grid grid-cols-1 sm:grid-cols-2 gap-6 text-xs">
          <div className="space-y-1.5">
            <label className="font-bold text-ink block">
              Second-Hand Price Demotion Ratio: <strong>{thresholdRatio}%</strong>
            </label>
            <p className="text-ink-muted text-[11px] leading-relaxed">
              Pre-owned listings priced above this ratio of brand-new retail price are automatically flagged and demoted below new shop options in comparison rankings.
            </p>
            <input
              type="range"
              min="50"
              max="90"
              value={thresholdRatio}
              onChange={(e) => setThresholdRatio(parseInt(e.target.value))}
              className="w-full accent-evergreen"
            />
          </div>

          <div className="space-y-1.5">
            <label className="font-bold text-ink block">
              Automated Review Flag Threshold: <strong>3 Distinct User Reports</strong>
            </label>
            <p className="text-ink-muted text-[11px] leading-relaxed">
              Listings receiving 3 or more community complaints transition to <code>hidden_by_admin</code> and are hidden from search until reviewed.
            </p>
            <div className="p-2 bg-surface-secondary rounded-xl font-mono text-[11px] text-ink-muted">
              Auto-quarantine: ENABLED
            </div>
          </div>
        </div>
      </div>

      {/* Reported Listings Queue (FIX-ADMIN-01) */}
      <div className="bg-surface rounded-3xl border border-surface-border p-6 shadow-sm space-y-4">
        <div className="flex items-center justify-between border-b border-surface-border pb-3">
          <div className="flex items-center gap-2">
            <Flag className="w-5 h-5 text-amber-600" />
            <h2 className="text-base font-bold text-ink">Reported & Under-Review Listings</h2>
          </div>
          <span className="text-xs font-semibold px-2.5 py-0.5 rounded-full bg-amber-50 text-amber-800 border border-amber-200">
            {queue?.reportedListings.length || 0} Flagged
          </span>
        </div>

        {isLoading ? (
          <div className="py-12 text-center text-xs text-ink-muted">Loading reports queue...</div>
        ) : !queue || queue.reportedListings.length === 0 ? (
          <div className="py-12 text-center text-xs text-ink-muted">
            Zero flagged listings in review queue. The community catalog is clear!
          </div>
        ) : (
          <div className="divide-y divide-surface-border">
            {queue.reportedListings.map((l) => (
              <div key={l.id} className="py-4 flex flex-col sm:flex-row sm:items-center justify-between gap-4">
                <div className="space-y-1 flex-1">
                  <div className="flex items-center gap-2 flex-wrap">
                    <span className="text-sm font-bold text-ink">{l.title}</span>
                    <SampleBadge />
                    <span className="text-[10px] font-bold px-2 py-0.5 rounded bg-amber-100 text-amber-800 uppercase">
                      {l.reportsCount} Reports
                    </span>
                  </div>
                  <div className="text-xs text-ink-muted">
                    Owner: <strong>{l.ownerDisplayName}</strong> ({l.ownerTower}) · Mode: {l.mode} · Price: {l.price ? `₹${l.price}` : '₹0'}
                  </div>
                  <p className="text-xs text-ink-muted italic">"{l.description}"</p>
                </div>

                <div className="flex items-center gap-2 shrink-0">
                  <button
                    type="button"
                    onClick={() => handleModerate(l.id, 'approve')}
                    className="px-3.5 py-1.5 bg-emerald-700 hover:bg-emerald-800 text-white rounded-xl text-xs font-semibold shadow-sm"
                  >
                    Approve & Clear Reports
                  </button>
                  <button
                    type="button"
                    onClick={() => handleModerate(l.id, 'remove')}
                    className="px-3.5 py-1.5 bg-rose-600 hover:bg-rose-700 text-white rounded-xl text-xs font-semibold shadow-sm"
                  >
                    Remove Listing
                  </button>
                </div>
              </div>
            ))}
          </div>
        )}
      </div>

      {/* Hidden Listings Queue */}
      {queue && queue.hiddenListings.length > 0 && (
        <div className="bg-surface rounded-3xl border border-surface-border p-6 shadow-sm space-y-4">
          <div className="flex items-center justify-between border-b border-surface-border pb-3">
            <div className="flex items-center gap-2">
              <XCircle className="w-5 h-5 text-rose-600" />
              <h2 className="text-base font-bold text-ink">Quarantined / Hidden Listings</h2>
            </div>
            <span className="text-xs font-semibold px-2.5 py-0.5 rounded-full bg-rose-50 text-rose-800 border border-rose-200">
              {queue.hiddenListings.length} Hidden
            </span>
          </div>

          <div className="divide-y divide-surface-border">
            {queue.hiddenListings.map((l) => (
              <div key={l.id} className="py-4 flex flex-col sm:flex-row sm:items-center justify-between gap-4">
                <div>
                  <h4 className="text-sm font-bold text-ink">{l.title}</h4>
                  <div className="text-xs text-ink-muted">
                    Quarantined due to exceeding 3 community reports. Hidden from all resident search queries.
                  </div>
                </div>

                <div className="flex items-center gap-2">
                  <button
                    type="button"
                    onClick={() => handleModerate(l.id, 'approve')}
                    className="px-3.5 py-1.5 bg-surface-secondary hover:bg-surface-border text-ink rounded-xl text-xs font-semibold border border-surface-border"
                  >
                    Reinstate to Active
                  </button>
                </div>
              </div>
            ))}
          </div>
        </div>
      )}
    </div>
  );
};

