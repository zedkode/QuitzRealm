import 'dart:io';

import 'package:flutter/material.dart';
import 'package:flutter/services.dart';
import 'package:flutter_riverpod/flutter_riverpod.dart';
import 'package:flutter_test/flutter_test.dart';
import 'package:quiz_realm/core/providers/repository_providers.dart';
import 'package:quiz_realm/data/settings/settings_store.dart';
import 'package:quiz_realm/features/settings/settings_controller.dart';
import 'package:quiz_realm/features/settings/settings_screen.dart';
import 'package:quiz_realm/l10n/app_localizations.dart';

import '../support/fake_auth_repository.dart';

/// Captură de referință a ecranului de setări, pentru comparație cu
/// `design-reference/03-settings.png`.
Future<void> _loadFonts(WidgetTester tester) async {
  await tester.runAsync(() async {
    final bytes = await File('assets/fonts/Cinzel-Variable.ttf').readAsBytes();
    final loader = FontLoader('Cinzel')
      ..addFont(Future.value(ByteData.view(bytes.buffer)));
    await loader.load();
  });
}

void main() {
  testWidgets('setările — captură de referință', (tester) async {
    await _loadFonts(tester);

    tester.view
      ..physicalSize = const Size(412, 915)
      ..devicePixelRatio = 1;
    addTearDown(tester.view.reset);

    await tester.pumpWidget(
      ProviderScope(
        overrides: [
          settingsStoreProvider.overrideWithValue(InMemorySettingsStore()),
          authRepositoryProvider.overrideWithValue(FakeAuthRepository()),
        ],
        child: MaterialApp(
          locale: const Locale('ro'),
          localizationsDelegates: AppLocalizations.localizationsDelegates,
          supportedLocales: AppLocalizations.supportedLocales,
          home: const SettingsScreen(),
        ),
      ),
    );
    await tester.pump();
    await tester.pump(const Duration(milliseconds: 400));

    expect(tester.takeException(), isNull);
    await expectLater(
      find.byType(SettingsScreen),
      matchesGoldenFile('goldens/settings.png'),
    );
  });
}
