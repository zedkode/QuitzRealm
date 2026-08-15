import 'package:flutter/material.dart';
import 'package:flutter_riverpod/flutter_riverpod.dart';
import 'package:go_router/go_router.dart';

import '../../core/theme/app_theme.dart';
import '../../core/ui/game_button.dart';
import '../../core/ui/game_frame.dart';
import '../../core/ui/game_icons.dart';
import '../../core/ui/game_meters.dart';
import '../../domain/campaign/realm_chapter.dart';
import '../../l10n/app_localizations.dart';
import '../map/chapter_presentation.dart';
import 'battle_controller.dart';

/// Ecranul de final al unui asalt: stele, recompense și pașii următori.
class ResultView extends ConsumerWidget {
  const ResultView({
    required this.state,
    required this.chapter,
    required this.stage,
    required this.onRetry,
    required this.onBackToMap,
    super.key,
  });

  final BattleState state;
  final RealmChapter chapter;
  final BattleStage stage;
  final VoidCallback onRetry;
  final VoidCallback onBackToMap;

  @override
  Widget build(BuildContext context, WidgetRef ref) {
    final l10n = AppLocalizations.of(context);
    final visuals = ChapterPresentation.of(l10n, chapter.id);
    final victory = state.stars > 0;
    final hasNextStage = stage.index + 1 < RealmChapter.stages.length;

    return SingleChildScrollView(
      padding: const EdgeInsets.fromLTRB(18, 2, 18, 28),
      child: Column(
        crossAxisAlignment: CrossAxisAlignment.stretch,
        children: [
          SizedBox(
            height: 150,
            child: victory
                ? Image.asset(
                    'assets/game/victory_reliquary.png',
                    fit: BoxFit.contain,
                    filterQuality: FilterQuality.high,
                    excludeFromSemantics: true,
                  )
                : const Center(
                    child: GameIcon(
                      GameSymbol.shield,
                      size: 110,
                      color: GamePalette.stone600,
                    ),
                  ),
          ),
          Center(
            child: RibbonBanner(
              text: victory ? l10n.resultVictoryTitle : l10n.resultDefeatTitle,
              color: victory ? visuals.color : GamePalette.stone700,
            ),
          ),
          const SizedBox(height: 14),
          _AnimatedStars(
            key: Key('result-stars-${state.stars}'),
            stars: state.stars,
            semanticsLabel: l10n.starsSemantics(state.stars, 3),
          ),
          const SizedBox(height: 14),
          Text(
            victory
                ? l10n.resultVictoryBody(visuals.name)
                : l10n.resultDefeatBody,
            textAlign: TextAlign.center,
            style: GameText.body,
          ),
          const SizedBox(height: 16),
          GameFrame(
            accent: visuals.color,
            padding: const EdgeInsets.symmetric(horizontal: 10, vertical: 14),
            child: Row(
              children: [
                Expanded(
                  child: _ResultStat(
                    symbol: GameSymbol.gem,
                    color: GamePalette.goldBright,
                    label: l10n.resultScoreLabel,
                    value: '${state.score}',
                  ),
                ),
                Expanded(
                  child: _ResultStat(
                    symbol: GameSymbol.check,
                    color: GamePalette.emerald,
                    label: l10n.resultAnswersLabel,
                    value: l10n.resultAnswers(
                      state.correctCount,
                      state.questions.length,
                    ),
                  ),
                ),
                Expanded(
                  child: _ResultStat(
                    symbol: GameSymbol.flame,
                    color: GamePalette.crimson,
                    label: l10n.resultStreakLabel,
                    value: '${state.bestStreak}',
                  ),
                ),
              ],
            ),
          ),
          const SizedBox(height: 12),
          Center(
            child: ResourcePill(
              key: const Key('result-xp'),
              symbol: GameSymbol.bolt,
              color: GamePalette.arcane,
              value: l10n.resultXpGained(state.xpGained),
              semanticsLabel: l10n.resultXpGained(state.xpGained),
            ),
          ),
          const SizedBox(height: 20),
          if (victory && hasNextStage)
            GameButton(
              key: const Key('result-next-stage'),
              label: l10n.actionNextStage,
              icon: GameSymbol.sword,
              onPressed: () => context.pushReplacement(
                '/asalt/${chapter.id}/${stage.index + 1}',
              ),
            ),
          if (victory && hasNextStage) const SizedBox(height: 10),
          GameButton(
            key: const Key('result-retry'),
            label: l10n.actionRetryStage,
            icon: GameSymbol.swords,
            tone: victory ? GameButtonTone.stone : GameButtonTone.gold,
            onPressed: onRetry,
          ),
          const SizedBox(height: 10),
          GameButton(
            key: const Key('result-map'),
            label: l10n.actionBackToMap,
            icon: GameSymbol.map,
            tone: GameButtonTone.stone,
            height: 48,
            compact: true,
            onPressed: onBackToMap,
          ),
        ],
      ),
    );
  }
}

class _ResultStat extends StatelessWidget {
  const _ResultStat({
    required this.symbol,
    required this.color,
    required this.label,
    required this.value,
  });

  final GameSymbol symbol;
  final Color color;
  final String label;
  final String value;

  @override
  Widget build(BuildContext context) {
    return Column(
      children: [
        GameIcon(symbol, size: 22, color: color),
        const SizedBox(height: 5),
        FittedBox(
          fit: BoxFit.scaleDown,
          child: Text(value, style: GameText.numeric),
        ),
        const SizedBox(height: 2),
        FittedBox(
          fit: BoxFit.scaleDown,
          child: Text(
            label,
            style: TextStyle(
              fontSize: 8.5,
              fontWeight: FontWeight.w800,
              letterSpacing: 0.6,
              color: GamePalette.cream.withValues(alpha: 0.6),
            ),
          ),
        ),
      ],
    );
  }
}

/// Stelele apar una câte una, cu un mic salt.
class _AnimatedStars extends StatefulWidget {
  const _AnimatedStars({
    required this.stars,
    required this.semanticsLabel,
    super.key,
  });

  final int stars;
  final String semanticsLabel;

  @override
  State<_AnimatedStars> createState() => _AnimatedStarsState();
}

class _AnimatedStarsState extends State<_AnimatedStars>
    with SingleTickerProviderStateMixin {
  late final AnimationController _controller = AnimationController(
    vsync: this,
    duration: const Duration(milliseconds: 1100),
  )..forward();

  @override
  void dispose() {
    _controller.dispose();
    super.dispose();
  }

  @override
  Widget build(BuildContext context) {
    return Semantics(
      label: widget.semanticsLabel,
      child: ExcludeSemantics(
        child: AnimatedBuilder(
          animation: _controller,
          builder: (context, _) {
            return Row(
              mainAxisAlignment: MainAxisAlignment.center,
              children: [
                for (var index = 0; index < 3; index++)
                  _star(index: index, size: index == 1 ? 62.0 : 50.0),
              ],
            );
          },
        ),
      ),
    );
  }

  Widget _star({required int index, required double size}) {
    final earned = index < widget.stars;
    final start = index * 0.25;
    final raw = ((_controller.value - start) / 0.35).clamp(0.0, 1.0);
    final scale = earned ? 0.6 + 0.4 * Curves.elasticOut.transform(raw) : 1.0;

    return Padding(
      padding: EdgeInsets.symmetric(
        horizontal: 5,
        vertical: index == 1 ? 0 : 8,
      ),
      child: Transform.scale(
        scale: earned ? scale : 1,
        child: Opacity(
          opacity: earned ? (raw == 0 ? 0.0 : 1.0) : 1,
          child: StarRow(earned: earned ? 1 : 0, total: 1, size: size),
        ),
      ),
    );
  }
}
