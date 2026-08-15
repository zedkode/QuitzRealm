import '../../core/network/api_client.dart';
import '../../domain/question/question_repository.dart';
import '../../domain/question/quiz_question.dart';

class ApiQuestionRepository implements QuestionRepository {
  ApiQuestionRepository(this._api);

  final ApiClient _api;

  @override
  Future<List<QuizQuestion>> fetchApproved({int limit = 10}) async {
    final payload = await _api.get('questions?language=ro&limit=$limit');
    if (payload is! List) throw const FormatException('Invalid question list');
    return payload.map(_parseQuestion).toList(growable: false);
  }

  @override
  Future<AnswerResult> submitAnswer({
    required String questionId,
    required String answer,
  }) async {
    final payload = await _api.post(
      'questions/$questionId/answer',
      authenticated: true,
      body: {'answer': answer},
    );
    if (payload is! Map<String, dynamic>) {
      throw const FormatException('Invalid answer response');
    }
    return AnswerResult(
      isCorrect: payload['isCorrect'] == true,
      correctAnswer: payload['correctAnswer'] as String,
      explanation: payload['explanation'] as String?,
    );
  }

  QuizQuestion _parseQuestion(Object? value) {
    if (value is! Map<String, dynamic>) {
      throw const FormatException('Invalid question');
    }
    final rawType = value['type'] as String;
    final options = value['options'];
    final category = value['category'];
    return QuizQuestion(
      id: value['id'] as String,
      type: rawType == 'NUMERIC'
          ? QuizQuestionType.numeric
          : QuizQuestionType.multipleChoice,
      categoryId: value['categoryId'] as String,
      difficulty: value['difficulty'] as int,
      text: value['text'] as String,
      options: options is List
          ? options.map((option) => option.toString()).toList(growable: false)
          : const [],
      categoryName: category is Map<String, dynamic>
          ? category['name'] as String?
          : null,
      categoryIcon: category is Map<String, dynamic>
          ? category['icon'] as String?
          : null,
    );
  }
}
