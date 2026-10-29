import React, { useState, useEffect } from 'react';
import { useNavigate, useSearchParams } from 'react-router-dom';
import { ArrowRight, AlertCircle } from 'lucide-react';
import { ItemIcon, ItemIconName, FeatureIcon } from '../components/brand/sidekit-icons';
import { sidekitService } from '../services';

const TEMPLATES = [
  { icon: 'bucket' as ItemIconName, title: 'Balcony Deep Clean', task: 'Balcony deep clean and AC outdoor unit wash' },
  { icon: 'drill' as ItemIconName, title: 'Wall Mount / Shelves', task: 'Mount bookshelf and frames on living room wall' },
  { icon: 'toolbox' as ItemIconName, title: 'Garden & Hedges', task: 'Trim balcony hedges and repot garden plants' },
  { icon: 'laptop' as ItemIconName, title: 'Laptop Diagnosis', task: 'Laptop running slow, evaluate repair vs replacement' },
];

const MOUNTING_TASK = /\b(shelf|shelves|mount|mounting|frame|frames|mirror|tv|bracket|hang|hanging|cabinet|curtain rod|wall)\b/i;

const WALL_TYPES = [
  { value: 'brick', label: 'Brick / concrete' },
  { value: 'hollow', label: 'Drywall / hollow' },
  { value: 'wood', label: 'Wooden panel' },
  { value: 'unsure', label: 'Not sure' },
];

const SHELF_LOADS = [
  { value: 'light', label: 'Light (< 5 kg)' },
  { value: 'medium', label: 'Medium (5–15 kg)' },
  { value: 'heavy', label: 'Heavy (> 15 kg)' },
];

export const PlanNewPage: React.FC = () => {
  const [params] = useSearchParams();
  const navigate = useNavigate();
  const [task, setTask] = useState(params.get('task') || '');
  const [scope, setScope] = useState('Standard flat');
  const [duration, setDuration] = useState('1 day');
  const [wallType, setWallType] = useState('');
  const [shelfLoad, setShelfLoad] = useState('');
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    const t = params.get('task');
    if (t) setTask(t);
  }, [params]);

  const isMountingTask = MOUNTING_TASK.test(task);

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    const trimmed = task.trim();
    if (!trimmed || trimmed.length < 3) return;

    setError(null);
    setIsSubmitting(true);

    const answers: Record<string, string> = { scope, duration };
    if (isMountingTask) {
      if (wallType) answers.wall_type = wallType;
      if (shelfLoad) answers.shelf_load = shelfLoad;
    }

    try {
      const plan = await sidekitService.createPlan(trimmed, answers);
      const lower = trimmed.toLowerCase();
      const isLaptop = lower.includes('laptop') || lower.includes('computer') || lower.includes(' pc ');
      navigate(isLaptop ? `/plan/${plan.id}/repair` : `/plan/${plan.id}`);
    } catch (err: any) {
      setError(err.message || 'Could not create plan. Please try again.');
      setIsSubmitting(false);
    }
  };

  return (
    <div className="max-w-2xl mx-auto py-10 px-4 space-y-8">
      {/* Header */}
      <div className="space-y-1.5">
        <div className="flex items-center gap-2 text-xs font-semibold text-evergreen">
          <FeatureIcon name="sparkle" size={16} />
          <span>AI Task Planner</span>
        </div>
        <h1 className="text-2xl font-bold text-ink">What are you working on?</h1>
        <p className="text-sm text-ink-muted">Describe your project and we'll build a complete checklist.</p>
      </div>

      {/* Quick templates */}
      <div className="grid grid-cols-2 gap-2">
        {TEMPLATES.map(({ icon, title, task: t }) => (
          <button
            key={title}
            type="button"
            onClick={() => setTask(t)}
            aria-pressed={task === t}
            className={`p-3 rounded-xl border text-left transition-all flex items-center gap-2.5 group focus-ring ${
              task === t
                ? 'border-evergreen/40 bg-evergreen-light text-evergreen'
                : 'border-surface-border bg-surface hover:border-evergreen/20 text-ink'
            }`}
          >
            <ItemIcon name={icon} size={28} />
            <span className="text-xs font-semibold leading-tight">{title}</span>
          </button>
        ))}
      </div>

      {/* Main form */}
      <form onSubmit={handleSubmit} className="space-y-4">
        <div>
          <label className="block text-xs font-semibold text-ink mb-1.5" htmlFor="task-input">
            Describe your project
          </label>
          <textarea
            id="task-input"
            rows={3}
            value={task}
            onChange={(e) => setTask(e.target.value)}
            placeholder="e.g. Mount a new heavy mirror and two floating shelves on bedroom wall..."
            className="w-full p-3 text-sm bg-surface border border-surface-border rounded-xl focus-ring text-ink placeholder:text-ink-subtle resize-none"
            required
            minLength={3}
            maxLength={500}
          />
          <div className="flex justify-between mt-1">
            <span className="text-xs text-ink-subtle">{task.trim().length}/500</span>
          </div>
        </div>

        {/* Compact clarifications */}
        <div className="grid grid-cols-2 gap-3">
          <div>
            <label className="block text-xs font-semibold text-ink mb-1" htmlFor="scope">Scope</label>
            <select
              id="scope"
              value={scope}
              onChange={(e) => setScope(e.target.value)}
              className="w-full px-3 py-2 text-xs bg-surface border border-surface-border rounded-xl focus-ring text-ink"
            >
              <option>Small touchup</option>
              <option>Standard flat</option>
              <option>Full renovation</option>
            </select>
          </div>
          <div>
            <label className="block text-xs font-semibold text-ink mb-1" htmlFor="duration">Duration</label>
            <select
              id="duration"
              value={duration}
              onChange={(e) => setDuration(e.target.value)}
              className="w-full px-3 py-2 text-xs bg-surface border border-surface-border rounded-xl focus-ring text-ink"
            >
              <option>A few hours</option>
              <option>1 day</option>
              <option>Full weekend</option>
            </select>
          </div>
        </div>

        {isMountingTask && (
          <fieldset className="grid grid-cols-2 gap-3">
            <legend className="sr-only">Wall mounting details</legend>
            <div>
              <label className="block text-xs font-semibold text-ink mb-1" htmlFor="wall-type">Wall type</label>
              <select
                id="wall-type"
                value={wallType}
                onChange={(e) => setWallType(e.target.value)}
                className="w-full px-3 py-2 text-xs bg-surface border border-surface-border rounded-xl focus-ring text-ink"
              >
                <option value="">Select…</option>
                {WALL_TYPES.map((w) => <option key={w.value} value={w.value}>{w.label}</option>)}
              </select>
            </div>
            <div>
              <label className="block text-xs font-semibold text-ink mb-1" htmlFor="shelf-load">Load</label>
              <select
                id="shelf-load"
                value={shelfLoad}
                onChange={(e) => setShelfLoad(e.target.value)}
                className="w-full px-3 py-2 text-xs bg-surface border border-surface-border rounded-xl focus-ring text-ink"
              >
                <option value="">Select…</option>
                {SHELF_LOADS.map((l) => <option key={l.value} value={l.value}>{l.label}</option>)}
              </select>
            </div>
          </fieldset>
        )}

        {error && (
          <div className="flex items-start gap-2 p-3 bg-red-50 border border-red-200 rounded-xl text-xs text-red-700">
            <AlertCircle className="w-4 h-4 shrink-0 mt-0.5" />
            <span>{error}</span>
          </div>
        )}

        <button
          type="submit"
          disabled={isSubmitting || task.trim().length < 3}
          className="w-full py-3 bg-brand hover:bg-brand-dark text-white rounded-xl font-semibold text-sm transition-colors flex items-center justify-center gap-2 disabled:opacity-50"
        >
          {isSubmitting ? (
            <>
              <span className="w-4 h-4 border-2 border-white/30 border-t-white rounded-full animate-spin" />
              <span>Building checklist...</span>
            </>
          ) : (
            <>
              <span>Generate Checklist</span>
              <ArrowRight className="w-4 h-4" />
            </>
          )}
        </button>
      </form>
    </div>
  );
};
