import { Song, CascadeRankedSongResult, LiveSongVoteResult } from '../types';

/**
 * Calculates live round voting results (Idea 2).
 * Formats vote counts, percentages, and ranks for remaining songs.
 */
export function calculateLiveVoteResults(
  songs: Song[],
  liveVotes: Record<string, string>,
  currentPlayingSongId: string | null
): {
  activeSongs: LiveSongVoteResult[];
  playedSongs: Song[];
  currentlyPlayingSong: Song | null;
  totalVotes: number;
} {
  const currentPlaying = songs.find((s) => s.id === currentPlayingSongId && s.status === 'playing') || null;
  const played = songs.filter((s) => s.status === 'played');
  // Available to vote on: songs that are unplayed and not currently on stage
  const eligibleSongs = songs.filter(
    (s) => s.status === 'unplayed' && s.id !== currentPlayingSongId
  );

  // Count votes
  const counts: Record<string, number> = {};
  eligibleSongs.forEach((s) => {
    counts[s.id] = 0;
  });

  let totalVotes = 0;
  Object.values(liveVotes).forEach((songId) => {
    if (counts[songId] !== undefined) {
      counts[songId] += 1;
      totalVotes += 1;
    }
  });

  // Map to results and sort descending
  const activeSongs: LiveSongVoteResult[] = eligibleSongs
    .map((song) => {
      const voteCount = counts[song.id] || 0;
      const percentage = totalVotes > 0 ? Math.round((voteCount / totalVotes) * 100) : 0;
      return {
        songId: song.id,
        title: song.title,
        artist: song.artist,
        albumOrYear: song.albumOrYear,
        coverUrl: song.coverUrl,
        tempo: song.tempo,
        status: song.status,
        voteCount,
        percentage,
        rank: 1, // Will be set after sorting
        isCrowdRequest: song.isCrowdRequest,
      };
    })
    .sort((a, b) => {
      if (b.voteCount !== a.voteCount) {
        return b.voteCount - a.voteCount;
      }
      return a.title.localeCompare(b.title);
    })
    .map((item, index) => ({
      ...item,
      rank: index + 1,
    }));

  return {
    activeSongs,
    playedSongs: played,
    currentlyPlayingSong: currentPlaying,
    totalVotes,
  };
}

/**
 * Positional Cascade Elimination Algorithm (Idea 1).
 * Resolves full setlist ranking without duplicate winners.
 * 
 * Each user orders songs from position 1 to N.
 * For position 1, the song with most #1 votes wins and is locked in.
 * For position 2, that winner is excluded, and the most voted among remaining songs wins.
 * And so forth until all songs are uniquely ordered.
 */
export function calculateCascadeSetlist(
  songs: Song[],
  rankedVotes: Record<string, string[]>,
  currentUserId?: string
): CascadeRankedSongResult[] {
  const n = songs.length;
  if (n === 0) return [];

  const songMap = new Map<string, Song>();
  songs.forEach((s) => songMap.set(s.id, s));

  const ballots = Object.values(rankedVotes).filter(
    (ballot) => Array.isArray(ballot) && ballot.length > 0
  );

  // Precompute Borda score (position weights) for tiebreaking:
  // rank 0 gets N points, rank 1 gets N-1 points, etc.
  const bordaScores: Record<string, number> = {};
  songs.forEach((s) => {
    bordaScores[s.id] = 0;
  });

  ballots.forEach((ballot) => {
    ballot.forEach((songId, index) => {
      if (bordaScores[songId] !== undefined) {
        bordaScores[songId] += Math.max(0, n - index);
      }
    });
  });

  const currentUserBallot = currentUserId && rankedVotes[currentUserId]
    ? rankedVotes[currentUserId]
    : null;

  const assignedSongIds = new Set<string>();
  const result: CascadeRankedSongResult[] = [];

  for (let pos = 0; pos < n; pos++) {
    // Collect remaining candidates
    const remaining = songs.filter((s) => !assignedSongIds.has(s.id));
    if (remaining.length === 0) break;

    // Count how many voters placed each remaining song at this exact position 'pos'
    const positionVotes: Record<string, number> = {};
    remaining.forEach((s) => {
      positionVotes[s.id] = 0;
    });

    ballots.forEach((ballot) => {
      const chosenSongId = ballot[pos];
      if (chosenSongId && positionVotes[chosenSongId] !== undefined) {
        positionVotes[chosenSongId] += 1;
      }
    });

    // Pick top song for this position
    remaining.sort((a, b) => {
      const votesA = positionVotes[a.id] || 0;
      const votesB = positionVotes[b.id] || 0;
      if (votesB !== votesA) {
        return votesB - votesA;
      }
      // Tie breaker 1: overall Borda points across all positions
      const bordaA = bordaScores[a.id] || 0;
      const bordaB = bordaScores[b.id] || 0;
      if (bordaB !== bordaA) {
        return bordaB - bordaA;
      }
      // Tie breaker 2: default original order
      return a.order - b.order;
    });

    const winner = remaining[0];
    assignedSongIds.add(winner.id);

    const winningVotes = positionVotes[winner.id] || 0;
    let explanation = '';
    if (ballots.length === 0) {
      explanation = 'Orden original por defecto';
    } else if (winningVotes > 0) {
      explanation = `${winningVotes} ${winningVotes === 1 ? 'voto directo' : 'votos directos'} para esta posición`;
    } else {
      explanation = 'Asignada por preferencia colectiva ponderada (Borda)';
    }

    // User's personal vote for this song
    let userVotePosition: number | undefined = undefined;
    if (currentUserBallot) {
      const userIdx = currentUserBallot.indexOf(winner.id);
      if (userIdx !== -1) {
        userVotePosition = userIdx + 1; // 1-based index (e.g. 5)
      }
    }

    result.push({
      position: pos + 1,
      song: winner,
      winningVotesForThisPosition: winningVotes,
      explanation,
      userVotePosition,
    });
  }

  return result;
}
