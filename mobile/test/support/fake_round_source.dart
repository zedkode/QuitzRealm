import 'package:quiz_realm/domain/battle/round_source.dart';
import 'package:quiz_realm/domain/question/quiz_question.dart';

/// Sursă de întrebări controlabilă din teste.
class FakeRoundSource implements RoundSource {
  FakeRoundSource._(this._questions, {this.throwOnLoad = false});

  factory FakeRoundSource.withQuestions(
    int count, {
    QuizQuestionType type = QuizQuestionType.multipleChoice,
  }) {
    return FakeRoundSource._([
      for (var index = 0; index < count; index++)
        QuizQuestion(
          id: 'q$index',
          type: type,
          categoryId: 'istorie',
          difficulty: 1 + index % 5,
          text: 'Întrebarea $index?',
          options: type == QuizQuestionType.multipleChoice
              ? ['A$index', 'B$index', 'C$index', 'D$index']
              : const [],
          categoryName: 'Istorie',
        ),
    ]);
  }

  factory FakeRoundSource.empty() => FakeRoundSource._(const []);

  factory FakeRoundSource.failing() =>
      FakeRoundSource._(const [], throwOnLoad: true);

  final List<QuizQuestion> _questions;
  final bool throwOnLoad;

  bool failJudge = false;

  String correctAnswerFor(int index) {
    final question = _questions[index];
    return question.type == QuizQuestionType.numeric
        ? '${index + 1}'
        : 'A$index';
  }

  @override
  Future<List<QuizQuestion>> loadRound() async {
    if (throwOnLoad) throw Exception('sursă indisponibilă');
    return _questions;
  }

  @override
  Future<AnswerResult> judge({
    required String questionId,
    required String answer,
  }) async {
    if (failJudge) throw Exception('verdict indisponibil');
    final index = _questions.indexWhere(
      (question) => question.id == questionId,
    );
    final expected = correctAnswerFor(index);
    return AnswerResult(
      isCorrect: answer.trim() == expected,
      correctAnswer: expected,
      explanation: 'Explicația întrebării $index.',
    );
  }
}
