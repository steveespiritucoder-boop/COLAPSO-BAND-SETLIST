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
  Pencil,
  X,
  CheckCircle2,
  Phone,
  Instagram,
  Youtube,
  Music2,
  MessageCircle,
  ArrowDownAZ,
  ArrowUpZA,
  ArrowUpDown,
  Dices,
} from 'lucide-react';
import { ShowState, ShowMode, LiveSongVoteResult, LiveStreams, SocialLinks, Song } from '../types';
import {
  COLAPSO_POSTER_SONGS,
  COLAPSO_ALPHABETICAL_SONGS,
  getSortTitle,
} from '../data/defaultSongs';

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
    editSong?: (songId: string, title: string, artist: string, coverUrl?: string) => void;
    removeSong: (songId: string) => void;
    updateSongs?: (songs: Song[]) => void;
    sortSongs?: (direction: 'asc' | 'desc' | 'poster') => void;
    invertSongsOrder?: () => void;
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

  // Setlist Item Entry & Edit Form State
  const [editingSongId, setEditingSongId] = useState<string | null>(null);
  const [songTitle, setSongTitle] = useState('');
  const [songArtist, setSongArtist] = useState('');
  const [songImageUrl, setSongImageUrl] = useState('');
  const [imageBase64, setImageBase64] = useState('');
  const [isConvertingImage, setIsConvertingImage] = useState(false);
  const [imageConvertError, setImageConvertError] = useState('');

  // Contact & Socials Form State
  const [phone, setPhone] = useState(state.socialLinks?.phone || '915189153');
  const [instagram, setInstagram] = useState(state.socialLinks?.instagram || '');
  const [tiktok, setTiktok] = useState(state.socialLinks?.tiktok || '');
  const [youtube, setYoutube] = useState(state.socialLinks?.youtube || '');
  const [socialsSaved, setSocialsSaved] = useState(false);

  // Sync contact state if external state updates
  React.useEffect(() => {
    if (state.socialLinks) {
      if (state.socialLinks.phone !== undefined) setPhone(state.socialLinks.phone);
      if (state.socialLinks.instagram !== undefined) setInstagram(state.socialLinks.instagram);
      if (state.socialLinks.tiktok !== undefined) setTiktok(state.socialLinks.tiktok);
      if (state.socialLinks.youtube !== undefined) setYoutube(state.socialLinks.youtube);
    }
  }, [state.socialLinks]);

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

  const topSong = activeSongs[0];
  const currentPlaying = state.songs.find((s) => s.id === state.currentPlayingSongId);
  const totalVotesCount = Object.keys(state.liveVotes).length;

  // Tie detection among top voted songs
  const maxVotes = activeSongs[0]?.voteCount || 0;
  const tiedSongs = maxVotes > 0 ? activeSongs.filter((s) => s.voteCount === maxVotes) : [];
  const hasTie = tiedSongs.length >= 2;

  // Random Tiebreaker State
  const [isSpinningTie, setIsSpinningTie] = useState(false);
  const [spinningHighlightId, setSpinningHighlightId] = useState<string | null>(null);
  const [selectedTieWinnerId, setSelectedTieWinnerId] = useState<string | null>(null);

  // Reset tie selection when round changes or songs update
  React.useEffect(() => {
    setSelectedTieWinnerId(null);
    setSpinningHighlightId(null);
  }, [state.roundNumber]);

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

  // Start editing an existing song in the setlist
  const handleStartEdit = (song: Song) => {
    setEditingSongId(song.id);
    setSongTitle(song.title);
    setSongArtist(song.artist);
    if (song.coverUrl?.startsWith('data:image')) {
      setImageBase64(song.coverUrl);
      setSongImageUrl('');
    } else {
      setSongImageUrl(song.coverUrl || '');
      setImageBase64('');
    }
    setImageConvertError('');

    // Smoothly scroll to the form
    const formSection = document.getElementById('setlist-form-card');
    if (formSection) {
      formSection.scrollIntoView({ behavior: 'smooth', block: 'center' });
    }
  };

  // Cancel edit mode
  const handleCancelEdit = () => {
    setEditingSongId(null);
    setSongTitle('');
    setSongArtist('');
    setSongImageUrl('');
    setImageBase64('');
    setImageConvertError('');
  };

  // Add new song or Save Changes to edited song
  const handleSaveSong = (e: React.FormEvent) => {
    e.preventDefault();
    if (!songTitle.trim()) return;

    const cover = imageBase64.trim() || songImageUrl.trim() || '';

    if (editingSongId) {
      // Guardar cambios a canción existente
      if (adminActions.editSong) {
        adminActions.editSong(
          editingSongId,
          songTitle.trim(),
          songArtist.trim() || 'Banda Colapso',
          cover
        );
      }
      setEditingSongId(null);
    } else {
      // Agregar nueva canción al setlist
      adminActions.addSong(
        songTitle.trim(),
        songArtist.trim() || 'Banda Colapso',
        'Setlist COLAPSO',
        cover,
        'Rock'
      );
    }

    setSongTitle('');
    setSongArtist('');
    setSongImageUrl('');
    setImageBase64('');
    setImageConvertError('');
  };

  const [adminSearchQuery, setAdminSearchQuery] = useState('');

  // Sort setlist alphabetically (A - Z)
  const handleSortAlphabeticalAZ = () => {
    if (adminActions.sortSongs) {
      adminActions.sortSongs('asc');
    } else if (adminActions.updateSongs) {
      const sorted = [...state.songs]
        .sort((a, b) =>
          getSortTitle(a.title).localeCompare(getSortTitle(b.title), 'es', { sensitivity: 'base' })
        )
        .map((s, idx) => ({ ...s, order: idx + 1 }));
      adminActions.updateSongs(sorted);
    }
  };

  // Invert current setlist order
  const handleInvertOrder = () => {
    if (adminActions.invertSongsOrder) {
      adminActions.invertSongsOrder();
    } else if (adminActions.updateSongs) {
      const inverted = [...state.songs].reverse().map((s, idx) => ({ ...s, order: idx + 1 }));
      adminActions.updateSongs(inverted);
    }
  };

  // Restore official poster order (Bloques 1 al 4)
  const handleRestorePosterOrder = () => {
    if (adminActions.sortSongs) {
      adminActions.sortSongs('poster');
    } else if (adminActions.updateSongs) {
      const posterMap = new Map(
        COLAPSO_POSTER_SONGS.map((s, idx) => [s.title.toLowerCase().trim(), idx + 1])
      );
      const sorted = [...state.songs]
        .sort((a, b) => {
          const posA = posterMap.get(a.title.toLowerCase().trim()) ?? 999;
          const posB = posterMap.get(b.title.toLowerCase().trim()) ?? 999;
          return posA - posB;
        })
        .map((s, idx) => ({ ...s, order: idx + 1 }));
      adminActions.updateSongs(sorted);
    }
  };

  // Re-seed all 28 official songs
  const handleResetToOfficial28 = () => {
    if (adminActions.updateSongs) {
      adminActions.updateSongs([...COLAPSO_ALPHABETICAL_SONGS]);
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
    const cleanPhone = phone.trim();
    const digitsOnly = cleanPhone.replace(/\D/g, '');
    const waNumber = digitsOnly ? (digitsOnly.length === 9 ? `51${digitsOnly}` : digitsOnly) : '';

    adminActions.updateSocials({
      phone: cleanPhone,
      whatsapp: waNumber ? `https://wa.me/${waNumber}` : '',
      instagram: instagram.trim(),
      tiktok: tiktok.trim(),
      youtube: youtube.trim(),
      spotify: state.socialLinks?.spotify || '',
      facebook: state.socialLinks?.facebook || '',
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

  const chosenSongToPlay = selectedTieWinnerId
    ? activeSongs.find((s) => s.songId === selectedTieWinnerId) || topSong
    : topSong;

  const handleConfirmTopSong = () => {
    if (chosenSongToPlay) {
      adminActions.selectWinnerAndPlay(chosenSongToPlay.songId);
      setSelectedTieWinnerId(null);
    }
  };

  // Random Tiebreaker among tied songs with rock suspense roulette animation & sound
  const handleRandomTieBreak = () => {
    if (tiedSongs.length < 2 || isSpinningTie) return;

    setIsSpinningTie(true);
    setSelectedTieWinnerId(null);

    let step = 0;
    const totalSteps = 16 + Math.floor(Math.random() * 8); // ~20 ticks
    const intervalTime = 80; // ms

    const interval = setInterval(() => {
      step++;
      const randomCandidate = tiedSongs[Math.floor(Math.random() * tiedSongs.length)];
      setSpinningHighlightId(randomCandidate.songId);

      // Subtle audio tick
      try {
        const audioCtx = new (window.AudioContext || (window as any).webkitAudioContext)();
        const osc = audioCtx.createOscillator();
        const gain = audioCtx.createGain();
        osc.type = 'triangle';
        osc.frequency.setValueAtTime(450 + step * 25, audioCtx.currentTime);
        gain.gain.setValueAtTime(0.04, audioCtx.currentTime);
        gain.gain.exponentialRampToValueAtTime(0.001, audioCtx.currentTime + 0.06);
        osc.connect(gain);
        gain.connect(audioCtx.destination);
        osc.start();
        osc.stop(audioCtx.currentTime + 0.06);
      } catch (_) {}

      // Gentle haptic feedback
      if (typeof navigator !== 'undefined' && 'vibrate' in navigator) {
        try {
          navigator.vibrate(15);
        } catch (_) {}
      }

      if (step >= totalSteps) {
        clearInterval(interval);
        // Final randomly chosen winner
        const finalWinner = tiedSongs[Math.floor(Math.random() * tiedSongs.length)];
        setSpinningHighlightId(finalWinner.songId);
        setSelectedTieWinnerId(finalWinner.songId);
        setIsSpinningTie(false);

        // Triumph chord
        try {
          const audioCtx = new (window.AudioContext || (window as any).webkitAudioContext)();
          [523.25, 659.25, 783.99, 1046.5].forEach((freq, i) => {
            const osc = audioCtx.createOscillator();
            const gain = audioCtx.createGain();
            osc.type = 'triangle';
            osc.frequency.setValueAtTime(freq, audioCtx.currentTime + i * 0.06);
            gain.gain.setValueAtTime(0.05, audioCtx.currentTime + i * 0.06);
            gain.gain.exponentialRampToValueAtTime(0.001, audioCtx.currentTime + i * 0.06 + 0.4);
            osc.connect(gain);
            gain.connect(audioCtx.destination);
            osc.start(audioCtx.currentTime + i * 0.06);
            osc.stop(audioCtx.currentTime + i * 0.06 + 0.4);
          });
        } catch (_) {}

        if (typeof navigator !== 'undefined' && 'vibrate' in navigator) {
          try {
            navigator.vibrate([40, 60, 100]);
          } catch (_) {}
        }
      }
    }, intervalTime);
  };

  const handleExecuteCrowdRequest = () => {
    if (!selectedCrowdSongId) return;
    adminActions.crowdRequest(selectedCrowdSongId);
    setSelectedCrowdSongId('');
  };

  return (
    <div className="space-y-6 text-stone-900">
      {/* Top Banner / Cockpit Header */}
      <div className="bg-[#faf6ed] border-2 border-[#e2d8c3] rounded-2xl p-5 shadow-2xl shadow-black/40 text-stone-950">
        <div className="flex flex-col sm:flex-row items-start sm:items-center justify-between gap-4">
          <div>
            <div className="flex items-center gap-2.5">
              <div className="w-10 h-10 rounded-xl bg-red-100 text-red-700 border border-red-200 flex items-center justify-center font-bold shadow-inner">
                <Sliders className="w-5 h-5" />
              </div>
              <div>
                <h2 className="text-xl sm:text-2xl font-rock text-stone-950 tracking-wide uppercase m-0">
                  Panel de Control de la Banda (Backstage)
                </h2>
                <p className="text-xs text-stone-600">
                  Ronda actual: <strong className="text-red-700">#{state.roundNumber}</strong> • {totalVotesCount} votos de fans recibidos
                </p>
              </div>
            </div>
          </div>

          <div className="flex flex-wrap items-center gap-2">
            {!state.votingOpen && hasTie && (
              <span className="px-3 py-2 rounded-xl bg-amber-100 border-2 border-amber-400 text-amber-950 text-xs font-bold font-rock uppercase flex items-center gap-1.5 animate-pulse shadow-xs">
                <Dices className="w-4 h-4 text-amber-800" />
                <span>¡Empate ({tiedSongs.length} temas)!</span>
              </span>
            )}
            <button
              onClick={() => adminActions.toggleVoting(!state.votingOpen)}
              className={`px-4 py-2.5 rounded-xl text-xs font-bold flex items-center gap-2 transition-all shadow-md cursor-pointer font-rock uppercase tracking-wider ${
                state.votingOpen
                  ? 'bg-amber-100 text-amber-900 border border-amber-300 hover:bg-amber-200'
                  : 'bg-red-600 text-white hover:bg-red-700 shadow-red-950/20'
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
        <div className="p-4 rounded-2xl bg-[#faf6ed] border-2 border-red-600 flex flex-col sm:flex-row items-start sm:items-center justify-between gap-3 shadow-xl text-stone-950">
          <div className="flex items-center gap-3 min-w-0">
            {currentPlaying.coverUrl && (
              <img
                src={currentPlaying.coverUrl}
                alt={currentPlaying.title}
                className="w-12 h-12 rounded-xl object-cover border-2 border-red-600 shrink-0"
              />
            )}
            <div>
              <div className="flex items-center gap-2">
                <span className="text-[10px] font-black uppercase px-2 py-0.5 rounded bg-red-600 text-white font-rock">
                  Tocando en Escenario
                </span>
                {currentPlaying.isCrowdRequest && (
                  <span className="text-[10px] font-black uppercase px-2 py-0.5 rounded bg-amber-200 text-amber-950 border border-amber-400 flex items-center gap-1 font-rock">
                    <Flame className="w-3 h-3 text-amber-900" />
                    Pedido del Público
                  </span>
                )}
              </div>
              <h4 className="text-base font-black text-stone-950 font-rock uppercase m-0 truncate mt-0.5">
                {currentPlaying.title}
              </h4>
              <p className="text-xs text-red-700 font-bold uppercase tracking-wide font-rock">{currentPlaying.artist}</p>
            </div>
          </div>

          <button
            onClick={() => adminActions.finishPlaying(currentPlaying.id)}
            className="px-3.5 py-2 rounded-xl bg-stone-950 hover:bg-stone-800 text-white text-xs font-bold flex items-center gap-1.5 transition-colors cursor-pointer shrink-0 font-rock uppercase tracking-wider shadow-xs"
          >
            <CheckCircle className="w-3.5 h-3.5 text-red-400" />
            <span>Finalizar Tema</span>
          </button>
        </div>
      )}

      {/* TWO PRIMARY STAGE ACTIONS: A) CONFIRM VOTE WINNER  vs  B) PEDIDO DEL PÚBLICO */}
      <div className="grid grid-cols-1 md:grid-cols-2 gap-5">
        {/* ACTION A: CONFIRMAR CANCIÓN MÁS VOTADA */}
        <div className="bg-[#faf6ed] border-2 border-[#e2d8c3] rounded-2xl p-5 space-y-4 shadow-2xl shadow-black/40 text-stone-950">
          <div className="flex items-center justify-between border-b border-[#ded5c0] pb-3">
            <div className="flex items-center gap-2">
              <div className="w-7 h-7 rounded-lg bg-red-100 text-red-700 border border-red-200 flex items-center justify-center">
                <Zap className="w-4 h-4" />
              </div>
              <h3 className="text-base font-black font-rock text-stone-950 uppercase m-0">
                1. Ganadora por Votación
              </h3>
            </div>
            <span className="text-xs font-bold text-stone-600 font-rock uppercase">Ronda #{state.roundNumber}</span>
          </div>

          {topSong ? (
            hasTie ? (
              <div className="p-4 rounded-xl bg-white border-2 border-amber-400 space-y-3.5 shadow-xs">
                <div className="flex flex-wrap items-center justify-between gap-2">
                  <span className="text-[10px] uppercase font-black text-amber-950 bg-amber-200 border border-amber-400 px-2 py-0.5 rounded shadow-xs font-rock flex items-center gap-1">
                    <Dices className="w-3.5 h-3.5 text-amber-900" />
                    ¡EMPATE EN 1° LUGAR ({tiedSongs.length} TEMAS)!
                  </span>
                  <span className="text-xs font-black text-stone-950 bg-amber-100 px-2.5 py-0.5 rounded-full border border-amber-300 font-rock">
                    {maxVotes} votos cada una
                  </span>
                </div>

                <div className="p-3 rounded-xl bg-amber-50 border border-amber-200 text-xs text-amber-950 leading-relaxed">
                  {!state.votingOpen ? (
                    <p className="m-0 font-medium">
                      <strong className="text-red-700 uppercase font-rock">⏸️ Votaciones Pausadas:</strong> Hay un empate exacto entre {tiedSongs.length} canciones. Presiona el botón a continuación para que el azar decida cuál tocará la banda.
                    </p>
                  ) : (
                    <p className="m-0 font-medium">
                      <strong className="text-amber-900 uppercase font-rock">⚡ Empate en Vivo:</strong> {tiedSongs.length} canciones comparten el 1° lugar. Puedes pausar las votaciones arriba para congelar los votos y sortear el desempate al azar.
                    </p>
                  )}
                </div>

                {/* Tied Songs List */}
                <div className="space-y-2">
                  <span className="text-[11px] font-bold text-stone-600 uppercase font-rock block">
                    Canciones Empatadas en la Cima:
                  </span>
                  <div className="grid grid-cols-1 sm:grid-cols-2 gap-2">
                    {tiedSongs.map((song) => {
                      const isHighlighted = isSpinningTie && spinningHighlightId === song.songId;
                      const isChosen = selectedTieWinnerId === song.songId;

                      return (
                        <div
                          key={song.songId}
                          onClick={() => {
                            if (!isSpinningTie) {
                              setSelectedTieWinnerId(song.songId);
                            }
                          }}
                          className={`p-2.5 rounded-xl border-2 transition-all flex items-center justify-between gap-2 cursor-pointer ${
                            isChosen
                              ? 'border-red-600 bg-red-50 shadow-md ring-2 ring-red-500/40'
                              : isHighlighted
                              ? 'border-amber-500 bg-amber-100 shadow-lg scale-[1.02] ring-2 ring-amber-400'
                              : 'border-[#ded5c0] bg-[#faf6ed] hover:border-red-300'
                          }`}
                        >
                          <div className="flex items-center gap-2.5 min-w-0">
                            {song.coverUrl && (
                              <img
                                src={song.coverUrl}
                                alt={song.title}
                                className="w-10 h-10 rounded-lg object-cover border border-[#ded5c0] shrink-0"
                              />
                            )}
                            <div className="min-w-0">
                              <h5 className="text-xs font-black font-rock uppercase text-stone-950 truncate m-0">
                                {song.title}
                              </h5>
                              <p className="text-[10px] font-bold text-red-700 font-rock uppercase truncate m-0">
                                {song.artist}
                              </p>
                            </div>
                          </div>
                          <div className="flex items-center gap-1.5 shrink-0">
                            <span className="text-[11px] font-black font-rock text-stone-900 bg-white px-2 py-0.5 rounded border border-[#ded5c0]">
                              {song.voteCount} votos
                            </span>
                            {isChosen && (
                              <span className="w-5 h-5 rounded-full bg-red-600 text-white flex items-center justify-center text-[10px] font-bold">
                                ✓
                              </span>
                            )}
                          </div>
                        </div>
                      );
                    })}
                  </div>
                </div>

                {/* Roulette Tiebreaker Trigger Button */}
                <button
                  type="button"
                  onClick={handleRandomTieBreak}
                  disabled={isSpinningTie}
                  className={`w-full py-3 px-4 rounded-xl font-black text-xs sm:text-sm uppercase tracking-wider flex items-center justify-center gap-2 transition-all cursor-pointer font-rock shadow-md ${
                    isSpinningTie
                      ? 'bg-amber-500 text-stone-950 animate-pulse'
                      : 'bg-gradient-to-r from-amber-600 via-red-600 to-amber-700 hover:from-amber-500 hover:to-red-600 text-white shadow-red-950/20 active:scale-[0.99]'
                  }`}
                >
                  <Dices className={`w-4 h-4 ${isSpinningTie ? 'animate-spin' : ''}`} />
                  <span>
                    {isSpinningTie
                      ? `Sorteando entre las ${tiedSongs.length} canciones empatadas...`
                      : `Elegir al Azar entre estas ${tiedSongs.length} Canciones`}
                  </span>
                </button>

                {/* Selected Winner Banner & Direct Action */}
                {selectedTieWinnerId && chosenSongToPlay && (
                  <div className="p-3.5 rounded-xl bg-red-50 border-2 border-red-500 space-y-2.5 animate-fadeIn">
                    <div className="flex items-center justify-between">
                      <span className="text-[10px] font-black uppercase text-red-700 bg-white px-2 py-0.5 rounded border border-red-300 font-rock flex items-center gap-1">
                        <Sparkles className="w-3 h-3 text-red-600" />
                        GANADORA DEL SORTEO AL AZAR
                      </span>
                      <button
                        type="button"
                        onClick={handleRandomTieBreak}
                        className="text-[10px] font-bold text-red-800 hover:text-red-950 underline cursor-pointer font-rock uppercase"
                      >
                        Sortear otra vez
                      </button>
                    </div>

                    <div className="flex items-center gap-3">
                      {chosenSongToPlay.coverUrl && (
                        <img
                          src={chosenSongToPlay.coverUrl}
                          alt={chosenSongToPlay.title}
                          className="w-12 h-12 rounded-xl object-cover border-2 border-red-500 shrink-0 shadow-xs"
                        />
                      )}
                      <div className="min-w-0">
                        <h4 className="text-base font-black font-rock uppercase text-stone-950 m-0 truncate">
                          {chosenSongToPlay.title}
                        </h4>
                        <p className="text-xs font-bold uppercase tracking-wide text-red-700 font-rock m-0">
                          {chosenSongToPlay.artist} • {chosenSongToPlay.voteCount} votos
                        </p>
                      </div>
                    </div>

                    <button
                      type="button"
                      onClick={handleConfirmTopSong}
                      className="w-full py-3 rounded-xl bg-red-600 hover:bg-red-700 text-white font-black text-xs sm:text-sm uppercase tracking-wider flex items-center justify-center gap-2 transition-all shadow-md cursor-pointer font-rock"
                    >
                      <Sparkles className="w-4 h-4" />
                      <span>Confirmar y Tocar "{chosenSongToPlay.title}" Ahora</span>
                    </button>
                  </div>
                )}

                {!selectedTieWinnerId && (
                  <button
                    type="button"
                    onClick={handleConfirmTopSong}
                    className="w-full py-2.5 rounded-xl bg-stone-100 hover:bg-stone-200 border border-stone-300 text-stone-700 font-bold text-xs uppercase tracking-wider flex items-center justify-center gap-2 transition-all cursor-pointer font-rock"
                  >
                    <span>O confirmar primera opción ({topSong.title}) sin sorteo</span>
                  </button>
                )}
              </div>
            ) : (
              <div className="p-4 rounded-xl bg-white border-2 border-[#ded5c0] space-y-3 shadow-xs">
                <div className="flex items-center justify-between">
                  <span className="text-[10px] uppercase font-black text-white bg-red-600 px-2 py-0.5 rounded shadow-xs font-rock">
                    LÍDER EN VOTOS (#1)
                  </span>
                  <span className="text-xs font-black text-stone-950 bg-[#ebe3cf] px-2.5 py-0.5 rounded-full border border-[#ded5c0] font-rock">
                    {topSong.voteCount} votos ({topSong.percentage}%)
                  </span>
                </div>

                <div className="flex items-center gap-3">
                  {topSong.coverUrl && (
                    <img
                      src={topSong.coverUrl}
                      alt={topSong.title}
                      className="w-14 h-14 rounded-xl object-cover border border-[#ded5c0] shadow-xs shrink-0"
                    />
                  )}
                  <div>
                    <h4 className="text-lg font-black font-rock uppercase text-stone-950 m-0">
                      {topSong.title}
                    </h4>
                    <p className="text-xs font-bold uppercase tracking-wide text-red-700 font-rock">{topSong.artist}</p>
                  </div>
                </div>

                <p className="text-[11px] text-stone-600 leading-snug">
                  Al presionar confirmar, se bloquea esta canción en el público como tocada, se borran los votos de la ronda y se habilita la votación de la siguiente canción.
                </p>

                <button
                  onClick={handleConfirmTopSong}
                  className="w-full py-3 rounded-xl bg-red-600 hover:bg-red-700 text-white font-black text-xs sm:text-sm uppercase tracking-wider flex items-center justify-center gap-2 transition-all shadow-md cursor-pointer font-rock"
                >
                  <Sparkles className="w-4 h-4" />
                  <span>Confirmar y Tocar Esta Canción Ahora</span>
                </button>
              </div>
            )
          ) : (
            <div className="p-6 rounded-xl bg-white border border-[#ded5c0] text-center text-xs text-stone-500 font-medium">
              Esperando votos de los fans en esta ronda...
            </div>
          )}

          {/* Simulate Audience Votes Tool */}
          <div className="pt-3 border-t border-[#ded5c0]">
            <span className="text-[11px] font-bold text-stone-600 uppercase block mb-1.5 font-rock">
              Simulador de Votos (Para pruebas antes del show):
            </span>
            <div className="flex gap-2">
              <button
                onClick={() => adminActions.simulateVotes(10)}
                className="flex-1 py-1.5 rounded-lg bg-[#ebe3cf] hover:bg-[#ded5be] text-stone-900 text-xs font-bold transition-colors border border-[#ded5c0] font-rock uppercase cursor-pointer"
              >
                +10 Votos Fans
              </button>
              <button
                onClick={() => adminActions.simulateVotes(25)}
                className="flex-1 py-1.5 rounded-lg bg-[#ebe3cf] hover:bg-[#ded5be] text-stone-900 text-xs font-bold transition-colors border border-[#ded5c0] font-rock uppercase cursor-pointer"
              >
                +25 Votos Fans
              </button>
            </div>
          </div>
        </div>

        {/* ACTION B: PEDIDO DEL PÚBLICO (A VIVA VOZ) */}
        <div className="bg-[#faf6ed] border-2 border-[#e2d8c3] rounded-2xl p-5 space-y-4 shadow-2xl shadow-black/40 text-stone-950">
          <div className="flex items-center justify-between border-b border-[#ded5c0] pb-3">
            <div className="flex items-center gap-2">
              <div className="w-7 h-7 rounded-lg bg-amber-100 text-amber-800 border border-amber-300 flex items-center justify-center">
                <Flame className="w-4 h-4" />
              </div>
              <h3 className="text-base font-black font-rock text-stone-950 uppercase m-0">
                2. Opción Especial: Pedido del Público
              </h3>
            </div>
          </div>

          <div className="p-4 rounded-xl bg-amber-50 border-2 border-amber-200 space-y-3 shadow-xs">
            <p className="text-xs text-amber-950 leading-snug">
              Si un músico pide a alguien del público una canción a viva voz, elígela aquí: se posicionará en el número correspondiente, tendrá la etiqueta <strong className="text-amber-800 font-rock">"PEDIDO DE PÚBLICO"</strong> y se resetearán los votos para el siguiente tema.
            </p>

            <div>
              <label className="block text-[11px] font-bold text-stone-800 mb-1 uppercase font-rock">
                Selecciona la canción solicitada por el fan:
              </label>
              <select
                value={selectedCrowdSongId}
                onChange={(e) => setSelectedCrowdSongId(e.target.value)}
                className="w-full px-3 py-2 text-xs font-semibold rounded-xl bg-white border-2 border-amber-300 text-stone-950 focus:outline-none focus:ring-2 focus:ring-amber-500 shadow-xs"
              >
                <option value="">-- Elige una canción del repertorio --</option>
                {activeSongs.map((s) => (
                  <option key={s.songId} value={s.songId} className="bg-white text-stone-950">
                    {s.title} ({s.artist})
                  </option>
                ))}
              </select>
            </div>

            <button
              onClick={handleExecuteCrowdRequest}
              disabled={!selectedCrowdSongId}
              className={`w-full py-3 rounded-xl font-black text-xs sm:text-sm uppercase tracking-wider flex items-center justify-center gap-2 transition-all shadow-md font-rock ${
                selectedCrowdSongId
                  ? 'bg-amber-500 hover:bg-amber-600 text-stone-950 cursor-pointer shadow-amber-500/20'
                  : 'bg-stone-200 text-stone-500 border border-stone-300 cursor-not-allowed'
              }`}
            >
              <Flame className="w-4 h-4 fill-current" />
              <span>Marcar como Pedido del Público y Tocar</span>
            </button>
          </div>
        </div>
      </div>

      {/* CONTACTO Y REDES SOCIALES DE LA BANDA (Teléfono/WhatsApp, Instagram, TikTok, YouTube) */}
      <div className="bg-[#faf6ed] border-2 border-[#e2d8c3] rounded-2xl p-5 space-y-4 shadow-2xl shadow-black/40 text-stone-950">
        <div className="flex items-center gap-2.5 border-b border-[#ded5c0] pb-3">
          <div className="w-8 h-8 rounded-lg bg-red-100 text-red-700 border border-red-200 flex items-center justify-center">
            <Phone className="w-4 h-4" />
          </div>
          <div>
            <h3 className="text-base font-black font-rock text-stone-950 uppercase m-0">
              Contacto y Redes Sociales de la Banda
            </h3>
            <p className="text-xs text-stone-600">
              Configura el teléfono, WhatsApp, Instagram, TikTok y YouTube que se mostrarán en el encabezado (Header)
            </p>
          </div>
        </div>

        <form onSubmit={handleSaveSocials} className="space-y-4">
          <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-3">
            {/* Teléfono / WhatsApp */}
            <div>
              <label className="block text-xs font-bold text-stone-800 mb-1 font-rock uppercase flex items-center gap-1.5">
                <Phone className="w-3.5 h-3.5 text-red-600" />
                <span>Número de Teléfono</span>
              </label>
              <input
                type="text"
                value={phone}
                onChange={(e) => setPhone(e.target.value)}
                placeholder="Ej: 915189153"
                className="w-full px-3 py-2 text-xs rounded-xl bg-white border-2 border-[#ded5c0] focus:border-red-600 text-stone-950 placeholder-stone-400 outline-none shadow-xs font-mono font-bold"
              />
              <span className="text-[10px] text-stone-500 mt-1 block">
                Visible en el Header con botón Copiar y WhatsApp
              </span>
            </div>

            {/* Instagram */}
            <div>
              <label className="block text-xs font-bold text-stone-800 mb-1 font-rock uppercase flex items-center gap-1.5">
                <Instagram className="w-3.5 h-3.5 text-rose-600" />
                <span>Instagram</span>
              </label>
              <input
                type="text"
                value={instagram}
                onChange={(e) => setInstagram(e.target.value)}
                placeholder="https://instagram.com/... o @usuario"
                className="w-full px-3 py-2 text-xs rounded-xl bg-white border-2 border-[#ded5c0] focus:border-red-600 text-stone-950 placeholder-stone-400 outline-none shadow-xs"
              />
              <span className="text-[10px] text-stone-500 mt-1 block">
                URL o usuario @ de la banda
              </span>
            </div>

            {/* TikTok */}
            <div>
              <label className="block text-xs font-bold text-stone-800 mb-1 font-rock uppercase flex items-center gap-1.5">
                <Music2 className="w-3.5 h-3.5 text-stone-800" />
                <span>TikTok</span>
              </label>
              <input
                type="text"
                value={tiktok}
                onChange={(e) => setTiktok(e.target.value)}
                placeholder="https://tiktok.com/@... o @usuario"
                className="w-full px-3 py-2 text-xs rounded-xl bg-white border-2 border-[#ded5c0] focus:border-red-600 text-stone-950 placeholder-stone-400 outline-none shadow-xs"
              />
              <span className="text-[10px] text-stone-500 mt-1 block">
                URL o usuario @ de TikTok
              </span>
            </div>

            {/* YouTube */}
            <div>
              <label className="block text-xs font-bold text-stone-800 mb-1 font-rock uppercase flex items-center gap-1.5">
                <Youtube className="w-3.5 h-3.5 text-red-600" />
                <span>YouTube</span>
              </label>
              <input
                type="text"
                value={youtube}
                onChange={(e) => setYoutube(e.target.value)}
                placeholder="https://youtube.com/@..."
                className="w-full px-3 py-2 text-xs rounded-xl bg-white border-2 border-[#ded5c0] focus:border-red-600 text-stone-950 placeholder-stone-400 outline-none shadow-xs"
              />
              <span className="text-[10px] text-stone-500 mt-1 block">
                URL o canal @ de YouTube
              </span>
            </div>
          </div>

          <div className="flex items-center justify-end gap-2 pt-1">
            <button
              type="submit"
              className="px-5 py-2.5 rounded-xl bg-red-600 hover:bg-red-700 text-white text-xs font-black flex items-center gap-2 transition-all cursor-pointer font-rock uppercase tracking-wider shadow-md shadow-red-950/20"
            >
              {socialsSaved ? <Check className="w-4 h-4 text-white" /> : null}
              <span>{socialsSaved ? '¡Contacto y Redes Guardados!' : 'Guardar Contacto y Redes'}</span>
            </button>
          </div>
        </form>
      </div>

      {/* LIVE STREAM LINKS CONFIGURATION (TikTok, YouTube, Facebook) */}
      <div className="bg-[#faf6ed] border-2 border-[#e2d8c3] rounded-2xl p-5 space-y-4 shadow-2xl shadow-black/40 text-stone-950">
        <div className="flex items-center justify-between border-b border-[#ded5c0] pb-3">
          <div className="flex items-center gap-2.5">
            <div className="w-8 h-8 rounded-lg bg-red-100 text-red-700 border border-red-200 flex items-center justify-center">
              <Video className="w-4 h-4" />
            </div>
            <div>
              <h3 className="text-base font-black font-rock text-stone-950 uppercase m-0">
                Enlaces de Transmisión en Vivo (Live)
              </h3>
              <p className="text-xs text-stone-600">
                Aparecerán como botones destacados en la parte superior de la página del público
              </p>
            </div>
          </div>
        </div>

        <form onSubmit={handleSaveStreams} className="space-y-3">
          <div className="flex items-center gap-3 p-3 rounded-xl bg-white border border-[#ded5c0] shadow-xs">
            <input
              type="checkbox"
              id="toggle-live-active"
              checked={isLiveActive}
              onChange={(e) => setIsLiveActive(e.target.checked)}
              className="w-4 h-4 rounded accent-red-600 cursor-pointer"
            />
            <label
              htmlFor="toggle-live-active"
              className="text-xs font-bold text-stone-900 cursor-pointer font-rock uppercase tracking-wider"
            >
              Activar barra de transmisión en directo en la página de los fans
            </label>
          </div>

          <div className="grid grid-cols-1 sm:grid-cols-3 gap-3">
            <div>
              <label className="block text-xs font-bold text-stone-800 mb-1 font-rock uppercase">
                TikTok Live URL
              </label>
              <input
                type="url"
                value={tiktokLive}
                onChange={(e) => setTiktokLive(e.target.value)}
                placeholder="https://tiktok.com/@bandacolapso/live"
                className="w-full px-3 py-2 text-xs rounded-xl bg-white border-2 border-[#ded5c0] focus:border-red-600 text-stone-950 placeholder-stone-400 outline-none shadow-xs"
              />
            </div>

            <div>
              <label className="block text-xs font-bold text-stone-800 mb-1 font-rock uppercase">
                YouTube Live URL
              </label>
              <input
                type="url"
                value={youtubeLive}
                onChange={(e) => setYoutubeLive(e.target.value)}
                placeholder="https://youtube.com/live/..."
                className="w-full px-3 py-2 text-xs rounded-xl bg-white border-2 border-[#ded5c0] focus:border-red-600 text-stone-950 placeholder-stone-400 outline-none shadow-xs"
              />
            </div>

            <div>
              <label className="block text-xs font-bold text-stone-800 mb-1 font-rock uppercase">
                Facebook Live URL
              </label>
              <input
                type="url"
                value={facebookLive}
                onChange={(e) => setFacebookLive(e.target.value)}
                placeholder="https://facebook.com/watch/live/..."
                className="w-full px-3 py-2 text-xs rounded-xl bg-white border-2 border-[#ded5c0] focus:border-red-600 text-stone-950 placeholder-stone-400 outline-none shadow-xs"
              />
            </div>
          </div>

          <div className="flex justify-end">
            <button
              type="submit"
              className="px-4 py-2 rounded-xl bg-red-600 hover:bg-red-700 text-white text-xs font-bold flex items-center gap-1.5 transition-colors cursor-pointer font-rock uppercase tracking-wider shadow-md shadow-red-950/20"
            >
              {streamsSaved ? <Check className="w-4 h-4 text-white" /> : null}
              <span>{streamsSaved ? '¡Guardado!' : 'Guardar Enlaces Live'}</span>
            </button>
          </div>
        </form>
      </div>

      {/* GOOGLE MAPS VENUE LOCATION CONFIGURATION */}
      <div className="bg-[#faf6ed] border-2 border-[#e2d8c3] rounded-2xl p-5 space-y-4 shadow-2xl shadow-black/40 text-stone-950">
        <div className="flex items-center gap-2.5 border-b border-[#ded5c0] pb-3">
          <div className="w-8 h-8 rounded-lg bg-red-100 text-red-700 border border-red-200 flex items-center justify-center">
            <MapPin className="w-4 h-4" />
          </div>
          <div>
            <h3 className="text-base font-black font-rock text-stone-950 uppercase m-0">
              Ubicación del Concierto (Google Maps)
            </h3>
            <p className="text-xs text-stone-600">
              Inyecta el enlace y nombre del recinto para que el público lo abra desde el inicio
            </p>
          </div>
        </div>

        <form onSubmit={handleSaveLocation} className="space-y-3">
          <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
            <div>
              <label className="block text-xs font-bold text-stone-800 mb-1 font-rock uppercase">
                Nombre del Local / Recinto
              </label>
              <input
                type="text"
                value={locationName}
                onChange={(e) => setLocationName(e.target.value)}
                placeholder="Ej: Estadio Nacional, Lima / Bar La Noche de Barranco"
                className="w-full px-3 py-2 text-xs rounded-xl bg-white border-2 border-[#ded5c0] focus:border-red-600 text-stone-950 placeholder-stone-400 outline-none shadow-xs"
              />
            </div>

            <div>
              <label className="block text-xs font-bold text-stone-800 mb-1 font-rock uppercase">
                Enlace a Google Maps (URL)
              </label>
              <input
                type="url"
                value={locationUrl}
                onChange={(e) => setLocationUrl(e.target.value)}
                placeholder="https://maps.google.com/?q=..."
                className="w-full px-3 py-2 text-xs rounded-xl bg-white border-2 border-[#ded5c0] focus:border-red-600 text-stone-950 placeholder-stone-400 outline-none shadow-xs"
              />
            </div>
          </div>

          <div className="flex items-center justify-between pt-1">
            {/* Live attendance preview summary */}
            <div className="text-xs text-stone-600">
              Asistencia actual:{' '}
              <strong className="text-red-700 font-bold font-rock uppercase">
                {state.attendances ? Object.values(state.attendances).filter((a) => a === 'in_person').length : 0} presenciales
              </strong>{' '}
              •{' '}
              <strong className="text-cyan-800 font-bold font-rock uppercase">
                {state.attendances ? Object.values(state.attendances).filter((a) => a === 'virtual').length : 0} virtuales
              </strong>
            </div>

            <button
              type="submit"
              className="px-4 py-2 rounded-xl bg-red-600 hover:bg-red-700 text-white text-xs font-bold flex items-center gap-1.5 transition-colors cursor-pointer font-rock uppercase tracking-wider shadow-md shadow-red-950/20"
            >
              {locationSaved ? <Check className="w-4 h-4 text-white" /> : null}
              <span>{locationSaved ? '¡Ubicación Actualizada!' : 'Inyectar Ubicación al Público'}</span>
            </button>
          </div>
        </form>
      </div>

      {/* TICKER MESSAGE FOR FANS */}
      <div className="bg-[#faf6ed] border-2 border-[#e2d8c3] rounded-2xl p-5 shadow-2xl shadow-black/40 text-stone-950">
        <h3 className="text-sm font-black font-rock text-stone-950 uppercase flex items-center gap-2 mb-2">
          <Send className="w-4 h-4 text-red-600" />
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
            className="flex-1 px-4 py-2.5 rounded-xl bg-white border-2 border-[#ded5c0] text-xs text-stone-950 placeholder-stone-400 focus:outline-none focus:border-red-600 shadow-xs"
          />
          <button
            type="submit"
            className="px-4 py-2.5 rounded-xl bg-red-600 hover:bg-red-700 text-white font-bold text-xs transition-colors cursor-pointer font-rock uppercase tracking-wider shadow-md shadow-red-950/20"
          >
            Publicar
          </button>
        </form>
      </div>

      {/* SETLIST GESTIÓN & CONFIGURACIÓN INTEGRADO CON SUPABASE */}
      <div id="setlist-form-card" className="bg-[#faf6ed] border-2 border-[#e2d8c3] rounded-2xl p-5 space-y-5 shadow-2xl shadow-black/40 text-stone-950">
        <div className="flex flex-col sm:flex-row items-start sm:items-center justify-between gap-3 border-b border-[#ded5c0] pb-4">
          <div className="flex items-center gap-2.5">
            <div className="w-8 h-8 rounded-xl bg-red-100 text-red-700 border border-red-200 flex items-center justify-center">
              <Database className="w-4 h-4" />
            </div>
            <div>
              <h3 className="text-base font-black font-rock text-stone-950 uppercase m-0">
                Setlist del Concierto ({state.songs.length} temas)
              </h3>
              <p className="text-xs text-stone-600">
                Agrega, edita o elimina canciones con URL o Base64, título y artista. Guardado automático activo.
              </p>
            </div>
          </div>
        </div>

        {/* Form to Add or Edit Song: Image URL -> Base64, Title, Artist */}
        <form onSubmit={handleSaveSong} className={`p-4 rounded-2xl border-2 space-y-3 transition-colors shadow-xs ${
          editingSongId
            ? 'bg-[#fff5f0] border-red-400'
            : 'bg-white border-[#ded5c0]'
        }`}>
          <div className="flex items-center justify-between">
            <div className="flex items-center gap-2">
              <span className="text-xs font-black uppercase text-stone-950 tracking-wider flex items-center gap-1.5 font-rock">
                {editingSongId ? (
                  <>
                    <Pencil className="w-3.5 h-3.5 text-red-600" />
                    Editar Canción
                  </>
                ) : (
                  <>
                    <Plus className="w-3.5 h-3.5 text-red-600" />
                    Agregar Canción al Setlist
                  </>
                )}
              </span>
              {editingSongId && (
                <span className="text-[10px] font-bold px-2 py-0.5 rounded bg-red-100 text-red-800 border border-red-300 font-rock uppercase">
                  Modo Edición
                </span>
              )}
            </div>
            {editingSongId ? (
              <button
                type="button"
                onClick={handleCancelEdit}
                className="text-xs text-stone-600 hover:text-stone-950 flex items-center gap-1 cursor-pointer font-rock uppercase"
              >
                <X className="w-3.5 h-3.5" />
                <span>Cancelar edición</span>
              </button>
            ) : (
              <span className="text-[11px] text-stone-600">
                Convierte URLs de carátulas a Base64 para carga instantánea
              </span>
            )}
          </div>

          <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
            <div>
              <label className="block text-[11px] font-bold uppercase text-stone-800 mb-1 font-rock">
                Título de la Canción *
              </label>
              <input
                type="text"
                required
                placeholder="Ej: De Música Ligera / Mi Enfermedad"
                value={songTitle}
                onChange={(e) => setSongTitle(e.target.value)}
                className="w-full px-3 py-2 rounded-xl bg-white border-2 border-[#ded5c0] focus:border-red-600 text-xs text-stone-950 font-medium placeholder-stone-400 outline-none shadow-xs"
              />
            </div>

            <div>
              <label className="block text-[11px] font-bold uppercase text-stone-800 mb-1 font-rock">
                Artista *
              </label>
              <input
                type="text"
                required
                placeholder="Ej: Soda Stereo / Los Rodríguez / COLAPSO"
                value={songArtist}
                onChange={(e) => setSongArtist(e.target.value)}
                className="w-full px-3 py-2 rounded-xl bg-white border-2 border-[#ded5c0] focus:border-red-600 text-xs text-stone-950 font-medium placeholder-stone-400 outline-none shadow-xs"
              />
            </div>
          </div>

          {/* Image URL with Convert-to-Base64 Button + Direct File Input */}
          <div>
            <label className="block text-[11px] font-bold uppercase text-stone-800 mb-1 font-rock">
              URL de la Carátula (o subir archivo para convertir a Base64)
            </label>
            <div className="flex flex-col sm:flex-row gap-2">
              <div className="relative flex-1">
                <input
                  type="text"
                  placeholder="https://images.unsplash.com/... o enlace público de la imagen"
                  value={songImageUrl}
                  onChange={(e) => setSongImageUrl(e.target.value)}
                  className="w-full px-3 py-2 rounded-xl bg-white border-2 border-[#ded5c0] focus:border-red-600 text-xs text-stone-950 placeholder-stone-400 outline-none shadow-xs"
                />
              </div>

              <button
                type="button"
                onClick={() => handleConvertUrlToBase64(songImageUrl)}
                disabled={isConvertingImage || !songImageUrl.trim()}
                className="px-3.5 py-2 rounded-xl bg-[#ebe3cf] hover:bg-[#ded5be] text-stone-900 text-xs font-bold flex items-center justify-center gap-1.5 border border-[#ded5c0] transition-colors cursor-pointer shrink-0 disabled:opacity-40 font-rock uppercase tracking-wider"
              >
                {isConvertingImage ? <Loader2 className="w-3.5 h-3.5 animate-spin" /> : <FileImage className="w-3.5 h-3.5 text-amber-700" />}
                <span>Convertir a Base64</span>
              </button>

              <label className="px-3.5 py-2 rounded-xl bg-[#ebe3cf] border border-[#ded5c0] hover:bg-[#ded5be] text-stone-900 text-xs font-bold flex items-center justify-center gap-1.5 transition-colors cursor-pointer shrink-0 font-rock uppercase tracking-wider">
                <Image className="w-3.5 h-3.5 text-red-600" />
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
              <p className="text-[11px] text-red-700 mt-1 font-semibold">{imageConvertError}</p>
            )}

            {/* Base64 preview indicator */}
            {imageBase64 && (
              <div className="mt-2 flex items-center gap-3 p-2 rounded-xl bg-[#faf6ed] border border-[#ded5c0]">
                <img
                  src={imageBase64}
                  alt="Preview"
                  className="w-10 h-10 rounded-lg object-cover border border-[#ded5c0] shrink-0"
                />
                <div className="min-w-0 flex-1">
                  <p className="text-xs font-bold text-stone-900 m-0">
                    ✓ Imagen convertida a Base64 con éxito
                  </p>
                  <p className="text-[10px] text-stone-600 truncate font-mono">
                    {imageBase64.substring(0, 60)}...
                  </p>
                </div>
                <button
                  type="button"
                  onClick={() => setImageBase64('')}
                  className="text-xs text-red-700 font-bold hover:underline cursor-pointer font-rock uppercase"
                >
                  Quitar
                </button>
              </div>
            )}
          </div>

          <div className="pt-2 flex items-center justify-end gap-2">
            {editingSongId && (
              <button
                type="button"
                onClick={handleCancelEdit}
                className="px-4 py-2.5 rounded-xl bg-[#ebe3cf] hover:bg-[#ded5be] text-stone-800 border border-[#ded5c0] font-bold text-xs uppercase tracking-wider flex items-center gap-1.5 cursor-pointer transition-all font-rock"
              >
                <X className="w-4 h-4" />
                <span>Cancelar</span>
              </button>
            )}
            <button
              type="submit"
              className="px-5 py-2.5 rounded-xl bg-red-600 hover:bg-red-700 text-white font-black text-xs uppercase tracking-wider flex items-center gap-2 shadow-md cursor-pointer transition-all font-rock"
            >
              {editingSongId ? (
                <>
                  <Check className="w-4 h-4" />
                  <span>Guardar Cambios</span>
                </>
              ) : (
                <>
                  <Plus className="w-4 h-4" />
                  <span>Agregar Canción</span>
                </>
              )}
            </button>
          </div>
        </form>

        {/* Current Setlist Table: Title, Artist, and Edit / Delete actions */}
        <div className="space-y-3">
          <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-2.5">
            <div>
              <h4 className="text-sm font-black uppercase text-stone-950 tracking-wide m-0 font-rock flex items-center gap-2">
                <ListMusic className="w-4 h-4 text-red-600" />
                Canciones en el Setlist ({state.songs.length})
              </h4>
              <p className="text-[11px] text-stone-600 font-semibold m-0">
                Sincronización automática con Supabase en tiempo real.
              </p>
            </div>

            {/* Quick action buttons for alphabetical ordering, inverted order and poster order */}
            <div className="flex flex-wrap items-center gap-1.5">
              <button
                type="button"
                onClick={handleSortAlphabeticalAZ}
                className="px-3 py-1.5 rounded-xl bg-stone-900 hover:bg-stone-800 text-white font-black text-xs uppercase tracking-wider flex items-center gap-1.5 shadow-xs cursor-pointer transition-all font-rock"
                title="Ordenar canciones alfabéticamente de la A a la Z"
              >
                <ArrowDownAZ className="w-3.5 h-3.5 text-red-500" />
                <span>Ordenar A → Z</span>
              </button>

              <button
                type="button"
                onClick={handleInvertOrder}
                className="px-3 py-1.5 rounded-xl bg-[#ebe3cf] hover:bg-red-600 hover:text-white text-stone-900 border border-[#ded5c0] font-black text-xs uppercase tracking-wider flex items-center gap-1.5 shadow-xs cursor-pointer transition-all font-rock"
                title="Invertir el orden actual del setlist (Z a A o reverso)"
              >
                <ArrowUpDown className="w-3.5 h-3.5 text-red-600" />
                <span>Invertir Orden</span>
              </button>

              <button
                type="button"
                onClick={handleRestorePosterOrder}
                className="px-3 py-1.5 rounded-xl bg-[#ebe3cf] hover:bg-stone-800 hover:text-white text-stone-800 border border-[#ded5c0] font-bold text-[11px] uppercase tracking-wider flex items-center gap-1.5 cursor-pointer transition-all font-rock"
                title="Restablecer el orden oficial por bloques del afiche (1 al 28)"
              >
                <span>Orden Afiche (1 al 28)</span>
              </button>

              {state.songs.length !== 28 && (
                <button
                  type="button"
                  onClick={handleResetToOfficial28}
                  className="px-2.5 py-1.5 rounded-xl bg-red-100 hover:bg-red-600 hover:text-white text-red-800 border border-red-300 font-bold text-[11px] uppercase tracking-wider flex items-center gap-1 cursor-pointer transition-all font-rock"
                  title="Cargar las 28 canciones oficiales del afiche COLAPSO"
                >
                  <Sparkles className="w-3.5 h-3.5" />
                  <span>Cargar 28 Oficiales</span>
                </button>
              )}
            </div>
          </div>

          {/* Quick Search inside Setlist */}
          <div className="relative">
            <Search className="w-3.5 h-3.5 text-stone-500 absolute left-3 top-1/2 -translate-y-1/2" />
            <input
              type="text"
              value={adminSearchQuery}
              onChange={(e) => setAdminSearchQuery(e.target.value)}
              placeholder="Buscar tema por título o artista para editar su imagen..."
              className="w-full pl-8 pr-3 py-1.5 text-xs rounded-xl bg-white border border-[#ded5c0] text-stone-900 placeholder:text-stone-400 focus:outline-hidden focus:border-red-600 shadow-2xs font-medium"
            />
          </div>

          <div className="divide-y divide-[#ded5c0] border-2 border-[#ded5c0] rounded-2xl overflow-hidden max-h-96 overflow-y-auto bg-white shadow-xs">
            {state.songs
              .filter((song) => {
                if (!adminSearchQuery.trim()) return true;
                const q = adminSearchQuery.toLowerCase();
                return (
                  song.title.toLowerCase().includes(q) ||
                  song.artist.toLowerCase().includes(q) ||
                  (song.albumOrYear && song.albumOrYear.toLowerCase().includes(q))
                );
              })
              .map((song, index) => {
                const isPlaying = song.id === state.currentPlayingSongId;
                const isPlayed = song.status === 'played';
                const isBeingEdited = editingSongId === song.id;

                return (
                  <div
                    key={song.id}
                    className={`p-3 flex items-center justify-between gap-3 transition-colors ${
                      isBeingEdited
                        ? 'bg-[#fff5f0] border-l-4 border-l-red-600'
                        : isPlaying
                        ? 'bg-red-50'
                        : isPlayed
                        ? 'bg-[#f5f0e4] opacity-75'
                        : 'hover:bg-[#faf6ed]'
                    }`}
                  >
                    <div className="flex items-center gap-3 min-w-0">
                      <span className="w-6 text-center text-xs font-black text-stone-500 font-mono">
                        #{index + 1}
                      </span>
                      {song.coverUrl ? (
                        <img
                          src={song.coverUrl}
                          alt={song.title}
                          className="w-10 h-10 rounded-lg object-cover border border-[#ded5c0] shrink-0 shadow-2xs"
                        />
                      ) : (
                        <button
                          type="button"
                          onClick={() => handleStartEdit(song)}
                          title="Sin imagen aún - Haz clic aquí para colocar su imagen"
                          className="w-10 h-10 rounded-lg bg-stone-900 border border-stone-700 hover:border-red-500 flex flex-col items-center justify-center text-red-500 shrink-0 transition-colors shadow-2xs group cursor-pointer"
                        >
                          <Image className="w-4 h-4 text-stone-400 group-hover:text-red-500 transition-colors" />
                          <span className="text-[7px] font-black text-stone-400 group-hover:text-red-500 font-mono tracking-tighter">
                            +IMG
                          </span>
                        </button>
                      )}
                      <div className="min-w-0">
                        <div className="flex items-center gap-2">
                          <p className="text-sm font-black text-stone-950 uppercase tracking-wide truncate m-0 font-rock">
                            {song.title}
                          </p>
                          {!song.coverUrl && (
                            <span className="text-[9px] font-bold px-1.5 py-0.5 rounded bg-amber-100 text-amber-800 border border-amber-300 font-mono shrink-0">
                              Sin imagen
                            </span>
                          )}
                        </div>
                        <div className="flex items-center gap-2 mt-0.5">
                          <p className="text-xs text-red-700 font-bold uppercase italic truncate m-0 font-rock">
                            {song.artist}
                          </p>
                        </div>
                      </div>
                    </div>

                    <div className="flex items-center gap-2 shrink-0">
                      {isPlaying && (
                        <span className="text-[10px] font-black uppercase px-2 py-0.5 rounded bg-red-600 text-white font-rock">
                          En Vivo
                        </span>
                      )}
                      {isPlayed && (
                        <span className="text-[10px] font-bold px-2 py-0.5 rounded bg-[#ebe3cf] text-stone-700 border border-[#ded5c0] font-rock uppercase">
                          Tocada
                        </span>
                      )}
                      {!isPlayed && !isPlaying && (
                        <button
                          onClick={() => adminActions.selectWinnerAndPlay(song.id)}
                          className="px-2.5 py-1 rounded-lg bg-[#ebe3cf] hover:bg-red-600 hover:text-white text-xs font-bold text-stone-900 transition-colors cursor-pointer border border-[#ded5c0] font-rock uppercase"
                        >
                          Tocar
                        </button>
                      )}

                      {/* Editar Canción Button */}
                      <button
                        type="button"
                        onClick={() => handleStartEdit(song)}
                        className={`p-1.5 rounded-lg transition-colors cursor-pointer ${
                          isBeingEdited
                            ? 'bg-red-600 text-white shadow-xs'
                            : 'text-stone-600 hover:text-stone-950 hover:bg-[#ebe3cf]'
                        }`}
                        title="Editar canción y colocar imagen"
                      >
                        <Pencil className="w-4 h-4" />
                      </button>

                      {/* Eliminar Canción Button */}
                      <button
                        type="button"
                        onClick={() => adminActions.removeSong(song.id)}
                        className="p-1.5 rounded-lg text-stone-500 hover:text-red-700 hover:bg-red-100 transition-colors cursor-pointer"
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
      <div className="p-4 rounded-2xl bg-red-50 border-2 border-red-300 flex flex-col sm:flex-row items-start sm:items-center justify-between gap-3 shadow-xl text-red-950">
        <div>
          <span className="text-xs font-black uppercase text-red-700 flex items-center gap-1.5 font-rock">
            <AlertTriangle className="w-4 h-4 text-red-600" />
            Reiniciar Concierto
          </span>
          <p className="text-[11px] text-stone-700 mt-0.5">
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
              className="px-3.5 py-1.5 rounded-lg bg-red-600 hover:bg-red-700 text-white font-black text-xs cursor-pointer shadow-md font-rock uppercase tracking-wider"
            >
              Confirmar Reinicio Completo
            </button>
            <button
              onClick={() => setShowConfirmReset(false)}
              className="px-3.5 py-1.5 rounded-lg bg-white text-stone-800 text-xs font-bold cursor-pointer border border-stone-300 font-rock uppercase"
            >
              Cancelar
            </button>
          </div>
        ) : (
          <button
            onClick={() => setShowConfirmReset(true)}
            className="px-3.5 py-1.5 rounded-lg bg-white border border-red-300 hover:bg-red-100 text-red-700 text-xs font-bold flex items-center gap-1.5 transition-colors cursor-pointer font-rock uppercase tracking-wider"
          >
            <RotateCcw className="w-3.5 h-3.5" />
            <span>Reiniciar Show</span>
          </button>
        )}
      </div>
    </div>
  );
};
