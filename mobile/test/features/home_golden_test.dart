import 'dart:io';

import 'package:flutter/material.dart';
import 'package:flutter/services.dart';
import 'package:flutter_riverpod/flutter_riverpod.dart';
import 'package:flutter_test/flutter_test.dart';
import 'package:quiz_realm/core/providers/game_providers.dart';
import 'package:quiz_realm/data/progress/progress_store.dart';
import 'package:quiz_realm/domain/campaign/campaign_progress.dart';
import 'package:quiz_realm/features/title/title_screen.dart';
import 'package:quiz_realm/l10n/app_localizations.dart';

import '../support/fake_round_source.dart';

/// Captură de referință a tabloului de bord.
///
/// Rulează cu `flutter test --update-goldens` pentru a regenera imaginea și a o
/// compara ochi în ochi cu `design-reference/02-home-dashboard.png`. Fără
/// fonturile reale încărcate, captura ar arăta casete în loc de titluri, deci
/// Cinzel se încarcă explicit.
///
/// Citirea de pe disc trebuie să treacă prin [WidgetTester.runAsync]: în zona
/// de timp simulat a testului, un Future de I/O real nu se rezolvă niciodată,
/// iar testul atârnă în loc să cadă.
Future<void> _loadFonts(WidgetTester tester) async {
  await tester.runAsync(() async {
    final bytes = await File('assets/fonts/Cinzel-Variable.ttf').readAsBytes();
    final loader = FontLoader('Cinzel')
      ..addFont(Future.value(ByteData.view(bytes.buffer)));
    await loader.load();
  });
}

void main() {
  testWidgets('tabloul de bord — captură de referință', (tester) async {
    await _loadFonts(tester);

    tester.view
      ..physicalSize = const Size(412, 915)
      ..devicePixelRatio = 1;
    addTearDown(tester.view.reset);

    await tester.pumpWidget(
      ProviderScope(
        overrides: [
          progressStoreProvider.overrideWithValue(
            InMemoryProgressStore(
              const CampaignProgress(
                starsByStage: {'istorie/0': 3, 'istorie/1': 2},
                xp: 420,
              ),
            ),
          ),
          roundSourceProvider.overrideWith(
            (ref, target) => FakeRoundSource.withQuestions(5),
          ),
        ],
        child: MaterialApp(
          locale: const Locale('ro'),
          localizationsDelegates: AppLocalizations.localizationsDelegates,
          supportedLocales: AppLocalizations.supportedLocales,
          home: const TitleScreen(),
        ),
      ),
    );
    await tester.pump();
    await tester.pump(const Duration(milliseconds: 400));

    await expectLater(
      find.byType(TitleScreen),
      matchesGoldenFile('goldens/home_dashboard.png'),
    );
  });
}
