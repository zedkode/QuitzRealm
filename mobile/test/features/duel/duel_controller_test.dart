import 'package:flutter_test/flutter_test.dart';
import 'package:quiz_realm/domain/duel/duel_events.dart';
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

  test('sesiunea cu partidă activă nu reintră în coadă, ci așteaptă starea', () async {
    final client = FakeRealtimeClient();
    final controller = DuelController(client);
    addTearDown(controller.dispose);

    await controller.start();
    client.emit(const DuelSessionReady('me', activeMatchId: 'match-1'));
    await settle();

    expect(client.joinedQueue, isFalse);
    expect(controller.state.phase, DuelPhase.reconnecting);
    expect(controller.state.matchId, 'match-1');
  });

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
}
