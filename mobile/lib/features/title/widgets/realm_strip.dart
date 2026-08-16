import 'package:flutter/material.dart';

import '../../../core/theme/app_theme.dart';
import '../../../core/ui/game_icons.dart';
import '../../../domain/campaign/campaign_progress.dart';
import '../../../domain/campaign/realm_chapter.dart';
import '../../../l10n/app_localizations.dart';
import '../../map/chapter_presentation.dart';

/// Banda orizontală cu ținuturile regatului.
///
/// Fiecare ținut are o iconiță ilustrată proprie; cele blocate rămân vizibile,
/// pentru că a vedea ce urmează e jumătate din motivul de a continua. Atingerea
/// duce pe hartă — nu inventăm o navigație care nu există.
class RealmStrip extends StatelessWidget {
  const RealmStrip({
    required this.progress,
    required this.onOpenMap,
    super.key,
  });

  final CampaignProgress progress;
  final VoidCallback onOpenMap;

  /// Iconițele ilustrate au alte denumiri decât ținuturile; maparea stă aici,
  /// într-un singur loc.
  static const _categoryIcon = <String, String>{
    'istorie': 'icon-category-history',
    'romania': 'icon-category-royal-challenge',
    'geografie': 'icon-category-geography',
    'stiinta': 'icon-category-science',
    'sport': 'icon-category-sports',
    'tehnologie': 'icon-category-technology',
    'literatura': 'icon-category-literature',
    'arte': 'icon-category-art',
    'mituri': 'icon-category-mythology',
  };

  static String? assetFor(String chapterId) {
    final name = _categoryIcon[chapterId];
    return name == null
        ? null
        : 'assets/game/icons/quiz-categories/$name.png';
  }

  @override
  Widget build(BuildContext context) {
    final l10n = AppLocalizations.of(context);
    final maxChapterStars = RealmChapter.stages.length * 3;

    return SizedBox(
      height: 104,
      child: ListView.separated(
        key: const Key('home-realm-strip'),
        scrollDirection: Axis.horizontal,
        padding: const EdgeInsets.symmetric(horizontal: 2),
        itemCount: RealmChapter.all.length,
        separatorBuilder: (_, _) => const SizedBox(width: 10),
        itemBuilder: (itemContext, index) {
          final chapter = RealmChapter.all[index];
          final visuals = ChapterPresentation.of(l10n, chapter.id);
          final unlocked = progress.isChapterUnlocked(chapter);
          final stars = progress.starsForChapter(chapter.id);
          final asset = assetFor(chapter.id);

          return Semantics(
            button: true,
            label: unlocked
                ? l10n.chapterOpenSemantics(visuals.name, stars, maxChapterStars)
                : l10n.chapterLockedSemantics(
                    visuals.name,
                    chapter.starsToUnlock,
                  ),
            child: ExcludeSemantics(
              child: InkWell(
                onTap: onOpenMap,
                borderRadius: BorderRadius.circular(12),
                child: SizedBox(
                  width: 76,
                  child: Column(
                    mainAxisSize: MainAxisSize.min,
                    children: [
                      Stack(
                        alignment: Alignment.center,
                        children: [
                          Container(
                            width: 58,
                            height: 58,
                            decoration: BoxDecoration(
                              shape: BoxShape.circle,
                              color: GamePalette.stone900.withValues(
                                alpha: 0.75,
                              ),
                              border: Border.all(
                                color: unlocked
                                    ? visuals.color.withValues(alpha: 0.75)
                                    : GamePalette.stone600,
                                width: 1.4,
                              ),
                            ),
                            child: Padding(
                              padding: const EdgeInsets.all(7),
                              child: asset == null
                                  ? GameIcon(
                                      visuals.symbol,
                                      size: 24,
                                      color: unlocked
                                          ? visuals.color
                                          : GamePalette.stone600,
                                    )
                                  : Opacity(
                                      // Ținutul blocat rămâne recognoscibil,
                                      // doar stins — nu ascuns.
                                      opacity: unlocked ? 1 : 0.32,
                                      child: Image.asset(
                                        asset,
                                        fit: BoxFit.contain,
                                      ),
                                    ),
                            ),
                          ),
                          if (!unlocked)
                            const Positioned(
                              bottom: 2,
                              right: 6,
                              child: GameIcon(
                                GameSymbol.lock,
                                size: 15,
                                color: GamePalette.creamDim,
                              ),
                            ),
                        ],
                      ),
                      const SizedBox(height: 5),
                      Text(
                        visuals.name,
                        textAlign: TextAlign.center,
                        maxLines: 1,
                        overflow: TextOverflow.ellipsis,
                        style: GameText.bodyDim.copyWith(
                          fontSize: 10,
                          color: unlocked
                              ? GamePalette.cream
                              : GamePalette.creamDim,
                        ),
                      ),
                      const SizedBox(height: 2),
                      Row(
                        mainAxisAlignment: MainAxisAlignment.center,
                        children: [
                          GameIcon(
                            GameSymbol.star,
                            size: 10,
                            color: stars > 0
                                ? GamePalette.gold
                                : GamePalette.stone600,
                          ),
                          const SizedBox(width: 3),
                          Text(
                            '$stars/$maxChapterStars',
                            style: GameText.numeric.copyWith(fontSize: 9),
                          ),
                        ],
                      ),
                    ],
                  ),
                ),
              ),
            ),
          );
        },
      ),
    );
  }
}
