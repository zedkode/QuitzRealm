import 'package:flutter/material.dart';

import '../../../core/theme/app_theme.dart';
import '../../../core/ui/game_button.dart';
import '../../../core/ui/game_frame.dart';
import '../../../core/ui/game_icons.dart';
import '../../../domain/campaign/campaign_progress.dart';
import '../../../domain/campaign/realm_chapter.dart';
import '../../../l10n/app_localizations.dart';
import '../../map/chapter_presentation.dart';

/// Cardul principal: unde ai rămas și ce urmează.
///
/// Un ecran de start plin de butoane egale nu spune nimic despre joc. Aici
/// prima privire arată **ținutul următor**, nu o listă de opțiuni.
class CampaignHero extends StatelessWidget {
  const CampaignHero({
    required this.progress,
    required this.onContinue,
    super.key,
  });

  final CampaignProgress progress;
  final VoidCallback onContinue;

  /// Primul ținut cu asalturi neterminate; dacă toate sunt duse, ultimul.
  RealmChapter get _currentChapter {
    for (final chapter in RealmChapter.all) {
      if (!progress.isChapterUnlocked(chapter)) continue;
      if (progress.starsForChapter(chapter.id) < RealmChapter.stages.length * 3) {
        return chapter;
      }
    }
    return RealmChapter.all.last;
  }

  @override
  Widget build(BuildContext context) {
    final l10n = AppLocalizations.of(context);
    final chapter = _currentChapter;
    final visuals = ChapterPresentation.of(l10n, chapter.id);
    final chapterStars = progress.starsForChapter(chapter.id);
    final chapterMax = RealmChapter.stages.length * 3;
    final started = progress.totalStars > 0 || progress.xp > 0;

    return GameFrame(
      key: const Key('home-campaign-hero'),
      accent: visuals.color,
      glow: true,
      padding: const EdgeInsets.fromLTRB(16, 14, 16, 14),
      child: Column(
        crossAxisAlignment: CrossAxisAlignment.stretch,
        children: [
          Row(
            children: [
              Container(
                width: 52,
                height: 52,
                decoration: BoxDecoration(
                  shape: BoxShape.circle,
                  color: visuals.color.withValues(alpha: 0.14),
                  border: Border.all(
                    color: visuals.color.withValues(alpha: 0.6),
                    width: 1.4,
                  ),
                ),
                child: Center(
                  child: GameIcon(visuals.symbol, size: 26, color: visuals.color),
                ),
              ),
              const SizedBox(width: 12),
              Expanded(
                child: Column(
                  crossAxisAlignment: CrossAxisAlignment.start,
                  mainAxisSize: MainAxisSize.min,
                  children: [
                    Text(
                      started ? l10n.homeContinueEyebrow : l10n.homeStartEyebrow,
                      style: GameText.eyebrow.copyWith(fontSize: 10),
                    ),
                    const SizedBox(height: 3),
                    Text(
                      visuals.name,
                      style: GameText.title.copyWith(fontSize: 19),
                      overflow: TextOverflow.ellipsis,
                    ),
                    Text(
                      visuals.subject,
                      style: GameText.bodyDim.copyWith(fontSize: 11),
                      maxLines: 1,
                      overflow: TextOverflow.ellipsis,
                    ),
                  ],
                ),
              ),
            ],
          ),
          const SizedBox(height: 12),
          Row(
            children: [
              Expanded(
                child: ClipRRect(
                  borderRadius: BorderRadius.circular(6),
                  child: LinearProgressIndicator(
                    value: chapterMax == 0 ? 0 : chapterStars / chapterMax,
                    minHeight: 7,
                    backgroundColor: GamePalette.stone700,
                    valueColor: AlwaysStoppedAnimation(visuals.color),
                  ),
                ),
              ),
              const SizedBox(width: 10),
              Text(
                l10n.starsShort(chapterStars, chapterMax),
                style: GameText.numeric.copyWith(fontSize: 12),
              ),
            ],
          ),
          const SizedBox(height: 14),
          GameButton(
            key: const Key('menu-play'),
            label: started ? l10n.menuContinueCampaign : l10n.menuStartCampaign,
            icon: GameSymbol.play,
            height: 54,
            onPressed: onContinue,
          ),
        ],
      ),
    );
  }
}
