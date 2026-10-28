import React, { useState } from 'react';
import { useNavigate, Link } from 'react-router-dom';
import {
  Sparkles,
  ArrowRight,
  ShieldCheck,
  RotateCcw,
  Zap,
  CheckCircle2,
  Users,
  Search,
  Wrench,
  TreePine,
  Sparkle,
  Laptop,
} from 'lucide-react';
import { SampleBadge } from '../components/shared/SampleBadge';
import { useAuth } from '../context/AuthContext';

export const LandingPage: React.FC = () => {
  const [taskInput, setTaskInput] = useState('');
  const navigate = useNavigate();
  const { currentUser } = useAuth();

  const handleStartTask = (e: React.FormEvent) => {
    e.preventDefault();
    if (!taskInput.trim()) return;
    navigate(`/plan/new?task=${encodeURIComponent(taskInput.trim())}`);
  };

  const sampleTasks = [
    { text: 'Balcony deep clean and AC outdoor unit wash', tag: 'Cleaning' },
    { text: 'Mount heavy bookshelf & frame on living room wall', tag: 'DIY & Tools' },
    { text: 'Prune balcony hedge bushes and repot garden plants', tag: 'Gardening' },
    { text: 'Laptop running hot and lagging on startup', tag: 'Electronics' },
  ];

  return (
    <div className="space-y-16 py-8 sm:py-12">
      {/* Hero Section */}
      <section className="max-w-4xl mx-auto text-center px-4 space-y-6">
        <div className="inline-flex items-center gap-2 px-3.5 py-1.5 rounded-full bg-evergreen-light text-evergreen-dark text-xs font-semibold border border-evergreen/20">
          <Sparkles className="w-3.5 h-3.5 text-evergreen" />
          <span>Palm Grove Estate · 400+ Families Sharing Assets</span>
        </div>

        <h1 className="text-4xl sm:text-5xl lg:text-6xl font-bold tracking-tight text-ink leading-[1.15]">
          Start from what you need done. <br className="hidden sm:inline" />
          <span className="text-evergreen">We'll find the tools in your society.</span>
        </h1>

        <p className="text-base sm:text-lg text-ink-muted max-w-2xl mx-auto leading-relaxed">
          Sidekit turns any household project into a step-by-step checklist, subtracts what you already own, and matches the rest with trusted neighbours — before you buy brand new.
        </p>

        {/* Task Input Card */}
        <form onSubmit={handleStartTask} className="max-w-2xl mx-auto mt-8">
          <div className="p-2 sm:p-2.5 bg-surface rounded-2xl shadow-lg border border-surface-border flex flex-col sm:flex-row gap-2">
            <div className="flex-1 flex items-center gap-3 px-3">
              <Search className="w-5 h-5 text-ink-muted shrink-0" />
              <input
                type="text"
                value={taskInput}
                onChange={(e) => setTaskInput(e.target.value)}
                placeholder="What do you want to get done? (e.g. Clean balcony, mount TV)"
                className="w-full text-sm sm:text-base bg-transparent border-none outline-none text-ink placeholder:text-ink-subtle focus:ring-0"
              />
            </div>
            <button
              type="submit"
              className="py-3 px-6 bg-evergreen hover:bg-evergreen-dark text-white rounded-xl font-semibold text-sm transition-colors flex items-center justify-center gap-2 shadow-sm shrink-0"
            >
              <span>Build Checklist</span>
              <ArrowRight className="w-4 h-4" />
            </button>
          </div>
        </form>

        {/* Quick Suggestion Chips */}
        <div className="flex flex-wrap items-center justify-center gap-2 pt-2">
          <span className="text-xs text-ink-muted">Popular tasks:</span>
          {sampleTasks.map((t, idx) => (
            <button
              key={idx}
              onClick={() => navigate(`/plan/new?task=${encodeURIComponent(t.text)}`)}
              className="text-xs px-3 py-1.5 bg-surface hover:bg-surface-secondary text-ink rounded-lg border border-surface-border transition-colors flex items-center gap-1.5"
            >
              <span>{t.text}</span>
            </button>
          ))}
        </div>
      </section>

      {/* How it works 3-Step Pillar */}
      <section className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
        <div className="text-center max-w-xl mx-auto mb-10 space-y-2">
          <h2 className="text-2xl font-bold text-ink tracking-tight">The Asset-Sharing Loop</h2>
          <p className="text-sm text-ink-muted">
            Designed specifically for apartment towers: fast pickup, zero delivery fees, total trust.
          </p>
        </div>

        <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
          <div className="p-6 bg-surface rounded-2xl border border-surface-border shadow-sm space-y-3">
            <div className="w-10 h-10 rounded-xl bg-evergreen-light text-evergreen flex items-center justify-center font-bold">
              1
            </div>
            <h3 className="text-base font-bold text-ink">1. Intent to Checklist</h3>
            <p className="text-xs text-ink-muted leading-relaxed">
              Describe your task in everyday words. Sidekit generates the complete tool and consumable requirements automatically.
            </p>
          </div>

          <div className="p-6 bg-surface rounded-2xl border border-surface-border shadow-sm space-y-3">
            <div className="w-10 h-10 rounded-xl bg-evergreen-light text-evergreen flex items-center justify-center font-bold">
              2
            </div>
            <h3 className="text-base font-bold text-ink">2. Subtract What You Have</h3>
            <p className="text-xs text-ink-muted leading-relaxed">
              Tick off items sitting in your utility cabinet. You only search and coordinate for the items you actually lack.
            </p>
          </div>

          <div className="p-6 bg-surface rounded-2xl border border-surface-border shadow-sm space-y-3">
            <div className="w-10 h-10 rounded-xl bg-evergreen-light text-evergreen flex items-center justify-center font-bold">
              3
            </div>
            <h3 className="text-base font-bold text-ink">3. Transparent Comparison</h3>
            <p className="text-xs text-ink-muted leading-relaxed">
              Compare free neighbourhood borrow, modest daily rentals, pre-owned purchases, and local retail stores in one clean matrix.
            </p>
          </div>
        </div>
      </section>

      {/* Society Stats Counter */}
      <section className="bg-surface border-y border-surface-border py-12">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
          <div className="grid grid-cols-2 md:grid-cols-4 gap-6 text-center">
            <div>
              <div className="text-3xl sm:text-4xl font-extrabold text-evergreen">₹1,84,500</div>
              <div className="text-xs font-semibold text-ink-muted mt-1 uppercase tracking-wider">
                Community Savings
              </div>
            </div>
            <div>
              <div className="text-3xl sm:text-4xl font-extrabold text-ink">142+</div>
              <div className="text-xs font-semibold text-ink-muted mt-1 uppercase tracking-wider">
                Completed Loans
              </div>
            </div>
            <div>
              <div className="text-3xl sm:text-4xl font-extrabold text-ink">86</div>
              <div className="text-xs font-semibold text-ink-muted mt-1 uppercase tracking-wider">
                Active Towers & Flats
              </div>
            </div>
            <div>
              <div className="text-3xl sm:text-4xl font-extrabold text-lime-600">1,240 kg</div>
              <div className="text-xs font-semibold text-ink-muted mt-1 uppercase tracking-wider">
                CO₂ Emissions Avoided
              </div>
            </div>
          </div>
        </div>
      </section>

      {/* Call to action */}
      <section className="max-w-4xl mx-auto px-4 text-center space-y-4">
        <h2 className="text-2xl font-bold text-ink">Got tools or equipment sitting idle?</h2>
        <p className="text-sm text-ink-muted max-w-lg mx-auto">
          Help a neighbour and earn goodwill or a modest rental. Listing takes under 60 seconds with pre-populated specs.
        </p>
        <div className="pt-2 flex justify-center gap-3">
          <Link
            to="/my/listings/new"
            className="py-2.5 px-6 bg-evergreen hover:bg-evergreen-dark text-white rounded-xl font-semibold text-sm transition-colors shadow-sm"
          >
            List an Item
          </Link>
          <Link
            to="/browse"
            className="py-2.5 px-6 bg-surface hover:bg-surface-secondary text-ink rounded-xl font-semibold text-sm border border-surface-border transition-colors"
          >
            Explore Catalog
          </Link>
        </div>
      </section>
    </div>
  );
};

