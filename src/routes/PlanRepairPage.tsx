import React, { useState } from 'react';
import { useParams, Link } from 'react-router-dom';
import {
  Laptop,
  AlertTriangle,
  CheckCircle2,
  HelpCircle,
  ArrowRight,
  TrendingDown,
  Wrench,
  ShieldCheck,
  RefreshCw,
} from 'lucide-react';
import { RepairEvaluationResult } from '@sidekit/shared';
import { sidekitService } from '../services';

export const PlanRepairPage: React.FC = () => {
  const { id } = useParams<{ id: string }>();

  const [brand, setBrand] = useState('Dell');
  const [model, setModel] = useState('Inspiron 15 5000');
  const [originalPrice, setOriginalPrice] = useState(55000);
  const [ageYears, setAgeYears] = useState(4);
  const [issue, setIssue] = useState('Screen flickering with horizontal lines, battery drops from 100% to 10% in 30 mins');
  const [batteryHealth, setBatteryHealth] = useState(45);

  const [result, setResult] = useState<RepairEvaluationResult | null>(null);
  const [isEvaluating, setIsEvaluating] = useState(false);

  const handleEvaluate = async (e: React.FormEvent) => {
    e.preventDefault();
    try {
      setIsEvaluating(true);
      const res = await sidekitService.evaluateRepair({
        brand,
        model,
        originalPrice,
        ageYears,
        issue,
        batteryHealthPercent: batteryHealth,
      });
      setResult(res);
    } catch (err) {
      console.error(err);
    } finally {
      setIsEvaluating(false);
    }
  };

  return (
    <div className="max-w-3xl mx-auto py-8 px-4 space-y-8">
      {/* Header */}
      <div className="space-y-2">
        <div className="inline-flex items-center gap-1.5 text-xs font-semibold text-evergreen bg-evergreen-light px-2.5 py-1 rounded-lg">
          <Laptop className="w-3.5 h-3.5" />
          <span>Laptop Repair vs. Replacement Advisor</span>
        </div>
        <h1 className="text-3xl font-bold tracking-tight text-ink">
          Repair or Replace Your Laptop?
        </h1>
        <p className="text-xs sm:text-sm text-ink-muted leading-relaxed">
          The 50% Rule: If the estimated repair cost exceeds 50% of the machine's current residual value, purchasing a reliable pre-owned or new machine is more cost-effective.
        </p>
      </div>

      {/* Input Form */}
      <form onSubmit={handleEvaluate} className="p-6 bg-surface rounded-3xl border border-surface-border shadow-sm space-y-6">
        <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
          <div>
            <label className="block text-xs font-bold text-ink uppercase tracking-wider mb-1">
              Laptop Brand
            </label>
            <input
              type="text"
              value={brand}
              onChange={(e) => setBrand(e.target.value)}
              className="w-full px-3 py-2 text-xs sm:text-sm bg-surface-secondary border border-surface-border rounded-xl focus-ring"
              required
            />
          </div>

          <div>
            <label className="block text-xs font-bold text-ink uppercase tracking-wider mb-1">
              Model
            </label>
            <input
              type="text"
              value={model}
              onChange={(e) => setModel(e.target.value)}
              className="w-full px-3 py-2 text-xs sm:text-sm bg-surface-secondary border border-surface-border rounded-xl focus-ring"
              required
            />
          </div>

          <div>
            <label className="block text-xs font-bold text-ink uppercase tracking-wider mb-1">
              Original Purchase Price (₹)
            </label>
            <input
              type="number"
              min="5000"
              value={originalPrice}
              onChange={(e) => setOriginalPrice(parseInt(e.target.value) || 0)}
              className="w-full px-3 py-2 text-xs sm:text-sm bg-surface-secondary border border-surface-border rounded-xl focus-ring font-mono"
              required
            />
          </div>

          <div>
            <label className="block text-xs font-bold text-ink uppercase tracking-wider mb-1">
              Laptop Age (Years)
            </label>
            <input
              type="number"
              min="0"
              max="15"
              value={ageYears}
              onChange={(e) => setAgeYears(parseInt(e.target.value) || 0)}
              className="w-full px-3 py-2 text-xs sm:text-sm bg-surface-secondary border border-surface-border rounded-xl focus-ring font-mono"
              required
            />
          </div>
        </div>

        <div>
          <label className="block text-xs font-bold text-ink uppercase tracking-wider mb-1">
            Battery Health (Optional %)
          </label>
          <div className="flex items-center gap-3">
            <input
              type="range"
              min="20"
              max="100"
              value={batteryHealth}
              onChange={(e) => setBatteryHealth(parseInt(e.target.value))}
              className="w-full accent-evergreen"
            />
            <span className="text-xs font-bold text-ink w-12 font-mono">{batteryHealth}%</span>
          </div>
        </div>

        <div>
          <label className="block text-xs font-bold text-ink uppercase tracking-wider mb-1">
            Symptoms & Observed Damage
          </label>
          <textarea
            rows={3}
            value={issue}
            onChange={(e) => setIssue(e.target.value)}
            className="w-full p-3 text-xs sm:text-sm bg-surface-secondary border border-surface-border rounded-xl focus-ring"
            placeholder="e.g. Spilled coffee, keys not working, very slow boot, screen cracked..."
            required
          />
        </div>

        <button
          type="submit"
          disabled={isEvaluating}
          className="w-full py-3 bg-evergreen hover:bg-evergreen-dark text-white rounded-xl font-semibold text-sm transition-colors flex items-center justify-center gap-2 shadow-sm disabled:opacity-50"
        >
          <span>{isEvaluating ? 'Calculating Diagnostics...' : 'Evaluate Repair Economics'}</span>
          <ArrowRight className="w-4 h-4" />
        </button>
      </form>

      {/* Results View */}
      {result && (
        <div className="p-6 bg-surface rounded-3xl border border-surface-border shadow-sm space-y-6 animate-in fade-in zoom-in-95 duration-200">
          <div
            className={`p-4 rounded-2xl border flex items-start gap-3 ${
              result.recommendation === 'repair'
                ? 'bg-emerald-50 border-emerald-200 text-emerald-950'
                : 'bg-amber-50 border-amber-200 text-amber-950'
            }`}
          >
            {result.recommendation === 'repair' ? (
              <CheckCircle2 className="w-6 h-6 text-emerald-600 shrink-0 mt-0.5" />
            ) : (
              <AlertTriangle className="w-6 h-6 text-amber-600 shrink-0 mt-0.5" />
            )}
            <div>
              <h3 className="text-sm font-bold">{result.headline}</h3>
              <p className="text-xs opacity-90 mt-1 leading-relaxed">
                Repair Ratio: <strong>{result.repairRatioPercent}%</strong> of estimated residual machine value.
              </p>
            </div>
          </div>

          {/* Metric Comparison Cards */}
          <div className="grid grid-cols-1 sm:grid-cols-3 gap-4">
            <div className="p-4 bg-surface-secondary/70 rounded-2xl border border-surface-border space-y-1">
              <span className="text-[11px] font-semibold text-ink-muted uppercase">Estimated Repair Cost</span>
              <div className="text-xl font-bold text-ink">
                ₹{result.estimatedRepairCostMin.toLocaleString('en-IN')} - ₹{result.estimatedRepairCostMax.toLocaleString('en-IN')}
              </div>
            </div>

            <div className="p-4 bg-surface-secondary/70 rounded-2xl border border-surface-border space-y-1">
              <span className="text-[11px] font-semibold text-ink-muted uppercase">Current Residual Value</span>
              <div className="text-xl font-bold text-ink">
                ₹{result.currentResidualValue.toLocaleString('en-IN')}
              </div>
            </div>

            <div className="p-4 bg-surface-secondary/70 rounded-2xl border border-surface-border space-y-1">
              <span className="text-[11px] font-semibold text-ink-muted uppercase">Economic Verdict</span>
              <div className={`text-xl font-bold capitalize ${result.recommendation === 'repair' ? 'text-emerald-700' : 'text-amber-700'}`}>
                {result.recommendation}
              </div>
            </div>
          </div>

          {/* Analysis & Reasons */}
          <div className="space-y-2">
            <h4 className="text-xs font-bold text-ink uppercase tracking-wider">Expert Assessment & Rationale</h4>
            <ul className="space-y-2 text-xs text-ink-muted">
              {result.reasons.map((r, i) => (
                <li key={i} className="flex items-start gap-2">
                  <span className="text-evergreen font-bold">•</span>
                  <span>{r}</span>
                </li>
              ))}
            </ul>
          </div>

          {/* Suggested Alternative Listing in Society */}
          {result.suggestedAlternativeListingId && (
            <div className="p-4 bg-surface-secondary rounded-2xl border border-surface-border flex items-center justify-between gap-3">
              <div>
                <div className="text-xs font-bold text-ink">Available in Society: ThinkPad T480</div>
                <div className="text-[11px] text-ink-muted">
                  Amit K. (Tower B) is selling a tested ThinkPad T480 with original charger for ₹18,000.
                </div>
              </div>
              <Link
                to={`/listing/${result.suggestedAlternativeListingId}`}
                className="px-3 py-1.5 bg-evergreen hover:bg-evergreen-dark text-white font-semibold text-xs rounded-xl shrink-0"
              >
                View Listing
              </Link>
            </div>
          )}
        </div>
      )}
    </div>
  );
};

