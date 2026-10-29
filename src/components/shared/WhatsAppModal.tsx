import React from 'react';
import { MessageSquare, X, ShieldAlert } from 'lucide-react';

interface WhatsAppModalProps {
  isOpen: boolean;
  onClose: () => void;
  contactName: string;
  phone: string;
  itemTitle: string;
}

export const WhatsAppModal: React.FC<WhatsAppModalProps> = ({
  isOpen,
  onClose,
  contactName,
  phone,
  itemTitle,
}) => {
  if (!isOpen) return null;

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/50 backdrop-blur-sm">
      <div className="bg-surface rounded-2xl max-w-md w-full p-6 shadow-xl border border-surface-border animate-in fade-in zoom-in-95 duration-200">
        <div className="flex items-center justify-between pb-3 border-b border-surface-border">
          <div className="flex items-center gap-2 text-evergreen font-semibold">
            <MessageSquare className="w-5 h-5 text-evergreen" />
            <span>Simulated WhatsApp Channel</span>
          </div>
          <button
            onClick={onClose}
            className="p-1 rounded-lg text-ink-muted hover:bg-surface-secondary transition-colors"
          >
            <X className="w-5 h-5" />
          </button>
        </div>

        <div className="mt-4 space-y-4">
          <div className="p-3 bg-evergreen-light/60 rounded-xl border border-evergreen/20 text-sm text-ink space-y-1">
            <div className="font-medium text-evergreen-dark">Contacting: {contactName}</div>
            <div className="text-xs text-ink-muted font-mono">Phone: {phone}</div>
            <div className="text-xs text-ink-muted">Subject: Coordination for {itemTitle}</div>
          </div>

          <div className="p-4 bg-surface-secondary rounded-xl text-xs space-y-2 border border-surface-border">
            <div className="font-semibold text-ink flex items-center gap-1.5">
              <ShieldAlert className="w-4 h-4 text-amber-600" />
              Demo Privacy Protection Notice
            </div>
            <p className="text-ink-muted leading-relaxed">
              In this demo evaluation environment, live external redirection to <code>wa.me</code> is intentionally disabled to protect personal privacy and phone numbers.
            </p>
            <p className="text-ink-muted leading-relaxed">
              In production, this button launches an encrypted WhatsApp chat with pre-filled pickup coordination details.
            </p>
          </div>

          <div className="pt-2">
            <button
              onClick={onClose}
              className="w-full py-2.5 px-4 bg-brand hover:bg-brand-dark text-white rounded-xl font-medium transition-colors shadow-sm"
            >
              Close Simulation
            </button>
          </div>
        </div>
      </div>
    </div>
  );
};

