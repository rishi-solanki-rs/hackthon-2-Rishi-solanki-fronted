import React, { useState } from 'react';
import { Link } from 'react-router-dom';
import { AlertCircle, CheckCircle } from 'lucide-react';
import { AdminListingAction, CATEGORY_LABELS, Listing, ListingCategory, ModerationStatus } from '@sidekit/shared';
import { sidekitService } from '../../services';
import { ItemThumb } from '../../components/brand/itemIcons';
import { SampleBadge } from '../../components/shared/SampleBadge';
import { listingPriceLabel } from '../../components/shared/listingPrice';

export const MODERATION_META: Record<ModerationStatus, { label: string; cls: string }> = {
  pending_review: { label: 'Awaiting approval', cls: 'bg-amber-50 text-amber-800 border-amber-200' },
  approved: { label: 'Approved', cls: 'bg-emerald-50 text-emerald-800 border-emerald-200' },
  reported: { label: 'Reported', cls: 'bg-orange-50 text-orange-800 border-orange-200' },
  hidden_by_admin: { label: 'Hidden', cls: 'bg-rose-50 text-rose-800 border-rose-200' },
  rejected: { label: 'Rejected', cls: 'bg-slate-100 text-slate-700 border-slate-200' },
};

export const ModerationBadge: React.FC<{ status: ModerationStatus }> = ({ status }) => {
  const meta = MODERATION_META[status];
  return <span className={`text-[10px] font-bold px-2 py-0.5 rounded border uppercase tracking-wide ${meta.cls}`}>{meta.label}</span>;
};

export const AdminPageHeader: React.FC<{ title: string; description?: string; action?: React.ReactNode }> = ({ title, description, action }) => (
  <div className="flex flex-wrap items-end justify-between gap-3">
    <div>
      <h1 className="text-xl font-bold text-ink">{title}</h1>
      {description && <p className="text-xs text-ink-muted mt-1 max-w-xl">{description}</p>}
    </div>
    {action}
  </div>
);

export const StatTile: React.FC<{ label: string; value: React.ReactNode; to?: string; tone?: 'default' | 'warn' | 'danger' }> = ({
  label,
  value,
  to,
  tone = 'default',
}) => {
  const valueCls = tone === 'warn' ? 'text-amber-700' : tone === 'danger' ? 'text-rose-700' : 'text-ink';
  const body = (
    <>
      <div className={`text-2xl font-bold tabular-nums ${valueCls}`}>{value}</div>
      <div className="text-xs text-ink-muted mt-1">{label}</div>
    </>
  );
  const cls = 'block p-4 bg-surface rounded-2xl border border-surface-border';
  return to ? (
    <Link to={to} className={`${cls} hover:border-evergreen/40 transition-colors focus-ring`}>
      {body}
    </Link>
  ) : (
    <div className={cls}>{body}</div>
  );
};

export const Notice: React.FC<{ kind: 'success' | 'error'; children: React.ReactNode }> = ({ kind, children }) =>
  kind === 'success' ? (
    <div role="status" className="flex items-center gap-2 p-3 bg-emerald-50 border border-emerald-200 rounded-xl text-xs text-emerald-800">
      <CheckCircle className="w-4 h-4 text-emerald-600 shrink-0" aria-hidden="true" />
      {children}
    </div>
  ) : (
    <div role="alert" className="flex items-start gap-2 p-3 bg-red-50 border border-red-200 rounded-xl text-xs text-red-700">
      <AlertCircle className="w-4 h-4 shrink-0 mt-0.5" aria-hidden="true" />
      {children}
    </div>
  );

export function useNotice() {
  const [notice, setNotice] = useState<{ kind: 'success' | 'error'; text: string } | null>(null);
  const show = (kind: 'success' | 'error', text: string) => {
    setNotice({ kind, text });
    if (kind === 'success') window.setTimeout(() => setNotice(null), 3500);
  };
  const node = notice ? <Notice kind={notice.kind}>{notice.text}</Notice> : null;
  return { show, node };
}

const REJECT_PRESETS = [
  'Photo or description does not match the item.',
  'Item is not allowed under the society safety policy.',
  'Price looks incorrect — please check it.',
  'Please add the item condition and pickup details.',
];

const ACTION_SUCCESS: Record<AdminListingAction, string> = {
  approve: 'Listing approved — it is now visible to neighbours.',
  restore: 'Listing restored and visible again.',
  reject: 'Listing rejected. The owner was notified with your reason.',
  hide: 'Listing hidden from neighbours.',
  remove: 'Listing removed.',
};

/** Actions an admin can take on a listing, depending on its moderation state. */
export function actionsFor(status: ModerationStatus): { action: AdminListingAction; label: string; tone: 'primary' | 'danger' | 'neutral' }[] {
  switch (status) {
    case 'pending_review':
      return [
        { action: 'approve', label: 'Approve', tone: 'primary' },
        { action: 'reject', label: 'Reject', tone: 'danger' },
      ];
    case 'reported':
      return [
        { action: 'approve', label: 'Dismiss reports', tone: 'primary' },
        { action: 'hide', label: 'Hide listing', tone: 'danger' },
      ];
    case 'approved':
      return [{ action: 'hide', label: 'Hide', tone: 'danger' }];
    case 'hidden_by_admin':
      return [{ action: 'restore', label: 'Restore', tone: 'primary' }];
    case 'rejected':
      return [{ action: 'approve', label: 'Approve anyway', tone: 'neutral' }];
  }
}

const TONE_CLS = {
  primary: 'bg-brand hover:bg-brand-dark text-white',
  danger: 'bg-danger hover:bg-danger/90 text-white',
  neutral: 'bg-surface-secondary hover:bg-surface-border text-ink border border-surface-border',
};

interface ListingModerationRowProps {
  listing: Listing;
  onDone: (message: string) => void;
  onError: (message: string) => void;
  showReports?: boolean;
}

export const ListingModerationRow: React.FC<ListingModerationRowProps> = ({ listing, onDone, onError, showReports }) => {
  const [rejecting, setRejecting] = useState(false);
  const [reason, setReason] = useState('');
  const [busy, setBusy] = useState(false);

  const run = async (action: AdminListingAction, why?: string) => {
    setBusy(true);
    try {
      await sidekitService.adminModerateListing(listing.id, action, why);
      setRejecting(false);
      setReason('');
      onDone(ACTION_SUCCESS[action]);
    } catch (err: any) {
      onError(err?.message || 'Moderation action failed.');
    } finally {
      setBusy(false);
    }
  };

  const reasonId = `reject-reason-${listing.id}`;

  return (
    <li className="p-4 sm:p-5 flex flex-col gap-3">
      <div className="flex items-start gap-3">
        <ItemThumb itemKey={listing.itemKey} title={listing.title} category={listing.category} imageUrl={listing.photos?.[0]} size={56} />
        <div className="flex-1 min-w-0 space-y-1">
          <div className="flex items-center gap-2 flex-wrap">
            <Link to={`/listing/${listing.id}`} className="text-sm font-bold text-ink hover:text-evergreen focus-ring rounded">
              {listing.title}
            </Link>
            <ModerationBadge status={listing.moderationStatus} />
            {listing.isSample && <SampleBadge />}
          </div>
          <p className="text-xs text-ink-muted">
            {listing.ownerDisplayName} · {listing.ownerTower} · {CATEGORY_LABELS[listing.category as ListingCategory] || listing.category} ·{' '}
            {listing.mode === 'lend' ? 'Lend' : listing.mode === 'rent' ? 'Rent' : 'Sell used'} · {listingPriceLabel(listing)}
          </p>
          {listing.description && <p className="text-xs text-ink-subtle line-clamp-2">{listing.description}</p>}
          {listing.rejectionReason && (
            <p className="text-xs text-ink-muted">
              <span className="font-semibold text-ink">Rejection reason:</span> {listing.rejectionReason}
            </p>
          )}
          {showReports && (listing.reportsCount || 0) > 0 && (
            <div className="text-xs text-ink-muted">
              <span className="font-semibold text-ink">{listing.reportsCount} report{listing.reportsCount === 1 ? '' : 's'}</span>
              {listing.reportReasons && listing.reportReasons.length > 0 && (
                <ul className="mt-1 list-disc pl-4 space-y-0.5">
                  {listing.reportReasons.map((r, i) => (
                    <li key={i}>{r}</li>
                  ))}
                </ul>
              )}
            </div>
          )}
        </div>
      </div>

      {rejecting ? (
        <form
          className="space-y-2 sm:pl-[68px]"
          onSubmit={(e) => {
            e.preventDefault();
            run('reject', reason);
          }}
        >
          <label htmlFor={reasonId} className="block text-xs font-semibold text-ink">
            Reason shown to the owner
          </label>
          <div className="flex flex-wrap gap-1.5">
            {REJECT_PRESETS.map((p) => (
              <button
                key={p}
                type="button"
                onClick={() => setReason(p)}
                className="text-[11px] px-2 py-1 rounded-full border border-surface-border bg-surface-secondary hover:border-evergreen/40 text-ink-muted focus-ring"
              >
                {p}
              </button>
            ))}
          </div>
          <textarea
            id={reasonId}
            value={reason}
            onChange={(e) => setReason(e.target.value)}
            maxLength={300}
            rows={2}
            required
            className="w-full text-sm rounded-xl border border-surface-border bg-surface px-3 py-2 focus-ring"
            placeholder="Explain what the owner should change"
          />
          <div className="flex gap-2">
            <button type="submit" disabled={busy || !reason.trim()} className={`px-3 py-1.5 text-xs font-semibold rounded-lg disabled:opacity-50 ${TONE_CLS.danger}`}>
              Reject listing
            </button>
            <button type="button" onClick={() => setRejecting(false)} className={`px-3 py-1.5 text-xs font-semibold rounded-lg ${TONE_CLS.neutral}`}>
              Cancel
            </button>
          </div>
        </form>
      ) : (
        <div className="flex flex-wrap gap-2 sm:pl-[68px]">
          {actionsFor(listing.moderationStatus).map(({ action, label, tone }) => (
            <button
              key={action}
              type="button"
              disabled={busy}
              onClick={() => (action === 'reject' ? setRejecting(true) : run(action))}
              className={`px-3 py-1.5 text-xs font-semibold rounded-lg transition-colors disabled:opacity-50 focus-ring ${TONE_CLS[tone]}`}
            >
              {label}
            </button>
          ))}
        </div>
      )}
    </li>
  );
};

export function formatDate(iso?: string): string {
  if (!iso) return '—';
  const d = new Date(iso);
  return Number.isNaN(d.getTime()) ? '—' : d.toLocaleDateString('en-IN', { day: 'numeric', month: 'short', year: 'numeric' });
}
