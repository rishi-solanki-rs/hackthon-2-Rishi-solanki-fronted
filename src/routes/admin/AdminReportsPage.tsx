import React, { useCallback, useEffect, useState } from 'react';
import { useOutletContext } from 'react-router-dom';
import { AdminQueueData, AdminSettings } from '@sidekit/shared';
import { sidekitService } from '../../services';
import { BrandLoader, EmptyState } from '../../components/brand/BrandStates';
import { AdminPageHeader, ListingModerationRow, useNotice } from './adminUi';
import type { AdminOutletContext } from './AdminLayout';

export const AdminReportsPage: React.FC = () => {
  const { refreshCounts } = useOutletContext<AdminOutletContext>();
  const [queue, setQueue] = useState<AdminQueueData | null>(null);
  const [settings, setSettings] = useState<AdminSettings | null>(null);
  const { show, node } = useNotice();

  const load = useCallback(() => {
    sidekitService
      .getAdminQueue()
      .then(setQueue)
      .catch((e) => show('error', e?.message || 'Could not load reports.'));
  }, []);

  useEffect(() => {
    load();
    sidekitService.getAdminSettings().then(setSettings).catch(() => undefined);
  }, [load]);

  const done = (msg: string) => {
    show('success', msg);
    load();
    refreshCounts();
  };

  const sections = queue
    ? [
        { title: 'Reported by residents', items: queue.reportedListings, empty: 'No open reports.' },
        { title: 'Hidden', items: queue.hiddenListings, empty: 'No hidden listings.' },
      ]
    : [];

  return (
    <>
      <AdminPageHeader
        title="Reports"
        description={`Listings reported by ${settings?.autoHideReportThreshold ?? 3} different residents are hidden automatically until you review them.`}
      />
      {node}
      {!queue ? (
        <BrandLoader label="Loading reports…" />
      ) : (
        sections.map((s) => (
          <div key={s.title} className="bg-surface rounded-2xl border border-surface-border overflow-hidden">
            <div className="px-5 py-3 border-b border-surface-border flex items-center justify-between">
              <h2 className="text-sm font-bold text-ink">{s.title}</h2>
              <span className="text-xs text-ink-muted">{s.items.length}</span>
            </div>
            {s.items.length === 0 ? (
              <EmptyState illustration="inbox-empty" title="All clear" description={s.empty} width={140} />
            ) : (
              <ul className="divide-y divide-surface-border">
                {s.items.map((l) => (
                  <ListingModerationRow key={l.id} listing={l} onDone={done} onError={(m) => show('error', m)} showReports />
                ))}
              </ul>
            )}
          </div>
        ))
      )}
    </>
  );
};
