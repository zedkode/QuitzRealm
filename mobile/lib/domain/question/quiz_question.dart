enum QuizQuestionType { multipleChoice, numeric }

class QuizQuestion {
  const QuizQuestion({
    required this.id,
    required this.type,
    required this.categoryId,
    required this.difficulty,
    required this.text,
    required this.options,
    this.categoryName,
    this.categoryIcon,
  });

  final String id;
  final QuizQuestionType type;
  final String categoryId;
  final int difficulty;
  final String text;
  final List<String> options;
  final String? categoryName;
  final String? categoryIcon;
}

class AnswerResult {
  const AnswerResult({
    required this.isCorrect,
    required this.correctAnswer,
    this.explanation,
  });

  final bool isCorrect;
  final String correctAnswer;
  final String? explanation;
}
