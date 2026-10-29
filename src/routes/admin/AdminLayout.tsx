import React, { useCallback, useEffect, useState } from 'react';
import { NavLink, Outlet } from 'react-router-dom';
import { LayoutDashboard, ClipboardCheck, Flag, Package, Users, ArrowLeftRight, Trophy, Settings, BellRing } from 'lucide-react';
import { useAuth } from '../../context/AuthContext';
import { sidekitService } from '../../services';
import { FeatureIcon } from '../../components/brand/sidekit-icons';

export interface AdminOutletContext {
  /** Re-reads the pending/reported counts shown in the navigation. */
  refreshCounts: () => void;
}

const NAV = [
  { to: '/admin', label: 'Overview', icon: LayoutDashboard, end: true },
  { to: '/admin/approvals', label: 'Approvals', icon: ClipboardCheck, count: 'pending' as const },
  { to: '/admin/reports', label: 'Reports', icon: Flag, count: 'reported' as const },
  { to: '/admin/wanted', label: 'Wanted', icon: BellRing, count: 'wanted' as const },
  { to: '/admin/listings', label: 'Listings', icon: Package },
  { to: '/admin/users', label: 'Residents', icon: Users },
  { to: '/admin/requests', label: 'Requests', icon: ArrowLeftRight },
  { to: '/admin/leaderboard', label: 'Leaderboard', icon: Trophy },
  { to: '/admin/settings', label: 'Settings', icon: Settings },
];

export const AdminLayout: React.FC = () => {
  const { currentUser } = useAuth();
  const [counts, setCounts] = useState({ pending: 0, reported: 0, wanted: 0 });
  const isAdmin = currentUser?.role === 'admin';

  const refreshCounts = useCallback(() => {
    if (!isAdmin) return;
    sidekitService
      .getAdminQueue()
      .then((q) => setCounts((c) => ({ ...c, pending: q.pendingListings.length, reported: q.reportedListings.length + q.hiddenListings.length })))
      .catch(() => undefined);
    sidekitService
      .getAdminWanted()
      .then((w) => setCounts((c) => ({ ...c, wanted: w.filter((i) => i.status === 'open').length })))
      .catch(() => undefined);
  }, [isAdmin]);

  useEffect(() => {
    refreshCounts();
  }, [refreshCounts, currentUser?.id]);

  if (currentUser && !isAdmin) {
    return (
      <div className="max-w-2xl mx-auto py-20 text-center space-y-4 px-4">
        <FeatureIcon name="safety" size={56} className="mx-auto" />
        <h1 className="text-xl font-bold text-ink">Admin access only</h1>
        <p className="text-sm text-ink-muted max-w-sm mx-auto">
          Switch to the <strong>Estate Office</strong> persona in the top-right persona menu to open the admin console.
          This is a demo role switch, not real authentication.
        </p>
      </div>
    );
  }

  return (
    <div className="max-w-6xl mx-auto px-4 py-6 lg:py-8 lg:grid lg:grid-cols-[200px_1fr] lg:gap-8">
      <aside className="mb-5 lg:mb-0">
        <div className="hidden lg:flex items-center gap-2 text-xs font-semibold text-evergreen mb-3 px-3">
          <FeatureIcon name="safety" size={16} />
          Estate Office console
        </div>
        <nav aria-label="Admin sections" className="-mx-4 px-4 lg:mx-0 lg:px-0 overflow-x-auto">
          <ul className="flex lg:flex-col gap-1 min-w-max lg:min-w-0">
            {NAV.map(({ to, label, icon: Icon, end, count }) => {
              const badge = count ? counts[count] : 0;
              return (
                <li key={to}>
                  <NavLink
                    to={to}
                    end={end}
                    className={({ isActive }) =>
                      `flex items-center gap-2 px-3 py-2 rounded-xl text-sm font-medium whitespace-nowrap transition-colors focus-ring ${
                        isActive ? 'bg-evergreen/10 text-evergreen' : 'text-ink-muted hover:text-ink hover:bg-surface-secondary'
                      }`
                    }
                  >
                    <Icon className="w-4 h-4 shrink-0" aria-hidden="true" />
                    <span>{label}</span>
                    {badge > 0 && (
                      <span className="ml-auto text-[10px] font-bold min-w-[18px] h-[18px] px-1 rounded-full bg-amber-100 text-amber-800 inline-flex items-center justify-center">
                        {badge}
                        <span className="sr-only"> waiting</span>
                      </span>
                    )}
                  </NavLink>
                </li>
              );
            })}
          </ul>
        </nav>
      </aside>
      <section className="min-w-0 space-y-6">
        <Outlet context={{ refreshCounts } satisfies AdminOutletContext} />
      </section>
    </div>
  );
};
