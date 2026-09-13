import express from 'express';
import http from 'http';
import path from 'path';
import { WebSocketServer, WebSocket } from 'ws';
import { createServer as createViteServer } from 'vite';
import { DEFAULT_30_SONGS } from './src/data/defaultSongs';
import { Song, ShowState, SocialLinks, LiveStreams } from './src/types';
import { getSupabase } from './server/supabase';

const INITIAL_SOCIAL_LINKS: SocialLinks = {
  instagram: 'https://instagram.com/bandacolapso',
  spotify: 'https://open.spotify.com/artist/colapso',
  tiktok: 'https://tiktok.com/@bandacolapso',
  facebook: 'https://facebook.com/bandacolapso',
  youtube: 'https://youtube.com/@bandacolapso',
};

const INITIAL_LIVE_STREAMS: LiveStreams = {
  tiktokLive: 'https://tiktok.com/@bandacolapso/live',
  facebookLive: '',
  youtubeLive: '',
  isLiveActive: true,
};

// Initial state starts completely clean/empty: ready for the band to enter their own songs
const INITIAL_LIVE_VOTES: Record<string, string> = {};
const INITIAL_RANKED_VOTES: Record<string, string[]> = {};

// Global show state in memory
const state: ShowState = {
  bandName: 'COLAPSO',
  activeMode: 'live_next_song',
  votingOpen: true,
  roundNumber: 1,
  currentPlayingSongId: null,
  songs: [],
  liveVotes: { ...INITIAL_LIVE_VOTES },
  rankedSetlistVotes: { ...INITIAL_RANKED_VOTES },
  connectedClients: 0,
  totalFansVoted: 0,
  lastWinner: null,
  tickerMessage: '🎸 ¡Bienvenidos al show de COLAPSO! Vota ahora por los temas en tiempo real.',
  socialLinks: { ...INITIAL_SOCIAL_LINKS },
  liveStreams: { ...INITIAL_LIVE_STREAMS },
  locationUrl: '',
  locationName: '',
  attendances: {},
};


function recalculateTotals() {
  const votersSet = new Set<string>();
  Object.keys(state.liveVotes).forEach((k) => votersSet.add(k));
  Object.keys(state.rankedSetlistVotes).forEach((k) => votersSet.add(k));
  state.totalFansVoted = votersSet.size;
}

async function startServer() {
  const app = express();
  const server = http.createServer(app);
  const PORT = 3000;

  app.use(express.json({ limit: '10mb' }));

  // REST API: Admin Password Verification (Prevents devtools inspection bypass)
  const ADMIN_PASSWORD = process.env.ADMIN_PASSWORD || 'COLAPSOBB26';

  app.post('/api/admin/verify', (req, res) => {
    const { password } = req.body;
    if (password === ADMIN_PASSWORD) {
      return res.json({ success: true });
    }
    return res.status(401).json({ success: false, error: 'Contraseña incorrecta' });
  });

  // REST API: Convert Image URL to Base64 (Bypasses CORS and returns clean data URL)
  app.post('/api/convert-image-base64', async (req, res) => {
    try {
      const { imageUrl } = req.body;
      if (!imageUrl || typeof imageUrl !== 'string') {
        return res.status(400).json({ error: 'URL de imagen requerida' });
      }

      if (imageUrl.startsWith('data:image/')) {
        return res.json({ base64: imageUrl });
      }

      const response = await fetch(imageUrl);
      if (!response.ok) {
        return res.status(400).json({ error: `Error descargando imagen: ${response.statusText}` });
      }

      const contentType = response.headers.get('content-type') || 'image/jpeg';
      const arrayBuffer = await response.arrayBuffer();
      const base64Data = Buffer.from(arrayBuffer).toString('base64');
      const dataUri = `data:${contentType};base64,${base64Data}`;

      res.json({ base64: dataUri });
    } catch (err: any) {
      console.error('Error converting image to base64:', err);
      res.status(500).json({ error: 'No se pudo procesar la imagen' });
    }
  });

  // REST API: Supabase Setlist sync & status
  app.get('/api/supabase/status', async (req, res) => {
    const supabase = getSupabase();
    res.json({
      configured: Boolean(supabase),
      url: process.env.SUPABASE_URL ? 'Configurado' : 'No configurado',
    });
  });

  app.get('/api/supabase/load-setlist', async (req, res) => {
    const supabase = getSupabase();
    if (!supabase) {
      return res.status(400).json({ error: 'Supabase no está configurado aún' });
    }

    try {
      const { data, error } = await supabase
        .from('setlist')
        .select('*')
        .order('order', { ascending: true });

      if (error) {
        return res.status(500).json({ error: error.message });
      }

      if (data && data.length > 0) {
        state.songs = data.map((d: any, idx: number) => ({
          id: d.id || `song-${idx + 1}`,
          title: d.title,
          artist: d.artist,
          albumOrYear: d.albumOrYear || d.album_or_year || 'Setlist COLAPSO',
          coverUrl: d.coverUrl || d.cover_url || '',
          status: (d.status as any) || 'unplayed',
          order: d.order || idx + 1,
          isCrowdRequest: Boolean(d.isCrowdRequest || d.is_crowd_request),
        }));
        broadcastState();
      }

      res.json({ success: true, count: data?.length || 0, songs: state.songs });
    } catch (err: any) {
      res.status(500).json({ error: err.message });
    }
  });

  app.post('/api/supabase/save-setlist', async (req, res) => {
    const supabase = getSupabase();
    if (!supabase) {
      return res.status(400).json({ error: 'Supabase no está configurado' });
    }

    try {
      const payload = state.songs.map((s, idx) => ({
        id: s.id,
        title: s.title,
        artist: s.artist,
        album_or_year: s.albumOrYear,
        cover_url: s.coverUrl,
        status: s.status,
        order: idx + 1,
        is_crowd_request: Boolean(s.isCrowdRequest),
      }));

      const { error } = await supabase.from('setlist').upsert(payload);
      if (error) {
        return res.status(500).json({ error: error.message });
      }

      res.json({ success: true, message: 'Setlist guardado en Supabase' });
    } catch (err: any) {
      res.status(500).json({ error: err.message });
    }
  });

  // WebSocket Server
  const wss = new WebSocketServer({ server });

  function broadcast(data: unknown) {
    const payload = JSON.stringify(data);
    wss.clients.forEach((client) => {
      if (client.readyState === WebSocket.OPEN) {
        client.send(payload);
      }
    });
  }

  function broadcastState() {
    recalculateTotals();
    state.connectedClients = wss.clients.size;
    broadcast({
      type: 'STATE_UPDATE',
      state,
    });
  }

  wss.on('connection', (ws: WebSocket) => {
    state.connectedClients = wss.clients.size;

    // Send initial state on connection
    ws.send(
      JSON.stringify({
        type: 'INIT_STATE',
        state: { ...state, connectedClients: wss.clients.size },
      })
    );

    // Broadcast updated client count
    broadcastState();

    ws.on('message', (raw) => {
      try {
        const msg = JSON.parse(raw.toString());

        switch (msg.type) {
          case 'VOTE_LIVE': {
            if (!state.votingOpen) return;
            const { songId, userId } = msg;
            if (!songId || !userId) return;
            // Verify song is unplayed
            const targetSong = state.songs.find((s) => s.id === songId);
            if (targetSong && targetSong.status === 'unplayed') {
              state.liveVotes[userId] = songId;
              broadcastState();
            }
            break;
          }

          case 'SET_ATTENDANCE': {
            const { userId, attendance } = msg;
            if (userId && (attendance === 'in_person' || attendance === 'virtual')) {
              if (!state.attendances) state.attendances = {};
              state.attendances[userId] = attendance;
              broadcastState();
            }
            break;
          }

          case 'UPDATE_RANKING': {
            if (!state.votingOpen) return;
            const { songIds, userId } = msg;
            if (!Array.isArray(songIds) || !userId) return;
            state.rankedSetlistVotes[userId] = songIds;
            broadcastState();
            break;
          }

          case 'ADMIN_TOGGLE_VOTING': {
            const willBeOpen = typeof msg.open === 'boolean' ? msg.open : !state.votingOpen;
            state.votingOpen = willBeOpen;

            // When pausing/closing voting, if there's a tie between 2 or more songs with highest votes, randomly choose one
            if (!willBeOpen) {
              const eligibleSongs = state.songs.filter(
                (s) => s.status === 'unplayed' && s.id !== state.currentPlayingSongId
              );

              // Count current round votes
              const songVoteCounts: Record<string, number> = {};
              eligibleSongs.forEach((s) => {
                songVoteCounts[s.id] = 0;
              });
              Object.values(state.liveVotes).forEach((songId) => {
                if (songVoteCounts[songId] !== undefined) {
                  songVoteCounts[songId] += 1;
                }
              });

              let maxVotes = 0;
              Object.values(songVoteCounts).forEach((count) => {
                if (count > maxVotes) maxVotes = count;
              });

              if (maxVotes > 0) {
                const tiedSongs = eligibleSongs.filter(
                  (s) => (songVoteCounts[s.id] || 0) === maxVotes
                );

                // If 2 or more songs are tied for the #1 spot
                if (tiedSongs.length > 1) {
                  const randomIndex = Math.floor(Math.random() * tiedSongs.length);
                  const chosenWinner = tiedSongs[randomIndex];
                  console.log(
                    `[Tiebreak] EMPATE DETECTADO entre ${tiedSongs.length} canciones con ${maxVotes} votos. Sistema eligió al azar: ${chosenWinner.title}`
                  );

                  // Set winner announcement
                  state.lastWinner = {
                    songId: chosenWinner.id,
                    title: chosenWinner.title,
                    artist: chosenWinner.artist,
                    voteCount: maxVotes,
                    round: state.roundNumber,
                    timestamp: Date.now(),
                    isCrowdRequest: false,
                  };

                  // Transition previous playing song if any
                  state.songs.forEach((s) => {
                    if (s.status === 'playing') {
                      s.status = 'played';
                    }
                  });

                  chosenWinner.status = 'playing';
                  chosenWinner.playedRound = state.roundNumber;
                  chosenWinner.isCrowdRequest = false;
                  state.currentPlayingSongId = chosenWinner.id;

                  // Broadcast celebration to all screens
                  broadcast({
                    type: 'WINNER_CELEBRATION',
                    winner: state.lastWinner,
                  });

                  // Reset round votes for next song
                  state.liveVotes = {};
                  state.roundNumber += 1;
                  // Keep voting paused as requested
                }
              }
            }

            broadcastState();
            break;
          }

          case 'ADMIN_SET_MODE': {
            if (msg.mode === 'live_next_song' || msg.mode === 'full_setlist_ranked') {
              state.activeMode = msg.mode;
              broadcastState();
            }
            break;
          }

          case 'ADMIN_SET_PLAYING': {
            const { songId } = msg;
            const song = state.songs.find((s) => s.id === songId);
            if (song) {
              // Finish previous playing song if any
              state.songs.forEach((s) => {
                if (s.status === 'playing') {
                  s.status = 'played';
                }
              });
              song.status = 'playing';
              song.playedRound = state.roundNumber;
              state.currentPlayingSongId = song.id;

              // Reset live votes for the new round so audience votes for the NEXT song!
              state.liveVotes = {};
              state.roundNumber += 1;
              state.votingOpen = true;

              broadcastState();
            }
            break;
          }

          case 'ADMIN_SELECT_WINNER_AND_PLAY': {
            const { songId } = msg;
            const song = state.songs.find((s) => s.id === songId);
            if (song) {
              // Count votes for announcement
              let voteCount = 0;
              Object.values(state.liveVotes).forEach((v) => {
                if (v === songId) voteCount++;
              });

              state.lastWinner = {
                songId: song.id,
                title: song.title,
                artist: song.artist,
                voteCount,
                round: state.roundNumber,
                timestamp: Date.now(),
                isCrowdRequest: false,
              };

              // Finish any previous playing song
              state.songs.forEach((s) => {
                if (s.status === 'playing') {
                  s.status = 'played';
                }
              });

              song.status = 'playing';
              song.playedRound = state.roundNumber;
              song.isCrowdRequest = false;
              state.currentPlayingSongId = song.id;

              // Broadcast celebration
              broadcast({
                type: 'WINNER_CELEBRATION',
                winner: state.lastWinner,
              });

              // Reset live round votes for the next song selection
              state.liveVotes = {};
              state.roundNumber += 1;
              state.votingOpen = true;

              broadcastState();
            }
            break;
          }

          case 'ADMIN_CROWD_REQUEST': {
            // Special Feature: Pedido del Público directly requested by a musician
            const { songId } = msg;
            const song = state.songs.find((s) => s.id === songId);
            if (song) {
              // Finish any previous playing song
              state.songs.forEach((s) => {
                if (s.status === 'playing') {
                  s.status = 'played';
                }
              });

              song.status = 'playing';
              song.playedRound = state.roundNumber;
              song.isCrowdRequest = true;
              state.currentPlayingSongId = song.id;

              state.lastWinner = {
                songId: song.id,
                title: song.title,
                artist: song.artist,
                voteCount: 0,
                round: state.roundNumber,
                timestamp: Date.now(),
                isCrowdRequest: true,
              };

              // Broadcast celebration banner
              broadcast({
                type: 'WINNER_CELEBRATION',
                winner: state.lastWinner,
              });

              // Reset live round votes for the next song selection
              state.liveVotes = {};
              state.roundNumber += 1;
              state.votingOpen = true;

              broadcastState();
            }
            break;
          }

          case 'ADMIN_UPDATE_STREAMS': {
            if (msg.liveStreams) {
              state.liveStreams = { ...state.liveStreams, ...msg.liveStreams };
              broadcastState();
            }
            break;
          }

          case 'ADMIN_UPDATE_SOCIALS': {
            if (msg.socialLinks) {
              state.socialLinks = { ...state.socialLinks, ...msg.socialLinks };
              broadcastState();
            }
            break;
          }


          case 'ADMIN_UPDATE_LOCATION': {
            if (msg.locationUrl !== undefined) {
              state.locationUrl = msg.locationUrl.trim();
              if (msg.locationName !== undefined) {
                state.locationName = msg.locationName.trim();
              }
              broadcastState();
            }
            break;
          }

          case 'ADMIN_FINISH_PLAYING': {
            if (state.currentPlayingSongId) {
              const current = state.songs.find((s) => s.id === state.currentPlayingSongId);
              if (current) {
                current.status = 'played';
                if (!current.playedRound) {
                  current.playedRound = state.roundNumber;
                }
              }
              state.currentPlayingSongId = null;
              // Advance to next round for voting if round wasn't already incremented
              const playedCount = state.songs.filter((s) => s.status === 'played').length;
              if (state.roundNumber <= playedCount) {
                state.roundNumber = playedCount + 1;
              }
              state.votingOpen = true;
              broadcastState();
            }
            break;
          }

          case 'ADMIN_RESET_VOTES': {
            state.liveVotes = {};
            state.rankedSetlistVotes = {};
            state.roundNumber = 1;
            state.currentPlayingSongId = null;
            state.lastWinner = null;
            state.songs.forEach((s, idx) => {
              s.status = 'unplayed';
              s.playedRound = undefined;
              s.isCrowdRequest = false;
              s.order = idx + 1;
            });
            broadcastState();
            break;
          }

          case 'ADMIN_ADD_SONG': {
            if (msg.title) {
              const newSong: Song = {
                id: 'song-' + Date.now(),
                title: msg.title.trim(),
                artist: msg.artist?.trim() || 'Banda Colapso',
                albumOrYear: msg.albumOrYear?.trim() || 'Setlist COLAPSO',
                coverUrl:
                  msg.coverUrl?.trim() ||
                  'https://images.unsplash.com/photo-1511671782779-c97d3d27a1d4?w=300&auto=format&fit=crop&q=80',
                tempo: msg.tempo?.trim() || 'Rock',
                notes: 'Setlist Colapso',
                status: 'unplayed',
                order: state.songs.length + 1,
                isCrowdRequest: false,
              };
              state.songs.push(newSong);
              broadcastState();
            }
            break;
          }

          case 'ADMIN_UPDATE_SONGS': {
            if (Array.isArray(msg.songs)) {
              state.songs = msg.songs;
              broadcastState();
            }
            break;
          }

          case 'ADMIN_REMOVE_SONG': {
            state.songs = state.songs.filter((s) => s.id !== msg.songId);
            // clean votes for this song
            Object.keys(state.liveVotes).forEach((u) => {
              if (state.liveVotes[u] === msg.songId) {
                delete state.liveVotes[u];
              }
            });
            broadcastState();
            break;
          }

          case 'ADMIN_SET_MESSAGE': {
            state.tickerMessage = msg.message || '';
            broadcastState();
            break;
          }

          case 'ADMIN_SIMULATE_VOTES': {
            // Adds simulated fan votes to test dynamic visuals
            const count = Math.min(Math.max(Number(msg.count) || 10, 1), 50);
            const eligible = state.songs.filter(
              (s) => s.status === 'unplayed' && s.id !== state.currentPlayingSongId
            );
            if (eligible.length > 0) {
              for (let i = 0; i < count; i++) {
                const randomUserId = `sim_fan_${Date.now()}_${i}`;
                const chosenSong = eligible[Math.floor(Math.random() * eligible.length)];
                state.liveVotes[randomUserId] = chosenSong.id;

                // Also generate random ranking for Idea 1
                const shuffled = [...state.songs]
                  .sort(() => 0.5 - Math.random())
                  .map((s) => s.id);
                state.rankedSetlistVotes[randomUserId] = shuffled;
              }
              broadcastState();
            }
            break;
          }
        }
      } catch (err) {
        console.error('Error handling WebSocket message:', err);
      }
    });

    ws.on('close', () => {
      state.connectedClients = wss.clients.size;
      broadcastState();
    });
  });

  // REST API routes
  app.get('/api/state', (req, res) => {
    recalculateTotals();
    state.connectedClients = wss.clients.size;
    res.json(state);
  });

  app.post('/api/vote-live', (req, res) => {
    const { songId, userId } = req.body;
    if (!songId || !userId) {
      return res.status(400).json({ error: 'Missing songId or userId' });
    }
    state.liveVotes[userId] = songId;
    broadcastState();
    res.json({ success: true, state });
  });

  // Vite development middleware vs production static
  if (process.env.NODE_ENV !== 'production') {
    const vite = await createViteServer({
      server: { middlewareMode: true },
      appType: 'spa',
    });
    app.use(vite.middlewares);
  } else {
    const distPath = path.join(process.cwd(), 'dist');
    app.use(express.static(distPath));
    app.get('*', (req, res) => {
      res.sendFile(path.join(distPath, 'index.html'));
    });
  }

  server.listen(PORT, '0.0.0.0', async () => {
    console.log(`🎸 COLAPSO Live Concert Server running on http://0.0.0.0:${PORT}`);

    // Auto-load songs from Supabase if table exists and has songs
    const supabase = getSupabase();
    if (supabase) {
      try {
        const { data, error } = await supabase
          .from('setlist')
          .select('*')
          .order('order', { ascending: true });

        if (!error && data && data.length > 0) {
          state.songs = data.map((d: any, idx: number) => ({
            id: d.id || `song-${idx + 1}`,
            title: d.title,
            artist: d.artist,
            albumOrYear: d.albumOrYear || d.album_or_year || 'Setlist COLAPSO',
            coverUrl: d.coverUrl || d.cover_url || '',
            status: (d.status as any) || 'unplayed',
            order: d.order || idx + 1,
            isCrowdRequest: Boolean(d.isCrowdRequest || d.is_crowd_request),
          }));
          console.log(`✅ Loaded ${state.songs.length} songs from Supabase on startup`);
          broadcastState();
        }
      } catch (e: any) {
        console.log('ℹ️ Supabase table not initialized yet or empty:', e?.message);
      }
    }
  });
}

startServer();
