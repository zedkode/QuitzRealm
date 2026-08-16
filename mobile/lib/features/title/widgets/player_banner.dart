import 'package:flutter/material.dart';

import '../../../core/theme/app_theme.dart';
import '../../../core/ui/game_frame.dart';
import '../../../core/ui/game_icons.dart';
import '../../../domain/player/player_profile.dart';
import '../../../l10n/app_localizations.dart';
import '../../leaderboard/widgets/rank_badge.dart';

/// Banda de identitate din capul ecranului: cine ești, ce rang ai, ce resurse
/// deții.
///
/// Fără cont arată invitația de autentificare, nu date inventate — un ecran
/// care afișează „nivel 1, 0 monede” pentru un vizitator sugerează un cont care
/// nu există.
class PlayerBanner extends StatelessWidget {
  const PlayerBanner({
    required this.profile,
    required this.onTap,
    this.isLoading = false,
    super.key,
  });

  final PlayerProfile? profile;
  final VoidCallback onTap;
  final bool isLoading;

  @override
  Widget build(BuildContext context) {
    final l10n = AppLocalizations.of(context);
    final player = profile;

    return GameFrame(
      key: const Key('home-player-banner'),
      padding: const EdgeInsets.symmetric(horizontal: 12, vertical: 10),
      child: InkWell(
        onTap: onTap,
        borderRadius: BorderRadius.circular(12),
        child: player == null
            ? _GuestRow(isLoading: isLoading, l10n: l10n)
            : _PlayerRow(player: player, l10n: l10n),
      ),
    );
  }
}

class _PlayerRow extends StatelessWidget {
  const _PlayerRow({required this.player, required this.l10n});

  final PlayerProfile player;
  final AppLocalizations l10n;

  @override
  Widget build(BuildContext context) {
    return Row(
      children: [
        RankBadge(rank: player.rank, size: 44),
        const SizedBox(width: 11),
        Expanded(
          child: Column(
            crossAxisAlignment: CrossAxisAlignment.start,
            mainAxisSize: MainAxisSize.min,
            children: [
              Text(
                player.displayName,
                style: GameText.heading.copyWith(fontSize: 14),
                overflow: TextOverflow.ellipsis,
              ),
              const SizedBox(height: 2),
              Text(
                player.rank.label,
                style: GameText.bodyDim.copyWith(fontSize: 11),
                overflow: TextOverflow.ellipsis,
              ),
            ],
          ),
        ),
        const SizedBox(width: 8),
        // Pastilele de resurse nu împing numele afară din rând: pe ecrane mici
        // se strâng, nu depășesc.
        Flexible(
          child: Row(
            mainAxisSize: MainAxisSize.min,
            children: [
              _Resource(
                asset:
                    'assets/game/icons/resources/icon-resource-gold-coin.png',
                value: '${player.coins}',
                semanticsLabel: l10n.homeCoins(player.coins),
              ),
              const SizedBox(width: 6),
              _Resource(
                asset: 'assets/game/icons/resources/icon-resource-xp.png',
                value: '${player.level}',
                semanticsLabel: l10n.levelBadge(player.level),
              ),
            ],
          ),
        ),
      ],
    );
  }
}

class _GuestRow extends StatelessWidget {
  const _GuestRow({required this.isLoading, required this.l10n});

  final bool isLoading;
  final AppLocalizations l10n;

  @override
  Widget build(BuildContext context) {
    return Row(
      children: [
        const GameIcon(
          GameSymbol.helmet,
          size: 30,
          color: GamePalette.creamDim,
        ),
        const SizedBox(width: 11),
        Expanded(
          child: Text(
            isLoading ? l10n.homeLoadingProfile : l10n.homeGuestTitle,
            style: GameText.heading.copyWith(fontSize: 13),
          ),
        ),
        if (!isLoading)
          Text(
            l10n.homeGuestAction,
            style: GameText.bodyDim.copyWith(
              fontSize: 11,
              color: GamePalette.goldBright,
            ),
          ),
      ],
    );
  }
}

class _Resource extends StatelessWidget {
  const _Resource({
    required this.asset,
    required this.value,
    required this.semanticsLabel,
  });

  final String asset;
  final String value;
  final String semanticsLabel;

  @override
  Widget build(BuildContext context) {
    return Semantics(
      label: semanticsLabel,
      child: ExcludeSemantics(
        child: Container(
          padding: const EdgeInsets.symmetric(horizontal: 8, vertical: 4),
          decoration: BoxDecoration(
            color: GamePalette.nightDeep.withValues(alpha: 0.55),
            borderRadius: BorderRadius.circular(20),
            border: Border.all(
              color: GamePalette.gold.withValues(alpha: 0.35),
              width: 1,
            ),
          ),
          child: Row(
            mainAxisSize: MainAxisSize.min,
            children: [
              Image.asset(asset, width: 18, height: 18),
              const SizedBox(width: 5),
              Text(value, style: GameText.numeric.copyWith(fontSize: 12)),
            ],
          ),
        ),
      ),
    );
  }
}
