import 'package:flutter/material.dart';
import 'package:flutter_riverpod/flutter_riverpod.dart';

import 'core/router/app_router.dart';
import 'core/theme/app_theme.dart';
import 'features/settings/settings_controller.dart';
import 'l10n/app_localizations.dart';

class QuizRealmApp extends ConsumerWidget {
  const QuizRealmApp({super.key});

  @override
  Widget build(BuildContext context, WidgetRef ref) {
    // Limba vine din setări, nu e fixată în cod: altfel comutatorul din ecranul
    // de setări ar schimba o valoare pe care n-o citește nimeni.
    final languageCode = ref.watch(
      settingsProvider.select((settings) => settings.languageCode),
    );

    return MaterialApp.router(
      onGenerateTitle: (context) => AppLocalizations.of(context).appTitle,
      debugShowCheckedModeBanner: false,
      theme: AppTheme.dark,
      routerConfig: ref.watch(appRouterProvider),
      locale: Locale(languageCode),
      localizationsDelegates: AppLocalizations.localizationsDelegates,
      supportedLocales: AppLocalizations.supportedLocales,
    );
  }
}
