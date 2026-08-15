import 'dart:math' as math;

import 'package:flutter/material.dart';
import 'package:flutter_riverpod/flutter_riverpod.dart';
import 'package:go_router/go_router.dart';

import '../../core/providers/game_providers.dart';
import '../../core/theme/app_theme.dart';
import '../../core/ui/art_button.dart';
import '../../core/ui/game_button.dart';
import '../../core/ui/game_frame.dart';
import '../../core/ui/game_icons.dart';
import '../../core/ui/game_meters.dart';
import '../../core/ui/realm_backdrop.dart';
import '../../domain/campaign/realm_chapter.dart';
import '../../l10n/app_localizations.dart';

/// Ecranul-titlu: blazonul jocului, meniul principal și starea campaniei.
class TitleScreen extends ConsumerWidget {
  const TitleScreen({super.key});

  @override
  Widget build(BuildContext context, WidgetRef ref) {
    final l10n = AppLocalizations.of(context);
    final progress = ref.watch(campaignProgressProvider);
    final started = progress.totalStars > 0 || progress.xp > 0;

    return Scaffold(
      body: RealmBackdrop(
        child: SafeArea(
          child: LayoutBuilder(
            builder: (context, constraints) {
              return SingleChildScrollView(
                padding: const EdgeInsets.fromLTRB(22, 10, 22, 24),
                child: ConstrainedBox(
                  constraints: BoxConstraints(
                    minHeight: constraints.maxHeight - 34,
                  ),
                  child: Column(
                    mainAxisAlignment: MainAxisAlignment.center,
                    crossAxisAlignment: CrossAxisAlignment.stretch,
                    children: [
                      const _FloatingCrest(),
                      const SizedBox(height: 4),
                      Center(child: RibbonBanner(text: l10n.appTagline)),
                      const SizedBox(height: 18),
                      ArtButton(
                        key: const Key('menu-play'),
                        art: started
                            ? ArtButtonArt.continueCampaign
                            : ArtButtonArt.startCampaign,
                        label: started
                            ? l10n.menuContinueCampaign
                            : l10n.menuStartCampaign,
                        fallbackIcon: GameSymbol.play,
                        onPressed: () => context.push('/harta'),
                      ),
                      const SizedBox(height: 2),
                      ArtButton(
                        key: const Key('menu-duel'),
                        art: ArtButtonArt.duelOnline,
                        label: l10n.menuDuel,
                        maxHeight: 86,
                        fallbackIcon: GameSymbol.swords,
                        fallbackTone: GameButtonTone.danger,
                        onPressed: () => context.push('/duel'),
                      ),
                      const SizedBox(height: 2),
                      ArtButton(
                        key: const Key('menu-leaderboard'),
                        art: ArtButtonArt.leaderboard,
                        label: l10n.menuLeaderboard,
                        maxHeight: 82,
                        fallbackIcon: GameSymbol.trophy,
                        fallbackTone: GameButtonTone.arcane,
                        onPressed: () => context.push('/clasament'),
                      ),
                      const SizedBox(height: 2),
                      ArtButton(
                        key: const Key('menu-account'),
                        art: ArtButtonArt.playerAccount,
                        label: l10n.menuAccount,
                        maxHeight: 78,
                        fallbackIcon: GameSymbol.helmet,
                        fallbackTone: GameButtonTone.stone,
                        onPressed: () => context.push('/cont'),
                      ),
                      const SizedBox(height: 2),
                      ArtButton(
                        key: const Key('menu-how-to'),
                        art: ArtButtonArt.howToPlay,
                        label: l10n.menuHowToPlay,
                        maxHeight: 78,
                        fallbackIcon: GameSymbol.scroll,
                        fallbackTone: GameButtonTone.stone,
                        onPressed: () => _showRules(context, l10n),
                      ),
                      const SizedBox(height: 10),
                      _CampaignSummary(
                        level: progress.level,
                        stars: progress.totalStars,
                        maxStars: RealmChapter.maxStars,
                      ),
                    ],
                  ),
                ),
              );
            },
          ),
        ),
      ),
    );
  }

  void _showRules(BuildContext context, AppLocalizations l10n) {
    showDialog<void>(
      context: context,
      barrierColor: GamePalette.nightDeep.withValues(alpha: 0.8),
      builder: (context) => Dialog(
        backgroundColor: Colors.transparent,
        insetPadding: const EdgeInsets.all(20),
        child: GameFrame(
          glow: true,
          child: Column(
            mainAxisSize: MainAxisSize.min,
            crossAxisAlignment: CrossAxisAlignment.stretch,
            children: [
              Center(
                child: Text(l10n.howToPlayTitle, style: GameText.title),
              ),
              const SizedBox(height: 16),
              _RuleLine(
                symbol: GameSymbol.hourglass,
                text: l10n.howToPlayRuleQuestions,
              ),
              _RuleLine(
                symbol: GameSymbol.flame,
                text: l10n.howToPlayRuleStreak,
              ),
              _RuleLine(symbol: GameSymbol.star, text: l10n.howToPlayRuleStars),
              _RuleLine(
                symbol: GameSymbol.shield,
                text: l10n.howToPlayRuleOffline,
              ),
              const SizedBox(height: 16),
              GameButton(
                label: l10n.close,
                height: 46,
                compact: true,
                onPressed: () => Navigator.of(context).pop(),
              ),
            ],
          ),
        ),
      ),
    );
  }
}

class _RuleLine extends StatelessWidget {
  const _RuleLine({required this.symbol, required this.text});

  final GameSymbol symbol;
  final String text;

  @override
  Widget build(BuildContext context) {
    return Padding(
      padding: const EdgeInsets.only(bottom: 12),
      child: Row(
        crossAxisAlignment: CrossAxisAlignment.start,
        children: [
          GameIcon(symbol, size: 22),
          const SizedBox(width: 11),
          Expanded(child: Text(text, style: GameText.body)),
        ],
      ),
    );
  }
}

/// Blazonul plutește ușor și pulsează — dă viață ecranului de start.
class _FloatingCrest extends StatefulWidget {
  const _FloatingCrest();

  @override
  State<_FloatingCrest> createState() => _FloatingCrestState();
}

class _FloatingCrestState extends State<_FloatingCrest>
    with SingleTickerProviderStateMixin {
  late final AnimationController _controller = AnimationController(
    vsync: this,
    duration: const Duration(seconds: 5),
  )..repeat();

  @override
  void dispose() {
    _controller.dispose();
    super.dispose();
  }

  @override
  Widget build(BuildContext context) {
    final l10n = AppLocalizations.of(context);
    return AnimatedBuilder(
      animation: _controller,
      builder: (context, child) {
        final wave = math.sin(_controller.value * 2 * math.pi);
        return Transform.translate(
          offset: Offset(0, wave * 6),
          child: DecoratedBox(
            decoration: BoxDecoration(
              shape: BoxShape.circle,
              boxShadow: [
                BoxShadow(
                  color: GamePalette.arcane.withValues(
                    alpha: 0.18 + 0.1 * (wave + 1) / 2,
                  ),
                  blurRadius: 44,
                  spreadRadius: 6,
                ),
              ],
            ),
            child: child,
          ),
        );
      },
      child: Semantics(
        label: l10n.appTitle,
        image: true,
        child: Image.asset(
          'assets/game/quizrealm_crest.png',
          height: 190,
          fit: BoxFit.contain,
          filterQuality: FilterQuality.high,
        ),
      ),
    );
  }
}


class _CampaignSummary extends StatelessWidget {
  const _CampaignSummary({
    required this.level,
    required this.stars,
    required this.maxStars,
  });

  final int level;
  final int stars;
  final int maxStars;

  @override
  Widget build(BuildContext context) {
    final l10n = AppLocalizations.of(context);
    return Row(
      mainAxisAlignment: MainAxisAlignment.center,
      children: [
        ResourcePill(
          symbol: GameSymbol.shield,
          value: '$level',
          semanticsLabel: l10n.levelBadge(level),
        ),
        const SizedBox(width: 10),
        ResourcePill(
          key: const Key('title-stars'),
          symbol: GameSymbol.star,
          value: l10n.starsShort(stars, maxStars),
          semanticsLabel: l10n.starsCollected(stars, maxStars),
        ),
      ],
    );
  }
}
