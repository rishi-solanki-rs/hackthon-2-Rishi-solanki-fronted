import React, { useCallback, useEffect, useState } from 'react';
import { useOutletContext } from 'react-router-dom';
import { Listing } from '@sidekit/shared';
import { sidekitService } from '../../services';
import { BrandLoader, EmptyState } from '../../components/brand/BrandStates';
import { AdminPageHeader, ListingModerationRow, useNotice } from './adminUi';
import type { AdminOutletContext } from './AdminLayout';

export const AdminApprovalsPage: React.FC = () => {
  const { refreshCounts } = useOutletContext<AdminOutletContext>();
  const [listings, setListings] = useState<Listing[] | null>(null);
  const { show, node } = useNotice();

  const load = useCallback(() => {
    sidekitService
      .getAdminListings({ moderation: 'pending_review' })
      .then(setListings)
      .catch((e) => show('error', e?.message || 'Could not load the approval queue.'));
  }, []);

  useEffect(load, [load]);

  const done = (msg: string) => {
    show('success', msg);
    load();
    refreshCounts();
  };

  return (
    <>
      <AdminPageHeader
        title="Approvals"
        description="New resident listings stay private until you approve them. Rejected listings go back to the owner with your reason; editing resubmits them."
      />
      {node}
      <div className="bg-surface rounded-2xl border border-surface-border overflow-hidden">
        {!listings ? (
          <BrandLoader label="Loading approval queue…" />
        ) : listings.length === 0 ? (
          <EmptyState illustration="inbox-empty" title="Nothing to approve" description="New listings from residents will appear here." width={180} />
        ) : (
          <ul className="divide-y divide-surface-border">
            {listings.map((l) => (
              <ListingModerationRow key={l.id} listing={l} onDone={done} onError={(m) => show('error', m)} />
            ))}
          </ul>
        )}
      </div>
    </>
  );
};
