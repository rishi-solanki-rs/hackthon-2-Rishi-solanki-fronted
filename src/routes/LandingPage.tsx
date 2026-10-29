import React, { useState } from 'react';
import { useNavigate, Link } from 'react-router-dom';
import { Search, ArrowRight, Zap, Users, Leaf } from 'lucide-react';

export const LandingPage: React.FC = () => {
  const [task, setTask] = useState('');
  const navigate = useNavigate();

  const onSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    if (!task.trim()) return;
    navigate(`/plan/new?task=${encodeURIComponent(task.trim())}`);
  };

  const quickTasks = [
    'Deep clean balcony & AC unit',
    'Mount shelves on wall',
    'Trim balcony hedge',
    'Laptop slow startup fix',
  ];

  return (
    <div className="max-w-4xl mx-auto px-4 pt-16 pb-24 space-y-20">
      {/* Hero */}
      <div className="text-center space-y-6">
        <div className="inline-flex items-center gap-1.5 text-xs font-semibold text-evergreen bg-evergreen/8 px-3 py-1.5 rounded-full border border-evergreen/20"
          style={{ background: 'rgba(23,107,84,0.06)' }}
        >
          Palm Grove Estate · Community Tools
        </div>

        <h1 className="text-4xl sm:text-5xl font-bold text-ink leading-tight tracking-tight">
          Describe your task.<br />
          <span className="text-evergreen">Borrow what you need.</span>
        </h1>

        <p className="text-ink-muted text-base max-w-xl mx-auto leading-relaxed">
          Sidekit builds your requirements checklist, subtracts what you own, and finds the rest from neighbours — before you buy anything new.
        </p>

        {/* Search form */}
        <form onSubmit={onSubmit} className="max-w-2xl mx-auto">
          <div className="flex gap-2 p-1.5 bg-white border border-surface-border rounded-2xl shadow-sm focus-within:border-evergreen/50 focus-within:shadow-md transition-all">
            <div className="flex items-center gap-2 flex-1 px-3">
              <Search className="w-4 h-4 text-ink-muted shrink-0" />
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
              className="shrink-0 px-5 py-2.5 bg-evergreen hover:bg-evergreen-dark text-white rounded-xl font-semibold text-sm transition-colors flex items-center gap-2"
            >
              Start
              <ArrowRight className="w-4 h-4" />
            </button>
          </div>
        </form>

        {/* Quick chips */}
        <div className="flex flex-wrap justify-center gap-2">
          {quickTasks.map((t) => (
            <button
              key={t}
              onClick={() => navigate(`/plan/new?task=${encodeURIComponent(t)}`)}
              className="text-xs px-3 py-1.5 bg-surface border border-surface-border rounded-lg text-ink-muted hover:text-ink hover:border-evergreen/30 transition-colors"
            >
              {t}
            </button>
          ))}
        </div>
      </div>

      {/* Stats row */}
      <div className="grid grid-cols-3 gap-4 text-center">
        {[
          { value: '₹1.84L', label: 'Community Savings' },
          { value: '142+', label: 'Completed Loans' },
          { value: '30', label: 'Items Listed' },
        ].map(({ value, label }) => (
          <div key={label} className="p-6 bg-surface rounded-2xl border border-surface-border">
            <div className="text-2xl sm:text-3xl font-bold text-ink">{value}</div>
            <div className="text-xs text-ink-muted mt-1 uppercase tracking-wider font-medium">{label}</div>
          </div>
        ))}
      </div>

      {/* How it works */}
      <div className="space-y-6">
        <h2 className="text-lg font-bold text-ink text-center">How it works</h2>
        <div className="grid grid-cols-1 sm:grid-cols-3 gap-4">
          {[
            {
              icon: Zap,
              step: '01',
              title: 'Describe your task',
              desc: 'Plain English or Hinglish. AI builds your complete tool checklist.',
            },
            {
              icon: Search,
              step: '02',
              title: 'Subtract what you have',
              desc: 'Tick off owned items. Only search for what you actually need.',
            },
            {
              icon: Users,
              step: '03',
              title: 'Borrow from neighbours',
              desc: 'Free borrows first, then affordable rentals, then buy used.',
            },
          ].map(({ icon: Icon, step, title, desc }) => (
            <div key={step} className="p-5 bg-surface rounded-2xl border border-surface-border space-y-3">
              <div className="flex items-center gap-2">
                <span className="text-xs font-bold text-ink-muted font-mono">{step}</span>
                <div className="w-8 h-8 rounded-lg bg-evergreen/8 text-evergreen flex items-center justify-center"
                  style={{ background: 'rgba(23,107,84,0.06)' }}>
                  <Icon className="w-4 h-4" />
                </div>
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
            className="px-5 py-2.5 bg-evergreen hover:bg-evergreen-dark text-white rounded-xl font-semibold text-sm transition-colors"
          >
            List an Item
          </Link>
          <Link
            to="/browse"
            className="px-5 py-2.5 bg-surface border border-surface-border hover:bg-surface-secondary text-ink rounded-xl font-semibold text-sm transition-colors"
          >
            Browse Catalog
          </Link>
        </div>
      </div>
    </div>
  );
};
