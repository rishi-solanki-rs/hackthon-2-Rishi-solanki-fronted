import React, { useState, useEffect } from 'react';
import { useLocation } from 'react-router-dom';
import { Download, X, Smartphone } from 'lucide-react';

// Only on browsing pages, so the banner never covers the plan pages' sticky action bars.
const PROMPT_ROUTES = new Set(['/', '/browse', '/impact', '/help']);

interface BeforeInstallPromptEvent extends Event {
  prompt: () => Promise<void>;
  userChoice: Promise<{ outcome: 'accepted' | 'dismissed' }>;
}

export const PwaInstallPrompt: React.FC = () => {
  const { pathname } = useLocation();
  const [deferredPrompt, setDeferredPrompt] = useState<BeforeInstallPromptEvent | null>(null);
  const [isDismissed, setIsDismissed] = useState(false);
  const [isInstalled, setIsInstalled] = useState(false);

  useEffect(() => {
    // Check if running in standalone PWA mode
    if (window.matchMedia('(display-mode: standalone)').matches) {
      setIsInstalled(true);
      return;
    }

    const dismissedUntil = localStorage.getItem('sidekit_pwa_dismissed');
    if (dismissedUntil && Number(dismissedUntil) > Date.now()) {
      setIsDismissed(true);
    }

    const handleBeforeInstallPrompt = (e: Event) => {
      e.preventDefault();
      setDeferredPrompt(e as BeforeInstallPromptEvent);
    };

    const handleAppInstalled = () => {
      setIsInstalled(true);
      setDeferredPrompt(null);
    };

    window.addEventListener('beforeinstallprompt', handleBeforeInstallPrompt);
    window.addEventListener('appinstalled', handleAppInstalled);

    return () => {
      window.removeEventListener('beforeinstallprompt', handleBeforeInstallPrompt);
      window.removeEventListener('appinstalled', handleAppInstalled);
    };
  }, []);

  const handleInstallClick = async () => {
    if (!deferredPrompt) return;
    await deferredPrompt.prompt();
    const { outcome } = await deferredPrompt.userChoice;
    if (outcome === 'accepted') {
      setIsInstalled(true);
    }
    setDeferredPrompt(null);
  };

  const handleDismiss = () => {
    setIsDismissed(true);
    // Dismiss for 7 days
    localStorage.setItem('sidekit_pwa_dismissed', String(Date.now() + 7 * 24 * 60 * 60 * 1000));
  };

  if (isInstalled || isDismissed || !deferredPrompt || !PROMPT_ROUTES.has(pathname)) {
    return null;
  }

  return (
    <div
      role="region"
      aria-label="Install Sidekit Application"
      className="fixed bottom-4 left-4 right-4 sm:left-auto sm:right-6 sm:w-96 z-40 bg-surface text-ink p-4 rounded-2xl border border-surface-border shadow-xl backdrop-blur-md "
    >
      <div className="flex items-start gap-3">
        <div className="w-10 h-10 rounded-xl bg-evergreen/10 text-evergreen flex items-center justify-center shrink-0">
          <Smartphone className="w-5 h-5" />
        </div>
        <div className="flex-1 min-w-0">
          <div className="flex items-center justify-between">
            <h4 className="text-xs font-bold text-ink">Install Sidekit App</h4>
            <button
              onClick={handleDismiss}
              className="p-1 text-ink-muted hover:text-ink rounded-lg transition-colors"
              aria-label="Dismiss install prompt"
            >
              <X className="w-3.5 h-3.5" />
            </button>
          </div>
          <p className="text-[11px] text-ink-muted mt-0.5 leading-snug">
            Add Sidekit to your home screen to open it like an app. Requests and listings still need an internet connection.
          </p>
          <div className="flex items-center gap-2 mt-3">
            <button
              onClick={handleInstallClick}
              className="flex-1 inline-flex items-center justify-center gap-1.5 py-1.5 px-3 bg-brand text-white hover:bg-brand-dark focus-ring rounded-lg text-xs font-semibold shadow-sm transition-colors"
            >
              <Download className="w-3.5 h-3.5" />
              <span>Install App</span>
            </button>
            <button
              onClick={handleDismiss}
              className="py-1.5 px-3 text-xs text-ink-muted hover:bg-surface-secondary rounded-lg font-medium transition-colors"
            >
              Not now
            </button>
          </div>
        </div>
      </div>
    </div>
  );
};

