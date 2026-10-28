import React from 'react';
import { Link } from 'react-router-dom';
import { X, Bell, CheckCircle, Clock, AlertTriangle, ArrowRight } from 'lucide-react';
import { AppNotification } from '@sidekit/shared';

interface NotificationDrawerProps {
  isOpen: boolean;
  onClose: () => void;
  notifications: AppNotification[];
  onNotificationRead: (id: string) => void;
}

export const NotificationDrawer: React.FC<NotificationDrawerProps> = ({
  isOpen,
  onClose,
  notifications,
  onNotificationRead,
}) => {
  if (!isOpen) return null;

  return (
    <div className="fixed inset-0 z-50 overflow-hidden">
      {/* Backdrop */}
      <div
        className="absolute inset-0 bg-ink/30 backdrop-blur-sm transition-opacity"
        onClick={onClose}
      />

      <div className="fixed inset-y-0 right-0 max-w-full flex pl-10">
        <div className="w-screen max-w-md bg-surface shadow-2xl flex flex-col border-l border-surface-border">
          {/* Header */}
          <div className="p-4 sm:p-6 border-b border-surface-border flex items-center justify-between">
            <div className="flex items-center gap-2">
              <Bell className="w-5 h-5 text-evergreen" />
              <h2 className="text-lg font-bold text-ink">Notifications</h2>
              <span className="text-xs bg-surface-secondary px-2 py-0.5 rounded-full font-semibold text-ink-muted">
                {notifications.filter((n) => !n.read).length} Unread
              </span>
            </div>
            <button
              onClick={onClose}
              className="p-1 rounded-lg text-ink-muted hover:bg-surface-secondary"
            >
              <X className="w-5 h-5" />
            </button>
          </div>

          {/* List */}
          <div className="flex-1 overflow-y-auto p-4 sm:p-6 space-y-3">
            {notifications.length === 0 ? (
              <div className="text-center py-12 text-ink-muted text-sm">
                No notifications right now.
              </div>
            ) : (
              notifications.map((notif) => {
                const getIcon = () => {
                  switch (notif.type) {
                    case 'request_accepted':
                      return <CheckCircle className="w-4 h-4 text-emerald-600" />;
                    case 'request_cancelled':
                    case 'request_declined':
                      return <AlertTriangle className="w-4 h-4 text-rose-500" />;
                    default:
                      return <Clock className="w-4 h-4 text-evergreen" />;
                  }
                };

                return (
                  <div
                    key={notif.id}
                    className={`p-3.5 rounded-xl border transition-all ${
                      notif.read
                        ? 'bg-surface border-surface-border opacity-75'
                        : 'bg-evergreen-light/40 border-evergreen/20'
                    }`}
                  >
                    <div className="flex items-start gap-2.5">
                      <div className="p-1.5 bg-surface rounded-lg border border-surface-border mt-0.5">
                        {getIcon()}
                      </div>
                      <div className="flex-1 min-w-0">
                        <div className="flex items-center justify-between gap-1">
                          <h4 className="text-xs font-bold text-ink truncate">{notif.title}</h4>
                          <span className="text-[10px] text-ink-muted">
                            {new Date(notif.createdAt).toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' })}
                          </span>
                        </div>
                        <p className="text-xs text-ink-muted mt-0.5 leading-relaxed">{notif.message}</p>

                        <div className="mt-2 flex items-center justify-between pt-1">
                          {notif.link && (
                            <Link
                              to={notif.link}
                              onClick={() => {
                                onNotificationRead(notif.id);
                                onClose();
                              }}
                              className="text-[11px] font-semibold text-evergreen hover:underline flex items-center gap-1"
                            >
                              <span>View details</span>
                              <ArrowRight className="w-3 h-3" />
                            </Link>
                          )}
                          {!notif.read && (
                            <button
                              onClick={() => onNotificationRead(notif.id)}
                              className="text-[10px] text-ink-muted hover:text-ink font-medium"
                            >
                              Mark as read
                            </button>
                          )}
                        </div>
                      </div>
                    </div>
                  </div>
                );
              })
            )}
          </div>
        </div>
      </div>
    </div>
  );
};

