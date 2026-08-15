import 'dart:math' as math;

import 'package:flutter/material.dart';

import '../../../core/theme/app_theme.dart';
import '../../../core/ui/game_frame.dart';
import '../../../core/ui/game_icons.dart';

/// Bara de stare a asaltului: rundă, scor, serie și clepsidra circulară.
class BattleHud extends StatelessWidget {
  const BattleHud({
    required this.roundLabel,
    required this.roundValue,
    required this.scoreLabel,
    required this.scoreValue,
    required this.streakLabel,
    required this.streakValue,
    required this.seconds,
    required this.totalSeconds,
    required this.timerSemanticsLabel,
    super.key,
  }) : assert(totalSeconds > 0),
       assert(seconds >= 0 && seconds <= totalSeconds);

  final String roundLabel;
  final String roundValue;
  final String scoreLabel;
  final String scoreValue;
  final String streakLabel;
  final String streakValue;
  final int seconds;
  final int totalSeconds;
  final String timerSemanticsLabel;

  @override
  Widget build(BuildContext context) {
    return GameFrame(
      key: const Key('battle-hud'),
      padding: const EdgeInsets.fromLTRB(12, 8, 10, 8),
      radius: 16,
      rivets: false,
      child: Row(
        children: [
          Expanded(
            child: _HudStat(
              key: const Key('hud-round'),
              symbol: GameSymbol.map,
              color: GamePalette.arcane,
              label: roundLabel,
              value: roundValue,
            ),
          ),
          const _HudDivider(),
          Expanded(
            child: _HudStat(
              key: const Key('hud-score'),
              symbol: GameSymbol.gem,
              color: GamePalette.goldBright,
              label: scoreLabel,
              value: scoreValue,
            ),
          ),
          const _HudDivider(),
          Expanded(
            child: _HudStat(
              key: const Key('hud-streak'),
              symbol: GameSymbol.flame,
              color: GamePalette.crimson,
              label: streakLabel,
              value: streakValue,
            ),
          ),
          const SizedBox(width: 6),
          BattleTimer(
            seconds: seconds,
            totalSeconds: totalSeconds,
            semanticsLabel: timerSemanticsLabel,
          ),
        ],
      ),
    );
  }
}

class _HudStat extends StatelessWidget {
  const _HudStat({
    required this.symbol,
    required this.color,
    required this.label,
    required this.value,
    super.key,
  });

  final GameSymbol symbol;
  final Color color;
  final String label;
  final String value;

  @override
  Widget build(BuildContext context) {
    return Column(
      mainAxisSize: MainAxisSize.min,
      children: [
        GameIcon(symbol, size: 17, color: color),
        const SizedBox(height: 2),
        FittedBox(
          fit: BoxFit.scaleDown,
          child: Text(
            value,
            maxLines: 1,
            style: GameText.numeric.copyWith(fontSize: 15),
          ),
        ),
        FittedBox(
          fit: BoxFit.scaleDown,
          child: Text(
            label,
            maxLines: 1,
            style: TextStyle(
              fontSize: 8.5,
              letterSpacing: 0.7,
              fontWeight: FontWeight.w800,
              color: GamePalette.cream.withValues(alpha: 0.62),
            ),
          ),
        ),
      ],
    );
  }
}

class _HudDivider extends StatelessWidget {
  const _HudDivider();

  @override
  Widget build(BuildContext context) {
    return Container(
      width: 1,
      height: 38,
      color: GamePalette.gold.withValues(alpha: 0.2),
    );
  }
}

/// Clepsidra circulară. Sub un sfert din timp devine roșie și pulsează.
class BattleTimer extends StatelessWidget {
  const BattleTimer({
    required this.seconds,
    required this.totalSeconds,
    required this.semanticsLabel,
    super.key,
    this.size = 54,
  });

  final int seconds;
  final int totalSeconds;
  final String semanticsLabel;
  final double size;

  @override
  Widget build(BuildContext context) {
    final progress = seconds / totalSeconds;
    final urgent = progress <= 0.25;
    return Semantics(
      label: semanticsLabel,
      value: '$seconds',
      child: ExcludeSemantics(
        child: TweenAnimationBuilder<double>(
          key: const Key('battle-timer'),
          tween: Tween(begin: progress, end: progress),
          duration: const Duration(milliseconds: 320),
          builder: (context, value, child) {
            return SizedBox.square(
              dimension: size,
              child: CustomPaint(
                painter: _TimerRingPainter(progress: value, urgent: urgent),
                child: Center(
                  child: Text(
                    '$seconds',
                    style: GameText.numeric.copyWith(
                      fontSize: size * 0.33,
                      color: urgent ? GamePalette.crimson : GamePalette.cream,
                    ),
                  ),
                ),
              ),
            );
          },
        ),
      ),
    );
  }
}

class _TimerRingPainter extends CustomPainter {
  const _TimerRingPainter({required this.progress, required this.urgent});

  final double progress;
  final bool urgent;

  @override
  void paint(Canvas canvas, Size size) {
    final center = size.center(Offset.zero);
    final radius = math.min(size.width, size.height) / 2 - 4;
    final bounds = Rect.fromCircle(center: center, radius: radius);
    final value = progress.clamp(0.0, 1.0);

    canvas
      ..drawCircle(
        center,
        radius,
        Paint()..color = GamePalette.nightDeep.withValues(alpha: 0.9),
      )
      ..drawCircle(
        center,
        radius,
        Paint()
          ..style = PaintingStyle.stroke
          ..strokeWidth = 4
          ..color = GamePalette.cream.withValues(alpha: 0.1),
      )
      ..drawArc(
        bounds,
        -math.pi / 2,
        math.pi * 2 * value,
        false,
        Paint()
          ..shader = SweepGradient(
            startAngle: -math.pi / 2,
            endAngle: math.pi * 1.5,
            colors: urgent
                ? const [GamePalette.crimson, Color(0xFFFFB08A)]
                : const [GamePalette.arcane, GamePalette.goldBright],
          ).createShader(bounds)
          ..style = PaintingStyle.stroke
          ..strokeCap = StrokeCap.round
          ..strokeWidth = 5,
      );
  }

  @override
  bool shouldRepaint(covariant _TimerRingPainter oldDelegate) {
    return oldDelegate.progress != progress || oldDelegate.urgent != urgent;
  }
}
