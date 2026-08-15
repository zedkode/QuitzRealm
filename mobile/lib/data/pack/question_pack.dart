import '../../domain/question/quiz_question.dart';

/// O întrebare din pachetul curatoriat livrat cu aplicația. Spre deosebire de
/// [QuizQuestion] (ce vede ecranul), aceasta conține și răspunsul corect —
/// nu ajunge niciodată direct în UI.
final class PackQuestion {
  const PackQuestion({
    required this.id,
    required this.type,
    required this.difficulty,
    required this.text,
    required this.options,
    required this.answer,
    required this.explanation,
    this.tolerance = 0,
  }) : assert(id != ''),
       assert(difficulty >= 1 && difficulty <= 5),
       assert(tolerance >= 0);

  final String id;
  final QuizQuestionType type;
  final int difficulty;
  final String text;
  final List<String> options;
  final String answer;
  final String explanation;
  final double tolerance;

  bool accepts(String candidate) {
    final trimmed = candidate.trim();
    if (trimmed.isEmpty) return false;
    if (type == QuizQuestionType.numeric) {
      final given = _parseNumber(trimmed);
      final expected = _parseNumber(answer);
      if (given == null || expected == null) return false;
      return (given - expected).abs() <= tolerance;
    }
    return _normalize(trimmed) == _normalize(answer);
  }

  QuizQuestion toQuizQuestion({
    required String categoryId,
    required String categoryName,
    List<String>? shuffledOptions,
  }) {
    return QuizQuestion(
      id: id,
      type: type,
      categoryId: categoryId,
      difficulty: difficulty,
      text: text,
      options: shuffledOptions ?? options,
      categoryName: categoryName,
    );
  }

  static PackQuestion fromJson(Map<String, Object?> json) {
    final rawOptions = json['options'];
    final rawType = json['type'];
    final type = rawType == 'numeric'
        ? QuizQuestionType.numeric
        : QuizQuestionType.multipleChoice;
    final options = rawOptions is List
        ? rawOptions.map((option) => option.toString()).toList(growable: false)
        : const <String>[];
    final answer = json['answer']?.toString() ?? '';
    final difficulty = json['difficulty'];
    final rawTolerance = json['tolerance'];

    if (answer.isEmpty) {
      throw FormatException('Întrebare fără răspuns: ${json['id']}');
    }
    if (type == QuizQuestionType.multipleChoice) {
      if (options.length < 2) {
        throw FormatException('Grilă fără variante: ${json['id']}');
      }
      if (!options.contains(answer)) {
        throw FormatException(
          'Răspunsul corect lipsește dintre variante: ${json['id']}',
        );
      }
    }

    return PackQuestion(
      id: json['id']?.toString() ?? '',
      type: type,
      difficulty: difficulty is int ? difficulty : 1,
      text: json['text']?.toString() ?? '',
      options: options,
      answer: answer,
      explanation: json['explanation']?.toString() ?? '',
      tolerance: rawTolerance is num ? rawTolerance.toDouble() : 0,
    );
  }
}

/// Pachetul de întrebări al unui ținut.
final class QuestionPack {
  const QuestionPack({
    required this.id,
    required this.name,
    required this.questions,
  });

  final String id;
  final String name;
  final List<PackQuestion> questions;

  PackQuestion? questionById(String id) {
    for (final question in questions) {
      if (question.id == id) return question;
    }
    return null;
  }

  static QuestionPack fromJson(Map<String, Object?> json) {
    final rawQuestions = json['questions'];
    if (rawQuestions is! List || rawQuestions.isEmpty) {
      throw const FormatException('Pachet de întrebări gol');
    }
    return QuestionPack(
      id: json['id']?.toString() ?? '',
      name: json['name']?.toString() ?? '',
      questions: rawQuestions
          .map(
            (question) =>
                PackQuestion.fromJson(question as Map<String, Object?>),
          )
          .toList(growable: false),
    );
  }
}

/// Acceptă atât scrierea românească (virgulă zecimală), cât și cea engleză.
double? _parseNumber(String value) {
  var cleaned = value.replaceAll(RegExp(r'[\s ]'), '');
  final hasComma = cleaned.contains(',');
  final hasDot = cleaned.contains('.');
  if (hasComma && hasDot) {
    // „1.234,5” — punctul e separator de mii.
    cleaned = cleaned.replaceAll('.', '').replaceAll(',', '.');
  } else if (hasComma) {
    cleaned = cleaned.replaceAll(',', '.');
  }
  return double.tryParse(cleaned);
}

const _diacritics = {
  'ă': 'a',
  'â': 'a',
  'î': 'i',
  'ș': 's',
  'ş': 's',
  'ț': 't',
  'ţ': 't',
  'á': 'a',
  'é': 'e',
  'í': 'i',
  'ó': 'o',
  'ö': 'o',
  'ú': 'u',
  'ü': 'u',
};

String _normalize(String value) {
  final lowered = value.toLowerCase().trim();
  final buffer = StringBuffer();
  for (final rune in lowered.runes) {
    final char = String.fromCharCode(rune);
    if (char == '„' || char == '”' || char == '"' || char == "'") continue;
    buffer.write(_diacritics[char] ?? char);
  }
  return buffer.toString().replaceAll(RegExp(r'\s+'), ' ');
}
