import 'dart:async';

import 'package:quiz_realm/core/network/realtime_client.dart';
import 'package:quiz_realm/domain/duel/match_preferences.dart';
import 'package:quiz_realm/domain/duel/duel_events.dart';
import 'package:quiz_realm/domain/question/quiz_question.dart';

/// Client realtime controlabil din teste: împinge evenimente în stream fără
/// să atingă rețeaua.
class FakeRealtimeClient implements RealtimeClient {
  FakeRealtimeClient({this.connectResult = true});

  final bool connectResult;
  final _controller = StreamController<DuelEvent>.broadcast();

  bool joinedQueue = false;
  bool leftQueue = false;
  bool disconnected = false;
  final List<({String matchId, String answer})> sentAnswers = [];
  final List<String> joinedMatchChats = [];
  final List<({String matchId, String content})> sentChatMessages = [];
  final List<({String matchId, String reaction})> sentReactions = [];

  @override
  Stream<DuelEvent> get events => _controller.stream;

  @override
  bool get isConnected => connectResult && !disconnected;

  @override
  Future<bool> connect() async => connectResult;

  /// Preferințele cu care s-a intrat în coadă — testele verifică pe ele că
  /// modul și categoriile alese chiar ajung la server.
  MatchPreferences? queuePreferences;

  @override
  void joinQueue([
    MatchPreferences preferences = MatchPreferences.defaults,
  ]) {
    joinedQueue = true;
    queuePreferences = preferences;
  }

  @override
  void leaveQueue() => leftQueue = true;

  @override
  void sendAnswer({required String matchId, required String answer}) {
    sentAnswers.add((matchId: matchId, answer: answer));
  }

  @override
  void joinMatchChat(String matchId) => joinedMatchChats.add(matchId);

  @override
  void sendMatchChat({required String matchId, required String content}) {
    sentChatMessages.add((matchId: matchId, content: content));
  }

  @override
  void sendMatchReaction({required String matchId, required String reaction}) {
    sentReactions.add((matchId: matchId, reaction: reaction));
  }

  @override
  Future<void> disconnect() async => disconnected = true;

  @override
  Future<void> dispose() async {
    disconnected = true;
    if (!_controller.isClosed) await _controller.close();
  }

  void emit(DuelEvent event) {
    if (!_controller.isClosed) _controller.add(event);
  }

  /// Parcurge pașii până la începutul primei runde.
  void emitMatchStart({
    String myUserId = 'me',
    String opponentId = 'rival',
    String matchId = 'match-1',
    int totalRounds = 3,
    int roundNumber = 1,
    int seconds = 12,
    QuizQuestionType type = QuizQuestionType.multipleChoice,
  }) {
    emit(DuelSessionReady(myUserId));
    emit(
      DuelMatchFound(
        matchId: matchId,
        totalRounds: totalRounds,
        playerIds: [myUserId, opponentId],
      ),
    );
    emitRoundStarted(
      matchId: matchId,
      roundNumber: roundNumber,
      totalRounds: totalRounds,
      seconds: seconds,
      type: type,
    );
  }

  void emitRoundStarted({
    String matchId = 'match-1',
    int roundNumber = 1,
    int totalRounds = 3,
    int seconds = 12,
    QuizQuestionType type = QuizQuestionType.multipleChoice,
  }) {
    emit(
      DuelRoundStarted(
        matchId: matchId,
        roundNumber: roundNumber,
        totalRounds: totalRounds,
        deadline: DateTime.now().add(Duration(seconds: seconds)),
        question: QuizQuestion(
          id: 'q$roundNumber',
          type: type,
          categoryId: 'cat',
          difficulty: 2,
          text: 'Întrebarea rundei $roundNumber?',
          options: type == QuizQuestionType.multipleChoice
              ? const ['Alfa', 'Beta', 'Gama', 'Delta']
              : const [],
        ),
      ),
    );
  }

  void emitRoundResult({
    int roundNumber = 1,
    int totalRounds = 3,
    String correctAnswer = 'Alfa',
    String myUserId = 'me',
    String opponentId = 'rival',
    int myScore = 1,
    int myTerritories = 1,
    bool myCorrect = true,
    String? myAnswer = 'Alfa',
    int opponentScore = 0,
    int opponentTerritories = 0,
    bool opponentCorrect = false,
    String? opponentAnswer = 'Beta',
  }) {
    emit(
      DuelRoundResult(
        roundNumber: roundNumber,
        totalRounds: totalRounds,
        correctAnswer: correctAnswer,
        players: [
          DuelPlayerScore(
            userId: myUserId,
            score: myScore,
            territoriesWon: myTerritories,
            isCorrect: myCorrect,
            answer: myAnswer,
            responseTimeMs: 900,
          ),
          DuelPlayerScore(
            userId: opponentId,
            score: opponentScore,
            territoriesWon: opponentTerritories,
            isCorrect: opponentCorrect,
            answer: opponentAnswer,
            responseTimeMs: 1500,
          ),
        ],
      ),
    );
  }

  void emitFinished({
    String myUserId = 'me',
    String opponentId = 'rival',
    DuelOutcome myOutcome = DuelOutcome.win,
    int myScore = 3,
    int opponentScore = 0,
  }) {
    emit(
      DuelMatchFinished(
        matchId: 'match-1',
        roundsPlayed: 3,
        players: [
          DuelFinalScore(
            userId: myUserId,
            score: myScore,
            territoriesWon: myScore,
            outcome: myOutcome,
          ),
          DuelFinalScore(
            userId: opponentId,
            score: opponentScore,
            territoriesWon: opponentScore,
            outcome: myOutcome == DuelOutcome.win
                ? DuelOutcome.loss
                : myOutcome == DuelOutcome.loss
                ? DuelOutcome.win
                : DuelOutcome.draw,
          ),
        ],
      ),
    );
  }
}
