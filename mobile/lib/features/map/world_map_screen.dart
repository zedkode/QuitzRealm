import 'package:flutter/material.dart';
import 'package:flutter/services.dart';
import 'package:flutter_riverpod/flutter_riverpod.dart';
import 'package:go_router/go_router.dart';

import '../../core/providers/game_providers.dart';
import '../../core/theme/app_theme.dart';
import '../../core/ui/game_button.dart';
import '../../core/ui/game_frame.dart';
import '../../core/ui/game_icons.dart';
import '../../core/ui/game_meters.dart';
import '../../core/ui/map_marker.dart';
import '../../core/ui/realm_backdrop.dart';
import '../../domain/campaign/campaign_progress.dart';
import '../../domain/campaign/realm_chapter.dart';
import '../../l10n/app_localizations.dart';
import 'chapter_presentation.dart';

/// Harta regatului: fiecare ținut este un nod pe ilustrație, cu stelele
/// câștigate dedesubt.
class WorldMapScreen extends ConsumerWidget {
  const WorldMapScreen({super.key});

  /// Raportul real al `realm_map_v2.png` (941×1672). O valoare aproximativă
  /// deforma ilustrația și muta reperele sub markere.
  static const mapAspectRatio = 941 / 1672;

  @override
  Widget build(BuildContext context, WidgetRef ref) {
    final l10n = AppLocalizations.of(context);
    final progress = ref.watch(campaignProgressProvider);

    return Scaffold(
      body: RealmBackdrop(
        child: SafeArea(
          child: Column(
            children: [
              _MapHeader(progress: progress),
              Text(
                l10n.worldMapEyebrow,
                style: GameText.eyebrow,
                textAlign: TextAlign.center,
              ),
              const SizedBox(height: 3),
              Text(
                l10n.worldMapTitle,
                style: GameText.title,
                textAlign: TextAlign.center,
              ),
              const SizedBox(height: 8),
              // Harta trebuie să încapă întreagă: nodurile de jos nu au voie
              // să rămână sub marginea ecranului.
              Expanded(
                child: Padding(
                  padding: const EdgeInsets.symmetric(horizontal: 10),
                  child: Center(child: _RealmMapBoard(progress: progress)),
                ),
              ),
              Padding(
                padding: const EdgeInsets.fromLTRB(16, 8, 16, 10),
                child: Text(
                  l10n.worldMapHint,
                  style: GameText.bodyDim,
                  textAlign: TextAlign.center,
                ),
              ),
            ],
          ),
        ),
      ),
    );
  }
}

class _MapHeader extends StatelessWidget {
  const _MapHeader({required this.progress});

  final CampaignProgress progress;

  @override
  Widget build(BuildContext context) {
    final l10n = AppLocalizations.of(context);
    return Padding(
      padding: const EdgeInsets.fromLTRB(12, 6, 12, 4),
      child: Row(
        children: [
          GameIconButton(
            symbol: GameSymbol.back,
            tooltip: l10n.backLabel,
            onPressed: () => context.pop(),
          ),
          const SizedBox(width: 10),
          Expanded(
            child: XpBar(
              level: progress.level,
              progress: progress.levelProgress,
              label: l10n.xpProgress(
                progress.xpIntoLevel,
                CampaignProgress.xpForLevel(progress.level),
              ),
            ),
          ),
          const SizedBox(width: 10),
          ResourcePill(
            key: const Key('map-stars'),
            symbol: GameSymbol.star,
            value: l10n.starsShort(progress.totalStars, RealmChapter.maxStars),
            semanticsLabel: l10n.starsCollected(
              progress.totalStars,
              RealmChapter.maxStars,
            ),
          ),
        ],
      ),
    );
  }
}

class _RealmMapBoard extends StatelessWidget {
  const _RealmMapBoard({required this.progress});

  final CampaignProgress progress;

  @override
  Widget build(BuildContext context) {
    return AspectRatio(
      aspectRatio: WorldMapScreen.mapAspectRatio,
      child: ClipRRect(
        borderRadius: BorderRadius.circular(18),
        child: DecoratedBox(
          decoration: BoxDecoration(
            borderRadius: BorderRadius.circular(18),
            border: Border.all(
              color: GamePalette.gold.withValues(alpha: 0.7),
              width: 1.6,
            ),
          ),
          child: LayoutBuilder(
            builder: (context, constraints) {
              return Stack(
                key: const Key('realm-map'),
                fit: StackFit.expand,
                children: [
                  Image.asset(
                    'assets/game/realm_map_v2.png',
                    fit: BoxFit.cover,
                    filterQuality: FilterQuality.high,
                    excludeFromSemantics: true,
                  ),
                  const DecoratedBox(
                    decoration: BoxDecoration(
                      gradient: RadialGradient(
                        radius: 0.95,
                        colors: [Colors.transparent, Color(0x9904060F)],
                        stops: [0.6, 1],
                      ),
                    ),
                  ),
                  for (final chapter in RealmChapter.all)
                    _positioned(
                      constraints: constraints,
                      chapter: chapter,
                      progress: progress,
                      isCurrent: chapter.id == _currentChapterId(progress),
                    ),
                ],
              );
            },
          ),
        ),
      ),
    );
  }

  /// Ținutul pe care jucătorul îl are de continuat: primul deblocat care nu e
  /// terminat complet. Primește markerul de „ești aici”.
  static String? _currentChapterId(CampaignProgress progress) {
    for (final chapter in RealmChapter.all) {
      if (!progress.isChapterUnlocked(chapter)) continue;
      if (progress.starsForChapter(chapter.id) < ChapterNode.maxChapterStars) {
        return chapter.id;
      }
    }
    return null;
  }

  Widget _positioned({
    required BoxConstraints constraints,
    required RealmChapter chapter,
    required CampaignProgress progress,
    required bool isCurrent,
  }) {
    const width = 104.0;
    const height = 102.0;
    final (x, y) = chapter.mapPosition;
    return Positioned(
      left: x * constraints.maxWidth - width / 2,
      // Ancorăm pe vârful markerului, nu pe centrul nodului: altfel eticheta
      // ar sta peste reperul de pe hartă în loc să stea sub el.
      top:
          y * constraints.maxHeight -
          ChapterNode.markerSize * MapMarker.tipOffset,
      width: width,
      height: height,
      child: ChapterNode(
        chapter: chapter,
        progress: progress,
        isCurrent: isCurrent,
      ),
    );
  }
}

/// Nodul unui ținut de pe hartă: blazon, nume și stelele câștigate.
class ChapterNode extends StatelessWidget {
  const ChapterNode({
    required this.chapter,
    required this.progress,
    super.key,
    this.isCurrent = false,
  });

  final RealmChapter chapter;
  final CampaignProgress progress;
  final bool isCurrent;

  static const maxChapterStars = 9;
  static const markerSize = 54.0;

  /// Markerul se alege din starea ținutului, nu din identitatea lui.
  static MapMarkerKind markerFor({
    required bool unlocked,
    required int stars,
    required bool isCurrent,
  }) {
    if (!unlocked) return MapMarkerKind.locked;
    if (stars >= maxChapterStars) return MapMarkerKind.completed;
    if (isCurrent) return MapMarkerKind.current;
    return MapMarkerKind.quest;
  }

  @override
  Widget build(BuildContext context) {
    final l10n = AppLocalizations.of(context);
    final visuals = ChapterPresentation.of(l10n, chapter.id);
    final unlocked = progress.isChapterUnlocked(chapter);
    final stars = progress.starsForChapter(chapter.id);
    final kind = markerFor(
      unlocked: unlocked,
      stars: stars,
      isCurrent: isCurrent,
    );

    return Semantics(
      button: true,
      label: unlocked
          ? l10n.chapterOpenSemantics(visuals.name, stars, maxChapterStars)
          : l10n.chapterLockedSemantics(visuals.name, chapter.starsToUnlock),
      child: ExcludeSemantics(
        child: GestureDetector(
          behavior: HitTestBehavior.opaque,
          onTap: () {
            HapticFeedback.selectionClick();
            unlocked
                ? _openStages(context, chapter)
                : _showLocked(context, chapter, l10n);
          },
          child: Column(
            mainAxisSize: MainAxisSize.min,
            children: [
              MapMarker(
                key: Key(
                  'chapter-${chapter.id}-${unlocked ? 'open' : 'locked'}',
                ),
                kind: kind,
                size: markerSize,
                pulsing: isCurrent,
                dimmed: !unlocked,
              ),
              const SizedBox(height: 1),
              Container(
                padding: const EdgeInsets.symmetric(horizontal: 6, vertical: 2),
                decoration: BoxDecoration(
                  color: GamePalette.nightDeep.withValues(alpha: 0.86),
                  borderRadius: BorderRadius.circular(8),
                  border: Border.all(
                    color: (unlocked ? visuals.color : GamePalette.stone600)
                        .withValues(alpha: 0.8),
                  ),
                ),
                child: Text(
                  visuals.name,
                  maxLines: 2,
                  overflow: TextOverflow.ellipsis,
                  textAlign: TextAlign.center,
                  style: const TextStyle(
                    fontFamily: 'Cinzel',
                    fontSize: 8.5,
                    height: 1.15,
                    fontWeight: FontWeight.w800,
                    color: GamePalette.cream,
                  ),
                ),
              ),
              const SizedBox(height: 2),
              // Ilustrația hărții e bogată: fără fundalul propriu, stelele mici
              // se pierdeau complet peste teren.
              DecoratedBox(
                decoration: BoxDecoration(
                  color: GamePalette.nightDeep.withValues(alpha: 0.8),
                  borderRadius: BorderRadius.circular(8),
                ),
                child: Padding(
                  padding: const EdgeInsets.symmetric(
                    horizontal: 5,
                    vertical: 1.5,
                  ),
                  child: unlocked
                      ? StarRow(earned: (stars / 3).ceil().clamp(0, 3), size: 12)
                      // Costul de deblocare, ca să se vadă din prima ce lipsește.
                      : Row(
                          mainAxisSize: MainAxisSize.min,
                          children: [
                            const GameIcon(
                              GameSymbol.star,
                              size: 12,
                              color: GamePalette.goldBright,
                            ),
                            const SizedBox(width: 3),
                            Text(
                              '${chapter.starsToUnlock}',
                              style: const TextStyle(
                                fontFamily: 'Cinzel',
                                fontSize: 11,
                                fontWeight: FontWeight.w900,
                                color: GamePalette.cream,
                              ),
                            ),
                          ],
                        ),
                ),
              ),
            ],
          ),
        ),
      ),
    );
  }

  void _showLocked(
    BuildContext context,
    RealmChapter chapter,
    AppLocalizations l10n,
  ) {
    ScaffoldMessenger.of(context)
      ..clearSnackBars()
      ..showSnackBar(
        SnackBar(
          backgroundColor: GamePalette.stone800,
          behavior: SnackBarBehavior.floating,
          content: Row(
            children: [
              const GameIcon(GameSymbol.lock, size: 18),
              const SizedBox(width: 10),
              Expanded(
                child: Text(
                  l10n.chapterLockedHint(chapter.starsToUnlock),
                  style: GameText.body,
                ),
              ),
            ],
          ),
        ),
      );
  }

  void _openStages(BuildContext context, RealmChapter chapter) {
    showModalBottomSheet<void>(
      context: context,
      backgroundColor: Colors.transparent,
      isScrollControlled: true,
      builder: (context) => StageSheet(chapter: chapter),
    );
  }
}

/// Foaia cu cele trei asalturi ale unui ținut.
class StageSheet extends ConsumerWidget {
  const StageSheet({required this.chapter, super.key});

  final RealmChapter chapter;

  @override
  Widget build(BuildContext context, WidgetRef ref) {
    final l10n = AppLocalizations.of(context);
    final progress = ref.watch(campaignProgressProvider);
    final visuals = ChapterPresentation.of(l10n, chapter.id);

    return SafeArea(
      top: false,
      child: Padding(
        padding: const EdgeInsets.fromLTRB(14, 0, 14, 14),
        child: GameFrame(
          accent: visuals.color,
          glow: true,
          padding: const EdgeInsets.fromLTRB(16, 14, 16, 18),
          child: Column(
            mainAxisSize: MainAxisSize.min,
            crossAxisAlignment: CrossAxisAlignment.stretch,
            children: [
              Row(
                children: [
                  GameIcon(visuals.symbol, size: 30, color: visuals.color),
                  const SizedBox(width: 10),
                  Expanded(
                    child: Column(
                      crossAxisAlignment: CrossAxisAlignment.start,
                      children: [
                        Text(visuals.name, style: GameText.heading),
                        Text(visuals.subject, style: GameText.bodyDim),
                      ],
                    ),
                  ),
                  StarRow(
                    earned: (progress.starsForChapter(chapter.id) / 3)
                        .ceil()
                        .clamp(0, 3),
                    size: 18,
                  ),
                ],
              ),
              const SizedBox(height: 14),
              Text(l10n.chooseStage, style: GameText.eyebrow),
              const SizedBox(height: 8),
              for (final stage in RealmChapter.stages)
                _StageRow(
                  chapter: chapter,
                  stage: stage,
                  stars: progress.starsFor(chapter.id, stage.index),
                  unlocked: progress.isStageUnlocked(chapter, stage.index),
                  accent: visuals.color,
                ),
            ],
          ),
        ),
      ),
    );
  }
}

class _StageRow extends StatelessWidget {
  const _StageRow({
    required this.chapter,
    required this.stage,
    required this.stars,
    required this.unlocked,
    required this.accent,
  });

  final RealmChapter chapter;
  final BattleStage stage;
  final int stars;
  final bool unlocked;
  final Color accent;

  @override
  Widget build(BuildContext context) {
    final l10n = AppLocalizations.of(context);
    return Padding(
      padding: const EdgeInsets.only(bottom: 9),
      child: Opacity(
        opacity: unlocked ? 1 : 0.55,
        child: Container(
          padding: const EdgeInsets.fromLTRB(12, 10, 12, 10),
          decoration: BoxDecoration(
            borderRadius: BorderRadius.circular(12),
            color: GamePalette.stone900,
            border: Border.all(
              color: (unlocked ? accent : GamePalette.stone600).withValues(
                alpha: 0.65,
              ),
            ),
          ),
          child: Column(
            crossAxisAlignment: CrossAxisAlignment.stretch,
            children: [
              Row(
                children: [
                  Expanded(
                    child: Text(
                      ChapterPresentation.stageName(l10n, stage.index),
                      maxLines: 1,
                      overflow: TextOverflow.ellipsis,
                      style: GameText.heading.copyWith(fontSize: 15),
                    ),
                  ),
                  const SizedBox(width: 8),
                  if (unlocked)
                    StarRow(
                      earned: stars,
                      size: 15,
                      semanticsLabel: l10n.starsSemantics(stars, 3),
                    )
                  else
                    const GameIcon(GameSymbol.lock, size: 22),
                ],
              ),
              const SizedBox(height: 3),
              Text(
                unlocked
                    ? l10n.stageSummary(
                        stage.questionCount,
                        stage.secondsPerQuestion,
                      )
                    : l10n.stageLockedHint,
                style: GameText.bodyDim.copyWith(fontSize: 12),
              ),
              if (unlocked) ...[
                const SizedBox(height: 9),
                GameButton(
                  key: Key('start-${chapter.id}-${stage.index}'),
                  label: l10n.startStage,
                  icon: GameSymbol.sword,
                  compact: true,
                  height: 42,
                  onPressed: () {
                    Navigator.of(context).pop();
                    context.push('/asalt/${chapter.id}/${stage.index}');
                  },
                ),
              ],
            ],
          ),
        ),
      ),
    );
  }
}
