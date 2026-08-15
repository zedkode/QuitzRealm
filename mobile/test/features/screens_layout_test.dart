import 'package:flutter/material.dart';
import 'package:flutter_riverpod/flutter_riverpod.dart';
import 'package:flutter_test/flutter_test.dart';
import 'package:quiz_realm/core/providers/game_providers.dart';
import 'package:quiz_realm/data/progress/progress_store.dart';
import 'package:quiz_realm/domain/campaign/campaign_progress.dart';
import 'package:quiz_realm/features/battle/battle_screen.dart';
import 'package:quiz_realm/features/map/world_map_screen.dart';
import 'package:quiz_realm/features/title/title_screen.dart';
import 'package:quiz_realm/l10n/app_localizations.dart';

import '../support/fake_round_source.dart';

/// Dimensiuni reale de telefon: dacă ceva se revarsă, testul cade aici, nu în
/// mâna jucătorului.
const _phoneSizes = <String, Size>{
  'mic': Size(360, 640),
  'obișnuit': Size(411, 914),
  'mare': Size(430, 932),
};

Future<void> _pump(
  WidgetTester tester,
  Widget screen, {
  required Size size,
  CampaignProgress progress = CampaignProgress.empty,
}) async {
  tester.view
    ..physicalSize = size
    ..devicePixelRatio = 1;
  addTearDown(tester.view.reset);

  await tester.pumpWidget(
    ProviderScope(
      overrides: [
        progressStoreProvider.overrideWithValue(
          InMemoryProgressStore(progress),
        ),
        roundSourceProvider.overrideWith(
          (ref, target) => FakeRoundSource.withQuestions(5),
        ),
      ],
      child: MaterialApp(
        locale: const Locale('ro'),
        localizationsDelegates: AppLocalizations.localizationsDelegates,
        supportedLocales: AppLocalizations.supportedLocales,
        home: screen,
      ),
    ),
  );
  await tester.pump();
  await tester.pump(const Duration(milliseconds: 300));
}

void main() {
  for (final entry in _phoneSizes.entries) {
    group('ecran ${entry.key} (${entry.value.width}×${entry.value.height})', () {
      testWidgets('ecranul-titlu încape', (tester) async {
        await _pump(tester, const TitleScreen(), size: entry.value);

        expect(tester.takeException(), isNull);
        expect(find.byKey(const Key('menu-play')), findsOneWidget);
        expect(find.byKey(const Key('title-stars')), findsOneWidget);
      });

      testWidgets('harta regatului încape', (tester) async {
        await _pump(tester, const WorldMapScreen(), size: entry.value);

        expect(tester.takeException(), isNull);
        expect(find.byKey(const Key('realm-map')), findsOneWidget);
        expect(find.byKey(const Key('map-stars')), findsOneWidget);
      });

      testWidgets('ecranul de asalt încape', (tester) async {
        await _pump(
          tester,
          const BattleScreen(chapterId: 'istorie', stageIndex: 0),
          size: entry.value,
        );

        expect(tester.takeException(), isNull);
        expect(find.byKey(const Key('question-text')), findsOneWidget);
      });
    });
  }

  testWidgets('ținuturile blocate se văd blocate pe hartă', (tester) async {
    await _pump(
      tester,
      const WorldMapScreen(),
      size: const Size(430, 932),
    );

    expect(find.byKey(const Key('chapter-istorie-open')), findsOneWidget);
    expect(find.byKey(const Key('chapter-mituri-locked')), findsOneWidget);
  });

  testWidgets('stelele câștigate deblochează ținutul următor', (tester) async {
    await _pump(
      tester,
      const WorldMapScreen(),
      size: const Size(430, 932),
      progress: const CampaignProgress(
        starsByStage: {'istorie/0': 3, 'istorie/1': 3},
        xp: 400,
      ),
    );
    await tester.pump(const Duration(milliseconds: 300));

    expect(find.byKey(const Key('chapter-romania-open')), findsOneWidget);
    expect(find.byKey(const Key('chapter-mituri-locked')), findsOneWidget);
  });

  testWidgets('foaia de asalturi deschide etapele deblocate', (tester) async {
    await _pump(
      tester,
      const WorldMapScreen(),
      size: const Size(430, 932),
      progress: const CampaignProgress(starsByStage: {'istorie/0': 2}),
    );
    await tester.pump(const Duration(milliseconds: 300));

    // Fundalul animat rulează la nesfârșit, deci nu folosim pumpAndSettle.
    await tester.tap(find.byKey(const Key('chapter-istorie-open')));
    await tester.pump();
    await tester.pump(const Duration(milliseconds: 400));

    expect(find.byKey(const Key('start-istorie-0')), findsOneWidget);
    expect(find.byKey(const Key('start-istorie-1')), findsOneWidget);
    expect(find.byKey(const Key('start-istorie-2')), findsNothing);
  });
}
