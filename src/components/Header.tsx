import React, { useState } from 'react';
import {
  Radio,
  Users,
  QrCode,
  ExternalLink,
  Video,
  ArrowLeft,
  Phone,
  Copy,
  Check,
  MessageCircle,
  Instagram,
  Youtube,
  Music2,
} from 'lucide-react';
import { ShowState } from '../types';
import { ColapsoLogo } from './ColapsoLogo';

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
  const [copiedPhone, setCopiedPhone] = useState(false);

  const connectedCount = state?.connectedClients ?? 1;
  const isVotingOpen = state?.votingOpen ?? true;
  const socials = state?.socialLinks;
  const streams = state?.liveStreams;

  const displayPhone = socials?.phone || '915189153';
  const rawDigits = displayPhone.replace(/\D/g, '') || '51915189153';
  const waDigits = rawDigits.length === 9 ? `51${rawDigits}` : rawDigits;
  const whatsappUrl = `https://wa.me/${waDigits}?text=Hola%20COLAPSO,%20los%20estoy%20viendo%20en%20el%20concierto!`;

  const handleCopyPhone = () => {
    navigator.clipboard.writeText(displayPhone);
    setCopiedPhone(true);
    setTimeout(() => setCopiedPhone(false), 2500);
  };

  const formatSocialUrl = (type: 'instagram' | 'tiktok' | 'youtube', val?: string) => {
    if (!val) return '';
    const trimmed = val.trim();
    if (!trimmed) return '';
    if (trimmed.startsWith('http://') || trimmed.startsWith('https://')) return trimmed;
    const handle = trimmed.replace(/^@/, '');
    if (type === 'instagram') return `https://instagram.com/${handle}`;
    if (type === 'tiktok') return `https://tiktok.com/@${handle}`;
    if (type === 'youtube') return trimmed.startsWith('@') ? `https://youtube.com/${trimmed}` : `https://youtube.com/@${handle}`;
    return trimmed;
  };

  const instagramUrl = formatSocialUrl('instagram', socials?.instagram);
  const tiktokUrl = formatSocialUrl('tiktok', socials?.tiktok);
  const youtubeUrl = formatSocialUrl('youtube', socials?.youtube);
  const spotifyUrl = socials?.spotify;

  const hasActiveStreams =
    streams?.isLiveActive &&
    (Boolean(streams.tiktokLive) || Boolean(streams.youtubeLive) || Boolean(streams.facebookLive));

  return (
    <header className="border-b border-red-950/70 bg-[#09090b]/95 backdrop-blur-md sticky top-0 z-40 shadow-xl shadow-black/50 text-stone-100">
      {/* Top Banner for Active Live Streaming */}
      {hasActiveStreams && (
        <div className="bg-gradient-to-r from-red-700 via-rose-700 to-red-700 text-white px-4 py-1.5 text-xs font-semibold shadow-inner">
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
                  className="bg-black/60 hover:bg-black/80 text-white px-2.5 py-1 rounded-md text-[11px] font-bold inline-flex items-center gap-1 transition-colors border border-red-800/40"
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
                  className="bg-black/60 hover:bg-black/80 text-white px-2.5 py-1 rounded-md text-[11px] font-bold inline-flex items-center gap-1 transition-colors border border-red-800/40"
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
                  className="bg-black/60 hover:bg-black/80 text-white px-2.5 py-1 rounded-md text-[11px] font-bold inline-flex items-center gap-1 transition-colors border border-red-800/40"
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
      <div className="max-w-6xl mx-auto px-4 sm:px-6 py-2.5">
        <div className="flex items-center justify-between gap-3">
          {/* Brand & Official Logo with Live status */}
          <div className="flex items-center gap-3">
            <div
              onClick={() => onViewChange('fan')}
              className="cursor-pointer flex items-center gap-2.5 group"
            >
              <ColapsoLogo size="sm" />

              <div className="hidden sm:block">
                <div className="flex items-center gap-1.5">
                  <span className="text-[10px] font-extrabold uppercase px-1.5 py-0.5 rounded bg-red-950/80 text-red-400 border border-red-800/80 shadow-2xs">
                    EN VIVO
                  </span>
                  <span className="text-[10px] font-bold text-stone-400 font-rock uppercase tracking-wider">
                    ROCK SIN LÍMITES
                  </span>
                </div>
                <p className="text-[11px] text-stone-400 font-medium leading-tight mt-0.5">
                  Votación Interactiva en Directo
                </p>
              </div>
            </div>
          </div>

          {/* Right Action Tools */}
          <div className="flex items-center gap-2">
            {/* Phone + Copy + WhatsApp Group (Visible in Header) */}
            <div className="hidden md:flex items-center gap-1 p-1 rounded-xl bg-stone-900/90 border border-stone-800 shadow-xs">
              <div
                className="flex items-center gap-1.5 px-2.5 py-1 text-stone-200 text-xs font-mono font-bold"
                title={`Teléfono oficial de la banda: ${displayPhone}`}
              >
                <Phone className="w-3.5 h-3.5 text-red-400 fill-red-400/20" />
                <span>{displayPhone}</span>
              </div>

              {/* Botón Copiar al Portapapeles */}
              <button
                type="button"
                onClick={handleCopyPhone}
                title="Copiar número al portapapeles"
                className="flex items-center gap-1 px-2 py-1 rounded-lg bg-stone-800 hover:bg-stone-700 text-stone-200 text-xs font-bold transition-all cursor-pointer"
              >
                {copiedPhone ? (
                  <>
                    <Check className="w-3.5 h-3.5 text-emerald-400" />
                    <span className="text-[11px] text-emerald-400">¡Copiado!</span>
                  </>
                ) : (
                  <>
                    <Copy className="w-3.5 h-3.5 text-stone-400" />
                    <span className="text-[11px]">Copiar</span>
                  </>
                )}
              </button>

              {/* Botón WhatsApp */}
              <a
                href={whatsappUrl}
                target="_blank"
                rel="noreferrer"
                title={`Abrir WhatsApp con COLAPSO: ${displayPhone}`}
                className="flex items-center gap-1.5 px-2.5 py-1 rounded-lg bg-emerald-600 hover:bg-emerald-500 text-white text-xs font-bold transition-all shadow-xs"
              >
                <MessageCircle className="w-3.5 h-3.5 fill-current" />
                <span className="text-[11px]">WhatsApp</span>
              </a>
            </div>

            {/* Social Media Icons (Instagram, TikTok, YouTube, Spotify) */}
            <div className="hidden lg:flex items-center gap-1 border-r border-stone-800 pr-2 mr-1">
              {instagramUrl && (
                <a
                  href={instagramUrl}
                  target="_blank"
                  rel="noreferrer"
                  title="Instagram COLAPSO"
                  className="p-1.5 rounded-lg text-stone-400 hover:text-rose-400 hover:bg-rose-950/40 transition-colors"
                >
                  <Instagram className="w-4 h-4" />
                </a>
              )}
              {tiktokUrl && (
                <a
                  href={tiktokUrl}
                  target="_blank"
                  rel="noreferrer"
                  title="TikTok COLAPSO"
                  className="p-1.5 rounded-lg text-stone-400 hover:text-white hover:bg-stone-800 transition-colors"
                >
                  <Music2 className="w-4 h-4" />
                </a>
              )}
              {youtubeUrl && (
                <a
                  href={youtubeUrl}
                  target="_blank"
                  rel="noreferrer"
                  title="YouTube COLAPSO"
                  className="p-1.5 rounded-lg text-stone-400 hover:text-red-500 hover:bg-red-950/40 transition-colors"
                >
                  <Youtube className="w-4 h-4" />
                </a>
              )}
              {spotifyUrl && (
                <a
                  href={spotifyUrl}
                  target="_blank"
                  rel="noreferrer"
                  title="Spotify COLAPSO"
                  className="p-1.5 rounded-lg text-stone-400 hover:text-emerald-400 hover:bg-emerald-950/40 transition-colors"
                >
                  <svg className="w-4 h-4 fill-current" viewBox="0 0 24 24">
                    <path d="M12 0C5.373 0 0 5.373 0 12s5.373 12 12 12 12-5.373 12-12S18.627 0 12 0zm5.508 17.308c-.217.356-.677.469-1.033.252-2.828-1.728-6.388-2.119-10.582-1.16-.407.093-.811-.161-.904-.568-.093-.408.161-.812.568-.905 4.595-1.05 8.528-.609 11.699 1.348.356.217.469.677.252 1.033zm1.472-3.275c-.273.444-.855.586-1.299.313-3.238-1.99-8.175-2.566-12.007-1.402-.498.152-1.025-.133-1.176-.632-.152-.499.133-1.025.632-1.176 4.385-1.332 9.824-.689 13.537 1.598.444.273.586.855.313 1.299zm.126-3.41c-3.883-2.306-10.287-2.518-13.992-1.393-.597.181-1.229-.16-1.41-.757-.181-.597.16-1.229.757-1.41 4.258-1.293 11.319-1.047 15.797 1.611.537.319.715 1.015.396 1.552-.319.537-1.015.716-1.552.397z" />
                  </svg>
                </a>
              )}
            </div>

            {/* Voting Status Pill */}
            <div className="flex items-center gap-1.5 px-2.5 py-1 rounded-full text-xs font-semibold bg-stone-900 border border-stone-800">
              <span
                className={`h-2 w-2 rounded-full ${
                  isVotingOpen ? 'bg-red-500 animate-pulse shadow-[0_0_8px_#ef4444]' : 'bg-stone-500'
                }`}
              />
              <span className="hidden sm:inline text-stone-300">
                {isVotingOpen ? 'Votación Abierta' : 'Votación Pausada'}
              </span>
            </div>

            {/* Live Audience Count */}
            <div
              className="flex items-center gap-1.5 px-2.5 py-1 rounded-full text-xs font-semibold bg-stone-900 border border-stone-800 text-stone-300"
              title="Dispositivos conectados en vivo"
            >
              <Users className="w-3.5 h-3.5 text-red-400" />
              <span>{connectedCount}</span>
            </div>

            {/* Share Modal Trigger */}
            <button
              onClick={onOpenShareModal}
              className="p-1.5 rounded-xl bg-stone-900 border border-stone-800 hover:border-red-600 hover:text-red-400 text-stone-300 transition-all cursor-pointer shadow-2xs"
              title="Abrir código QR y enlaces para compartir el concierto"
            >
              <QrCode className="w-4 h-4" />
            </button>

            {/* Back to Fan View Button when in Admin */}
            {activeView !== 'fan' && (
              <button
                onClick={() => onViewChange('fan')}
                className="px-3 py-1.5 rounded-xl bg-stone-900 hover:bg-stone-800 text-stone-200 border border-stone-800 text-xs font-bold flex items-center gap-1.5 transition-colors cursor-pointer"
              >
                <ArrowLeft className="w-3.5 h-3.5 text-stone-400" />
                <span className="hidden sm:inline">Ver como Público</span>
              </button>
            )}
          </div>
        </div>

        {/* Mobile Contact Quick-Bar (< md screens) */}
        <div className="flex md:hidden items-center justify-between gap-2 pt-2 mt-1.5 border-t border-stone-800/60">
          <div className="flex items-center gap-1 p-0.5 rounded-xl bg-stone-900 border border-stone-800">
            <div
              className="flex items-center gap-1 px-2 py-1 text-stone-200 text-xs font-mono font-bold"
              title={`Teléfono: ${displayPhone}`}
            >
              <Phone className="w-3 h-3 text-red-400 fill-red-400/20" />
              <span className="text-[11px]">{displayPhone}</span>
            </div>
            <button
              type="button"
              onClick={handleCopyPhone}
              className="px-1.5 py-0.5 rounded-md bg-stone-800 hover:bg-stone-700 text-stone-200 text-[10px] font-bold flex items-center gap-1 cursor-pointer"
            >
              {copiedPhone ? <Check className="w-3 h-3 text-emerald-400" /> : <Copy className="w-3 h-3 text-stone-400" />}
              <span>{copiedPhone ? 'Copiado' : 'Copiar'}</span>
            </button>
            <a
              href={whatsappUrl}
              target="_blank"
              rel="noreferrer"
              className="px-2 py-0.5 rounded-md bg-emerald-600 hover:bg-emerald-500 text-white text-[10px] font-bold flex items-center gap-1"
            >
              <MessageCircle className="w-3 h-3 fill-current" />
              <span>WhatsApp</span>
            </a>
          </div>

          <div className="flex items-center gap-1">
            {instagramUrl && (
              <a
                href={instagramUrl}
                target="_blank"
                rel="noreferrer"
                title="Instagram COLAPSO"
                className="p-1 rounded-md text-stone-400 hover:text-rose-400"
              >
                <Instagram className="w-3.5 h-3.5" />
              </a>
            )}
            {tiktokUrl && (
              <a
                href={tiktokUrl}
                target="_blank"
                rel="noreferrer"
                title="TikTok COLAPSO"
                className="p-1 rounded-md text-stone-400 hover:text-white"
              >
                <Music2 className="w-3.5 h-3.5" />
              </a>
            )}
            {youtubeUrl && (
              <a
                href={youtubeUrl}
                target="_blank"
                rel="noreferrer"
                title="YouTube COLAPSO"
                className="p-1 rounded-md text-stone-400 hover:text-red-500"
              >
                <Youtube className="w-3.5 h-3.5" />
              </a>
            )}
          </div>
        </div>

        {/* Ticker bar with live message and voting state */}
        {state?.tickerMessage && (
          <div className="mt-2 py-1 px-3 rounded-lg bg-red-950/40 border border-red-900/50 flex items-center justify-between text-xs text-stone-300">
            <div className="flex items-center gap-2 overflow-hidden">
              <Radio className="w-3.5 h-3.5 text-red-500 shrink-0 animate-pulse" />
              <span className="truncate font-medium">{state.tickerMessage}</span>
            </div>
            <span
              className={`text-[10px] font-bold px-2 py-0.5 rounded ml-2 shrink-0 ${
                isVotingOpen
                  ? 'bg-red-900/80 text-red-200 border border-red-700'
                  : 'bg-stone-800 text-stone-300 border border-stone-700'
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
