import React, { useEffect, useState } from 'react';
import { Link, useSearchParams } from 'react-router-dom';
import { Request, RequestStatus } from '@sidekit/shared';
import { sidekitService } from '../../services';
import { BrandLoader, EmptyState } from '../../components/brand/BrandStates';
import { ItemThumb } from '../../components/brand/itemIcons';
import { requestTotalLabel } from '../../components/shared/listingPrice';
import { AdminPageHeader, Notice, formatDate } from './adminUi';

export const REQUEST_STATUS_LABELS: Record<RequestStatus, string> = {
  pending: 'Pending',
  accepted: 'Accepted',
  handed_over: 'Handed over',
  completed: 'Completed',
  declined: 'Declined',
  cancelled: 'Cancelled',
};

const STATUS_CLS: Record<RequestStatus, string> = {
  pending: 'bg-amber-50 text-amber-800 border-amber-200',
  accepted: 'bg-blue-50 text-blue-800 border-blue-200',
  handed_over: 'bg-purple-50 text-purple-800 border-purple-200',
  completed: 'bg-emerald-50 text-emerald-800 border-emerald-200',
  declined: 'bg-slate-100 text-slate-700 border-slate-200',
  cancelled: 'bg-slate-100 text-slate-700 border-slate-200',
};

const KIND_LABEL = { borrow: 'Borrow', rent: 'Rent', buy: 'Buy used' } as const;

export const AdminRequestsPage: React.FC = () => {
  const [params, setParams] = useSearchParams();
  const status = (params.get('status') as RequestStatus | null) || 'all';
  const [requests, setRequests] = useState<Request[] | null>(null);
  const [error, setError] = useState('');

  useEffect(() => {
    setRequests(null);
    sidekitService.getAdminRequests(status).then(setRequests).catch((e) => setError(e?.message || 'Could not load requests.'));
  }, [status]);

  const filters: (RequestStatus | 'all')[] = ['all', 'pending', 'accepted', 'handed_over', 'completed', 'declined', 'cancelled'];

  return (
    <>
      <AdminPageHeader
        title="Requests"
        description="Read-only view of every borrow, rent and buy request. Only the two residents involved can act on a request."
      />
      {error && <Notice kind="error">{error}</Notice>}
      <div className="flex flex-wrap gap-1.5" role="group" aria-label="Filter by status">
        {filters.map((s) => (
          <button
            key={s}
            type="button"
            aria-pressed={status === s}
            onClick={() => setParams(s === 'all' ? {} : { status: s })}
            className={`px-3 py-1.5 rounded-full text-xs font-semibold border focus-ring ${
              status === s ? 'bg-evergreen/10 text-evergreen border-evergreen/30' : 'bg-surface text-ink-muted border-surface-border hover:text-ink'
            }`}
          >
            {s === 'all' ? 'All' : REQUEST_STATUS_LABELS[s]}
          </button>
        ))}
      </div>

      <div className="bg-surface rounded-2xl border border-surface-border overflow-hidden">
        {!requests ? (
          <BrandLoader label="Loading requests…" />
        ) : requests.length === 0 ? (
          <EmptyState illustration="no-requests" title="No requests here" width={160} />
        ) : (
          <ul className="divide-y divide-surface-border">
            {requests.map((r) => (
              <li key={r.id} className="px-5 py-3 flex items-start gap-3">
                <ItemThumb itemKey="" title={r.listingTitle || 'Item'} category={r.listingCategory} size={44} />
                <div className="flex-1 min-w-0 space-y-0.5">
                  <div className="flex items-center gap-2 flex-wrap">
                    <Link to={`/listing/${r.listingId}`} className="text-sm font-semibold text-ink hover:text-evergreen truncate">
                      {r.listingTitle}
                    </Link>
                    <span className={`text-[10px] font-bold px-2 py-0.5 rounded border uppercase ${STATUS_CLS[r.status]}`}>
                      {REQUEST_STATUS_LABELS[r.status]}
                    </span>
                  </div>
                  <p className="text-xs text-ink-muted">
                    {r.requesterName} ({r.requesterTower}) → {r.ownerName} ({r.ownerTower}) · {KIND_LABEL[r.kind]} ×{r.requestedQuantity} ·{' '}
                    {requestTotalLabel(r)}
                  </p>
                  <p className="text-xs text-ink-subtle">
                    {r.neededFrom ? `${formatDate(r.neededFrom)} – ${formatDate(r.neededTo)} · ` : ''}Created {formatDate(r.createdAt)}
                  </p>
                  {(r.declineReason || r.cancellationReason) && (
                    <p className="text-xs text-ink-muted italic">{r.declineReason || r.cancellationReason}</p>
                  )}
                </div>
              </li>
            ))}
          </ul>
        )}
      </div>
    </>
  );
};
