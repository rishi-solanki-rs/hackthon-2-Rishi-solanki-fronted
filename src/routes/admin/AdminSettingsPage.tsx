import React, { useEffect, useState } from 'react';
import { RefreshCw } from 'lucide-react';
import { AdminSettings } from '@sidekit/shared';
import { sidekitService } from '../../services';
import { BrandLoader } from '../../components/brand/BrandStates';
import { AdminPageHeader, useNotice } from './adminUi';

export const AdminSettingsPage: React.FC = () => {
  const [settings, setSettings] = useState<AdminSettings | null>(null);
  const [resetting, setResetting] = useState(false);
  const { show, node } = useNotice();

  useEffect(() => {
    sidekitService.getAdminSettings().then(setSettings).catch((e) => show('error', e?.message || 'Could not load settings.'));
  }, []);

  const handleReset = async () => {
    if (!window.confirm('Reset all demo data to the seed fixtures? This removes every request, plan and listing created since seeding.')) return;
    setResetting(true);
    try {
      await sidekitService.resetToFactorySeed();
      show('success', 'Demo data reset to the seed fixtures. Reloading…');
      window.setTimeout(() => window.location.reload(), 1000);
    } catch (err: any) {
      show('error', err?.message || 'Reset failed.');
      setResetting(false);
    }
  };

  const rows: [string, React.ReactNode][] = settings
    ? [
        ['New listings need approval', settings.newListingsRequireApproval ? 'Yes — resident listings start private' : 'No'],
        ['Auto-hide after reports', `${settings.autoHideReportThreshold} different residents`],
        ['Unanswered requests expire after', `${settings.pendingExpiryHours} hours`],
        ['Society invite code', <code key="code" className="font-mono text-xs px-1.5 py-0.5 rounded bg-surface-secondary">{settings.inviteCode}</code>],
        ['Task assistant', settings.aiEnabled ? `Gemini (${settings.aiModel}) with template fallback` : 'Template checklists (AI off)'],
      ]
    : [];

  return (
    <>
      <AdminPageHeader
        title="Settings"
        description="These rules are enforced by the server, not by the AI. They are fixed for this demo."
      />
      {node}
      {!settings ? (
        <BrandLoader label="Loading settings…" />
      ) : (
        <dl className="bg-surface rounded-2xl border border-surface-border divide-y divide-surface-border">
          {rows.map(([label, value]) => (
            <div key={label} className="px-5 py-3 flex flex-col sm:flex-row sm:items-center sm:justify-between gap-1">
              <dt className="text-sm text-ink-muted">{label}</dt>
              <dd className="text-sm font-semibold text-ink">{value}</dd>
            </div>
          ))}
        </dl>
      )}

      <div className="p-5 rounded-2xl border border-rose-200 bg-rose-50/60 space-y-2">
        <h2 className="text-sm font-bold text-rose-800">Reset demo data</h2>
        <p className="text-xs text-rose-800/80">
          Restores the SAMPLE residents, listings and requests. Use it before a demo or after testing.
        </p>
        <button
          type="button"
          onClick={handleReset}
          disabled={resetting}
          className="inline-flex items-center gap-1.5 px-4 py-2 bg-danger hover:bg-danger/90 text-white rounded-xl text-xs font-semibold disabled:opacity-60 focus-ring"
        >
          <RefreshCw className={`w-3.5 h-3.5 ${resetting ? 'animate-spin motion-reduce:animate-none' : ''}`} aria-hidden="true" />
          Reset demo data
        </button>
      </div>
    </>
  );
};
