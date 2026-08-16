import 'package:flutter/material.dart';

import '../../../core/design/gold_frame.dart';
import '../../../core/design/quizrealm_tokens.dart';
import '../../../core/ui/game_icons.dart';

/// HUD-ul „tu contra adversar”. Accentuează confruntarea dintre cele două
/// facțiuni, fără a depinde de avatarurile de profil care pot lipsi în MVP.
class DuelScoreboard extends StatelessWidget {
  const DuelScoreboard({
    required this.youLabel,
    required this.opponentLabel,
    required this.youScore,
    required this.opponentScore,
    required this.youTerritories,
    required this.opponentTerritories,
    super.key,
  });

  final String youLabel;
  final String opponentLabel;
  final int youScore;
  final int opponentScore;
  final int youTerritories;
  final int opponentTerritories;

  @override
  Widget build(BuildContext context) {
    return GoldFrame(
      key: const Key('duel-scoreboard'),
      fill: QuizRealmColors.surfaceRaised,
      padding: const EdgeInsets.fromLTRB(8, 8, 8, 10),
      borderWidth: QuizRealmBorders.emphasis,
      glow: true,
      child: Row(
        crossAxisAlignment: CrossAxisAlignment.center,
        children: [
          Expanded(
            child: _DuelFactionCard(
              label: youLabel,
              score: youScore,
              territories: youTerritories,
              asset: 'assets/game/avatars/default_duelist_blue.png',
              accent: QuizRealmColors.electric,
              banner: QuizRealmGradients.selfBanner,
              alignment: CrossAxisAlignment.start,
              textAlign: TextAlign.left,
              leading: true,
            ),
          ),
          const Padding(
            padding: EdgeInsets.symmetric(horizontal: 4),
            child: _VersusMark(),
          ),
          Expanded(
            child: _DuelFactionCard(
              label: opponentLabel,
              score: opponentScore,
              territories: opponentTerritories,
              asset: 'assets/game/avatars/default_duelist_crimson.png',
              accent: QuizRealmColors.crimson,
              banner: QuizRealmGradients.opponentBanner,
              alignment: CrossAxisAlignment.end,
              textAlign: TextAlign.right,
              leading: false,
            ),
          ),
        ],
      ),
    );
  }
}

class _DuelFactionCard extends StatelessWidget {
  const _DuelFactionCard({
    required this.label,
    required this.score,
    required this.territories,
    required this.asset,
    required this.accent,
    required this.banner,
    required this.alignment,
    required this.textAlign,
    required this.leading,
  });

  final String label;
  final int score;
  final int territories;
  final String asset;
  final Color accent;
  final Gradient banner;
  final CrossAxisAlignment alignment;
  final TextAlign textAlign;
  final bool leading;

  @override
  Widget build(BuildContext context) {
    final portrait = Semantics(
      image: true,
      label: label,
      child: Image.asset(asset, width: 50, height: 50, fit: BoxFit.contain),
    );
    final detail = Expanded(
      child: Column(
        mainAxisSize: MainAxisSize.min,
        crossAxisAlignment: alignment,
        children: [
          Text(
            label.toUpperCase(),
            maxLines: 1,
            overflow: TextOverflow.ellipsis,
            textAlign: textAlign,
            style: QuizRealmTypography.navLabel.copyWith(color: accent),
          ),
          const SizedBox(height: 2),
          Text(
            '$score',
            style: QuizRealmTypography.numeric.copyWith(
              fontFamily: QuizRealmTypography.displayFamily,
              fontSize: 25,
              color: QuizRealmColors.textPrimary,
              fontWeight: FontWeight.w800,
            ),
          ),
          const SizedBox(height: 2),
          Row(
            mainAxisSize: MainAxisSize.min,
            children: [
              if (leading) ...[
                GameIcon(GameSymbol.castle, size: 13, color: accent),
                const SizedBox(width: 4),
              ],
              Text(
                '$territories',
                style: QuizRealmTypography.bodySecondary.copyWith(
                  color: QuizRealmColors.textSecondary,
                  fontWeight: FontWeight.w700,
                ),
              ),
              if (!leading) ...[
                const SizedBox(width: 4),
                GameIcon(GameSymbol.castle, size: 13, color: accent),
              ],
            ],
          ),
        ],
      ),
    );

    return Container(
      padding: const EdgeInsets.all(5),
      decoration: BoxDecoration(
        gradient: banner,
        border: Border.all(color: accent.withValues(alpha: 0.72)),
        borderRadius: BorderRadius.circular(QuizRealmRadius.md),
        boxShadow: [
          BoxShadow(color: accent.withValues(alpha: 0.16), blurRadius: 10),
        ],
      ),
      child: Row(
        mainAxisSize: MainAxisSize.min,
        children: leading
            ? [portrait, const SizedBox(width: 5), detail]
            : [detail, const SizedBox(width: 5), portrait],
      ),
    );
  }
}

class _VersusMark extends StatelessWidget {
  const _VersusMark();

  @override
  Widget build(BuildContext context) {
    return Column(
      mainAxisSize: MainAxisSize.min,
      children: [
        Container(
          width: 37,
          height: 37,
          alignment: Alignment.center,
          decoration: BoxDecoration(
            shape: BoxShape.circle,
            color: QuizRealmColors.backgroundDeep,
            border: Border.all(
              color: QuizRealmColors.goldBright,
              width: QuizRealmBorders.frame,
            ),
            boxShadow: QuizRealmShadows.goldGlow,
          ),
          child: const GameIcon(
            GameSymbol.swords,
            size: 20,
            color: QuizRealmColors.goldBright,
          ),
        ),
        const SizedBox(height: 2),
        Text(
          'VS',
          style: QuizRealmTypography.navLabel.copyWith(
            fontSize: 8,
            color: QuizRealmColors.goldLight,
          ),
        ),
      ],
    );
  }
}
