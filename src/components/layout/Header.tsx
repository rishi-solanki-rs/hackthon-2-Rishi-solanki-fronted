import React, { useState, useEffect, useRef } from 'react';
import { Link, useLocation } from 'react-router-dom';
import { Bell, ChevronDown, Menu, X, Shield, Moon, Sun, Sparkles } from 'lucide-react';
import { useAuth } from '../../context/AuthContext';
import { useTheme } from '../../context/ThemeContext';
import { Logo, LogoMark } from '../brand/sidekit-logo';
import { sidekitService } from '../../services';
import { AppNotification } from '@sidekit/shared';
import { NotificationDrawer } from '../notifications/NotificationDrawer';
import { WalkthroughModal } from '../walkthrough/WalkthroughModal';

export const Header: React.FC = () => {
  const { currentUser, allUsers, switchPersona } = useAuth();
  const { theme, toggleTheme } = useTheme();
  const location = useLocation();
  const [notifications, setNotifications] = useState<AppNotification[]>([]);
  const [isNotifOpen, setIsNotifOpen] = useState(false);
  const [isPersonaOpen, setIsPersonaOpen] = useState(false);
  const [isMobileOpen, setIsMobileOpen] = useState(false);
  const [isTourOpen, setIsTourOpen] = useState(false);
  const personaRef = useRef<HTMLDivElement>(null);

  useEffect(() => {
    const handleOpenTour = () => setIsTourOpen(true);
    window.addEventListener('sidekit:open-tour', handleOpenTour);
    return () => window.removeEventListener('sidekit:open-tour', handleOpenTour);
  }, []);

  useEffect(() => {
    sidekitService.getNotifications()
      .then(setNotifications)
      .catch(() => {});
  }, [currentUser]);

  // Close persona menu on outside click
  useEffect(() => {
    const handler = (e: MouseEvent) => {
      if (personaRef.current && !personaRef.current.contains(e.target as Node)) {
        setIsPersonaOpen(false);
      }
    };
    document.addEventListener('mousedown', handler);
    return () => document.removeEventListener('mousedown', handler);
  }, []);

  // Close mobile menu on route change
  useEffect(() => {
    setIsMobileOpen(false);
  }, [location.pathname]);

  const unread = notifications.filter((n) => !n.read).length;

  const isActive = (path: string) =>
    path === '/' ? location.pathname === '/' : location.pathname.startsWith(path);

  const navLink = (to: string, label: string) => (
    <Link
      to={to}
      className={`px-3 py-1.5 rounded-lg text-sm font-medium transition-colors ${
        isActive(to)
          ? 'bg-evergreen/10 text-evergreen font-semibold'
          : 'text-ink-muted hover:text-ink hover:bg-surface-secondary'
      }`}
    >
      {label}
    </Link>
  );

  return (
    <>
      <header className="sticky top-0 z-40 bg-surface/90 backdrop-blur-sm border-b border-surface-border">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 h-14 flex items-center justify-between gap-4">
          {/* Logo */}
          <Link to="/" className="flex items-center gap-2.5 group shrink-0 focus-ring rounded-lg" aria-label="Sidekit home">
            <LogoMark size={28} className="sm:hidden" aria-hidden="true" />
            <Logo height={26} variant={theme === 'dark' ? 'reversed' : 'color'} className="hidden sm:block" aria-hidden="true" />
            <span className="hidden sm:block text-xs text-ink-subtle border-l border-surface-border pl-2.5">
              Palm Grove
            </span>
          </Link>

          {/* Desktop nav */}
          <nav className="hidden md:flex items-center gap-0.5">
            {navLink('/plan/new', 'Plan Task')}
            {navLink('/browse', 'Browse')}
            {navLink('/inbox', 'Inbox')}
            {navLink('/my/requests', 'My Requests')}
            {navLink('/my/listings', 'My Listings')}
            {navLink('/impact', 'Impact')}
          </nav>

          {/* Right controls */}
          <div className="flex items-center gap-2">
            {/* Project Walkthrough Tour button */}
            <button
              type="button"
              onClick={() => setIsTourOpen(true)}
              className="inline-flex items-center gap-1.5 px-2.5 py-1.5 rounded-lg text-xs font-semibold text-evergreen bg-evergreen/10 hover:bg-evergreen/20 transition-colors focus-ring"
              title="Interactive Walkthrough of Sidekit"
              aria-label="Start project walkthrough tour"
            >
              <Sparkles className="w-3.5 h-3.5" />
              <span className="hidden sm:inline">Tour</span>
            </button>

            <button
              type="button"
              onClick={toggleTheme}
              className="p-2 rounded-lg text-ink-muted hover:text-ink hover:bg-surface-secondary transition-colors focus-ring"
              aria-label={theme === 'dark' ? 'Switch to light theme' : 'Switch to dark theme'}
              title={theme === 'dark' ? 'Light theme' : 'Dark theme'}
            >
              {theme === 'dark' ? <Sun className="w-[18px] h-[18px]" /> : <Moon className="w-[18px] h-[18px]" />}
            </button>

            {/* Notification bell */}
            <button
              onClick={() => setIsNotifOpen(true)}
              className="relative p-2 rounded-lg text-ink-muted hover:text-ink hover:bg-surface-secondary transition-colors"
              aria-label={`${unread} unread notifications`}
            >
              <Bell className="w-4.5 h-4.5" style={{ width: '18px', height: '18px' }} />
              {unread > 0 && (
                <span className="absolute top-1 right-1 min-w-[16px] h-4 bg-danger text-white text-[10px] font-bold rounded-full flex items-center justify-center px-0.5">
                  {unread > 9 ? '9+' : unread}
                </span>
              )}
            </button>

            {/* Persona switcher */}
            <div className="relative" ref={personaRef}>
              <button
                onClick={() => setIsPersonaOpen(!isPersonaOpen)}
                className="flex items-center gap-1.5 px-2 py-1 rounded-lg border border-surface-border bg-surface hover:bg-surface-secondary transition-colors text-xs"
              >
                <div className="w-6 h-6 rounded-md bg-evergreen/10 text-evergreen font-bold text-xs flex items-center justify-center">
                  {currentUser?.name.charAt(0) || 'U'}
                </div>
                <span className="hidden sm:block font-medium text-ink max-w-[90px] truncate">
                  {currentUser?.displayName || 'Demo User'}
                </span>
                <ChevronDown className="w-3 h-3 text-ink-muted" />
              </button>

              {isPersonaOpen && (
                <div className="absolute right-0 mt-1.5 w-64 bg-surface rounded-xl shadow-xl border border-surface-border overflow-hidden z-50">
                  <div className="px-3 py-2 bg-surface-secondary border-b border-surface-border">
                    <p className="text-[11px] font-bold text-ink uppercase tracking-wider">Switch Persona</p>
                    <p className="text-[10px] text-ink-muted mt-0.5">Demo simulation only — not real auth</p>
                  </div>
                  <div className="p-1">
                    {allUsers.slice(0, 6).map((user) => {
                      const active = user.id === currentUser?.id;
                      return (
                        <button
                          key={user.id}
                          onClick={() => { switchPersona(user.id); setIsPersonaOpen(false); }}
                          className={`w-full flex items-center gap-2.5 px-2 py-2 rounded-lg text-left transition-colors text-xs ${
                            active ? 'bg-evergreen/8 text-evergreen' : 'hover:bg-surface-secondary text-ink'
                          }`}
                          style={{ background: active ? 'rgba(23,107,84,0.06)' : undefined }}
                        >
                          <div className="w-7 h-7 rounded-lg bg-surface border border-surface-border flex items-center justify-center font-bold text-xs text-ink shrink-0">
                            {user.name.charAt(0)}
                          </div>
                          <div className="flex-1 min-w-0">
                            <div className="font-semibold truncate">{user.name}</div>
                            <div className="text-[10px] text-ink-muted truncate">
                              {user.tower}
                              {user.role === 'admin' && ' · Admin'}
                            </div>
                          </div>
                          {active && <div className="w-1.5 h-1.5 rounded-full bg-brand shrink-0" />}
                        </button>
                      );
                    })}
                  </div>
                  <div className="border-t border-surface-border p-2">
                    <Link
                      to="/me"
                      onClick={() => setIsPersonaOpen(false)}
                      className="block text-center text-xs text-evergreen font-medium py-1 hover:underline"
                    >
                      My Profile →
                    </Link>
                  </div>
                </div>
              )}
            </div>

            {currentUser?.role === 'admin' && (
              <Link
                to="/admin"
                className="hidden sm:flex items-center gap-1 px-2 py-1 text-xs text-evergreen font-semibold rounded-lg hover:bg-evergreen/8 transition-colors"
                style={{ background: isActive('/admin') ? 'rgba(23,107,84,0.06)' : undefined }}
              >
                <Shield className="w-3.5 h-3.5" />
                Admin
              </Link>
            )}

            {/* Mobile hamburger */}
            <button
              onClick={() => setIsMobileOpen(!isMobileOpen)}
              className="md:hidden p-2 rounded-lg text-ink-muted hover:bg-surface-secondary"
              aria-label="Menu"
            >
              {isMobileOpen ? <X className="w-4 h-4" /> : <Menu className="w-4 h-4" />}
            </button>
          </div>
        </div>

        {/* Mobile nav */}
        {isMobileOpen && (
          <div className="md:hidden border-t border-surface-border bg-surface px-4 py-2 space-y-0.5">
            {[
              ['/plan/new', 'Plan a Task'],
              ['/browse', 'Browse Catalog'],
              ['/inbox', 'Owner Inbox'],
              ['/my/requests', 'My Requests'],
              ['/my/listings', 'My Listings'],
              ['/impact', 'Society Impact'],
              ['/me', 'My Profile'],
              ['/help', 'Help'],
              ...(currentUser?.role === 'admin' ? [['/admin', 'Admin Panel']] : []),
            ].map(([to, label]) => (
              <Link
                key={to}
                to={to}
                className={`block px-3 py-2 rounded-lg text-sm font-medium transition-colors ${
                  isActive(to) ? 'bg-evergreen/10 text-evergreen' : 'text-ink hover:bg-surface-secondary'
                }`}
              >
                {label}
              </Link>
            ))}
            <button
              type="button"
              onClick={() => {
                setIsMobileOpen(false);
                setIsTourOpen(true);
              }}
              className="w-full text-left flex items-center gap-2 px-3 py-2 rounded-lg text-sm font-semibold text-evergreen bg-evergreen/10 hover:bg-evergreen/20 transition-colors"
            >
              <Sparkles className="w-4 h-4" />
              <span>Project Walkthrough Tour</span>
            </button>
          </div>
        )}
      </header>

      <NotificationDrawer
        isOpen={isNotifOpen}
        onClose={() => setIsNotifOpen(false)}
        notifications={notifications}
        onNotificationRead={(id) => {
          sidekitService.markNotificationRead(id).catch(() => {});
          setNotifications((prev) => prev.map((n) => (n.id === id ? { ...n, read: true } : n)));
        }}
      />

      <WalkthroughModal
        isOpen={isTourOpen}
        onClose={() => setIsTourOpen(false)}
      />
    </>
  );
};
