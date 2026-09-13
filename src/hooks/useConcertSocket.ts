import { useEffect, useState, useRef, useCallback } from 'react';
import confetti from 'canvas-confetti';
import {
  ShowState,
  WebSocketClientMessage,
  WebSocketServerMessage,
  WinnerAnnouncement,
  ShowMode,
} from '../types';

function getOrCreateUserId(): string {
  const key = 'colapso_fan_user_id';
  let id = localStorage.getItem(key);
  if (!id) {
    id = 'fan_' + Math.random().toString(36).substring(2, 9) + '_' + Date.now().toString(36).slice(-4);
    localStorage.setItem(key, id);
  }
  return id;
}

export function useConcertSocket() {
  const [userId] = useState<string>(getOrCreateUserId);
  const [state, setState] = useState<ShowState | null>(null);
  const [isConnected, setIsConnected] = useState<boolean>(false);
  const [winnerCelebration, setWinnerCelebration] = useState<WinnerAnnouncement | null>(null);
  const wsRef = useRef<WebSocket | null>(null);
  const reconnectTimeoutRef = useRef<number | null>(null);

  const connect = useCallback(() => {
    try {
      const protocol = window.location.protocol === 'https:' ? 'wss:' : 'ws:';
      const wsUrl = `${protocol}//${window.location.host}`;
      const ws = new WebSocket(wsUrl);
      wsRef.current = ws;

      ws.onopen = () => {
        setIsConnected(true);
        // Register current fan ID
        ws.send(
          JSON.stringify({
            type: 'REGISTER_USER',
            userId,
          } as WebSocketClientMessage)
        );
      };

      ws.onmessage = (event) => {
        try {
          const msg: WebSocketServerMessage = JSON.parse(event.data);
          if (msg.type === 'INIT_STATE' || msg.type === 'STATE_UPDATE') {
            setState(msg.state);
          } else if (msg.type === 'WINNER_CELEBRATION') {
            setWinnerCelebration(msg.winner);
            // Trigger confetti blast for rock concert vibe
            try {
              confetti({
                particleCount: 80,
                spread: 70,
                origin: { y: 0.6 },
                colors: ['#10b981', '#06b6d4', '#f59e0b', '#ffffff'],
              });
            } catch (e) {
              console.warn('Confetti error:', e);
            }
          }
        } catch (err) {
          console.error('Error parsing WS message:', err);
        }
      };

      ws.onclose = () => {
        setIsConnected(false);
        // Reconnect automatically with backoff
        reconnectTimeoutRef.current = window.setTimeout(() => {
          connect();
        }, 2000);
      };

      ws.onerror = (err) => {
        console.warn('WebSocket encountered error, fallback polling active:', err);
        ws.close();
      };
    } catch (err) {
      console.warn('Could not establish WebSocket, fallback to HTTP fetch:', err);
      setIsConnected(false);
    }
  }, [userId]);

  // Initial connect & cleanup
  useEffect(() => {
    connect();

    // Fallback polling every 3 seconds if disconnected
    const pollInterval = setInterval(() => {
      if (!wsRef.current || wsRef.current.readyState !== WebSocket.OPEN) {
        fetch('/api/state')
          .then((res) => res.json())
          .then((data: ShowState) => {
            setState(data);
          })
          .catch(() => {});
      }
    }, 3000);

    return () => {
      clearInterval(pollInterval);
      if (reconnectTimeoutRef.current) clearTimeout(reconnectTimeoutRef.current);
      if (wsRef.current) {
        wsRef.current.close();
      }
    };
  }, [connect]);

  // Safe message sender
  const sendMessage = useCallback((msg: WebSocketClientMessage) => {
    if (wsRef.current && wsRef.current.readyState === WebSocket.OPEN) {
      wsRef.current.send(JSON.stringify(msg));
    } else {
      // Fallback HTTP endpoint for live vote
      if (msg.type === 'VOTE_LIVE') {
        fetch('/api/vote-live', {
          method: 'POST',
          headers: { 'Content-Type': 'application/json' },
          body: JSON.stringify({ songId: msg.songId, userId: msg.userId }),
        })
          .then((res) => res.json())
          .then((data) => {
            if (data.state) setState(data.state);
          })
          .catch(console.error);
      }
    }
  }, []);

  // Action methods
  const voteLive = useCallback(
    (songId: string) => {
      sendMessage({ type: 'VOTE_LIVE', songId, userId });
    },
    [sendMessage, userId]
  );

  const updateRanking = useCallback(
    (songIds: string[]) => {
      sendMessage({ type: 'UPDATE_RANKING', songIds, userId });
    },
    [sendMessage, userId]
  );

  const setAttendance = useCallback(
    (attendance: 'in_person' | 'virtual') => {
      sendMessage({ type: 'SET_ATTENDANCE', userId, attendance });
    },
    [sendMessage, userId]
  );

  // Admin action methods
  const adminToggleVoting = useCallback(
    (open: boolean) => {
      sendMessage({ type: 'ADMIN_TOGGLE_VOTING', open });
    },
    [sendMessage]
  );

  const adminSetMode = useCallback(
    (mode: ShowMode) => {
      sendMessage({ type: 'ADMIN_SET_MODE', mode });
    },
    [sendMessage]
  );

  const adminSetPlaying = useCallback(
    (songId: string) => {
      sendMessage({ type: 'ADMIN_SET_PLAYING', songId });
    },
    [sendMessage]
  );

  const adminFinishPlaying = useCallback(
    (songId: string) => {
      sendMessage({ type: 'ADMIN_FINISH_PLAYING', songId });
    },
    [sendMessage]
  );

  const adminSelectWinnerAndPlay = useCallback(
    (songId: string) => {
      sendMessage({ type: 'ADMIN_SELECT_WINNER_AND_PLAY', songId });
    },
    [sendMessage]
  );

  const adminCrowdRequest = useCallback(
    (songId: string) => {
      sendMessage({ type: 'ADMIN_CROWD_REQUEST', songId });
    },
    [sendMessage]
  );

  const adminUpdateLocation = useCallback(
    (locationUrl: string, locationName?: string) => {
      sendMessage({ type: 'ADMIN_UPDATE_LOCATION', locationUrl, locationName });
    },
    [sendMessage]
  );

  const adminUpdateStreams = useCallback(
    (liveStreams: any) => {
      sendMessage({ type: 'ADMIN_UPDATE_STREAMS', liveStreams });
    },
    [sendMessage]
  );

  const adminUpdateSocials = useCallback(
    (socialLinks: any) => {
      sendMessage({ type: 'ADMIN_UPDATE_SOCIALS', socialLinks });
    },
    [sendMessage]
  );

  const adminResetVotes = useCallback(() => {
    sendMessage({ type: 'ADMIN_RESET_VOTES' });
  }, [sendMessage]);

  const adminAddSong = useCallback(
    (title: string, artist: string, albumOrYear: string, coverUrl?: string, tempo?: string) => {
      sendMessage({ type: 'ADMIN_ADD_SONG', title, artist, albumOrYear, coverUrl, tempo });
    },
    [sendMessage]
  );

  const adminRemoveSong = useCallback(
    (songId: string) => {
      sendMessage({ type: 'ADMIN_REMOVE_SONG', songId });
    },
    [sendMessage]
  );

  const adminSetMessage = useCallback(
    (message: string) => {
      sendMessage({ type: 'ADMIN_SET_MESSAGE', message });
    },
    [sendMessage]
  );

  const adminSimulateVotes = useCallback(
    (count: number = 10) => {
      sendMessage({ type: 'ADMIN_SIMULATE_VOTES', count });
    },
    [sendMessage]
  );

  const adminUpdateSongs = useCallback(
    (songs: any[]) => {
      sendMessage({ type: 'ADMIN_UPDATE_SONGS', songs });
    },
    [sendMessage]
  );

  const dismissCelebration = useCallback(() => {
    setWinnerCelebration(null);
  }, []);

  return {
    userId,
    state,
    isConnected,
    winnerCelebration,
    dismissCelebration,
    voteLive,
    updateRanking,
    setAttendance,
    adminActions: {
      toggleVoting: adminToggleVoting,
      setMode: adminSetMode,
      setPlaying: adminSetPlaying,
      finishPlaying: adminFinishPlaying,
      selectWinnerAndPlay: adminSelectWinnerAndPlay,
      crowdRequest: adminCrowdRequest,
      updateLocation: adminUpdateLocation,
      updateStreams: adminUpdateStreams,
      updateSocials: adminUpdateSocials,
      resetVotes: adminResetVotes,
      addSong: adminAddSong,
      removeSong: adminRemoveSong,
      updateSongs: adminUpdateSongs,
      setMessage: adminSetMessage,
      simulateVotes: adminSimulateVotes,
    },
  };
}

