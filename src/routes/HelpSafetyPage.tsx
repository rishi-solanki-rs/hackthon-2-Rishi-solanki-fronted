import React from 'react';
import { Link } from 'react-router-dom';
import { ShieldCheck, Package, AlertTriangle, HelpCircle } from 'lucide-react';
import { FeatureIcon, FeatureIconName } from '../components/brand/sidekit-icons';
import { Illustration } from '../components/brand/sidekit-art';

const HOW_TO: Array<{ icon: FeatureIconName; title: string; body: string; to: string; cta: string }> = [
  { icon: 'sparkle', title: '1. Plan a task', body: 'Describe what you want to do. Sidekit builds a checklist (AI when available, otherwise a standard template).', to: '/plan/new', cta: 'Plan a task' },
  { icon: 'owned', title: '2. Tick what you own', body: 'Mark items you already have and adjust quantities. Only the missing items are searched.', to: '/plan/new', cta: 'Start' },
  { icon: 'request', title: '3. Request from a neighbour', body: 'Pick a free borrow, rental or second-hand option and send a request with your dates.', to: '/browse', cta: 'Browse catalog' },
  { icon: 'handover', title: '4. Meet and hand over', body: 'Once the owner accepts, flat and phone unlock for both of you. The owner marks handover and return.', to: '/my/requests', cta: 'My requests' },
  { icon: 'returned', title: '5. Return and say thanks', body: 'After return, leave a thank-you note. It shows on the lender profile and earns badges.', to: '/my/requests', cta: 'My requests' },
  { icon: 'inbox', title: 'Lending? Use your inbox', body: 'List items under My Listings. Accept or decline requests in the Owner Inbox.', to: '/inbox', cta: 'Owner inbox' },
];

const SAFETY_CLASSES = [
  {
    icon: AlertTriangle,
    color: 'text-rose-600',
    bg: 'bg-rose-50 border-rose-200',
    label: 'Class 1 — Prohibited',
    desc: 'Strictly blocked from all listings and requests',
    items: ['Weapons, firearms, airguns', 'Petrol, diesel, loose kerosene', 'Fireworks & crackers', 'Prescription medications', 'Hazardous acids & chemicals'],
  },
  {
    icon: Package,
    color: 'text-amber-600',
    bg: 'bg-amber-50 border-amber-200',
    label: 'Class 2 — Consumables',
    desc: 'Can only be sold, not borrowed or rented',
    items: ['Paint, primer, thinner', 'Wall plugs & screws', 'Masking tape, sandpaper', 'Fertilizer, cement', 'Cloth, detergent'],
  },
  {
    icon: AlertTriangle,
    color: 'text-orange-500',
    bg: 'bg-orange-50 border-orange-200',
    label: 'Class 3 — High Liability',
    desc: 'Borrower must verify safety features before use',
    items: ['Chainsaw', 'Arc welder', 'Demolition hammer', 'Table saw'],
  },
];

const FAQS = [
  {
    q: 'What if a borrowed item is damaged?',
    a: 'Discuss directly with the owner. The comfort rules on each listing specify deposit requirements. For unresolved disputes, contact the Estate Office.',
  },
  {
    q: 'Can I lend to someone outside my society?',
    a: 'No. Sidekit is for Palm Grove Estate residents who join with the society invite code. This demo does not verify identity.',
  },
  {
    q: 'What is the 72-hour pending expiry?',
    a: 'If an owner does not respond to a request within 72 hours, the request expires automatically so you can seek alternatives.',
  },
  {
    q: 'How does the 3-report auto-hide work?',
    a: 'If 3 distinct community members report a listing, it is automatically hidden pending admin review. Approved listings are restored.',
  },
];

export const HelpSafetyPage: React.FC = () => (
  <div className="max-w-3xl mx-auto py-10 px-4 space-y-10">
    <div className="space-y-2">
      <div className="flex items-center gap-2 text-xs font-semibold text-evergreen">
        <ShieldCheck className="w-3.5 h-3.5" />
        Palm Grove Safety Standard
      </div>
      <h1 className="text-2xl font-bold text-ink">Guidelines & Safety</h1>
      <p className="text-sm text-ink-muted">Community rules for safe, transparent tool sharing.</p>
    </div>

    {/* How to use */}
    <div className="space-y-4">
      <h2 className="text-sm font-bold text-ink">How to use Sidekit</h2>
      <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
        {HOW_TO.map((s) => (
          <div key={s.title} className="p-4 bg-surface rounded-2xl border border-surface-border flex gap-3">
            <FeatureIcon name={s.icon} size={32} className="shrink-0" />
            <div className="space-y-1">
              <h3 className="text-sm font-bold text-ink">{s.title}</h3>
              <p className="text-xs text-ink-muted leading-relaxed">{s.body}</p>
              <Link to={s.to} className="text-xs font-semibold text-evergreen hover:underline">{s.cta} →</Link>
            </div>
          </div>
        ))}
      </div>
      <p className="text-xs text-ink-muted">
        Demo mode: use the persona menu (top right) to act as different residents. The <strong>Estate Office</strong> persona opens the Admin panel. This is a simulation, not real login.
      </p>
    </div>

    {/* Professional work */}
    <div className="p-5 bg-surface rounded-2xl border border-surface-border flex flex-col sm:flex-row items-center gap-5">
      <Illustration name="safety-professional" width={160} className="brand-art shrink-0" />
      <div className="space-y-1.5">
        <h2 className="text-sm font-bold text-ink">When Sidekit says: hire a professional</h2>
        <p className="text-xs text-ink-muted leading-relaxed">Heavy loads (over 15 kg) on hollow or unknown walls, electrical wiring and gas work are not DIY jobs. For these, Sidekit hides drills, anchors and other tools and shows a professional-advice notice instead.</p>
      </div>
    </div>

    {/* Safety Classes */}
    <div className="space-y-4">
      <h2 className="text-sm font-bold text-ink">Safety Classifications</h2>
      <div className="grid grid-cols-1 sm:grid-cols-3 gap-4">
        {SAFETY_CLASSES.map(({ icon: Icon, color, bg, label, desc, items }) => (
          <div key={label} className={`p-5 rounded-2xl border ${bg} space-y-3`}>
            <div className={`w-8 h-8 rounded-xl flex items-center justify-center ${bg}`}>
              <Icon className={`w-4 h-4 ${color}`} />
            </div>
            <div>
              <h3 className="text-sm font-bold text-ink">{label}</h3>
              <p className="text-xs text-ink-muted mt-0.5">{desc}</p>
            </div>
            <ul className="text-xs text-ink-muted space-y-1">
              {items.map((i) => <li key={i} className="flex items-start gap-1">· {i}</li>)}
            </ul>
          </div>
        ))}
      </div>
    </div>

    {/* Core Rules */}
    <div className="space-y-3">
      <h2 className="text-sm font-bold text-ink">Core Rules</h2>
      <div className="bg-surface rounded-2xl border border-surface-border divide-y divide-surface-border">
        {[
          ['Return condition', 'Items must be returned in the same condition as received. Cleaning before return is expected unless otherwise noted.'],
          ['Personal use only', 'All borrowed/rented items are for personal residential use. Commercial contractor use is prohibited.'],
          ['Contact privacy', 'Phone numbers and flat numbers are only visible to both parties after a request is accepted.'],
          ['Deposits', 'Some owners may require a deposit, displayed on the listing. Settlement is between parties — no in-app payments.'],
        ].map(([title, desc]) => (
          <div key={title as string} className="p-4">
            <p className="text-xs font-semibold text-ink">{title}</p>
            <p className="text-xs text-ink-muted mt-0.5 leading-relaxed">{desc}</p>
          </div>
        ))}
      </div>
    </div>

    {/* FAQ */}
    <div className="space-y-3">
      <h2 className="text-sm font-bold text-ink flex items-center gap-2">
        <HelpCircle className="w-4 h-4 text-ink-muted" />
        Frequently Asked
      </h2>
      <div className="bg-surface rounded-2xl border border-surface-border divide-y divide-surface-border">
        {FAQS.map(({ q, a }) => (
          <div key={q} className="p-4">
            <p className="text-xs font-semibold text-ink">{q}</p>
            <p className="text-xs text-ink-muted mt-1 leading-relaxed">{a}</p>
          </div>
        ))}
      </div>
    </div>
  </div>
);
