import 'package:flutter/material.dart';

import '../../../core/theme/app_theme.dart';
import '../../../core/ui/game_icons.dart';
import '../battle_controller.dart';

/// Traseul asaltului: un scut pentru fiecare întrebare, colorat după rezultat.
class BattleTrack extends StatelessWidget {
  const BattleTrack({
    required this.outcomes,
    required this.currentIndex,
    super.key,
  });

  final List<AnswerOutcome?> outcomes;
  final int currentIndex;

  @override
  Widget build(BuildContext context) {
    return SizedBox(
      height: 30,
      child: Row(
        key: const Key('battle-track'),
        mainAxisAlignment: MainAxisAlignment.center,
        children: [
          for (var index = 0; index < outcomes.length; index++) ...[
            if (index > 0)
              Container(
                width: 12,
                height: 2,
                color: GamePalette.gold.withValues(alpha: 0.28),
              ),
            _TrackNode(
              key: Key('track-$index-${_stateName(index)}'),
              outcome: outcomes[index],
              active: index == currentIndex,
            ),
          ],
        ],
      ),
    );
  }

  String _stateName(int index) {
    final outcome = outcomes[index];
    if (outcome != null) return outcome.name;
    return index == currentIndex ? 'current' : 'pending';
  }
}

class _TrackNode extends StatelessWidget {
  const _TrackNode({required this.outcome, required this.active, super.key});

  final AnswerOutcome? outcome;
  final bool active;

  @override
  Widget build(BuildContext context) {
    final (color, symbol) = switch (outcome) {
      AnswerOutcome.correct => (GamePalette.emerald, GameSymbol.castle),
      AnswerOutcome.incorrect ||
      AnswerOutcome.timedOut => (GamePalette.crimson, GameSymbol.cross),
      null => active
          ? (GamePalette.goldBright, GameSymbol.sword)
          : (GamePalette.stone600, GameSymbol.shield),
    };

    return AnimatedContainer(
      duration: const Duration(milliseconds: 260),
      width: active ? 28 : 24,
      height: active ? 28 : 24,
      decoration: BoxDecoration(
        shape: BoxShape.circle,
        color: GamePalette.stone900,
        border: Border.all(color: color, width: active ? 2 : 1.4),
        boxShadow: active
            ? [BoxShadow(color: color.withValues(alpha: 0.5), blurRadius: 10)]
            : null,
      ),
      child: Center(
        child: GameIcon(symbol, size: active ? 15 : 12, color: color),
      ),
    );
  }
}
