import 'dart:math' as math;

import 'package:flutter/material.dart';

import '../theme/app_theme.dart';

/// Fundalul viu al jocului: cer de noapte, aurore care pulsează și praf de
/// stele care plutește. Un singur controller animă tot, ca să rămână ieftin.
class RealmBackdrop extends StatefulWidget {
  const RealmBackdrop({
    required this.child,
    super.key,
    this.accent = GamePalette.gold,
    this.intensity = 1,
  }) : assert(intensity >= 0);

  final Widget child;
  final Color accent;
  final double intensity;

  @override
  State<RealmBackdrop> createState() => _RealmBackdropState();
}

class _RealmBackdropState extends State<RealmBackdrop>
    with SingleTickerProviderStateMixin {
  late final AnimationController _controller = AnimationController(
    vsync: this,
    duration: const Duration(seconds: 24),
  )..repeat();

  @override
  void dispose() {
    _controller.dispose();
    super.dispose();
  }

  @override
  Widget build(BuildContext context) {
    return DecoratedBox(
      decoration: const BoxDecoration(
        gradient: LinearGradient(
          begin: Alignment.topCenter,
          end: Alignment.bottomCenter,
          colors: [
            GamePalette.dusk,
            GamePalette.night,
            GamePalette.nightDeep,
          ],
          stops: [0, 0.55, 1],
        ),
      ),
      child: Stack(
        fit: StackFit.expand,
        children: [
          RepaintBoundary(
            child: AnimatedBuilder(
              animation: _controller,
              builder: (context, _) {
                return CustomPaint(
                  painter: _SkyPainter(
                    time: _controller.value,
                    accent: widget.accent,
                    intensity: widget.intensity,
                  ),
                );
              },
            ),
          ),
          widget.child,
        ],
      ),
    );
  }
}

class _SkyPainter extends CustomPainter {
  const _SkyPainter({
    required this.time,
    required this.accent,
    required this.intensity,
  });

  final double time;
  final Color accent;
  final double intensity;

  static const _starCount = 46;
  static const _moteCount = 14;

  @override
  void paint(Canvas canvas, Size size) {
    final random = math.Random(7);

    // Aurore difuze.
    final pulse = 0.5 + 0.5 * math.sin(time * 2 * math.pi);
    canvas
      ..drawCircle(
        Offset(size.width * 0.82, size.height * 0.12),
        size.shortestSide * 0.55,
        Paint()
          ..color = accent.withValues(alpha: 0.07 * intensity * (0.7 + pulse * 0.5))
          ..maskFilter = const MaskFilter.blur(BlurStyle.normal, 60),
      )
      ..drawCircle(
        Offset(size.width * 0.12, size.height * 0.78),
        size.shortestSide * 0.62,
        Paint()
          ..color = GamePalette.arcane.withValues(
            alpha: 0.06 * intensity * (1.2 - pulse * 0.5),
          )
          ..maskFilter = const MaskFilter.blur(BlurStyle.normal, 70),
      );

    // Stele care clipesc.
    for (var index = 0; index < _starCount; index++) {
      final dx = random.nextDouble() * size.width;
      final dy = random.nextDouble() * size.height;
      final phase = random.nextDouble();
      final twinkle =
          0.35 + 0.65 * (0.5 + 0.5 * math.sin((time + phase) * 2 * math.pi * 2));
      final radius = 0.6 + random.nextDouble() * 1.3;
      canvas.drawCircle(
        Offset(dx, dy),
        radius,
        Paint()
          ..color = (index % 5 == 0 ? accent : GamePalette.cream).withValues(
            alpha: 0.5 * twinkle * intensity,
          ),
      );
    }

    // Praf care urcă lent.
    for (var index = 0; index < _moteCount; index++) {
      final baseX = random.nextDouble() * size.width;
      final speed = 0.4 + random.nextDouble() * 0.8;
      final progress = (time * speed + random.nextDouble()) % 1;
      final dy = size.height * (1 - progress);
      final dx = baseX + math.sin((progress + index) * math.pi * 2) * 14;
      canvas.drawCircle(
        Offset(dx, dy),
        1.4,
        Paint()
          ..color = accent.withValues(alpha: 0.22 * intensity * (1 - progress))
          ..maskFilter = const MaskFilter.blur(BlurStyle.normal, 2),
      );
    }

    // Vignetă, ca să iasă interfața în față.
    canvas.drawRect(
      Offset.zero & size,
      Paint()
        ..shader = RadialGradient(
          radius: 0.95,
          colors: [
            Colors.transparent,
            GamePalette.nightDeep.withValues(alpha: 0.75),
          ],
          stops: const [0.55, 1],
        ).createShader(Offset.zero & size),
    );
  }

  @override
  bool shouldRepaint(covariant _SkyPainter oldDelegate) {
    return oldDelegate.time != time ||
        oldDelegate.accent != accent ||
        oldDelegate.intensity != intensity;
  }
}
