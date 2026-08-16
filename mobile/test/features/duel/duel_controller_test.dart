import 'package:flutter_test/flutter_test.dart';
import 'package:quiz_realm/domain/duel/duel_events.dart';
import 'package:quiz_realm/domain/duel/match_preferences.dart';
import 'package:quiz_realm/domain/duel/territory_map.dart';
import 'package:quiz_realm/domain/question/quiz_question.dart';
import 'package:quiz_realm/features/duel/duel_controller.dart';

import '../../support/fake_realtime_client.dart';

/// Lasă stream-ul să livreze evenimentele înainte de verificare.
Future<void> settle() => Future<void>.delayed(Duration.zero);

void main() {
  test('fără sesiune autentificată nu intră în coadă', () async {
    final client = FakeRealtimeClient(connectResult: false);
    final controller = DuelController(client);
    addTearDown(controller.dispose);

    await controller.start();

    expect(controller.state.phase, DuelPhase.unauthenticated);
    expect(client.joinedQueue, isFalse);
  });

  test('sesiunea validă intră automat în coada de matchmaking', () async {
    final client = FakeRealtimeClient();
    final controller = DuelController(client);
    addTearDown(controller.dispose);

    await controller.start();
    expect(controller.state.phase, DuelPhase.connecting);

    client.emit(const DuelSessionReady('me'));
    await settle();

    expect(controller.state.phase, DuelPhase.searching);
    expect(controller.state.myUserId, 'me');
    expect(client.joinedQueue, isTrue);
  });

  test('meciul găsit reține adversarul și numărul de runde', () async {
    final client = FakeRealtimeClient();
    final controller = DuelController(client);
    addTearDown(controller.dispose);

    await controller.start();
    client.emitMatchStart();
    await settle();

    expect(controller.state.phase, DuelPhase.roundActive);
    expect(controller.state.matchId, 'match-1');
    expect(controller.state.opponentId, 'rival');
    expect(controller.state.totalRounds, 3);
    expect(controller.state.roundNumber, 1);
    expect(controller.state.question?.text, 'Întrebarea rundei 1?');
    expect(controller.state.secondsLeft, greaterThan(0));
  });

  test('răspunsul pleacă spre server și trece în așteptare', () async {
    final client = FakeRealtimeClient();
    final controller = DuelController(client);
    addTearDown(controller.dispose);

    await controller.start();
    client.emitMatchStart();
    await settle();

    controller.submitAnswer('  Alfa  ');

    expect(client.sentAnswers.single.matchId, 'match-1');
    expect(client.sentAnswers.single.answer, 'Alfa');
    expect(controller.state.phase, DuelPhase.waitingOpponent);
    expect(controller.state.selectedAnswer, 'Alfa');
  });

  test('nu trimite răspuns gol și nici după închiderea rundei', () async {
    final client = FakeRealtimeClient();
    final controller = DuelController(client);
    addTearDown(controller.dispose);

    await controller.start();
    client.emitMatchStart();
    await settle();

    controller.submitAnswer('   ');
    expect(client.sentAnswers, isEmpty);

    client.emitRoundResult();
    await settle();
    controller.submitAnswer('Alfa');
    expect(client.sentAnswers, isEmpty);
  });

  test('rezultatul rundei arată câștigul de teritoriu, nu totalul', () async {
    final client = FakeRealtimeClient();
    final controller = DuelController(client);
    addTearDown(controller.dispose);

    await controller.start();
    client.emitMatchStart();
    await settle();

    client.emitRoundResult(myScore: 1, myTerritories: 1);
    await settle();
    expect(controller.state.phase, DuelPhase.roundRevealed);
    expect(controller.state.lastTerritoryGain, 1);
    expect(controller.state.myScore?.score, 1);
    expect(controller.state.opponentScore?.isCorrect, isFalse);

    // Runda a doua: corect, dar adversarul a fost mai rapid.
    client.emitRoundStarted(roundNumber: 2);
    await settle();
    client.emitRoundResult(
      roundNumber: 2,
      myScore: 2,
      myTerritories: 1,
      opponentScore: 1,
      opponentTerritories: 1,
      opponentCorrect: true,
    );
    await settle();

    expect(controller.state.lastTerritoryGain, 0);
    expect(controller.state.myScore?.score, 2);
    expect(controller.state.myPoints, 2);
    expect(controller.state.opponentPoints, 1);
  });

  test('scorul cumulat rămâne vizibil și după începerea rundei noi', () async {
    final client = FakeRealtimeClient();
    final controller = DuelController(client);
    addTearDown(controller.dispose);

    await controller.start();
    client.emitMatchStart();
    await settle();
    client.emitRoundResult(myScore: 1, myTerritories: 1);
    await settle();

    client.emitRoundStarted(roundNumber: 2);
    await settle();

    // Verdictul se golește, dar tabela de scor nu are voie să revină la zero.
    expect(controller.state.lastResult, isNull);
    expect(controller.state.myPoints, 1);
    expect(controller.state.myTerritories, 1);
    expect(controller.state.opponentPoints, 0);
  });

  test('runda nouă curăță selecția și verdictul precedent', () async {
    final client = FakeRealtimeClient();
    final controller = DuelController(client);
    addTearDown(controller.dispose);

    await controller.start();
    client.emitMatchStart();
    await settle();
    controller.submitAnswer('Alfa');
    client.emitRoundResult();
    await settle();

    client.emitRoundStarted(roundNumber: 2);
    await settle();

    expect(controller.state.phase, DuelPhase.roundActive);
    expect(controller.state.selectedAnswer, isNull);
    expect(controller.state.lastResult, isNull);
    expect(controller.state.roundNumber, 2);
  });

  test('finalul partidei păstrează scorurile ambilor jucători', () async {
    final client = FakeRealtimeClient();
    final controller = DuelController(client);
    addTearDown(controller.dispose);

    await controller.start();
    client.emitMatchStart();
    await settle();
    client.emitFinished();
    await settle();

    expect(controller.state.phase, DuelPhase.finished);
    expect(controller.state.myFinalScore?.outcome, DuelOutcome.win);
    expect(controller.state.opponentFinalScore?.outcome, DuelOutcome.loss);
    expect(controller.state.myFinalScore?.score, 3);
  });

  test('eroarea de server oprește partida cu mesaj', () async {
    final client = FakeRealtimeClient();
    final controller = DuelController(client);
    addTearDown(controller.dispose);

    await controller.start();
    client.emitMatchStart();
    await settle();
    client.emit(const DuelServerError('Rezultatul nu a putut fi persistat.'));
    await settle();

    expect(controller.state.phase, DuelPhase.error);
    expect(
      controller.state.errorMessage,
      'Rezultatul nu a putut fi persistat.',
    );
  });

  test('deconectarea după final nu suprascrie rezultatul', () async {
    final client = FakeRealtimeClient();
    final controller = DuelController(client);
    addTearDown(controller.dispose);

    await controller.start();
    client.emitMatchStart();
    await settle();
    client.emitFinished();
    await settle();
    client.emit(const DuelDisconnected());
    await settle();

    expect(controller.state.phase, DuelPhase.finished);
  });

  test(
    'sesiunea cu partidă activă nu reintră în coadă, ci așteaptă starea',
    () async {
      final client = FakeRealtimeClient();
      final controller = DuelController(client);
      addTearDown(controller.dispose);

      await controller.start();
      client.emit(const DuelSessionReady('me', activeMatchId: 'match-1'));
      await settle();

      expect(client.joinedQueue, isFalse);
      expect(controller.state.phase, DuelPhase.reconnecting);
      expect(controller.state.matchId, 'match-1');
    },
  );

  test('pauza îngheață runda și blochează trimiterea răspunsului', () async {
    final client = FakeRealtimeClient();
    final controller = DuelController(client);
    addTearDown(controller.dispose);

    await controller.start();
    client.emitMatchStart();
    await settle();
    client.emit(
      DuelMatchPaused(
        disconnectedUserId: 'rival',
        resumeDeadline: DateTime.now().add(const Duration(seconds: 60)),
      ),
    );
    await settle();

    expect(controller.state.isPaused, isTrue);
    expect(controller.state.opponentMissing, isTrue);
    expect(controller.state.canAnswer, isFalse);
    controller.submitAnswer('A');
    expect(client.sentAnswers, isEmpty);
  });

  test('reluarea repornește cronometrul de la noul termen', () async {
    final client = FakeRealtimeClient();
    final controller = DuelController(client);
    addTearDown(controller.dispose);

    await controller.start();
    client.emitMatchStart(seconds: 12);
    await settle();
    client.emit(
      DuelMatchPaused(
        disconnectedUserId: 'rival',
        resumeDeadline: DateTime.now().add(const Duration(seconds: 60)),
      ),
    );
    await settle();
    client.emit(
      DuelMatchResumed(
        reconnectedUserId: 'rival',
        // Serverul a adăugat durata pauzei la runda curentă.
        deadline: DateTime.now().add(const Duration(seconds: 20)),
      ),
    );
    await settle();

    expect(controller.state.isPaused, isFalse);
    expect(controller.state.opponentMissing, isFalse);
    expect(controller.state.canAnswer, isTrue);
    expect(controller.state.secondsLeft, greaterThan(12));
    controller.submitAnswer('A');
    expect(client.sentAnswers.single.answer, 'A');
  });

  test('abandonul adversarului e marcat distinct la final', () async {
    final client = FakeRealtimeClient();
    final controller = DuelController(client);
    addTearDown(controller.dispose);

    await controller.start();
    client.emitMatchStart();
    await settle();
    client.emit(
      const DuelMatchFinished(
        matchId: 'match-1',
        roundsPlayed: 1,
        endedByForfeit: true,
        players: [
          DuelFinalScore(
            userId: 'me',
            score: 1,
            territoriesWon: 1,
            outcome: DuelOutcome.win,
          ),
          DuelFinalScore(
            userId: 'rival',
            score: 0,
            territoriesWon: 0,
            outcome: DuelOutcome.loss,
          ),
        ],
      ),
    );
    await settle();

    expect(controller.state.phase, DuelPhase.finished);
    expect(controller.state.endedByForfeit, isTrue);
    expect(controller.state.isPaused, isFalse);
  });

  test('ieșirea din duel golește coada și închide conexiunea', () async {
    final client = FakeRealtimeClient();
    final controller = DuelController(client);
    addTearDown(controller.dispose);

    await controller.start();
    client.emitMatchStart();
    await settle();
    await controller.leave();

    expect(client.leftQueue, isTrue);
    expect(client.disconnected, isTrue);
    expect(controller.state.phase, DuelPhase.idle);
  });

  test('chatul partidei respectă accesul primit de la server', () async {
    final client = FakeRealtimeClient();
    final controller = DuelController(client);
    addTearDown(controller.dispose);

    await controller.start();
    client.emitMatchStart();
    await settle();

    expect(client.joinedMatchChats, ['match-1']);
    client.emit(
      DuelMatchChatHistory(
        matchId: 'match-1',
        canSendText: true,
        messages: [
          DuelChatMessage(
            id: 'chat-1',
            matchId: 'match-1',
            senderId: 'rival',
            senderName: 'Rivalul',
            content: 'well_played',
            kind: DuelChatMessageKind.reaction,
            createdAt: DateTime.now(),
          ),
        ],
      ),
    );
    await settle();

    expect(controller.state.canSendChatText, isTrue);
    expect(controller.state.chatMessages.single.id, 'chat-1');
    controller.sendChatMessage('  Salut!  ');
    controller.sendChatReaction('nice_move');
    expect(client.sentChatMessages.single.content, 'Salut!');
    expect(client.sentReactions.single.reaction, 'nice_move');
  });

  test('chatul ignoră evenimentele care aparțin altei partide', () async {
    final client = FakeRealtimeClient();
    final controller = DuelController(client);
    addTearDown(controller.dispose);

    await controller.start();
    client.emitMatchStart();
    await settle();
    client.emit(
      const DuelMatchChatRejected(matchId: 'alta-partida', reason: 'muted'),
    );
    await settle();

    expect(controller.state.chatErrorReason, isNull);
  });

  test('modul și categoriile alese ajung la server', () async {
    final client = FakeRealtimeClient();
    final controller = DuelController(client);
    addTearDown(controller.dispose);

    await controller.start(
      const MatchPreferences(
        mode: MatchMode.classic,
        categoryCodes: ['history', 'logic'],
        playerCount: 4,
      ),
    );
    client.emit(const DuelSessionReady('me'));
    await settle();

    // Fără asta, ecranul de pregătire ar fi doar decor: jucătorul bifează
    // categorii, iar meciul le ignoră.
    expect(client.queuePreferences?.mode, MatchMode.classic);
    expect(client.queuePreferences?.categoryCodes, ['history', 'logic']);
    expect(client.queuePreferences?.playerCount, 4);
  });

  test('fără preferințe intră în coadă pe duel și pe toate categoriile', () async {
    final client = FakeRealtimeClient();
    final controller = DuelController(client);
    addTearDown(controller.dispose);

    await controller.start();
    client.emit(const DuelSessionReady('me'));
    await settle();

    expect(client.queuePreferences?.mode, MatchMode.duo);
    expect(client.queuePreferences?.categoryCodes, isEmpty);
  });


  test('o partidă cu patru jucători păstrează tot clasamentul', () async {
    final client = FakeRealtimeClient();
    final controller = DuelController(client);
    addTearDown(controller.dispose);

    await controller.start();
    client.emit(const DuelSessionReady('me'));
    await settle();

    client.emit(
      const DuelRoundResult(
        roundNumber: 1,
        totalRounds: 5,
        correctAnswer: 'x',
        players: [
          DuelPlayerScore(
            userId: 'me',
            score: 20,
            territoriesWon: 1,
            isCorrect: true,
          ),
          DuelPlayerScore(
            userId: 'b',
            score: 50,
            territoriesWon: 2,
            isCorrect: true,
          ),
          DuelPlayerScore(
            userId: 'c',
            score: 10,
            territoriesWon: 0,
            isCorrect: false,
          ),
          DuelPlayerScore(
            userId: 'd',
            score: 30,
            territoriesWon: 1,
            isCorrect: true,
          ),
        ],
      ),
    );
    await settle();

    // Înainte, starea reținea doar „eu + un adversar", iar ceilalți doi
    // dispăreau din ecran fără urmă.
    expect(controller.state.standings, hasLength(4));
    expect(controller.state.isMultiplayer, isTrue);
    expect(controller.state.standings.first.userId, 'b');
    expect(controller.state.myPosition, 3);
  });

  test('duelul obișnuit nu e tratat ca partidă cu mai mulți', () async {
    final client = FakeRealtimeClient();
    final controller = DuelController(client);
    addTearDown(controller.dispose);

    await controller.start();
    client.emit(const DuelSessionReady('me'));
    await settle();

    client.emit(
      const DuelRoundResult(
        roundNumber: 1,
        totalRounds: 5,
        correctAnswer: 'x',
        players: [
          DuelPlayerScore(
            userId: 'me',
            score: 20,
            territoriesWon: 1,
            isCorrect: true,
          ),
          DuelPlayerScore(
            userId: 'rival',
            score: 10,
            territoriesWon: 0,
            isCorrect: false,
          ),
        ],
      ),
    );
    await settle();

    expect(controller.state.isMultiplayer, isFalse);
    expect(controller.state.myPoints, 20);
    expect(controller.state.opponentPoints, 10);
  });


  test('harta și eliminările din rundă ajung în stare', () async {
    final client = FakeRealtimeClient();
    final controller = DuelController(client);
    addTearDown(controller.dispose);

    await controller.start();
    client.emit(const DuelSessionReady('me'));
    await settle();

    client.emit(
      const DuelRoundResult(
        roundNumber: 2,
        totalRounds: 5,
        correctAnswer: 'x',
        players: [
          DuelPlayerScore(
            userId: 'me',
            score: 10,
            territoriesWon: 3,
            isCorrect: true,
          ),
          DuelPlayerScore(
            userId: 'rival',
            score: 5,
            territoriesWon: 0,
            isCorrect: false,
          ),
        ],
        territory: TerritoryOwnership(
          owners: {'t0': 'me', 't1': null},
          contestedTerritoryId: 't1',
        ),
        eliminatedUserIds: ['rival'],
      ),
    );
    await settle();

    expect(controller.state.territory?.ownerOf('t0'), 'me');
    expect(controller.state.territory?.contestedTerritoryId, 't1');
    expect(controller.state.spectatorUserIds, contains('rival'));
    // Eu n-am fost eliminat, deci pot răspunde în continuare.
    expect(controller.state.amSpectator, isFalse);
  });


  /// Trimite un snapshot cu hartă, ca partida să fie în faza de luptă.
  Future<void> enterBattlePhase(
    FakeRealtimeClient client,
    DuelController controller,
  ) async {
    await controller.start();
    client.emit(const DuelSessionReady('me'));
    await settle();

    client.emit(
      DuelMatchSnapshot(
        matchId: 'm1',
        isPaused: false,
        roundNumber: 3,
        totalRounds: 8,
        deadline: DateTime.now().add(const Duration(seconds: 10)),
        question: const QuizQuestion(
          id: 'q1',
          type: QuizQuestionType.multipleChoice,
          categoryId: 'history',
          difficulty: 2,
          text: 'Test?',
          options: ['a', 'b'],
          categoryName: 'Istorie',
        ),
        players: const [],
        territoryMap: const TerritoryMap(
          playerCount: 2,
          territories: [
            Territory(
              id: 't0',
              coordinates: HexCoordinates(0, 0),
              neighbourIds: ['t1'],
            ),
            Territory(
              id: 't1',
              coordinates: HexCoordinates(1, 0),
              neighbourIds: ['t0'],
            ),
          ],
        ),
        territory: const TerritoryOwnership(
          owners: {'t0': 'me', 't1': 'rival'},
        ),
      ),
    );
    await settle();
  }

  test('ținta legală ajunge la server', () async {
    final client = FakeRealtimeClient();
    final controller = DuelController(client);
    addTearDown(controller.dispose);
    await enterBattlePhase(client, controller);

    expect(controller.state.attackableTerritories, ['t1']);
    controller.declareAttack('t1');

    expect(client.declaredAttack?.territoryId, 't1');
  });

  test('o țintă care nu e la graniță nu se trimite deloc', () async {
    // Serverul ar refuza-o oricum; oprind-o aici, jucătorul nu vede o eroare
    // pentru o atingere care n-avea ce să reușească.
    final client = FakeRealtimeClient();
    final controller = DuelController(client);
    addTearDown(controller.dispose);
    await enterBattlePhase(client, controller);

    controller.declareAttack('t0');
    expect(client.declaredAttack, isNull);
  });

  test('confirmarea serverului marchează ținta pe hartă', () async {
    final client = FakeRealtimeClient();
    final controller = DuelController(client);
    addTearDown(controller.dispose);
    await enterBattlePhase(client, controller);

    client.emit(const DuelAttackDeclared('t1'));
    await settle();

    expect(controller.state.declaredTargetId, 't1');
  });

}
