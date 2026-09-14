import React, { useEffect, useState } from 'react';
import QRCode from 'qrcode';
import { Maximize2, Minimize2, Radio, QrCode as QrIcon, Flame, Dices } from 'lucide-react';
import { ShowState, LiveSongVoteResult, Song } from '../types';

interface StageScreenProps {
  state: ShowState;
  activeSongs: LiveSongVoteResult[];
  currentlyPlayingSong: Song | null;
  totalVotes: number;
}

export const StageScreen: React.FC<StageScreenProps> = ({
  state,
  activeSongs,
  currentlyPlayingSong,
  totalVotes,
}) => {
  const [qrDataUrl, setQrDataUrl] = useState<string>('');
  const [isFullscreen, setIsFullscreen] = useState<boolean>(false);

  // Generate QR Code pointing to this applet URL
  useEffect(() => {
    const targetUrl = window.location.origin;
    QRCode.toDataURL(targetUrl, {
      width: 260,
      margin: 1,
      color: {
        dark: '#000000',
        light: '#10b981', // Emerald green QR code
      },
    })
      .then((url) => setQrDataUrl(url))
      .catch((err) => console.error('QR code generation error:', err));
  }, []);

  const toggleFullscreen = () => {
    if (!document.fullscreenElement) {
      document.documentElement.requestFullscreen().then(() => setIsFullscreen(true)).catch(() => {});
    } else {
      document.exitFullscreen().then(() => setIsFullscreen(false)).catch(() => {});
    }
  };

  const topSongs = activeSongs.slice(0, 7);
  const maxVotes = Math.max(...topSongs.map((s) => s.voteCount), 1);
  const topVoteCount = topSongs[0]?.voteCount || 0;
  const tiedCount = topVoteCount > 0 ? topSongs.filter((s) => s.voteCount === topVoteCount).length : 0;
  const hasTie = tiedCount >= 2;
  const isVotingOpen = state.votingOpen ?? true;

  return (
    <div className="relative min-h-[85vh] bg-black text-white rounded-3xl border border-emerald-500/30 overflow-hidden p-6 sm:p-10 flex flex-col justify-between shadow-[0_0_80px_rgba(16,185,129,0.15)]">
      {/* Background concert glow FX */}
      <div className="absolute top-0 right-1/4 w-96 h-96 bg-emerald-500/10 rounded-full blur-[120px] pointer-events-none" />
      <div className="absolute bottom-0 left-10 w-96 h-96 bg-cyan-500/10 rounded-full blur-[140px] pointer-events-none" />

      {/* Top Stage Bar */}
      <div className="relative z-10 flex items-center justify-between border-b border-zinc-800/80 pb-6">
        <div className="flex items-center gap-4">
          <span className="w-3 h-12 bg-emerald-500 rounded-sm shadow-[0_0_20px_#10b981]" />
          <div>
            <h1 className="text-4xl sm:text-6xl font-black font-rock tracking-wider text-white uppercase leading-none m-0">
              {state.bandName}
            </h1>
            <p className="text-sm font-semibold tracking-widest text-emerald-400 uppercase mt-1">
              Concierto en Vivo • Setlist Interactivo
            </p>
          </div>
        </div>

        <div className="flex items-center gap-4">
          <div className="hidden sm:flex flex-col items-end">
            <span className="text-xs uppercase tracking-wider text-zinc-400 font-bold">
              Público Conectado
            </span>
            <div className="flex items-center gap-2">
              <span className="relative flex h-3 w-3">
                <span className="animate-ping absolute inline-flex h-full w-full rounded-full bg-emerald-400 opacity-75"></span>
                <span className="relative inline-flex rounded-full h-3 w-3 bg-emerald-500"></span>
              </span>
              <span className="text-2xl font-black font-rock text-white">
                {state.connectedClients} FANS
              </span>
            </div>
          </div>

          <button
            onClick={toggleFullscreen}
            className="p-3 rounded-2xl bg-zinc-900 border border-zinc-700 hover:border-emerald-400 text-zinc-300 hover:text-white transition-all shadow-lg"
            title="Pantalla Completa para Proyector / TV"
          >
            {isFullscreen ? <Minimize2 className="w-5 h-5" /> : <Maximize2 className="w-5 h-5" />}
          </button>
        </div>
      </div>

      {/* Center Stage Arena */}
      <div className="relative z-10 grid grid-cols-1 lg:grid-cols-12 gap-8 my-8 items-center">
        {/* Left column: Currently Playing + Live QR Code */}
        <div className="lg:col-span-4 space-y-6">
          {/* Currently playing card */}
          {currentlyPlayingSong ? (
            <div className="p-6 rounded-3xl bg-zinc-950/90 border-2 border-emerald-500/50 shadow-[0_0_40px_rgba(16,185,129,0.2)]">
              <div className="flex items-center gap-2 text-emerald-400 text-xs font-black tracking-widest uppercase mb-2">
                <Flame className="w-4 h-4 text-emerald-400 animate-bounce" />
                <span>En el Escenario Ahora</span>
              </div>
              <h2 className="text-2xl sm:text-3xl font-black text-white font-rock tracking-wide m-0">
                {currentlyPlayingSong.title}
              </h2>
              <p className="text-sm text-zinc-400 mt-1">{currentlyPlayingSong.artist}</p>

              {/* Animated Equalizer */}
              <div className="flex items-end gap-1.5 h-10 mt-4 pt-2 border-t border-zinc-800">
                <span className="w-2 bg-emerald-400 rounded-full eq-bar-1" />
                <span className="w-2 bg-emerald-400 rounded-full eq-bar-2" />
                <span className="w-2 bg-emerald-400 rounded-full eq-bar-3" />
                <span className="w-2 bg-emerald-400 rounded-full eq-bar-4" />
                <span className="w-2 bg-emerald-400 rounded-full eq-bar-2" />
                <span className="w-2 bg-emerald-400 rounded-full eq-bar-1" />
              </div>
            </div>
          ) : (
            <div className="p-6 rounded-3xl bg-zinc-900/60 border border-zinc-800 text-center">
              <Radio className="w-8 h-8 text-emerald-400 mx-auto mb-2 animate-pulse" />
              <p className="font-rock text-xl text-white">Preparando el Show</p>
              <p className="text-xs text-zinc-400">¡Vota ahora por la primera canción!</p>
            </div>
          )}

          {/* QR Code Card for Crowd to Scan from their seats */}
          <div className="p-6 rounded-3xl bg-zinc-950/90 border border-zinc-800 flex flex-col items-center text-center shadow-lg">
            <div className="flex items-center gap-2 text-emerald-400 text-xs font-bold uppercase tracking-wider mb-3">
              <QrIcon className="w-4 h-4" />
              <span>Vota desde tu Celular</span>
            </div>

            {qrDataUrl ? (
              <div className="p-3 bg-emerald-500 rounded-2xl shadow-[0_0_25px_rgba(16,185,129,0.3)]">
                <img
                  src={qrDataUrl}
                  alt="QR Code de Votación"
                  className="w-44 h-44 rounded-xl"
                />
              </div>
            ) : (
              <div className="w-44 h-44 bg-zinc-900 rounded-2xl flex items-center justify-center text-zinc-500 text-xs">
                Cargando QR...
              </div>
            )}

            <p className="text-xs text-zinc-300 font-medium mt-3">
              Apunta la cámara de tu teléfono y elige qué tocamos.
            </p>
          </div>
        </div>

        {/* Right column: Giant Live Racing Bars (like Spotify Voronoi image) */}
        <div className="lg:col-span-8 space-y-4">
          <div className="flex items-center justify-between px-2">
            <div>
              <div className="flex flex-wrap items-center gap-2 mb-1">
                <span className="text-xs font-black uppercase tracking-widest text-emerald-400 block">
                  Tendencia en Tiempo Real
                </span>
                {!isVotingOpen && (
                  <span className="px-2 py-0.5 rounded-full bg-amber-500/20 border border-amber-400/40 text-amber-300 text-[10px] font-bold font-rock uppercase">
                    Votación en Pausa
                  </span>
                )}
                {hasTie && (
                  <span className="px-2 py-0.5 rounded-full bg-red-500/20 border border-red-400/50 text-red-300 text-[10px] font-bold font-rock uppercase flex items-center gap-1 animate-pulse">
                    <Dices className="w-3 h-3" /> Empate ({tiedCount} temas)
                  </span>
                )}
              </div>
              <h3 className="text-2xl sm:text-3xl font-black font-rock text-white tracking-wide uppercase m-0">
                ¿Qué tema sigue después?
              </h3>
            </div>
            <div className="text-right">
              <span className="text-3xl font-black font-rock text-emerald-400">{totalVotes}</span>
              <span className="text-xs text-zinc-400 block font-medium">Votos Totales</span>
            </div>
          </div>

          <div className="space-y-3">
            {topSongs.map((song) => {
              const barWidthPercent =
                maxVotes > 0 ? Math.max(8, Math.round((song.voteCount / maxVotes) * 100)) : 8;
              const isFirst = song.rank === 1 && song.voteCount > 0;

              return (
                <div
                  key={song.songId}
                  className={`relative overflow-hidden rounded-2xl border p-4 transition-all duration-500 ${
                    isFirst
                      ? 'border-emerald-400 bg-zinc-950 shadow-[0_0_30px_rgba(16,185,129,0.25)]'
                      : 'border-zinc-800/80 bg-zinc-950/70'
                  }`}
                >
                  {/* Neon animated bar fill */}
                  <div
                    className={`absolute inset-y-0 left-0 transition-all duration-700 ease-out rounded-2xl ${
                      isFirst
                        ? 'bg-gradient-to-r from-emerald-600/40 via-emerald-500/35 to-emerald-400/25'
                        : 'bg-gradient-to-r from-emerald-950/30 via-emerald-900/20 to-transparent'
                    }`}
                    style={{ width: `${barWidthPercent}%` }}
                  />

                  {/* Bright neon edge cap */}
                  <div
                    className={`absolute top-0 bottom-0 w-1.5 transition-all duration-700 ${
                      isFirst ? 'bg-emerald-400 shadow-[0_0_15px_#10b981]' : 'bg-emerald-600/60'
                    }`}
                    style={{ left: `calc(${barWidthPercent}% - 6px)` }}
                  />

                  {/* Text Overlay */}
                  <div className="relative z-10 flex items-center justify-between gap-4">
                    <div className="flex items-center gap-4 min-w-0">
                      <div
                        className={`w-10 h-10 rounded-xl flex items-center justify-center font-rock text-xl shrink-0 font-black ${
                          isFirst
                            ? 'bg-emerald-500 text-black shadow-[0_0_15px_#10b981]'
                            : 'bg-zinc-900 text-emerald-400 border border-zinc-700'
                        }`}
                      >
                        #{song.rank}
                      </div>

                      <div className="min-w-0">
                        <h4
                          className={`text-lg sm:text-xl font-bold truncate ${
                            isFirst ? 'text-emerald-300' : 'text-white'
                          }`}
                        >
                          {song.title}
                        </h4>
                        <p className="text-xs text-zinc-400 truncate">{song.artist}</p>
                      </div>
                    </div>

                    <div className="flex items-baseline gap-3 shrink-0">
                      <span className="text-xl sm:text-2xl font-black font-rock text-white">
                        {song.voteCount} <span className="text-xs font-sans text-zinc-400">votos</span>
                      </span>
                      <span className="text-lg font-mono font-bold text-emerald-400">
                        {song.percentage}%
                      </span>
                    </div>
                  </div>
                </div>
              );
            })}
          </div>
        </div>
      </div>

      {/* Footer ticker */}
      <div className="relative z-10 pt-4 border-t border-zinc-850 flex items-center justify-between text-xs text-zinc-400">
        <span className="flex items-center gap-2">
          <span className="w-2 h-2 rounded-full bg-emerald-500 animate-pulse" />
          COLAPSO Live Stream System • Actualización instantánea en pantalla
        </span>
        <span className="text-emerald-400 font-mono font-semibold">
          {window.location.host}
        </span>
      </div>
    </div>
  );
};
