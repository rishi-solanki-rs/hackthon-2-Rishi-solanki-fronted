import React from 'react';
import { Link } from 'react-router-dom';
import { X, ArrowRight } from 'lucide-react';
import { AppNotification, NotificationType } from '@sidekit/shared';
import { FeatureIcon, FeatureIconName } from '../brand/sidekit-icons';
import { Illustration } from '../brand/sidekit-art';

const NOTIFICATION_ICONS: Record<NotificationType, FeatureIconName> = {
  request_received: 'inbox',
  request_accepted: 'owned',
  request_declined: 'declined',
  request_cancelled: 'declined',
  handover_reminder: 'handover',
  return_due: 'pending',
  listing_reported: 'safety',
  listing_hidden: 'safety',
  listing_review: 'pending',
  listing_approved: 'owned',
  listing_rejected: 'declined',
  thank_you: 'returned',
};

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
    <div className="fixed inset-0 z-50 overflow-hidden" role="dialog" aria-modal="true" aria-labelledby="notifications-title">
      {/* Backdrop */}
      <div
        className="absolute inset-0 bg-black/40 backdrop-blur-sm transition-opacity"
        onClick={onClose}
      />

      <div className="fixed inset-y-0 right-0 max-w-full flex pl-10">
        <div className="w-screen max-w-md bg-surface shadow-2xl flex flex-col border-l border-surface-border">
          {/* Header */}
          <div className="p-4 sm:p-6 border-b border-surface-border flex items-center justify-between">
            <div className="flex items-center gap-2">
              <FeatureIcon name="inbox" size={22} />
              <h2 id="notifications-title" className="text-lg font-bold text-ink">Notifications</h2>
              <span className="text-xs bg-surface-secondary px-2 py-0.5 rounded-full font-semibold text-ink-muted">
                {notifications.filter((n) => !n.read).length} Unread
              </span>
            </div>
            <button
              onClick={onClose}
              className="p-1 rounded-lg text-ink-muted hover:bg-surface-secondary focus-ring"
              aria-label="Close notifications"
            >
              <X className="w-5 h-5" />
            </button>
          </div>

          {/* List */}
          <div className="flex-1 overflow-y-auto p-4 sm:p-6 space-y-3">
            {notifications.length === 0 ? (
              <div className="text-center py-10 space-y-3">
                <Illustration name="inbox-empty" width={160} className="brand-art mx-auto" />
                <p className="text-sm text-ink-muted">No notifications right now.</p>
              </div>
            ) : (
              notifications.map((notif) => {
                const getIcon = () => <FeatureIcon name={NOTIFICATION_ICONS[notif.type] || 'pending'} size={18} />;

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
                            {new Date(notif.createdAt).toLocaleString([], { day: 'numeric', month: 'short', hour: '2-digit', minute: '2-digit' })}
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

