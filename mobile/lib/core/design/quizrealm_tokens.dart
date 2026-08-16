/// Tokenii de design ai QuizRealm, reconstruiți din `design-reference/`.
///
/// Valorile sunt **măsurate** din capturi, nu alese din ochi — vezi
/// `docs/design-system.md` pentru zona pe care a fost măsurat fiecare token.
///
/// Regula care ține sistemul întreg: **niciun ecran nu-și definește culori,
/// spațieri sau raze proprii.** O valoare care nu există aici e un defect, nu o
/// alegere de ecran.
library;

import 'package:flutter/widgets.dart';

/// Paleta. Numele descriu **rolul**, nu nuanța: `surfaceRaised`, nu
/// `navyLighter` — altfel o schimbare de nuanță ar face numele să mintă.
abstract final class QuizRealmColors {
  // --- Fundaluri și suprafețe ---

  /// Marginile ecranului și vigneta; cel mai închis ton din joc.
  static const backgroundDeep = Color(0xFF01060F);

  /// Fundalul de bază al oricărui ecran.
  static const background = Color(0xFF010C1A);

  /// Umplutura panourilor. Aproape identică cu fundalul: panoul se distinge
  /// prin **ramă**, nu prin umplutură. Asta îl deosebește de un card Material.
  static const surfacePanel = Color(0xFF000D1B);

  /// Rândurile din interiorul unui panou.
  static const surfaceRow = Color(0xFF04121F);

  /// Panourile care trebuie să iasă în față (întrebare, răspunsuri).
  static const surfaceRaised = Color(0xFF051A31);

  /// Starea selectată (element activ din bara de jos, filă activă).
  static const surfaceSelected = Color(0xFF012252);

  /// Suprafețe și accente pentru noua identitate medieval-futuristă.
  static const obsidian = Color(0xFF11111A);
  static const obsidianRaised = Color(0xFF1B1726);
  static const runeViolet = Color(0xFF8D6BDA);
  static const runeVioletDeep = Color(0xFF372653);
  static const astralTeal = Color(0xFF2BC7B4);
  static const astralTealLight = Color(0xFF9BF4E9);
  static const parchment = Color(0xFFF5E8C8);

  // --- Auriu: accentul metalic ---

  /// Reflexul de pe muchia ramei și textul pe fundal auriu.
  static const goldLight = Color(0xFFFFE9B8);

  /// Titluri de secțiune și iconițe active.
  static const goldBright = Color(0xFFF6C46B);

  /// Rama standard și textul de buton.
  static const gold = Color(0xFFC9A45C);

  /// Latura umbrită a ramei.
  static const goldDeep = Color(0xFF7A5F3A);

  /// Conturul exterior al ramei.
  static const goldShadow = Color(0xFF3B2E1B);

  // --- Albastru: accentul interactiv ---

  /// Umplerea barelor de progres și a sliderelor.
  static const royalBlue = Color(0xFF0048C2);

  /// Pista comutatoarelor pornite.
  static const royalBlueDeep = Color(0xFF013E98);

  /// Evidențierea stării active.
  static const electric = Color(0xFF29B6FF);

  /// Haloul din jurul elementelor active.
  static const electricGlow = Color(0xFF7FE0FF);

  static const bubbleOutgoing = Color(0xFF022751);
  static const bubbleIncoming = Color(0xFF0A1A2A);

  // --- Semantice ---

  /// Acțiuni distructive și jucătorul advers.
  static const crimson = Color(0xFFC4392F);
  static const crimsonDeep = Color(0xFF450F0C);
  static const success = Color(0xFF4ADE6A);
  static const onlineDot = Color(0xFF55E06A);

  // --- Text ---

  static const textPrimary = Color(0xFFF5EFE2);
  static const textOnGold = Color(0xFF1A1206);
  static const textSecondary = Color(0xFF9FB6D0);

  /// Subtitlul de sub numele jucătorului („Cuceritor de Întrebări").
  static const textAccent = Color(0xFF6FC4F0);
  static const textMuted = Color(0xFF5D708A);
}

/// Spațierile. Scara e multiplu de 4: orice valoare din afara ei sare în ochi
/// exact cât trebuie ca să fie observată la revizuire.
abstract final class QuizRealmSpacing {
  static const xs = 4.0;
  static const sm = 8.0;
  static const md = 12.0;
  static const lg = 16.0;
  static const xl = 24.0;
  static const xxl = 32.0;

  /// Marginea laterală a conținutului față de marginea ecranului.
  static const screenGutter = 14.0;

  /// Distanța standard între două panouri.
  static const panelGap = 12.0;
}

abstract final class QuizRealmRadius {
  /// Bare de progres, pastile mici.
  static const sm = 6.0;

  /// Rânduri și butoane.
  static const md = 10.0;

  /// Panouri.
  static const lg = 14.0;

  /// Pastile de resurse, comutatoare.
  static const pill = 999.0;
}

abstract final class QuizRealmBorders {
  /// Firul exterior al ramei.
  static const hairline = 1.0;

  /// Rama standard de panou.
  static const frame = 2.0;

  /// Panou evidențiat sau element selectat.
  static const emphasis = 3.0;
}

/// Tipografia. Cinzel doar pentru titluri și butoane: la dimensiuni mici devine
/// greu de citit, iar referințele îl rezervă exact acestor roluri.
abstract final class QuizRealmTypography {
  static const displayFamily = 'Cinzel';

  /// Titlul unui ecran („SETĂRI", „CLASAMENT"): majuscule, spațiat larg.
  static const screenTitle = TextStyle(
    fontFamily: displayFamily,
    fontSize: 26,
    height: 1.1,
    letterSpacing: 3.2,
    fontWeight: FontWeight.w700,
    color: QuizRealmColors.goldBright,
  );

  /// Titlul unei secțiuni din panou („CONT", „SUNET").
  static const sectionTitle = TextStyle(
    fontFamily: displayFamily,
    fontSize: 15,
    letterSpacing: 1.6,
    fontWeight: FontWeight.w700,
    color: QuizRealmColors.goldBright,
  );

  static const buttonLabel = TextStyle(
    fontFamily: displayFamily,
    fontSize: 16,
    letterSpacing: 1.8,
    fontWeight: FontWeight.w700,
    color: QuizRealmColors.goldLight,
  );

  /// Numele unui jucător, în listă sau în antet.
  static const playerName = TextStyle(
    fontSize: 16,
    fontWeight: FontWeight.w600,
    color: QuizRealmColors.textPrimary,
  );

  /// Titlul de sub nume („Cuceritor de Întrebări").
  static const playerTitle = TextStyle(
    fontSize: 12,
    fontWeight: FontWeight.w500,
    color: QuizRealmColors.textAccent,
  );

  static const body = TextStyle(
    fontSize: 14,
    height: 1.35,
    color: QuizRealmColors.textPrimary,
  );

  static const bodySecondary = TextStyle(
    fontSize: 12,
    height: 1.35,
    color: QuizRealmColors.textSecondary,
  );

  /// Valori numerice: cifre tabulare, ca monedele să nu „joace" la schimbare.
  static const numeric = TextStyle(
    fontSize: 15,
    fontWeight: FontWeight.w700,
    color: QuizRealmColors.textPrimary,
    fontFeatures: [FontFeature.tabularFigures()],
  );

  /// Eticheta din bara de navigație.
  static const navLabel = TextStyle(
    fontFamily: displayFamily,
    fontSize: 11,
    letterSpacing: 1.1,
    fontWeight: FontWeight.w600,
  );
}

abstract final class QuizRealmGradients {
  /// Corpul ramei aurii: reflex sus, umbră jos.
  static const goldFrame = LinearGradient(
    begin: Alignment.topCenter,
    end: Alignment.bottomCenter,
    colors: [
      QuizRealmColors.goldLight,
      QuizRealmColors.gold,
      QuizRealmColors.goldDeep,
    ],
    stops: [0.0, 0.45, 1.0],
  );

  /// Umplutura unui buton primar.
  static const primaryButton = LinearGradient(
    begin: Alignment.topCenter,
    end: Alignment.bottomCenter,
    colors: [Color(0xFF0A3A86), Color(0xFF01204C)],
  );

  /// Metal gravat: reflex de aur, bronz și umbră de obsidian.
  static const heraldicGold = LinearGradient(
    begin: Alignment.topLeft,
    end: Alignment.bottomRight,
    colors: [Color(0xFFFFE6A2), Color(0xFFE0AF48), Color(0xFF8D5A21)],
    stops: [0.0, 0.52, 1.0],
  );

  /// Suprafață ritualică pentru panouri și carduri de profil.
  static const engravedObsidian = LinearGradient(
    begin: Alignment.topLeft,
    end: Alignment.bottomRight,
    colors: [Color(0xFF242033), Color(0xFF11111A), Color(0xFF090A10)],
    stops: [0.0, 0.58, 1.0],
  );

  /// Energie pentru hartă, avatar și controale active.
  static const astralCurrent = LinearGradient(
    begin: Alignment.centerLeft,
    end: Alignment.centerRight,
    colors: [QuizRealmColors.runeVioletDeep, QuizRealmColors.runeViolet, QuizRealmColors.astralTeal],
  );

  /// Umplerea barelor de progres.
  static const progressFill = LinearGradient(
    begin: Alignment.centerLeft,
    end: Alignment.centerRight,
    colors: [QuizRealmColors.royalBlueDeep, QuizRealmColors.electric],
  );

  /// Fundalul ecranului: mai deschis în centru, stins spre margini.
  static const screen = RadialGradient(
    center: Alignment(0, -0.35),
    radius: 1.1,
    colors: [QuizRealmColors.background, QuizRealmColors.backgroundDeep],
  );

  /// Banda jucătorului propriu din duel.
  static const selfBanner = LinearGradient(
    begin: Alignment.centerLeft,
    end: Alignment.centerRight,
    colors: [Color(0xFF03306B), Color(0xFF021C3E)],
  );

  /// Banda adversarului din duel.
  static const opponentBanner = LinearGradient(
    begin: Alignment.centerRight,
    end: Alignment.centerLeft,
    colors: [Color(0xFF6B1710), Color(0xFF3A0D0A)],
  );
}

abstract final class QuizRealmShadows {
  /// Umbra unui panou peste fundal.
  static const panel = [
    BoxShadow(color: Color(0x99000000), blurRadius: 14, offset: Offset(0, 5)),
  ];

  /// Haloul din jurul unui element activ.
  static const electricGlow = [
    BoxShadow(color: Color(0x5529B6FF), blurRadius: 18, spreadRadius: 1),
  ];

  /// Strălucirea caldă a unei rame evidențiate.
  static const goldGlow = [
    BoxShadow(color: Color(0x44F6C46B), blurRadius: 16, spreadRadius: 1),
  ];

  static const runeGlow = [
    BoxShadow(color: Color(0x668D6BDA), blurRadius: 22, spreadRadius: 1),
    BoxShadow(color: Color(0x332BC7B4), blurRadius: 36, spreadRadius: 2),
  ];
}

abstract final class QuizRealmDurations {
  /// Reacția la atingere.
  static const tap = Duration(milliseconds: 120);

  /// Tranziția între stări (filă selectată, comutator).
  static const state = Duration(milliseconds: 220);

  /// Intrarea unui panou în ecran.
  static const enter = Duration(milliseconds: 320);

  /// Pulsul lent al elementelor decorative.
  static const pulse = Duration(seconds: 4);
}
