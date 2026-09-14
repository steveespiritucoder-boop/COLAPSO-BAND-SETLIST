export type ShowMode = 'live_next_song' | 'full_setlist_ranked';

export type SongStatus = 'unplayed' | 'playing' | 'played';

export interface Song {
  id: string;
  title: string;
  artist: string;
  albumOrYear: string;
  coverUrl: string;
  tempo?: string;
  notes?: string;
  status: SongStatus;
  order: number; // default order in setlist
  playedRound?: number;
  isCrowdRequest?: boolean; // Special marker: Pedido del Público
}

export interface LiveSongVoteResult {
  songId: string;
  title: string;
  artist: string;
  albumOrYear: string;
  coverUrl: string;
  tempo?: string;
  status: SongStatus;
  voteCount: number;
  percentage: number;
  rank: number;
  isCrowdRequest?: boolean;
}

export interface CascadeRankedSongResult {
  position: number; // 1-based (1, 2, 3...)
  song: Song;
  winningVotesForThisPosition: number;
  explanation: string;
  userVotePosition?: number;
}

export interface WinnerAnnouncement {
  songId: string;
  title: string;
  artist: string;
  voteCount: number;
  round: number;
  timestamp: number;
  isCrowdRequest?: boolean;
}

export interface SocialLinks {
  instagram: string;
  spotify: string;
  tiktok: string;
  facebook: string;
  youtube: string;
  whatsapp?: string;
  phone?: string;
}

export interface LiveStreams {
  tiktokLive?: string;
  facebookLive?: string;
  youtubeLive?: string;
  isLiveActive: boolean;
}

export type AttendanceType = 'in_person' | 'virtual';

export interface AttendanceStats {
  inPerson: number;
  virtual: number;
}

export interface ShowState {
  bandName: string;
  activeMode: ShowMode;
  votingOpen: boolean;
  roundNumber: number;
  currentPlayingSongId: string | null;
  songs: Song[];
  liveVotes: Record<string, string>; // userId -> songId
  rankedSetlistVotes: Record<string, string[]>;
  connectedClients: number;
  totalFansVoted: number;
  lastWinner: WinnerAnnouncement | null;
  tickerMessage: string;
  socialLinks: SocialLinks;
  liveStreams: LiveStreams;
  locationUrl?: string;
  locationName?: string;
  attendances?: Record<string, AttendanceType>; // userId -> in_person | virtual
  lastSupabaseSync?: number;
}

export type WebSocketClientMessage =
  | { type: 'VOTE_LIVE'; songId: string; userId: string }
  | { type: 'SET_ATTENDANCE'; userId: string; attendance: AttendanceType }
  | { type: 'UPDATE_RANKING'; songIds: string[]; userId: string }
  | { type: 'REGISTER_USER'; userId: string; name?: string }
  | { type: 'ADMIN_TOGGLE_VOTING'; open: boolean }
  | { type: 'ADMIN_SET_MODE'; mode: ShowMode }
  | { type: 'ADMIN_SET_PLAYING'; songId: string }
  | { type: 'ADMIN_FINISH_PLAYING'; songId: string }
  | { type: 'ADMIN_SELECT_WINNER_AND_PLAY'; songId: string }
  | { type: 'ADMIN_CROWD_REQUEST'; songId: string }
  | { type: 'ADMIN_UPDATE_LOCATION'; locationUrl: string; locationName?: string }
  | { type: 'ADMIN_UPDATE_STREAMS'; liveStreams: LiveStreams }
  | { type: 'ADMIN_UPDATE_SOCIALS'; socialLinks: SocialLinks }
  | { type: 'ADMIN_RESET_VOTES' }
  | { type: 'ADMIN_ADD_SONG'; title: string; artist: string; albumOrYear?: string; coverUrl?: string; tempo?: string }
  | { type: 'ADMIN_EDIT_SONG'; songId: string; title: string; artist: string; coverUrl?: string }
  | { type: 'ADMIN_REMOVE_SONG'; songId: string }
  | { type: 'ADMIN_SET_MESSAGE'; message: string }
  | { type: 'ADMIN_SIMULATE_VOTES'; count: number }
  | { type: 'ADMIN_UPDATE_SONGS'; songs: Song[] }
  | { type: 'ADMIN_SORT_SONGS'; direction: 'asc' | 'desc' | 'poster' }
  | { type: 'ADMIN_INVERT_SONGS_ORDER' };

export type WebSocketServerMessage =
  | { type: 'INIT_STATE'; state: ShowState; yourUserId: string }
  | { type: 'STATE_UPDATE'; state: ShowState }
  | { type: 'WINNER_CELEBRATION'; winner: WinnerAnnouncement }
  | { type: 'SUPABASE_SYNC_STATUS'; success: boolean; timestamp: number };

