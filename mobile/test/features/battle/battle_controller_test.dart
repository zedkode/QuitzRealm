import 'package:fake_async/fake_async.dart';
import 'package:flutter_test/flutter_test.dart';
import 'package:quiz_realm/domain/battle/round_source.dart';
import 'package:quiz_realm/domain/campaign/realm_chapter.dart';
import 'package:quiz_realm/domain/question/quiz_question.dart';
import 'package:quiz_realm/features/battle/battle_controller.dart';

import '../../support/fake_round_source.dart';

const _stage = BattleStage(
  index: 0,
  questionCount: 3,
  minDifficulty: 1,
  maxDifficulty: 2,
);

BattleController _controller(
  RoundSource source, {
  List<({int stars, int xp})>? finished,
}) {
  return BattleController(
    source: source,
    stage: _stage,
    onFinished: ({required int stars, required int xpGained}) async {
      finished?.add((stars: stars, xp: xpGained));
    },
  );
}

void main() {
  test('încarcă runda și pornește cronometrul', () async {
    final controller = _controller(FakeRoundSource.withQuestions(3));
    addTearDown(controller.dispose);

    await controller.start();

    expect(controller.state.phase, BattlePhase.active);
    expect(controller.state.questions, hasLength(3));
    expect(controller.state.outcomes, everyElement(isNull));
    expect(controller.state.remainingSeconds, _stage.secondsPerQuestion);
  });

  test('runda goală ajunge într-o stare onestă, nu într-o eroare', () async {
    final controller = _controller(FakeRoundSource.empty());
    addTearDown(controller.dispose);

    await controller.start();

    expect(controller.state.phase, BattlePhase.empty);
  });

  test('sursa căzută duce la starea de eroare', () async {
    final controller = _controller(FakeRoundSource.failing());
    addTearDown(controller.dispose);

    await controller.start();

    expect(controller.state.phase, BattlePhase.error);
  });

  test('răspunsul corect adaugă puncte, serie și marchează traseul', () async {
    final source = FakeRoundSource.withQuestions(3);
    final controller = _controller(source);
    addTearDown(controller.dispose);

    await controller.start();
    await controller.submitAnswer(source.correctAnswerFor(0));

    expect(controller.state.phase, BattlePhase.revealed);
    expect(controller.state.outcome, AnswerOutcome.correct);
    expect(controller.state.correctCount, 1);
    expect(controller.state.streak, 1);
    expect(controller.state.score, greaterThan(0));
    expect(controller.state.lastPoints, controller.state.score);
    expect(controller.state.outcomes.first, AnswerOutcome.correct);
  });

  test('răspunsul greșit rupe seria și dezvăluie răspunsul corect', () async {
    final source = FakeRoundSource.withQuestions(3);
    final controller = _controller(source);
    addTearDown(controller.dispose);

    await controller.start();
    await controller.submitAnswer(source.correctAnswerFor(0));
    await controller.next();
    await controller.submitAnswer('răspuns greșit');

    expect(controller.state.outcome, AnswerOutcome.incorrect);
    expect(controller.state.streak, 0);
    expect(controller.state.bestStreak, 1);
    expect(controller.state.correctAnswer, source.correctAnswerFor(1));
    expect(controller.state.lastPoints, 0);
  });

  test('seria crește multiplicatorul punctelor', () async {
    final source = FakeRoundSource.withQuestions(3);
    final controller = _controller(source);
    addTearDown(controller.dispose);

    await controller.start();
    await controller.submitAnswer(source.correctAnswerFor(0));
    final firstPoints = controller.state.lastPoints;
    await controller.next();
    await controller.submitAnswer(source.correctAnswerFor(1));

    expect(controller.state.lastPoints, greaterThan(firstPoints));
    expect(controller.state.streak, 2);
  });

  test('la expirarea timpului trimite automat un răspuns gol', () {
    fakeAsync((async) {
      final source = FakeRoundSource.withQuestions(3);
      final controller = _controller(source);

      controller.start();
      async.flushMicrotasks();
      expect(controller.state.phase, BattlePhase.active);

      async.elapse(Duration(seconds: _stage.secondsPerQuestion));
      async.flushMicrotasks();

      expect(controller.state.phase, BattlePhase.revealed);
      expect(controller.state.outcome, AnswerOutcome.timedOut);
      expect(controller.state.correctCount, 0);
      expect(controller.state.remainingSeconds, 0);

      controller.dispose();
    });
  });

  test('eroarea de verdict păstrează atacul și permite reluarea', () async {
    final source = FakeRoundSource.withQuestions(3)..failJudge = true;
    final controller = _controller(source);
    addTearDown(controller.dispose);

    await controller.start();
    await controller.submitAnswer(source.correctAnswerFor(0));
    expect(controller.state.phase, BattlePhase.submitError);
    expect(controller.state.selectedAnswer, source.correctAnswerFor(0));

    source.failJudge = false;
    await controller.retrySubmission();
    expect(controller.state.phase, BattlePhase.revealed);
    expect(controller.state.outcome, AnswerOutcome.correct);
  });

  test('asaltul perfect raportează trei stele o singură dată', () async {
    final source = FakeRoundSource.withQuestions(3);
    final finished = <({int stars, int xp})>[];
    final controller = _controller(source, finished: finished);
    addTearDown(controller.dispose);

    await controller.start();
    for (var index = 0; index < 3; index++) {
      await controller.submitAnswer(source.correctAnswerFor(index));
      await controller.next();
    }

    expect(controller.state.phase, BattlePhase.complete);
    expect(controller.state.stars, 3);
    expect(finished, hasLength(1));
    expect(finished.single.stars, 3);
    expect(finished.single.xp, controller.state.xpGained);

    await controller.next();
    expect(finished, hasLength(1));
  });

  test('nu acceptă răspunsuri goale cât timp runda e activă', () async {
    final source = FakeRoundSource.withQuestions(3);
    final controller = _controller(source);
    addTearDown(controller.dispose);

    await controller.start();
    await controller.submitAnswer('   ');

    expect(controller.state.phase, BattlePhase.active);
  });

  test('întrebările numerice trec prin aceeași judecată', () async {
    final source = FakeRoundSource.withQuestions(
      2,
      type: QuizQuestionType.numeric,
    );
    final controller = _controller(source);
    addTearDown(controller.dispose);

    await controller.start();
    await controller.submitAnswer(source.correctAnswerFor(0));

    expect(controller.state.outcome, AnswerOutcome.correct);
  });
}
