import 'dart:math' as math;

import 'package:flutter/material.dart';

import '../design/quizrealm_tokens.dart';

/// Fundalul viu al jocului. Poate combina o scenă ilustrată cu particule discrete,
/// păstrând centrul întunecat pentru ca elementele de joc să rămână lizibile.
class RealmBackdrop extends StatefulWidget {
  const RealmBackdrop({
    required this.child,
    super.key,
    this.accent = QuizRealmColors.gold,
    this.intensity = 1,
    this.artAsset,
    this.artOpacity = 0.86,
  }) : assert(intensity >= 0),
       assert(artOpacity >= 0 && artOpacity <= 1);

  final Widget child;
  final Color accent;
  final double intensity;

  /// Fundal ilustrat opțional. Este plasat sub particule și sub UI.
  final String? artAsset;
  final double artOpacity;

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
      decoration: const BoxDecoration(gradient: QuizRealmGradients.screen),
      child: Stack(
        fit: StackFit.expand,
        children: [
          if (widget.artAsset != null)
            RepaintBoundary(
              child: Opacity(
                opacity: widget.artOpacity,
                child: Image.asset(widget.artAsset!, fit: BoxFit.cover),
              ),
            ),
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

  static const _starCount = 34;
  static const _moteCount = 12;

  @override
  void paint(Canvas canvas, Size size) {
    final random = math.Random(7);
    final pulse = 0.5 + 0.5 * math.sin(time * 2 * math.pi);

    // Halourile sunt ținute la margini pentru a nu concura cu întrebarea.
    canvas
      ..drawCircle(
        Offset(size.width * 0.84, size.height * 0.14),
        size.shortestSide * 0.5,
        Paint()
          ..color = accent.withValues(alpha: 0.055 * intensity * (0.7 + pulse * 0.5))
          ..maskFilter = const MaskFilter.blur(BlurStyle.normal, 56),
      )
      ..drawCircle(
        Offset(size.width * 0.1, size.height * 0.77),
        size.shortestSide * 0.54,
        Paint()
          ..color = QuizRealmColors.electric.withValues(
            alpha: 0.045 * intensity * (1.2 - pulse * 0.5),
          )
          ..maskFilter = const MaskFilter.blur(BlurStyle.normal, 68),
      );

    for (var index = 0; index < _starCount; index++) {
      final dx = random.nextDouble() * size.width;
      final dy = random.nextDouble() * size.height;
      final phase = random.nextDouble();
      final twinkle =
          0.35 + 0.65 * (0.5 + 0.5 * math.sin((time + phase) * math.pi * 4));
      final radius = 0.55 + random.nextDouble() * 1.1;
      canvas.drawCircle(
        Offset(dx, dy),
        radius,
        Paint()
          ..color = (index % 5 == 0 ? accent : QuizRealmColors.textPrimary)
              .withValues(alpha: 0.38 * twinkle * intensity),
      );
    }

    for (var index = 0; index < _moteCount; index++) {
      final baseX = random.nextDouble() * size.width;
      final speed = 0.4 + random.nextDouble() * 0.8;
      final progress = (time * speed + random.nextDouble()) % 1;
      final dy = size.height * (1 - progress);
      final dx = baseX + math.sin((progress + index) * math.pi * 2) * 14;
      canvas.drawCircle(
        Offset(dx, dy),
        1.2,
        Paint()
          ..color = accent.withValues(alpha: 0.18 * intensity * (1 - progress))
          ..maskFilter = const MaskFilter.blur(BlurStyle.normal, 2),
      );
    }

    // Vigneta centrală păstrează lizibilitatea indiferent de activul de fundal.
    canvas.drawRect(
      Offset.zero & size,
      Paint()
        ..shader = RadialGradient(
          radius: 0.98,
          colors: [
            Colors.transparent,
            QuizRealmColors.backgroundDeep.withValues(alpha: 0.72),
          ],
          stops: const [0.48, 1],
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
