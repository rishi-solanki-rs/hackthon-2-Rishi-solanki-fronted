import React from 'react';
import { Link } from 'react-router-dom';
import { Wrench } from 'lucide-react';

export const Footer: React.FC = () => (
  <footer className="border-t border-surface-border mt-auto">
    <div className="max-w-7xl mx-auto px-4 sm:px-6 py-8 flex flex-col sm:flex-row items-center justify-between gap-4 text-xs text-ink-muted">
      <div className="flex items-center gap-2">
        <div className="w-6 h-6 rounded-lg bg-evergreen flex items-center justify-center">
          <Wrench className="w-3.5 h-3.5 text-white" />
        </div>
        <span className="font-semibold text-ink">Sidekit</span>
        <span className="text-ink-subtle">· Palm Grove Estate</span>
      </div>
      <div className="flex items-center gap-4">
        <Link to="/help" className="hover:text-ink transition-colors">Guidelines</Link>
        <Link to="/impact" className="hover:text-ink transition-colors">Impact</Link>
        <Link to="/admin" className="hover:text-ink transition-colors">Admin</Link>
        <span className="text-ink-subtle">© 2026 Community Demo</span>
      </div>
    </div>
  </footer>
);
