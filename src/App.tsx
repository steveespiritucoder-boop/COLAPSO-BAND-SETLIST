import { useState, useMemo, useEffect } from 'react';
import { useConcertSocket } from './hooks/useConcertSocket';
import { calculateLiveVoteResults } from './lib/setlistAlgorithm';
import { Header } from './components/Header';
import { NowPlayingBanner } from './components/NowPlayingBanner';
import { Idea2LiveVoting } from './components/Idea2LiveVoting';
import { AdminPanel } from './components/AdminPanel';
import { AdminLogin } from './components/AdminLogin';
import { CelebrationModal } from './components/CelebrationModal';
import { ShareModal } from './components/ShareModal';
import { Volume2, Lock, ShieldCheck, LogOut } from 'lucide-react';

export default function App() {
  const {
    userId,
    state,
    isConnected,
    winnerCelebration,
    dismissCelebration,
    voteLive,
    setAttendance,
    adminActions,
  } = useConcertSocket();

  const [activeView, setActiveView] = useState<'fan' | 'admin'>('fan');
  const [isAdminAuthenticated, setIsAdminAuthenticated] = useState<boolean>(() => {
    return typeof window !== 'undefined' && sessionStorage.getItem('colapso_admin_auth') === 'true';
  });
  const [isShareModalOpen, setIsShareModalOpen] = useState(false);

  // Check URL query parameter ?view=admin or hash
  useEffect(() => {
    if (typeof window !== 'undefined') {
      const urlParams = new URLSearchParams(window.location.search);
      if (urlParams.get('view') === 'admin' || window.location.hash === '#admin') {
        setActiveView('admin');
      }
    }
  }, []);

  const handleAdminLogout = () => {
    sessionStorage.removeItem('colapso_admin_auth');
    setIsAdminAuthenticated(false);
    setActiveView('fan');
  };

  const songs = state?.songs || [];
  const currentPlayingSongId = state?.currentPlayingSongId || null;
  const liveVotes = state?.liveVotes || {};
  const isVotingOpen = state?.votingOpen ?? true;

  // Live round votes calculations (Idea 2)
  const liveResults = useMemo(() => {
    return calculateLiveVoteResults(songs, liveVotes, currentPlayingSongId);
  }, [songs, liveVotes, currentPlayingSongId]);

  // Current user's selected song ID
  const userVoteSongId = liveVotes[userId];

  // User attendance type
  const userAttendance = state?.attendances?.[userId];

  // Attendance stats aggregation
  const attendanceStats = useMemo(() => {
    const attendances = state?.attendances || {};
    let inPerson = 0;
    let virtual = 0;
    Object.values(attendances).forEach((type) => {
      if (type === 'in_person') inPerson++;
      else if (type === 'virtual') virtual++;
    });
    // Fallback if empty to show realistic initial distribution
    if (inPerson === 0 && virtual === 0) {
      return { inPerson: 1, virtual: 0 };
    }
    return { inPerson, virtual };
  }, [state?.attendances]);

  if (!state) {
    return (
      <div className="min-h-screen bg-slate-50 text-slate-900 flex flex-col items-center justify-center p-4">
        <div className="w-14 h-14 rounded-2xl bg-emerald-100 border border-emerald-300 flex items-center justify-center mb-4 shadow-sm animate-pulse">
          <Volume2 className="w-7 h-7 text-emerald-700" />
        </div>
        <h1 className="text-3xl font-black font-rock text-slate-950 tracking-widest uppercase">
          COLAPSO
        </h1>
        <p className="text-xs text-slate-500 mt-2 font-medium">
          Conectando con el escenario del show en directo...
        </p>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-slate-100 text-slate-900 flex flex-col selection:bg-emerald-600 selection:text-white">
      {/* Global Live Header with Socials & Streams & Share Modal */}
      <Header
        state={state}
        isConnected={isConnected}
        activeView={activeView}
        onViewChange={(view) => setActiveView(view === 'admin' ? 'admin' : 'fan')}
        onOpenShareModal={() => setIsShareModalOpen(true)}
      />

      {/* Main Container */}
      <main className="flex-1 max-w-4xl w-full mx-auto px-3 sm:px-6 py-5 sm:py-7">
        {/* PUBLIC FAN VIEW (IDEA 2: TEMA A TEMA) */}
        {activeView === 'fan' && (
          <div className="space-y-5">
            {/* Top Banner: What's currently sounding on stage */}
            <NowPlayingBanner
              song={liveResults.currentlyPlayingSong}
              roundNumber={state.roundNumber > 1 ? state.roundNumber - 1 : undefined}
              upcomingRound={state.roundNumber}
            />

            {/* Voting Interface */}
            <Idea2LiveVoting
              activeSongs={liveResults.activeSongs}
              playedSongs={liveResults.playedSongs}
              currentlyPlayingSong={liveResults.currentlyPlayingSong}
              roundNumber={state.roundNumber}
              userVoteSongId={userVoteSongId}
              isVotingOpen={isVotingOpen}
              totalVotes={liveResults.totalVotes}
              connectedClients={state.connectedClients || 1}
              locationUrl={state.locationUrl}
              locationName={state.locationName}
              userAttendance={userAttendance}
              attendanceStats={attendanceStats}
              onVote={voteLive}
              onSetAttendance={setAttendance}
            />
          </div>
        )}

        {/* ADMIN BACKSTAGE VIEW: Password Protected with Server Verification */}
        {activeView === 'admin' && (
          isAdminAuthenticated ? (
            <div className="space-y-4">
              <div className="flex items-center justify-between p-3 rounded-2xl bg-amber-50 border border-amber-200">
                <span className="text-xs font-bold text-amber-900 flex items-center gap-1.5">
                  <ShieldCheck className="w-4 h-4 text-emerald-600" />
                  Sesión de Administración Activa (Banda COLAPSO)
                </span>
                <button
                  type="button"
                  onClick={handleAdminLogout}
                  className="px-3 py-1 rounded-xl bg-white hover:bg-red-50 text-red-700 hover:text-red-800 border border-slate-300 text-xs font-bold flex items-center gap-1 transition-colors cursor-pointer"
                >
                  <LogOut className="w-3.5 h-3.5" />
                  <span>Cerrar Sesión</span>
                </button>
              </div>

              <AdminPanel
                state={state}
                activeSongs={liveResults.activeSongs}
                adminActions={adminActions}
              />
            </div>
          ) : (
            <AdminLogin
              onSuccess={() => setIsAdminAuthenticated(true)}
              onCancel={() => setActiveView('fan')}
            />
          )
        )}
      </main>

      {/* Rock Celebration Modal when a song is confirmed or chosen by crowd */}
      <CelebrationModal
        winner={winnerCelebration}
        onClose={dismissCelebration}
      />

      {/* QR Code & Catchy WhatsApp Share Modal */}
      <ShareModal
        isOpen={isShareModalOpen}
        onClose={() => setIsShareModalOpen(false)}
        bandName={state.bandName || 'COLAPSO'}
      />

      {/* Light Theme Footer */}
      <footer className="border-t border-slate-200 bg-white py-5 text-center text-xs text-slate-500 mt-8">
        <div className="max-w-4xl mx-auto px-4 flex flex-col sm:flex-row items-center justify-between gap-3">
          <div className="text-left">
            <p className="font-rock text-slate-900 text-sm tracking-wider uppercase m-0">
              BANDA COLAPSO • SHOW EN VIVO
            </p>
            <p className="text-[11px] text-slate-500 mt-0.5">
              Setlist Interactivo en Tiempo Real para el Público
            </p>
          </div>

          <div className="flex items-center gap-2">
            {activeView === 'fan' ? (
              <button
                onClick={() => setActiveView('admin')}
                className="text-xs font-bold text-slate-400 hover:text-slate-700 flex items-center gap-1 p-1.5 rounded-lg hover:bg-slate-100 transition-colors"
                title="Acceso restringido para el staff de la banda"
              >
                <Lock className="w-3.5 h-3.5 text-slate-400" />
                <span>Acceso Banda</span>
              </button>
            ) : (
              <button
                onClick={() => setActiveView('fan')}
                className="text-xs font-bold text-emerald-700 hover:text-emerald-800 flex items-center gap-1 p-1.5 rounded-lg hover:bg-emerald-50 transition-colors"
              >
                <ShieldCheck className="w-3.5 h-3.5" />
                <span>Volver a Vista del Público</span>
              </button>
            )}
          </div>
        </div>
      </footer>
    </div>
  );
}
