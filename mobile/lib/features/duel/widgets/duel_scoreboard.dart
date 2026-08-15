import 'package:flutter/material.dart';

import '../../../core/theme/app_theme.dart';
import '../../../core/ui/game_frame.dart';
import '../../../core/ui/game_icons.dart';

/// Tabela „tu contra adversar”: scor și teritorii, față în față.
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
    return GameFrame(
      key: const Key('duel-scoreboard'),
      accent: GamePalette.crimson,
      padding: const EdgeInsets.fromLTRB(12, 10, 12, 10),
      radius: 16,
      rivets: false,
      child: Row(
        children: [
          Expanded(
            child: _Side(
              label: youLabel,
              score: youScore,
              territories: youTerritories,
              color: GamePalette.arcane,
              leading: true,
            ),
          ),
          const _VersusMark(),
          Expanded(
            child: _Side(
              label: opponentLabel,
              score: opponentScore,
              territories: opponentTerritories,
              color: GamePalette.crimson,
              leading: false,
            ),
          ),
        ],
      ),
    );
  }
}

class _Side extends StatelessWidget {
  const _Side({
    required this.label,
    required this.score,
    required this.territories,
    required this.color,
    required this.leading,
  });

  final String label;
  final int score;
  final int territories;
  final Color color;
  final bool leading;

  @override
  Widget build(BuildContext context) {
    return Column(
      crossAxisAlignment: leading
          ? CrossAxisAlignment.start
          : CrossAxisAlignment.end,
      children: [
        Text(
          label,
          style: GameText.eyebrow.copyWith(color: color, letterSpacing: 1.4),
        ),
        const SizedBox(height: 3),
        Text('$score', style: GameText.numeric.copyWith(fontSize: 24)),
        const SizedBox(height: 2),
        Row(
          mainAxisSize: MainAxisSize.min,
          children: [
            if (leading) ...[
              GameIcon(GameSymbol.castle, size: 13, color: color),
              const SizedBox(width: 4),
            ],
            Text(
              '$territories',
              style: GameText.bodyDim.copyWith(
                fontSize: 12,
                fontWeight: FontWeight.w700,
              ),
            ),
            if (!leading) ...[
              const SizedBox(width: 4),
              GameIcon(GameSymbol.castle, size: 13, color: color),
            ],
          ],
        ),
      ],
    );
  }
}

class _VersusMark extends StatelessWidget {
  const _VersusMark();

  @override
  Widget build(BuildContext context) {
    return Padding(
      padding: const EdgeInsets.symmetric(horizontal: 10),
      child: Column(
        mainAxisSize: MainAxisSize.min,
        children: [
          const GameIcon(
            GameSymbol.swords,
            size: 26,
            color: GamePalette.goldBright,
          ),
          const SizedBox(height: 2),
          Text(
            'VS',
            style: GameText.eyebrow.copyWith(
              fontSize: 9,
              color: GamePalette.creamDim,
            ),
          ),
        ],
      ),
    );
  }
}
