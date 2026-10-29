import React, { useState, useEffect } from 'react';
import { FeatureIcon, FeatureIconName } from '../components/brand/sidekit-icons';
import { BrandLoader } from '../components/brand/BrandStates';
import { SocietyImpactStats, User } from '@sidekit/shared';
import { sidekitService } from '../services';
import { SampleBadge } from '../components/shared/SampleBadge';

export const SocietyImpactPage: React.FC = () => {
  const [stats, setStats] = useState<SocietyImpactStats | null>(null);
  const [topSharers, setTopSharers] = useState<User[]>([]);
  const [isLoading, setIsLoading] = useState(true);

  useEffect(() => {
    Promise.all([
      sidekitService.getSocietyImpact(),
      sidekitService.getAllUsers(),
    ]).then(([s, users]) => {
      setStats(s);
      // Sort by itemsSharedCount descending for leaderboard
      setTopSharers([...users].sort((a, b) => (b.itemsSharedCount || 0) - (a.itemsSharedCount || 0)).slice(0, 5));
      setIsLoading(false);
    }).catch(() => setIsLoading(false));
  }, []);

  if (isLoading) return <BrandLoader label="Loading impact data…" />;

  return (
    <div className="max-w-4xl mx-auto py-10 px-4 space-y-10">
      {/* Header */}
      <div className="space-y-2">
        <h1 className="text-2xl font-bold text-ink">Society Impact</h1>
        <p className="text-sm text-ink-muted">How Palm Grove residents share and save together.</p>
        {stats?.includesSampleData && (
          <p className="flex items-center gap-2 text-xs text-ink-muted">
            <SampleBadge /> Totals include seeded demo figures plus live activity.
          </p>
        )}
      </div>

      {/* Metrics */}
      {stats && (
        <div className="grid grid-cols-2 sm:grid-cols-4 gap-4">
          {[
            { icon: 'buy-used' as FeatureIconName, label: 'Money Saved', value: `₹${stats.totalSavingsInr.toLocaleString('en-IN')}`, color: 'text-evergreen' },
            { icon: 'returned' as FeatureIconName, label: 'Completed Loans', value: String(stats.totalItemsShared), color: 'text-ink' },
            { icon: 'neighbours' as FeatureIconName, label: 'Active Families', value: String(stats.activeHouseholds), color: 'text-ink' },
            { icon: 'borrow' as FeatureIconName, label: 'CO₂ Avoided', value: `${stats.co2AvoidedKg}kg`, color: 'text-emerald-600' },
          ].map(({ icon, label, value, color }) => (
            <div key={label} className="p-5 bg-surface rounded-2xl border border-surface-border text-center space-y-2">
              <FeatureIcon name={icon} size={28} className="mx-auto" />
              <div className={`text-2xl font-bold ${color}`}>{value}</div>
              <div className="text-xs text-ink-muted uppercase tracking-wider font-medium">{label}</div>
            </div>
          ))}
        </div>
      )}

      <div className="grid grid-cols-1 sm:grid-cols-2 gap-6">
        {/* Top sharers leaderboard */}
        <div className="bg-surface rounded-2xl border border-surface-border p-5 space-y-4">
          <h2 className="text-sm font-bold text-ink">Top Community Sharers</h2>
          <div className="divide-y divide-surface-border">
            {topSharers.map((user, i) => (
              <div key={user.id} className="py-3 flex items-center gap-3">
                <span className={`w-6 h-6 rounded-full flex items-center justify-center text-xs font-bold shrink-0 ${
                  i === 0 ? 'bg-amber-100 text-amber-700' : 'bg-surface-secondary text-ink-muted'
                }`}>
                  {i + 1}
                </span>
                <div className="w-8 h-8 rounded-xl bg-evergreen/10 text-evergreen font-bold text-sm flex items-center justify-center shrink-0">
                  {user.name.charAt(0)}
                </div>
                <div className="flex-1 min-w-0">
                  <div className="text-xs font-semibold text-ink truncate">{user.displayName}</div>
                  <div className="text-[11px] text-ink-muted">{user.tower}</div>
                </div>
                <div className="text-xs font-bold text-evergreen">{user.itemsSharedCount} shared</div>
              </div>
            ))}
          </div>
        </div>

        {/* Most wanted */}
        <div className="bg-surface rounded-2xl border border-surface-border p-5 space-y-4">
          <h2 className="text-sm font-bold text-ink">Most-Wanted Items</h2>
          <div className="divide-y divide-surface-border">
            {(stats?.mostWanted || []).map((item, i) => (
              <div key={item.itemKey} className="py-3 flex items-center gap-3">
                <span className="w-6 h-6 rounded-full bg-evergreen/8 text-evergreen text-xs font-bold flex items-center justify-center shrink-0"
                  style={{ background: 'rgba(23,107,84,0.06)' }}>
                  {i + 1}
                </span>
                <div className="flex-1 min-w-0 flex items-center gap-2">
                  <span className="text-xs font-semibold text-ink truncate">{item.itemName}</span>
                  {item.isSample && <SampleBadge />}
                </div>
                <div className="text-xs text-ink-muted font-medium">{item.count} interested</div>
              </div>
            ))}
          </div>
        </div>
      </div>

      {/* Category bar chart */}
      {stats && (
        <div className="bg-surface rounded-2xl border border-surface-border p-5 space-y-4">
          <h2 className="text-sm font-bold text-ink">Top Shared Categories</h2>
          <div className="space-y-3">
            {stats.topSharedCategories.map((cat) => (
              <div key={cat.category} className="space-y-1">
                <div className="flex justify-between text-xs">
                  <span className="font-medium text-ink">{cat.category}</span>
                  <span className="text-ink-muted">{cat.count} loans</span>
                </div>
                <div className="h-1.5 w-full bg-surface-secondary rounded-full overflow-hidden">
                  <div className="h-full bg-brand rounded-full transition-all"
                    style={{ width: `${Math.min(100, (cat.count / 70) * 100)}%` }} />
                </div>
              </div>
            ))}
          </div>
        </div>
      )}
    </div>
  );
};
