import 'package:flutter/material.dart';
import 'package:flutter_riverpod/flutter_riverpod.dart';
import 'package:go_router/go_router.dart';

import '../../core/theme/app_theme.dart';
import '../../core/ui/game_button.dart';
import '../../core/ui/game_frame.dart';
import '../../core/ui/game_icons.dart';
import '../../core/ui/realm_backdrop.dart';
import '../../domain/rank/player_rank.dart';
import '../../l10n/app_localizations.dart';
import 'leaderboard_controller.dart';
import 'widgets/rank_badge.dart';

/// Clasamentul global + poziția și rangul jucătorului.
class LeaderboardScreen extends ConsumerWidget {
  const LeaderboardScreen({super.key});

  @override
  Widget build(BuildContext context, WidgetRef ref) {
    final l10n = AppLocalizations.of(context);
    final state = ref.watch(leaderboardControllerProvider);

    return Scaffold(
      body: RealmBackdrop(
        accent: GamePalette.goldBright,
        artAsset: 'assets/game/realm_map_v2.png',
        artOpacity: 0.22,
        child: SafeArea(
          child: Column(
            children: [
              Padding(
                padding: const EdgeInsets.fromLTRB(10, 6, 14, 4),
                child: Row(
                  children: [
                    GameIconButton(
                      symbol: GameSymbol.back,
                      tooltip: l10n.backLabel,
                      size: 40,
                      onPressed: () => context.pop(),
                    ),
                    const SizedBox(width: 10),
                    Expanded(
                      child: Text(
                        l10n.leaderboardTitle,
                        style: GameText.heading.copyWith(fontSize: 16),
                      ),
                    ),
                  ],
                ),
              ),
              Expanded(child: _buildBody(context, ref, state)),
            ],
          ),
        ),
      ),
    );
  }

  Widget _buildBody(
    BuildContext context,
    WidgetRef ref,
    LeaderboardState state,
  ) {
    final l10n = AppLocalizations.of(context);

    return switch (state.status) {
      LeaderboardStatus.loading => const Center(
        child: CircularProgressIndicator(),
      ),
      LeaderboardStatus.error => Center(
        child: Padding(
          padding: const EdgeInsets.all(22),
          child: GameFrame(
            glow: true,
            child: Column(
              mainAxisSize: MainAxisSize.min,
              children: [
                const GameIcon(GameSymbol.skull, size: 48),
                const SizedBox(height: 14),
                Text(
                  l10n.leaderboardErrorTitle,
                  textAlign: TextAlign.center,
                  style: GameText.title,
                ),
                const SizedBox(height: 8),
                Text(
                  l10n.leaderboardErrorBody,
                  textAlign: TextAlign.center,
                  style: GameText.bodyDim,
                ),
                const SizedBox(height: 18),
                GameButton(
                  label: l10n.retry,
                  onPressed: () =>
                      ref.read(leaderboardControllerProvider.notifier).load(),
                ),
              ],
            ),
          ),
        ),
      ),
      LeaderboardStatus.ready => _LeaderboardList(state: state),
    };
  }
}

class _LeaderboardList extends StatelessWidget {
  const _LeaderboardList({required this.state});

  final LeaderboardState state;

  @override
  Widget build(BuildContext context) {
    final l10n = AppLocalizations.of(context);
    final mine = state.myEntry;

    return ListView(
      padding: const EdgeInsets.fromLTRB(14, 4, 14, 26),
      children: [
        if (mine != null) ...[
          _MyStandingCard(entry: mine),
          const SizedBox(height: 14),
        ],
        Text(
          l10n.leaderboardPlayerCount(state.total),
          style: GameText.eyebrow,
        ),
        const SizedBox(height: 8),
        if (state.entries.isEmpty)
          GameFrame(
            child: Text(l10n.leaderboardEmpty, style: GameText.bodyDim),
          )
        else
          for (final entry in state.entries)
            Padding(
              padding: const EdgeInsets.only(bottom: 8),
              child: _LeaderboardRow(
                entry: entry,
                highlighted: entry.userId == mine?.userId,
              ),
            ),
        if (state.showsMySeparately && mine != null) ...[
          const SizedBox(height: 6),
          Text(l10n.leaderboardYourPlace, style: GameText.eyebrow),
          const SizedBox(height: 8),
          _LeaderboardRow(entry: mine, highlighted: true),
        ],
      ],
    );
  }
}

class _MyStandingCard extends StatelessWidget {
  const _MyStandingCard({required this.entry});

  final LeaderboardEntry entry;

  @override
  Widget build(BuildContext context) {
    final l10n = AppLocalizations.of(context);
    final rank = entry.rank;
    final toNext = rank.eloToNextTier;

    return GameFrame(
      key: const Key('my-standing'),
      accent: RankPalette.of(rank.majorRank).$1,
      glow: true,
      child: Column(
        crossAxisAlignment: CrossAxisAlignment.stretch,
        children: [
          Row(
            children: [
              RankBadge(
                rank: rank,
                size: 62,
                semanticsLabel: l10n.rankSemantics(rank.label, rank.elo),
              ),
              const SizedBox(width: 14),
              Expanded(
                child: Column(
                  crossAxisAlignment: CrossAxisAlignment.start,
                  children: [
                    Text(entry.username, style: GameText.heading),
                    const SizedBox(height: 2),
                    Text(
                      rank.label,
                      style: GameText.body.copyWith(
                        color: RankPalette.of(rank.majorRank).$1,
                        fontWeight: FontWeight.w800,
                      ),
                    ),
                    const SizedBox(height: 2),
                    Text(
                      l10n.leaderboardPositionLine(
                        entry.position,
                        entry.matchesPlayed,
                      ),
                      style: GameText.bodyDim.copyWith(fontSize: 12),
                    ),
                  ],
                ),
              ),
            ],
          ),
          const SizedBox(height: 12),
          RankProgressBar(
            rank: rank,
            label: toNext == null
                ? l10n.rankTopReached
                : l10n.rankToNext(toNext),
          ),
          const SizedBox(height: 6),
          Text(
            toNext == null ? l10n.rankTopReached : l10n.rankToNext(toNext),
            style: GameText.bodyDim.copyWith(fontSize: 12),
          ),
        ],
      ),
    );
  }
}

class _LeaderboardRow extends StatelessWidget {
  const _LeaderboardRow({required this.entry, required this.highlighted});

  final LeaderboardEntry entry;
  final bool highlighted;

  @override
  Widget build(BuildContext context) {
    final l10n = AppLocalizations.of(context);
    final accent = RankPalette.of(entry.rank.majorRank).$1;

    return Semantics(
      label: l10n.leaderboardRowSemantics(
        entry.position,
        entry.username,
        entry.rank.label,
      ),
      child: ExcludeSemantics(
        child: Container(
          padding: const EdgeInsets.fromLTRB(10, 8, 12, 8),
          decoration: BoxDecoration(
            borderRadius: BorderRadius.circular(12),
            color: highlighted
                ? GamePalette.stone800
                : GamePalette.stone900.withValues(alpha: 0.9),
            border: Border.all(
              color: highlighted
                  ? GamePalette.goldBright
                  : accent.withValues(alpha: 0.35),
              width: highlighted ? 1.6 : 1,
            ),
          ),
          child: Row(
            children: [
              SizedBox(
                width: 34,
                child: Text(
                  '${entry.position}',
                  textAlign: TextAlign.center,
                  style: GameText.numeric.copyWith(
                    fontSize: 16,
                    color: entry.position <= 3
                        ? GamePalette.goldBright
                        : GamePalette.creamDim,
                  ),
                ),
              ),
              RankBadge(rank: entry.rank, size: 34),
              const SizedBox(width: 10),
              Expanded(
                child: Column(
                  crossAxisAlignment: CrossAxisAlignment.start,
                  children: [
                    Text(
                      entry.username,
                      maxLines: 1,
                      overflow: TextOverflow.ellipsis,
                      style: GameText.body.copyWith(
                        fontWeight: FontWeight.w700,
                      ),
                    ),
                    Text(
                      entry.rank.label,
                      maxLines: 1,
                      overflow: TextOverflow.ellipsis,
                      style: GameText.bodyDim.copyWith(fontSize: 11.5),
                    ),
                  ],
                ),
              ),
              const SizedBox(width: 8),
              Text('${entry.elo}', style: GameText.numeric.copyWith(fontSize: 15)),
            ],
          ),
        ),
      ),
    );
  }
}
