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
} from 'lucide-react';
import { Song, LiveSongVoteResult, AttendanceType } from '../types';

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

  return (
    <div className="space-y-5">
      {/* Dynamic Show Stage Headline: Clean user requested phrasing */}
      <div className="rounded-2xl bg-gradient-to-br from-white via-slate-50 to-emerald-50/40 border-2 border-slate-200 shadow-sm p-5 sm:p-6 text-center">
        <div>
          <span className="inline-block text-[11px] font-black uppercase tracking-widest px-3 py-1 rounded-full bg-emerald-100 text-emerald-800 border border-emerald-300 mb-2 shadow-2xs">
            ⚡ RONDA EN VIVO #{targetThemeNumber}
          </span>
          <h2 className="text-3xl sm:text-5xl font-black text-slate-950 font-rock tracking-wide uppercase m-0 leading-tight">
            VOTA TU {getSpanishOrdinal(targetThemeNumber, false).toUpperCase()} TEMA
          </h2>
          <p className="text-xs sm:text-sm font-semibold text-slate-600 mt-1.5">
            {isVotingOpen
              ? 'Toca el círculo de tu canción favorita para votar en tiempo real'
              : 'Votación pausada momentáneamente por la banda'}
          </p>
        </div>

        {/* Live Audience Counters: Viewers + Current Voters */}
        <div className="mt-4 pt-4 border-t border-slate-200/80 grid grid-cols-1 sm:grid-cols-2 gap-3 max-w-lg mx-auto text-xs font-bold">
          {/* Stats #1: Personas viendo la página */}
          <div className="flex items-center justify-center gap-2 bg-white px-4 py-2.5 rounded-xl border border-slate-200 shadow-2xs">
            <Eye className="w-4 h-4 text-cyan-600 shrink-0" />
            <span className="text-slate-600">Personas viendo la página:</span>
            <strong className="text-slate-950 text-sm font-rock tracking-wider">
              {connectedClients}
            </strong>
          </div>

          {/* Stats #2: Usuarios votando para el tema actual */}
          <div className="flex items-center justify-center gap-2 bg-white px-4 py-2.5 rounded-xl border border-emerald-200 shadow-2xs">
            <Vote className="w-4 h-4 text-emerald-600 shrink-0" />
            <span className="text-slate-600">Votando tema actual:</span>
            <strong className="text-emerald-700 text-sm font-rock tracking-wider">
              {totalVotes} {totalVotes === 1 ? 'voto' : 'votos'}
            </strong>
          </div>
        </div>

        {!isVotingOpen && (
          <div className="mt-3 inline-flex items-center gap-1.5 px-3.5 py-1 rounded-full bg-amber-100 text-amber-900 border border-amber-300 text-xs font-bold">
            <Lock className="w-3.5 h-3.5 text-amber-700" />
            <span>Votación en pausa • Si hay empate al cerrar, el sistema elige uno al azar</span>
          </div>
        )}
      </div>

      {/* Google Maps Venue Location + Attendance Presencial/Virtual Stats */}
      <div className="rounded-2xl bg-white border border-slate-200 p-4 sm:p-5 shadow-xs space-y-4">
        {/* Google Maps Location Link */}
        <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-3 pb-3 border-b border-slate-100">
          <div className="flex items-center gap-2.5 min-w-0">
            <div className="w-9 h-9 rounded-xl bg-emerald-100 text-emerald-700 flex items-center justify-center shrink-0">
              <MapPin className="w-5 h-5" />
            </div>
            <div className="min-w-0">
              <span className="text-[10px] font-black uppercase tracking-wider text-slate-400 block">
                Lugar del Concierto
              </span>
              <span className="text-sm font-bold text-slate-900 truncate block">
                {locationName || 'Concierto en Vivo - Banda COLAPSO'}
              </span>
            </div>
          </div>

          {locationUrl ? (
            <a
              href={locationUrl}
              target="_blank"
              rel="noreferrer"
              className="inline-flex items-center justify-center gap-1.5 px-3.5 py-2 rounded-xl bg-slate-900 hover:bg-slate-800 text-white text-xs font-bold transition-colors shadow-2xs cursor-pointer shrink-0"
            >
              <MapPin className="w-3.5 h-3.5 text-emerald-400" />
              <span>Ver Ubicación en Google Maps</span>
              <ExternalLink className="w-3 h-3 opacity-70" />
            </a>
          ) : (
            <span className="text-xs text-slate-400 italic">Ubicación no inyectada</span>
          )}
        </div>

        {/* Espectador Presencial vs Virtual Selection & Live Stats */}
        <div>
          <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-2 mb-3">
            <div>
              <h4 className="text-xs font-black font-rock uppercase text-slate-900 tracking-wide m-0">
                ¿Cómo estás viviendo el show de COLAPSO?
              </h4>
              <p className="text-[11px] text-slate-500">
                Selecciona tu modalidad para las estadísticas del concierto
              </p>
            </div>

            {/* Attendance Toggle Buttons */}
            {onSetAttendance && (
              <div className="inline-flex rounded-xl p-1 bg-slate-100 border border-slate-200">
                <button
                  type="button"
                  onClick={() => onSetAttendance('in_person')}
                  className={`px-3 py-1 rounded-lg text-xs font-bold transition-all cursor-pointer ${
                    userAttendance === 'in_person'
                      ? 'bg-emerald-600 text-white shadow-2xs'
                      : 'text-slate-600 hover:text-slate-900'
                  }`}
                >
                  📍 En el Concierto
                </button>
                <button
                  type="button"
                  onClick={() => onSetAttendance('virtual')}
                  className={`px-3 py-1 rounded-lg text-xs font-bold transition-all cursor-pointer ${
                    userAttendance === 'virtual'
                      ? 'bg-cyan-700 text-white shadow-2xs'
                      : 'text-slate-600 hover:text-slate-900'
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
              <span className="text-emerald-800 flex items-center gap-1">
                <span className="w-2 h-2 rounded-full bg-emerald-600" />
                Presencial: <strong>{inPersonCount}</strong> ({inPersonPct}%)
              </span>
              <span className="text-cyan-800 flex items-center gap-1">
                <span className="w-2 h-2 rounded-full bg-cyan-600" />
                Virtual: <strong>{virtualCount}</strong> ({virtualPct}%)
              </span>
            </div>

            {/* Dual Color Progress Bar */}
            <div className="h-2.5 w-full bg-slate-100 rounded-full overflow-hidden flex border border-slate-200">
              <div
                className="h-full bg-emerald-600 transition-all duration-500"
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
      <div className="rounded-2xl bg-white border border-slate-200 shadow-xs overflow-hidden">
        <button
          onClick={() => setShowInstructions(!showInstructions)}
          className="w-full px-5 py-3.5 flex items-center justify-between gap-3 text-left hover:bg-slate-50 transition-colors"
        >
          <div className="flex items-center gap-2.5">
            <div className="w-7 h-7 rounded-lg bg-emerald-100 text-emerald-700 flex items-center justify-center shrink-0">
              <HelpCircle className="w-4 h-4" />
            </div>
            <div>
              <h4 className="text-sm font-black font-rock text-slate-900 uppercase tracking-wide m-0">
                Instrucciones para el Público
              </h4>
              <p className="text-xs text-slate-500">¿Cómo decidir el setlist en vivo?</p>
            </div>
          </div>
          <div className="text-slate-400">
            {showInstructions ? (
              <ChevronUp className="w-4 h-4" />
            ) : (
              <ChevronDown className="w-4 h-4" />
            )}
          </div>
        </button>

        {showInstructions && (
          <div className="px-5 pb-4 pt-1 border-t border-slate-100 grid grid-cols-1 sm:grid-cols-3 gap-3 text-xs text-slate-600">
            <div className="p-3 rounded-xl bg-slate-50 border border-slate-200 flex flex-col gap-1">
              <span className="font-bold text-slate-900 text-sm flex items-center gap-1">
                <span className="w-5 h-5 rounded-full bg-emerald-600 text-white flex items-center justify-center text-xs">
                  1
                </span>
                Marca tu canción
              </span>
              <p className="text-slate-600">
                Toca el círculo a la izquierda de la canción de la lista que quieras que toque COLAPSO.
              </p>
            </div>

            <div className="p-3 rounded-xl bg-slate-50 border border-slate-200 flex flex-col gap-1">
              <span className="font-bold text-slate-900 text-sm flex items-center gap-1">
                <span className="w-5 h-5 rounded-full bg-emerald-600 text-white flex items-center justify-center text-xs">
                  2
                </span>
                Sigue las barras en vivo
              </span>
              <p className="text-slate-600">
                La barra verde sube en tiempo real con los votos de todos. El tema con mayor porcentaje gana.
              </p>
            </div>

            <div className="p-3 rounded-xl bg-slate-50 border border-slate-200 flex flex-col gap-1">
              <span className="font-bold text-slate-900 text-sm flex items-center gap-1">
                <span className="w-5 h-5 rounded-full bg-emerald-600 text-white flex items-center justify-center text-xs">
                  3
                </span>
                Votación continua
              </span>
              <p className="text-slate-600">
                Al confirmar cada tema, se bloquea en el historial y se abre la votación del siguiente tema.
              </p>
            </div>
          </div>
        )}
      </div>

      {/* User voting notice if not voted yet */}
      {!userVoteSongId && isVotingOpen && (
        <div className="flex items-center gap-2.5 p-3 rounded-xl bg-emerald-50 border border-emerald-300 text-emerald-900 text-xs font-semibold shadow-2xs">
          <Sparkles className="w-4 h-4 text-emerald-600 shrink-0" />
          <span>
            <strong>¡Tu voto cuenta!</strong> Marca el círculo de cualquier canción abajo para sumar tu voto. Puedes cambiar tu elección en cualquier momento antes de que la banda empiece a tocar.
          </span>
        </div>
      )}

      {/* Search & Filter Bar */}
      {activeSongs.length > 0 && (
        <div className="flex items-center justify-between gap-3">
          <div className="relative flex-1 max-w-sm">
            <Search className="w-4 h-4 text-slate-400 absolute left-3 top-1/2 -translate-y-1/2" />
            <input
              type="text"
              value={searchQuery}
              onChange={(e) => setSearchQuery(e.target.value)}
              placeholder="Buscar por canción o artista..."
              className="w-full pl-9 pr-3 py-2 text-xs rounded-xl bg-white border border-slate-300 focus:outline-hidden focus:border-emerald-500 focus:ring-2 focus:ring-emerald-100 text-slate-800 placeholder:text-slate-400 shadow-2xs"
            />
          </div>

          <span className="text-xs font-bold text-slate-500 shrink-0">
            {activeSongs.length} temas disponibles para votar
          </span>
        </div>
      )}

      {/* Empty State when no songs are added yet by the band */}
      {activeSongs.length === 0 && playedSongs.length === 0 && (
        <div className="text-center py-12 px-6 bg-white border-2 border-dashed border-slate-300 rounded-3xl space-y-3">
          <div className="w-12 h-12 mx-auto rounded-2xl bg-emerald-50 text-emerald-600 flex items-center justify-center">
            <Sparkles className="w-6 h-6" />
          </div>
          <h3 className="text-base font-black font-rock uppercase text-slate-900 m-0">
            Esperando el Setlist de la Banda
          </h3>
          <p className="text-xs text-slate-500 max-w-md mx-auto">
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
              onClick={() => {
                if (isVotingOpen) onVote(song.songId);
              }}
              className={`group relative overflow-hidden rounded-2xl border-2 transition-all duration-200 cursor-pointer ${
                isSelected
                  ? 'border-emerald-500 bg-emerald-50/40 shadow-md ring-2 ring-emerald-400/30'
                  : isLeader
                  ? 'border-emerald-300 bg-white hover:border-emerald-400 shadow-xs'
                  : 'border-slate-200 bg-white hover:border-slate-300 hover:bg-slate-50/80 shadow-2xs'
              } ${!isVotingOpen ? 'cursor-not-allowed opacity-85' : ''}`}
            >
              {/* Dynamic Horizontal Emerald Progress Bar with gradient darker to lighter towards the left */}
              <div
                className={`absolute inset-y-0 left-0 transition-all duration-500 ease-out ${
                  isSelected
                    ? 'bg-gradient-to-l from-emerald-400/80 via-emerald-200/60 to-emerald-50/20'
                    : isLeader
                    ? 'bg-gradient-to-l from-emerald-400/70 via-emerald-200/50 to-emerald-50/20'
                    : 'bg-gradient-to-l from-slate-300/80 via-slate-200/50 to-slate-100/20'
                }`}
                style={{ width: `${barWidthPercent}%` }}
              />

              {/* Leading Edge Accent Line */}
              <div
                className={`absolute top-0 bottom-0 w-1.5 transition-all duration-500 ${
                  isSelected
                    ? 'bg-emerald-600'
                    : isLeader
                    ? 'bg-emerald-500'
                    : 'bg-slate-400'
                }`}
                style={{ left: `calc(${barWidthPercent}% - 3px)` }}
              />

              {/* Main Song Content Card */}
              <div className="relative z-10 p-3 sm:p-4 flex items-center justify-between gap-3 sm:gap-4">
                {/* Left Group: Circle Selection + Album Cover + Title / Artist */}
                <div className="flex items-center gap-3 min-w-0 flex-1">
                  {/* Circle Selector (Checkbox/Radio button on the left as requested) */}
                  <button
                    type="button"
                    onClick={(e) => {
                      e.stopPropagation();
                      if (isVotingOpen) onVote(song.songId);
                    }}
                    className={`w-7 h-7 sm:w-8 sm:h-8 rounded-full flex items-center justify-center shrink-0 transition-transform active:scale-95 border-2 ${
                      isSelected
                        ? 'bg-emerald-600 border-emerald-600 text-white shadow-sm ring-3 ring-emerald-100'
                        : 'bg-white border-slate-300 text-transparent hover:border-emerald-500'
                    }`}
                    aria-label={`Votar por ${song.title}`}
                  >
                    <Check className="w-4 h-4 stroke-[3]" />
                  </button>

                  {/* Album Cover Thumbnail (As shown in image.png) */}
                  <div className="relative w-14 h-14 sm:w-16 sm:h-16 rounded-xl overflow-hidden shrink-0 border border-slate-200 bg-slate-100 shadow-2xs">
                    {song.coverUrl ? (
                      <img
                        src={song.coverUrl}
                        alt={song.title}
                        className="w-full h-full object-cover"
                        loading="lazy"
                      />
                    ) : (
                      <div className="w-full h-full flex items-center justify-center bg-slate-900 text-white font-rock text-xs">
                        COLAPSO
                      </div>
                    )}
                    {isLeader && (
                      <div className="absolute top-1 left-1 w-5 h-5 rounded-md bg-emerald-500 text-white flex items-center justify-center shadow-xs">
                        <Trophy className="w-3 h-3" />
                      </div>
                    )}
                  </div>

                  {/* Title and Artist (Exact typography requested from image.png) */}
                  <div className="min-w-0 flex-1">
                    <div className="flex items-center gap-2">
                      <h3
                        className={`text-base sm:text-lg font-black font-sans uppercase tracking-wide truncate m-0 ${
                          isSelected ? 'text-emerald-950 font-black' : 'text-slate-900'
                        }`}
                      >
                        {song.title}
                      </h3>
                      {isSelected && (
                        <span className="hidden sm:inline-flex items-center gap-1 text-[10px] font-black uppercase px-2 py-0.5 rounded-full bg-emerald-600 text-white shrink-0">
                          <CheckCircle2 className="w-3 h-3" /> Tu Voto
                        </span>
                      )}
                    </div>

                    <p className="text-xs sm:text-sm font-bold uppercase tracking-wide italic text-cyan-800 mt-0.5 truncate">
                      {song.artist}
                    </p>
                  </div>
                </div>

                {/* Right Group: Vote Counts, Percentage & Dynamic Bar Value */}
                <div className="flex flex-col items-end justify-center shrink-0">
                  <div className="flex items-baseline gap-1 text-slate-900">
                    <span className="text-lg sm:text-2xl font-black font-rock tracking-wider">
                      {song.voteCount}
                    </span>
                    <span className="text-xs font-semibold text-slate-500">
                      {song.voteCount === 1 ? 'voto' : 'votos'}
                    </span>
                  </div>

                  {/* Percentage Chip */}
                  <span
                    className={`text-xs font-bold font-mono px-2 py-0.5 rounded-md mt-0.5 ${
                      isSelected
                        ? 'bg-emerald-600 text-white'
                        : isLeader
                        ? 'bg-emerald-100 text-emerald-800 font-black'
                        : 'bg-slate-100 text-slate-700'
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
        <div className="text-center py-10 bg-white border border-slate-200 rounded-2xl p-6">
          <AlertCircle className="w-8 h-8 text-slate-400 mx-auto mb-2" />
          <p className="text-slate-800 font-bold">No se encontraron canciones con "{searchQuery}"</p>
          <button
            onClick={() => setSearchQuery('')}
            className="text-xs text-emerald-600 font-bold hover:underline mt-1"
          >
            Limpiar filtro de búsqueda
          </button>
        </div>
      )}

      {/* PLAYED / LOCKED SONGS HISTORY SECTION */}
      {playedSongs.length > 0 && (
        <div className="mt-8 pt-6 border-t-2 border-slate-200">
          <div className="flex items-center justify-between gap-2 mb-3">
            <div className="flex items-center gap-2">
              <Lock className="w-4 h-4 text-slate-500" />
              <h4 className="text-sm sm:text-base font-black font-rock uppercase tracking-wider text-slate-800 m-0">
                Canciones Ya Tocadas y Bloqueadas ({playedSongs.length})
              </h4>
            </div>
            <span className="text-xs text-slate-500 font-medium">
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
                  className={`flex items-center justify-between p-3 rounded-xl border transition-all ${
                    isCrowdReq
                      ? 'bg-amber-50/80 border-amber-300'
                      : 'bg-slate-50 border-slate-200'
                  }`}
                >
                  <div className="flex items-center gap-2.5 min-w-0">
                    {/* Position circle */}
                    <div className="w-7 h-7 rounded-lg bg-white border border-slate-300 flex items-center justify-center font-rock text-xs font-black text-slate-700 shrink-0">
                      #{playedRoundNumber}
                    </div>

                    {/* Mini Cover */}
                    {song.coverUrl && (
                      <img
                        src={song.coverUrl}
                        alt={song.title}
                        className="w-9 h-9 rounded-md object-cover border border-slate-200 shrink-0 opacity-80"
                      />
                    )}

                    <div className="min-w-0">
                      <p className="text-xs font-black text-slate-800 uppercase truncate">
                        {song.title}
                      </p>
                      <p className="text-[11px] text-cyan-800 italic font-semibold truncate">
                        {song.artist}
                      </p>
                    </div>
                  </div>

                  {/* Locked & Badge Status */}
                  <div className="shrink-0 ml-2">
                    {isCrowdReq ? (
                      <span className="inline-flex items-center gap-1 text-[10px] font-black uppercase px-2 py-0.5 rounded bg-amber-200 text-amber-900 border border-amber-400 shadow-2xs">
                        <Flame className="w-3 h-3 text-amber-700 fill-amber-700" />
                        PEDIDO DE PÚBLICO
                      </span>
                    ) : (
                      <span className="inline-flex items-center gap-1 text-[10px] font-bold px-2 py-0.5 rounded bg-white text-slate-600 border border-slate-200">
                        <Lock className="w-3 h-3 text-slate-400" />
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
