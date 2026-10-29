import React, { useEffect, useState } from 'react';
import { useNavigate, Link } from 'react-router-dom';
import { Search, ArrowRight } from 'lucide-react';
import { SocietyImpactStats } from '@sidekit/shared';
import { sidekitService } from '../services';
import { FeatureIcon, FeatureIconName } from '../components/brand/sidekit-icons';
import { Illustration } from '../components/brand/sidekit-art';
import { SampleBadge } from '../components/shared/SampleBadge';

const QUICK_TASKS = [
  'Deep clean balcony & AC unit',
  'Mount shelves on wall',
  'Trim balcony hedge',
  'Laptop slow startup fix',
];

const STEPS: Array<{ icon: FeatureIconName; step: string; title: string; desc: string }> = [
  { icon: 'sparkle', step: '01', title: 'Describe your task', desc: 'Plain English or Hinglish. AI suggests the checklist; safety rules are checked by code.' },
  { icon: 'owned', step: '02', title: 'Subtract what you have', desc: 'Tick off owned items. Only the missing ones are searched.' },
  { icon: 'borrow', step: '03', title: 'Borrow from neighbours', desc: 'Free borrows first, then rentals, then second-hand, then local shops.' },
];

const METHODS: Array<{ icon: FeatureIconName; label: string; cls: string }> = [
  { icon: 'borrow', label: 'Borrow', cls: 'bg-emerald-50 text-emerald-700 border-emerald-200' },
  { icon: 'rent', label: 'Rent', cls: 'bg-blue-50 text-blue-700 border-blue-200' },
  { icon: 'buy-used', label: 'Buy used', cls: 'bg-purple-50 text-purple-700 border-purple-200' },
  { icon: 'repair', label: 'Repair', cls: 'bg-amber-50 text-amber-700 border-amber-200' },
];

export const LandingPage: React.FC = () => {
  const [task, setTask] = useState('');
  const [impact, setImpact] = useState<SocietyImpactStats | null>(null);
  const [listingCount, setListingCount] = useState<number | null>(null);
  const navigate = useNavigate();

  useEffect(() => {
    sidekitService.getSocietyImpact().then(setImpact).catch(() => {});
    sidekitService.searchListings({ onlyAvailable: true }).then((l) => setListingCount(l.length)).catch(() => {});
  }, []);

  const onSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    if (!task.trim()) return;
    navigate(`/plan/new?task=${encodeURIComponent(task.trim())}`);
  };

  const stats = [
    { value: impact ? `₹${impact.totalSavingsInr.toLocaleString('en-IN')}` : '—', label: 'Community savings' },
    { value: impact ? String(impact.totalItemsShared) : '—', label: 'Completed loans' },
    { value: listingCount !== null ? String(listingCount) : '—', label: 'Items available' },
  ];

  return (
    <div className="relative overflow-hidden">
      <div
        className="absolute inset-x-0 top-0 h-[560px] pointer-events-none bg-no-repeat bg-cover bg-center opacity-70 dark:opacity-15"
        style={{ backgroundImage: 'url(/brand/patterns/hero-bg.svg)' }}
        aria-hidden="true"
      />

      <div className="relative max-w-5xl mx-auto px-4 pt-12 sm:pt-16 pb-24 space-y-20">
        {/* Hero */}
        <div className="grid grid-cols-1 lg:grid-cols-[1.1fr_0.9fr] gap-10 items-center">
          <div className="space-y-6 text-center lg:text-left">
            <div className="inline-flex items-center gap-1.5 text-xs font-semibold text-evergreen bg-evergreen-light px-3 py-1.5 rounded-full border border-evergreen/20">
              Palm Grove Estate · Community sharing
            </div>

            <h1 className="text-4xl sm:text-5xl font-bold text-ink leading-tight tracking-tight">
              Start with the task.<br />
              <span className="text-evergreen">Not the shopping cart.</span>
            </h1>

            <p className="text-ink-muted text-base max-w-xl mx-auto lg:mx-0 leading-relaxed">
              Sidekit builds your checklist, subtracts what you already own, and finds the rest from neighbours — before you buy anything new.
            </p>

            <div className="flex flex-wrap justify-center lg:justify-start gap-2">
              {METHODS.map((m) => (
                <span key={m.label} className={`inline-flex items-center gap-1.5 px-2.5 py-1 rounded-full border text-xs font-semibold ${m.cls}`}>
                  <FeatureIcon name={m.icon} size={16} duotone={false} color="currentColor" />
                  {m.label}
                </span>
              ))}
            </div>

            <form onSubmit={onSubmit} className="max-w-2xl mx-auto lg:mx-0">
              <div className="flex gap-2 p-1.5 bg-surface border border-surface-border rounded-2xl shadow-sm focus-within:border-evergreen/50 focus-within:shadow-md transition-all">
                <div className="flex items-center gap-2 flex-1 px-3">
                  <Search className="w-4 h-4 text-ink-muted shrink-0" aria-hidden="true" />
                  <input
                    type="text"
                    value={task}
                    onChange={(e) => setTask(e.target.value)}
                    placeholder="e.g. Clean balcony, mount TV, fix laptop..."
                    className="w-full text-sm bg-transparent border-none outline-none text-ink placeholder:text-ink-subtle"
                    aria-label="Describe your task"
                  />
                </div>
                <button
                  type="submit"
                  className="shrink-0 px-5 py-2.5 bg-brand hover:bg-brand-dark text-white rounded-xl font-semibold text-sm transition-colors flex items-center gap-2 focus-ring"
                >
                  Start
                  <ArrowRight className="w-4 h-4" aria-hidden="true" />
                </button>
              </div>
            </form>

            <div className="flex flex-wrap justify-center lg:justify-start gap-2">
              {QUICK_TASKS.map((t) => (
                <button
                  key={t}
                  onClick={() => navigate(`/plan/new?task=${encodeURIComponent(t)}`)}
                  className="text-xs px-3 py-1.5 bg-surface border border-surface-border rounded-lg text-ink-muted hover:text-ink hover:border-evergreen/30 transition-colors focus-ring"
                >
                  {t}
                </button>
              ))}
            </div>
          </div>

          <div className="hidden lg:flex justify-center">
            <Illustration name="hero-flow" width={420} className="brand-art max-w-full h-auto" />
          </div>
        </div>

        {/* Stats row */}
        <div className="space-y-2">
          <div className="grid grid-cols-3 gap-3 sm:gap-4 text-center">
            {stats.map(({ value, label }) => (
              <div key={label} className="p-4 sm:p-6 bg-surface rounded-2xl border border-surface-border">
                <div className="text-base sm:text-3xl font-bold text-ink tabular-nums">{value}</div>
                <div className="text-[11px] sm:text-xs text-ink-muted mt-1 uppercase tracking-wider font-medium">{label}</div>
              </div>
            ))}
          </div>
          {impact?.includesSampleData && (
            <p className="flex items-center justify-center gap-2 text-xs text-ink-muted">
              <SampleBadge /> Totals include seeded demo figures.
            </p>
          )}
        </div>

        {/* How it works */}
        <div className="space-y-6">
          <h2 className="text-lg font-bold text-ink text-center">How it works</h2>
          <div className="grid grid-cols-1 sm:grid-cols-3 gap-4">
            {STEPS.map(({ icon, step, title, desc }) => (
              <div key={step} className="p-5 bg-surface rounded-2xl border border-surface-border space-y-3">
                <div className="flex items-center gap-3">
                  <FeatureIcon name={icon} size={36} />
                  <span className="text-xs font-bold text-ink-subtle font-mono">{step}</span>
                </div>
                <h3 className="text-sm font-bold text-ink">{title}</h3>
                <p className="text-xs text-ink-muted leading-relaxed">{desc}</p>
              </div>
            ))}
          </div>
        </div>

        {/* CTAs */}
        <div className="text-center space-y-3">
          <p className="text-sm text-ink-muted">Have tools sitting idle?</p>
          <div className="flex justify-center gap-3">
            <Link
              to="/my/listings/new"
              className="px-5 py-2.5 bg-brand hover:bg-brand-dark text-white rounded-xl font-semibold text-sm transition-colors focus-ring"
            >
              List an Item
            </Link>
            <Link
              to="/browse"
              className="px-5 py-2.5 bg-surface border border-surface-border hover:bg-surface-secondary text-ink rounded-xl font-semibold text-sm transition-colors focus-ring"
            >
              Browse Catalog
            </Link>
          </div>
        </div>
      </div>
    </div>
  );
};
