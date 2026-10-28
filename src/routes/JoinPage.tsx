import React, { useState } from 'react';
import { useNavigate } from 'react-router-dom';
import { ShieldCheck, Building, KeyRound, AlertCircle, ArrowRight } from 'lucide-react';
import { useAuth } from '../context/AuthContext';

export const JoinPage: React.FC = () => {
  const { joinSociety } = useAuth();
  const navigate = useNavigate();

  const [passcode, setPasscode] = useState('');
  const [name, setName] = useState('');
  const [email, setEmail] = useState('');
  const [phone, setPhone] = useState('');
  const [tower, setTower] = useState('Tower A');
  const [flat, setFlat] = useState('');
  const [error, setError] = useState<string | null>(null);
  const [isSubmitting, setIsSubmitting] = useState(false);

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setError(null);

    if (passcode.trim().toUpperCase() !== 'PALM2026') {
      setError('Invalid society invite code. Enter PALM2026 for Palm Grove Estate demo.');
      return;
    }

    if (!name.trim() || !phone.trim() || !flat.trim()) {
      setError('Please fill out all required fields.');
      return;
    }

    try {
      setIsSubmitting(true);
      await joinSociety({
        passcode: passcode.trim().toUpperCase(),
        name: name.trim(),
        email: email.trim() || `${name.toLowerCase().replace(/\s+/g, '.')}@example.com`,
        phone: phone.trim(),
        tower,
        flat: flat.trim(),
      });
      navigate('/');
    } catch (err: any) {
      setError(err.message || 'Failed to register with society.');
    } finally {
      setIsSubmitting(false);
    }
  };

  return (
    <div className="max-w-xl mx-auto py-10 px-4">
      <div className="bg-surface rounded-3xl p-6 sm:p-8 border border-surface-border shadow-sm space-y-6">
        <div className="space-y-2 text-center">
          <div className="w-12 h-12 rounded-2xl bg-evergreen-light text-evergreen flex items-center justify-center mx-auto mb-2">
            <Building className="w-6 h-6" />
          </div>
          <h1 className="text-2xl font-bold text-ink tracking-tight">Join Palm Grove Community</h1>
          <p className="text-xs text-ink-muted leading-relaxed">
            Sidekit is exclusive to verified apartment society residents. Use your society gate invitation code to get started.
          </p>
        </div>

        {error && (
          <div className="p-3 bg-red-50 border border-red-200 rounded-xl flex items-center gap-2 text-xs text-red-700">
            <AlertCircle className="w-4 h-4 shrink-0" />
            <span>{error}</span>
          </div>
        )}

        <form onSubmit={handleSubmit} className="space-y-4">
          <div>
            <label className="block text-xs font-semibold text-ink uppercase tracking-wider mb-1">
              Society Invite Code *
            </label>
            <div className="relative">
              <KeyRound className="w-4 h-4 text-ink-muted absolute left-3 top-3" />
              <input
                type="text"
                value={passcode}
                onChange={(e) => setPasscode(e.target.value)}
                placeholder="PALM2026"
                className="w-full pl-9 pr-3 py-2 text-sm bg-surface-secondary border border-surface-border rounded-xl focus-ring font-mono font-bold"
                required
              />
            </div>
            <span className="text-[10px] text-ink-muted mt-1 block">
              Demo code: <strong>PALM2026</strong>
            </span>
          </div>

          <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
            <div>
              <label className="block text-xs font-semibold text-ink uppercase tracking-wider mb-1">
                Full Name *
              </label>
              <input
                type="text"
                value={name}
                onChange={(e) => setName(e.target.value)}
                placeholder="Sunil Tiwari"
                className="w-full px-3 py-2 text-sm bg-surface border border-surface-border rounded-xl focus-ring"
                required
              />
            </div>

            <div>
              <label className="block text-xs font-semibold text-ink uppercase tracking-wider mb-1">
                Phone Number *
              </label>
              <input
                type="tel"
                value={phone}
                onChange={(e) => setPhone(e.target.value)}
                placeholder="+91 98765 00099"
                className="w-full px-3 py-2 text-sm bg-surface border border-surface-border rounded-xl focus-ring"
                required
              />
            </div>
          </div>

          <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
            <div>
              <label className="block text-xs font-semibold text-ink uppercase tracking-wider mb-1">
                Tower Block *
              </label>
              <select
                value={tower}
                onChange={(e) => setTower(e.target.value)}
                className="w-full px-3 py-2 text-sm bg-surface border border-surface-border rounded-xl focus-ring"
              >
                <option value="Tower A">Tower A (Maple)</option>
                <option value="Tower B">Tower B (Cedar)</option>
                <option value="Tower C">Tower C (Oak)</option>
              </select>
            </div>

            <div>
              <label className="block text-xs font-semibold text-ink uppercase tracking-wider mb-1">
                Flat Number *
              </label>
              <input
                type="text"
                value={flat}
                onChange={(e) => setFlat(e.target.value)}
                placeholder="A-302"
                className="w-full px-3 py-2 text-sm bg-surface border border-surface-border rounded-xl focus-ring"
                required
              />
            </div>
          </div>

          <div>
            <label className="block text-xs font-semibold text-ink uppercase tracking-wider mb-1">
              Email Address (Optional)
            </label>
            <input
              type="email"
              value={email}
              onChange={(e) => setEmail(e.target.value)}
              placeholder="sunil.t@example.com"
              className="w-full px-3 py-2 text-sm bg-surface border border-surface-border rounded-xl focus-ring"
            />
          </div>

          <div className="pt-2">
            <button
              type="submit"
              disabled={isSubmitting}
              className="w-full py-3 bg-evergreen hover:bg-evergreen-dark text-white rounded-xl font-semibold text-sm transition-colors flex items-center justify-center gap-2 shadow-sm disabled:opacity-50"
            >
              <span>{isSubmitting ? 'Registering...' : 'Complete Society Onboarding'}</span>
              <ArrowRight className="w-4 h-4" />
            </button>
          </div>
        </form>
      </div>
    </div>
  );
};

