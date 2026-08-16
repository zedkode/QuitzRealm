export const MIN_MATCH_PLAYERS = 2;
export const MAX_MATCH_PLAYERS = 8;

export type ClientMatchMode = 'duo' | 'classic';
export type PersistedMatchMode = 'DUO' | 'CLASSIC';
export type MatchLobbyType = 'public';
export type MatchResolutionPolicy = 'all-answered' | 'deadline';

/**
 * Configurația imuabilă a unei partide. Motorul lucrează cu acest contract,
 * nu cu presupunerea că orice listă de participanți are exact două elemente.
 */
export interface MatchProfile {
  clientMode: ClientMatchMode;
  persistedMode: PersistedMatchMode;
  playerCountTarget: number;
  lobbyType: MatchLobbyType;
  resolutionPolicy: MatchResolutionPolicy;
}

export const DUO_MATCH_PROFILE: MatchProfile = Object.freeze({
  clientMode: 'duo',
  persistedMode: 'DUO',
  playerCountTarget: 2,
  lobbyType: 'public',
  resolutionPolicy: 'all-answered',
});

export function publicMatchProfile(
  mode: ClientMatchMode,
  requestedPlayerCount?: number,
): MatchProfile {
  if (mode === 'duo') {
    if (requestedPlayerCount !== undefined && requestedPlayerCount !== 2) {
      throw new Error('Modul Duo necesită exact 2 jucători.');
    }
    return DUO_MATCH_PROFILE;
  }

  if (
    requestedPlayerCount === undefined ||
    !Number.isInteger(requestedPlayerCount) ||
    requestedPlayerCount < 4 ||
    requestedPlayerCount > MAX_MATCH_PLAYERS
  ) {
    throw new Error('Modul Clasic public necesită între 4 și 8 jucători.');
  }

  return Object.freeze({
    clientMode: 'classic',
    persistedMode: 'CLASSIC',
    playerCountTarget: requestedPlayerCount,
    lobbyType: 'public',
    resolutionPolicy: 'deadline',
  });
}

export function assertMatchParticipants(
  userIds: string[],
  profile: MatchProfile,
): void {
  if (
    profile.playerCountTarget < MIN_MATCH_PLAYERS ||
    profile.playerCountTarget > MAX_MATCH_PLAYERS
  ) {
    throw new Error('Motorul acceptă între 2 și 8 participanți.');
  }
  if (userIds.length !== profile.playerCountTarget) {
    throw new Error(
      `Partida necesită ${profile.playerCountTarget} participanți, nu ${userIds.length}.`,
    );
  }
  if (new Set(userIds).size !== userIds.length) {
    throw new Error('Participanții unei partide trebuie să fie unici.');
  }
}
