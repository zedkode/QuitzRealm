import 'package:flutter_test/flutter_test.dart';
import 'package:quiz_realm/data/pack/local_round_source.dart';
import 'package:quiz_realm/data/pack/question_pack_loader.dart';
import 'package:quiz_realm/domain/campaign/realm_chapter.dart';

/// Verifică drumul real: assets declarate în pubspec → încărcate prin bundle →
/// transformate într-un asalt jucabil. Fără acest test, o linie lipsă din
/// `pubspec.yaml` ar trece de toate celelalte verificări.
void main() {
  TestWidgetsFlutterBinding.ensureInitialized();

  test('fiecare ținut poate fi jucat din assets-urile aplicației', () async {
    final loader = QuestionPackLoader();

    for (final chapter in RealmChapter.all) {
      final pack = await loader.load(chapter.packAsset);
      expect(pack.questions, isNotEmpty, reason: chapter.packAsset);

      for (final stage in RealmChapter.stages) {
        final source = LocalRoundSource(
          chapter: chapter,
          stage: stage,
          loader: loader,
        );
        final round = await source.loadRound();

        expect(
          round,
          hasLength(stage.questionCount),
          reason: '${chapter.id} / asaltul ${stage.index}',
        );
        for (final question in round) {
          final verdict = await source.judge(
            questionId: question.id,
            answer: 'răspuns evident greșit ${question.id}',
          );
          expect(verdict.isCorrect, isFalse);
          expect(verdict.correctAnswer, isNotEmpty);
        }
      }
    }
  });
}
