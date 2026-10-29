import React, { useState, useEffect, useRef } from 'react';
import { useNavigate, useSearchParams } from 'react-router-dom';
import { ArrowUp, AlertCircle, Palette, Tv, ListChecks, PackageCheck, MessageSquareText } from 'lucide-react';
import { FeatureIcon } from '../components/brand/sidekit-icons';
import { sidekitService } from '../services';

const SUGGESTIONS = [
  { icon: Palette, text: 'Drawing and colouring with my kids this weekend' },
  { icon: Tv, text: 'Mount a TV and two shelves on the living room wall' },
];

const TYPEWRITER_PHRASES = [
  'I want to do drawing with my kids…',
  'Birthday party at home for 20 people…',
  'Shifting to a new flat next week…',
  'Deep clean the balcony this Sunday…',
];

// Duration drives how many days rental prices are calculated for on the options page
const DURATIONS = [
  { value: 'A few hours', label: 'A few hours' },
  { value: '1 day', label: '1 day' },
  { value: 'Full weekend', label: 'Full weekend' },
];

const STEPS = [
  { icon: MessageSquareText, title: 'Describe it', text: 'Any language, a line is enough' },
  { icon: ListChecks, title: 'Tick what you own', text: 'We only find the rest' },
  { icon: PackageCheck, title: 'Borrow, rent or buy', text: 'Neighbours first, shops after' },
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

function usePrefersReducedMotion(): boolean {
  const [reduced, setReduced] = useState(() => typeof window !== 'undefined' && window.matchMedia('(prefers-reduced-motion: reduce)').matches);
  useEffect(() => {
    const mq = window.matchMedia('(prefers-reduced-motion: reduce)');
    const onChange = () => setReduced(mq.matches);
    mq.addEventListener('change', onChange);
    return () => mq.removeEventListener('change', onChange);
  }, []);
  return reduced;
}

/** Types and erases example phrases one character at a time. */
function useTypewriter(phrases: string[], enabled: boolean): string {
  const [text, setText] = useState('');
  useEffect(() => {
    if (!enabled) return;
    let phrase = 0;
    let chars = 0;
    let deleting = false;
    let timer: number;
    const tick = () => {
      const full = phrases[phrase];
      chars += deleting ? -1 : 1;
      setText(full.slice(0, chars));
      let delay = deleting ? 25 : 55;
      if (!deleting && chars === full.length) {
        deleting = true;
        delay = 1600;
      } else if (deleting && chars === 0) {
        deleting = false;
        phrase = (phrase + 1) % phrases.length;
        delay = 350;
      }
      timer = window.setTimeout(tick, delay);
    };
    timer = window.setTimeout(tick, 400);
    return () => window.clearTimeout(timer);
  }, [enabled, phrases]);
  return enabled ? text : '';
}

interface ChipGroupProps {
  label: React.ReactNode;
  options: { value: string; label: string }[];
  value: string;
  onChange: (v: string) => void;
  allowEmpty?: boolean;
}

const ChipGroup: React.FC<ChipGroupProps> = ({ label, options, value, onChange, allowEmpty = true }) => (
  <fieldset className="flex flex-wrap items-center gap-1.5">
    <legend className="contents">
      <span className="text-xs text-ink-muted mr-1">{label}</span>
    </legend>
    {options.map((o) => {
      const active = value === o.value;
      return (
        <button
          key={o.value}
          type="button"
          aria-pressed={active}
          onClick={() => onChange(active && allowEmpty ? '' : o.value)}
          className={`px-3 py-1.5 rounded-full text-xs font-medium border transition-all duration-200 focus-ring ${
            active
              ? 'bg-brand text-white border-transparent shadow-sm'
              : 'bg-surface border-surface-border text-ink-muted hover:text-ink hover:border-evergreen/40 motion-safe:hover:-translate-y-px'
          }`}
        >
          {o.label}
        </button>
      );
    })}
  </fieldset>
);

export const PlanNewPage: React.FC = () => {
  const [params] = useSearchParams();
  const navigate = useNavigate();
  const inputRef = useRef<HTMLTextAreaElement>(null);
  const reducedMotion = usePrefersReducedMotion();
  const [task, setTask] = useState(params.get('task') || '');
  const [duration, setDuration] = useState('1 day');
  const [wallType, setWallType] = useState('');
  const [shelfLoad, setShelfLoad] = useState('');
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [error, setError] = useState<string | null>(null);

  const trimmed = task.trim();
  const canSubmit = trimmed.length >= 3 && !isSubmitting;
  const isMountingTask = MOUNTING_TASK.test(task);
  const typed = useTypewriter(TYPEWRITER_PHRASES, !task && !reducedMotion && !isSubmitting);

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

  const submit = async () => {
    if (!canSubmit) return;
    setError(null);
    setIsSubmitting(true);

    const answers: Record<string, string> = { duration };
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
    <div className="relative overflow-hidden">
      <div aria-hidden="true" className="pointer-events-none absolute inset-x-0 -top-24 h-[420px] flex justify-center">
        <div className="w-[640px] max-w-full h-full rounded-full bg-evergreen/15 blur-3xl motion-safe:animate-glow" />
      </div>

      <div className="relative max-w-2xl mx-auto px-4 pt-12 pb-20 sm:pt-20 space-y-7">
        <div className="text-center space-y-3 motion-safe:animate-fade-up">
          <span className="inline-flex items-center gap-1.5 text-xs font-semibold text-evergreen bg-evergreen/10 border border-evergreen/20 px-3 py-1 rounded-full">
            <FeatureIcon name="sparkle" size={14} />
            AI task planner
          </span>
          <h1 className="text-3xl sm:text-4xl font-bold text-ink tracking-tight">What are you working on?</h1>
          <p className="text-sm sm:text-base text-ink-muted max-w-md mx-auto">
            Describe the task in your own words. Sidekit builds the checklist and finds each item nearby.
          </p>
        </div>

        <form
          data-tour="task-composer"
          onSubmit={(e) => {
            e.preventDefault();
            submit();
          }}
          style={{ animationDelay: '80ms' }}
          className="relative flex items-end gap-2 p-2 pl-5 bg-surface border border-surface-border rounded-3xl shadow-lg shadow-ink/5 focus-within:border-evergreen/60 focus-within:ring-4 focus-within:ring-evergreen/10 transition-all motion-safe:animate-fade-up"
        >
          <label htmlFor="task-input" className="sr-only">
            Describe your task
          </label>
          <div className="relative flex-1 min-w-0">
            {typed && (
              <span aria-hidden="true" className="pointer-events-none absolute left-0 top-3 text-base text-ink-subtle truncate max-w-full">
                {typed}
                <span className="inline-block w-px h-4 ml-0.5 align-middle bg-ink-subtle motion-safe:animate-caret" />
              </span>
            )}
            <textarea
              id="task-input"
              ref={inputRef}
              rows={1}
              value={task}
              onChange={(e) => setTask(e.target.value)}
              onKeyDown={(e) => {
                if (e.key === 'Enter' && !e.shiftKey && !e.nativeEvent.isComposing) {
                  e.preventDefault();
                  submit();
                }
              }}
              placeholder={reducedMotion ? 'e.g. I want to do drawing with my kids' : ''}
              aria-describedby="task-hint"
              className="w-full min-h-[48px] py-3 text-base bg-transparent text-ink placeholder:text-ink-subtle resize-none outline-none"
              maxLength={500}
            />
          </div>
          <button
            type="submit"
            disabled={!canSubmit}
            aria-label={isSubmitting ? 'Building checklist' : 'Build my checklist'}
            className={`shrink-0 w-12 h-12 rounded-2xl text-white flex items-center justify-center transition-all duration-200 focus-ring ${
              canSubmit ? 'bg-brand hover:bg-brand-dark shadow-md motion-safe:hover:scale-105' : 'bg-brand/40 cursor-not-allowed'
            }`}
          >
            {isSubmitting ? (
              <span className="w-4 h-4 border-2 border-white/30 border-t-white rounded-full animate-spin motion-reduce:animate-none" />
            ) : (
              <ArrowUp className="w-5 h-5" />
            )}
          </button>
        </form>
        <p id="task-hint" className="sr-only">
          Press Enter to send and Shift+Enter for a new line.
        </p>

        <div className="space-y-4 motion-safe:animate-fade-up" style={{ animationDelay: '160ms' }}>
          <div className="flex justify-center">
            <ChipGroup label="Need things for" options={DURATIONS} value={duration} onChange={setDuration} allowEmpty={false} />
          </div>

          {isMountingTask && !isSubmitting && (
            <div className="space-y-3 p-4 rounded-2xl bg-surface border border-surface-border motion-safe:animate-fade-up">
              <p className="flex items-center gap-2 text-sm font-semibold text-ink">
                <FeatureIcon name="sparkle" size={14} />A quick check for wall work
              </p>
              <ChipGroup label="Wall" options={WALL_TYPES} value={wallType} onChange={setWallType} />
              <ChipGroup label="Load" options={SHELF_LOADS} value={shelfLoad} onChange={setShelfLoad} />
            </div>
          )}

          {!isSubmitting && !trimmed && (
            <div data-tour="task-suggestions" className="flex flex-wrap justify-center gap-2" aria-label="Example tasks">
              {SUGGESTIONS.map(({ icon: Icon, text }, i) => (
                <button
                  key={text}
                  type="button"
                  onClick={() => pickSuggestion(text)}
                  style={{ animationDelay: `${220 + i * 80}ms` }}
                  className="group inline-flex items-center gap-2 text-sm pl-2 pr-4 py-1.5 rounded-full border border-surface-border bg-surface text-ink-muted hover:text-ink hover:border-evergreen/40 hover:shadow-sm motion-safe:hover:-translate-y-0.5 transition-all duration-200 focus-ring motion-safe:animate-fade-up"
                >
                  <span className="w-7 h-7 rounded-full bg-evergreen/10 text-evergreen flex items-center justify-center group-hover:bg-evergreen/20 transition-colors">
                    <Icon className="w-3.5 h-3.5" aria-hidden="true" />
                  </span>
                  {text}
                </button>
              ))}
            </div>
          )}
        </div>

        {isSubmitting && (
          <p role="status" className="flex items-center justify-center gap-2 text-sm text-ink-muted">
            Building your checklist
            <span className="inline-flex gap-1" aria-hidden="true">
              {[0, 150, 300].map((d) => (
                <span key={d} className="w-1.5 h-1.5 rounded-full bg-evergreen animate-bounce motion-reduce:animate-none" style={{ animationDelay: `${d}ms` }} />
              ))}
            </span>
          </p>
        )}

        {error && (
          <div role="alert" className="flex items-start gap-2 p-3 bg-red-50 border border-red-200 rounded-xl text-xs text-red-700">
            <AlertCircle className="w-4 h-4 shrink-0 mt-0.5" />
            <span>{error}</span>
          </div>
        )}

        <ol className="grid grid-cols-1 sm:grid-cols-3 gap-3 pt-6">
          {STEPS.map(({ icon: Icon, title, text }, i) => (
            <li
              key={title}
              style={{ animationDelay: `${320 + i * 90}ms` }}
              className="flex sm:flex-col items-center sm:items-start gap-3 p-4 rounded-2xl bg-surface/70 border border-surface-border motion-safe:animate-fade-up"
            >
              <span className="relative w-9 h-9 rounded-xl bg-evergreen/10 text-evergreen flex items-center justify-center shrink-0">
                <Icon className="w-4 h-4" aria-hidden="true" />
                <span className="absolute -top-1.5 -right-1.5 w-4 h-4 rounded-full bg-brand text-white text-[9px] font-bold flex items-center justify-center">{i + 1}</span>
              </span>
              <span>
                <span className="block text-sm font-semibold text-ink">{title}</span>
                <span className="block text-xs text-ink-muted">{text}</span>
              </span>
            </li>
          ))}
        </ol>
      </div>
    </div>
  );
};
