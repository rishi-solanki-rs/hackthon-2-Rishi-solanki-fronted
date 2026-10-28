import React from 'react';
import {
  ShieldCheck,
  AlertTriangle,
  HelpCircle,
  Wrench,
  Ban,
  Package,
  Laptop,
  CheckCircle2,
  FileText,
} from 'lucide-react';

export const HelpSafetyPage: React.FC = () => {
  return (
    <div className="max-w-4xl mx-auto py-8 px-4 space-y-10">
      <div className="space-y-2">
        <div className="inline-flex items-center gap-1.5 text-xs font-semibold text-evergreen bg-evergreen-light px-2.5 py-1 rounded-lg">
          <ShieldCheck className="w-3.5 h-3.5" />
          <span>Palm Grove Estate Safety Standard</span>
        </div>
        <h1 className="text-3xl font-bold tracking-tight text-ink">
          Community Guidelines & Safety Policies
        </h1>
        <p className="text-xs sm:text-sm text-ink-muted leading-relaxed">
          Sidekit is built on mutual respect and transparent care between neighbours. Please review our safety classifications and damage dispute protocols.
        </p>
      </div>

      {/* Safety Classifications 3 Pillars */}
      <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
        {/* Class 1: Prohibited */}
        <div className="p-6 bg-surface rounded-3xl border border-rose-200/80 shadow-sm space-y-3">
          <div className="w-10 h-10 rounded-2xl bg-rose-50 text-rose-600 flex items-center justify-center font-bold">
            <Ban className="w-5 h-5" />
          </div>
          <h3 className="text-base font-bold text-ink">Class 1: Prohibited Items</h3>
          <p className="text-xs text-ink-muted leading-relaxed">
            Strictly blocked from listings and requests under RWA rules:
          </p>
          <ul className="text-xs text-ink-muted space-y-1 list-disc pl-4">
            <li>Weapons, firearms, airguns</li>
            <li>Petrol, diesel, loose kerosene</li>
            <li>Fireworks, crackers, pyrotechnics</li>
            <li>Prescription medications & drugs</li>
            <li>Hazardous industrial acids & chemicals</li>
          </ul>
        </div>

        {/* Class 2: Consumables */}
        <div className="p-6 bg-surface rounded-3xl border border-amber-200/80 shadow-sm space-y-3">
          <div className="w-10 h-10 rounded-2xl bg-amber-50 text-amber-600 flex items-center justify-center font-bold">
            <Package className="w-5 h-5" />
          </div>
          <h3 className="text-base font-bold text-ink">Class 2: Consumables</h3>
          <p className="text-xs text-ink-muted leading-relaxed">
            Items consumed during use. Cannot be borrowed or rented:
          </p>
          <ul className="text-xs text-ink-muted space-y-1 list-disc pl-4">
            <li>Wall paint, primer, thinner</li>
            <li>Painter's masking tape, duct tape</li>
            <li>Rawl plugs, wall screws, anchors</li>
            <li>Sandpaper, steel wool, grout</li>
            <li>Plant fertilizers & potting soil</li>
          </ul>
        </div>

        {/* Class 3: High Liability Tools */}
        <div className="p-6 bg-surface rounded-3xl border border-evergreen/30 shadow-sm space-y-3">
          <div className="w-10 h-10 rounded-2xl bg-evergreen-light text-evergreen flex items-center justify-center font-bold">
            <Wrench className="w-5 h-5" />
          </div>
          <h3 className="text-base font-bold text-ink">Class 3: Caution Tools</h3>
          <p className="text-xs text-ink-muted leading-relaxed">
            Specialized equipment requiring safety gear and explicit owner consent:
          </p>
          <ul className="text-xs text-ink-muted space-y-1 list-disc pl-4">
            <li>Heavy rotary demolition hammers</li>
            <li>Chainsaws & heavy hedge cutters</li>
            <li>Arc welding sets</li>
            <li>Top-floor extension ladders</li>
            <li>High-pressure 120+ bar washers</li>
          </ul>
        </div>
      </div>

      {/* Damage & Dispute Protocol */}
      <div className="p-6 sm:p-8 bg-surface rounded-3xl border border-surface-border shadow-sm space-y-4">
        <h2 className="text-lg font-bold text-ink tracking-tight flex items-center gap-2">
          <FileText className="w-5 h-5 text-evergreen" />
          <span>Damage Dispute & Security Deposit Protocol</span>
        </h2>

        <div className="space-y-3 text-xs text-ink-muted leading-relaxed">
          <p>
            <strong>1. Pre-Handover Inspection:</strong> When picking up equipment, both owner and borrower must verify operational status (motor running, cable intact, clean exterior).
          </p>
          <p>
            <strong>2. Normal Wear & Tear vs. Damage:</strong> Minor cosmetic scratches and natural blade dulling are standard wear and tear. Motor burnout due to incorrect voltage or cracked housings constitute damage.
          </p>
          <p>
            <strong>3. Security Deposit:</strong> For valuable electronics or heavy tools, owners may set a refundable security deposit. Deposits are returned immediately upon physical inspection during the return handover.
          </p>
          <p>
            <strong>4. Escalation:</strong> If an amicable repair solution cannot be reached, residents can flag the issue to the Palm Grove Estate Office for arbitration.
          </p>
        </div>
      </div>

      {/* Laptop Diagnostics & 50% Rule */}
      <div className="p-6 sm:p-8 bg-surface rounded-3xl border border-surface-border shadow-sm space-y-4">
        <h2 className="text-lg font-bold text-ink tracking-tight flex items-center gap-2">
          <Laptop className="w-5 h-5 text-evergreen" />
          <span>Laptop Repair Economics & The 50% Rule</span>
        </h2>

        <div className="space-y-3 text-xs text-ink-muted leading-relaxed">
          <p>
            Our Laptop Advisor uses standard diminishing depreciation (25% annually) to estimate your laptop's current residual market value.
          </p>
          <div className="p-4 bg-surface-secondary rounded-2xl border border-surface-border text-xs text-ink">
            <strong>The 50% Rule:</strong> If total estimated repair quotes exceed 50% of the current market value of your laptop, replacement with a refurbished business laptop (such as the ThinkPad T480 available in our society) is significantly more economical over a 3-year horizon.
          </div>
        </div>
      </div>
    </div>
  );
};

