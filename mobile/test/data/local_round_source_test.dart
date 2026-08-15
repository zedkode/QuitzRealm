import 'dart:convert';
import 'dart:math';

import 'package:flutter/services.dart';
import 'package:flutter_test/flutter_test.dart';
import 'package:quiz_realm/data/pack/local_round_source.dart';
import 'package:quiz_realm/data/pack/question_pack_loader.dart';
import 'package:quiz_realm/domain/campaign/realm_chapter.dart';
import 'package:quiz_realm/domain/question/quiz_question.dart';

/// Bundle de test: nu atinge assets reale, ca testul să fie determinist.
class _FakeBundle extends CachingAssetBundle {
  _FakeBundle(this.payload);

  final String payload;

  @override
  Future<ByteData> load(String key) async {
    final bytes = utf8.encode(payload);
    return ByteData.view(Uint8List.fromList(bytes).buffer);
  }
}

String _packJson({required int easy, required int hard}) {
  final questions = [
    for (var index = 0; index < easy; index++)
      {
        'id': 'easy-$index',
        'type': 'choice',
        'difficulty': 1,
        'text': 'Ușoară $index',
        'options': ['A$index', 'B$index', 'C$index', 'D$index'],
        'answer': 'A$index',
        'explanation': 'pentru că A',
      },
    for (var index = 0; index < hard; index++)
      {
        'id': 'hard-$index',
        'type': 'numeric',
        'difficulty': 5,
        'text': 'Grea $index',
        'answer': '${index + 1}',
        'explanation': 'pentru că cifre',
      },
  ];
  return jsonEncode({
    'id': 'istorie',
    'name': 'Istorie',
    'questions': questions,
  });
}

LocalRoundSource _source(String json, BattleStage stage) {
  return LocalRoundSource(
    chapter: RealmChapter.byId('istorie'),
    stage: stage,
    loader: QuestionPackLoader(bundle: _FakeBundle(json)),
    random: Random(3),
  );
}

void main() {
  const outpost = BattleStage(
    index: 0,
    questionCount: 5,
    minDifficulty: 1,
    maxDifficulty: 2,
  );

  test('livrează exact numărul de întrebări cerut de etapă', () async {
    final source = _source(_packJson(easy: 8, hard: 4), outpost);
    final round = await source.loadRound();

    expect(round, hasLength(5));
    expect(round.map((question) => question.id).toSet(), hasLength(5));
    expect(round.every((question) => question.categoryName == 'Istorie'), isTrue);
  });

  test('lărgește banda de dificultate dacă nu are destule întrebări', () async {
    final source = _source(_packJson(easy: 2, hard: 6), outpost);
    final round = await source.loadRound();

    expect(round, hasLength(5));
  });

  test('nu trimite răspunsul corect către ecran', () async {
    final source = _source(_packJson(easy: 6, hard: 2), outpost);
    final round = await source.loadRound();
    final choice = round.firstWhere(
      (question) => question.type == QuizQuestionType.multipleChoice,
    );

    expect(choice.options, hasLength(4));
    expect(choice.options.toSet(), hasLength(4));
  });

  test('judecă răspunsul și întoarce explicația', () async {
    final source = _source(_packJson(easy: 6, hard: 0), outpost);
    final round = await source.loadRound();
    final question = round.first;

    final wrong = await source.judge(
      questionId: question.id,
      answer: 'răspuns greșit',
    );
    expect(wrong.isCorrect, isFalse);
    expect(wrong.explanation, 'pentru că A');

    final right = await source.judge(
      questionId: question.id,
      answer: wrong.correctAnswer,
    );
    expect(right.isCorrect, isTrue);
  });

  test('judge() înainte de loadRound() este o eroare de programare', () async {
    final source = _source(_packJson(easy: 6, hard: 0), outpost);
    expect(
      () => source.judge(questionId: 'easy-0', answer: 'A0'),
      throwsA(isA<StateError>()),
    );
  });
}
