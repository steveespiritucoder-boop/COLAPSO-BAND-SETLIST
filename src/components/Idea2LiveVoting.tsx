import React, { useState } from 'react';
import {
  Check,
  Trophy,
  Lock,
  Sparkles,
  Flame,
  AlertCircle,
  HelpCircle,
  ChevronDown,
  ChevronUp,
  Search,
  CheckCircle2,
  MapPin,
  Users,
  Eye,
  Vote,
  ExternalLink,
  Dices,
} from 'lucide-react';
import { Song, LiveSongVoteResult, AttendanceType } from '../types';
import { ColapsoLogo } from './ColapsoLogo';

interface Idea2LiveVotingProps {
  activeSongs: LiveSongVoteResult[];
  playedSongs: Song[];
  currentlyPlayingSong: Song | null;
  roundNumber: number;
  userVoteSongId?: string;
  isVotingOpen: boolean;
  totalVotes: number;
  connectedClients: number;
  locationUrl?: string;
  locationName?: string;
  userAttendance?: AttendanceType;
  attendanceStats?: { inPerson: number; virtual: number };
  onVote: (songId: string) => void;
  onSetAttendance?: (attendance: AttendanceType) => void;
}

function getSpanishOrdinal(n: number, isFemale: boolean = false): string {
  const ordinalsMasc: Record<number, string> = {
    1: '1er',
    2: '2do',
    3: '3er',
    4: '4to',
    5: '5to',
    6: '6to',
    7: '7mo',
    8: '8vo',
    9: '9no',
    10: '10mo',
    11: '11vo',
    12: '12vo',
  };
  const ordinalsFem: Record<number, string> = {
    1: '1ra',
    2: '2da',
    3: '3ra',
    4: '4ta',
    5: '5ta',
    6: '6ta',
    7: '7ma',
    8: '8va',
    9: '9na',
    10: '10ma',
    11: '11va',
    12: '12va',
  };
  if (isFemale) {
    return ordinalsFem[n] || `${n}ª`;
  }
  return ordinalsMasc[n] || `${n}º`;
}

export const Idea2LiveVoting: React.FC<Idea2LiveVotingProps> = ({
  activeSongs,
  playedSongs,
  currentlyPlayingSong,
  roundNumber,
  userVoteSongId,
  isVotingOpen,
  totalVotes,
  connectedClients,
  locationUrl,
  locationName,
  userAttendance,
  attendanceStats,
  onVote,
  onSetAttendance,
}) => {
  const [showInstructions, setShowInstructions] = useState(true);
  const [searchQuery, setSearchQuery] = useState('');

  const maxVotes = Math.max(...activeSongs.map((s) => s.voteCount), 1);
  const topVoteCount = activeSongs[0]?.voteCount || 0;
  const tiedTopSongs = topVoteCount > 0 ? activeSongs.filter((s) => s.voteCount === topVoteCount) : [];
  const hasTie = tiedTopSongs.length >= 2;

  // Dynamic round calculation
  const playedCount = playedSongs.length + (currentlyPlayingSong ? 1 : 0);
  const targetThemeNumber = Math.max(roundNumber, playedCount + 1);

  // Attendance calculations
  const inPersonCount = attendanceStats?.inPerson ?? 0;
  const virtualCount = attendanceStats?.virtual ?? 0;
  const totalAudience = inPersonCount + virtualCount;
  const inPersonPct = totalAudience > 0 ? Math.round((inPersonCount / totalAudience) * 100) : 50;
  const virtualPct = totalAudience > 0 ? 100 - inPersonPct : 50;

  // Filter unplayed songs by search
  const filteredActiveSongs = activeSongs.filter((song) => {
    if (!searchQuery.trim()) return true;
    const q = searchQuery.toLowerCase();
    return song.title.toLowerCase().includes(q) || song.artist.toLowerCase().includes(q);
  });

  // Vote click handler with gentle haptic vibration feedback on mobile
  const handleVoteClick = (songId: string) => {
    if (!isVotingOpen) return;
    if (typeof navigator !== 'undefined' && 'vibrate' in navigator) {
      try {
        navigator.vibrate(25);
      } catch (_) {}
    }
    onVote(songId);
  };

  return (
    <div className="space-y-5 text-stone-900">
      {/* Dynamic Show Stage Headline: Rock concert styling */}
      <div className="rounded-2xl bg-[#faf6ed] border-2 border-red-600 shadow-2xl shadow-black/50 p-5 sm:p-6 text-center text-stone-900">
        <div>
          <span className="inline-block text-[11px] font-black uppercase tracking-widest px-3 py-1 rounded-full bg-red-600 text-white shadow-xs mb-2 font-rock">
            ⚡ RONDA EN VIVO #{targetThemeNumber}
          </span>
          <h2 className="text-3xl sm:text-5xl font-black text-stone-950 font-rock tracking-wide uppercase m-0 leading-tight">
            VOTA TU {getSpanishOrdinal(targetThemeNumber, false).toUpperCase()} TEMA
          </h2>
          <p className="text-xs sm:text-sm font-semibold text-stone-700 mt-1.5">
            {isVotingOpen
              ? 'Toca el círculo de tu canción favorita para votar en tiempo real'
              : 'Votación pausada momentáneamente por la banda'}
          </p>
        </div>

        {/* Live Audience Counters: Viewers + Current Voters */}
        <div className="mt-4 pt-4 border-t border-[#ded5c0] grid grid-cols-1 sm:grid-cols-2 gap-3 max-w-lg mx-auto text-xs font-bold">
          {/* Stats #1: Personas viendo la página */}
          <div className="flex items-center justify-center gap-2 bg-white/80 px-4 py-2.5 rounded-xl border border-[#ded5c0] shadow-xs">
            <Eye className="w-4 h-4 text-cyan-600 shrink-0" />
            <span className="text-stone-700">Personas viendo la página:</span>
            <strong className="text-stone-950 text-sm font-rock tracking-wider">
              {connectedClients}
            </strong>
          </div>

          {/* Stats #2: Usuarios votando para el tema actual */}
          <div className="flex items-center justify-center gap-2 bg-white/80 px-4 py-2.5 rounded-xl border border-red-200 shadow-xs">
            <Vote className="w-4 h-4 text-red-600 shrink-0" />
            <span className="text-stone-700">Votando tema actual:</span>
            <strong className="text-red-600 text-sm font-rock tracking-wider">
              {totalVotes} {totalVotes === 1 ? 'voto' : 'votos'}
            </strong>
          </div>
        </div>

        {!isVotingOpen && (
          <div className="mt-3 inline-flex items-center gap-2 px-4 py-1.5 rounded-full bg-amber-100 text-amber-950 border-2 border-amber-400 text-xs font-bold shadow-xs">
            <Lock className="w-3.5 h-3.5 text-amber-800 shrink-0" />
            {hasTie ? (
              <span className="flex items-center gap-1.5 flex-wrap justify-center">
                <span>Votación en pausa • <strong>¡Empate en el 1° lugar entre {tiedTopSongs.length} temas!</strong></span>
                <span className="inline-flex items-center gap-1 px-2 py-0.5 rounded bg-amber-200 text-amber-900 font-rock uppercase text-[11px]">
                  <Dices className="w-3 h-3 text-amber-800" /> La banda desempatará al azar
                </span>
              </span>
            ) : (
              <span>Votación en pausa momentáneamente por la banda</span>
            )}
          </div>
        )}
      </div>

      {/* Google Maps Venue Location + Attendance Presencial/Virtual Stats */}
      <div className="rounded-2xl bg-[#faf6ed] border-2 border-[#e2d8c3] p-4 sm:p-5 shadow-2xl shadow-black/50 space-y-4">
        {/* Google Maps Location Link */}
        <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-3 pb-3 border-b border-[#ded5c0]">
          <div className="flex items-center gap-2.5 min-w-0">
            <div className="w-9 h-9 rounded-xl bg-red-100 text-red-700 border border-red-200 flex items-center justify-center shrink-0">
              <MapPin className="w-5 h-5" />
            </div>
            <div className="min-w-0">
              <span className="text-[10px] font-black uppercase tracking-wider text-stone-600 block font-rock">
                Lugar del Concierto
              </span>
              <span className="text-sm font-bold text-stone-950 truncate block">
                {locationName || 'Concierto en Vivo - Banda COLAPSO'}
              </span>
            </div>
          </div>

          {locationUrl ? (
            <a
              href={locationUrl}
              target="_blank"
              rel="noreferrer"
              className="inline-flex items-center justify-center gap-1.5 px-3.5 py-2 rounded-xl bg-stone-950 hover:bg-stone-800 text-white text-xs font-bold transition-colors shadow-xs cursor-pointer shrink-0 font-rock uppercase tracking-wider"
            >
              <MapPin className="w-3.5 h-3.5 text-red-500" />
              <span>Ver Ubicación en Google Maps</span>
              <ExternalLink className="w-3 h-3 opacity-70" />
            </a>
          ) : (
            <span className="text-xs text-stone-500 italic">Ubicación no inyectada</span>
          )}
        </div>

        {/* Espectador Presencial vs Virtual Selection & Live Stats */}
        <div>
          <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-2 mb-3">
            <div>
              <h4 className="text-xs font-black font-rock uppercase text-stone-900 tracking-wider m-0">
                ¿Cómo estás viviendo el show de COLAPSO?
              </h4>
              <p className="text-[11px] text-stone-600">
                Selecciona tu modalidad para las estadísticas del concierto
              </p>
            </div>

            {/* Attendance Toggle Buttons */}
            {onSetAttendance && (
              <div className="inline-flex rounded-xl p-1 bg-[#ebe3cf] border border-[#ded5c0]">
                <button
                  type="button"
                  onClick={() => onSetAttendance('in_person')}
                  className={`px-3 py-1 rounded-lg text-xs font-bold transition-all cursor-pointer font-rock uppercase ${
                    userAttendance === 'in_person'
                      ? 'bg-red-600 text-white shadow-xs'
                      : 'text-stone-700 hover:text-stone-950'
                  }`}
                >
                  📍 En el Concierto
                </button>
                <button
                  type="button"
                  onClick={() => onSetAttendance('virtual')}
                  className={`px-3 py-1 rounded-lg text-xs font-bold transition-all cursor-pointer font-rock uppercase ${
                    userAttendance === 'virtual'
                      ? 'bg-cyan-700 text-white shadow-xs'
                      : 'text-stone-700 hover:text-stone-950'
                  }`}
                >
                  💻 En Transmisión Virtual
                </button>
              </div>
            )}
          </div>

          {/* Attendance Stats Progress Distribution */}
          <div className="space-y-1.5">
            <div className="flex items-center justify-between text-xs font-bold">
              <span className="text-red-700 flex items-center gap-1 font-rock uppercase">
                <span className="w-2 h-2 rounded-full bg-red-600" />
                Presencial: <strong>{inPersonCount}</strong> ({inPersonPct}%)
              </span>
              <span className="text-cyan-700 flex items-center gap-1 font-rock uppercase">
                <span className="w-2 h-2 rounded-full bg-cyan-600" />
                Virtual: <strong>{virtualCount}</strong> ({virtualPct}%)
              </span>
            </div>

            {/* Dual Color Progress Bar */}
            <div className="h-2.5 w-full bg-[#ebe3cf] rounded-full overflow-hidden flex border border-[#ded5c0]">
              <div
                className="h-full bg-red-600 transition-all duration-500"
                style={{ width: `${inPersonPct}%` }}
                title={`Presencial: ${inPersonCount}`}
              />
              <div
                className="h-full bg-cyan-600 transition-all duration-500"
                style={{ width: `${virtualPct}%` }}
                title={`Virtual: ${virtualCount}`}
              />
            </div>
          </div>
        </div>
      </div>

      {/* Instrucciones antes de empezar (Collapsible Card) */}
      <div className="rounded-2xl bg-[#faf6ed] border-2 border-[#e2d8c3] shadow-2xl shadow-black/50 overflow-hidden">
        <button
          onClick={() => setShowInstructions(!showInstructions)}
          className="w-full px-5 py-3.5 flex items-center justify-between gap-3 text-left hover:bg-[#f4eee0] transition-colors cursor-pointer"
        >
          <div className="flex items-center gap-2.5">
            <div className="w-7 h-7 rounded-lg bg-red-100 text-red-700 border border-red-200 flex items-center justify-center shrink-0">
              <HelpCircle className="w-4 h-4" />
            </div>
            <div>
              <h4 className="text-sm font-black font-rock text-stone-950 uppercase tracking-wide m-0">
                Instrucciones para el Público
              </h4>
              <p className="text-xs text-stone-600">¿Cómo decidir el setlist en vivo?</p>
            </div>
          </div>
          <div className="text-stone-600">
            {showInstructions ? (
              <ChevronUp className="w-4 h-4" />
            ) : (
              <ChevronDown className="w-4 h-4" />
            )}
          </div>
        </button>

        {showInstructions && (
          <div className="px-5 pb-4 pt-1 border-t border-[#ded5c0] grid grid-cols-1 sm:grid-cols-3 gap-3 text-xs text-stone-800">
            <div className="p-3 rounded-xl bg-white border border-[#ded5c0] flex flex-col gap-1 shadow-2xs">
              <span className="font-bold text-stone-950 text-sm flex items-center gap-1 font-rock uppercase">
                <span className="w-5 h-5 rounded-full bg-red-600 text-white flex items-center justify-center text-xs">
                  1
                </span>
                Marca tu canción
              </span>
              <p className="text-stone-600 leading-relaxed">
                Toca el círculo a la izquierda de la canción de la lista que quieras que toque COLAPSO.
              </p>
            </div>

            <div className="p-3 rounded-xl bg-white border border-[#ded5c0] flex flex-col gap-1 shadow-2xs">
              <span className="font-bold text-stone-950 text-sm flex items-center gap-1 font-rock uppercase">
                <span className="w-5 h-5 rounded-full bg-red-600 text-white flex items-center justify-center text-xs">
                  2
                </span>
                Sigue las barras en vivo
              </span>
              <p className="text-stone-600 leading-relaxed">
                La barra roja sube en tiempo real con los votos de todos. El tema con mayor porcentaje gana.
              </p>
            </div>

            <div className="p-3 rounded-xl bg-white border border-[#ded5c0] flex flex-col gap-1 shadow-2xs">
              <span className="font-bold text-stone-950 text-sm flex items-center gap-1 font-rock uppercase">
                <span className="w-5 h-5 rounded-full bg-red-600 text-white flex items-center justify-center text-xs">
                  3
                </span>
                Votación continua
              </span>
              <p className="text-stone-600 leading-relaxed">
                Al confirmar cada tema, se bloquea en el historial y se abre la votación del siguiente tema.
              </p>
            </div>
          </div>
        )}
      </div>

      {/* User voting notice if not voted yet */}
      {!userVoteSongId && isVotingOpen && (
        <div className="flex items-center gap-2.5 p-3 rounded-xl bg-[#fff5f0] border-2 border-red-300 text-red-950 text-xs font-semibold shadow-md">
          <Sparkles className="w-4 h-4 text-red-600 shrink-0" />
          <span>
            <strong className="font-rock uppercase tracking-wider text-red-800">¡Tu voto cuenta!</strong> Toca cualquier canción para sumarle tu voto. Si la tocas nuevamente, se desmarcará.
          </span>
        </div>
      )}

      {/* User notice if already voted */}
      {userVoteSongId && isVotingOpen && (
        <div className="flex items-center justify-between gap-2.5 p-2.5 sm:p-3 rounded-xl bg-red-50 border-2 border-red-400 text-red-950 text-xs font-semibold shadow-md">
          <div className="flex items-center gap-2.5 min-w-0">
            <span className="w-5 h-5 rounded-full bg-red-600 text-white flex items-center justify-center shrink-0">
              <Check className="w-3.5 h-3.5 stroke-[3]" />
            </span>
            <span className="truncate">
              Votaste por <strong className="text-red-700">{activeSongs.find((s) => s.songId === userVoteSongId)?.title || 'tu tema'}</strong>. Toca de nuevo para desmarcar o elige otra.
            </span>
          </div>
          <button
            type="button"
            onClick={() => handleVoteClick(userVoteSongId)}
            className="text-[11px] font-rock uppercase text-red-700 hover:text-red-950 bg-red-100 hover:bg-red-200 px-3 py-1 rounded-lg transition-colors cursor-pointer shrink-0 font-bold"
          >
            Desmarcar
          </button>
        </div>
      )}

      {/* Search & Filter Bar */}
      {activeSongs.length > 0 && (
        <div className="flex items-center justify-between gap-3">
          <div className="relative flex-1 max-w-sm">
            <Search className="w-4 h-4 text-stone-500 absolute left-3 top-1/2 -translate-y-1/2" />
            <input
              type="text"
              value={searchQuery}
              onChange={(e) => setSearchQuery(e.target.value)}
              placeholder="Buscar por canción o artista..."
              className="w-full pl-9 pr-3 py-2 text-xs rounded-xl bg-[#faf6ed] border-2 border-[#ded5c0] focus:outline-hidden focus:border-red-600 focus:ring-2 focus:ring-red-500/20 text-stone-950 placeholder:text-stone-500 shadow-sm"
            />
          </div>

          <span className="text-xs font-bold text-stone-400 shrink-0 font-rock tracking-wider">
            {activeSongs.length} TEMAS DISPONIBLES
          </span>
        </div>
      )}

      {/* Empty State when no songs are added yet by the band */}
      {activeSongs.length === 0 && playedSongs.length === 0 && (
        <div className="text-center py-12 px-6 bg-[#faf6ed] border-2 border-dashed border-[#ded5c0] rounded-3xl space-y-4 shadow-xl">
          <ColapsoLogo size="md" showSubtitle />
          <h3 className="text-lg font-black font-rock uppercase text-stone-950 m-0 tracking-wide mt-2">
            ESPERANDO EL SETLIST DE LA BANDA
          </h3>
          <p className="text-xs text-stone-600 max-w-md mx-auto leading-relaxed">
            La banda COLAPSO cargará las canciones para esta presentación. En cuanto se agreguen los temas, aparecerán aquí con su imagen, título y artista para que votes en tiempo real.
          </p>
        </div>
      )}

      {/* ACTIVE REPERTOIRE LIST WITH PROGRESS BARS & CIRCLE SELECTION */}
      <div className="space-y-3">
        {filteredActiveSongs.map((song) => {
          const isSelected = userVoteSongId === song.songId;
          const barWidthPercent =
            maxVotes > 0 ? Math.max(5, Math.round((song.voteCount / maxVotes) * 100)) : 5;
          const isLeader = song.rank === 1 && song.voteCount > 0;

          return (
            <div
              key={song.songId}
              onClick={() => handleVoteClick(song.songId)}
              className={`group relative overflow-hidden rounded-2xl border-2 transition-all duration-200 cursor-pointer ${
                isSelected
                  ? 'border-red-600 bg-[#fff5f0] shadow-2xl ring-2 ring-red-500/40'
                  : isLeader
                  ? 'border-red-500 bg-[#faf6ed] hover:border-red-600 shadow-xl'
                  : 'border-[#ded5c0] bg-[#faf6ed] hover:border-stone-400 shadow-md'
              } ${!isVotingOpen ? 'cursor-not-allowed opacity-85' : ''}`}
            >
              {/* Dynamic Horizontal Red/Rock Progress Bar fused with Vertical Bar */}
              <div
                className={`absolute inset-y-0 left-0 transition-all duration-500 ease-out pointer-events-none ${
                  isSelected
                    ? 'bg-gradient-to-l from-red-600 via-red-500/40 to-transparent'
                    : isLeader
                    ? 'bg-gradient-to-l from-red-600/95 via-red-500/35 to-transparent'
                    : song.voteCount > 0
                    ? 'bg-gradient-to-l from-red-600/85 via-red-500/25 to-transparent'
                    : 'bg-gradient-to-l from-stone-400/40 via-stone-300/15 to-transparent'
                }`}
                style={{ width: `${barWidthPercent}%` }}
              >
                {/* Vertical Leading Edge Bar - completely integrated with the intense red gradient */}
                <div
                  className={`absolute top-0 bottom-0 right-0 w-1.5 transition-all duration-500 ${
                    isSelected
                      ? 'bg-red-600 shadow-[0_0_12px_#dc2626]'
                      : isLeader
                      ? 'bg-red-600 shadow-[0_0_8px_#ef4444]'
                      : song.voteCount > 0
                      ? 'bg-red-600'
                      : 'bg-[#b8ac92]'
                  }`}
                />
              </div>

              {/* Main Song Content Card */}
              <div className="relative z-10 p-3 sm:p-4 flex items-center justify-between gap-3 sm:gap-4">
                {/* Left Group: Circle Selection + Album Cover + Title / Artist */}
                <div className="flex items-center gap-3 min-w-0 flex-1">
                  {/* Circle Selector (Checkbox/Radio button on the left as requested) */}
                  <button
                    type="button"
                    onClick={(e) => {
                      e.stopPropagation();
                      handleVoteClick(song.songId);
                    }}
                    className={`w-7 h-7 sm:w-8 sm:h-8 rounded-full flex items-center justify-center shrink-0 transition-transform active:scale-95 border-2 cursor-pointer ${
                      isSelected
                        ? 'bg-red-600 border-red-600 text-white shadow-md ring-3 ring-red-200'
                        : 'bg-white border-stone-400 text-transparent hover:border-red-600'
                    }`}
                    aria-label={isSelected ? `Desmarcar voto para ${song.title}` : `Votar por ${song.title}`}
                    title={isSelected ? 'Toca para desmarcar tu voto' : `Votar por ${song.title}`}
                  >
                    <Check className="w-4 h-4 stroke-[3]" />
                  </button>

                  {/* Album Cover Thumbnail */}
                  <div className="relative w-14 h-14 sm:w-16 sm:h-16 rounded-xl overflow-hidden shrink-0 border border-[#ded5c0] bg-[#ede6d4] shadow-2xs">
                    {song.coverUrl ? (
                      <img
                        src={song.coverUrl}
                        alt={song.title}
                        className="w-full h-full object-cover"
                        loading="lazy"
                      />
                    ) : (
                      <div className="w-full h-full flex items-center justify-center bg-stone-900 text-white font-rock text-xs">
                        COLAPSO
                      </div>
                    )}
                    {isLeader && (
                      <div className="absolute top-1 left-1 w-5 h-5 rounded-md bg-red-600 text-white flex items-center justify-center shadow-xs">
                        <Trophy className="w-3 h-3" />
                      </div>
                    )}
                  </div>

                  {/* Title and Artist */}
                  <div className="min-w-0 flex-1">
                    <div className="flex items-center gap-2">
                      <h3 className="text-base sm:text-lg font-black font-rock uppercase tracking-wide truncate m-0 text-stone-950">
                        {song.title}
                      </h3>
                      {isSelected && (
                        <span className="hidden sm:inline-flex items-center gap-1 text-[10px] font-black uppercase px-2 py-0.5 rounded-full bg-red-600 text-white shrink-0 font-rock">
                          <CheckCircle2 className="w-3 h-3" /> Tu Voto
                        </span>
                      )}
                    </div>

                    <p className="text-xs sm:text-sm font-bold uppercase tracking-wider text-red-700 mt-0.5 truncate font-rock">
                      {song.artist}
                    </p>
                  </div>
                </div>

                {/* Right Group: Vote Counts, Percentage & Dynamic Bar Value */}
                <div className="flex flex-col items-end justify-center shrink-0">
                  <div className="flex items-baseline gap-1 text-stone-950">
                    <span className="text-lg sm:text-2xl font-black font-rock tracking-wider">
                      {song.voteCount}
                    </span>
                    <span className="text-xs font-semibold text-stone-600">
                      {song.voteCount === 1 ? 'voto' : 'votos'}
                    </span>
                  </div>

                  {/* Percentage Chip */}
                  <span
                    className={`text-xs font-bold font-mono px-2 py-0.5 rounded-md mt-0.5 font-rock ${
                      isSelected
                        ? 'bg-red-600 text-white'
                        : isLeader
                        ? 'bg-red-100 text-red-900 border border-red-300 font-black'
                        : 'bg-stone-950 text-stone-100'
                    }`}
                  >
                    {song.percentage}%
                  </span>
                </div>
              </div>
            </div>
          );
        })}
      </div>

      {filteredActiveSongs.length === 0 && (
        <div className="text-center py-10 bg-[#faf6ed] border-2 border-[#ded5c0] rounded-2xl p-6 shadow-xl">
          <AlertCircle className="w-8 h-8 text-stone-500 mx-auto mb-2" />
          <p className="text-stone-900 font-bold">No se encontraron canciones con "{searchQuery}"</p>
          <button
            onClick={() => setSearchQuery('')}
            className="text-xs text-red-700 font-bold hover:underline mt-1 cursor-pointer font-rock uppercase"
          >
            Limpiar filtro de búsqueda
          </button>
        </div>
      )}

      {/* PLAYED / LOCKED SONGS HISTORY SECTION */}
      {playedSongs.length > 0 && (
        <div className="mt-8 pt-6 border-t-2 border-stone-800">
          <div className="flex items-center justify-between gap-2 mb-3">
            <div className="flex items-center gap-2">
              <Lock className="w-4 h-4 text-stone-400" />
              <h4 className="text-sm sm:text-base font-black font-rock uppercase tracking-wider text-stone-300 m-0">
                Canciones Ya Tocadas y Bloqueadas ({playedSongs.length})
              </h4>
            </div>
            <span className="text-xs text-stone-400 font-medium">
              Quedan {activeSongs.length} temas en el repertorio
            </span>
          </div>

          <div className="grid grid-cols-1 sm:grid-cols-2 gap-2.5">
            {playedSongs.map((song, idx) => {
              const isCrowdReq = Boolean(song.isCrowdRequest);
              const playedRoundNumber = song.playedRound || idx + 1;

              return (
                <div
                  key={song.id}
                  className={`flex items-center justify-between p-3 rounded-xl border-2 transition-all shadow-md ${
                    isCrowdReq
                      ? 'bg-[#faf6ed] border-amber-400'
                      : 'bg-[#faf6ed] border-[#ded5c0]'
                  }`}
                >
                  <div className="flex items-center gap-2.5 min-w-0">
                    {/* Position circle */}
                    <div className="w-7 h-7 rounded-lg bg-[#ebe3cf] border border-[#ded5c0] flex items-center justify-center font-rock text-xs font-black text-stone-900 shrink-0">
                      #{playedRoundNumber}
                    </div>

                    {/* Mini Cover */}
                    {song.coverUrl && (
                      <img
                        src={song.coverUrl}
                        alt={song.title}
                        className="w-9 h-9 rounded-md object-cover border border-[#ded5c0] shrink-0"
                      />
                    )}

                    <div className="min-w-0">
                      <p className="text-xs font-black text-stone-950 font-rock uppercase truncate m-0">
                        {song.title}
                      </p>
                      <p className="text-[11px] text-red-700 font-rock font-semibold truncate m-0">
                        {song.artist}
                      </p>
                    </div>
                  </div>

                  {/* Locked & Badge Status */}
                  <div className="shrink-0 ml-2">
                    {isCrowdReq ? (
                      <span className="inline-flex items-center gap-1 text-[10px] font-black uppercase px-2 py-0.5 rounded bg-amber-200 text-amber-950 border border-amber-400 shadow-2xs font-rock">
                        <Flame className="w-3 h-3 text-amber-900 fill-amber-900" />
                        PEDIDO DE PÚBLICO
                      </span>
                    ) : (
                      <span className="inline-flex items-center gap-1 text-[10px] font-bold px-2 py-0.5 rounded bg-[#ebe3cf] text-stone-700 border border-[#ded5c0] font-rock">
                        <Lock className="w-3 h-3 text-stone-600" />
                        Tocada
                      </span>
                    )}
                  </div>
                </div>
              );
            })}
          </div>
        </div>
      )}
    </div>
  );
};
