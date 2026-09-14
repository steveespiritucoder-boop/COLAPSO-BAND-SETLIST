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
import { Volume2, ShieldCheck, LogOut } from 'lucide-react';

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

  // Check URL pathname (/admin), query (?view=admin), or hash (#admin)
  useEffect(() => {
    const handleLocation = () => {
      if (typeof window !== 'undefined') {
        const path = window.location.pathname.toLowerCase();
        const urlParams = new URLSearchParams(window.location.search);
        if (
          path === '/admin' ||
          path === '/admin/' ||
          urlParams.get('view') === 'admin' ||
          window.location.hash === '#admin'
        ) {
          setActiveView('admin');
        } else {
          setActiveView('fan');
        }
      }
    };

    handleLocation();
    window.addEventListener('popstate', handleLocation);
    return () => window.removeEventListener('popstate', handleLocation);
  }, []);

  const navigateTo = (view: 'fan' | 'admin') => {
    setActiveView(view);
    if (typeof window !== 'undefined') {
      if (view === 'admin') {
        window.history.pushState(null, '', '/admin');
      } else {
        window.history.pushState(null, '', '/');
      }
    }
  };

  const handleAdminLogout = () => {
    sessionStorage.removeItem('colapso_admin_auth');
    setIsAdminAuthenticated(false);
    navigateTo('fan');
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
      <div className="min-h-screen bg-stone-950 text-stone-100 flex flex-col items-center justify-center p-4">
        <div className="w-14 h-14 rounded-2xl bg-red-950 border border-red-800 flex items-center justify-center mb-4 shadow-lg shadow-red-950/50 animate-pulse">
          <Volume2 className="w-7 h-7 text-red-400" />
        </div>
        <h1 className="text-3xl font-black font-rock text-white tracking-widest uppercase">
          COLAPSO
        </h1>
        <p className="text-xs text-stone-400 mt-2 font-medium">
          Conectando con el escenario del show en directo...
        </p>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-stone-950 text-stone-100 flex flex-col selection:bg-red-600 selection:text-white">
      {/* Global Live Header with Socials & Streams & Share Modal */}
      <Header
        state={state}
        isConnected={isConnected}
        activeView={activeView}
        onViewChange={(view) => navigateTo(view === 'admin' ? 'admin' : 'fan')}
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
              <div className="flex items-center justify-between p-3 rounded-2xl bg-stone-900/90 border border-stone-800 shadow-md">
                <span className="text-xs font-bold text-red-300 flex items-center gap-1.5 font-rock tracking-wider">
                  <ShieldCheck className="w-4 h-4 text-red-500" />
                  SESIÓN DE ADMINISTRACIÓN ACTIVA (BANDA COLAPSO)
                </span>
                <button
                  type="button"
                  onClick={handleAdminLogout}
                  className="px-3 py-1 rounded-xl bg-stone-950 hover:bg-red-950 text-stone-300 hover:text-red-300 border border-stone-800 text-xs font-bold flex items-center gap-1 transition-colors cursor-pointer"
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
              onCancel={() => navigateTo('fan')}
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

      {/* Rock Theme Footer */}
      <footer className="border-t border-stone-800 bg-stone-950 py-5 text-center text-xs text-stone-400 mt-8">
        <div className="max-w-4xl mx-auto px-4 flex flex-col sm:flex-row items-center justify-between gap-3">
          <div className="text-left">
            <p className="font-rock text-white text-sm tracking-wider uppercase m-0">
              BANDA COLAPSO • SHOW EN VIVO
            </p>
            <p className="text-[11px] text-stone-400 mt-0.5">
              Setlist Interactivo en Tiempo Real para el Público
            </p>
          </div>

          <div className="flex items-center gap-2">
            {activeView === 'admin' && (
              <button
                type="button"
                onClick={() => navigateTo('fan')}
                className="text-xs font-bold text-red-400 hover:text-red-300 flex items-center gap-1 p-1.5 rounded-lg hover:bg-stone-900 transition-colors font-rock uppercase tracking-wider cursor-pointer"
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
