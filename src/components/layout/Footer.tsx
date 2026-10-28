import React from 'react';
import { Link } from 'react-router-dom';
import { Wrench, Heart, Shield, RefreshCw } from 'lucide-react';
import { sidekitService } from '../../services';

export const Footer: React.FC = () => {
  const handleResetData = async () => {
    if (window.confirm('Reset all demo state back to pristine factory fixtures? All test loans and custom listings will be restored.')) {
      await sidekitService.resetToFactorySeed();
      window.location.reload();
    }
  };

  return (
    <footer className="bg-surface border-t border-surface-border mt-auto">
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-10">
        <div className="grid grid-cols-1 md:grid-cols-4 gap-8">
          {/* Brand & Society statement */}
          <div className="md:col-span-2 space-y-3">
            <div className="flex items-center gap-2">
              <div className="w-7 h-7 rounded-lg bg-evergreen flex items-center justify-center text-lime">
                <Wrench className="w-4 h-4" />
              </div>
              <span className="text-lg font-bold text-ink">Sidekit</span>
            </div>
            <p className="text-xs text-ink-muted leading-relaxed max-w-sm">
              Hyper-local asset sharing and task planning for apartment societies. Borrow, rent, or buy pre-owned tools and equipment directly from trusted neighbours in Palm Grove Estate.
            </p>
            <div className="flex items-center gap-2 text-[11px] text-ink-subtle">
              <span>All mock listings show</span>
              <span className="px-1.5 py-0.5 rounded bg-surface-secondary text-[10px] font-bold text-ink-muted uppercase border border-surface-border">
                SAMPLE
              </span>
              <span>· Zero fake payments or phantom inventory</span>
            </div>
          </div>

          {/* Quick links */}
          <div className="space-y-2">
            <h4 className="text-xs font-bold uppercase tracking-wider text-ink">Platform</h4>
            <ul className="space-y-1.5 text-xs text-ink-muted">
              <li>
                <Link to="/plan/new" className="hover:text-evergreen">Task Interpreter</Link>
              </li>
              <li>
                <Link to="/browse" className="hover:text-evergreen">Community Catalog</Link>
              </li>
              <li>
                <Link to="/my/listings/new" className="hover:text-evergreen">List an Item</Link>
              </li>
              <li>
                <Link to="/impact" className="hover:text-evergreen">Society Impact</Link>
              </li>
              <li>
                <Link to="/help" className="hover:text-evergreen">Safety & Guidelines</Link>
              </li>
            </ul>
          </div>

          {/* Developer & Test Controls */}
          <div className="space-y-2">
            <h4 className="text-xs font-bold uppercase tracking-wider text-ink">Evaluation & Admin</h4>
            <ul className="space-y-1.5 text-xs text-ink-muted">
              <li>
                <Link to="/admin" className="hover:text-evergreen flex items-center gap-1">
                  <Shield className="w-3.5 h-3.5" />
                  <span>Admin Moderation</span>
                </Link>
              </li>
              <li>
                <button
                  onClick={handleResetData}
                  className="text-rose-600 hover:text-rose-700 font-medium flex items-center gap-1"
                  title="Reset localStorage fixtures"
                >
                  <RefreshCw className="w-3.5 h-3.5" />
                  <span>Reset Sample Data</span>
                </button>
              </li>
            </ul>
          </div>
        </div>

        <div className="pt-8 mt-8 border-t border-surface-border flex flex-col sm:flex-row items-center justify-between text-xs text-ink-subtle gap-2">
          <div>© 2026 Sidekit · Palm Grove Resident Welfare Association</div>
          <div className="flex items-center gap-1">
            <span>Built with care for cooperative urban communities</span>
          </div>
        </div>
      </div>
    </footer>
  );
};

