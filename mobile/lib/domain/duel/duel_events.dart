import 'territory_map.dart';
import '../question/quiz_question.dart';

/// Evenimentele contractului Socket.IO din `backend/realtime/EVENTS.md`,
/// traduse în tipuri pe care le poate consuma restul aplicației.
sealed class DuelEvent {
  const DuelEvent();
}

class DuelSessionReady extends DuelEvent {
  const DuelSessionReady(this.userId, {this.activeMatchId});

  final String userId;

  /// Partida în care jucătorul își păstrează locul după o deconectare.
  /// Când e setată, clientul nu mai intră în coadă: serverul îl repune singur.
  final String? activeMatchId;
}

class DuelQueued extends DuelEvent {
  const DuelQueued();
}

class DuelLeftQueue extends DuelEvent {
  const DuelLeftQueue();
}

/// De ce a refuzat serverul intrarea în coadă (`matchmaking:rejected`).
enum DuelRejectionReason {
  /// Emailul nu e confirmat — se rezolvă cu un link nou.
  emailNotVerified,

  /// Contul e restricționat din alt motiv; aplicația nu poate face nimic.
  accountRestricted,
}

/// Serverul a refuzat intrarea în coadă. Jucătorul **nu** așteaptă un adversar.
class DuelQueueRejected extends DuelEvent {
  const DuelQueueRejected(this.reason);

  final DuelRejectionReason reason;
}

class DuelMatchFound extends DuelEvent {
  const DuelMatchFound({
    required this.matchId,
    required this.totalRounds,
    required this.playerIds,
  });

  final String matchId;
  final int totalRounds;
  final List<String> playerIds;
}

class DuelRoundStarted extends DuelEvent {
  const DuelRoundStarted({
    required this.matchId,
    required this.roundNumber,
    required this.totalRounds,
    required this.deadline,
    required this.question,
  });

  final String matchId;
  final int roundNumber;
  final int totalRounds;
  final DateTime deadline;
  final QuizQuestion question;
}

class DuelAnswerAccepted extends DuelEvent {
  const DuelAnswerAccepted();
}

/// Scorul unui jucător după închiderea unei runde.
class DuelPlayerScore {
  const DuelPlayerScore({
    required this.userId,
    required this.score,
    required this.territoriesWon,
    required this.isCorrect,
    this.answer,
    this.responseTimeMs,
  });

  final String userId;
  final int score;
  final int territoriesWon;
  final bool isCorrect;
  final String? answer;
  final int? responseTimeMs;
}

/// Serverul a acceptat ținta declarată. Confirmarea vine doar la atacator.
class DuelAttackDeclared extends DuelEvent {
  const DuelAttackDeclared(this.territoryId);

  final String territoryId;
}

class DuelRoundResult extends DuelEvent {
  const DuelRoundResult({
    required this.roundNumber,
    required this.totalRounds,
    required this.correctAnswer,
    required this.players,
    this.territory,
    this.eliminatedUserIds = const [],
  });

  final int roundNumber;
  final int totalRounds;
  final String correctAnswer;
  final List<DuelPlayerScore> players;

  /// Proprietatea asupra teritoriilor. Absentă la Duo, care n-are hartă.
  final TerritoryOwnership? territory;

  /// Jucătorii care tocmai au trecut în mod spectator (§12.6).
  final List<String> eliminatedUserIds;
}

enum DuelOutcome { win, loss, draw }

class DuelFinalScore {
  const DuelFinalScore({
    required this.userId,
    required this.score,
    required this.territoriesWon,
    required this.outcome,
  });

  final String userId;
  final int score;
  final int territoriesWon;
  final DuelOutcome outcome;
}

class DuelMatchFinished extends DuelEvent {
  const DuelMatchFinished({
    required this.matchId,
    required this.roundsPlayed,
    required this.players,
    this.endedByForfeit = false,
  });

  final String matchId;
  final int roundsPlayed;
  final List<DuelFinalScore> players;

  /// Partida s-a închis pentru că un jucător nu s-a mai reconectat.
  final bool endedByForfeit;
}

/// Partida a intrat în pauză pentru că un jucător a pierdut conexiunea.
/// Locul îi rămâne rezervat până la `resumeDeadline`.
class DuelMatchPaused extends DuelEvent {
  const DuelMatchPaused({
    required this.disconnectedUserId,
    required this.resumeDeadline,
  });

  final String disconnectedUserId;
  final DateTime resumeDeadline;
}

/// Toți jucătorii sunt din nou conectați; cronometrul repornește de la
/// `deadline`, care include deja timpul petrecut în pauză.
class DuelMatchResumed extends DuelEvent {
  const DuelMatchResumed({
    required this.reconnectedUserId,
    required this.deadline,
  });

  final String reconnectedUserId;
  final DateTime deadline;
}

/// Starea unui jucător în instantaneul de reconectare. Conține doar *dacă* a
/// răspuns, niciodată *ce* a răspuns.
class DuelPlayerSnapshot {
  const DuelPlayerSnapshot({
    required this.userId,
    required this.score,
    required this.territoriesWon,
    required this.hasAnswered,
    required this.connected,
  });

  final String userId;
  final int score;
  final int territoriesWon;
  final bool hasAnswered;
  final bool connected;
}

/// Instantaneul complet primit la revenirea în partidă.
class DuelMatchSnapshot extends DuelEvent {
  const DuelMatchSnapshot({
    required this.matchId,
    required this.isPaused,
    required this.roundNumber,
    required this.totalRounds,
    required this.deadline,
    required this.question,
    required this.players,
    this.resumeDeadline,
    this.territoryMap,
    this.territory,
  });

  final String matchId;
  final bool isPaused;
  final int roundNumber;
  final int totalRounds;
  final DateTime deadline;
  final DateTime? resumeDeadline;
  final QuizQuestion question;
  final List<DuelPlayerSnapshot> players;

  /// Harta întreagă; vine doar în snapshot, fiind imuabilă pe toată partida.
  final TerritoryMap? territoryMap;
  final TerritoryOwnership? territory;
}

enum DuelChatMessageKind { text, reaction }

class DuelChatMessage {
  const DuelChatMessage({
    required this.id,
    required this.matchId,
    required this.senderId,
    required this.senderName,
    required this.content,
    required this.kind,
    required this.createdAt,
  });

  final String id;
  final String matchId;
  final String senderId;
  final String senderName;
  final String content;
  final DuelChatMessageKind kind;
  final DateTime createdAt;
}

/// Istoricul efemer și dreptul decis de server pentru chatul partidei.
class DuelMatchChatHistory extends DuelEvent {
  const DuelMatchChatHistory({
    required this.matchId,
    required this.canSendText,
    required this.messages,
  });

  final String matchId;
  final bool canSendText;
  final List<DuelChatMessage> messages;
}

class DuelMatchChatMessageReceived extends DuelEvent {
  const DuelMatchChatMessageReceived(this.message);

  final DuelChatMessage message;
}

class DuelMatchChatRejected extends DuelEvent {
  const DuelMatchChatRejected({required this.matchId, required this.reason});

  final String matchId;
  final String reason;
}

/// Eroare raportată de server (`server:error` sau `match:error`).
class DuelServerError extends DuelEvent {
  const DuelServerError(this.message);

  final String message;
}

class DuelDisconnected extends DuelEvent {
  const DuelDisconnected();
}
