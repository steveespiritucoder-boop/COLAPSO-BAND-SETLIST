import React from 'react';
import { Volume2, Sparkles, Flame, Music, Disc } from 'lucide-react';
import { Song } from '../types';

interface NowPlayingBannerProps {
  song: Song | null;
  roundNumber?: number;
  upcomingRound?: number;
}

export const NowPlayingBanner: React.FC<NowPlayingBannerProps> = ({
  song,
  roundNumber,
  upcomingRound,
}) => {
  if (!song) {
    const nextRound = upcomingRound || 1;
    return (
      <div className="bg-white border border-slate-200 rounded-2xl p-4 text-center shadow-xs">
        <div className="flex items-center justify-center gap-2 text-slate-600 text-sm font-semibold">
          <Volume2 className="w-4 h-4 text-emerald-600 animate-pulse shrink-0" />
          <span>
            {nextRound <= 1
              ? 'La banda COLAPSO se está preparando en el escenario... ¡Vota el 1er tema abajo!'
              : `La banda finalizó el tema anterior y se prepara para el ${nextRound}º tema... ¡Vota abajo!`}
          </span>
        </div>
      </div>
    );
  }

  const isCrowd = Boolean(song.isCrowdRequest);

  return (
    <div
      className={`relative overflow-hidden rounded-2xl border-2 p-4 sm:p-5 shadow-sm transition-all ${
        isCrowd
          ? 'bg-gradient-to-r from-amber-50 via-white to-orange-50 border-amber-400'
          : 'bg-gradient-to-r from-emerald-50 via-white to-teal-50 border-emerald-500'
      }`}
    >
      <div className="relative z-10 flex flex-col sm:flex-row items-start sm:items-center justify-between gap-4">
        {/* Left: Album cover + Equalizer + Title/Artist */}
        <div className="flex items-center gap-3.5 min-w-0">
          {/* Cover / Vinyl graphic */}
          <div className="relative w-14 h-14 sm:w-16 sm:h-16 rounded-xl overflow-hidden shrink-0 shadow-sm border border-slate-200">
            {song.coverUrl ? (
              <img
                src={song.coverUrl}
                alt={song.title}
                className="w-full h-full object-cover"
              />
            ) : (
              <div className="w-full h-full bg-slate-900 flex items-center justify-center text-white">
                <Disc className="w-6 h-6 animate-spin text-emerald-400" />
              </div>
            )}
            {/* Overlay mini equalizer */}
            <div className="absolute inset-0 bg-black/40 flex items-center justify-center gap-1">
              <span className="w-1 bg-white rounded-full eq-bar-1" />
              <span className="w-1 bg-white rounded-full eq-bar-2" />
              <span className="w-1 bg-white rounded-full eq-bar-3" />
              <span className="w-1 bg-white rounded-full eq-bar-4" />
            </div>
          </div>

          <div className="min-w-0">
            <div className="flex flex-wrap items-center gap-2 mb-1">
              {isCrowd ? (
                <span className="inline-flex items-center gap-1 text-[11px] font-black text-amber-900 bg-amber-200 border border-amber-400 px-2 py-0.5 rounded uppercase tracking-wider shadow-xs animate-pulse">
                  <Flame className="w-3.5 h-3.5 text-amber-700 fill-amber-700" />
                  PEDIDO DE PÚBLICO
                </span>
              ) : (
                <span className="inline-flex items-center gap-1 text-[11px] font-black text-emerald-900 bg-emerald-200 border border-emerald-400 px-2 py-0.5 rounded uppercase tracking-wider shadow-xs">
                  <Music className="w-3.5 h-3.5 text-emerald-800" />
                  SONANDO EN VIVO AHORA
                </span>
              )}

              {roundNumber && (
                <span className="text-[11px] font-bold text-slate-500 bg-white/80 px-2 py-0.5 rounded border border-slate-200">
                  Tema #{roundNumber}
                </span>
              )}
            </div>

            <h2 className="text-xl sm:text-2xl font-black text-slate-950 font-rock tracking-wider uppercase m-0 truncate">
              {song.title}
            </h2>

            <p className="text-xs sm:text-sm font-bold uppercase tracking-wide italic text-cyan-800 mt-0.5 truncate">
              {song.artist}
            </p>
          </div>
        </div>

        {/* Right: Badge */}
        <div className="self-end sm:self-auto shrink-0">
          <div
            className={`px-3 py-1.5 rounded-xl border text-xs font-bold flex items-center gap-1.5 shadow-2xs ${
              isCrowd
                ? 'bg-amber-100 text-amber-900 border-amber-300'
                : 'bg-white text-emerald-800 border-emerald-300'
            }`}
          >
            <Sparkles className={`w-3.5 h-3.5 ${isCrowd ? 'text-amber-600' : 'text-emerald-600'}`} />
            <span>{isCrowd ? '¡Elegida a viva voz!' : 'Ganadora de la Votación'}</span>
          </div>
        </div>
      </div>
    </div>
  );
};
