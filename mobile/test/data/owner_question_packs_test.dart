import 'dart:convert';
import 'dart:io';

import 'package:flutter_test/flutter_test.dart';
import 'package:quiz_realm/data/pack/owner_question_pack_catalog.dart';
import 'package:quiz_realm/data/pack/question_pack.dart';
import 'package:quiz_realm/domain/question/quiz_question.dart';

/// Verifică pachetele celor 20 de categorii.
///
/// Testul nu fixează un număr de întrebări: proprietarul adaugă în continuare,
/// iar un prag exact ar cădea la fiecare lot nou și ar fi „reparat" prin
/// creșterea numărului — adică n-ar mai verifica nimic. Verifică în schimb ce
/// trebuie să rămână adevărat oricât ar crește pachetele: fără duplicate, fără
/// întrebări fără răspuns corect între variante, fără explicații lipsă.
void main() {
  /// Minimul sub care un asalt ar repeta întrebări în aceeași sesiune.
  const minimumQuestions = 50;

  test('cele 20 de categorii sunt valide structural', () {
    expect(ownerQuestionPacks, hasLength(20));
    expect(
      ownerQuestionPacks.map((definition) => definition.code).toSet(),
      hasLength(20),
    );

    final globalIds = <String>{};
    final globalTexts = <String>{};
    final totals = <String, int>{};

    for (final definition in ownerQuestionPacks) {
      final file = File(definition.assetPath);
      expect(file.existsSync(), isTrue, reason: 'Lipsește ${file.path}');

      final raw = jsonDecode(file.readAsStringSync()) as Map<String, Object?>;
      expect(raw['id'], definition.code);
      // Numele afișat vine din pachet, nu din cod: proprietarul l-a trecut în
      // română, iar aplicația trebuie să-l urmeze fără o modificare de cod.
      expect((raw['name'] as String?)?.trim(), isNotEmpty);

      final pack = QuestionPack.fromJson(raw);
      expect(
        pack.questions.length,
        greaterThanOrEqualTo(minimumQuestions),
        reason: definition.code,
      );
      totals[definition.code] = pack.questions.length;

      final difficulties = <int>{};
      for (final question in pack.questions) {
        expect(
          globalIds.add(question.id),
          isTrue,
          reason: 'id dublat: ${question.id}',
        );
        expect(
          globalTexts.add(question.text.toLowerCase().trim()),
          isTrue,
          reason: 'întrebare dublată: ${question.text}',
        );
        expect(
          question.explanation.trim(),
          isNotEmpty,
          reason: '${question.id} nu explică răspunsul',
        );
        expect(question.id.trim(), isNotEmpty, reason: question.text);
        // Pachetele au și întrebări numerice, nu doar grile — tipul e suportat
        // de motor, deci verificăm fiecare tip după regulile lui.
        if (question.type == QuizQuestionType.multipleChoice) {
          expect(question.options, hasLength(4), reason: question.id);
          expect(question.options.toSet(), hasLength(4), reason: question.id);
          expect(question.options, contains(question.answer));
        } else {
          expect(question.answer.trim(), isNotEmpty, reason: question.id);
        }
        expect(question.accepts(question.answer), isTrue, reason: question.id);
        difficulties.add(question.difficulty);
      }
      expect(difficulties, {1, 2, 3, 4, 5}, reason: definition.code);
    }

    // Nu e o aserțiune, ci urma din jurnal: la fiecare lot nou se vede cât a
    // crescut fiecare categorie.
    final total = totals.values.fold(0, (sum, count) => sum + count);
    printOnFailure('Întrebări per categorie: $totals');
    expect(total, greaterThanOrEqualTo(20 * minimumQuestions));
  });
}
