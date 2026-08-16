import 'package:flutter/material.dart';

import '../design/quizrealm_tokens.dart';
import '../theme/app_theme.dart';

/// Cadru de compatibilitate pentru ecranele vechi. Păstrează API-ul `GameFrame`,
/// însă folosește acum rama aurie dublă și suprafețele bleumarin ale QuizRealm.
class GameFrame extends StatelessWidget {
  const GameFrame({
    required this.child,
    super.key,
    this.padding = const EdgeInsets.all(16),
    this.margin = EdgeInsets.zero,
    this.accent = GamePalette.gold,
    this.radius = 18,
    this.glow = false,
    this.rivets = true,
  }) : assert(radius >= 0);

  final Widget child;
  final EdgeInsetsGeometry padding;
  final EdgeInsetsGeometry margin;
  final Color accent;
  final double radius;
  final bool glow;
  final bool rivets;

  @override
  Widget build(BuildContext context) {
    final outerRadius = BorderRadius.circular(radius);
    final innerRadius = BorderRadius.circular(
      (radius - 3).clamp(0, radius).toDouble(),
    );
    return Container(
      margin: margin,
      decoration: BoxDecoration(
        borderRadius: outerRadius,
        boxShadow: [
          const BoxShadow(
            color: Color(0xA6000000),
            blurRadius: 16,
            offset: Offset(0, 6),
          ),
          if (glow)
            BoxShadow(
              color: accent.withValues(alpha: 0.30),
              blurRadius: 20,
              spreadRadius: 1,
            ),
        ],
      ),
      child: Container(
        padding: const EdgeInsets.all(1.5),
        decoration: BoxDecoration(
          borderRadius: outerRadius,
          gradient: QuizRealmGradients.goldFrame,
        ),
        child: Container(
          padding: const EdgeInsets.all(1),
          decoration: BoxDecoration(
            borderRadius: innerRadius,
            color: QuizRealmColors.goldShadow,
          ),
          child: Container(
            decoration: BoxDecoration(
              borderRadius: innerRadius,
              gradient: LinearGradient(
                begin: Alignment.topCenter,
                end: Alignment.bottomCenter,
                colors: [
                  accent.withValues(alpha: 0.16),
                  QuizRealmColors.surfaceRaised,
                  QuizRealmColors.surfacePanel,
                ],
              ),
            ),
            child: Stack(
              children: [
                if (rivets)
                  Positioned.fill(
                    child: IgnorePointer(
                      child: CustomPaint(
                        painter: _FrameDetailPainter(
                          accent: accent,
                          radius: (radius - 3).clamp(0, radius).toDouble(),
                        ),
                      ),
                    ),
                  ),
                Padding(padding: padding, child: child),
              ],
            ),
          ),
        ),
      ),
    );
  }
}

class _FrameDetailPainter extends CustomPainter {
  const _FrameDetailPainter({required this.accent, required this.radius});

  final Color accent;
  final double radius;

  @override
  void paint(Canvas canvas, Size size) {
    final inset = RRect.fromRectAndRadius(
      Rect.fromLTWH(5, 5, size.width - 10, size.height - 10),
      Radius.circular((radius - 4).clamp(0, radius).toDouble()),
    );
    canvas.drawRRect(
      inset,
      Paint()
        ..style = PaintingStyle.stroke
        ..strokeWidth = 1
        ..color = accent.withValues(alpha: 0.34),
    );

    final ornament = Paint()
      ..style = PaintingStyle.stroke
      ..strokeWidth = 1.8
      ..strokeCap = StrokeCap.round
      ..color = QuizRealmColors.goldBright.withValues(alpha: 0.8);
    const insetAmount = 7.0;
    const arm = 10.0;
    for (final corner in <(double, double, double, double)>[
      (insetAmount, insetAmount, 1, 1),
      (size.width - insetAmount, insetAmount, -1, 1),
      (insetAmount, size.height - insetAmount, 1, -1),
      (size.width - insetAmount, size.height - insetAmount, -1, -1),
    ]) {
      final (x, y, dx, dy) = corner;
      final path = Path()
        ..moveTo(x + dx * arm, y)
        ..lineTo(x, y)
        ..lineTo(x, y + dy * arm);
      canvas.drawPath(path, ornament);
    }
  }

  @override
  bool shouldRepaint(covariant _FrameDetailPainter oldDelegate) {
    return oldDelegate.accent != accent || oldDelegate.radius != radius;
  }
}

/// Păstrează denumirea veche, dar prezintă întrebarea ca panou de joc
/// bleumarin, nu ca o foaie de pergament dintr-un alt stil vizual.
class ParchmentPanel extends StatelessWidget {
  const ParchmentPanel({
    required this.child,
    super.key,
    this.padding = const EdgeInsets.fromLTRB(18, 16, 18, 18),
  });

  final Widget child;
  final EdgeInsetsGeometry padding;

  @override
  Widget build(BuildContext context) {
    return GameFrame(
      padding: padding,
      accent: QuizRealmColors.goldBright,
      glow: true,
      rivets: true,
      child: DefaultTextStyle.merge(
        style: const TextStyle(color: QuizRealmColors.textPrimary),
        child: child,
      ),
    );
  }
}

/// Titlu pe fundal de banderolă, cu capete crestate, pentru rezultate și stări
/// de turneu. Rama aurie îl menține în aceeași familie cu restul panourilor.
class RibbonBanner extends StatelessWidget {
  const RibbonBanner({
    required this.text,
    super.key,
    this.color = GamePalette.crimson,
    this.width,
  });

  final String text;
  final Color color;
  final double? width;

  @override
  Widget build(BuildContext context) {
    return CustomPaint(
      painter: _RibbonPainter(color: color),
      child: Container(
        width: width,
        padding: const EdgeInsets.fromLTRB(30, 9, 30, 11),
        alignment: Alignment.center,
        child: Text(
          text,
          maxLines: 1,
          overflow: TextOverflow.ellipsis,
          style: GameText.heading.copyWith(
            fontSize: 15,
            letterSpacing: 1.1,
            color: QuizRealmColors.goldLight,
            shadows: const [
              Shadow(color: Color(0x99000000), offset: Offset(0, 1)),
            ],
          ),
        ),
      ),
    );
  }
}

class _RibbonPainter extends CustomPainter {
  const _RibbonPainter({required this.color});

  final Color color;

  @override
  void paint(Canvas canvas, Size size) {
    const notch = 14.0;
    final body = Path()
      ..moveTo(0, 0)
      ..lineTo(size.width, 0)
      ..lineTo(size.width - notch, size.height / 2)
      ..lineTo(size.width, size.height)
      ..lineTo(0, size.height)
      ..lineTo(notch, size.height / 2)
      ..close();

    canvas
      ..drawPath(
        body,
        Paint()
          ..shader = LinearGradient(
            begin: Alignment.topCenter,
            end: Alignment.bottomCenter,
            colors: [
              HSLColor.fromColor(color)
                  .withLightness(
                    (HSLColor.fromColor(color).lightness + 0.1).clamp(0, 1),
                  )
                  .toColor(),
              color,
            ],
          ).createShader(Offset.zero & size),
      )
      ..drawPath(
        body,
        Paint()
          ..style = PaintingStyle.stroke
          ..strokeWidth = 1.6
          ..color = QuizRealmColors.gold.withValues(alpha: 0.85),
      );
  }

  @override
  bool shouldRepaint(covariant _RibbonPainter oldDelegate) =>
      oldDelegate.color != color;
}
