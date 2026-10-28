import React, { useState, useEffect } from 'react';
import { Link, useLocation } from 'react-router-dom';
import {
  Wrench,
  Search,
  Bell,
  Clock,
  Layers,
  ChevronDown,
  User,
  Shield,
  Inbox,
  ListPlus,
  Send,
  HelpCircle,
  Menu,
  X,
} from 'lucide-react';
import { useAuth } from '../../context/AuthContext';
import { sidekitService } from '../../services';
import { AppNotification } from '@sidekit/shared';
import { NotificationDrawer } from '../notifications/NotificationDrawer';

export const Header: React.FC = () => {
  const { currentUser, allUsers, switchPersona, simulatedTime, advanceClock, resetClock } = useAuth();
  const location = useLocation();
  const [notifications, setNotifications] = useState<AppNotification[]>([]);
  const [isNotifOpen, setIsNotifOpen] = useState(false);
  const [isPersonaMenuOpen, setIsPersonaMenuOpen] = useState(false);
  const [isClockMenuOpen, setIsClockMenuOpen] = useState(false);
  const [isMobileMenuOpen, setIsMobileMenuOpen] = useState(false);

  useEffect(() => {
    const fetchNotifs = async () => {
      try {
        const list = await sidekitService.getNotifications();
        setNotifications(list);
      } catch (err) {
        console.error(err);
      }
    };
    fetchNotifs();
  }, [currentUser, isNotifOpen]);

  const unreadCount = notifications.filter((n) => !n.read).length;

  const isActive = (path: string) => {
    if (path === '/' && location.pathname === '/') return true;
    if (path !== '/' && location.pathname.startsWith(path)) return true;
    return false;
  };

  return (
    <>
      <header className="sticky top-0 z-40 bg-surface/95 backdrop-blur border-b border-surface-border">
        {/* Top Demo Banner */}
        <div className="bg-surface-secondary border-b border-surface-border text-xs px-4 py-1 flex items-center justify-between text-ink-muted">
          <div className="flex items-center gap-2">
            <span className="font-semibold text-evergreen">Palm Grove Society</span>
            <span>·</span>
            <span>Demo Simulation Environment (All listings are SAMPLE)</span>
          </div>

          <div className="flex items-center gap-3">
            {/* Clock testing popover */}
            <div className="relative">
              <button
                onClick={() => setIsClockMenuOpen(!isClockMenuOpen)}
                className="flex items-center gap-1.5 px-2 py-0.5 rounded hover:bg-surface border border-transparent hover:border-surface-border transition-colors font-mono"
                title="Simulated System Clock"
              >
                <Clock className="w-3.5 h-3.5 text-evergreen" />
                <span>{simulatedTime.toLocaleDateString('en-IN', { month: 'short', day: 'numeric', hour: '2-digit', minute: '2-digit' })}</span>
                <ChevronDown className="w-3 h-3" />
              </button>

              {isClockMenuOpen && (
                <div className="absolute right-0 mt-1 w-64 bg-surface rounded-xl shadow-lg border border-surface-border p-3 z-50 text-ink">
                  <div className="text-xs font-semibold text-ink-primary mb-2 flex items-center justify-between">
                    <span>Test System Clock</span>
                    <button
                      onClick={() => {
                        resetClock();
                        setIsClockMenuOpen(false);
                      }}
                      className="text-[10px] text-evergreen hover:underline"
                    >
                      Reset
                    </button>
                  </div>
                  <p className="text-[11px] text-ink-muted mb-3">
                    Fast-forward time to test 72h request expiry and return reminders.
                  </p>
                  <div className="grid grid-cols-2 gap-1.5">
                    <button
                      onClick={() => advanceClock(24)}
                      className="px-2 py-1 bg-surface-secondary hover:bg-surface-border rounded text-xs font-medium"
                    >
                      +24 Hours
                    </button>
                    <button
                      onClick={() => advanceClock(78)}
                      className="px-2 py-1 bg-amber-50 text-amber-800 hover:bg-amber-100 rounded text-xs font-medium"
                      title="Test 72-Hour Expiry Fixture"
                    >
                      +78 Hours (Test Expiry)
                    </button>
                  </div>
                </div>
              )}
            </div>

            {/* Admin shortcut */}
            {currentUser?.role === 'admin' ? (
              <Link to="/admin" className="text-xs text-evergreen hover:underline font-semibold flex items-center gap-1">
                <Shield className="w-3.5 h-3.5" />
                <span>Admin Panel</span>
              </Link>
            ) : (
              <Link to="/join" className="text-xs hover:text-ink transition-colors">
                Join Society
              </Link>
            )}
          </div>
        </div>

        {/* Main Navigation Bar */}
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 h-16 flex items-center justify-between gap-4">
          {/* Logo */}
          <Link to="/" className="flex items-center gap-2.5 group">
            <div className="w-9 h-9 rounded-xl bg-evergreen flex items-center justify-center text-white shadow-sm group-hover:bg-evergreen-dark transition-colors">
              <Wrench className="w-5 h-5 text-lime" />
            </div>
            <div>
              <span className="text-xl font-bold tracking-tight text-ink">Sidekit</span>
              <span className="hidden sm:inline-block ml-1.5 text-xs text-ink-muted font-normal">
                · Palm Grove
              </span>
            </div>
          </Link>

          {/* Desktop Nav Links */}
          <nav className="hidden md:flex items-center gap-1">
            <Link
              to="/plan/new"
              className={`px-3 py-2 rounded-xl text-sm font-medium transition-colors ${
                isActive('/plan')
                  ? 'bg-evergreen text-white shadow-sm'
                  : 'text-ink-primary hover:bg-surface-secondary'
              }`}
            >
              Plan a Task
            </Link>

            <Link
              to="/browse"
              className={`px-3 py-2 rounded-xl text-sm font-medium transition-colors ${
                isActive('/browse')
                  ? 'bg-evergreen-light text-evergreen-dark'
                  : 'text-ink-primary hover:bg-surface-secondary'
              }`}
            >
              Browse Catalog
            </Link>

            <Link
              to="/inbox"
              className={`px-3 py-2 rounded-xl text-sm font-medium transition-colors flex items-center gap-1.5 ${
                isActive('/inbox')
                  ? 'bg-evergreen-light text-evergreen-dark'
                  : 'text-ink-primary hover:bg-surface-secondary'
              }`}
            >
              <Inbox className="w-4 h-4" />
              <span>Owner Inbox</span>
            </Link>

            <Link
              to="/my/requests"
              className={`px-3 py-2 rounded-xl text-sm font-medium transition-colors flex items-center gap-1.5 ${
                isActive('/my/requests')
                  ? 'bg-evergreen-light text-evergreen-dark'
                  : 'text-ink-primary hover:bg-surface-secondary'
              }`}
            >
              <Send className="w-4 h-4" />
              <span>My Requests</span>
            </Link>

            <Link
              to="/my/listings"
              className={`px-3 py-2 rounded-xl text-sm font-medium transition-colors flex items-center gap-1.5 ${
                isActive('/my/listings')
                  ? 'bg-evergreen-light text-evergreen-dark'
                  : 'text-ink-primary hover:bg-surface-secondary'
              }`}
            >
              <ListPlus className="w-4 h-4" />
              <span>My Listings</span>
            </Link>

            <Link
              to="/impact"
              className={`px-3 py-2 rounded-xl text-sm font-medium transition-colors ${
                isActive('/impact')
                  ? 'bg-evergreen-light text-evergreen-dark'
                  : 'text-ink-primary hover:bg-surface-secondary'
              }`}
            >
              Impact
            </Link>

            <Link
              to="/help"
              className={`px-3 py-2 rounded-xl text-sm font-medium transition-colors flex items-center gap-1 ${
                isActive('/help')
                  ? 'bg-evergreen-light text-evergreen-dark'
                  : 'text-ink-primary hover:bg-surface-secondary'
              }`}
            >
              <HelpCircle className="w-4 h-4" />
              <span>Help</span>
            </Link>
          </nav>

          {/* Right Action Icons: Notification Bell & Persona Switcher */}
          <div className="flex items-center gap-2 sm:gap-3">
            {/* Notification Bell */}
            <button
              onClick={() => setIsNotifOpen(true)}
              className="relative p-2 rounded-xl text-ink-muted hover:text-ink hover:bg-surface-secondary transition-colors"
              aria-label="Notifications"
            >
              <Bell className="w-5 h-5" />
              {unreadCount > 0 && (
                <span className="absolute top-1 right-1 w-4 h-4 bg-red-500 text-white text-[10px] font-bold rounded-full flex items-center justify-center animate-pulse">
                  {unreadCount}
                </span>
              )}
            </button>

            {/* Persistent Demo Persona Switcher */}
            <div className="relative">
              <button
                onClick={() => setIsPersonaMenuOpen(!isPersonaMenuOpen)}
                className="flex items-center gap-2 p-1.5 pr-3 rounded-xl border border-surface-border bg-surface hover:bg-surface-secondary transition-colors text-left"
              >
                <div className="w-7 h-7 rounded-lg bg-evergreen/10 text-evergreen font-bold text-xs flex items-center justify-center">
                  {currentUser?.name.charAt(0) || 'U'}
                </div>
                <div className="hidden sm:block">
                  <div className="text-xs font-semibold text-ink leading-none">
                    {currentUser?.displayName || 'Demo User'}
                  </div>
                  <div className="text-[10px] text-ink-muted leading-tight">
                    {currentUser?.tower} ({currentUser?.flat})
                  </div>
                </div>
                <ChevronDown className="w-3.5 h-3.5 text-ink-muted ml-0.5" />
              </button>

              {/* Persona Switcher Dropdown */}
              {isPersonaMenuOpen && (
                <div className="absolute right-0 mt-2 w-72 bg-surface rounded-2xl shadow-xl border border-surface-border p-2 z-50 animate-in fade-in zoom-in-95 duration-150">
                  <div className="px-3 py-2 border-b border-surface-border mb-1.5">
                    <div className="text-xs font-bold text-ink">Demo Persona Switcher</div>
                    <div className="text-[11px] text-ink-muted">
                      Switch perspectives instantly to verify borrower, lender, and admin flows.
                    </div>
                  </div>

                  <div className="space-y-1">
                    {allUsers.slice(0, 5).map((user) => {
                      const isCurrent = user.id === currentUser?.id;
                      return (
                        <button
                          key={user.id}
                          onClick={() => {
                            switchPersona(user.id);
                            setIsPersonaMenuOpen(false);
                          }}
                          className={`w-full flex items-center gap-2.5 p-2 rounded-xl text-left text-xs transition-colors ${
                            isCurrent
                              ? 'bg-evergreen-light text-evergreen-dark font-medium'
                              : 'hover:bg-surface-secondary text-ink'
                          }`}
                        >
                          <div className="w-7 h-7 rounded-lg bg-surface border border-surface-border flex items-center justify-center font-bold text-xs text-ink">
                            {user.name.charAt(0)}
                          </div>
                          <div className="flex-1 min-w-0">
                            <div className="font-semibold truncate">
                              {user.name} ({user.displayName})
                            </div>
                            <div className="text-[10px] text-ink-muted truncate">
                              {user.tower} · {user.flat} · {user.role === 'admin' ? 'Society Admin' : 'Member'}
                            </div>
                          </div>
                          {isCurrent && (
                            <span className="w-2 h-2 rounded-full bg-evergreen" />
                          )}
                        </button>
                      );
                    })}
                  </div>

                  <div className="pt-2 mt-1 border-t border-surface-border px-2">
                    <Link
                      to="/me"
                      onClick={() => setIsPersonaMenuOpen(false)}
                      className="block text-center py-1.5 text-xs text-evergreen font-medium hover:underline"
                    >
                      View Full Profile & Stats
                    </Link>
                  </div>
                </div>
              )}
            </div>

            {/* Mobile Menu Toggle */}
            <button
              onClick={() => setIsMobileMenuOpen(!isMobileMenuOpen)}
              className="md:hidden p-2 rounded-xl text-ink-muted hover:bg-surface-secondary"
            >
              {isMobileMenuOpen ? <X className="w-5 h-5" /> : <Menu className="w-5 h-5" />}
            </button>
          </div>
        </div>

        {/* Mobile Navigation Menu */}
        {isMobileMenuOpen && (
          <div className="md:hidden border-t border-surface-border bg-surface px-4 pt-2 pb-4 space-y-1">
            <Link
              to="/plan/new"
              onClick={() => setIsMobileMenuOpen(false)}
              className="block px-3 py-2 rounded-xl text-sm font-medium text-ink hover:bg-surface-secondary"
            >
              Plan a Task
            </Link>
            <Link
              to="/browse"
              onClick={() => setIsMobileMenuOpen(false)}
              className="block px-3 py-2 rounded-xl text-sm font-medium text-ink hover:bg-surface-secondary"
            >
              Browse Catalog
            </Link>
            <Link
              to="/inbox"
              onClick={() => setIsMobileMenuOpen(false)}
              className="block px-3 py-2 rounded-xl text-sm font-medium text-ink hover:bg-surface-secondary"
            >
              Owner Inbox
            </Link>
            <Link
              to="/my/requests"
              onClick={() => setIsMobileMenuOpen(false)}
              className="block px-3 py-2 rounded-xl text-sm font-medium text-ink hover:bg-surface-secondary"
            >
              My Requests
            </Link>
            <Link
              to="/my/listings"
              onClick={() => setIsMobileMenuOpen(false)}
              className="block px-3 py-2 rounded-xl text-sm font-medium text-ink hover:bg-surface-secondary"
            >
              My Listings
            </Link>
            <Link
              to="/impact"
              onClick={() => setIsMobileMenuOpen(false)}
              className="block px-3 py-2 rounded-xl text-sm font-medium text-ink hover:bg-surface-secondary"
            >
              Society Impact
            </Link>
            <Link
              to="/help"
              onClick={() => setIsMobileMenuOpen(false)}
              className="block px-3 py-2 rounded-xl text-sm font-medium text-ink hover:bg-surface-secondary"
            >
              Help & Guidelines
            </Link>
          </div>
        )}
      </header>

      {/* Slide-over Notification Drawer */}
      <NotificationDrawer
        isOpen={isNotifOpen}
        onClose={() => setIsNotifOpen(false)}
        notifications={notifications}
        onNotificationRead={(id) => {
          sidekitService.markNotificationRead(id);
          setNotifications((prev) => prev.map((n) => (n.id === id ? { ...n, read: true } : n)));
        }}
      />
    </>
  );
};

