import express from 'express';
import http from 'http';
import path from 'path';
import fs from 'fs';
import { WebSocketServer, WebSocket } from 'ws';
import { createServer as createViteServer } from 'vite';
import {
  DEFAULT_30_SONGS,
  COLAPSO_ALPHABETICAL_SONGS,
  COLAPSO_POSTER_SONGS,
  getSortTitle,
} from './src/data/defaultSongs';
import { Song, ShowState, SocialLinks, LiveStreams } from './src/types';
import { getSupabase } from './server/supabase';

const INITIAL_SOCIAL_LINKS: SocialLinks = {
  whatsapp: 'https://wa.me/51915189153',
  phone: '915189153',
  instagram: 'https://instagram.com/ColapsoBandaRock',
  spotify: 'https://open.spotify.com/artist/colapso',
  tiktok: 'https://tiktok.com/@ColapsoBandaRock',
  facebook: 'https://facebook.com/ColapsoBandaRock',
  youtube: 'https://youtube.com/@ColapsoBandaRock',
};

const INITIAL_LIVE_STREAMS: LiveStreams = {
  tiktokLive: 'https://tiktok.com/@bandacolapso/live',
  facebookLive: '',
  youtubeLive: '',
  isLiveActive: true,
};

// Initial state starts with the official 28 songs sorted alphabetically
const INITIAL_LIVE_VOTES: Record<string, string> = {};
const INITIAL_RANKED_VOTES: Record<string, string[]> = {};

// Global show state in memory
const state: ShowState = {
  bandName: 'COLAPSO',
  activeMode: 'live_next_song',
  votingOpen: true,
  roundNumber: 1,
  currentPlayingSongId: null,
  songs: [...COLAPSO_ALPHABETICAL_SONGS],
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

const CONFIG_FILE = path.join(process.cwd(), 'data_band_config.json');

function saveBandConfig() {
  try {
    const configData = {
      socialLinks: state.socialLinks,
      liveStreams: state.liveStreams,
      locationUrl: state.locationUrl,
      locationName: state.locationName,
      tickerMessage: state.tickerMessage,
      songs: state.songs,
    };
    fs.writeFileSync(CONFIG_FILE, JSON.stringify(configData, null, 2), 'utf-8');
  } catch (err) {
    console.warn('Could not write band config:', err);
  }
}

function loadBandConfig() {
  try {
    if (fs.existsSync(CONFIG_FILE)) {
      const raw = fs.readFileSync(CONFIG_FILE, 'utf-8');
      const data = JSON.parse(raw);
      if (data.socialLinks) state.socialLinks = { ...state.socialLinks, ...data.socialLinks };
      if (data.liveStreams) state.liveStreams = { ...state.liveStreams, ...data.liveStreams };
      if (data.locationUrl !== undefined) state.locationUrl = data.locationUrl;
      if (data.locationName !== undefined) state.locationName = data.locationName;
      if (data.tickerMessage !== undefined) state.tickerMessage = data.tickerMessage;
      if (Array.isArray(data.songs) && data.songs.length > 0) {
        state.songs = data.songs.map((s: any) => ({
          ...s,
          albumOrYear: s.albumOrYear && (s.albumOrYear.toLowerCase().includes('bloque') || /\(\d{4}\)/.test(s.albumOrYear)) ? '' : (s.albumOrYear || ''),
        }));
      }
      console.log('✅ Band config loaded from persistent file');
    }
  } catch (err) {
    console.warn('Could not read band config:', err);
  }

  // Ensure songs are present and clean
  if (!state.songs || state.songs.length === 0) {
    state.songs = [...COLAPSO_ALPHABETICAL_SONGS];
  } else {
    state.songs = state.songs.map((s) => ({
      ...s,
      albumOrYear: s.albumOrYear && (s.albumOrYear.toLowerCase().includes('bloque') || /\(\d{4}\)/.test(s.albumOrYear)) ? '' : (s.albumOrYear || ''),
    }));
  }
}

loadBandConfig();


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

  let autoSaveTimeout: NodeJS.Timeout | null = null;
  function triggerAutoSaveSupabase() {
    const supabase = getSupabase();
    if (!supabase) return;

    if (autoSaveTimeout) clearTimeout(autoSaveTimeout);
    autoSaveTimeout = setTimeout(async () => {
      try {
        const currentIds = state.songs.map((s) => s.id);
        if (currentIds.length > 0) {
          const payload = state.songs.map((s, idx) => ({
            id: s.id,
            title: s.title,
            artist: s.artist,
            album_or_year: s.albumOrYear || 'Setlist COLAPSO',
            cover_url: s.coverUrl || '',
            status: s.status,
            order: idx + 1,
            is_crowd_request: Boolean(s.isCrowdRequest),
          }));
          const { error } = await supabase.from('setlist').upsert(payload);
          if (error) {
            console.warn('[Supabase Auto-Sync Warning]', error.message);
            return;
          }

          // Delete songs removed from setlist
          const { data: dbRows } = await supabase.from('setlist').select('id');
          if (dbRows && dbRows.length > 0) {
            const idsToDelete = dbRows
              .map((r: any) => r.id)
              .filter((id: string) => !currentIds.includes(id));
            if (idsToDelete.length > 0) {
              await supabase.from('setlist').delete().in('id', idsToDelete);
            }
          }
        } else {
          // If setlist is empty, clean table
          await supabase.from('setlist').delete().neq('id', '___empty___');
        }

        state.lastSupabaseSync = Date.now();
        console.log(`[Supabase Auto-Sync] Sincronizado setlist (${state.songs.length} temas) con Supabase`);
        broadcast({
          type: 'SUPABASE_SYNC_STATUS',
          success: true,
          timestamp: state.lastSupabaseSync,
        });
      } catch (err: any) {
        console.warn('[Supabase Auto-Sync Exception]', err?.message);
      }
    }, 800);
  }

  app.post('/api/supabase/save-setlist', async (req, res) => {
    const supabase = getSupabase();
    if (!supabase) {
      return res.status(400).json({ error: 'Supabase no está configurado aún en las variables de entorno' });
    }

    try {
      const currentIds = state.songs.map((s) => s.id);
      if (currentIds.length > 0) {
        const payload = state.songs.map((s, idx) => ({
          id: s.id,
          title: s.title,
          artist: s.artist,
          album_or_year: s.albumOrYear || 'Setlist COLAPSO',
          cover_url: s.coverUrl || '',
          status: s.status,
          order: idx + 1,
          is_crowd_request: Boolean(s.isCrowdRequest),
        }));

        const { error } = await supabase.from('setlist').upsert(payload);
        if (error) {
          return res.status(500).json({ error: error.message });
        }

        const { data: dbRows } = await supabase.from('setlist').select('id');
        if (dbRows && dbRows.length > 0) {
          const idsToDelete = dbRows
            .map((r: any) => r.id)
            .filter((id: string) => !currentIds.includes(id));
          if (idsToDelete.length > 0) {
            await supabase.from('setlist').delete().in('id', idsToDelete);
          }
        }
      } else {
        await supabase.from('setlist').delete().neq('id', '___empty___');
      }

      state.lastSupabaseSync = Date.now();
      broadcastState();
      broadcast({
        type: 'SUPABASE_SYNC_STATUS',
        success: true,
        timestamp: state.lastSupabaseSync,
      });

      res.json({ success: true, message: 'Setlist guardado y sincronizado con Supabase' });
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
            if (!userId) return;

            // If already voted for this song, toggle/remove vote
            if (state.liveVotes[userId] === songId || !songId) {
              delete state.liveVotes[userId];
              broadcastState();
              break;
            }

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
            // Pausing only freezes/stops votes. It does NOT automatically choose or play a song.
            // When there is a tie, the band can inspect the tie and trigger the random tiebreaker button manually.
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
              saveBandConfig();
              broadcastState();
            }
            break;
          }

          case 'ADMIN_UPDATE_SOCIALS': {
            if (msg.socialLinks) {
              state.socialLinks = { ...state.socialLinks, ...msg.socialLinks };
              saveBandConfig();
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
              saveBandConfig();
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
                coverUrl: msg.coverUrl?.trim() || '',
                tempo: msg.tempo?.trim() || 'Rock',
                notes: 'Setlist Colapso',
                status: 'unplayed',
                order: state.songs.length + 1,
                isCrowdRequest: false,
              };
              state.songs.push(newSong);
              broadcastState();
              triggerAutoSaveSupabase();
            }
            break;
          }

          case 'ADMIN_EDIT_SONG': {
            const { songId, title, artist, coverUrl } = msg;
            const song = state.songs.find((s) => s.id === songId);
            if (song && title) {
              song.title = title.trim();
              if (artist) song.artist = artist.trim();
              if (coverUrl !== undefined) song.coverUrl = coverUrl.trim();
              broadcastState();
              triggerAutoSaveSupabase();
            }
            break;
          }

          case 'ADMIN_UPDATE_SONGS': {
            if (Array.isArray(msg.songs)) {
              state.songs = msg.songs;
              saveBandConfig();
              broadcastState();
              triggerAutoSaveSupabase();
            }
            break;
          }

          case 'ADMIN_SORT_SONGS': {
            const direction = msg.direction || 'asc';
            if (direction === 'poster') {
              // Restore original 1-28 poster order
              const posterMap = new Map(
                COLAPSO_POSTER_SONGS.map((s, idx) => [s.title.toLowerCase().trim(), idx + 1])
              );
              state.songs.sort((a, b) => {
                const posA = posterMap.get(a.title.toLowerCase().trim()) ?? 999;
                const posB = posterMap.get(b.title.toLowerCase().trim()) ?? 999;
                return posA - posB;
              });
            } else if (direction === 'desc') {
              // Z to A
              state.songs.sort((a, b) =>
                getSortTitle(b.title).localeCompare(getSortTitle(a.title), 'es', { sensitivity: 'base' })
              );
            } else {
              // A to Z
              state.songs.sort((a, b) =>
                getSortTitle(a.title).localeCompare(getSortTitle(b.title), 'es', { sensitivity: 'base' })
              );
            }
            state.songs.forEach((s, idx) => {
              s.order = idx + 1;
            });
            saveBandConfig();
            broadcastState();
            triggerAutoSaveSupabase();
            break;
          }

          case 'ADMIN_INVERT_SONGS_ORDER': {
            state.songs.reverse();
            state.songs.forEach((s, idx) => {
              s.order = idx + 1;
            });
            saveBandConfig();
            broadcastState();
            triggerAutoSaveSupabase();
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
            triggerAutoSaveSupabase();
            break;
          }

          case 'ADMIN_SET_MESSAGE': {
            state.tickerMessage = msg.message || '';
            saveBandConfig();
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
    if (!userId) {
      return res.status(400).json({ error: 'Missing userId' });
    }
    if (state.liveVotes[userId] === songId || !songId) {
      delete state.liveVotes[userId];
    } else {
      state.liveVotes[userId] = songId;
    }
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
            albumOrYear: d.albumOrYear && !d.albumOrYear.toLowerCase().includes('bloque') ? d.albumOrYear : '',
            coverUrl: d.coverUrl || d.cover_url || '',
            status: (d.status as any) || 'unplayed',
            order: d.order || idx + 1,
            isCrowdRequest: Boolean(d.isCrowdRequest || d.is_crowd_request),
          }));
          console.log(`✅ Loaded ${state.songs.length} songs from Supabase on startup`);
          broadcastState();
        } else {
          console.log('⚡ Initializing Supabase with official 28 COLAPSO songs');
          triggerAutoSaveSupabase();
        }
      } catch (e: any) {
        console.log('ℹ️ Supabase table sync notice:', e?.message);
        triggerAutoSaveSupabase();
      }
    } else {
      triggerAutoSaveSupabase();
    }
  });
}

startServer();
