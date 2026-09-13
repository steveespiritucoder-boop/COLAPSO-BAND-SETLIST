import React from 'react';
import { Radio, Users, QrCode, Sliders, ExternalLink, Video, ShieldCheck, ArrowLeft } from 'lucide-react';
import { ShowState } from '../types';

interface HeaderProps {
  state: ShowState | null;
  isConnected: boolean;
  activeView: 'fan' | 'stage' | 'admin';
  onViewChange: (view: 'fan' | 'stage' | 'admin') => void;
  onOpenShareModal: () => void;
}

export const Header: React.FC<HeaderProps> = ({
  state,
  isConnected,
  activeView,
  onViewChange,
  onOpenShareModal,
}) => {
  const bandName = state?.bandName || 'COLAPSO';
  const connectedCount = state?.connectedClients ?? 1;
  const isVotingOpen = state?.votingOpen ?? true;
  const socials = state?.socialLinks;
  const streams = state?.liveStreams;

  const hasActiveStreams =
    streams?.isLiveActive &&
    (Boolean(streams.tiktokLive) || Boolean(streams.youtubeLive) || Boolean(streams.facebookLive));

  return (
    <header className="border-b border-slate-200 bg-white sticky top-0 z-40 shadow-xs">
      {/* Top Banner for Active Live Streaming */}
      {hasActiveStreams && (
        <div className="bg-gradient-to-r from-red-600 via-rose-600 to-red-600 text-white px-4 py-1.5 text-xs font-semibold shadow-inner">
          <div className="max-w-6xl mx-auto flex flex-wrap items-center justify-between gap-2">
            <div className="flex items-center gap-2">
              <span className="relative flex h-2.5 w-2.5">
                <span className="animate-ping absolute inline-flex h-full w-full rounded-full bg-white opacity-75"></span>
                <span className="relative inline-flex rounded-full h-2.5 w-2.5 bg-white"></span>
              </span>
              <span className="font-rock tracking-wider text-sm uppercase">
                🔴 TRANSMISIÓN EN DIRECTO DEL SHOW
              </span>
            </div>

            <div className="flex items-center gap-2">
              {streams?.tiktokLive && (
                <a
                  href={streams.tiktokLive}
                  target="_blank"
                  rel="noreferrer"
                  className="bg-black/40 hover:bg-black/60 text-white px-2.5 py-1 rounded-md text-[11px] font-bold inline-flex items-center gap-1 transition-colors"
                >
                  <Video className="w-3 h-3 text-pink-400" />
                  TikTok Live
                  <ExternalLink className="w-2.5 h-2.5 opacity-70" />
                </a>
              )}
              {streams?.youtubeLive && (
                <a
                  href={streams.youtubeLive}
                  target="_blank"
                  rel="noreferrer"
                  className="bg-black/40 hover:bg-black/60 text-white px-2.5 py-1 rounded-md text-[11px] font-bold inline-flex items-center gap-1 transition-colors"
                >
                  <Video className="w-3 h-3 text-red-400" />
                  YouTube Live
                  <ExternalLink className="w-2.5 h-2.5 opacity-70" />
                </a>
              )}
              {streams?.facebookLive && (
                <a
                  href={streams.facebookLive}
                  target="_blank"
                  rel="noreferrer"
                  className="bg-black/40 hover:bg-black/60 text-white px-2.5 py-1 rounded-md text-[11px] font-bold inline-flex items-center gap-1 transition-colors"
                >
                  <Video className="w-3 h-3 text-blue-400" />
                  Facebook Live
                  <ExternalLink className="w-2.5 h-2.5 opacity-70" />
                </a>
              )}
            </div>
          </div>
        </div>
      )}

      {/* Main Header Bar */}
      <div className="max-w-6xl mx-auto px-4 sm:px-6 py-3">
        <div className="flex items-center justify-between gap-3">
          {/* Brand & Live status */}
          <div className="flex items-center gap-3">
            <div
              onClick={() => onViewChange('fan')}
              className="cursor-pointer flex items-center gap-2 group"
            >
              <div className="w-9 h-9 rounded-xl bg-slate-950 text-white flex items-center justify-center font-rock text-xl font-black shadow-sm group-hover:bg-emerald-600 transition-colors">
                C
              </div>
              <div>
                <div className="flex items-center gap-1.5">
                  <h1 className="text-2xl sm:text-3xl font-black tracking-wider text-slate-900 font-rock uppercase m-0 leading-none">
                    {bandName}
                  </h1>
                  <span className="text-[10px] font-extrabold uppercase px-1.5 py-0.5 rounded bg-emerald-100 text-emerald-800 border border-emerald-300">
                    EN VIVO
                  </span>
                </div>
                <p className="text-[11px] text-slate-500 font-medium">
                  Votación Tema a Tema en Directo
                </p>
              </div>
            </div>
          </div>

          {/* Right Action Tools */}
          <div className="flex items-center gap-2">
            {/* Band Social Links Pill */}
            {socials && activeView === 'fan' && (
              <div className="hidden md:flex items-center gap-1 border-r border-slate-200 pr-2 mr-1">
                {socials.spotify && (
                  <a
                    href={socials.spotify}
                    target="_blank"
                    rel="noreferrer"
                    title="Escuchar COLAPSO en Spotify"
                    className="p-1.5 rounded-lg text-slate-500 hover:text-emerald-600 hover:bg-emerald-50 transition-colors"
                  >
                    <svg className="w-4 h-4 fill-current" viewBox="0 0 24 24">
                      <path d="M12 0C5.373 0 0 5.373 0 12s5.373 12 12 12 12-5.373 12-12S18.627 0 12 0zm5.508 17.308c-.217.356-.677.469-1.033.252-2.828-1.728-6.388-2.119-10.582-1.16-.407.093-.811-.161-.904-.568-.093-.408.161-.812.568-.905 4.595-1.05 8.528-.609 11.699 1.348.356.217.469.677.252 1.033zm1.472-3.275c-.273.444-.855.586-1.299.313-3.238-1.99-8.175-2.566-12.007-1.402-.498.152-1.025-.133-1.176-.632-.152-.499.133-1.025.632-1.176 4.385-1.332 9.824-.689 13.537 1.598.444.273.586.855.313 1.299zm.126-3.41c-3.883-2.306-10.287-2.518-13.992-1.393-.597.181-1.229-.16-1.41-.757-.181-.597.16-1.229.757-1.41 4.258-1.293 11.319-1.047 15.797 1.611.537.319.715 1.015.396 1.552-.319.537-1.015.716-1.552.397z" />
                    </svg>
                  </a>
                )}
                {socials.instagram && (
                  <a
                    href={socials.instagram}
                    target="_blank"
                    rel="noreferrer"
                    title="Instagram @bandacolapso"
                    className="p-1.5 rounded-lg text-slate-500 hover:text-rose-600 hover:bg-rose-50 transition-colors"
                  >
                    <svg className="w-4 h-4 fill-current" viewBox="0 0 24 24">
                      <path d="M12 2.163c3.204 0 3.584.012 4.85.07 3.252.148 4.771 1.691 4.919 4.919.058 1.265.069 1.645.069 4.849 0 3.205-.012 3.584-.069 4.849-.149 3.225-1.664 4.771-4.919 4.919-1.266.058-1.644.07-4.85.07-3.204 0-3.584-.012-4.849-.07-3.26-.149-4.771-1.699-4.919-4.92-.058-1.265-.07-1.644-.07-4.849 0-3.204.013-3.583.07-4.849.149-3.227 1.664-4.771 4.919-4.919 1.266-.057 1.645-.069 4.849-.069zm0-2.163c-3.259 0-3.667.014-4.947.072-4.358.2-6.78 2.618-6.98 6.98-.059 1.281-.073 1.689-.073 4.948 0 3.259.014 3.668.072 4.948.2 4.358 2.618 6.78 6.98 6.98 1.281.058 1.689.072 4.948.072 3.259 0 3.668-.014 4.948-.072 4.354-.2 6.782-2.618 6.979-6.98.059-1.28.073-1.689.073-4.948 0-3.259-.014-3.667-.072-4.947-.196-4.354-2.617-6.78-6.979-6.98-1.281-.059-1.69-.073-4.949-.073zm0 5.838c-3.403 0-6.162 2.759-6.162 6.162s2.759 6.163 6.162 6.163 6.162-2.759 6.162-6.163c0-3.403-2.759-6.162-6.162-6.162zm0 10.162c-2.209 0-4-1.79-4-4 0-2.209 1.791-4 4-4s4 1.791 4 4c0 2.21-1.791 4-4 4zm6.406-11.845c-.796 0-1.441.645-1.441 1.44s.645 1.44 1.441 1.44c.795 0 1.439-.645 1.439-1.44s-.644-1.44-1.439-1.44z" />
                    </svg>
                  </a>
                )}
                {socials.tiktok && (
                  <a
                    href={socials.tiktok}
                    target="_blank"
                    rel="noreferrer"
                    title="TikTok @bandacolapso"
                    className="p-1.5 rounded-lg text-slate-500 hover:text-slate-900 hover:bg-slate-100 transition-colors"
                  >
                    <svg className="w-4 h-4 fill-current" viewBox="0 0 24 24">
                      <path d="M12.525.02c1.31-.02 2.61-.01 3.91-.02.08 1.53.63 3.09 1.75 4.17 1.12 1.11 2.7 1.62 4.24 1.79v4.03c-1.44-.05-2.89-.35-4.2-.97-.57-.26-1.1-.59-1.62-.93-.01 2.92.01 5.84-.02 8.75-.08 1.4-.54 2.79-1.35 3.94-1.31 1.92-3.58 3.17-5.91 3.21-1.43.08-2.86-.31-4.08-1.03-2.02-1.19-3.44-3.37-3.65-5.71-.02-.5-.03-1-.01-1.49.18-1.9 1.12-3.72 2.58-4.96 1.66-1.44 3.98-2.13 6.15-1.72.02 1.48-.04 2.96-.04 4.44-.99-.32-2.15-.23-3.02.37-.63.41-1.11 1.04-1.36 1.75-.21.51-.24 1.07-.14 1.61.24 1.64 1.82 3.02 3.5 2.87 1.12-.01 2.19-.66 2.77-1.61.19-.33.4-.67.41-1.06.1-1.79.06-3.57.07-5.36.01-4.03-.01-8.05.02-12.07z" />
                    </svg>
                  </a>
                )}
                {socials.youtube && (
                  <a
                    href={socials.youtube}
                    target="_blank"
                    rel="noreferrer"
                    title="YouTube @bandacolapso"
                    className="p-1.5 rounded-lg text-slate-500 hover:text-red-600 hover:bg-red-50 transition-colors"
                  >
                    <svg className="w-4 h-4 fill-current" viewBox="0 0 24 24">
                      <path d="M23.498 6.186a3.016 3.016 0 0 0-2.122-2.136C19.505 3.545 12 3.545 12 3.545s-7.505 0-9.377.505A3.017 3.017 0 0 0 .502 6.186C0 8.07 0 12 0 12s0 3.93.502 5.814a3.016 3.016 0 0 0 2.122 2.136c1.871.505 9.376.505 9.376.505s7.505 0 9.377-.505a3.015 3.015 0 0 0 2.122-2.136C24 15.93 24 12 24 12s0-3.93-.502-5.814zM9.545 15.568V8.432L15.818 12l-6.273 3.568z" />
                    </svg>
                  </a>
                )}
              </div>
            )}

            {/* Share QR / Link Button */}
            <button
              onClick={onOpenShareModal}
              className="py-1.5 px-3 rounded-xl text-xs font-bold bg-emerald-50 text-emerald-700 hover:bg-emerald-100 border border-emerald-200 transition-all flex items-center gap-1.5 shadow-2xs cursor-pointer"
            >
              <QrCode className="w-4 h-4 text-emerald-600" />
              <span className="hidden sm:inline">Compartir</span>
              <span>QR</span>
            </button>

            {/* Connected clients count */}
            <div
              className="flex items-center gap-1 px-2.5 py-1.5 rounded-xl bg-slate-100 border border-slate-200 text-xs font-bold text-slate-700"
              title={isConnected ? 'Conectado al escenario' : 'Reconectando...'}
            >
              <Users className="w-3.5 h-3.5 text-emerald-600" />
              <span>{connectedCount}</span>
            </div>

            {/* View Switcher Controls: only shown when inside admin view so admin can exit */}
            {activeView === 'admin' && (
              <button
                onClick={() => onViewChange('fan')}
                className="py-1.5 px-3 rounded-xl text-xs font-bold bg-emerald-600 text-white hover:bg-emerald-700 transition-colors flex items-center gap-1.5 ml-1 shadow-2xs cursor-pointer"
              >
                <ArrowLeft className="w-3.5 h-3.5" />
                <span>Salir del Admin</span>
              </button>
            )}
          </div>
        </div>

        {/* Ticker bar with live message and voting state */}
        {state?.tickerMessage && (
          <div className="mt-2 py-1 px-3 rounded-lg bg-slate-50 border border-slate-200 flex items-center justify-between text-xs text-slate-600">
            <div className="flex items-center gap-2 overflow-hidden">
              <Radio className="w-3.5 h-3.5 text-emerald-600 shrink-0 animate-pulse" />
              <span className="truncate font-medium">{state.tickerMessage}</span>
            </div>
            <span
              className={`text-[11px] font-bold px-2 py-0.5 rounded ml-2 shrink-0 ${
                isVotingOpen
                  ? 'bg-emerald-100 text-emerald-800 border border-emerald-300'
                  : 'bg-amber-100 text-amber-800 border border-amber-300'
              }`}
            >
              {isVotingOpen ? 'Votación Abierta' : 'Votación Pausada'}
            </span>
          </div>
        )}
      </div>
    </header>
  );
};
