import React, { useState } from 'react';
import {
  Play,
  CheckCircle,
  Pause,
  RotateCcw,
  Plus,
  Send,
  Zap,
  Sparkles,
  ListMusic,
  Sliders,
  AlertTriangle,
  Flame,
  Video,
  Share2,
  Globe,
  Radio,
  Search,
  Check,
  MapPin,
  Users,
  Image,
  Database,
  Trash2,
  UploadCloud,
  FileImage,
  Loader2,
} from 'lucide-react';
import { ShowState, ShowMode, LiveSongVoteResult, LiveStreams, SocialLinks, Song } from '../types';

interface AdminPanelProps {
  state: ShowState;
  activeSongs: LiveSongVoteResult[];
  adminActions: {
    toggleVoting: (open: boolean) => void;
    setMode: (mode: ShowMode) => void;
    setPlaying: (songId: string) => void;
    finishPlaying: (songId: string) => void;
    selectWinnerAndPlay: (songId: string) => void;
    crowdRequest: (songId: string) => void;
    updateLocation?: (locationUrl: string, locationName?: string) => void;
    updateStreams: (streams: Partial<LiveStreams>) => void;
    updateSocials: (socials: Partial<SocialLinks>) => void;
    resetVotes: () => void;
    addSong: (title: string, artist: string, albumOrYear: string, coverUrl?: string, tempo?: string) => void;
    removeSong: (songId: string) => void;
    updateSongs?: (songs: Song[]) => void;
    setMessage: (message: string) => void;
    simulateVotes: (count: number) => void;
  };
}

export const AdminPanel: React.FC<AdminPanelProps> = ({
  state,
  activeSongs,
  adminActions,
}) => {
  const [selectedCrowdSongId, setSelectedCrowdSongId] = useState<string>('');
  const [customMsg, setCustomMsg] = useState(state.tickerMessage || '');
  const [showConfirmReset, setShowConfirmReset] = useState(false);

  // Setlist Item Entry Form State
  const [songTitle, setSongTitle] = useState('');
  const [songArtist, setSongArtist] = useState('');
  const [songImageUrl, setSongImageUrl] = useState('');
  const [imageBase64, setImageBase64] = useState('');
  const [isConvertingImage, setIsConvertingImage] = useState(false);
  const [imageConvertError, setImageConvertError] = useState('');
  const [supabaseStatusMsg, setSupabaseStatusMsg] = useState('');
  const [isSyncingSupabase, setIsSyncingSupabase] = useState(false);

  // Google Maps Location Form State
  const [locationName, setLocationName] = useState(state.locationName || '');
  const [locationUrl, setLocationUrl] = useState(state.locationUrl || '');
  const [locationSaved, setLocationSaved] = useState(false);

  // Live Streams Form State
  const [isLiveActive, setIsLiveActive] = useState(state.liveStreams?.isLiveActive ?? false);
  const [tiktokLive, setTiktokLive] = useState(state.liveStreams?.tiktokLive || '');
  const [youtubeLive, setYoutubeLive] = useState(state.liveStreams?.youtubeLive || '');
  const [facebookLive, setFacebookLive] = useState(state.liveStreams?.facebookLive || '');
  const [streamsSaved, setStreamsSaved] = useState(false);

  // Socials Form State
  const [instagram, setInstagram] = useState(state.socialLinks?.instagram || '');
  const [spotify, setSpotify] = useState(state.socialLinks?.spotify || '');
  const [socialsSaved, setSocialsSaved] = useState(false);

  const topSong = activeSongs[0];
  const currentPlaying = state.songs.find((s) => s.id === state.currentPlayingSongId);
  const totalVotesCount = Object.keys(state.liveVotes).length;

  // Convert Image URL to Base64 via backend API or direct FileReader
  const handleConvertUrlToBase64 = async (urlToConvert: string) => {
    if (!urlToConvert.trim()) return;
    setIsConvertingImage(true);
    setImageConvertError('');

    try {
      const res = await fetch('/api/convert-image-base64', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ imageUrl: urlToConvert.trim() }),
      });

      const data = await res.json();
      if (res.ok && data.base64) {
        setImageBase64(data.base64);
      } else {
        setImageConvertError(data.error || 'No se pudo convertir la imagen.');
      }
    } catch (err) {
      setImageConvertError('Error al contactar el conversor de imagen.');
    } finally {
      setIsConvertingImage(false);
    }
  };

  // Handle manual file upload directly to base64
  const handleFileUpload = (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (!file) return;

    const reader = new FileReader();
    reader.onload = () => {
      if (typeof reader.result === 'string') {
        setImageBase64(reader.result);
        setSongImageUrl(file.name);
      }
    };
    reader.readAsDataURL(file);
  };

  // Add song to Setlist
  const handleAddSongToSetlist = (e: React.FormEvent) => {
    e.preventDefault();
    if (!songTitle.trim()) return;

    const cover =
      imageBase64.trim() ||
      songImageUrl.trim() ||
      'https://images.unsplash.com/photo-1511671782779-c97d3d27a1d4?w=300&auto=format&fit=crop&q=80';

    adminActions.addSong(
      songTitle.trim(),
      songArtist.trim() || 'Banda Colapso',
      'Setlist COLAPSO',
      cover,
      'Rock'
    );

    setSongTitle('');
    setSongArtist('');
    setSongImageUrl('');
    setImageBase64('');
    setImageConvertError('');
  };

  // Save current setlist to Supabase
  const handleSaveToSupabase = async () => {
    setIsSyncingSupabase(true);
    setSupabaseStatusMsg('');
    try {
      const res = await fetch('/api/supabase/save-setlist', { method: 'POST' });
      const data = await res.json();
      if (res.ok) {
        setSupabaseStatusMsg('✅ Setlist sincronizado con Supabase');
      } else {
        setSupabaseStatusMsg(`⚠️ ${data.error || 'Configura credenciales en .env'}`);
      }
    } catch (err) {
      setSupabaseStatusMsg('⚠️ Supabase no configurado o sin conexión');
    } finally {
      setIsSyncingSupabase(false);
      setTimeout(() => setSupabaseStatusMsg(''), 4000);
    }
  };

  // Load setlist from Supabase
  const handleLoadFromSupabase = async () => {
    setIsSyncingSupabase(true);
    setSupabaseStatusMsg('');
    try {
      const res = await fetch('/api/supabase/load-setlist');
      const data = await res.json();
      if (res.ok && data.songs) {
        setSupabaseStatusMsg(`✅ ${data.count} canciones cargadas desde Supabase`);
      } else {
        setSupabaseStatusMsg(`⚠️ ${data.error || 'No se pudo cargar desde Supabase'}`);
      }
    } catch (err) {
      setSupabaseStatusMsg('⚠️ Error cargando desde Supabase');
    } finally {
      setIsSyncingSupabase(false);
      setTimeout(() => setSupabaseStatusMsg(''), 4000);
    }
  };

  const handleSaveStreams = (e: React.FormEvent) => {
    e.preventDefault();
    adminActions.updateStreams({
      isLiveActive,
      tiktokLive: tiktokLive.trim(),
      youtubeLive: youtubeLive.trim(),
      facebookLive: facebookLive.trim(),
    });
    setStreamsSaved(true);
    setTimeout(() => setStreamsSaved(false), 2000);
  };

  const handleSaveSocials = (e: React.FormEvent) => {
    e.preventDefault();
    adminActions.updateSocials({
      instagram: instagram.trim(),
      spotify: spotify.trim(),
    });
    setSocialsSaved(true);
    setTimeout(() => setSocialsSaved(false), 2000);
  };

  const handleSaveLocation = (e: React.FormEvent) => {
    e.preventDefault();
    if (adminActions.updateLocation) {
      adminActions.updateLocation(locationUrl.trim(), locationName.trim());
      setLocationSaved(true);
      setTimeout(() => setLocationSaved(false), 2000);
    }
  };

  const handleConfirmTopSong = () => {
    if (topSong) {
      adminActions.selectWinnerAndPlay(topSong.songId);
    }
  };

  const handleExecuteCrowdRequest = () => {
    if (!selectedCrowdSongId) return;
    adminActions.crowdRequest(selectedCrowdSongId);
    setSelectedCrowdSongId('');
  };

  return (
    <div className="space-y-6">
      {/* Top Banner / Cockpit Header */}
      <div className="bg-white border-2 border-slate-200 rounded-2xl p-5 shadow-xs">
        <div className="flex flex-col sm:flex-row items-start sm:items-center justify-between gap-4">
          <div>
            <div className="flex items-center gap-2">
              <div className="w-9 h-9 rounded-xl bg-amber-500 text-slate-950 flex items-center justify-center font-bold">
                <Sliders className="w-5 h-5" />
              </div>
              <div>
                <h2 className="text-xl sm:text-2xl font-rock text-slate-950 tracking-wide uppercase m-0">
                  Panel de Control de la Banda (Backstage)
                </h2>
                <p className="text-xs text-slate-500">
                  Ronda actual: <strong>#{state.roundNumber}</strong> • {totalVotesCount} votos de fans recibidos
                </p>
              </div>
            </div>
          </div>

          <div className="flex items-center gap-2">
            <button
              onClick={() => adminActions.toggleVoting(!state.votingOpen)}
              className={`px-4 py-2.5 rounded-xl text-xs font-bold flex items-center gap-2 transition-all shadow-xs cursor-pointer ${
                state.votingOpen
                  ? 'bg-amber-100 text-amber-900 border border-amber-300 hover:bg-amber-200'
                  : 'bg-emerald-600 text-white hover:bg-emerald-700 shadow-sm'
              }`}
            >
              {state.votingOpen ? <Pause className="w-4 h-4" /> : <Play className="w-4 h-4" />}
              <span>{state.votingOpen ? 'Pausar Votaciones' : 'Reanudar Votaciones'}</span>
            </button>
          </div>
        </div>
      </div>

      {/* Currently Playing On Stage Status (If any) */}
      {currentPlaying && (
        <div className="p-4 rounded-2xl bg-emerald-50 border-2 border-emerald-400 flex flex-col sm:flex-row items-start sm:items-center justify-between gap-3 shadow-xs">
          <div className="flex items-center gap-3 min-w-0">
            {currentPlaying.coverUrl && (
              <img
                src={currentPlaying.coverUrl}
                alt={currentPlaying.title}
                className="w-12 h-12 rounded-lg object-cover border border-emerald-300 shrink-0"
              />
            )}
            <div>
              <div className="flex items-center gap-2">
                <span className="text-[10px] font-black uppercase px-2 py-0.5 rounded bg-emerald-200 text-emerald-900 border border-emerald-300">
                  Tocando en Escenario
                </span>
                {currentPlaying.isCrowdRequest && (
                  <span className="text-[10px] font-black uppercase px-2 py-0.5 rounded bg-amber-200 text-amber-900 border border-amber-400 flex items-center gap-1">
                    <Flame className="w-3 h-3 text-amber-700" />
                    Pedido del Público
                  </span>
                )}
              </div>
              <h4 className="text-base font-black text-slate-900 font-rock uppercase m-0 truncate">
                {currentPlaying.title}
              </h4>
              <p className="text-xs text-cyan-800 italic font-semibold">{currentPlaying.artist}</p>
            </div>
          </div>

          <button
            onClick={() => adminActions.finishPlaying(currentPlaying.id)}
            className="px-3.5 py-2 rounded-xl bg-slate-900 hover:bg-slate-800 text-white text-xs font-bold flex items-center gap-1.5 shadow-2xs transition-colors cursor-pointer shrink-0"
          >
            <CheckCircle className="w-3.5 h-3.5 text-emerald-400" />
            <span>Finalizar Tema</span>
          </button>
        </div>
      )}

      {/* TWO PRIMARY STAGE ACTIONS: A) CONFIRM VOTE WINNER  vs  B) PEDIDO DEL PÚBLICO */}
      <div className="grid grid-cols-1 md:grid-cols-2 gap-5">
        {/* ACTION A: CONFIRMAR CANCIÓN MÁS VOTADA */}
        <div className="bg-white border-2 border-slate-200 rounded-2xl p-5 space-y-4 shadow-xs">
          <div className="flex items-center justify-between border-b border-slate-100 pb-3">
            <div className="flex items-center gap-2">
              <div className="w-7 h-7 rounded-lg bg-emerald-100 text-emerald-700 flex items-center justify-center">
                <Zap className="w-4 h-4" />
              </div>
              <h3 className="text-base font-black font-rock text-slate-900 uppercase m-0">
                1. Ganadora por Votación
              </h3>
            </div>
            <span className="text-xs font-bold text-slate-500">Ronda #{state.roundNumber}</span>
          </div>

          {topSong ? (
            <div className="p-4 rounded-xl bg-emerald-50/70 border-2 border-emerald-400 space-y-3">
              <div className="flex items-center justify-between">
                <span className="text-[10px] uppercase font-black text-emerald-800 bg-emerald-200/80 px-2 py-0.5 rounded border border-emerald-300">
                  LÍDER EN VOTOS (#1)
                </span>
                <span className="text-xs font-black text-emerald-900 bg-white px-2.5 py-0.5 rounded-full border border-emerald-300 shadow-2xs">
                  {topSong.voteCount} votos ({topSong.percentage}%)
                </span>
              </div>

              <div className="flex items-center gap-3">
                {topSong.coverUrl && (
                  <img
                    src={topSong.coverUrl}
                    alt={topSong.title}
                    className="w-14 h-14 rounded-xl object-cover border border-emerald-300 shadow-xs shrink-0"
                  />
                )}
                <div>
                  <h4 className="text-lg font-black font-rock uppercase text-slate-950 m-0">
                    {topSong.title}
                  </h4>
                  <p className="text-xs font-bold italic text-cyan-800">{topSong.artist}</p>
                </div>
              </div>

              <p className="text-[11px] text-slate-600 leading-snug">
                Al presionar confirmar, se bloquea esta canción en el público como tocada, se borran los votos de la ronda y se habilita la votación de la siguiente canción.
              </p>

              <button
                onClick={handleConfirmTopSong}
                className="w-full py-3 rounded-xl bg-emerald-600 hover:bg-emerald-700 text-white font-black text-xs sm:text-sm uppercase tracking-wider flex items-center justify-center gap-2 transition-all shadow-md cursor-pointer"
              >
                <Sparkles className="w-4 h-4" />
                <span>Confirmar y Tocar Esta Canción Ahora</span>
              </button>
            </div>
          ) : (
            <div className="p-6 rounded-xl bg-slate-50 border border-slate-200 text-center text-xs text-slate-500">
              Esperando votos de los fans en esta ronda...
            </div>
          )}

          {/* Simulate Audience Votes Tool */}
          <div className="pt-3 border-t border-slate-100">
            <span className="text-[11px] font-bold text-slate-500 uppercase block mb-1.5">
              Simulador de Votos (Para pruebas antes del show):
            </span>
            <div className="flex gap-2">
              <button
                onClick={() => adminActions.simulateVotes(10)}
                className="flex-1 py-1.5 rounded-lg bg-slate-100 hover:bg-slate-200 text-slate-800 text-xs font-bold transition-colors"
              >
                +10 Votos Fans
              </button>
              <button
                onClick={() => adminActions.simulateVotes(25)}
                className="flex-1 py-1.5 rounded-lg bg-slate-100 hover:bg-slate-200 text-slate-800 text-xs font-bold transition-colors"
              >
                +25 Votos Fans
              </button>
            </div>
          </div>
        </div>

        {/* ACTION B: PEDIDO DEL PÚBLICO (A VIVA VOZ) */}
        <div className="bg-white border-2 border-slate-200 rounded-2xl p-5 space-y-4 shadow-xs">
          <div className="flex items-center justify-between border-b border-slate-100 pb-3">
            <div className="flex items-center gap-2">
              <div className="w-7 h-7 rounded-lg bg-amber-100 text-amber-700 flex items-center justify-center">
                <Flame className="w-4 h-4" />
              </div>
              <h3 className="text-base font-black font-rock text-slate-900 uppercase m-0">
                2. Opción Especial: Pedido del Público
              </h3>
            </div>
          </div>

          <div className="p-4 rounded-xl bg-amber-50/80 border-2 border-amber-300 space-y-3">
            <p className="text-xs text-amber-950 leading-snug">
              Si un músico pide a alguien del público una canción a viva voz, elígela aquí: se posicionará en el número correspondiente, tendrá la etiqueta <strong>"PEDIDO DE PÚBLICO"</strong> y se resetearán los votos para el siguiente tema.
            </p>

            <div>
              <label className="block text-[11px] font-bold text-slate-700 mb-1 uppercase">
                Selecciona la canción solicitada por el fan:
              </label>
              <select
                value={selectedCrowdSongId}
                onChange={(e) => setSelectedCrowdSongId(e.target.value)}
                className="w-full px-3 py-2 text-xs font-semibold rounded-xl bg-white border border-amber-400 text-slate-900 focus:outline-none focus:ring-2 focus:ring-amber-300"
              >
                <option value="">-- Elige una canción del repertorio --</option>
                {activeSongs.map((s) => (
                  <option key={s.songId} value={s.songId}>
                    {s.title} ({s.artist})
                  </option>
                ))}
              </select>
            </div>

            <button
              onClick={handleExecuteCrowdRequest}
              disabled={!selectedCrowdSongId}
              className={`w-full py-3 rounded-xl font-black text-xs sm:text-sm uppercase tracking-wider flex items-center justify-center gap-2 transition-all shadow-sm ${
                selectedCrowdSongId
                  ? 'bg-amber-500 hover:bg-amber-600 text-slate-950 cursor-pointer shadow-amber-500/20'
                  : 'bg-slate-200 text-slate-400 cursor-not-allowed'
              }`}
            >
              <Flame className="w-4 h-4 fill-current" />
              <span>Marcar como Pedido del Público y Tocar</span>
            </button>
          </div>
        </div>
      </div>

      {/* LIVE STREAM LINKS CONFIGURATION (TikTok, YouTube, Facebook) */}
      <div className="bg-white border-2 border-slate-200 rounded-2xl p-5 space-y-4 shadow-xs">
        <div className="flex items-center justify-between border-b border-slate-100 pb-3">
          <div className="flex items-center gap-2">
            <div className="w-7 h-7 rounded-lg bg-red-100 text-red-600 flex items-center justify-center">
              <Video className="w-4 h-4" />
            </div>
            <div>
              <h3 className="text-base font-black font-rock text-slate-900 uppercase m-0">
                Enlaces de Transmisión en Vivo (Live)
              </h3>
              <p className="text-xs text-slate-500">
                Aparecerán como botones destacados en la parte superior de la página del público
              </p>
            </div>
          </div>
        </div>

        <form onSubmit={handleSaveStreams} className="space-y-3">
          <div className="flex items-center gap-3 p-3 rounded-xl bg-slate-50 border border-slate-200">
            <input
              type="checkbox"
              id="toggle-live-active"
              checked={isLiveActive}
              onChange={(e) => setIsLiveActive(e.target.checked)}
              className="w-4 h-4 rounded text-red-600 focus:ring-red-500 cursor-pointer"
            />
            <label
              htmlFor="toggle-live-active"
              className="text-xs font-bold text-slate-800 cursor-pointer"
            >
              Activar barra de transmisión en directo en la página de los fans
            </label>
          </div>

          <div className="grid grid-cols-1 sm:grid-cols-3 gap-3">
            <div>
              <label className="block text-xs font-bold text-slate-700 mb-1">
                TikTok Live URL
              </label>
              <input
                type="url"
                value={tiktokLive}
                onChange={(e) => setTiktokLive(e.target.value)}
                placeholder="https://tiktok.com/@bandacolapso/live"
                className="w-full px-3 py-2 text-xs rounded-xl bg-white border border-slate-300 focus:border-red-500 text-slate-900"
              />
            </div>

            <div>
              <label className="block text-xs font-bold text-slate-700 mb-1">
                YouTube Live URL
              </label>
              <input
                type="url"
                value={youtubeLive}
                onChange={(e) => setYoutubeLive(e.target.value)}
                placeholder="https://youtube.com/live/..."
                className="w-full px-3 py-2 text-xs rounded-xl bg-white border border-slate-300 focus:border-red-500 text-slate-900"
              />
            </div>

            <div>
              <label className="block text-xs font-bold text-slate-700 mb-1">
                Facebook Live URL
              </label>
              <input
                type="url"
                value={facebookLive}
                onChange={(e) => setFacebookLive(e.target.value)}
                placeholder="https://facebook.com/watch/live/..."
                className="w-full px-3 py-2 text-xs rounded-xl bg-white border border-slate-300 focus:border-red-500 text-slate-900"
              />
            </div>
          </div>

          <div className="flex justify-end">
            <button
              type="submit"
              className="px-4 py-2 rounded-xl bg-slate-900 hover:bg-slate-800 text-white text-xs font-bold flex items-center gap-1.5 transition-colors cursor-pointer"
            >
              {streamsSaved ? <Check className="w-4 h-4 text-emerald-400" /> : null}
              <span>{streamsSaved ? '¡Guardado!' : 'Guardar Enlaces Live'}</span>
            </button>
          </div>
        </form>
      </div>

      {/* GOOGLE MAPS VENUE LOCATION CONFIGURATION */}
      <div className="bg-white border-2 border-slate-200 rounded-2xl p-5 space-y-4 shadow-xs">
        <div className="flex items-center gap-2 border-b border-slate-100 pb-3">
          <div className="w-7 h-7 rounded-lg bg-emerald-100 text-emerald-700 flex items-center justify-center">
            <MapPin className="w-4 h-4" />
          </div>
          <div>
            <h3 className="text-base font-black font-rock text-slate-900 uppercase m-0">
              Ubicación del Concierto (Google Maps)
            </h3>
            <p className="text-xs text-slate-500">
              Inyecta el enlace y nombre del recinto para que el público lo abra desde el inicio
            </p>
          </div>
        </div>

        <form onSubmit={handleSaveLocation} className="space-y-3">
          <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
            <div>
              <label className="block text-xs font-bold text-slate-700 mb-1">
                Nombre del Local / Recinto
              </label>
              <input
                type="text"
                value={locationName}
                onChange={(e) => setLocationName(e.target.value)}
                placeholder="Ej: Estadio Nacional, Lima / Bar La Noche de Barranco"
                className="w-full px-3 py-2 text-xs rounded-xl bg-white border border-slate-300 focus:border-emerald-500 text-slate-900"
              />
            </div>

            <div>
              <label className="block text-xs font-bold text-slate-700 mb-1">
                Enlace a Google Maps (URL)
              </label>
              <input
                type="url"
                value={locationUrl}
                onChange={(e) => setLocationUrl(e.target.value)}
                placeholder="https://maps.google.com/?q=..."
                className="w-full px-3 py-2 text-xs rounded-xl bg-white border border-slate-300 focus:border-emerald-500 text-slate-900"
              />
            </div>
          </div>

          <div className="flex items-center justify-between pt-1">
            {/* Live attendance preview summary */}
            <div className="text-xs text-slate-500">
              Asistencia actual:{' '}
              <strong className="text-emerald-700 font-bold">
                {state.attendances ? Object.values(state.attendances).filter((a) => a === 'in_person').length : 0} presenciales
              </strong>{' '}
              •{' '}
              <strong className="text-cyan-700 font-bold">
                {state.attendances ? Object.values(state.attendances).filter((a) => a === 'virtual').length : 0} virtuales
              </strong>
            </div>

            <button
              type="submit"
              className="px-4 py-2 rounded-xl bg-slate-900 hover:bg-slate-800 text-white text-xs font-bold flex items-center gap-1.5 transition-colors cursor-pointer"
            >
              {locationSaved ? <Check className="w-4 h-4 text-emerald-400" /> : null}
              <span>{locationSaved ? '¡Ubicación Actualizada!' : 'Inyectar Ubicación al Público'}</span>
            </button>
          </div>
        </form>
      </div>

      {/* TICKER MESSAGE FOR FANS */}
      <div className="bg-white border-2 border-slate-200 rounded-2xl p-5 shadow-xs">
        <h3 className="text-sm font-black font-rock text-slate-900 uppercase flex items-center gap-2 mb-2">
          <Send className="w-4 h-4 text-emerald-600" />
          <span>Mensaje de la Banda para el Público (Cintillo Superior)</span>
        </h3>
        <form
          onSubmit={(e) => {
            e.preventDefault();
            adminActions.setMessage(customMsg);
          }}
          className="flex gap-2"
        >
          <input
            type="text"
            value={customMsg}
            onChange={(e) => setCustomMsg(e.target.value)}
            placeholder="Ej: ¡Bienvenidos al concierto de COLAPSO! Voten su tema favorito..."
            className="flex-1 px-4 py-2.5 rounded-xl bg-slate-50 border border-slate-300 text-xs text-slate-900 focus:outline-none focus:border-emerald-500"
          />
          <button
            type="submit"
            className="px-4 py-2.5 rounded-xl bg-emerald-600 hover:bg-emerald-700 text-white font-bold text-xs transition-colors cursor-pointer"
          >
            Publicar
          </button>
        </form>
      </div>

      {/* SETLIST GESTIÓN & CONFIGURACIÓN INTEGRADO CON SUPABASE */}
      <div className="bg-white border-2 border-slate-200 rounded-2xl p-5 space-y-5 shadow-xs">
        <div className="flex flex-col sm:flex-row items-start sm:items-center justify-between gap-3 border-b border-slate-100 pb-4">
          <div className="flex items-center gap-2.5">
            <div className="w-8 h-8 rounded-xl bg-emerald-100 text-emerald-800 flex items-center justify-center">
              <Database className="w-4 h-4" />
            </div>
            <div>
              <h3 className="text-base font-black font-rock text-slate-950 uppercase m-0">
                Setlist del Concierto ({state.songs.length} temas)
              </h3>
              <p className="text-xs text-slate-500">
                Agrega canciones con URL de imagen (convertible a Base64), título y artista.
              </p>
            </div>
          </div>

          {/* Supabase Actions */}
          <div className="flex flex-wrap items-center gap-2">
            {supabaseStatusMsg && (
              <span className="text-xs font-bold text-emerald-800 px-2.5 py-1 bg-emerald-50 rounded-lg border border-emerald-200">
                {supabaseStatusMsg}
              </span>
            )}
            <button
              type="button"
              onClick={handleSaveToSupabase}
              disabled={isSyncingSupabase}
              className="px-3 py-1.5 rounded-xl bg-emerald-700 hover:bg-emerald-800 text-white text-xs font-bold flex items-center gap-1.5 transition-colors cursor-pointer disabled:opacity-50"
              title="Guardar y respaldar setlist en Supabase"
            >
              {isSyncingSupabase ? <Loader2 className="w-3.5 h-3.5 animate-spin" /> : <UploadCloud className="w-3.5 h-3.5" />}
              <span>Guardar en Supabase</span>
            </button>
            <button
              type="button"
              onClick={handleLoadFromSupabase}
              disabled={isSyncingSupabase}
              className="px-3 py-1.5 rounded-xl bg-slate-100 hover:bg-slate-200 text-slate-800 text-xs font-bold flex items-center gap-1.5 transition-colors cursor-pointer disabled:opacity-50"
              title="Cargar canciones guardadas en Supabase"
            >
              <Database className="w-3.5 h-3.5 text-slate-600" />
              <span>Cargar de Supabase</span>
            </button>
          </div>
        </div>

        {/* Form to Add New Song to Setlist: Image URL -> Base64, Title, Artist */}
        <form onSubmit={handleAddSongToSetlist} className="p-4 rounded-2xl bg-slate-50 border border-slate-200 space-y-3">
          <div className="flex items-center justify-between">
            <span className="text-xs font-black uppercase text-slate-800 tracking-wider flex items-center gap-1.5">
              <Plus className="w-3.5 h-3.5 text-emerald-600" />
              Agregar Canción al Setlist
            </span>
            <span className="text-[11px] text-slate-500">
              Convierte URLs de carátulas a Base64 para carga instantánea
            </span>
          </div>

          <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
            <div>
              <label className="block text-[11px] font-bold uppercase text-slate-600 mb-1">
                Título de la Canción *
              </label>
              <input
                type="text"
                required
                placeholder="Ej: De Música Ligera / Mi Enfermedad"
                value={songTitle}
                onChange={(e) => setSongTitle(e.target.value)}
                className="w-full px-3 py-2 rounded-xl bg-white border border-slate-300 focus:border-emerald-500 text-xs text-slate-900 font-medium"
              />
            </div>

            <div>
              <label className="block text-[11px] font-bold uppercase text-slate-600 mb-1">
                Artista *
              </label>
              <input
                type="text"
                required
                placeholder="Ej: Soda Stereo / Los Rodríguez / COLAPSO"
                value={songArtist}
                onChange={(e) => setSongArtist(e.target.value)}
                className="w-full px-3 py-2 rounded-xl bg-white border border-slate-300 focus:border-emerald-500 text-xs text-slate-900 font-medium"
              />
            </div>
          </div>

          {/* Image URL with Convert-to-Base64 Button + Direct File Input */}
          <div>
            <label className="block text-[11px] font-bold uppercase text-slate-600 mb-1">
              URL de la Carátula (o subir archivo para convertir a Base64)
            </label>
            <div className="flex flex-col sm:flex-row gap-2">
              <div className="relative flex-1">
                <input
                  type="text"
                  placeholder="https://images.unsplash.com/... o enlace público de la imagen"
                  value={songImageUrl}
                  onChange={(e) => setSongImageUrl(e.target.value)}
                  className="w-full px-3 py-2 rounded-xl bg-white border border-slate-300 focus:border-emerald-500 text-xs text-slate-900"
                />
              </div>

              <button
                type="button"
                onClick={() => handleConvertUrlToBase64(songImageUrl)}
                disabled={isConvertingImage || !songImageUrl.trim()}
                className="px-3.5 py-2 rounded-xl bg-slate-900 hover:bg-slate-800 text-white text-xs font-bold flex items-center justify-center gap-1.5 transition-colors cursor-pointer shrink-0 disabled:opacity-40"
              >
                {isConvertingImage ? <Loader2 className="w-3.5 h-3.5 animate-spin" /> : <FileImage className="w-3.5 h-3.5 text-amber-400" />}
                <span>Convertir a Base64</span>
              </button>

              <label className="px-3.5 py-2 rounded-xl bg-white border border-slate-300 hover:bg-slate-100 text-slate-700 text-xs font-bold flex items-center justify-center gap-1.5 transition-colors cursor-pointer shrink-0">
                <Image className="w-3.5 h-3.5 text-emerald-600" />
                <span>Subir Archivo</span>
                <input
                  type="file"
                  accept="image/*"
                  onChange={handleFileUpload}
                  className="hidden"
                />
              </label>
            </div>

            {imageConvertError && (
              <p className="text-[11px] text-red-600 mt-1 font-semibold">{imageConvertError}</p>
            )}

            {/* Base64 preview indicator */}
            {imageBase64 && (
              <div className="mt-2 flex items-center gap-3 p-2 rounded-xl bg-emerald-50 border border-emerald-200">
                <img
                  src={imageBase64}
                  alt="Preview"
                  className="w-10 h-10 rounded-lg object-cover border border-emerald-300 shrink-0"
                />
                <div className="min-w-0 flex-1">
                  <p className="text-xs font-bold text-emerald-900 m-0">
                    ✓ Imagen convertida a Base64 con éxito
                  </p>
                  <p className="text-[10px] text-emerald-700 truncate font-mono">
                    {imageBase64.substring(0, 60)}...
                  </p>
                </div>
                <button
                  type="button"
                  onClick={() => setImageBase64('')}
                  className="text-xs text-red-600 font-bold hover:underline"
                >
                  Quitar
                </button>
              </div>
            )}
          </div>

          <div className="pt-2 flex justify-end">
            <button
              type="submit"
              className="px-5 py-2.5 rounded-xl bg-emerald-600 hover:bg-emerald-700 text-white font-black text-xs uppercase tracking-wider flex items-center gap-2 shadow-xs cursor-pointer transition-all"
            >
              <Plus className="w-4 h-4" />
              <span>Guardar Canción en Setlist</span>
            </button>
          </div>
        </form>

        {/* Current Setlist Table: Only Title and Artist */}
        <div>
          <h4 className="text-xs font-black uppercase text-slate-700 tracking-wider mb-2">
            Canciones en el Setlist ({state.songs.length})
          </h4>
          <div className="divide-y divide-slate-100 border border-slate-200 rounded-2xl overflow-hidden max-h-96 overflow-y-auto bg-white">
            {state.songs.map((song, index) => {
              const isPlaying = song.id === state.currentPlayingSongId;
              const isPlayed = song.status === 'played';

              return (
                <div
                  key={song.id}
                  className={`p-3 flex items-center justify-between gap-3 transition-colors ${
                    isPlaying ? 'bg-emerald-50/80' : isPlayed ? 'bg-slate-50/60 opacity-60' : 'hover:bg-slate-50'
                  }`}
                >
                  <div className="flex items-center gap-3 min-w-0">
                    <span className="w-6 text-center text-xs font-black text-slate-400 font-mono">
                      #{index + 1}
                    </span>
                    {song.coverUrl && (
                      <img
                        src={song.coverUrl}
                        alt={song.title}
                        className="w-10 h-10 rounded-lg object-cover border border-slate-200 shrink-0"
                      />
                    )}
                    <div className="min-w-0">
                      <p className="text-sm font-black text-slate-900 uppercase tracking-wide truncate m-0">
                        {song.title}
                      </p>
                      <p className="text-xs text-cyan-800 font-bold uppercase italic truncate m-0">
                        {song.artist}
                      </p>
                    </div>
                  </div>

                  <div className="flex items-center gap-2 shrink-0">
                    {isPlaying && (
                      <span className="text-[10px] font-black uppercase px-2 py-0.5 rounded bg-emerald-100 text-emerald-800 border border-emerald-300">
                        En Vivo
                      </span>
                    )}
                    {isPlayed && (
                      <span className="text-[10px] font-bold px-2 py-0.5 rounded bg-slate-100 text-slate-500">
                        Tocada
                      </span>
                    )}
                    {!isPlayed && !isPlaying && (
                      <button
                        onClick={() => adminActions.selectWinnerAndPlay(song.id)}
                        className="px-2.5 py-1 rounded-lg bg-slate-100 hover:bg-emerald-600 hover:text-white text-xs font-bold text-slate-700 transition-colors cursor-pointer"
                      >
                        Tocar
                      </button>
                    )}
                    <button
                      type="button"
                      onClick={() => adminActions.removeSong(song.id)}
                      className="p-1.5 rounded-lg text-slate-400 hover:text-red-600 hover:bg-red-50 transition-colors cursor-pointer"
                      title="Eliminar del setlist"
                    >
                      <Trash2 className="w-4 h-4" />
                    </button>
                  </div>
                </div>
              );
            })}
          </div>
        </div>
      </div>

      {/* DANGER ZONE: RESET CONCERT */}
      <div className="p-4 rounded-xl bg-red-50 border border-red-200 flex flex-col sm:flex-row items-start sm:items-center justify-between gap-3 shadow-2xs">
        <div>
          <span className="text-xs font-black uppercase text-red-800 flex items-center gap-1.5">
            <AlertTriangle className="w-4 h-4 text-red-600" />
            Reiniciar Concierto
          </span>
          <p className="text-[11px] text-red-700 mt-0.5">
            Borra los votos de todas las rondas y desbloquea todas las canciones para un nuevo show.
          </p>
        </div>

        {showConfirmReset ? (
          <div className="flex items-center gap-2">
            <button
              onClick={() => {
                adminActions.resetVotes();
                setShowConfirmReset(false);
              }}
              className="px-3.5 py-1.5 rounded-lg bg-red-600 hover:bg-red-700 text-white font-black text-xs cursor-pointer shadow-xs"
            >
              Confirmar Reinicio Completo
            </button>
            <button
              onClick={() => setShowConfirmReset(false)}
              className="px-3 py-1.5 rounded-lg bg-slate-200 text-slate-700 text-xs font-bold cursor-pointer"
            >
              Cancelar
            </button>
          </div>
        ) : (
          <button
            onClick={() => setShowConfirmReset(true)}
            className="px-3.5 py-1.5 rounded-lg bg-white border border-red-300 hover:bg-red-100 text-red-700 text-xs font-bold flex items-center gap-1.5 transition-colors cursor-pointer"
          >
            <RotateCcw className="w-3.5 h-3.5" />
            <span>Reiniciar Show</span>
          </button>
        )}
      </div>
    </div>
  );
};
