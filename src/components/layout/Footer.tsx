import React from 'react';
import { Link } from 'react-router-dom';
import { useAuth } from '../../context/AuthContext';
import { LogoMark } from '../brand/sidekit-logo';

export const Footer: React.FC = () => {
  const { currentUser } = useAuth();
  return (
    <footer className="border-t border-surface-border mt-auto">
      <div className="max-w-7xl mx-auto px-4 sm:px-6 py-8 flex flex-col sm:flex-row items-center justify-between gap-4 text-xs text-ink-muted">
        <div className="flex items-center gap-2">
          <LogoMark size={24} aria-hidden="true" />
          <span className="font-semibold text-ink">Sidekit</span>
          <span className="text-ink-subtle">· Palm Grove Estate</span>
        </div>
        <div className="flex items-center gap-4">
          <Link to="/help" className="hover:text-ink transition-colors">Guidelines</Link>
          <Link to="/impact" className="hover:text-ink transition-colors">Impact</Link>
          {currentUser?.role === 'admin' && (
            <Link to="/admin" className="hover:text-ink transition-colors">Admin</Link>
          )}
          <span className="text-ink-subtle">© 2026 Community Demo</span>
        </div>
      </div>
    </footer>
  );
};
