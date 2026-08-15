import 'package:flutter/material.dart';
import 'package:flutter_riverpod/flutter_riverpod.dart';
import 'package:flutter_test/flutter_test.dart';
import 'package:quiz_realm/core/providers/game_providers.dart';
import 'package:quiz_realm/data/progress/progress_store.dart';
import 'package:quiz_realm/domain/question/quiz_question.dart';
import 'package:quiz_realm/features/battle/battle_screen.dart';
import 'package:quiz_realm/features/battle/widgets/battle_hud.dart';
import 'package:quiz_realm/l10n/app_localizations.dart';

import '../../support/fake_round_source.dart';

Future<void> _pumpBattle(
  WidgetTester tester,
  FakeRoundSource source, {
  Size size = const Size(430, 1100),
}) async {
  tester.view
    ..physicalSize = size
    ..devicePixelRatio = 1;
  addTearDown(tester.view.reset);

  await tester.pumpWidget(
    ProviderScope(
      overrides: [
        roundSourceProvider.overrideWith((ref, target) => source),
        progressStoreProvider.overrideWithValue(InMemoryProgressStore()),
      ],
      child: MaterialApp(
        locale: const Locale('ro'),
        localizationsDelegates: AppLocalizations.localizationsDelegates,
        supportedLocales: AppLocalizations.supportedLocales,
        home: const BattleScreen(chapterId: 'istorie', stageIndex: 0),
      ),
    ),
  );
  await tester.pump();
  await tester.pump();
}

void main() {
  testWidgets('afișează întrebarea, HUD-ul și variantele de răspuns', (
    tester,
  ) async {
    await _pumpBattle(tester, FakeRoundSource.withQuestions(3));

    expect(find.byKey(const Key('question-text')), findsOneWidget);
    expect(find.text('Întrebarea 0?'), findsOneWidget);
    expect(find.byKey(const Key('battle-hud')), findsOneWidget);
    expect(find.byKey(const Key('battle-track')), findsOneWidget);
    expect(find.byKey(const Key('option-0')), findsOneWidget);
    expect(find.byKey(const Key('option-3')), findsOneWidget);
  });

  testWidgets('răspunsul corect arată verdictul și punctele', (tester) async {
    final source = FakeRoundSource.withQuestions(3);
    await _pumpBattle(tester, source);

    await tester.tap(find.byKey(const Key('option-0')));
    await tester.pump();
    await tester.pump(const Duration(milliseconds: 400));

    expect(find.byKey(const Key('feedback-correct')), findsOneWidget);
    expect(find.byKey(const Key('points-awarded')), findsOneWidget);
    expect(find.text('Explicația întrebării 0.'), findsOneWidget);
    expect(find.byKey(const Key('next-question')), findsOneWidget);
  });

  testWidgets('răspunsul greșit arată răspunsul corect', (tester) async {
    await _pumpBattle(tester, FakeRoundSource.withQuestions(3));

    await tester.tap(find.byKey(const Key('option-1')));
    await tester.pump();
    await tester.pump(const Duration(milliseconds: 500));

    expect(find.byKey(const Key('feedback-wrong')), findsOneWidget);
    expect(find.textContaining('A0'), findsWidgets);
  });

  testWidgets('cronometrul scade și declanșează timeout-ul', (tester) async {
    await _pumpBattle(tester, FakeRoundSource.withQuestions(3));

    final timer = tester.widget<BattleTimer>(find.byType(BattleTimer));
    expect(timer.seconds, 15);

    await tester.pump(const Duration(seconds: 1));
    expect(
      tester.widget<BattleTimer>(find.byType(BattleTimer)).seconds,
      14,
    );

    await tester.pump(const Duration(seconds: 14));
    await tester.pump();
    await tester.pump(const Duration(milliseconds: 400));

    expect(find.byKey(const Key('feedback-timeout')), findsOneWidget);
  });

  testWidgets('întrebarea numerică are câmp și buton de confirmare', (
    tester,
  ) async {
    final source = FakeRoundSource.withQuestions(
      2,
      type: QuizQuestionType.numeric,
    );
    await _pumpBattle(tester, source);

    expect(find.byKey(const Key('numeric-q0')), findsOneWidget);
    expect(find.byKey(const Key('submit-numeric')), findsOneWidget);

    await tester.enterText(find.byKey(const Key('numeric-q0')), '1');
    await tester.tap(find.byKey(const Key('submit-numeric')));
    await tester.pump();
    await tester.pump(const Duration(milliseconds: 400));

    expect(find.byKey(const Key('feedback-correct')), findsOneWidget);
  });

  testWidgets('la finalul asaltului apare ecranul de rezultat cu stele', (
    tester,
  ) async {
    final source = FakeRoundSource.withQuestions(2);
    await _pumpBattle(tester, source);

    for (var index = 0; index < 2; index++) {
      await tester.tap(find.byKey(const Key('option-0')));
      await tester.pump();
      await tester.pump(const Duration(milliseconds: 400));
      await tester.tap(find.byKey(const Key('next-question')));
      await tester.pump();
      await tester.pump(const Duration(milliseconds: 400));
    }

    expect(find.byKey(const Key('result-stars-3')), findsOneWidget);
    expect(find.byKey(const Key('result-xp')), findsOneWidget);
    expect(find.byKey(const Key('result-retry')), findsOneWidget);
    expect(find.byKey(const Key('result-map')), findsOneWidget);
    await tester.pump(const Duration(seconds: 2));
  });

  testWidgets('runda goală explică onest lipsa întrebărilor', (tester) async {
    await _pumpBattle(tester, FakeRoundSource.empty());

    expect(find.text('Ținutul e fără întrebări'), findsOneWidget);
  });
}
