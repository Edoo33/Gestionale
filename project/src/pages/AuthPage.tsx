import { useState } from 'react';
import { supabase } from '@/lib/supabase';
import { Eye, EyeOff, Building2, Check, AlertCircle } from 'lucide-react';

export default function AuthPage() {
  const [mode, setMode] = useState<'login' | 'register'>('login');
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [confirmPassword, setConfirmPassword] = useState('');
  const [showPassword, setShowPassword] = useState(false);
  const [showConfirm, setShowConfirm] = useState(false);
  const [error, setError] = useState('');
  const [loading, setLoading] = useState(false);

  async function handleSubmit(e: React.FormEvent) {
    e.preventDefault();
    setError('');

    if (mode === 'register') {
      if (password !== confirmPassword) {
        setError('Le due password non coincidono. Verifica che siano identiche.');
        return;
      }
      if (password.length < 6) {
        setError('La password deve contenere almeno 6 caratteri.');
        return;
      }
    }

    setLoading(true);

    if (mode === 'register') {
      const { error: signUpError } = await supabase.auth.signUp({ email, password });
      if (signUpError) {
        setError(signUpError.message);
      }
    } else {
      const { error: signInError } = await supabase.auth.signInWithPassword({ email, password });
      if (signInError) {
        setError('Credenziali non valide. Controlla email e password.');
      }
    }

    setLoading(false);
  }

  const passwordsMatch = confirmPassword && password === confirmPassword;
  const passwordsMismatch = confirmPassword && password !== confirmPassword;

  return (
    <div className="min-h-screen flex items-center justify-center bg-[#f5f5f7] px-4">
      <div className="w-full max-w-[400px] animate-fade-in">
        <div className="flex flex-col items-center mb-10">
          <div className="w-[64px] h-[64px] bg-[#1d1d1f] rounded-[18px] flex items-center justify-center mb-5 shadow-sm">
            <Building2 className="w-8 h-8 text-white" strokeWidth={1.5} />
          </div>
          <h1 className="text-[28px] font-semibold text-[#1d1d1f] tracking-tight">ImmobiliarePro</h1>
          <p className="text-[#86868b] text-[15px] mt-1.5">Gestionale per agenzie immobiliari</p>
        </div>

        <div className="bg-white rounded-2xl shadow-sm border border-[#e5e5e7] p-7">
          <div className="flex gap-1 mb-7 bg-[#f5f5f7] rounded-[10px] p-1">
            <button
              type="button"
              onClick={() => { setMode('login'); setError(''); }}
              className={`flex-1 py-2 rounded-[8px] text-[13px] font-medium transition-all duration-200 ${
                mode === 'login' ? 'bg-white text-[#1d1d1f] shadow-sm' : 'text-[#86868b]'
              }`}
            >
              Accedi
            </button>
            <button
              type="button"
              onClick={() => { setMode('register'); setError(''); }}
              className={`flex-1 py-2 rounded-[8px] text-[13px] font-medium transition-all duration-200 ${
                mode === 'register' ? 'bg-white text-[#1d1d1f] shadow-sm' : 'text-[#86868b]'
              }`}
            >
              Registrati
            </button>
          </div>

          <form onSubmit={handleSubmit} className="space-y-4">
            <div>
              <label className="block text-[13px] font-medium text-[#1d1d1f] mb-1.5">Email</label>
              <input
                type="email"
                required
                value={email}
                onChange={(e) => setEmail(e.target.value)}
                className="w-full px-3.5 py-2.5 bg-[#f5f5f7] border border-transparent rounded-[10px] text-[15px] text-[#1d1d1f] focus:outline-none focus:bg-white focus:border-[#0071e3] focus:ring-2 focus:ring-[#0071e3]/20 transition-all"
                placeholder="nome@email.com"
              />
            </div>

            <div>
              <label className="block text-[13px] font-medium text-[#1d1d1f] mb-1.5">Password</label>
              <div className="relative">
                <input
                  type={showPassword ? 'text' : 'password'}
                  required
                  value={password}
                  onChange={(e) => setPassword(e.target.value)}
                  className="w-full px-3.5 py-2.5 pr-11 bg-[#f5f5f7] border border-transparent rounded-[10px] text-[15px] text-[#1d1d1f] focus:outline-none focus:bg-white focus:border-[#0071e3] focus:ring-2 focus:ring-[#0071e3]/20 transition-all"
                  placeholder="••••••••"
                />
                <button
                  type="button"
                  onClick={() => setShowPassword(!showPassword)}
                  className="absolute right-3 top-1/2 -translate-y-1/2 text-[#86868b] hover:text-[#1d1d1f] transition"
                >
                  {showPassword ? <EyeOff className="w-[18px] h-[18px]" strokeWidth={1.5} /> : <Eye className="w-[18px] h-[18px]" strokeWidth={1.5} />}
                </button>
              </div>
            </div>

            {mode === 'register' && (
              <div className="animate-fade-in">
                <label className="block text-[13px] font-medium text-[#1d1d1f] mb-1.5">Conferma Password</label>
                <div className="relative">
                  <input
                    type={showConfirm ? 'text' : 'password'}
                    required
                    value={confirmPassword}
                    onChange={(e) => setConfirmPassword(e.target.value)}
                    className={`w-full px-3.5 py-2.5 pr-11 bg-[#f5f5f7] border rounded-[10px] text-[15px] text-[#1d1d1f] focus:outline-none focus:ring-2 transition-all ${
                      passwordsMismatch
                        ? 'border-[#ff3b30] focus:border-[#ff3b30] focus:ring-[#ff3b30]/20'
                        : passwordsMatch
                        ? 'border-[#34c759] focus:border-[#34c759] focus:ring-[#34c759]/20'
                        : 'border-transparent focus:border-[#0071e3] focus:ring-[#0071e3]/20'
                    }`}
                    placeholder="••••••••"
                  />
                  <button
                    type="button"
                    onClick={() => setShowConfirm(!showConfirm)}
                    className="absolute right-3 top-1/2 -translate-y-1/2 text-[#86868b] hover:text-[#1d1d1f] transition"
                  >
                    {showConfirm ? <EyeOff className="w-[18px] h-[18px]" strokeWidth={1.5} /> : <Eye className="w-[18px] h-[18px]" strokeWidth={1.5} />}
                  </button>
                </div>
                {passwordsMismatch && (
                  <p className="text-[#ff3b30] text-[12px] mt-1.5 flex items-center gap-1">
                    <AlertCircle className="w-3.5 h-3.5" /> Le password non coincidono
                  </p>
                )}
                {passwordsMatch && (
                  <p className="text-[#34c759] text-[12px] mt-1.5 flex items-center gap-1">
                    <Check className="w-3.5 h-3.5" /> Le password coincidono
                  </p>
                )}
              </div>
            )}

            {error && (
              <div className="bg-[#fff2f0] border border-[#ffd0cc] text-[#ff3b30] text-[13px] rounded-[10px] px-3.5 py-3 flex items-start gap-2">
                <AlertCircle className="w-4 h-4 mt-0.5 shrink-0" />
                {error}
              </div>
            )}

            <button
              type="submit"
              disabled={loading || (mode === 'register' && password !== confirmPassword)}
              className="w-full bg-[#0071e3] text-white py-2.5 rounded-[10px] font-medium text-[15px] hover:bg-[#0077ed] active:scale-[0.98] transition-all disabled:opacity-40 disabled:cursor-not-allowed"
            >
              {loading ? 'Attendi...' : mode === 'login' ? 'Accedi' : 'Crea account'}
            </button>
          </form>
        </div>
        <p className="text-center text-[#86868b] text-[12px] mt-6">
          ImmobiliarePro — Gestione completa della tua agenzia
        </p>
      </div>
    </div>
  );
}
