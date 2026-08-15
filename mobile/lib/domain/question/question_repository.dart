import 'quiz_question.dart';

abstract class QuestionRepository {
  Future<List<QuizQuestion>> fetchApproved({int limit = 10});

  Future<AnswerResult> submitAnswer({
    required String questionId,
    required String answer,
  });
}
