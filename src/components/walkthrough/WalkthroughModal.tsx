import React, { useState, useEffect } from 'react';
import { useNavigate } from 'react-router-dom';
import {
  Sparkles,
  CheckCircle2,
  Layers,
  Users,
  ShieldCheck,
  Wrench,
  AlertTriangle,
  ArrowRight,
  ArrowLeft,
  X,
  Play,
  RotateCcw,
  Check,
} from 'lucide-react';

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
    description:
      'Sidekit is a hyper-local equipment sharing ecosystem designed for Palm Grove Society (120 apartments across Tower A, B, and C in Bengaluru).',
    keyPoints: [
      'Stop buying expensive power tools used only once or twice a year.',
      'Borrow, rent, or buy pre-owned equipment directly from verified neighbours.',
      'Safe, private, and fully transparent with universal SAMPLE data protections.',
    ],
    actionLabel: 'Browse Society Catalog',
    actionRoute: '/browse',
  },
  {
    title: 'AI Task-First Planning',
    badge: 'Step 1: The Plan',
    icon: Sparkles,
    description:
      'Rather than searching through a catalogue of 500 random items, Sidekit starts with what you actually want to achieve.',
    keyPoints: [
      'Enter any project: "Mount 65-inch TV on brick wall" or "Balcony deep clean".',
      'Google Gemini AI analyzes scope and constraints to generate a complete equipment checklist.',
      'Distinguishes reusable heavy tools (drills, ladders) from consumables (screws, tape).',
    ],
    actionLabel: 'Try AI Task Planner',
    actionRoute: '/plan/new',
  },
  {
    title: 'Inventory Subtraction',
    badge: 'Step 2: Subtraction',
    icon: CheckCircle2,
    description:
      'Why borrow what you already have sitting in your storage cabinet? Sidekit subtracts what you own.',
    keyPoints: [
      'Tick "I already own this" for tools you have at home.',
      'Sidekit automatically calculates your missing items list.',
      'If you own everything, Sidekit confirms you are ready with zero unnecessary borrowing!',
    ],
  },
  {
    title: '4-Tier Options Matrix',
    badge: 'Step 3: Ranking',
    icon: Layers,
    description:
      'Deterministic ranking code evaluates all available ways to obtain each missing item.',
    keyPoints: [
      'Tier 1 (Free Borrow): Neighbours offering items for ₹0 community goodwill.',
      'Tier 2 (Society Rental): Low-cost daily rentals (₹50–₹150/day) within your tower.',
      'Tier 3 (Buy Pre-Owned): Quality second-hand items sold by residents.',
      'Tier 4 (Local Retailers): Verified neighbourhood hardware shops within 2 km.',
      'Deterministic code handles all ranking, prices, and safety — AI never invents pricing.',
    ],
    actionLabel: 'View Sample Options Matrix',
    actionRoute: '/plan/plan_sample_balcony/options',
  },
  {
    title: 'Demo Persona Switcher',
    badge: 'Interactive Testing',
    icon: Users,
    description:
      'Test both sides of any peer-to-peer transaction using the persistent Persona Switcher in the bottom-right corner.',
    keyPoints: [
      'Rishi S. (Requester): Needs tools to complete apartment maintenance.',
      'Amit K. (Tool Owner): Lists power tools and approves incoming borrow requests.',
      'Vikram M. (Admin): Society administrator overseeing moderation, reports, and impact.',
      'Switch between Rishi and Amit to simulate sending, accepting, and returning items in real time!',
    ],
    actionLabel: 'Check Owner Inbox',
    actionRoute: '/inbox',
  },
  {
    title: 'Privacy Shield & Handover Protection',
    badge: 'Trust & Privacy',
    icon: ShieldCheck,
    description:
      'Community trust is built on privacy. Personal contact details are protected at every stage.',
    keyPoints: [
      'Phone numbers and flat numbers stay masked (+91 98765 •••••) to the public.',
      'Details unlock ONLY when the tool owner explicitly accepts your booking.',
      'Pre-handover cancellation immediately re-masks contact details.',
      'Simulated in-app WhatsApp modal allows direct messaging without external data leakage.',
    ],
    actionLabel: 'View Active Requests',
    actionRoute: '/my/requests',
  },
  {
    title: 'Laptop Repair vs Replace Advisor',
    badge: 'Economic Intelligence',
    icon: Wrench,
    description:
      'For electronics and laptops, Sidekit provides an intelligent diagnostic calculator following the 50% Economic Rule.',
    keyPoints: [
      'Calculates residual device value based on purchase price and depreciation ($0.75^{\\text{age}}$).',
      'If repair cost ≤ 50% of residual value → Recommends Repair with verified local shops.',
      'If repair cost > 50% → Recommends Replacement, preventing costly sunk-cost repair traps.',
    ],
    actionLabel: 'Try Laptop Advisor',
    actionRoute: '/plan/plan_sample_balcony/repair',
  },
  {
    title: 'Safety Guardrails & Prohibited Items',
    badge: 'Safety First',
    icon: AlertTriangle,
    description:
      'Apartment community safety is strictly enforced by our automated Class 1 Safety Engine.',
    keyPoints: [
      'Hazardous items (petrol chainsaws, gas cylinders, fireworks, drones) are blocked in real time.',
      'Users attempting to list prohibited equipment see a red safety warning and disabled submission.',
      'Direct recommendations to certified professional contractors for high-risk jobs.',
    ],
    actionLabel: 'Explore Safety Guidelines',
    actionRoute: '/safety',
  },
];

interface WalkthroughModalProps {
  isOpen: boolean;
  onClose: () => void;
}

export const WalkthroughModal: React.FC<WalkthroughModalProps> = ({ isOpen, onClose }) => {
  const [currentStepIndex, setCurrentStepIndex] = useState(0);
  const navigate = useNavigate();

  useEffect(() => {
    const handleKeyDown = (e: KeyboardEvent) => {
      if (!isOpen) return;
      if (e.key === 'Escape') onClose();
      if (e.key === 'ArrowRight' && currentStepIndex < TOUR_STEPS.length - 1) {
        setCurrentStepIndex((prev) => prev + 1);
      }
      if (e.key === 'ArrowLeft' && currentStepIndex > 0) {
        setCurrentStepIndex((prev) => prev - 1);
      }
    };
    window.addEventListener('keydown', handleKeyDown);
    return () => window.removeEventListener('keydown', handleKeyDown);
  }, [isOpen, currentStepIndex, onClose]);

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
    <div
      className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-ink/70 backdrop-blur-sm animate-in fade-in duration-200"
      role="dialog"
      aria-modal="true"
      aria-labelledby="tour-modal-title"
    >
      <div className="relative w-full max-w-xl bg-surface border border-surface-border rounded-3xl shadow-2xl overflow-hidden flex flex-col max-h-[90vh]">
        {/* Header Bar */}
        <div className="flex items-center justify-between px-6 pt-6 pb-4 border-b border-surface-border">
          <div className="flex items-center gap-2">
            <span className="px-2.5 py-0.5 rounded-full text-[11px] font-bold uppercase tracking-wider bg-evergreen/10 text-evergreen">
              {currentStep.badge}
            </span>
            <span className="text-xs text-ink-muted">
              Step {currentStepIndex + 1} of {TOUR_STEPS.length}
            </span>
          </div>
          <button
            onClick={onClose}
            className="p-1.5 text-ink-muted hover:text-ink hover:bg-surface-secondary rounded-xl transition-colors"
            aria-label="Close walkthrough"
          >
            <X className="w-4 h-4" />
          </button>
        </div>

        {/* Content Body */}
        <div className="px-6 py-6 overflow-y-auto space-y-6 flex-1">
          <div className="flex items-start gap-4">
            <div className="w-12 h-12 rounded-2xl bg-evergreen/10 text-evergreen flex items-center justify-center shrink-0">
              <StepIcon className="w-6 h-6" />
            </div>
            <div className="space-y-1">
              <h3 id="tour-modal-title" className="text-xl font-bold text-ink tracking-tight">
                {currentStep.title}
              </h3>
              <p className="text-xs text-ink-muted leading-relaxed">
                {currentStep.description}
              </p>
            </div>
          </div>

          {/* Key Points */}
          <div className="p-4 bg-surface-secondary/70 rounded-2xl border border-surface-border/60 space-y-2.5">
            <span className="text-[11px] font-bold uppercase tracking-wider text-ink block">
              How It Works:
            </span>
            <ul className="space-y-2">
              {currentStep.keyPoints.map((point, idx) => (
                <li key={idx} className="flex items-start gap-2.5 text-xs text-ink/90 leading-relaxed">
                  <Check className="w-3.5 h-3.5 text-evergreen shrink-0 mt-0.5" />
                  <span>{point}</span>
                </li>
              ))}
            </ul>
          </div>

          {/* Action button if step has a direct route */}
          {currentStep.actionRoute && (
            <div className="pt-1">
              <button
                type="button"
                onClick={() => handleActionClick(currentStep.actionRoute)}
                className="inline-flex items-center gap-2 text-xs font-semibold text-evergreen hover:text-evergreen-dark transition-colors py-1.5 px-3 rounded-xl bg-evergreen/10 hover:bg-evergreen/20"
              >
                <span>{currentStep.actionLabel}</span>
                <ArrowRight className="w-3.5 h-3.5" />
              </button>
            </div>
          )}
        </div>

        {/* Footer Navigation Bar */}
        <div className="px-6 py-4 border-t border-surface-border bg-surface-secondary/30 flex items-center justify-between gap-4">
          {/* Progress dots */}
          <div className="flex items-center gap-1.5">
            {TOUR_STEPS.map((_, idx) => (
              <button
                key={idx}
                onClick={() => setCurrentStepIndex(idx)}
                aria-label={`Jump to step ${idx + 1}`}
                className={`h-2 rounded-full transition-all ${
                  idx === currentStepIndex
                    ? 'w-6 bg-evergreen'
                    : 'w-2 bg-surface-border hover:bg-ink-muted'
                }`}
              />
            ))}
          </div>

          {/* Next / Back Controls */}
          <div className="flex items-center gap-2">
            {!isFirst && (
              <button
                type="button"
                onClick={() => setCurrentStepIndex((prev) => prev - 1)}
                className="inline-flex items-center gap-1.5 px-3 py-2 text-xs font-semibold text-ink hover:bg-surface-secondary rounded-xl border border-surface-border transition-colors"
              >
                <ArrowLeft className="w-3.5 h-3.5" />
                <span>Back</span>
              </button>
            )}

            {isLast ? (
              <button
                type="button"
                onClick={onClose}
                className="inline-flex items-center gap-1.5 px-4 py-2 text-xs font-semibold text-white bg-evergreen hover:bg-evergreen-dark rounded-xl shadow-sm transition-colors"
              >
                <Check className="w-3.5 h-3.5" />
                <span>Finish Tour</span>
              </button>
            ) : (
              <button
                type="button"
                onClick={() => setCurrentStepIndex((prev) => prev + 1)}
                className="inline-flex items-center gap-1.5 px-4 py-2 text-xs font-semibold text-white bg-evergreen hover:bg-evergreen-dark rounded-xl shadow-sm transition-colors"
              >
                <span>Next</span>
                <ArrowRight className="w-3.5 h-3.5" />
              </button>
            )}
          </div>
        </div>
      </div>
    </div>
  );
};
