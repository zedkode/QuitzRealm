import 'package:flutter/material.dart';

/// Paleta jocului. Totul pornește de aici: noapte adâncă, piatră, aur și
/// pergament — un regat medieval-fantasy, nu o aplicație corporate.
abstract final class GamePalette {
  // Fundal / noapte
  static const night = Color(0xFF080B1C);
  static const nightDeep = Color(0xFF04060F);
  static const dusk = Color(0xFF141A3C);
  static const twilight = Color(0xFF262E5E);

  // Piatră (panouri)
  static const stone900 = Color(0xFF10152E);
  static const stone800 = Color(0xFF1A2144);
  static const stone700 = Color(0xFF242C59);
  static const stone600 = Color(0xFF343E73);

  // Aur (accent principal)
  static const gold = Color(0xFFF0B542);
  static const goldBright = Color(0xFFFFD98A);
  static const goldDeep = Color(0xFFA9761C);

  // Pergament (carduri de întrebare)
  static const parchment = Color(0xFFF6E7C6);
  static const parchmentShade = Color(0xFFE4CE9F);
  static const ink = Color(0xFF3A2A14);
  static const inkSoft = Color(0xFF6B573A);

  // Stări de joc
  static const emerald = Color(0xFF3FCF8E);
  static const emeraldDeep = Color(0xFF1B7A52);
  static const crimson = Color(0xFFE4574B);
  static const crimsonDeep = Color(0xFF8E2A22);
  static const arcane = Color(0xFF5BC8FF);
  static const arcaneDeep = Color(0xFF1F5F8B);
  static const amethyst = Color(0xFF9B6BFF);

  // Text pe fundal întunecat
  static const cream = Color(0xFFFFF3DA);
  static const creamDim = Color(0xFFBFC4E0);
}

/// Fonturi și stiluri reutilizate în tot jocul.
abstract final class GameText {
  static const display = TextStyle(
    fontFamily: 'Cinzel',
    fontWeight: FontWeight.w900,
    fontSize: 34,
    height: 1.05,
    color: GamePalette.cream,
    letterSpacing: 0.5,
  );

  static const title = TextStyle(
    fontFamily: 'Cinzel',
    fontWeight: FontWeight.w800,
    fontSize: 22,
    height: 1.15,
    color: GamePalette.cream,
  );

  static const heading = TextStyle(
    fontFamily: 'Cinzel',
    fontWeight: FontWeight.w800,
    fontSize: 17,
    color: GamePalette.cream,
  );

  static const button = TextStyle(
    fontFamily: 'Cinzel',
    fontWeight: FontWeight.w900,
    fontSize: 15,
    letterSpacing: 1.1,
  );

  static const eyebrow = TextStyle(
    fontFamily: 'Cinzel',
    fontWeight: FontWeight.w900,
    fontSize: 10.5,
    letterSpacing: 2.2,
    color: GamePalette.gold,
  );

  static const body = TextStyle(
    fontSize: 14.5,
    height: 1.4,
    color: GamePalette.cream,
  );

  static const bodyDim = TextStyle(
    fontSize: 13.5,
    height: 1.4,
    color: GamePalette.creamDim,
  );

  /// Cifre pentru HUD — lățime fixă, ca să nu „sară” scorul.
  static const numeric = TextStyle(
    fontFamily: 'Cinzel',
    fontWeight: FontWeight.w900,
    fontSize: 18,
    color: GamePalette.cream,
    fontFeatures: [FontFeature.tabularFigures()],
  );
}

class AppTheme {
  const AppTheme._();

  // Alias-uri păstrate pentru codul și testele existente.
  static const midnight = GamePalette.night;
  static const realmTeal = GamePalette.arcane;
  static const conquestGold = GamePalette.gold;
  static const panel = GamePalette.stone800;
  static const parchment = GamePalette.cream;
  static const danger = GamePalette.crimson;

  static ThemeData get dark {
    final scheme =
        ColorScheme.fromSeed(
          seedColor: GamePalette.gold,
          brightness: Brightness.dark,
          surface: GamePalette.night,
        ).copyWith(
          primary: GamePalette.gold,
          onPrimary: GamePalette.stone900,
          secondary: GamePalette.arcane,
          onSecondary: GamePalette.stone900,
          surfaceContainer: GamePalette.stone800,
          error: GamePalette.crimson,
          onSurface: GamePalette.cream,
        );

    return ThemeData(
      useMaterial3: true,
      brightness: Brightness.dark,
      colorScheme: scheme,
      scaffoldBackgroundColor: GamePalette.night,
      splashColor: GamePalette.gold.withValues(alpha: 0.12),
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
        fillColor: GamePalette.stone900,
        labelStyle: const TextStyle(color: GamePalette.creamDim),
        border: OutlineInputBorder(
          borderRadius: BorderRadius.circular(12),
          borderSide: BorderSide.none,
        ),
        enabledBorder: OutlineInputBorder(
          borderRadius: BorderRadius.circular(12),
          borderSide: BorderSide(color: GamePalette.gold.withValues(alpha: 0.4)),
        ),
        focusedBorder: OutlineInputBorder(
          borderRadius: BorderRadius.circular(12),
          borderSide: const BorderSide(color: GamePalette.gold, width: 1.6),
        ),
      ),
      filledButtonTheme: FilledButtonThemeData(
        style: FilledButton.styleFrom(
          minimumSize: const Size.fromHeight(52),
          backgroundColor: GamePalette.gold,
          foregroundColor: GamePalette.stone900,
          shape: const BeveledRectangleBorder(
            borderRadius: BorderRadius.all(Radius.circular(8)),
          ),
          textStyle: GameText.button,
        ),
      ),
      textButtonTheme: TextButtonThemeData(
        style: TextButton.styleFrom(
          foregroundColor: GamePalette.goldBright,
          textStyle: const TextStyle(fontWeight: FontWeight.w700),
        ),
      ),
      iconTheme: const IconThemeData(color: GamePalette.cream),
      progressIndicatorTheme: const ProgressIndicatorThemeData(
        color: GamePalette.gold,
      ),
    );
  }
}
