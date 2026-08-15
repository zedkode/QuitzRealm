import '../question/quiz_question.dart';

/// De unde vin întrebările unui asalt și cine decide dacă răspunsul e corect.
///
/// Implementarea online delegă verdictul serverului (clientul nu vede
/// niciodată răspunsul corect înainte de a trimite), iar implementarea locală
/// judecă pe baza pachetului curatoriat livrat cu aplicația.
abstract class RoundSource {
  Future<List<QuizQuestion>> loadRound();

  Future<AnswerResult> judge({
    required String questionId,
    required String answer,
  });
}

/// Aruncată când sursa nu are destule întrebări pentru un asalt.
class EmptyRoundException implements Exception {
  const EmptyRoundException();

  @override
  String toString() => 'EmptyRoundException';
}
