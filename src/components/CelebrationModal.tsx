import React from 'react';
import { Trophy, Flame, X, Music, Sparkles } from 'lucide-react';
import { WinnerAnnouncement } from '../types';

interface CelebrationModalProps {
  winner: WinnerAnnouncement | null;
  onClose: () => void;
}

export const CelebrationModal: React.FC<CelebrationModalProps> = ({ winner, onClose }) => {
  if (!winner) return null;

  const isCrowd = Boolean(winner.isCrowdRequest);

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-slate-950/60 backdrop-blur-sm animate-in fade-in duration-200">
      <div
        className={`relative w-full max-w-md rounded-3xl bg-white border-2 p-6 sm:p-8 text-center shadow-2xl ${
          isCrowd ? 'border-amber-400' : 'border-emerald-500'
        }`}
      >
        <button
          onClick={onClose}
          className="absolute top-4 right-4 p-2 rounded-full bg-slate-100 text-slate-500 hover:text-slate-800 hover:bg-slate-200 transition-colors"
        >
          <X className="w-5 h-5" />
        </button>

        <div
          className={`w-16 h-16 rounded-2xl flex items-center justify-center mx-auto mb-3 shadow-md ${
            isCrowd
              ? 'bg-amber-100 text-amber-700 border border-amber-300'
              : 'bg-emerald-100 text-emerald-700 border border-emerald-300'
          }`}
        >
          {isCrowd ? (
            <Flame className="w-8 h-8 fill-amber-500 text-amber-600" />
          ) : (
            <Trophy className="w-8 h-8 text-emerald-600" />
          )}
        </div>

        <div
          className={`inline-flex items-center gap-1.5 text-xs font-black uppercase tracking-widest px-3 py-1 rounded-full mb-2 ${
            isCrowd
              ? 'bg-amber-100 text-amber-900 border border-amber-300'
              : 'bg-emerald-100 text-emerald-900 border border-emerald-300'
          }`}
        >
          <Sparkles className="w-3.5 h-3.5" />
          <span>{isCrowd ? '¡PEDIDO DEL PÚBLICO A VIVA VOZ!' : '¡TEMA GANADOR DE LA VOTACIÓN!'}</span>
        </div>

        <h3 className="text-2xl sm:text-3xl font-black font-rock text-slate-950 tracking-wide uppercase my-2">
          {winner.title}
        </h3>

        {winner.artist && (
          <p className="text-sm font-bold text-cyan-800 italic uppercase mb-2">
            {winner.artist}
          </p>
        )}

        <p className="text-xs text-slate-600 mb-4">
          {isCrowd
            ? `¡Un fan lo pidió directamente a los músicos para el puesto #${winner.round}!`
            : `¡Ganó con ${winner.voteCount} votos en la ronda #${winner.round}!`}
        </p>

        <div
          className={`p-3 rounded-2xl border text-xs font-bold flex items-center justify-center gap-2 mb-5 ${
            isCrowd
              ? 'bg-amber-50 text-amber-900 border-amber-200'
              : 'bg-emerald-50 text-emerald-900 border-emerald-200'
          }`}
        >
          <Music className="w-4 h-4 text-emerald-600" />
          <span>¡COLAPSO está tocando esta canción ahora mismo en el escenario!</span>
        </div>

        <button
          onClick={onClose}
          className={`w-full py-3 rounded-xl text-white font-black text-xs sm:text-sm uppercase tracking-wider transition-all shadow-md cursor-pointer ${
            isCrowd
              ? 'bg-amber-500 hover:bg-amber-600 text-slate-950'
              : 'bg-emerald-600 hover:bg-emerald-700'
          }`}
        >
          ¡A Rockear con COLAPSO! 🤘
        </button>
      </div>
    </div>
  );
};
