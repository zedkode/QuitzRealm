import 'dart:convert';
import 'dart:io';

import 'package:flutter_test/flutter_test.dart';
import 'package:quiz_realm/data/pack/question_pack.dart';
import 'package:quiz_realm/domain/campaign/realm_chapter.dart';
import 'package:quiz_realm/domain/question/quiz_question.dart';

void main() {
  group('PackQuestion.accepts', () {
    test('grila ignoră diacriticele și majusculele', () {
      final question = PackQuestion.fromJson(const {
        'id': 'q1',
        'type': 'choice',
        'difficulty': 1,
        'text': 'Cel mai înalt vârf?',
        'options': ['Vârful Moldoveanu', 'Vârful Omu'],
        'answer': 'Vârful Moldoveanu',
        'explanation': '',
      });

      expect(question.accepts('vârful moldoveanu'), isTrue);
      expect(question.accepts('  Varful Moldoveanu '), isTrue);
      expect(question.accepts('Vârful Omu'), isFalse);
      expect(question.accepts('   '), isFalse);
    });

    test('numericul acceptă virgula zecimală și toleranța', () {
      final question = PackQuestion.fromJson(const {
        'id': 'q2',
        'type': 'numeric',
        'difficulty': 3,
        'text': 'Câți kilometri?',
        'answer': '300',
        'explanation': '',
        'tolerance': 1,
      });

      expect(question.accepts('300'), isTrue);
      expect(question.accepts('299'), isTrue);
      expect(question.accepts('301,0'), isTrue);
      expect(question.accepts('305'), isFalse);
      expect(question.accepts('trei sute'), isFalse);
    });

    test('numericul fără toleranță cere valoarea exactă', () {
      final question = PackQuestion.fromJson(const {
        'id': 'q3',
        'type': 'numeric',
        'difficulty': 2,
        'text': 'În ce an?',
        'answer': '1918',
        'explanation': '',
      });

      expect(question.accepts('1918'), isTrue);
      expect(question.accepts('1919'), isFalse);
    });
  });

  group('validare la parsare', () {
    test('respinge grila al cărei răspuns nu e printre variante', () {
      expect(
        () => PackQuestion.fromJson(const {
          'id': 'bad',
          'type': 'choice',
          'difficulty': 1,
          'text': 'Test',
          'options': ['A', 'B'],
          'answer': 'C',
          'explanation': '',
        }),
        throwsA(isA<FormatException>()),
      );
    });

    test('respinge întrebarea fără răspuns', () {
      expect(
        () => PackQuestion.fromJson(const {
          'id': 'bad',
          'type': 'numeric',
          'difficulty': 1,
          'text': 'Test',
          'answer': '',
          'explanation': '',
        }),
        throwsA(isA<FormatException>()),
      );
    });
  });

  group('pachetele livrate cu jocul', () {
    test('fiecare ținut are un pachet valid și explicații', () {
      for (final chapter in RealmChapter.all) {
        final file = File(chapter.packAsset);
        expect(file.existsSync(), isTrue, reason: 'lipsă ${chapter.packAsset}');

        final pack = QuestionPack.fromJson(
          jsonDecode(file.readAsStringSync()) as Map<String, Object?>,
        );

        expect(pack.id, chapter.id);
        expect(pack.name, isNotEmpty);
        expect(
          pack.questions.length,
          greaterThanOrEqualTo(15),
          reason: '${chapter.id} are prea puține întrebări',
        );

        final ids = <String>{};
        final texts = <String>{};
        for (final question in pack.questions) {
          expect(ids.add(question.id), isTrue, reason: 'id dublat în $chapter');
          expect(
            texts.add(question.text.toLowerCase()),
            isTrue,
            reason: 'întrebare dublată în ${chapter.id}',
          );
          expect(question.text, isNotEmpty);
          expect(
            question.explanation,
            isNotEmpty,
            reason: '${question.id} nu explică răspunsul',
          );
          expect(question.accepts(question.answer), isTrue);
          if (question.type == QuizQuestionType.multipleChoice) {
            expect(question.options.length, 4);
            expect(question.options.toSet().length, 4);
          }
        }
      }
    });

    test('fiecare ținut acoperă toate benzile de dificultate ale asalturilor', () {
      for (final chapter in RealmChapter.all) {
        final pack = QuestionPack.fromJson(
          jsonDecode(File(chapter.packAsset).readAsStringSync())
              as Map<String, Object?>,
        );

        for (final stage in RealmChapter.stages) {
          final inBand = pack.questions
              .where(
                (question) =>
                    question.difficulty >= stage.minDifficulty &&
                    question.difficulty <= stage.maxDifficulty,
              )
              .length;
          expect(
            inBand,
            greaterThanOrEqualTo(stage.questionCount ~/ 2),
            reason:
                '${chapter.id}: banda ${stage.minDifficulty}-'
                '${stage.maxDifficulty} e prea săracă',
          );
        }
      }
    });
  });
}
