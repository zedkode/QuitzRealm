import 'package:flutter/material.dart';

import '../design/quizrealm_tokens.dart';

/// Strat de compatibilitate pentru ecranele care folosesc încă componentele
/// `Game*`. Toate valorile sunt aliniate la tokenii canonici QuizRealm, astfel
/// încât migrarea ecranelor poate fi făcută gradual fără două identități vizuale.
abstract final class GamePalette {
  // Fundal / noapte
  static const night = QuizRealmColors.background;
  static const nightDeep = QuizRealmColors.backgroundDeep;
  static const dusk = Color(0xFF03162B);
  static const twilight = QuizRealmColors.surfaceRaised;

  // Suprafețe de joc
  static const stone900 = QuizRealmColors.surfacePanel;
  static const stone800 = QuizRealmColors.surfaceRaised;
  static const stone700 = QuizRealmColors.surfaceRow;
  static const stone600 = Color(0xFF0A2948);

  // Aur metalic
  static const gold = QuizRealmColors.gold;
  static const goldLight = QuizRealmColors.goldLight;
  static const goldBright = QuizRealmColors.goldBright;
  static const goldDeep = QuizRealmColors.goldDeep;

  // Aliasuri păstrate pentru compatibilitatea vechilor panouri de întrebare.
  static const parchment = QuizRealmColors.surfaceRaised;
  static const parchmentShade = QuizRealmColors.surfacePanel;
  static const ink = QuizRealmColors.textPrimary;
  static const inkSoft = QuizRealmColors.textSecondary;

  // Stări de joc
  static const emerald = QuizRealmColors.success;
  static const emeraldDeep = Color(0xFF1D7A3A);
  static const crimson = QuizRealmColors.crimson;
  static const crimsonDeep = QuizRealmColors.crimsonDeep;
  static const arcane = QuizRealmColors.electric;
  static const arcaneDeep = QuizRealmColors.royalBlueDeep;
  static const amethyst = Color(0xFF7A6CFF);

  // Text
  static const cream = QuizRealmColors.textPrimary;
  static const creamDim = QuizRealmColors.textSecondary;
}

/// Stilurile moștenite rămân pentru compatibilitate, dar folosesc acum aceeași
/// tipografie și aceleași contraste ca sistemul de design curent.
abstract final class GameText {
  static const display = TextStyle(
    fontFamily: 'Cinzel',
    fontWeight: FontWeight.w800,
    fontSize: 34,
    height: 1.05,
    color: QuizRealmColors.goldLight,
    letterSpacing: 1.1,
  );

  static const title = TextStyle(
    fontFamily: 'Cinzel',
    fontWeight: FontWeight.w700,
    fontSize: 22,
    height: 1.15,
    color: QuizRealmColors.goldBright,
    letterSpacing: 1.2,
  );

  static const heading = TextStyle(
    fontFamily: 'Cinzel',
    fontWeight: FontWeight.w700,
    fontSize: 17,
    color: QuizRealmColors.goldBright,
    letterSpacing: 0.8,
  );

  static const button = TextStyle(
    fontFamily: 'Cinzel',
    fontWeight: FontWeight.w700,
    fontSize: 15,
    letterSpacing: 1.4,
  );

  static const eyebrow = TextStyle(
    fontFamily: 'Cinzel',
    fontWeight: FontWeight.w700,
    fontSize: 10.5,
    letterSpacing: 1.9,
    color: QuizRealmColors.goldBright,
  );

  static const body = TextStyle(
    fontSize: 14.5,
    height: 1.4,
    color: QuizRealmColors.textPrimary,
  );

  static const bodyDim = TextStyle(
    fontSize: 13.5,
    height: 1.4,
    color: QuizRealmColors.textSecondary,
  );

  static const numeric = TextStyle(
    fontFamily: 'Cinzel',
    fontWeight: FontWeight.w800,
    fontSize: 18,
    color: QuizRealmColors.textPrimary,
    fontFeatures: [FontFeature.tabularFigures()],
  );
}

class AppTheme {
  const AppTheme._();

  static const midnight = GamePalette.night;
  static const realmTeal = GamePalette.arcane;
  static const conquestGold = GamePalette.gold;
  static const panel = GamePalette.stone800;
  static const parchment = GamePalette.cream;
  static const danger = GamePalette.crimson;

  static ThemeData get dark {
    final scheme = ColorScheme.fromSeed(
      seedColor: QuizRealmColors.gold,
      brightness: Brightness.dark,
      surface: QuizRealmColors.surfacePanel,
    ).copyWith(
      primary: QuizRealmColors.gold,
      onPrimary: QuizRealmColors.textOnGold,
      secondary: QuizRealmColors.electric,
      onSecondary: QuizRealmColors.backgroundDeep,
      surfaceContainer: QuizRealmColors.surfaceRaised,
      error: QuizRealmColors.crimson,
      onSurface: QuizRealmColors.textPrimary,
    );

    return ThemeData(
      useMaterial3: true,
      brightness: Brightness.dark,
      colorScheme: scheme,
      scaffoldBackgroundColor: QuizRealmColors.background,
      splashColor: QuizRealmColors.electric.withValues(alpha: 0.16),
      highlightColor: Colors.transparent,
      textTheme: const TextTheme(
        displaySmall: GameText.display,
        headlineMedium: GameText.title,
        headlineSmall: GameText.heading,
        titleLarge: GameText.title,
        titleMedium: GameText.heading,
        bodyLarge: GameText.body,
        bodyMedium: GameText.bodyDim,
      ),
      inputDecorationTheme: InputDecorationTheme(
        filled: true,
        fillColor: QuizRealmColors.surfaceRaised,
        labelStyle: const TextStyle(color: QuizRealmColors.textSecondary),
        hintStyle: const TextStyle(color: QuizRealmColors.textMuted),
        border: OutlineInputBorder(
          borderRadius: BorderRadius.circular(QuizRealmRadius.md),
          borderSide: const BorderSide(color: QuizRealmColors.goldDeep),
        ),
        enabledBorder: OutlineInputBorder(
          borderRadius: BorderRadius.circular(QuizRealmRadius.md),
          borderSide: const BorderSide(color: QuizRealmColors.goldDeep),
        ),
        focusedBorder: OutlineInputBorder(
          borderRadius: BorderRadius.circular(QuizRealmRadius.md),
          borderSide: const BorderSide(color: QuizRealmColors.electric, width: 2),
        ),
      ),
      filledButtonTheme: FilledButtonThemeData(
        style: FilledButton.styleFrom(
          minimumSize: const Size.fromHeight(52),
          backgroundColor: QuizRealmColors.royalBlueDeep,
          foregroundColor: QuizRealmColors.goldLight,
          side: const BorderSide(color: QuizRealmColors.gold, width: 1.5),
          shape: RoundedRectangleBorder(
            borderRadius: BorderRadius.circular(QuizRealmRadius.md),
          ),
          textStyle: GameText.button,
        ),
      ),
      textButtonTheme: TextButtonThemeData(
        style: TextButton.styleFrom(
          foregroundColor: QuizRealmColors.goldBright,
          textStyle: const TextStyle(fontWeight: FontWeight.w700),
        ),
      ),
      iconTheme: const IconThemeData(color: QuizRealmColors.goldBright),
      progressIndicatorTheme: const ProgressIndicatorThemeData(
        color: QuizRealmColors.electric,
      ),
    );
  }
}
