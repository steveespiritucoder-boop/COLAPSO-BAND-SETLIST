import React, { useState } from 'react';
import {
  ArrowUpDown,
  SlidersHorizontal,
  ChevronUp,
  ChevronDown,
  Info,
  CheckCircle2,
  Sparkles,
  RefreshCw,
} from 'lucide-react';
import { Song, CascadeRankedSongResult } from '../types';

interface Idea1FullSetlistProps {
  songs: Song[];
  globalRankedResults: CascadeRankedSongResult[];
  userBallot: string[]; // array of song IDs in user's personal preference order
  onUpdateUserBallot: (newBallot: string[]) => void;
  isVotingOpen: boolean;
  totalVoters: number;
}

export const Idea1FullSetlist: React.FC<Idea1FullSetlistProps> = ({
  songs,
  globalRankedResults,
  userBallot,
  onUpdateUserBallot,
  isVotingOpen,
  totalVoters,
}) => {
  const [editingSongId, setEditingSongId] = useState<string | null>(null);
  const [showAlgorithmInfo, setShowAlgorithmInfo] = useState<boolean>(false);
  const [tabView, setTabView] = useState<'projected_consensus' | 'my_custom_order'>('projected_consensus');

  // Helper to move a song to a specific 1-based position in user's ballot
  const moveSongToPosition = (songId: string, targetPosition1Based: number) => {
    const targetIdx = Math.max(0, Math.min(targetPosition1Based - 1, songs.length - 1));
    const currentIdx = userBallot.indexOf(songId);
    if (currentIdx === -1) return;

    const newBallot = [...userBallot];
    const [removed] = newBallot.splice(currentIdx, 1);
    newBallot.splice(targetIdx, 0, removed);
    onUpdateUserBallot(newBallot);
    setEditingSongId(null);
  };

  // Move 1 position up
  const moveUp = (songId: string) => {
    const currentIdx = userBallot.indexOf(songId);
    if (currentIdx > 0) {
      moveSongToPosition(songId, currentIdx);
    }
  };

  // Move 1 position down
  const moveDown = (songId: string) => {
    const currentIdx = userBallot.indexOf(songId);
    if (currentIdx !== -1 && currentIdx < userBallot.length - 1) {
      moveSongToPosition(songId, currentIdx + 2);
    }
  };

  // Reset my ballot to default order
  const resetToDefault = () => {
    const defaultIds = [...songs].sort((a, b) => a.order - b.order).map((s) => s.id);
    onUpdateUserBallot(defaultIds);
  };

  return (
    <div className="space-y-6">
      {/* Header Info */}
      <div className="bg-zinc-900/80 border border-zinc-800 rounded-2xl p-4 sm:p-5">
        <div className="flex flex-col sm:flex-row items-start sm:items-center justify-between gap-3">
          <div>
            <div className="flex items-center gap-2">
              <SlidersHorizontal className="w-5 h-5 text-cyan-400" />
              <h3 className="text-xl sm:text-2xl font-rock text-white tracking-wide uppercase m-0">
                Setlist Completo Colaborativo
              </h3>
            </div>
            <p className="text-xs sm:text-sm text-zinc-400 mt-1">
              Arma tu orden ideal del concierto. El algoritmo de cascada combina los votos de todos sin repetir canciones.
            </p>
          </div>

          <div className="flex items-center gap-2 shrink-0">
            <button
              onClick={() => setShowAlgorithmInfo(!showAlgorithmInfo)}
              className="px-3 py-1.5 rounded-xl bg-zinc-800 hover:bg-zinc-700 text-xs font-semibold text-zinc-300 flex items-center gap-1.5 transition-colors"
            >
              <Info className="w-3.5 h-3.5 text-cyan-400" />
              <span>¿Cómo funciona el Algoritmo?</span>
            </button>

            <span className="text-xs bg-cyan-950/60 border border-cyan-800/60 text-cyan-300 px-2.5 py-1.5 rounded-xl font-medium">
              {totalVoters} {totalVoters === 1 ? 'votante' : 'votantes'}
            </span>
          </div>
        </div>

        {/* Algorithm explainer box */}
        {showAlgorithmInfo && (
          <div className="mt-4 p-4 rounded-xl bg-cyan-950/30 border border-cyan-500/30 text-xs text-zinc-300 space-y-2 animate-fadeIn">
            <p className="font-bold text-cyan-300 text-sm flex items-center gap-1.5">
              <Sparkles className="w-4 h-4 text-cyan-400" />
              Algoritmo de Cascada Anti-Duplicados (Resuelto):
            </p>
            <p>
              1. Para la <strong>Posición #1</strong>, se cuenta qué canción eligió la mayoría como primera (ej. <em>Por El Resto de Tus Días</em>). La ganadora se fija en el puesto #1.
            </p>
            <p>
              2. Para la <strong>Posición #2</strong>, esa canción ganadora se <strong>elimina de las opciones restantes</strong> para evitar que se duplique. La segunda más votada entre las restantes gana el puesto #2.
            </p>
            <p>
              3. Si en puestos inferiores (ej. Posición #5) varios fans votaron por un tema que ya ganó arriba, <strong>el sistema automáticamente promueve a la siguiente canción más repetida disponible</strong>. ¡Así cada tema aparece exactamente una sola vez!
            </p>
            <p className="text-zinc-400 pt-1 border-t border-cyan-800/40">
              Formato de cada tema: <code className="text-white font-mono bg-zinc-800 px-1.5 py-0.5 rounded">1. TITULO [5]</code> (donde 1 es la proyección global colectiva y [5] es tu voto individual, editable con un clic).
            </p>
          </div>
        )}

        {/* Sub tabs: Projected Consensus vs My Custom List */}
        <div className="flex gap-2 mt-4 pt-3 border-t border-zinc-800">
          <button
            onClick={() => setTabView('projected_consensus')}
            className={`px-3 py-1.5 rounded-lg text-xs font-bold transition-all ${
              tabView === 'projected_consensus'
                ? 'bg-cyan-500 text-black shadow-md shadow-cyan-500/20'
                : 'text-zinc-400 hover:text-white bg-zinc-800/50'
            }`}
          >
            Proyección Setlist Global en Vivo
          </button>
          <button
            onClick={() => setTabView('my_custom_order')}
            className={`px-3 py-1.5 rounded-lg text-xs font-bold transition-all ${
              tabView === 'my_custom_order'
                ? 'bg-cyan-500 text-black shadow-md shadow-cyan-500/20'
                : 'text-zinc-400 hover:text-white bg-zinc-800/50'
            }`}
          >
            Mi Selección Personal ({userBallot.length} temas)
          </button>
        </div>
      </div>

      {/* Main List Display */}
      {tabView === 'projected_consensus' ? (
        /* Global Projected Setlist View */
        <div className="space-y-2.5">
          <div className="flex items-center justify-between text-xs text-zinc-400 px-2 font-medium">
            <span>ORDEN PROYECTADO GLOBAL</span>
            <span>TU ELECCIÓN PERSONAL</span>
          </div>

          {globalRankedResults.map((item) => {
            const userVote = item.userVotePosition;
            const isEditing = editingSongId === item.song.id;

            return (
              <div
                key={item.song.id}
                className="group relative rounded-xl border border-zinc-800/80 bg-zinc-950/80 p-3.5 sm:p-4 hover:border-zinc-700 transition-all shadow-sm"
              >
                <div className="flex items-center justify-between gap-3">
                  {/* Left: Global Rank + Title + Algorithm notes */}
                  <div className="flex items-center gap-3 min-w-0">
                    <div className="w-8 h-8 rounded-lg bg-zinc-900 border border-zinc-700/80 flex items-center justify-center font-rock text-lg text-cyan-400 font-bold shrink-0">
                      {item.position}
                    </div>

                    <div className="min-w-0">
                      <div className="flex items-center gap-2">
                        <span className="text-sm sm:text-base font-bold text-white truncate">
                          {item.song.title}
                        </span>
                        {item.position === 1 && (
                          <span className="text-[10px] font-bold bg-amber-500/20 text-amber-300 border border-amber-500/30 px-1.5 py-0.5 rounded">
                            APERTURA / OPONER
                          </span>
                        )}
                        {item.position === songs.length && (
                          <span className="text-[10px] font-bold bg-emerald-500/20 text-emerald-300 border border-emerald-500/30 px-1.5 py-0.5 rounded">
                            CIERRE DE SHOW
                          </span>
                        )}
                      </div>
                      <p className="text-xs text-zinc-400 truncate">
                        <span className="text-zinc-500">{item.explanation}</span>
                      </p>
                    </div>
                  </div>

                  {/* Right: Personal vote button (as user asked: "[5]") */}
                  <div className="flex items-center gap-2 shrink-0">
                    <div className="flex flex-col items-end">
                      <span className="text-[10px] text-zinc-400 font-semibold uppercase">
                        Tu Voto
                      </span>
                      <button
                        id={`btn-user-pos-${item.song.id}`}
                        disabled={!isVotingOpen}
                        onClick={() => setEditingSongId(isEditing ? null : item.song.id)}
                        className={`mt-0.5 px-3 py-1 rounded-lg font-mono font-bold text-xs flex items-center gap-1 transition-all ${
                          userVote !== undefined
                            ? 'bg-cyan-500/10 text-cyan-300 border border-cyan-500/40 hover:bg-cyan-500 hover:text-black shadow-sm'
                            : 'bg-zinc-800 text-zinc-400 hover:bg-zinc-700'
                        }`}
                        title="Haz clic para cambiar en qué lugar quieres esta canción"
                      >
                        <span>[{userVote ?? '-'}]</span>
                        <ArrowUpDown className="w-3 h-3 opacity-70" />
                      </button>
                    </div>
                  </div>
                </div>

                {/* Inline Position Modifier Selector when clicked */}
                {isEditing && (
                  <div className="mt-3 pt-3 border-t border-zinc-800/80 bg-zinc-900/90 -mx-3.5 -mb-3.5 sm:-mx-4 sm:-mb-4 p-3 rounded-b-xl animate-fadeIn">
                    <div className="flex items-center justify-between mb-2">
                      <span className="text-xs font-bold text-cyan-300">
                        Cambiar posición para "{item.song.title}":
                      </span>
                      <button
                        onClick={() => setEditingSongId(null)}
                        className="text-xs text-zinc-400 hover:text-white"
                      >
                        Cerrar
                      </button>
                    </div>

                    <div className="flex flex-wrap gap-1.5">
                      {songs.map((_, idx) => {
                        const pos = idx + 1;
                        const isCurrent = userVote === pos;
                        return (
                          <button
                            key={pos}
                            onClick={() => moveSongToPosition(item.song.id, pos)}
                            className={`w-8 h-8 rounded-lg text-xs font-bold font-mono transition-all ${
                              isCurrent
                                ? 'bg-cyan-400 text-black ring-2 ring-cyan-300'
                                : 'bg-zinc-800 text-zinc-300 hover:bg-zinc-700 hover:text-white'
                            }`}
                          >
                            {pos}
                          </button>
                        );
                      })}
                    </div>
                  </div>
                )}
              </div>
            );
          })}
        </div>
      ) : (
        /* My Custom Order View with Up/Down Controls */
        <div className="space-y-2.5">
          <div className="flex items-center justify-between text-xs text-zinc-400 px-2 font-medium">
            <span>TU SETLIST PERSONAL (DE PRINCIPIO A FIN)</span>
            <button
              onClick={resetToDefault}
              className="text-xs text-zinc-400 hover:text-cyan-400 flex items-center gap-1 transition-colors"
            >
              <RefreshCw className="w-3 h-3" />
              <span>Restaurar orden original</span>
            </button>
          </div>

          {userBallot.map((songId, index) => {
            const song = songs.find((s) => s.id === songId);
            if (!song) return null;
            const position = index + 1;

            return (
              <div
                key={songId}
                className="flex items-center justify-between p-3.5 rounded-xl border border-zinc-800 bg-zinc-950/90 hover:border-zinc-700 transition-all gap-3"
              >
                <div className="flex items-center gap-3 min-w-0">
                  <div className="w-7 h-7 rounded-lg bg-cyan-950/60 border border-cyan-800/60 flex items-center justify-center font-rock text-base text-cyan-300 font-bold shrink-0">
                    {position}
                  </div>
                  <div className="min-w-0">
                    <p className="text-sm font-bold text-white truncate">{song.title}</p>
                    <p className="text-xs text-zinc-400">{song.artist}</p>
                  </div>
                </div>

                {/* Controls to Move Up or Down */}
                <div className="flex items-center gap-1 shrink-0">
                  <button
                    disabled={position === 1 || !isVotingOpen}
                    onClick={() => moveUp(songId)}
                    className="p-1.5 rounded-lg bg-zinc-900 border border-zinc-800 text-zinc-300 hover:bg-zinc-800 hover:text-cyan-300 disabled:opacity-30 disabled:cursor-not-allowed transition-colors"
                    title="Mover arriba"
                  >
                    <ChevronUp className="w-4 h-4" />
                  </button>
                  <button
                    disabled={position === songs.length || !isVotingOpen}
                    onClick={() => moveDown(songId)}
                    className="p-1.5 rounded-lg bg-zinc-900 border border-zinc-800 text-zinc-300 hover:bg-zinc-800 hover:text-cyan-300 disabled:opacity-30 disabled:cursor-not-allowed transition-colors"
                    title="Mover abajo"
                  >
                    <ChevronDown className="w-4 h-4" />
                  </button>
                </div>
              </div>
            );
          })}
        </div>
      )}
    </div>
  );
};
