import 'dart:async';

import 'package:flutter_riverpod/flutter_riverpod.dart';

import '../../core/network/realtime_client.dart';
import '../../core/providers/repository_providers.dart';
import '../../domain/duel/duel_events.dart';
import '../../domain/duel/duel_standing.dart';
import '../../domain/duel/territory_map.dart';
import '../../domain/duel/match_preferences.dart';
import '../../domain/question/quiz_question.dart';

enum DuelPhase {
  idle,
  connecting,
  searching,
  roundActive,
  waitingOpponent,
  roundRevealed,

  /// Ne-am pierdut conexiunea în timpul unei partide. Locul e păstrat de
  /// server, deci așteptăm revenirea, nu abandonăm.
  reconnecting,

  /// Serverul a refuzat coada: contul n-are dreptul să joace ranked.
  blocked,
  finished,
  disconnected,
  unauthenticated,
  error,
}

class DuelState {
  const DuelState({
    this.phase = DuelPhase.idle,
    this.myUserId,
    this.opponentId,
    this.matchId,
    this.roundNumber = 0,
    this.totalRounds = 0,
    this.question,
    this.secondsLeft = 0,
    this.roundSeconds = 1,
    this.selectedAnswer,
    this.lastResult,
    this.lastTerritoryGain = 0,
    this.myPoints = 0,
    this.opponentPoints = 0,
    this.myTerritories = 0,
    this.opponentTerritories = 0,
    this.finalScores = const [],
    this.standings = const [],
    this.territoryMap,
    this.territory,
    this.spectatorUserIds = const [],
    this.declaredTargetId,
    this.errorMessage,
    this.isPaused = false,
    this.missingUserId,
    this.resumeDeadline,
    this.resumeSecondsLeft = 0,
    this.endedByForfeit = false,
    this.rejectionReason,
    this.chatMessages = const [],
    this.canSendChatText = false,
    this.chatErrorReason,
  });

  final DuelPhase phase;
  final String? myUserId;
  final String? opponentId;
  final String? matchId;
  final int roundNumber;
  final int totalRounds;
  final QuizQuestion? question;
  final int secondsLeft;
  final int roundSeconds;
  final String? selectedAnswer;
  final DuelRoundResult? lastResult;

  /// Câte teritorii ai câștigat în runda tocmai încheiată (0 sau 1).
  final int lastTerritoryGain;

  /// Scorul cumulat al partidei; rămâne pe ecran și în timpul rundei noi.
  final int myPoints;
  final int opponentPoints;
  final int myTerritories;
  final int opponentTerritories;
  final List<DuelFinalScore> finalScores;

  /// Clasamentul complet al partidei, ordonat. La duel are două intrări; la
  /// Clasic, între patru și opt. `myPoints`/`opponentPoints` rămân pentru
  /// afișajul 1v1, dar aici e adevărul întreg.
  final List<DuelStanding> standings;

  /// Harta partidei; `null` la Duo, care nu are hartă.
  final TerritoryMap? territoryMap;
  final TerritoryOwnership? territory;

  /// Jucătorii trecuți în mod spectator (§12.6).
  final List<String> spectatorUserIds;

  /// Ținta mea de atac, confirmată de server pentru runda curentă.
  final String? declaredTargetId;

  /// Teritoriile pe care le pot ataca acum. Gol în faza de capturare.
  List<String> get attackableTerritories {
    final map = territoryMap;
    final ownership = territory;
    final userId = myUserId;
    if (map == null || ownership == null || userId == null) return const [];
    if (!ownership.isBattlePhase) return const [];
    return ownership.attackableBy(map, userId);
  }

  /// Eu am fost eliminat: pot vedea partida, dar nu mai pot răspunde.
  bool get amSpectator =>
      myUserId != null && spectatorUserIds.contains(myUserId);

  final String? errorMessage;

  /// Partida are mai mulți jucători decât un duel.
  bool get isMultiplayer => standings.length > 2;

  /// Locul meu în clasament, numărat de la 1. `null` până există clasament.
  int? get myPosition {
    for (var index = 0; index < standings.length; index++) {
      if (standings[index].userId == myUserId) return index + 1;
    }
    return null;
  }

  /// Partida e oprită pentru că un jucător s-a deconectat. Cronometrul stă,
  /// serverul refuză răspunsuri, iar locul celui lipsă e rezervat.
  final bool isPaused;
  final String? missingUserId;
  final DateTime? resumeDeadline;

  /// Secundele rămase din fereastra de revenire, numărate în jos.
  final int resumeSecondsLeft;

  /// Partida s-a încheiat prin abandon, nu după consumarea rundelor.
  final bool endedByForfeit;

  /// De ce a refuzat serverul coada, când `phase == DuelPhase.blocked`.
  final DuelRejectionReason? rejectionReason;
  final List<DuelChatMessage> chatMessages;
  final bool canSendChatText;
  final String? chatErrorReason;

  /// Adversarul lipsește; noi suntem încă în partidă.
  bool get opponentMissing => isPaused && missingUserId != myUserId;

  /// Se poate răspunde doar într-o rundă activă, nepusă pe pauză.
  bool get canAnswer => phase == DuelPhase.roundActive && !isPaused;

  DuelPlayerScore? get myScore => _scoreFor(myUserId);

  DuelPlayerScore? get opponentScore => _scoreFor(opponentId);

  DuelPlayerScore? _scoreFor(String? userId) {
    final result = lastResult;
    if (result == null || userId == null) return null;
    for (final player in result.players) {
      if (player.userId == userId) return player;
    }
    return null;
  }

  DuelFinalScore? get myFinalScore {
    for (final player in finalScores) {
      if (player.userId == myUserId) return player;
    }
    return null;
  }

  DuelFinalScore? get opponentFinalScore {
    for (final player in finalScores) {
      if (player.userId != myUserId) return player;
    }
    return null;
  }

  DuelState copyWith({
    DuelPhase? phase,
    String? myUserId,
    String? opponentId,
    String? matchId,
    int? roundNumber,
    int? totalRounds,
    QuizQuestion? question,
    int? secondsLeft,
    int? roundSeconds,
    String? selectedAnswer,
    bool clearSelectedAnswer = false,
    DuelRoundResult? lastResult,
    bool clearLastResult = false,
    int? lastTerritoryGain,
    int? myPoints,
    int? opponentPoints,
    int? myTerritories,
    int? opponentTerritories,
    List<DuelFinalScore>? finalScores,
    List<DuelStanding>? standings,
    TerritoryMap? territoryMap,
    TerritoryOwnership? territory,
    List<String>? spectatorUserIds,
    String? declaredTargetId,
    bool clearDeclaredTarget = false,
    String? errorMessage,
    bool clearError = false,
    bool? isPaused,
    String? missingUserId,
    DateTime? resumeDeadline,
    int? resumeSecondsLeft,
    bool clearPause = false,
    bool? endedByForfeit,
    DuelRejectionReason? rejectionReason,
    List<DuelChatMessage>? chatMessages,
    bool? canSendChatText,
    String? chatErrorReason,
    bool clearChatError = false,
  }) {
    return DuelState(
      phase: phase ?? this.phase,
      myUserId: myUserId ?? this.myUserId,
      opponentId: opponentId ?? this.opponentId,
      matchId: matchId ?? this.matchId,
      roundNumber: roundNumber ?? this.roundNumber,
      totalRounds: totalRounds ?? this.totalRounds,
      question: question ?? this.question,
      secondsLeft: secondsLeft ?? this.secondsLeft,
      roundSeconds: roundSeconds ?? this.roundSeconds,
      selectedAnswer: clearSelectedAnswer
          ? null
          : selectedAnswer ?? this.selectedAnswer,
      lastResult: clearLastResult ? null : lastResult ?? this.lastResult,
      lastTerritoryGain: lastTerritoryGain ?? this.lastTerritoryGain,
      myPoints: myPoints ?? this.myPoints,
      opponentPoints: opponentPoints ?? this.opponentPoints,
      myTerritories: myTerritories ?? this.myTerritories,
      opponentTerritories: opponentTerritories ?? this.opponentTerritories,
      finalScores: finalScores ?? this.finalScores,
      standings: standings ?? this.standings,
      territoryMap: territoryMap ?? this.territoryMap,
      territory: territory ?? this.territory,
      spectatorUserIds: spectatorUserIds ?? this.spectatorUserIds,
      declaredTargetId: clearDeclaredTarget
          ? null
          : declaredTargetId ?? this.declaredTargetId,
      errorMessage: clearError ? null : errorMessage ?? this.errorMessage,
      isPaused: clearPause ? false : isPaused ?? this.isPaused,
      missingUserId: clearPause ? null : missingUserId ?? this.missingUserId,
      resumeDeadline: clearPause ? null : resumeDeadline ?? this.resumeDeadline,
      resumeSecondsLeft: clearPause
          ? 0
          : resumeSecondsLeft ?? this.resumeSecondsLeft,
      endedByForfeit: endedByForfeit ?? this.endedByForfeit,
      rejectionReason: rejectionReason ?? this.rejectionReason,
      chatMessages: chatMessages ?? this.chatMessages,
      canSendChatText: canSendChatText ?? this.canSendChatText,
      chatErrorReason: clearChatError
          ? null
          : chatErrorReason ?? this.chatErrorReason,
    );
  }
}

/// Ține starea unui duel 1v1. Serverul decide totul; controllerul doar
/// traduce evenimentele în ce vede jucătorul.
class DuelController extends StateNotifier<DuelState> {
  DuelController(this._client, {this.tick = const Duration(seconds: 1)})
    : super(const DuelState());

  final RealtimeClient _client;
  final Duration tick;

  StreamSubscription<DuelEvent>? _subscription;
  Timer? _timer;
  DateTime? _deadline;
  int _myTerritories = 0;

  /// Preferințele meciului curent. Se rețin pentru că intrarea în coadă are loc
  /// abia când serverul confirmă sesiunea, nu la apăsarea butonului.
  MatchPreferences _preferences = MatchPreferences.defaults;

  Future<void> start([MatchPreferences? preferences]) async {
    _myTerritories = 0;
    if (preferences != null) _preferences = preferences;
    state = const DuelState(phase: DuelPhase.connecting);
    _subscription ??= _client.events.listen(_onEvent);
    final connected = await _client.connect();
    if (!mounted) return;
    if (!connected) {
      state = const DuelState(phase: DuelPhase.unauthenticated);
    }
  }

  void submitAnswer(String answer) {
    final matchId = state.matchId;
    if (!state.canAnswer || matchId == null) return;
    final trimmed = answer.trim();
    if (trimmed.isEmpty) return;

    _client.sendAnswer(matchId: matchId, answer: trimmed);
    state = state.copyWith(
      phase: DuelPhase.waitingOpponent,
      selectedAnswer: trimmed,
    );
  }

  void sendChatMessage(String content) {
    final matchId = state.matchId;
    final trimmed = content.trim();
    if (matchId == null || !state.canSendChatText || trimmed.isEmpty) return;
    _client.sendMatchChat(matchId: matchId, content: trimmed);
    state = state.copyWith(clearChatError: true);
  }

  void sendChatReaction(String reaction) {
    final matchId = state.matchId;
    if (matchId == null) return;
    _client.sendMatchReaction(matchId: matchId, reaction: reaction);
    state = state.copyWith(clearChatError: true);
  }

  /// Trimite ținta de atac aleasă pe hartă.
  void declareAttack(String territoryId) {
    final matchId = state.matchId;
    if (matchId == null || state.amSpectator) return;
    if (!state.attackableTerritories.contains(territoryId)) return;
    _client.declareAttack(matchId: matchId, territoryId: territoryId);
  }

  Future<void> leave() async {
    _timer?.cancel();
    _client.leaveQueue();
    await _client.disconnect();
    if (mounted) state = const DuelState();
  }

  void _onEvent(DuelEvent event) {
    if (!mounted) return;
    switch (event) {
      case DuelSessionReady(:final userId, :final activeMatchId):
        if (activeMatchId != null) {
          // Avem o partidă în desfășurare: serverul ne repune singur în ea și
          // trimite instantaneul. A intra în coadă peste ea ar fi respins.
          state = state.copyWith(
            myUserId: userId,
            matchId: activeMatchId,
            phase: DuelPhase.reconnecting,
          );
          return;
        }
        state = state.copyWith(myUserId: userId, phase: DuelPhase.searching);
        _client.joinQueue(_preferences);
      case DuelQueued():
        state = state.copyWith(phase: DuelPhase.searching);
      case DuelLeftQueue():
        state = state.copyWith(phase: DuelPhase.idle);
      case DuelQueueRejected(:final reason):
        // Nu suntem în coadă și nu vom fi: nu lăsăm ecranul să caute la
        // nesfârșit un adversar care nu vine.
        _timer?.cancel();
        state = state.copyWith(
          phase: DuelPhase.blocked,
          rejectionReason: reason,
        );
      case DuelMatchFound(:final matchId, :final totalRounds, :final playerIds):
        final opponent = playerIds.firstWhere(
          (id) => id != state.myUserId,
          orElse: () => '',
        );
        state = state.copyWith(
          matchId: matchId,
          totalRounds: totalRounds,
          opponentId: opponent.isEmpty ? null : opponent,
        );
        _client.joinMatchChat(matchId);
      case DuelRoundStarted(
        :final roundNumber,
        :final totalRounds,
        :final deadline,
        :final question,
      ):
        _deadline = deadline;
        final seconds = _secondsToDeadline();
        state = state.copyWith(
          phase: DuelPhase.roundActive,
          roundNumber: roundNumber,
          totalRounds: totalRounds,
          question: question,
          secondsLeft: seconds,
          roundSeconds: seconds > 0 ? seconds : 1,
          clearSelectedAnswer: true,
          clearLastResult: true,
          clearError: true,
        );
        _startTimer();
      case DuelAnswerAccepted():
        if (state.phase == DuelPhase.roundActive) {
          state = state.copyWith(phase: DuelPhase.waitingOpponent);
        }
      case DuelAttackDeclared(:final territoryId):
        state = state.copyWith(declaredTargetId: territoryId);
      case DuelRoundResult():
        _timer?.cancel();
        // Scorurile din eveniment sunt cumulate, deci diferența față de runda
        // precedentă arată dacă tocmai ai cucerit un teritoriu.
        final mine = event.players
            .where((player) => player.userId == state.myUserId)
            .firstOrNull;
        final theirs = event.players
            .where((player) => player.userId != state.myUserId)
            .firstOrNull;
        final gain = (mine?.territoriesWon ?? 0) - _myTerritories;
        _myTerritories = mine?.territoriesWon ?? _myTerritories;
        state = state.copyWith(
          phase: DuelPhase.roundRevealed,
          lastResult: event,
          lastTerritoryGain: gain < 0 ? 0 : gain,
          myPoints: mine?.score ?? state.myPoints,
          opponentPoints: theirs?.score ?? state.opponentPoints,
          myTerritories: mine?.territoriesWon ?? state.myTerritories,
          opponentTerritories:
              theirs?.territoriesWon ?? state.opponentTerritories,
          // Clasamentul păstrează **toți** jucătorii, nu doar perechea de mai
          // sus: la Clasic, `theirs` e un singur adversar din mai mulți.
          standings: sortedStandings(
            event.players.map(
              (player) => DuelStanding(
                userId: player.userId,
                points: player.score,
                territories: player.territoriesWon,
              ),
            ),
          ),
          territory: event.territory,
          // Declarația nu se moștenește între runde pe server, n-are voie să
          // rămână nici pe ecran: ar arăta o țintă care nu mai e trimisă.
          clearDeclaredTarget: true,
          spectatorUserIds: event.eliminatedUserIds.isEmpty
              ? null
              : [...state.spectatorUserIds, ...event.eliminatedUserIds],
        );
      case DuelMatchFinished(:final players, :final endedByForfeit):
        _timer?.cancel();
        state = state.copyWith(
          phase: DuelPhase.finished,
          finalScores: players,
          clearPause: true,
          endedByForfeit: endedByForfeit,
        );
      case DuelMatchPaused(:final disconnectedUserId, :final resumeDeadline):
        // Nu pierdem runda: cronometrul stă până revine cel deconectat.
        _timer?.cancel();
        state = state.copyWith(
          isPaused: true,
          missingUserId: disconnectedUserId,
          resumeDeadline: resumeDeadline,
          resumeSecondsLeft: _secondsTo(resumeDeadline),
        );
        _startPauseTimer();
      case DuelMatchResumed(:final deadline):
        _deadline = deadline;
        final seconds = _secondsToDeadline();
        state = state.copyWith(
          clearPause: true,
          secondsLeft: seconds,
          roundSeconds: seconds > state.roundSeconds
              ? seconds
              : state.roundSeconds,
        );
        _startTimer();
      case DuelMatchSnapshot():
        _applySnapshot(event);
        _client.joinMatchChat(event.matchId);
      case DuelMatchChatHistory(
        :final matchId,
        :final canSendText,
        :final messages,
      ):
        if (matchId != state.matchId) return;
        state = state.copyWith(
          chatMessages: messages,
          canSendChatText: canSendText,
          clearChatError: true,
        );
      case DuelMatchChatMessageReceived(:final message):
        if (message.matchId != state.matchId) return;
        final withoutDuplicate = state.chatMessages
            .where((entry) => entry.id != message.id)
            .toList(growable: true);
        state = state.copyWith(
          chatMessages: [...withoutDuplicate, message],
          clearChatError: true,
        );
      case DuelMatchChatRejected(:final matchId, :final reason):
        if (matchId != state.matchId) return;
        state = state.copyWith(chatErrorReason: reason);
      case DuelServerError(:final message):
        _timer?.cancel();
        state = state.copyWith(phase: DuelPhase.error, errorMessage: message);
      case DuelDisconnected():
        _timer?.cancel();
        if (state.matchId != null && _isInMatch(state.phase)) {
          // Locul ne e păstrat pe server; clientul reîncearcă singur.
          state = state.copyWith(phase: DuelPhase.reconnecting);
        } else if (state.phase != DuelPhase.finished &&
            state.phase != DuelPhase.unauthenticated) {
          state = state.copyWith(phase: DuelPhase.disconnected);
        }
    }
  }

  static bool _isInMatch(DuelPhase phase) {
    return phase == DuelPhase.roundActive ||
        phase == DuelPhase.waitingOpponent ||
        phase == DuelPhase.roundRevealed ||
        phase == DuelPhase.reconnecting;
  }

  /// Reconstruiește partida din instantaneul primit la revenire.
  void _applySnapshot(DuelMatchSnapshot snapshot) {
    final mine = snapshot.players
        .where((player) => player.userId == state.myUserId)
        .firstOrNull;
    final theirs = snapshot.players
        .where((player) => player.userId != state.myUserId)
        .firstOrNull;
    _myTerritories = mine?.territoriesWon ?? 0;
    _deadline = snapshot.deadline;
    final seconds = _secondsToDeadline();
    final missing = snapshot.players
        .where((player) => !player.connected)
        .firstOrNull;

    state = state.copyWith(
      matchId: snapshot.matchId,
      opponentId: theirs?.userId ?? state.opponentId,
      roundNumber: snapshot.roundNumber,
      totalRounds: snapshot.totalRounds,
      question: snapshot.question,
      secondsLeft: seconds,
      roundSeconds: seconds > 0 ? seconds : 1,
      // Ce am răspuns înainte de deconectare nu se mai poate afla: serverul
      // spune doar *dacă* am răspuns, deliberat.
      clearSelectedAnswer: true,
      clearLastResult: true,
      clearError: true,
      myPoints: mine?.score ?? 0,
      opponentPoints: theirs?.score ?? 0,
      myTerritories: mine?.territoriesWon ?? 0,
      opponentTerritories: theirs?.territoriesWon ?? 0,
      standings: sortedStandings(
        snapshot.players.map(
          (player) => DuelStanding(
            userId: player.userId,
            points: player.score,
            territories: player.territoriesWon,
            connected: player.connected,
          ),
        ),
      ),
      territoryMap: snapshot.territoryMap,
      territory: snapshot.territory,
      lastTerritoryGain: 0,
      phase: (mine?.hasAnswered ?? false)
          ? DuelPhase.waitingOpponent
          : DuelPhase.roundActive,
      isPaused: snapshot.isPaused,
      missingUserId: missing?.userId,
      resumeDeadline: snapshot.resumeDeadline,
      resumeSecondsLeft: _secondsTo(snapshot.resumeDeadline),
      clearPause: !snapshot.isPaused,
    );
    snapshot.isPaused ? _startPauseTimer() : _startTimer();
  }

  int _secondsToDeadline() => _secondsTo(_deadline);

  static int _secondsTo(DateTime? deadline) {
    if (deadline == null) return 0;
    final remaining = deadline.difference(DateTime.now()).inMilliseconds;
    return remaining <= 0 ? 0 : (remaining / 1000).ceil();
  }

  void _startTimer() {
    _timer?.cancel();
    _timer = Timer.periodic(tick, (_) {
      if (!mounted) return;
      final seconds = _secondsToDeadline();
      state = state.copyWith(secondsLeft: seconds);
      if (seconds <= 0) _timer?.cancel();
    });
  }

  /// Cât timp partida e în pauză, cronometrul rundei stă și numărăm în schimb
  /// fereastra de revenire a celui deconectat.
  void _startPauseTimer() {
    _timer?.cancel();
    _timer = Timer.periodic(tick, (_) {
      if (!mounted) return;
      final seconds = _secondsTo(state.resumeDeadline);
      state = state.copyWith(resumeSecondsLeft: seconds);
      if (seconds <= 0) _timer?.cancel();
    });
  }

  @override
  void dispose() {
    _timer?.cancel();
    _subscription?.cancel();
    unawaited(_client.disconnect());
    super.dispose();
  }
}

final duelControllerProvider =
    StateNotifierProvider.autoDispose<DuelController, DuelState>((ref) {
      return DuelController(ref.watch(realtimeClientProvider));
    });
