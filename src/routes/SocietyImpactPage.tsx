import React, { useState, useEffect } from 'react';
import {
  TrendingUp,
  Sparkles,
  TreePine,
  Users,
  Award,
  Layers,
  Wrench,
  Search,
  ArrowRight,
} from 'lucide-react';
import { SocietyImpactStats } from '@sidekit/shared';
import { sidekitService } from '../services';

export const SocietyImpactPage: React.FC = () => {
  const [stats, setStats] = useState<SocietyImpactStats | null>(null);
  const [isLoading, setIsLoading] = useState(true);

  useEffect(() => {
    const fetchStats = async () => {
      try {
        setIsLoading(true);
        const data = await sidekitService.getSocietyImpact();
        setStats(data);
      } catch (err) {
        console.error(err);
      } finally {
        setIsLoading(false);
      }
    };
    fetchStats();
  }, []);

  if (isLoading || !stats) {
    return <div className="py-20 text-center text-xs text-ink-muted">Calculating collective impact...</div>;
  }

  const mostWanted = [
    { rank: 1, name: 'Pressure Washer', requestsCount: 28, category: 'Cleaning' },
    { rank: 2, name: 'Hammer Drill Machine', requestsCount: 24, category: 'DIY & Tools' },
    { rank: 3, name: 'Electric Hedge Trimmer', requestsCount: 16, category: 'Gardening' },
    { rank: 4, name: 'Heavy Step Ladder (6-step)', requestsCount: 14, category: 'DIY' },
    { rank: 5, name: 'Carpet Spot Cleaner', requestsCount: 11, category: 'Cleaning' },
  ];

  return (
    <div className="max-w-5xl mx-auto py-8 px-4 space-y-10">
      {/* Banner */}
      <div className="space-y-2 text-center max-w-2xl mx-auto">
        <div className="inline-flex items-center gap-1.5 text-xs font-semibold text-evergreen bg-evergreen-light px-3 py-1 rounded-full border border-evergreen/20">
          <Sparkles className="w-3.5 h-3.5" />
          <span>Palm Grove Cooperative Impact</span>
        </div>
        <h1 className="text-3xl sm:text-4xl font-extrabold tracking-tight text-ink">
          The Power of Society Sharing
        </h1>
        <p className="text-xs sm:text-sm text-ink-muted leading-relaxed">
          When neighbours share equipment instead of buying separate retail duplicates, the whole community saves money and reduces carbon footprints.
        </p>
      </div>

      {/* Aggregate Metrics (FIX-IMPACT-01) */}
      <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
        <div className="p-6 bg-surface rounded-3xl border border-surface-border text-center space-y-1 shadow-sm">
          <div className="text-3xl sm:text-4xl font-extrabold text-evergreen">
            ₹{stats.totalSavingsInr.toLocaleString('en-IN')}
          </div>
          <div className="text-xs font-semibold text-ink-muted uppercase tracking-wider">
            Total Money Saved
          </div>
        </div>

        <div className="p-6 bg-surface rounded-3xl border border-surface-border text-center space-y-1 shadow-sm">
          <div className="text-3xl sm:text-4xl font-extrabold text-ink">
            {stats.totalItemsShared}
          </div>
          <div className="text-xs font-semibold text-ink-muted uppercase tracking-wider">
            Completed Loans
          </div>
        </div>

        <div className="p-6 bg-surface rounded-3xl border border-surface-border text-center space-y-1 shadow-sm">
          <div className="text-3xl sm:text-4xl font-extrabold text-ink">
            {stats.activeHouseholds}
          </div>
          <div className="text-xs font-semibold text-ink-muted uppercase tracking-wider">
            Active Families
          </div>
        </div>

        <div className="p-6 bg-surface rounded-3xl border border-surface-border text-center space-y-1 shadow-sm">
          <div className="text-3xl sm:text-4xl font-extrabold text-emerald-600">
            {stats.co2AvoidedKg} kg
          </div>
          <div className="text-xs font-semibold text-ink-muted uppercase tracking-wider">
            CO₂ Avoided
          </div>
        </div>
      </div>

      {/* Most Wanted Leaderboard */}
      <div className="bg-surface rounded-3xl border border-surface-border p-6 sm:p-8 shadow-sm space-y-6">
        <div>
          <h2 className="text-lg font-bold text-ink tracking-tight">Most-Wanted Equipment Leaderboard</h2>
          <p className="text-xs text-ink-muted mt-0.5">
            Items neighbours search for most frequently. Own one of these? List it to help your society!
          </p>
        </div>

        <div className="divide-y divide-surface-border">
          {mostWanted.map((item) => (
            <div key={item.rank} className="py-3.5 flex items-center justify-between text-xs">
              <div className="flex items-center gap-3">
                <span className="w-6 h-6 rounded-full bg-evergreen-light text-evergreen-dark font-extrabold flex items-center justify-center text-xs">
                  #{item.rank}
                </span>
                <div>
                  <div className="font-bold text-ink text-sm">{item.name}</div>
                  <span className="text-[11px] text-ink-muted">{item.category}</span>
                </div>
              </div>

              <div className="flex items-center gap-4">
                <span className="text-ink-muted font-medium">
                  <strong>{item.requestsCount}</strong> search requests
                </span>
              </div>
            </div>
          ))}
        </div>
      </div>

      {/* Category distribution */}
      <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
        <div className="p-6 bg-surface rounded-3xl border border-surface-border space-y-4">
          <h3 className="text-sm font-bold text-ink uppercase tracking-wider">Top Shared Categories</h3>
          <div className="space-y-3">
            {stats.topSharedCategories.map((cat, i) => (
              <div key={i} className="space-y-1">
                <div className="flex items-center justify-between text-xs">
                  <span className="font-semibold text-ink">{cat.category}</span>
                  <span className="text-ink-muted">{cat.count} loans</span>
                </div>
                <div className="w-full h-2 rounded-full bg-surface-secondary overflow-hidden">
                  <div
                    className="h-full bg-evergreen rounded-full"
                    style={{ width: `${Math.min(100, (cat.count / 70) * 100)}%` }}
                  />
                </div>
              </div>
            ))}
          </div>
        </div>

        <div className="p-6 bg-surface rounded-3xl border border-surface-border space-y-4 flex flex-col justify-between">
          <div className="space-y-2">
            <h3 className="text-sm font-bold text-ink uppercase tracking-wider">Environmental Benefit</h3>
            <p className="text-xs text-ink-muted leading-relaxed">
              Every power tool manufactured requires steel, lithium, and long-distance shipping. By sharing 142 tools locally, Palm Grove Estate has prevented approximately <strong>{stats.co2AvoidedKg} kg</strong> of embodied industrial emissions.
            </p>
          </div>

          <div className="p-4 bg-emerald-50 rounded-2xl border border-emerald-200 text-xs text-emerald-950 flex items-center gap-3">
            <TreePine className="w-8 h-8 text-emerald-600 shrink-0" />
            <span>Equivalent to planting <strong>56 urban trees</strong> in Bangalore this year!</span>
          </div>
        </div>
      </div>
    </div>
  );
};

