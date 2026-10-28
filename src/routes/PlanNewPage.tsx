import React, { useState, useEffect } from 'react';
import { useNavigate, useSearchParams } from 'react-router-dom';
import {
  Sparkles,
  ArrowRight,
  Wrench,
  CheckCircle2,
  HelpCircle,
  Laptop,
  TreePine,
  Sparkle,
  Home,
} from 'lucide-react';
import { sidekitService } from '../services';

export const PlanNewPage: React.FC = () => {
  const [searchParams] = useSearchParams();
  const navigate = useNavigate();

  const [taskDescription, setTaskDescription] = useState(searchParams.get('task') || '');
  const [scope, setScope] = useState('Medium (standard flat)');
  const [duration, setDuration] = useState('1 day');
  const [hasPower, setHasPower] = useState('Yes, nearby outlet');
  const [isSubmitting, setIsSubmitting] = useState(false);

  useEffect(() => {
    const task = searchParams.get('task');
    if (task) setTaskDescription(task);
  }, [searchParams]);

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!taskDescription.trim()) return;

    // Check if task is laptop repair
    const descLower = taskDescription.toLowerCase();
    if (descLower.includes('laptop') || descLower.includes('pc') || descLower.includes('computer')) {
      setIsSubmitting(true);
      try {
        const plan = await sidekitService.createPlan(taskDescription, { scope, duration, hasPower });
        navigate(`/plan/${plan.id}/repair`);
        return;
      } catch (err) {
        console.error(err);
      } finally {
        setIsSubmitting(false);
      }
    }

    try {
      setIsSubmitting(true);
      const plan = await sidekitService.createPlan(taskDescription, { scope, duration, hasPower });
      navigate(`/plan/${plan.id}`);
    } catch (err) {
      console.error(err);
    } finally {
      setIsSubmitting(false);
    }
  };

  const templates = [
    {
      title: 'Balcony Deep Clean',
      desc: 'High-pressure wash balcony floor, glass railings, and AC outdoor unit',
      icon: Sparkle,
      task: 'Balcony deep clean and AC outdoor unit wash',
    },
    {
      title: 'Wall Mount Bookshelves / TV',
      desc: 'Drill masonry walls, anchor studs, mount heavy brackets and shelves',
      icon: Wrench,
      task: 'Mount heavy bookshelf & frame on living room wall',
    },
    {
      title: 'Lawn & Balcony Pruning',
      desc: 'Hedge trimming, lawn mowing, repotting plants and garden tidy-up',
      icon: TreePine,
      task: 'Prune balcony hedge bushes and repot garden plants',
    },
    {
      title: 'Laptop Repair / Upgrade Diagnostics',
      desc: 'Analyze repair vs replacement economics, battery health, SSD upgrade',
      icon: Laptop,
      task: 'Diagnose laptop performance, slow boot, and evaluate repair vs replacement',
    },
  ];

  return (
    <div className="max-w-3xl mx-auto py-8 px-4 space-y-8">
      <div className="space-y-2">
        <div className="inline-flex items-center gap-1.5 text-xs font-semibold text-evergreen bg-evergreen-light px-2.5 py-1 rounded-lg">
          <Sparkles className="w-3.5 h-3.5" />
          <span>Intelligent Task Planner</span>
        </div>
        <h1 className="text-3xl font-bold tracking-tight text-ink">What are you working on?</h1>
        <p className="text-sm text-ink-muted leading-relaxed">
          Sidekit analyzes your project requirements and pulls together a complete checklist of equipment, safety gear, and materials.
        </p>
      </div>

      {/* Main Task Form */}
      <form onSubmit={handleSubmit} className="p-6 bg-surface rounded-3xl border border-surface-border shadow-sm space-y-6">
        <div>
          <label className="block text-xs font-bold text-ink uppercase tracking-wider mb-2">
            Describe your project
          </label>
          <textarea
            rows={3}
            value={taskDescription}
            onChange={(e) => setTaskDescription(e.target.value)}
            placeholder="e.g., Mount a new heavy mirror and two wooden floating shelves on concrete wall in bedroom..."
            className="w-full p-3.5 text-sm bg-surface-secondary border border-surface-border rounded-2xl focus-ring text-ink placeholder:text-ink-subtle"
            required
          />
        </div>

        {/* Bounded Clarification Chips */}
        <div className="space-y-4 pt-2 border-t border-surface-border">
          <div className="text-xs font-bold text-ink uppercase tracking-wider">
            Clarify Scope & Constraints (Optional)
          </div>

          <div className="grid grid-cols-1 sm:grid-cols-3 gap-4">
            <div>
              <span className="text-xs text-ink-muted block mb-1.5 font-medium">Job Scope</span>
              <div className="space-y-1.5">
                {['Small touchup', 'Medium (standard flat)', 'Extensive renovation'].map((opt) => (
                  <button
                    type="button"
                    key={opt}
                    onClick={() => setScope(opt)}
                    className={`w-full text-left px-2.5 py-1.5 rounded-lg text-xs transition-colors border ${
                      scope === opt
                        ? 'bg-evergreen-light border-evergreen/40 text-evergreen-dark font-medium'
                        : 'bg-surface border-surface-border text-ink hover:bg-surface-secondary'
                    }`}
                  >
                    {opt}
                  </button>
                ))}
              </div>
            </div>

            <div>
              <span className="text-xs text-ink-muted block mb-1.5 font-medium">Expected Duration</span>
              <div className="space-y-1.5">
                {['A few hours', '1 day', 'Entire weekend'].map((opt) => (
                  <button
                    type="button"
                    key={opt}
                    onClick={() => setDuration(opt)}
                    className={`w-full text-left px-2.5 py-1.5 rounded-lg text-xs transition-colors border ${
                      duration === opt
                        ? 'bg-evergreen-light border-evergreen/40 text-evergreen-dark font-medium'
                        : 'bg-surface border-surface-border text-ink hover:bg-surface-secondary'
                    }`}
                  >
                    {opt}
                  </button>
                ))}
              </div>
            </div>

            <div>
              <span className="text-xs text-ink-muted block mb-1.5 font-medium">Power Socket Near Work</span>
              <div className="space-y-1.5">
                {['Yes, nearby outlet', 'Need long extension cord'].map((opt) => (
                  <button
                    type="button"
                    key={opt}
                    onClick={() => setHasPower(opt)}
                    className={`w-full text-left px-2.5 py-1.5 rounded-lg text-xs transition-colors border ${
                      hasPower === opt
                        ? 'bg-evergreen-light border-evergreen/40 text-evergreen-dark font-medium'
                        : 'bg-surface border-surface-border text-ink hover:bg-surface-secondary'
                    }`}
                  >
                    {opt}
                  </button>
                ))}
              </div>
            </div>
          </div>
        </div>

        <button
          type="submit"
          disabled={isSubmitting || !taskDescription.trim()}
          className="w-full py-3.5 bg-evergreen hover:bg-evergreen-dark text-white rounded-xl font-semibold text-sm transition-colors flex items-center justify-center gap-2 shadow-sm disabled:opacity-50"
        >
          <span>{isSubmitting ? 'Analyzing & Building Checklist...' : 'Generate Requirements Checklist'}</span>
          <ArrowRight className="w-4 h-4" />
        </button>
      </form>

      {/* Quick Starter Templates */}
      <div className="space-y-3">
        <h3 className="text-xs font-bold uppercase tracking-wider text-ink">Or pick a starter template</h3>
        <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
          {templates.map((tpl, i) => {
            const Icon = tpl.icon;
            return (
              <button
                key={i}
                type="button"
                onClick={() => setTaskDescription(tpl.task)}
                className="p-4 rounded-2xl bg-surface border border-surface-border hover:border-evergreen/40 hover:bg-surface-secondary/60 text-left transition-all group"
              >
                <div className="flex items-center gap-3">
                  <div className="w-9 h-9 rounded-xl bg-evergreen-light text-evergreen flex items-center justify-center group-hover:scale-105 transition-transform">
                    <Icon className="w-5 h-5" />
                  </div>
                  <div>
                    <h4 className="text-sm font-bold text-ink">{tpl.title}</h4>
                    <p className="text-xs text-ink-muted line-clamp-1">{tpl.desc}</p>
                  </div>
                </div>
              </button>
            );
          })}
        </div>
      </div>
    </div>
  );
};

