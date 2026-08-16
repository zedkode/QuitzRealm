import 'package:flutter_test/flutter_test.dart';
import 'package:quiz_realm/data/pack/category_round_source.dart';
import 'package:quiz_realm/data/pack/question_pack_loader.dart';
import 'package:quiz_realm/domain/campaign/realm_chapter.dart';

void main() {
  TestWidgetsFlutterBinding.ensureInitialized();

  const stage = BattleStage(
    index: 0,
    questionCount: 12,
    minDifficulty: 1,
    maxDifficulty: 3,
  );

  test('combină mai multe categorii într-o singură rundă', () async {
    final source = CategoryRoundSource(
      packAssets: const [
        'assets/questions/history.json',
        'assets/questions/science.json',
      ],
      stage: stage,
      loader: QuestionPackLoader(),
    );

    final round = await source.loadRound();

    expect(round, hasLength(stage.questionCount));
    expect(round.map((question) => question.id).toSet(), hasLength(round.length));
  });

  test('nu repetă o întrebare care apare în două categorii bifate', () async {
    // „Cultură Generală" reia intenționat întrebări din literatură. Fără
    // deduplicare, o rundă pe ambele ar putea pune aceeași întrebare de două
    // ori — exact ce nu are voie să se întâmple într-un meci.
    final loader = QuestionPackLoader();
    final literature = await loader.load('assets/questions/literature.json');
    final general = await loader.load('assets/questions/general-knowledge.json');

    final literatureTexts = literature.questions
        .map((question) => question.text.toLowerCase().trim())
        .toSet();
    final overlap = general.questions
        .where(
          (question) =>
              literatureTexts.contains(question.text.toLowerCase().trim()),
        )
        .length;
    expect(
      overlap,
      greaterThan(0),
      reason: 'testul presupune o suprapunere reală între pachete',
    );

    final source = CategoryRoundSource(
      packAssets: const [
        'assets/questions/literature.json',
        'assets/questions/general-knowledge.json',
      ],
      stage: const BattleStage(
        index: 0,
        // Runda cere mai multe întrebări decât are literatura singură, ca
        // selecția să ajungă sigur și în pachetul care se suprapune.
        questionCount: 40,
        minDifficulty: 1,
        maxDifficulty: 5,
      ),
      loader: loader,
    );

    final round = await source.loadRound();
    final texts = round
        .map((question) => question.text.toLowerCase().trim())
        .toList();

    expect(texts.toSet(), hasLength(texts.length));
  });

  test('judecă răspunsul din categoria din care a venit întrebarea', () async {
    final source = CategoryRoundSource(
      packAssets: const ['assets/questions/geography.json'],
      stage: stage,
      loader: QuestionPackLoader(),
    );

    final round = await source.loadRound();
    final verdict = await source.judge(
      questionId: round.first.id,
      answer: 'răspuns evident greșit',
    );

    expect(verdict.isCorrect, isFalse);
    expect(verdict.correctAnswer, isNotEmpty);
    expect(verdict.explanation, isNotNull);
  });

  test('judge() înainte de loadRound() este o eroare de programare', () async {
    final source = CategoryRoundSource(
      packAssets: const ['assets/questions/logic.json'],
      stage: stage,
      loader: QuestionPackLoader(),
    );

    expect(
      () => source.judge(questionId: 'logic-001', answer: '15'),
      throwsStateError,
    );
  });
}
