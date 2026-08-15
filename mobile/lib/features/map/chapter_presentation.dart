import 'package:flutter/widgets.dart';

import '../../core/theme/app_theme.dart';
import '../../core/ui/game_icons.dart';
import '../../l10n/app_localizations.dart';

/// Legătura dintre un ținut (date) și felul în care arată pe hartă (blazon,
/// culoare) și cum se numește în limba jucătorului.
final class ChapterPresentation {
  const ChapterPresentation({
    required this.symbol,
    required this.color,
    required this.name,
    required this.subject,
  });

  final GameSymbol symbol;
  final Color color;
  final String name;
  final String subject;

  static ChapterPresentation of(AppLocalizations l10n, String chapterId) {
    return switch (chapterId) {
      'istorie' => ChapterPresentation(
        symbol: GameSymbol.scroll,
        color: GamePalette.gold,
        name: l10n.chapterIstorie,
        subject: l10n.subjectIstorie,
      ),
      'romania' => ChapterPresentation(
        symbol: GameSymbol.crown,
        color: GamePalette.crimson,
        name: l10n.chapterRomania,
        subject: l10n.subjectRomania,
      ),
      'geografie' => ChapterPresentation(
        symbol: GameSymbol.compass,
        color: GamePalette.arcane,
        name: l10n.chapterGeografie,
        subject: l10n.subjectGeografie,
      ),
      'stiinta' => ChapterPresentation(
        symbol: GameSymbol.flask,
        color: GamePalette.emerald,
        name: l10n.chapterStiinta,
        subject: l10n.subjectStiinta,
      ),
      'sport' => ChapterPresentation(
        symbol: GameSymbol.trophy,
        color: Color(0xFFFF9E4D),
        name: l10n.chapterSport,
        subject: l10n.subjectSport,
      ),
      'tehnologie' => ChapterPresentation(
        symbol: GameSymbol.bolt,
        color: Color(0xFF7BE7FF),
        name: l10n.chapterTehnologie,
        subject: l10n.subjectTehnologie,
      ),
      'literatura' => ChapterPresentation(
        symbol: GameSymbol.book,
        color: Color(0xFFE0C68F),
        name: l10n.chapterLiteratura,
        subject: l10n.subjectLiteratura,
      ),
      'arte' => ChapterPresentation(
        symbol: GameSymbol.mask,
        color: GamePalette.amethyst,
        name: l10n.chapterArte,
        subject: l10n.subjectArte,
      ),
      'mituri' => ChapterPresentation(
        symbol: GameSymbol.skull,
        color: Color(0xFF6FE3B8),
        name: l10n.chapterMituri,
        subject: l10n.subjectMituri,
      ),
      _ => ChapterPresentation(
        symbol: GameSymbol.banner,
        color: GamePalette.gold,
        name: l10n.categoryFallback,
        subject: l10n.categoryFallback,
      ),
    };
  }

  static String stageName(AppLocalizations l10n, int stageIndex) {
    return switch (stageIndex) {
      0 => l10n.stageOutpost,
      1 => l10n.stageCitadel,
      _ => l10n.stageThrone,
    };
  }
}
