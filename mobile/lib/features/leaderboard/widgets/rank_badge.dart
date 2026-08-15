import 'dart:math' as math;

import 'package:flutter/material.dart';

import '../../../core/theme/app_theme.dart';
import '../../../domain/rank/player_rank.dart';

/// Culorile treptelor majore, de la Novice la Mare Maestru.
/// Sunt distincte de badge-urile de achievement, conform `owner-plan.md` §5.3.
abstract final class RankPalette {
  static const _colors = <int, (Color, Color)>{
    1: (Color(0xFF8A93B5), Color(0xFF4A5273)), // Novice — piatră
    2: (Color(0xFFCE9B62), Color(0xFF7A5424)), // Ucenic — bronz
    3: (Color(0xFFB9C6D6), Color(0xFF5E6E82)), // Cercetător — argint
    4: (Color(0xFFF0B542), Color(0xFF9A6C14)), // Erudit — aur
    5: (Color(0xFF57E0C0), Color(0xFF177A66)), // Sofist — smarald
    6: (Color(0xFF5BC8FF), Color(0xFF17557E)), // Filosof — safir
    7: (Color(0xFFB489FF), Color(0xFF4F2A9E)), // Oracol — ametist
    8: (Color(0xFFFF8A6B), Color(0xFF9E2F1B)), // Mare Maestru — jar
  };

  static (Color, Color) of(int majorRank) {
    return _colors[majorRank] ?? _colors[1]!;
  }

  static (Color, Color) legend() =>
      (const Color(0xFFFFE7A3), const Color(0xFFB8860B));
}

/// Insignă de rang: scut heraldic cu numărul diviziunii.
class RankBadge extends StatelessWidget {
  const RankBadge({
    required this.rank,
    super.key,
    this.size = 46,
    this.semanticsLabel,
  }) : assert(size > 0);

  final PlayerRank rank;
  final double size;
  final String? semanticsLabel;

  @override
  Widget build(BuildContext context) {
    final (light, dark) = rank.isLegend
        ? RankPalette.legend()
        : RankPalette.of(rank.majorRank);

    final badge = SizedBox.square(
      dimension: size,
      child: CustomPaint(
        painter: _RankBadgePainter(
          light: light,
          dark: dark,
          pips: rank.division,
          crowned: rank.majorRank >= 8 || rank.isLegend,
        ),
        child: Center(
          child: Padding(
            padding: EdgeInsets.only(bottom: size * 0.06),
            child: Text(
              rank.isLegend ? '★' : '${rank.majorRank}',
              style: TextStyle(
                fontFamily: 'Cinzel',
                fontWeight: FontWeight.w900,
                fontSize: size * 0.34,
                color: GamePalette.nightDeep,
              ),
            ),
          ),
        ),
      ),
    );

    if (semanticsLabel == null) return ExcludeSemantics(child: badge);
    return Semantics(
      label: semanticsLabel,
      child: ExcludeSemantics(child: badge),
    );
  }
}

class _RankBadgePainter extends CustomPainter {
  const _RankBadgePainter({
    required this.light,
    required this.dark,
    required this.pips,
    required this.crowned,
  });

  final Color light;
  final Color dark;
  final int? pips;
  final bool crowned;

  @override
  void paint(Canvas canvas, Size size) {
    final scale = size.shortestSide / 24;
    canvas
      ..save()
      ..scale(scale);

    final shield = Path()
      ..moveTo(12, 1.5)
      ..lineTo(21, 5)
      ..lineTo(21, 11.5)
      ..cubicTo(21, 16.6, 17.2, 20.4, 12, 22)
      ..cubicTo(6.8, 20.4, 3, 16.6, 3, 11.5)
      ..lineTo(3, 5)
      ..close();

    canvas
      ..drawPath(
        shield,
        Paint()
          ..shader = LinearGradient(
            begin: Alignment.topCenter,
            end: Alignment.bottomCenter,
            colors: [light, dark],
          ).createShader(const Rect.fromLTWH(0, 0, 24, 24)),
      )
      ..drawPath(
        shield,
        Paint()
          ..style = PaintingStyle.stroke
          ..strokeWidth = 1.1
          ..color = GamePalette.nightDeep.withValues(alpha: 0.65),
      )
      // Luciu în jumătatea stângă, ca metalul să pară turnat.
      ..drawPath(
        Path()
          ..moveTo(12, 3)
          ..lineTo(12, 20.2)
          ..lineTo(5, 15.4)
          ..lineTo(5, 5.8)
          ..close(),
        Paint()..color = Colors.white.withValues(alpha: 0.16),
      );

    if (crowned) {
      canvas.drawPath(
        Path()
          ..moveTo(7.5, 4.6)
          ..lineTo(8.6, 1.4)
          ..lineTo(10.6, 3.4)
          ..lineTo(12, 0.6)
          ..lineTo(13.4, 3.4)
          ..lineTo(15.4, 1.4)
          ..lineTo(16.5, 4.6)
          ..close(),
        Paint()..color = light,
      );
    }

    // Diviziunea, ca puncte sub blazon (III jos, I sus, ca în MOBA-uri).
    final count = pips ?? 0;
    if (count > 0) {
      final paint = Paint()..color = GamePalette.nightDeep.withValues(alpha: 0.8);
      const radius = 1.05;
      final startX = 12 - (count - 1) * 1.7;
      for (var index = 0; index < count; index++) {
        canvas.drawCircle(
          Offset(startX + index * 3.4, 17.6),
          radius,
          paint,
        );
      }
    }

    canvas.restore();
  }

  @override
  bool shouldRepaint(covariant _RankBadgePainter oldDelegate) {
    return oldDelegate.light != light ||
        oldDelegate.dark != dark ||
        oldDelegate.pips != pips ||
        oldDelegate.crowned != crowned;
  }
}

/// Bara de progres către treapta următoare.
class RankProgressBar extends StatelessWidget {
  const RankProgressBar({
    required this.rank,
    required this.label,
    super.key,
    this.height = 10,
  });

  final PlayerRank rank;
  final String label;
  final double height;

  @override
  Widget build(BuildContext context) {
    final (light, dark) = rank.isLegend
        ? RankPalette.legend()
        : RankPalette.of(rank.majorRank);
    return Semantics(
      label: label,
      child: ExcludeSemantics(
        child: ClipRRect(
          borderRadius: BorderRadius.circular(height),
          child: Container(
            height: height,
            decoration: BoxDecoration(
              color: GamePalette.stone900,
              border: Border.all(color: dark.withValues(alpha: 0.7)),
              borderRadius: BorderRadius.circular(height),
            ),
            child: Align(
              alignment: Alignment.centerLeft,
              child: FractionallySizedBox(
                widthFactor: math.max(rank.progress, 0.02),
                // `SizedBox.expand` este obligatoriu: un `DecoratedBox` fără
                // copil s-ar prăbuși la înălțime zero și bara ar părea goală.
                child: SizedBox.expand(
                  key: const Key('rank-progress-fill'),
                  child: DecoratedBox(
                    decoration: BoxDecoration(
                      gradient: LinearGradient(colors: [dark, light]),
                    ),
                  ),
                ),
              ),
            ),
          ),
        ),
      ),
    );
  }
}
