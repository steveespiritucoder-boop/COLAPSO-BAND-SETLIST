import React, { useState } from 'react';
import { Lock, ShieldAlert, ArrowLeft, KeyRound, Loader2 } from 'lucide-react';
import { ColapsoLogo } from './ColapsoLogo';

interface AdminLoginProps {
  onSuccess: () => void;
  onCancel: () => void;
}

export const AdminLogin: React.FC<AdminLoginProps> = ({ onSuccess, onCancel }) => {
  const [password, setPassword] = useState('');
  const [error, setError] = useState('');
  const [loading, setLoading] = useState(false);

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!password.trim()) {
      setError('Por favor ingresa la contraseña.');
      return;
    }

    setLoading(true);
    setError('');

    try {
      // Secure server-side verification: prevents bypassing by inspecting elements or JS state
      const res = await fetch('/api/admin/verify', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ password: password.trim() }),
      });

      const data = await res.json();
      if (res.ok && data.success) {
        sessionStorage.setItem('colapso_admin_auth', 'true');
        onSuccess();
      } else {
        setError(data.error || 'Contraseña incorrecta. Acceso restringido a la banda.');
      }
    } catch (err) {
      setError('Error al verificar credenciales con el servidor.');
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="max-w-md mx-auto my-12 p-6 sm:p-8 bg-[#faf6ed] border-2 border-[#e2d8c3] rounded-3xl shadow-2xl shadow-black/50 text-stone-950">
      <div className="text-center mb-6 space-y-3">
        <ColapsoLogo size="md" showSubtitle />
        <div className="w-12 h-12 mx-auto rounded-2xl bg-red-100 text-red-700 border border-red-200 flex items-center justify-center shadow-inner">
          <KeyRound className="w-6 h-6" />
        </div>
        <h2 className="text-2xl font-black font-rock text-stone-950 uppercase tracking-wide m-0">
          Acceso Exclusivo de la Banda
        </h2>
        <p className="text-xs text-stone-600 mt-1">
          Esta sección está protegida. Ingresa la clave de backstage para administrar el concierto.
        </p>
      </div>

      <form onSubmit={handleSubmit} className="space-y-4">
        <div>
          <label className="block text-xs font-black uppercase text-stone-900 tracking-wider mb-1.5 font-rock">
            Contraseña de Administración
          </label>
          <div className="relative">
            <Lock className="w-4 h-4 text-stone-400 absolute left-3.5 top-1/2 -translate-y-1/2" />
            <input
              type="password"
              autoFocus
              value={password}
              onChange={(e) => {
                setPassword(e.target.value);
                if (error) setError('');
              }}
              placeholder="••••••••••••"
              className="w-full pl-10 pr-4 py-3 rounded-xl bg-white border-2 border-[#ded5c0] focus:border-red-600 text-stone-950 font-bold text-sm tracking-widest outline-none transition-all shadow-xs"
            />
          </div>
        </div>

        {error && (
          <div className="p-3 rounded-xl bg-red-100 border border-red-300 flex items-center gap-2 text-xs font-bold text-red-900">
            <ShieldAlert className="w-4 h-4 shrink-0 text-red-600" />
            <span>{error}</span>
          </div>
        )}

        <div className="pt-2 flex flex-col gap-2">
          <button
            type="submit"
            disabled={loading}
            className="w-full py-3 px-4 rounded-xl bg-red-600 hover:bg-red-700 text-white font-black text-sm uppercase tracking-wider transition-all flex items-center justify-center gap-2 shadow-lg shadow-red-950/20 cursor-pointer disabled:opacity-50 font-rock"
          >
            {loading ? <Loader2 className="w-4 h-4 animate-spin" /> : <KeyRound className="w-4 h-4 text-white" />}
            <span>{loading ? 'Verificando...' : 'Entrar al Panel de la Banda'}</span>
          </button>

          <button
            type="button"
            onClick={onCancel}
            className="w-full py-2.5 px-4 rounded-xl bg-[#ebe3cf] hover:bg-[#ded5be] text-stone-800 border border-[#ded5c0] font-bold text-xs transition-colors flex items-center justify-center gap-1.5 cursor-pointer font-rock uppercase"
          >
            <ArrowLeft className="w-3.5 h-3.5" />
            <span>Regresar a la Pantalla del Público</span>
          </button>
        </div>
      </form>
    </div>
  );
};
