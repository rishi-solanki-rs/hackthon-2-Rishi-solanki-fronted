import React, { useState, useEffect, useRef } from 'react';
import { useNavigate } from 'react-router-dom';
import { Sparkles, CheckCircle2, Layers, Users, ShieldCheck, Wrench, AlertTriangle, ArrowRight, ArrowLeft, X, Check, ClipboardCheck } from 'lucide-react';

interface WalkthroughStep {
  title: string;
  badge: string;
  icon: React.FC<{ className?: string }>;
  description: string;
  keyPoints: string[];
  actionLabel?: string;
  actionRoute?: string;
}

const TOUR_STEPS: WalkthroughStep[] = [
  {
    title: 'Welcome to Sidekit',
    badge: 'Introduction',
    icon: Sparkles,
    description: 'Sidekit helps neighbours in Palm Grove (a demo society) finish everyday tasks with things they can borrow, rent or buy second-hand nearby.',
    keyPoints: [
      'Start from the task, not a shopping cart.',
      'Get a checklist, tick what you already own, and compare ways to get only what is missing.',
      'All seeded residents, listings and prices are demo data and carry a SAMPLE label.',
    ],
    actionLabel: 'Browse the catalog',
    actionRoute: '/browse',
  },
  {
    title: 'Describe your task',
    badge: 'Step 1 · Plan',
    icon: Sparkles,
    description: 'Type something like "drawing with my kids" or "mount a TV shelf". Sidekit builds a 10–20 item checklist.',
    keyPoints: [
      'Gemini interprets the task and may ask a few short questions. If it is unavailable, curated task templates are used instead.',
      'Add items yourself from the catalog, or describe what else you need and get more suggestions.',
      'The AI never sets prices, availability, safety decisions or rankings — that is done by fixed rules.',
    ],
    actionLabel: 'Plan a task',
    actionRoute: '/plan/new',
  },
  {
    title: 'Tick what you own',
    badge: 'Step 2 · Subtract',
    icon: CheckCircle2,
    description: 'Mark the items you already have. Only the missing ones move on to the comparison.',
    keyPoints: [
      'Owned quantities are subtracted per item.',
      'If you own everything, Sidekit tells you that you are ready to go.',
    ],
  },
  {
    title: 'Compare ways to get it',
    badge: 'Step 3 · Compare',
    icon: Layers,
    description: 'For each missing item Sidekit lists neighbour and shop options and recommends one, with the reason.',
    keyPoints: [
      'Free borrowing from neighbours comes first, then the cheapest priced rent, used or new option.',
      'Repair shops are suggested when you already own a broken item that can be fixed.',
      'Consumables like paint or tape can only be bought. Unknown prices show as "Price not available", never ₹0.',
    ],
  },
  {
    title: 'Requests and privacy',
    badge: 'Trust',
    icon: ShieldCheck,
    description: 'Send a request to the owner. Phone numbers and flat numbers stay hidden until the owner accepts.',
    keyPoints: [
      'Contact details are masked again if the request is cancelled before handover.',
      'Requests the owner does not answer within 72 hours expire automatically.',
      'Owners mark handover and return; borrowers can leave a thank-you note.',
    ],
    actionLabel: 'Open My Requests',
    actionRoute: '/my/requests',
  },
  {
    title: 'Listing items and approval',
    badge: 'Community',
    icon: ClipboardCheck,
    description: 'Residents list things they rarely use. The Estate Office approves new listings before neighbours can see them.',
    keyPoints: [
      'Rejected listings come back with a reason; editing them resubmits for approval.',
      'Reports from 3 different residents hide a listing until the Estate Office reviews it.',
    ],
    actionLabel: 'List an item',
    actionRoute: '/my/listings/new',
  },
  {
    title: 'Laptop repair or replace',
    badge: 'Repair advisor',
    icon: Wrench,
    description: 'For a laptop problem, Sidekit estimates whether repair is worth it.',
    keyPoints: [
      'The laptop’s current value is estimated by losing about 25% of its price each year.',
      'Repair is suggested when the estimated cost is at most half of that value and the laptop is under 6 years old.',
      'Try a task like "laptop battery drains fast" to see it.',
    ],
  },
  {
    title: 'Safety rules',
    badge: 'Safety',
    icon: AlertTriangle,
    description: 'Some things cannot be shared, and some jobs need a professional.',
    keyPoints: [
      'Weapons, fireworks and explosives, fuels like petrol or kerosene, prescription medicine and hazardous chemicals cannot be listed or requested.',
      'Electrical or gas work, and heavy loads on hollow or unknown walls, hide the tool options and point you to a qualified professional.',
      'High-risk tools such as chainsaws or welders show a safety warning before handover.',
    ],
    actionLabel: 'Read the safety guide',
    actionRoute: '/safety',
  },
  {
    title: 'Try both sides with personas',
    badge: 'Demo',
    icon: Users,
    description: 'Use the persona menu at the top right to act as different residents. This is a demo switch, not real sign-in.',
    keyPoints: [
      'Rishi S. plans tasks and sends requests.',
      'Amit K. and other neighbours list items and answer requests in their inbox.',
      'Estate Office opens the admin console: approvals, reports, listings, residents, requests and leaderboard.',
    ],
    actionLabel: 'Open the owner inbox',
    actionRoute: '/inbox',
  },
];

interface WalkthroughModalProps {
  isOpen: boolean;
  onClose: () => void;
}

export const WalkthroughModal: React.FC<WalkthroughModalProps> = ({ isOpen, onClose }) => {
  const [currentStepIndex, setCurrentStepIndex] = useState(0);
  const navigate = useNavigate();
  const dialogRef = useRef<HTMLDivElement>(null);

  useEffect(() => {
    if (!isOpen) return;
    setCurrentStepIndex(0);
    const previous = document.activeElement as HTMLElement | null;
    dialogRef.current?.focus();
    return () => previous?.focus();
  }, [isOpen]);

  useEffect(() => {
    if (!isOpen) return;
    const handleKeyDown = (e: KeyboardEvent) => {
      if (e.key === 'Escape') onClose();
      if (e.key === 'ArrowRight') setCurrentStepIndex((prev) => Math.min(prev + 1, TOUR_STEPS.length - 1));
      if (e.key === 'ArrowLeft') setCurrentStepIndex((prev) => Math.max(prev - 1, 0));
      if (e.key === 'Tab' && dialogRef.current) {
        const focusable = dialogRef.current.querySelectorAll<HTMLElement>('button, [href]');
        if (focusable.length === 0) return;
        const first = focusable[0];
        const last = focusable[focusable.length - 1];
        if (e.shiftKey && (document.activeElement === first || document.activeElement === dialogRef.current)) {
          e.preventDefault();
          last.focus();
        } else if (!e.shiftKey && document.activeElement === last) {
          e.preventDefault();
          first.focus();
        }
      }
    };
    window.addEventListener('keydown', handleKeyDown);
    return () => window.removeEventListener('keydown', handleKeyDown);
  }, [isOpen, onClose]);

  if (!isOpen) return null;

  const currentStep = TOUR_STEPS[currentStepIndex];
  const StepIcon = currentStep.icon;
  const isFirst = currentStepIndex === 0;
  const isLast = currentStepIndex === TOUR_STEPS.length - 1;

  const handleActionClick = (route?: string) => {
    if (route) {
      onClose();
      navigate(route);
    }
  };

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-ink/70 backdrop-blur-sm" onClick={onClose}>
      <div
        ref={dialogRef}
        tabIndex={-1}
        role="dialog"
        aria-modal="true"
        aria-labelledby="tour-modal-title"
        aria-describedby="tour-modal-description"
        onClick={(e) => e.stopPropagation()}
        className="relative w-full max-w-xl bg-surface border border-surface-border rounded-3xl shadow-2xl overflow-hidden flex flex-col max-h-[90vh] outline-none"
      >
        <div className="flex items-center justify-between px-6 pt-6 pb-4 border-b border-surface-border">
          <div className="flex items-center gap-2">
            <span className="px-2.5 py-0.5 rounded-full text-[11px] font-bold uppercase tracking-wider bg-evergreen/10 text-evergreen">{currentStep.badge}</span>
            <span className="text-xs text-ink-muted" aria-live="polite">
              Step {currentStepIndex + 1} of {TOUR_STEPS.length}
            </span>
          </div>
          <button
            type="button"
            onClick={onClose}
            className="p-1.5 text-ink-muted hover:text-ink hover:bg-surface-secondary rounded-xl transition-colors focus-ring"
            aria-label="Close tour"
          >
            <X className="w-4 h-4" />
          </button>
        </div>

        <div className="px-6 py-6 overflow-y-auto space-y-6 flex-1">
          <div className="flex items-start gap-4">
            <div className="w-12 h-12 rounded-2xl bg-evergreen/10 text-evergreen flex items-center justify-center shrink-0" aria-hidden="true">
              <StepIcon className="w-6 h-6" />
            </div>
            <div className="space-y-1">
              <h2 id="tour-modal-title" className="text-xl font-bold text-ink tracking-tight">
                {currentStep.title}
              </h2>
              <p id="tour-modal-description" className="text-sm text-ink-muted leading-relaxed">
                {currentStep.description}
              </p>
            </div>
          </div>

          <ul className="p-4 bg-surface-secondary/70 rounded-2xl border border-surface-border/60 space-y-2.5">
            {currentStep.keyPoints.map((point, idx) => (
              <li key={idx} className="flex items-start gap-2.5 text-sm text-ink/90 leading-relaxed">
                <Check className="w-4 h-4 text-evergreen shrink-0 mt-0.5" aria-hidden="true" />
                <span>{point}</span>
              </li>
            ))}
          </ul>

          {currentStep.actionRoute && (
            <button
              type="button"
              onClick={() => handleActionClick(currentStep.actionRoute)}
              className="inline-flex items-center gap-2 text-xs font-semibold text-evergreen hover:text-evergreen-dark transition-colors py-1.5 px-3 rounded-xl bg-evergreen/10 hover:bg-evergreen/20 focus-ring"
            >
              <span>{currentStep.actionLabel}</span>
              <ArrowRight className="w-3.5 h-3.5" aria-hidden="true" />
            </button>
          )}
        </div>

        <div className="px-6 py-4 border-t border-surface-border bg-surface-secondary/30 flex items-center justify-between gap-4">
          <div className="flex items-center gap-1.5">
            {TOUR_STEPS.map((step, idx) => (
              <button
                key={idx}
                type="button"
                onClick={() => setCurrentStepIndex(idx)}
                aria-label={`Go to step ${idx + 1}: ${step.title}`}
                aria-current={idx === currentStepIndex ? 'step' : undefined}
                className={`h-2 rounded-full transition-all motion-reduce:transition-none focus-ring ${
                  idx === currentStepIndex ? 'w-6 bg-evergreen' : 'w-2 bg-surface-border hover:bg-ink-muted'
                }`}
              />
            ))}
          </div>

          <div className="flex items-center gap-2">
            {!isFirst && (
              <button
                type="button"
                onClick={() => setCurrentStepIndex((prev) => prev - 1)}
                className="inline-flex items-center gap-1.5 px-3 py-2 text-xs font-semibold text-ink hover:bg-surface-secondary rounded-xl border border-surface-border transition-colors focus-ring"
              >
                <ArrowLeft className="w-3.5 h-3.5" aria-hidden="true" />
                <span>Back</span>
              </button>
            )}
            {isLast ? (
              <button
                type="button"
                onClick={onClose}
                className="inline-flex items-center gap-1.5 px-4 py-2 text-xs font-semibold text-white bg-brand hover:bg-brand-dark rounded-xl shadow-sm transition-colors focus-ring"
              >
                <Check className="w-3.5 h-3.5" aria-hidden="true" />
                <span>Finish tour</span>
              </button>
            ) : (
              <button
                type="button"
                onClick={() => setCurrentStepIndex((prev) => prev + 1)}
                className="inline-flex items-center gap-1.5 px-4 py-2 text-xs font-semibold text-white bg-brand hover:bg-brand-dark rounded-xl shadow-sm transition-colors focus-ring"
              >
                <span>Next</span>
                <ArrowRight className="w-3.5 h-3.5" aria-hidden="true" />
              </button>
            )}
          </div>
        </div>
      </div>
    </div>
  );
};
