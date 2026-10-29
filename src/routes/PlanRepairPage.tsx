import React, { useState } from 'react';
import { useParams, Link } from 'react-router-dom';
import { AlertTriangle, CheckCircle, ArrowLeft, AlertCircle } from 'lucide-react';
import { Listing, RepairEvaluationResult } from '@sidekit/shared';
import { ItemIcon } from '../components/brand/sidekit-icons';
import { ItemThumb } from '../components/brand/itemIcons';
import { listingPriceLabel } from '../components/shared/listingPrice';
import { SampleBadge } from '../components/shared/SampleBadge';
import { sidekitService } from '../services';

export const PlanRepairPage: React.FC = () => {
  const { id } = useParams<{ id: string }>();
  const [brand, setBrand] = useState('Dell');
  const [model, setModel] = useState('Inspiron 15 5000');
  const [originalPrice, setOriginalPrice] = useState(55000);
  const [ageYears, setAgeYears] = useState(4);
  const [issue, setIssue] = useState('Screen flickering, battery drains fast');
  const [batteryHealth, setBatteryHealth] = useState(45);
  const [result, setResult] = useState<RepairEvaluationResult | null>(null);
  const [isEvaluating, setIsEvaluating] = useState(false);
  const [error, setError] = useState('');
  const [alternative, setAlternative] = useState<Listing | null>(null);

  const handleEvaluate = async (e: React.FormEvent) => {
    e.preventDefault();
    setIsEvaluating(true); setError('');
    try {
      const res = await sidekitService.evaluateRepair({
        brand, model, originalPrice, ageYears, issue,
        batteryHealthPercent: batteryHealth,
      });
      setResult(res);
      setAlternative(null);
      if (res.suggestedAlternativeListingId) {
        const alt = await sidekitService.getListing(res.suggestedAlternativeListingId).catch(() => undefined);
        setAlternative(alt && alt.status === 'active' && alt.moderationStatus !== 'hidden_by_admin' ? alt : null);
      }
    } catch (err: any) { setError(err.message || 'Evaluation failed.'); }
    setIsEvaluating(false);
  };

  return (
    <div className="max-w-2xl mx-auto py-10 px-4 space-y-8">
      {/* Header */}
      <div className="space-y-1.5">
        <div className="flex items-center gap-2 text-xs font-semibold text-evergreen">
          <ItemIcon name="laptop" size={16} />
          Repair vs. Replace Advisor
        </div>
        <h1 className="text-2xl font-bold text-ink">Laptop Economics</h1>
        <p className="text-sm text-ink-muted">
          If repair cost exceeds 50% of the laptop's residual value, replacement is more economical.
        </p>
      </div>

      {/* Input form */}
      <form onSubmit={handleEvaluate} className="bg-surface rounded-2xl border border-surface-border p-6 space-y-4">
        <div className="grid grid-cols-2 gap-4">
          <div>
            <label className="block text-xs font-semibold text-ink mb-1">Brand</label>
            <input type="text" value={brand} onChange={(e) => setBrand(e.target.value)}
              className="w-full px-3 py-2 text-sm bg-surface-secondary border border-surface-border rounded-xl focus-ring" required />
          </div>
          <div>
            <label className="block text-xs font-semibold text-ink mb-1">Model</label>
            <input type="text" value={model} onChange={(e) => setModel(e.target.value)}
              className="w-full px-3 py-2 text-sm bg-surface-secondary border border-surface-border rounded-xl focus-ring" required />
          </div>
          <div>
            <label className="block text-xs font-semibold text-ink mb-1">Original Price (₹)</label>
            <input type="number" value={originalPrice} onChange={(e) => setOriginalPrice(parseInt(e.target.value) || 0)}
              className="w-full px-3 py-2 text-sm bg-surface-secondary border border-surface-border rounded-xl focus-ring font-mono" required min={5000} />
          </div>
          <div>
            <label className="block text-xs font-semibold text-ink mb-1">Age (years)</label>
            <input type="number" value={ageYears} onChange={(e) => setAgeYears(parseInt(e.target.value) || 0)}
              className="w-full px-3 py-2 text-sm bg-surface-secondary border border-surface-border rounded-xl focus-ring font-mono" required min={0} max={20} />
          </div>
        </div>

        <div>
          <label className="block text-xs font-semibold text-ink mb-1">Describe the Issue</label>
          <textarea rows={2} value={issue} onChange={(e) => setIssue(e.target.value)}
            className="w-full p-3 text-sm bg-surface-secondary border border-surface-border rounded-xl focus-ring resize-none"
            required placeholder="e.g. Screen cracked, slow boot, liquid damage..." />
        </div>

        <div>
          <label className="block text-xs font-semibold text-ink mb-1">
            Battery Health: <span className="font-bold text-ink">{batteryHealth}%</span>
          </label>
          <input type="range" min={10} max={100} value={batteryHealth}
            onChange={(e) => setBatteryHealth(parseInt(e.target.value))}
            className="w-full accent-evergreen" />
          <div className="flex justify-between text-[10px] text-ink-muted mt-0.5">
            <span>10% (critical)</span><span>100% (full)</span>
          </div>
        </div>

        {error && (
          <div className="flex items-start gap-2 p-3 bg-red-50 border border-red-200 rounded-xl text-xs text-red-700">
            <AlertCircle className="w-4 h-4 shrink-0 mt-0.5" />
            {error}
          </div>
        )}

        <button type="submit" disabled={isEvaluating}
          className="w-full py-3 bg-brand hover:bg-brand-dark text-white rounded-xl font-semibold text-sm transition-colors disabled:opacity-50 flex items-center justify-center gap-2">
          {isEvaluating ? (
            <><span className="w-4 h-4 border-2 border-white/30 border-t-white rounded-full animate-spin" />Evaluating...</>
          ) : 'Evaluate Repair Economics'}
        </button>
      </form>

      {/* Result */}
      {result && (
        <div className={`rounded-2xl border p-6 space-y-5 ${
          result.recommendation === 'replace'
            ? 'bg-rose-50/50 border-rose-200'
            : 'bg-emerald-50/50 border-emerald-200'
        }`}>
          {/* Verdict */}
          <div className="flex items-start gap-3">
            {result.recommendation === 'replace'
              ? <AlertTriangle className="w-6 h-6 text-rose-600 shrink-0 mt-0.5" />
              : <CheckCircle className="w-6 h-6 text-emerald-600 shrink-0 mt-0.5" />
            }
            <div>
              <h2 className={`text-base font-bold ${result.recommendation === 'replace' ? 'text-rose-800' : 'text-emerald-800'}`}>
                {result.headline}
              </h2>
              <p className="text-xs text-ink-muted mt-0.5">Recommendation: <strong className="uppercase">{result.recommendation}</strong></p>
            </div>
          </div>

          {/* Economics */}
          <div className="grid grid-cols-3 gap-3 text-center">
            <div className="p-3 bg-surface rounded-xl border border-surface-border">
              <div className="text-base font-bold text-ink">₹{result.estimatedRepairCostMin.toLocaleString('en-IN')}–{result.estimatedRepairCostMax.toLocaleString('en-IN')}</div>
              <div className="text-[10px] text-ink-muted uppercase tracking-wider mt-0.5">Repair Range</div>
            </div>
            <div className="p-3 bg-surface rounded-xl border border-surface-border">
              <div className="text-base font-bold text-ink">₹{result.currentResidualValue.toLocaleString('en-IN')}</div>
              <div className="text-[10px] text-ink-muted uppercase tracking-wider mt-0.5">Residual Value</div>
            </div>
            <div className={`p-3 rounded-xl border ${result.repairRatioPercent > 50 ? 'bg-rose-50 border-rose-200' : 'bg-emerald-50 border-emerald-200'}`}>
              <div className={`text-base font-bold ${result.repairRatioPercent > 50 ? 'text-rose-700' : 'text-emerald-700'}`}>
                {result.repairRatioPercent}%
              </div>
              <div className="text-[10px] text-ink-muted uppercase tracking-wider mt-0.5">Repair Ratio</div>
            </div>
          </div>

          {/* Battery action */}
          {result.batteryAction && (
            <div className="p-3 bg-surface border border-amber-200 rounded-xl text-xs text-amber-800 flex items-start gap-2">
              <AlertTriangle className="w-4 h-4 shrink-0 mt-0.5 text-amber-600" />
              {result.batteryAction}
            </div>
          )}

          {/* Reasons */}
          <div className="space-y-2">
            {result.reasons.map((r, i) => (
              <p key={i} className="text-xs text-ink-muted leading-relaxed flex items-start gap-1.5">
                <span className="text-ink-subtle mt-0.5">•</span>
                {r}
              </p>
            ))}
          </div>

          {/* Suggest alternative */}
          {alternative && (
            <div className="pt-3 border-t border-surface-border">
              <p className="text-xs text-ink-muted mb-2">A reliable refurbished alternative is available in your community:</p>
              <Link to={`/listing/${alternative.id}`}
                className="flex items-center gap-3 p-3 bg-surface rounded-xl border border-evergreen/30 hover:border-evergreen/50 transition-colors">
                <ItemThumb itemKey={alternative.itemKey} title={alternative.title} size={40} />
                <span className="flex-1 min-w-0">
                  <span className="block text-sm font-semibold text-evergreen truncate">{alternative.title}</span>
                  <span className="flex items-center gap-1.5 text-xs text-ink-muted">{listingPriceLabel(alternative)} · {alternative.ownerDisplayName}{alternative.isSample && <SampleBadge />}</span>
                </span>
              </Link>
            </div>
          )}
        </div>
      )}

      {id && (
        <Link to={`/plan/${id}`} className="flex items-center gap-1.5 text-xs text-ink-muted hover:text-ink">
          <ArrowLeft className="w-3.5 h-3.5" />
          Back to plan
        </Link>
      )}
    </div>
  );
};
