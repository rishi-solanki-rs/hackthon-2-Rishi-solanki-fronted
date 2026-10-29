import React, { useCallback, useEffect, useLayoutEffect, useRef, useState } from 'react';
import { useLocation, useNavigate } from 'react-router-dom';
import { ArrowLeft, ArrowRight, X } from 'lucide-react';
import { ItemThumb } from '../brand/itemIcons';

interface TourStep {
  route?: string;
  /** CSS selector of the element to spotlight; omit for a centred card. */
  target?: string;
  title: string;
  body: string;
  preview?: 'checklist' | 'options';
}

const STEPS: TourStep[] = [
  { title: 'Welcome to Sidekit', body: 'A one-minute tour of where to ask, what you get back and where to find items from neighbours.' },
  { route: '/plan/new', target: '[data-tour="task-composer"]', title: 'Ask here', body: 'Describe your task in your own words — any language. Press Enter and Sidekit builds the list.' },
  { route: '/plan/new', target: '[data-tour="task-suggestions"]', title: 'Or start from an example', body: 'Not sure what to type? Tap an example to fill the box.' },
  { route: '/plan/new', title: 'You get a checklist', body: 'Tick what you already own. Only the missing items are searched.', preview: 'checklist' },
  { route: '/plan/new', title: 'Then the best way to get each item', body: 'Free borrowing first, then the cheapest rent, used or new option — with the reason.', preview: 'options' },
  { route: '/browse', target: '[data-tour="browse-filters"]', title: 'Browse everything neighbours share', body: 'Filter by category, how to get it, price, tower and condition.' },
  { route: '/browse', target: '[data-tour="browse-results"] li:first-child', title: 'Open an item to request it', body: 'Phone and flat numbers stay hidden until the owner accepts your request.' },
  { target: '[data-tour="persona-menu"]', title: 'Try the other side', body: 'Switch demo persona: Amit lends items, the Estate Office approves listings. Demo only — not real sign-in.' },
  { target: '[data-tour="notifications"]', title: 'Updates land here', body: 'Accepted requests, approvals and reminders show up in notifications.' },
];

const PAD = 8;
const CARD_W = 340;

type Rect = { top: number; left: number; width: number; height: number };

const CHECKLIST_PREVIEW = [
  { key: 'colour_pencils', name: 'Colour Pencils', owned: false },
  { key: 'drawing_paper', name: 'Drawing Paper', owned: true },
  { key: 'tabletop_easel', name: 'Tabletop Easel', owned: false },
];

const Preview: React.FC<{ kind: 'checklist' | 'options' }> = ({ kind }) => (
  <div className="mt-3 rounded-xl border border-surface-border bg-surface-secondary/60 p-2.5 space-y-1.5" aria-hidden="true">
    <span className="text-[9px] font-bold uppercase tracking-wider text-ink-subtle">Preview</span>
    {kind === 'checklist' ? (
      CHECKLIST_PREVIEW.map((i) => (
        <div key={i.key} className="flex items-center gap-2 bg-surface rounded-lg px-2 py-1.5">
          <span className={`w-3.5 h-3.5 rounded border ${i.owned ? 'bg-brand border-transparent' : 'border-surface-border'}`} />
          <ItemThumb itemKey={i.key} title={i.name} size={26} />
          <span className={`text-xs ${i.owned ? 'line-through text-ink-subtle' : 'text-ink'}`}>{i.name}</span>
        </div>
      ))
    ) : (
      <>
        <div className="text-[11px] px-2 py-1.5 rounded-lg bg-lime-subtle text-ink">Recommended: Borrow it — free from a neighbour in Tower D.</div>
        {[
          ['FREE', 'Wooden Tabletop Easel', 'Free'],
          ['RENT', 'Adjustable Field Easel', '₹40/day'],
        ].map(([m, t, p]) => (
          <div key={t} className="flex items-center gap-2 bg-surface rounded-lg px-2 py-1.5 text-xs">
            <span className="text-[9px] font-bold px-1.5 py-0.5 rounded bg-evergreen/10 text-evergreen">{m}</span>
            <span className="flex-1 text-ink truncate">{t}</span>
            <span className="font-semibold text-ink">{p}</span>
          </div>
        ))}
      </>
    )}
  </div>
);

/** Spotlight product tour: dims the page, highlights the real UI and explains each part. */
export const SpotlightTour: React.FC = () => {
  const navigate = useNavigate();
  const { pathname } = useLocation();
  const [index, setIndex] = useState<number | null>(null);
  const [rect, setRect] = useState<Rect | null>(null);
  const [targetMissing, setTargetMissing] = useState(false);
  const cardRef = useRef<HTMLDivElement>(null);
  const step = index === null ? null : STEPS[index];

  const close = useCallback(() => {
    setIndex(null);
    setRect(null);
    localStorage.setItem('sidekit_tour_done', '1');
  }, []);

  useEffect(() => {
    const start = () => setIndex(0);
    window.addEventListener('sidekit:start-tour', start);
    return () => window.removeEventListener('sidekit:start-tour', start);
  }, []);

  // Go to the step's page, then wait for its target to render
  useEffect(() => {
    if (!step) return;
    if (step.route && pathname !== step.route) {
      navigate(step.route);
      return;
    }
    setRect(null);
    setTargetMissing(false);
    if (!step.target) return;
    let tries = 0;
    let timer: number;
    const find = () => {
      const el = document.querySelector<HTMLElement>(step.target!);
      if (el) {
        const reduce = window.matchMedia('(prefers-reduced-motion: reduce)').matches;
        el.scrollIntoView({ block: 'center', behavior: reduce ? 'auto' : 'smooth' });
        timer = window.setTimeout(() => measure(el), reduce ? 0 : 350);
      } else if (tries++ < 25) {
        timer = window.setTimeout(find, 120);
      } else {
        setTargetMissing(true);
      }
    };
    const measure = (el: HTMLElement) => {
      const r = el.getBoundingClientRect();
      setRect({ top: r.top - PAD, left: r.left - PAD, width: r.width + PAD * 2, height: r.height + PAD * 2 });
    };
    find();
    const onMove = () => {
      const el = document.querySelector<HTMLElement>(step.target!);
      if (el) measure(el);
    };
    window.addEventListener('resize', onMove);
    window.addEventListener('scroll', onMove, true);
    return () => {
      window.clearTimeout(timer);
      window.removeEventListener('resize', onMove);
      window.removeEventListener('scroll', onMove, true);
    };
  }, [step, pathname]);

  useLayoutEffect(() => {
    if (step) cardRef.current?.focus();
  }, [index, rect === null]);

  useEffect(() => {
    if (index === null) return;
    const onKey = (e: KeyboardEvent) => {
      if (e.key === 'Escape') close();
      if (e.key === 'ArrowRight') setIndex((i) => (i === null ? i : Math.min(i + 1, STEPS.length - 1)));
      if (e.key === 'ArrowLeft') setIndex((i) => (i === null ? i : Math.max(i - 1, 0)));
    };
    window.addEventListener('keydown', onKey);
    return () => window.removeEventListener('keydown', onKey);
  }, [index, close]);

  if (!step || index === null) return null;

  const isLast = index === STEPS.length - 1;
  const vw = window.innerWidth;
  const vh = window.innerHeight;
  const mobile = vw < 640;
  const waitingForTarget = Boolean(step.target) && !rect && !targetMissing;

  // Card sits below the spotlight when there is room, otherwise above; centred without a target
  let cardStyle: React.CSSProperties;
  if (mobile || !rect) {
    cardStyle = mobile ? { left: 12, right: 12, bottom: 12 } : { left: '50%', top: '50%', transform: 'translate(-50%, -50%)', width: CARD_W };
  } else {
    const below = rect.top + rect.height + 12;
    const fitsBelow = below + 220 < vh;
    const left = Math.min(Math.max(12, rect.left + rect.width / 2 - CARD_W / 2), vw - CARD_W - 12);
    cardStyle = fitsBelow ? { top: below, left, width: CARD_W } : { bottom: vh - rect.top + 12, left, width: CARD_W };
  }

  return (
    <div className="fixed inset-0 z-[60]" role="presentation">
      {rect ? (
        <div
          aria-hidden="true"
          className="absolute rounded-2xl ring-2 ring-evergreen/70 motion-safe:transition-all motion-safe:duration-300 pointer-events-none"
          style={{ ...rect, boxShadow: '0 0 0 9999px rgba(10, 20, 17, 0.62)' }}
        />
      ) : (
        <div aria-hidden="true" className="absolute inset-0 bg-[rgba(10,20,17,0.62)]" />
      )}
      <div className="absolute inset-0" onClick={close} aria-hidden="true" />

      {!waitingForTarget && (
        <div
          ref={cardRef}
          tabIndex={-1}
          role="dialog"
          aria-modal="true"
          aria-labelledby="spotlight-title"
          aria-describedby="spotlight-body"
          style={cardStyle}
          className="absolute bg-surface border border-surface-border rounded-2xl shadow-2xl p-4 outline-none motion-safe:animate-fade-up"
        >
          <div className="flex items-start justify-between gap-3">
            <div className="flex items-center gap-2">
              <span className="text-[10px] font-bold uppercase tracking-wider text-evergreen">
                {index + 1} / {STEPS.length}
              </span>
            </div>
            <button type="button" onClick={close} className="p-1 -m-1 text-ink-muted hover:text-ink rounded-lg focus-ring" aria-label="Close tour">
              <X className="w-4 h-4" />
            </button>
          </div>
          <h2 id="spotlight-title" className="mt-1 text-base font-bold text-ink">
            {step.title}
          </h2>
          <p id="spotlight-body" className="mt-1 text-sm text-ink-muted leading-relaxed">
            {step.body}
          </p>
          {step.preview && <Preview kind={step.preview} />}

          <div className="mt-4 flex items-center gap-2">
            <div className="flex gap-1 mr-auto" aria-hidden="true">
              {STEPS.map((_, i) => (
                <span key={i} className={`h-1.5 rounded-full transition-all ${i === index ? 'w-4 bg-evergreen' : 'w-1.5 bg-surface-border'}`} />
              ))}
            </div>
            {index > 0 && (
              <button
                type="button"
                onClick={() => setIndex(index - 1)}
                className="inline-flex items-center gap-1 px-3 py-1.5 text-xs font-semibold text-ink border border-surface-border rounded-lg hover:bg-surface-secondary focus-ring"
              >
                <ArrowLeft className="w-3.5 h-3.5" aria-hidden="true" />
                Back
              </button>
            )}
            {isLast ? (
              <button
                type="button"
                onClick={() => {
                  close();
                  navigate('/plan/new');
                }}
                className="px-3.5 py-1.5 text-xs font-semibold text-white bg-brand hover:bg-brand-dark rounded-lg focus-ring"
              >
                Start planning
              </button>
            ) : (
              <button
                type="button"
                onClick={() => setIndex(index + 1)}
                className="inline-flex items-center gap-1 px-3.5 py-1.5 text-xs font-semibold text-white bg-brand hover:bg-brand-dark rounded-lg focus-ring"
              >
                Next
                <ArrowRight className="w-3.5 h-3.5" aria-hidden="true" />
              </button>
            )}
          </div>
          {isLast && (
            <button
              type="button"
              onClick={() => {
                close();
                window.dispatchEvent(new CustomEvent('sidekit:open-tour'));
              }}
              className="mt-2 text-xs text-ink-muted hover:text-ink underline-offset-2 hover:underline"
            >
              Read the full feature overview
            </button>
          )}
        </div>
      )}
    </div>
  );
};
