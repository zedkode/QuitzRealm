import 'dart:math';

import '../../domain/battle/round_source.dart';
import '../../domain/campaign/realm_chapter.dart';
import '../../domain/question/quiz_question.dart';
import 'question_pack.dart';
import 'question_pack_loader.dart';

/// Sursă de întrebări din mai multe categorii deodată.
///
/// Spre deosebire de [LocalRoundSource], care joacă un singur pachet, aceasta
/// combină pachetele bifate de jucător. Diferența care contează e
/// **deduplicarea**: „Cultură Generală" repetă intenționat întrebări din
/// literatură, istorie și geografie, așa că o rundă pe „Literatură + Cultură
/// Generală" ar pune aceeași întrebare de două ori dacă n-am filtra.
class CategoryRoundSource implements RoundSource {
  CategoryRoundSource({
    required this.packAssets,
    required this.stage,
    required this.loader,
    Random? random,
  }) : _random = random ?? Random(),
       assert(packAssets.isNotEmpty);

  final List<String> packAssets;
  final BattleStage stage;
  final QuestionPackLoader loader;
  final Random _random;

  /// Întrebările tuturor pachetelor alese, deduplicate, cu numele categoriei
  /// din care provin.
  final List<_SourcedQuestion> _pool = [];
  final Map<String, _SourcedQuestion> _byId = {};

  @override
  Future<List<QuizQuestion>> loadRound() async {
    if (_pool.isEmpty) await _fillPool();
    final selected = _selectQuestions();
    if (selected.isEmpty) throw const EmptyRoundException();

    return selected.map((sourced) {
      final question = sourced.question;
      final options = question.type == QuizQuestionType.multipleChoice
          ? (List<String>.of(question.options)..shuffle(_random))
          : const <String>[];
      return question.toQuizQuestion(
        categoryId: sourced.packId,
        categoryName: sourced.packName,
        shuffledOptions: options,
      );
    }).toList(growable: false);
  }

  @override
  Future<AnswerResult> judge({
    required String questionId,
    required String answer,
  }) async {
    if (_pool.isEmpty) {
      throw StateError('judge() apelat înainte de loadRound()');
    }
    final sourced = _byId[questionId];
    if (sourced == null) {
      throw ArgumentError.value(questionId, 'questionId', 'Întrebare lipsă');
    }
    final question = sourced.question;
    return AnswerResult(
      isCorrect: question.accepts(answer),
      correctAnswer: question.answer,
      explanation: question.explanation.isEmpty ? null : question.explanation,
    );
  }

  Future<void> _fillPool() async {
    final seenTexts = <String>{};

    for (final asset in packAssets) {
      final pack = await loader.load(asset);
      for (final question in pack.questions) {
        // Prima categorie bifată câștigă întrebarea. Ordinea e cea din
        // selecție, deci rezultatul e stabil, nu depinde de hazard.
        if (!seenTexts.add(_normalizeText(question.text))) continue;
        final sourced = _SourcedQuestion(
          question: question,
          packId: pack.id,
          packName: pack.name,
        );
        _pool.add(sourced);
        _byId[question.id] = sourced;
      }
    }
  }

  /// Alege întrebări din banda de dificultate a etapei, lărgind banda dacă nu
  /// sunt destule — aceeași regulă ca la campanie, ca dificultatea să însemne
  /// același lucru în tot jocul.
  List<_SourcedQuestion> _selectQuestions() {
    final chosen = <_SourcedQuestion>[];
    final used = <String>{};
    var minDifficulty = stage.minDifficulty;
    var maxDifficulty = stage.maxDifficulty;

    while (chosen.length < stage.questionCount) {
      final candidates =
          _pool
              .where(
                (sourced) =>
                    !used.contains(sourced.question.id) &&
                    sourced.question.difficulty >= minDifficulty &&
                    sourced.question.difficulty <= maxDifficulty,
              )
              .toList()
            ..shuffle(_random);

      for (final candidate in candidates) {
        if (chosen.length == stage.questionCount) break;
        chosen.add(candidate);
        used.add(candidate.question.id);
      }

      if (minDifficulty == 1 && maxDifficulty == 5) break;
      minDifficulty = minDifficulty > 1 ? minDifficulty - 1 : 1;
      maxDifficulty = maxDifficulty < 5 ? maxDifficulty + 1 : 5;
    }

    chosen.sort(
      (a, b) => a.question.difficulty.compareTo(b.question.difficulty),
    );
    return chosen;
  }
}

class _SourcedQuestion {
  const _SourcedQuestion({
    required this.question,
    required this.packId,
    required this.packName,
  });

  final PackQuestion question;
  final String packId;
  final String packName;
}

/// Normalizare pentru comparat texte de întrebări: majuscule, spații și
/// ghilimele nu fac două întrebări diferite.
String _normalizeText(String value) {
  return value
      .toLowerCase()
      .replaceAll(RegExp('[„”"\']'), '')
      .replaceAll(RegExp(r'\s+'), ' ')
      .trim();
}
