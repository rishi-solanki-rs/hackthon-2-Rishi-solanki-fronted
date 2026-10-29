import React, { useState, useEffect, useRef } from 'react';
import { useNavigate, useSearchParams } from 'react-router-dom';
import { ArrowUp, AlertCircle, ChevronDown, Clock, Home } from 'lucide-react';
import { FeatureIcon } from '../components/brand/sidekit-icons';
import { sidekitService } from '../services';

const SUGGESTIONS = [
  'Drawing and colouring with my kids this weekend',
  'Mount a TV and two shelves on the living room wall',
  'Birthday party at home for 20 people',
  'Deep clean the balcony and AC outdoor unit',
  'Shifting to a new flat in the same society',
  'Camping trip for two this weekend',
  'Bake a cake for my mother’s birthday',
  'Laptop is slow and the battery drains fast',
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

const SCOPES = ['Small touchup', 'Standard flat', 'Full renovation'];
const DURATIONS = ['A few hours', '1 day', 'Full weekend'];

interface ChoiceQuestionProps {
  question: string;
  options: { value: string; label: string }[];
  value: string;
  onChange: (v: string) => void;
}

/** A bounded clarifying question rendered as an assistant chat bubble with answer chips. */
const ChoiceQuestion: React.FC<ChoiceQuestionProps> = ({ question, options, value, onChange }) => (
  <div className="flex items-start gap-2.5">
    <span className="w-7 h-7 rounded-full bg-evergreen/10 flex items-center justify-center shrink-0" aria-hidden="true">
      <FeatureIcon name="sparkle" size={14} />
    </span>
    <fieldset className="flex-1 min-w-0 space-y-2">
      <legend className="text-sm text-ink bg-surface border border-surface-border rounded-2xl rounded-tl-sm px-3.5 py-2 mb-2 inline-block">
        {question}
      </legend>
      <div className="flex flex-wrap gap-1.5">
        {options.map((o) => {
          const active = value === o.value;
          return (
            <button
              key={o.value}
              type="button"
              aria-pressed={active}
              onClick={() => onChange(active ? '' : o.value)}
              className={`px-3 py-1.5 rounded-full text-xs font-medium border transition-colors focus-ring ${
                active ? 'bg-brand text-white border-transparent' : 'bg-surface border-surface-border text-ink-muted hover:text-ink hover:border-evergreen/40'
              }`}
            >
              {o.label}
            </button>
          );
        })}
      </div>
    </fieldset>
  </div>
);

const PillSelect: React.FC<{ id: string; label: string; icon: React.ReactNode; value: string; options: string[]; onChange: (v: string) => void }> = ({
  id,
  label,
  icon,
  value,
  options,
  onChange,
}) => (
  <label
    htmlFor={id}
    className="relative inline-flex items-center gap-1.5 pl-2.5 pr-2 py-1 rounded-full border border-surface-border bg-surface-secondary text-xs text-ink-muted hover:text-ink focus-within:ring-2 focus-within:ring-evergreen/40"
  >
    {icon}
    <span className="sr-only">{label}</span>
    <select
      id={id}
      value={value}
      onChange={(e) => onChange(e.target.value)}
      className="appearance-none bg-transparent text-xs text-ink pr-0.5 outline-none cursor-pointer"
    >
      {options.map((o) => (
        <option key={o}>{o}</option>
      ))}
    </select>
    <ChevronDown className="w-3 h-3 pointer-events-none" aria-hidden="true" />
  </label>
);

export const PlanNewPage: React.FC = () => {
  const [params] = useSearchParams();
  const navigate = useNavigate();
  const inputRef = useRef<HTMLTextAreaElement>(null);
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

  useEffect(() => {
    inputRef.current?.focus();
  }, []);

  // Grow the message box with its content, like a chat composer
  useEffect(() => {
    const el = inputRef.current;
    if (!el) return;
    el.style.height = 'auto';
    el.style.height = `${Math.min(el.scrollHeight, 240)}px`;
  }, [task]);

  const trimmed = task.trim();
  const canSubmit = trimmed.length >= 3 && !isSubmitting;
  const isMountingTask = MOUNTING_TASK.test(task);

  const submit = async () => {
    if (!canSubmit) return;
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

  const pickSuggestion = (s: string) => {
    setTask(s);
    inputRef.current?.focus();
  };

  return (
    <div className="max-w-2xl mx-auto px-4 pt-10 pb-16 sm:pt-16 space-y-6">
      <div className="text-center space-y-2">
        <div className="inline-flex items-center gap-1.5 text-xs font-semibold text-evergreen bg-evergreen/10 px-2.5 py-1 rounded-full">
          <FeatureIcon name="sparkle" size={14} />
          AI task planner
        </div>
        <h1 className="text-2xl sm:text-3xl font-bold text-ink tracking-tight">What are you working on?</h1>
        <p className="text-sm text-ink-muted">
          Tell Sidekit the task in your own words — any language is fine. Press Enter to send, Shift+Enter for a new line.
        </p>
      </div>

      <form
        data-tour="task-composer"
        onSubmit={(e) => {
          e.preventDefault();
          submit();
        }}
        className="bg-surface border border-surface-border rounded-3xl shadow-sm focus-within:border-evergreen/50 focus-within:shadow-md transition-shadow"
      >
        <label htmlFor="task-input" className="sr-only">
          Describe your task
        </label>
        <textarea
          id="task-input"
          ref={inputRef}
          rows={3}
          value={task}
          onChange={(e) => setTask(e.target.value)}
          onKeyDown={(e) => {
            if (e.key === 'Enter' && !e.shiftKey && !e.nativeEvent.isComposing) {
              e.preventDefault();
              submit();
            }
          }}
          placeholder="e.g. I want to do drawing with my kids this weekend…"
          className="w-full px-5 pt-4 pb-2 text-base bg-transparent text-ink placeholder:text-ink-subtle resize-none outline-none rounded-t-3xl"
          maxLength={500}
          aria-describedby="task-hint"
        />
        <div className="flex items-center gap-2 px-3 pb-3 pt-1">
          <PillSelect id="scope" label="Scope" icon={<Home className="w-3.5 h-3.5" aria-hidden="true" />} value={scope} options={SCOPES} onChange={setScope} />
          <PillSelect id="duration" label="How long" icon={<Clock className="w-3.5 h-3.5" aria-hidden="true" />} value={duration} options={DURATIONS} onChange={setDuration} />
          <span id="task-hint" className="ml-auto text-[11px] text-ink-subtle hidden md:inline tabular-nums" title="Enter to send, Shift+Enter for a new line">
            {trimmed.length}/500
          </span>
          <button
            type="submit"
            disabled={!canSubmit}
            aria-label={isSubmitting ? 'Building checklist' : 'Build my checklist'}
            className="ml-auto md:ml-0 shrink-0 w-10 h-10 rounded-full bg-brand hover:bg-brand-dark text-white flex items-center justify-center transition-colors disabled:opacity-40 disabled:cursor-not-allowed focus-ring"
          >
            {isSubmitting ? (
              <span className="w-4 h-4 border-2 border-white/30 border-t-white rounded-full animate-spin motion-reduce:animate-none" />
            ) : (
              <ArrowUp className="w-5 h-5" />
            )}
          </button>
        </div>
      </form>

      {isMountingTask && !isSubmitting && (
        <div className="space-y-4" aria-label="A couple of quick questions">
          <ChoiceQuestion
            question="Quick question — what kind of wall is it?"
            options={WALL_TYPES}
            value={wallType}
            onChange={setWallType}
          />
          <ChoiceQuestion question="And roughly how heavy is the load?" options={SHELF_LOADS} value={shelfLoad} onChange={setShelfLoad} />
        </div>
      )}

      {isSubmitting && (
        <div role="status" className="flex items-center gap-2.5">
          <span className="w-7 h-7 rounded-full bg-evergreen/10 flex items-center justify-center shrink-0" aria-hidden="true">
            <FeatureIcon name="sparkle" size={14} />
          </span>
          <span className="text-sm text-ink-muted bg-surface border border-surface-border rounded-2xl rounded-tl-sm px-3.5 py-2 inline-flex items-center gap-2">
            Building your checklist
            <span className="inline-flex gap-1" aria-hidden="true">
              {[0, 150, 300].map((d) => (
                <span key={d} className="w-1.5 h-1.5 rounded-full bg-ink-subtle animate-bounce motion-reduce:animate-none" style={{ animationDelay: `${d}ms` }} />
              ))}
            </span>
          </span>
        </div>
      )}

      {error && (
        <div role="alert" className="flex items-start gap-2 p-3 bg-red-50 border border-red-200 rounded-xl text-xs text-red-700">
          <AlertCircle className="w-4 h-4 shrink-0 mt-0.5" />
          <span>{error}</span>
        </div>
      )}

      {!isSubmitting && (
        <section data-tour="task-suggestions" aria-labelledby="suggestions-heading" className="space-y-2.5">
          <h2 id="suggestions-heading" className="text-xs font-semibold text-ink-muted uppercase tracking-wider">
            Try asking
          </h2>
          <div className="flex flex-wrap gap-2">
            {SUGGESTIONS.map((s) => (
              <button
                key={s}
                type="button"
                onClick={() => pickSuggestion(s)}
                className="text-left text-sm px-3.5 py-2 rounded-2xl border border-surface-border bg-surface text-ink-muted hover:text-ink hover:border-evergreen/40 hover:bg-evergreen/5 transition-colors focus-ring"
              >
                {s}
              </button>
            ))}
          </div>
        </section>
      )}

      <ol className="grid grid-cols-3 gap-2 pt-2 text-center text-[11px] text-ink-muted">
        {['Describe the task', 'Tick what you own', 'Borrow, rent or buy the rest'].map((s, i) => (
          <li key={s} className="flex flex-col items-center gap-1">
            <span className="w-5 h-5 rounded-full bg-surface-secondary border border-surface-border text-[10px] font-bold text-ink flex items-center justify-center">{i + 1}</span>
            {s}
          </li>
        ))}
      </ol>
    </div>
  );
};
