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
    <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/80 backdrop-blur-sm animate-in fade-in duration-200">
      <div
        className={`relative w-full max-w-md rounded-3xl bg-[#faf6ed] border-2 p-6 sm:p-8 text-center shadow-2xl text-stone-950 ${
          isCrowd ? 'border-amber-500 shadow-amber-950/40' : 'border-red-600 shadow-red-950/40'
        }`}
      >
        <button
          onClick={onClose}
          className="absolute top-4 right-4 p-2 rounded-full bg-white text-stone-600 hover:text-stone-950 hover:bg-stone-100 border border-[#ded5c0] transition-colors cursor-pointer"
        >
          <X className="w-5 h-5" />
        </button>

        <div
          className={`w-16 h-16 rounded-2xl flex items-center justify-center mx-auto mb-3 shadow-md border ${
            isCrowd
              ? 'bg-amber-100 text-amber-700 border-amber-300'
              : 'bg-red-100 text-red-700 border-red-200'
          }`}
        >
          {isCrowd ? (
            <Flame className="w-8 h-8 fill-amber-500 text-amber-600" />
          ) : (
            <Trophy className="w-8 h-8 text-red-600" />
          )}
        </div>

        <div
          className={`inline-flex items-center gap-1.5 text-xs font-black uppercase tracking-widest px-3 py-1 rounded-full mb-2 font-rock ${
            isCrowd
              ? 'bg-amber-200 text-amber-950 border border-amber-400'
              : 'bg-red-600 text-white'
          }`}
        >
          <Sparkles className="w-3.5 h-3.5" />
          <span>{isCrowd ? '¡PEDIDO DEL PÚBLICO A VIVA VOZ!' : '¡TEMA GANADOR DE LA VOTACIÓN!'}</span>
        </div>

        <h3 className="text-2xl sm:text-3xl font-black font-rock text-stone-950 tracking-wide uppercase my-2">
          {winner.title}
        </h3>

        {winner.artist && (
          <p className="text-sm font-bold text-red-700 uppercase mb-2 font-rock">
            {winner.artist}
          </p>
        )}

        <p className="text-xs text-stone-600 mb-4">
          {isCrowd
            ? `¡Un fan lo pidió directamente a los músicos para el puesto #${winner.round}!`
            : `¡Ganó con ${winner.voteCount} votos en la ronda #${winner.round}!`}
        </p>

        <div
          className={`p-3 rounded-2xl border text-xs font-bold flex items-center justify-center gap-2 mb-5 font-rock ${
            isCrowd
              ? 'bg-amber-100/70 text-amber-950 border-amber-300'
              : 'bg-red-50 text-red-950 border-red-200'
          }`}
        >
          <Music className="w-4 h-4 text-red-600" />
          <span>¡COLAPSO está tocando esta canción ahora mismo en el escenario!</span>
        </div>

        <button
          onClick={onClose}
          className={`w-full py-3 rounded-xl font-black text-xs sm:text-sm uppercase tracking-wider transition-all shadow-lg cursor-pointer font-rock ${
            isCrowd
              ? 'bg-amber-500 hover:bg-amber-600 text-stone-950 shadow-amber-950/20'
              : 'bg-red-600 hover:bg-red-700 text-white shadow-red-950/30'
          }`}
        >
          ¡A Rockear con COLAPSO! 🤘
        </button>
      </div>
    </div>
  );
};
