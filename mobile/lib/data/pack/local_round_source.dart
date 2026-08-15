import 'dart:math';

import '../../domain/battle/round_source.dart';
import '../../domain/campaign/realm_chapter.dart';
import '../../domain/question/quiz_question.dart';
import 'question_pack.dart';
import 'question_pack_loader.dart';

/// Sursă de întrebări din pachetul curatoriat livrat cu jocul: funcționează
/// fără rețea, dar validarea răspunsului rămâne în afara widget-urilor.
class LocalRoundSource implements RoundSource {
  LocalRoundSource({
    required this.chapter,
    required this.stage,
    required this.loader,
    Random? random,
  }) : _random = random ?? Random();

  final RealmChapter chapter;
  final BattleStage stage;
  final QuestionPackLoader loader;
  final Random _random;

  QuestionPack? _pack;

  @override
  Future<List<QuizQuestion>> loadRound() async {
    final pack = _pack ??= await loader.load(chapter.packAsset);
    final selected = _selectQuestions(pack);
    if (selected.isEmpty) throw const EmptyRoundException();

    return selected.map((question) {
      final options = question.type == QuizQuestionType.multipleChoice
          ? (List<String>.of(question.options)..shuffle(_random))
          : const <String>[];
      return question.toQuizQuestion(
        categoryId: pack.id,
        categoryName: pack.name,
        shuffledOptions: options,
      );
    }).toList(growable: false);
  }

  @override
  Future<AnswerResult> judge({
    required String questionId,
    required String answer,
  }) async {
    final pack = _pack;
    if (pack == null) {
      throw StateError('judge() apelat înainte de loadRound()');
    }
    final question = pack.questionById(questionId);
    if (question == null) {
      throw ArgumentError.value(questionId, 'questionId', 'Întrebare lipsă');
    }
    return AnswerResult(
      isCorrect: question.accepts(answer),
      correctAnswer: question.answer,
      explanation: question.explanation.isEmpty ? null : question.explanation,
    );
  }

  /// Alege întrebări din banda de dificultate a etapei. Dacă banda nu are
  /// destule, se lărgește treptat — un asalt nu rămâne niciodată incomplet.
  List<PackQuestion> _selectQuestions(QuestionPack pack) {
    final chosen = <PackQuestion>[];
    final used = <String>{};
    var minDifficulty = stage.minDifficulty;
    var maxDifficulty = stage.maxDifficulty;

    while (chosen.length < stage.questionCount) {
      final candidates =
          pack.questions
              .where(
                (question) =>
                    !used.contains(question.id) &&
                    question.difficulty >= minDifficulty &&
                    question.difficulty <= maxDifficulty,
              )
              .toList()
            ..shuffle(_random);

      for (final candidate in candidates) {
        if (chosen.length == stage.questionCount) break;
        chosen.add(candidate);
        used.add(candidate.id);
      }

      if (minDifficulty == 1 && maxDifficulty == 5) break;
      minDifficulty = minDifficulty > 1 ? minDifficulty - 1 : 1;
      maxDifficulty = maxDifficulty < 5 ? maxDifficulty + 1 : 5;
    }

    chosen.sort((a, b) => a.difficulty.compareTo(b.difficulty));
    return chosen;
  }
}
