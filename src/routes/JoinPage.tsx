import React, { useState } from 'react';
import { useNavigate } from 'react-router-dom';
import { ArrowRight, AlertCircle } from 'lucide-react';
import { useAuth } from '../context/AuthContext';
import { Illustration } from '../components/brand/sidekit-art';

export const JoinPage: React.FC = () => {
  const { joinSociety } = useAuth();
  const navigate = useNavigate();
  const [form, setForm] = useState({
    passcode: '', name: '', email: '', phone: '', tower: 'Tower A', flat: '',
  });
  const [error, setError] = useState('');
  const [isSubmitting, setIsSubmitting] = useState(false);

  const set = (k: string) => (e: React.ChangeEvent<HTMLInputElement | HTMLSelectElement>) =>
    setForm((prev) => ({ ...prev, [k]: e.target.value }));

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setError('');
    if (form.passcode.trim().toUpperCase() !== 'PALM2026') {
      setError('Invalid invite code. Use PALM2026 for Palm Grove Estate demo.');
      return;
    }
    if (!form.name.trim() || !form.phone.trim() || !form.flat.trim()) {
      setError('Please fill all required fields.');
      return;
    }
    setIsSubmitting(true);
    try {
      await joinSociety({
        passcode: 'PALM2026',
        name: form.name.trim(),
        email: form.email.trim() || `${form.name.toLowerCase().replace(/\s+/g, '.')}@example.com`,
        phone: form.phone.trim(),
        tower: form.tower,
        flat: form.flat.trim(),
      });
      navigate('/');
    } catch (err: any) { setError(err.message || 'Registration failed.'); }
    setIsSubmitting(false);
  };

  return (
    <div className="max-w-md mx-auto py-10 px-4">
      <div className="bg-surface rounded-2xl border border-surface-border p-8 space-y-6">
        {/* Header */}
        <div className="text-center space-y-3">
          <Illustration name="join-society" width={200} className="brand-art mx-auto" />
          <h1 className="text-2xl font-bold text-ink">Join Palm Grove</h1>
          <p className="text-sm text-ink-muted">Sidekit is exclusive to verified society residents.</p>
        </div>

        {error && (
          <div className="flex items-start gap-2 p-3 bg-red-50 border border-red-200 rounded-xl text-xs text-red-700">
            <AlertCircle className="w-4 h-4 shrink-0 mt-0.5" />
            {error}
          </div>
        )}

        <form onSubmit={handleSubmit} className="space-y-4">
          <div>
            <label className="block text-xs font-semibold text-ink mb-1">
              Society Invite Code *
            </label>
            <input type="text" value={form.passcode} onChange={set('passcode')}
              placeholder="PALM2026"
              className="w-full px-3 py-2.5 text-sm bg-surface-secondary border border-surface-border rounded-xl focus-ring font-mono font-bold tracking-widest"
              required />
            <p className="text-[11px] text-ink-muted mt-1">Demo code: <strong>PALM2026</strong></p>
          </div>

          <div className="grid grid-cols-2 gap-3">
            <div>
              <label className="block text-xs font-semibold text-ink mb-1">Full Name *</label>
              <input type="text" value={form.name} onChange={set('name')}
                placeholder="Sunil Tiwari"
                className="w-full px-3 py-2 text-sm bg-surface-secondary border border-surface-border rounded-xl focus-ring" required />
            </div>
            <div>
              <label className="block text-xs font-semibold text-ink mb-1">Phone *</label>
              <input type="tel" value={form.phone} onChange={set('phone')}
                placeholder="+91 98765 00099"
                className="w-full px-3 py-2 text-sm bg-surface-secondary border border-surface-border rounded-xl focus-ring" required />
            </div>
          </div>

          <div className="grid grid-cols-2 gap-3">
            <div>
              <label className="block text-xs font-semibold text-ink mb-1">Tower *</label>
              <select value={form.tower} onChange={set('tower')}
                className="w-full px-3 py-2 text-sm bg-surface-secondary border border-surface-border rounded-xl focus-ring">
                <option value="Tower A">Tower A</option>
                <option value="Tower B">Tower B</option>
                <option value="Tower C">Tower C</option>
              </select>
            </div>
            <div>
              <label className="block text-xs font-semibold text-ink mb-1">Flat *</label>
              <input type="text" value={form.flat} onChange={set('flat')}
                placeholder="A-302"
                className="w-full px-3 py-2 text-sm bg-surface-secondary border border-surface-border rounded-xl focus-ring" required />
            </div>
          </div>

          <div>
            <label className="block text-xs font-semibold text-ink mb-1">Email (optional)</label>
            <input type="email" value={form.email} onChange={set('email')}
              placeholder="sunil@example.com"
              className="w-full px-3 py-2 text-sm bg-surface-secondary border border-surface-border rounded-xl focus-ring" />
          </div>

          <button type="submit" disabled={isSubmitting}
            className="w-full py-3 bg-brand hover:bg-brand-dark text-white rounded-xl font-semibold text-sm transition-colors flex items-center justify-center gap-2 disabled:opacity-50">
            {isSubmitting ? (
              <><span className="w-4 h-4 border-2 border-white/30 border-t-white rounded-full animate-spin" />Registering...</>
            ) : (
              <><span>Complete Registration</span><ArrowRight className="w-4 h-4" /></>
            )}
          </button>
        </form>
      </div>
    </div>
  );
};
