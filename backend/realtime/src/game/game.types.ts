import {
  ClientMatchMode,
  MatchLobbyType,
  MatchResolutionPolicy,
  PersistedMatchMode,
} from './match-profile';

export type RealtimeQuestionType = 'MULTIPLE_CHOICE' | 'NUMERIC';

export interface InternalQuestion {
  id: string;
  type: RealtimeQuestionType;
  categoryId: string;
  difficulty: number;
  text: string;
  options: string[] | null;
  correctAnswer: string;
  language: string;
}

export type PublicQuestion = Omit<InternalQuestion, 'correctAnswer'>;

export interface PlayerAnswer {
  value: string;
  responseTimeMs: number;
  isCorrect: boolean;
}

export interface MatchPlayerState {
  userId: string;
  socketId: string;
  score: number;
  territoriesWon: number;
  /** Raspunsuri corecte in partida; alimenteaza treptele de incredere (2.5). */
  correctAnswers: number;
  answer?: PlayerAnswer;
  /** Momentul deconectării, cât timp jucătorul lipsește din partidă. */
  disconnectedAt?: string;
}

export interface MatchState {
  id: string;
  mode: PersistedMatchMode;
  playerCountTarget: number;
  lobbyType: MatchLobbyType;
  resolutionPolicy: MatchResolutionPolicy;
  status: 'active' | 'paused' | 'finished' | 'persistence_failed';
  mapId: string;
  roundNumber: number;
  totalRounds: number;
  /** Momentul începerii partidei; folosit la persistare. */
  startedAt: string;
  /** Momentul începerii rundei curente; baza pentru timpul de răspuns. */
  roundStartedAt: string;
  deadlineAt: string;
  /** Momentul intrării în pauză de reconectare; absent cât timp partida curge. */
  pausedAt?: string;
  /** Termenul până la care jucătorul deconectat își păstrează locul. */
  resumeDeadlineAt?: string;
  question: InternalQuestion;
  /** Harta de teritorii; absentă la Duo, care nu are hartă de disputat. */
  territory?: MatchTerritoryState;
  /** Jucătorii scoși din faza activă, în ordinea eliminării (§12.6). */
  eliminated?: Array<{ userId: string; roundNumber: number }>;
  /** Cuceririle din runda tocmai încheiată, pentru animația din client. */
  lastConquests?: Array<{
    territoryId: string;
    winnerId: string;
    previousOwnerId: string | null;
  }>;
  /** Întrebările deja folosite, ca o partidă să nu repete aceeași întrebare. */
  /// Categoriile din care se trag întrebările. Lista goală = toate.
  /// Se fixează la crearea partidei și nu se mai schimbă: altfel runda 4 ar
  /// putea veni din alt domeniu decât cel pe care l-au acceptat jucătorii.
  categoryCodes: string[];
  usedQuestionIds: string[];
  players: MatchPlayerState[];
}

/// Cum s-a terminat partida: după toate rundele sau prin abandon.
export type MatchEndReason = 'rounds' | 'forfeit';

/// Starea completă trimisă unui jucător care revine în partidă. Nu conține
/// niciodată răspunsul corect sau răspunsul adversarului la runda în curs.
export interface MatchSnapshotPayload {
  matchId: string;
  mode: ClientMatchMode;
  playerCountTarget: number;
  lobbyType: MatchLobbyType;
  status: 'active' | 'paused';
  roundNumber: number;
  totalRounds: number;
  /** Harta completă, trimisă la reconectare ca ecranul să se poată reconstrui. */
  territoryMap?: import('./territory-map').TerritoryMap;
  territory?: TerritorySnapshot;
  deadlineAt: string;
  resumeDeadlineAt: string | null;
  question: PublicQuestion;
  players: Array<{
    userId: string;
    score: number;
    territoriesWon: number;
    hasAnswered: boolean;
    connected: boolean;
  }>;
}

/**
 * Harta și proprietatea, prezente doar la modul Clasic. Duo rămâne pe scorul
 * simplu: are doi jucători și nicio hartă de disputat.
 */
export interface MatchTerritoryState {
  map: import('./territory-map').TerritoryMap;
  ownership: import('./territory-state').TerritoryOwnership;
  /** Teritoriul liber pus în joc în runda curentă; `null` în faza de luptă. */
  contestedTerritoryId: string | null;
  /** Țintele declarate în runda de luptă curentă: `userId → territoryId`. */
  attacks?: Record<string, string>;
}

export interface PersistMatchPayload {
  mode: PersistedMatchMode;
  mapId: string;
  startedAt: string;
  endedAt: string;
  players: Array<{
    userId: string;
    territoriesWon: number;
    score: number;
    correctAnswers: number;
    result: 'WIN' | 'LOSS' | 'DRAW';
  }>;
}

export interface MatchFinishedPayload {
  matchId: string;
  roundsPlayed: number;
  endedBy: MatchEndReason;
  players: PersistMatchPayload['players'];
}

/** Fotografia hărții trimisă clientului. Clientul doar o desenează. */
export interface TerritorySnapshot {
  ownership: Record<string, string | null>;
  contestedTerritoryId: string | null;
}

export interface RoundResultPayload {
  matchId: string;
  roundNumber: number;
  totalRounds: number;
  /** Absent la Duo, care nu are hartă. */
  territory?: TerritorySnapshot;
  /** Jucătorii eliminați în runda aceasta; trec în mod spectator (§12.6). */
  eliminatedUserIds?: string[];
  /** Teritoriile care au schimbat stăpânul în urma atacurilor. */
  conquests?: Array<{
    territoryId: string;
    winnerId: string;
    previousOwnerId: string | null;
  }>;
  /** Răspunsul corect, dezvăluit abia după închiderea rundei. */
  correctAnswer: string;
  players: Array<{
    userId: string;
    score: number;
    territoriesWon: number;
    isCorrect: boolean;
    answer: string | null;
    responseTimeMs: number | null;
  }>;
}

/// Oglinda lui `AccountCapabilities` din `backend/api`. Se citește prin
/// endpointul intern; realtime nu deschide niciodată baza de date direct.
export interface AccountCapabilities {
  emailVerified: boolean;
  isMinor: boolean;
  canPlayRanked: boolean;
  canUseGlobalChat: boolean;
  canPostExternalLinks: boolean;
  dmPermissionLocked: boolean;
}

/// Contextul de chat global, citit din API înainte de a lăsa un mesaj să plece.
export interface GlobalChatContext {
  displayName: string;
  globalChat: 'reactions' | 'ownMatches' | 'public';
  canPostLinksInGlobal: boolean;
  tier: number;
  mutedUntil: string | null;
  /// Perechile blocate în ambele sensuri; realtime nu livrează între ele.
  blockedUserIds: string[];
}

/// Mesajul persistent, așa cum îl întoarce API-ul după ce l-a acceptat.
export interface StoredChatMessage {
  id: string;
  conversationId: string;
  scope: 'FRIEND' | 'DM';
  senderId: string;
  content: string;
  createdAt: string;
  recipientIds: string[];
}
