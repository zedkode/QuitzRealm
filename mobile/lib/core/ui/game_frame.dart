import 'package:flutter/material.dart';

import '../theme/app_theme.dart';

/// Panou de piatră cu ramă aurie și nituri în colțuri — containerul standard
/// al interfeței de joc.
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
    final border = BorderRadius.circular(radius);
    return Container(
      margin: margin,
      decoration: BoxDecoration(
        borderRadius: border,
        boxShadow: [
          BoxShadow(
            color: Colors.black.withValues(alpha: 0.55),
            blurRadius: 18,
            offset: const Offset(0, 8),
          ),
          if (glow)
            BoxShadow(
              color: accent.withValues(alpha: 0.28),
              blurRadius: 26,
              spreadRadius: 1,
            ),
        ],
      ),
      child: Container(
        decoration: BoxDecoration(
          borderRadius: border,
          gradient: LinearGradient(
            begin: Alignment.topLeft,
            end: Alignment.bottomRight,
            colors: [
              accent.withValues(alpha: 0.85),
              accent.withValues(alpha: 0.32),
              accent.withValues(alpha: 0.7),
            ],
          ),
        ),
        padding: const EdgeInsets.all(1.6),
        child: Container(
          decoration: BoxDecoration(
            borderRadius: BorderRadius.circular(radius - 1.6),
            gradient: const LinearGradient(
              begin: Alignment.topCenter,
              end: Alignment.bottomCenter,
              colors: [GamePalette.stone800, GamePalette.stone900],
            ),
          ),
          child: Stack(
            children: [
              Positioned.fill(
                child: IgnorePointer(
                  child: CustomPaint(
                    painter: _FrameDetailPainter(
                      accent: accent,
                      radius: radius - 1.6,
                      rivets: rivets,
                    ),
                  ),
                ),
              ),
              Padding(padding: padding, child: child),
            ],
          ),
        ),
      ),
    );
  }
}

class _FrameDetailPainter extends CustomPainter {
  const _FrameDetailPainter({
    required this.accent,
    required this.radius,
    required this.rivets,
  });

  final Color accent;
  final double radius;
  final bool rivets;

  @override
  void paint(Canvas canvas, Size size) {
    // Linie interioară subțire, ca o gravură.
    final inset = RRect.fromRectAndRadius(
      Rect.fromLTWH(5, 5, size.width - 10, size.height - 10),
      Radius.circular((radius - 4).clamp(0, radius)),
    );
    canvas.drawRRect(
      inset,
      Paint()
        ..style = PaintingStyle.stroke
        ..strokeWidth = 1
        ..color = accent.withValues(alpha: 0.24),
    );

    if (!rivets) return;
    final rivet = Paint()..color = accent.withValues(alpha: 0.75);
    final rivetCore = Paint()
      ..color = GamePalette.stone900.withValues(alpha: 0.8);
    const offset = 11.0;
    for (final center in [
      Offset(offset, offset),
      Offset(size.width - offset, offset),
      Offset(offset, size.height - offset),
      Offset(size.width - offset, size.height - offset),
    ]) {
      canvas
        ..drawCircle(center, 3, rivet)
        ..drawCircle(center, 1.3, rivetCore);
    }
  }

  @override
  bool shouldRepaint(covariant _FrameDetailPainter oldDelegate) {
    return oldDelegate.accent != accent ||
        oldDelegate.radius != radius ||
        oldDelegate.rivets != rivets;
  }
}

/// Cardul de pergament pe care se citește întrebarea.
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
    return Container(
      decoration: BoxDecoration(
        borderRadius: BorderRadius.circular(14),
        boxShadow: [
          BoxShadow(
            color: Colors.black.withValues(alpha: 0.5),
            blurRadius: 16,
            offset: const Offset(0, 7),
          ),
        ],
      ),
      child: ClipRRect(
        borderRadius: BorderRadius.circular(14),
        child: DecoratedBox(
          decoration: BoxDecoration(
            gradient: const LinearGradient(
              begin: Alignment.topLeft,
              end: Alignment.bottomRight,
              colors: [
                GamePalette.parchment,
                Color(0xFFEFDCB6),
                GamePalette.parchmentShade,
              ],
            ),
            border: Border.all(color: GamePalette.goldDeep, width: 1.5),
            borderRadius: BorderRadius.circular(14),
          ),
          child: Stack(
            children: [
              Positioned.fill(
                child: IgnorePointer(
                  child: CustomPaint(painter: const _ParchmentGrainPainter()),
                ),
              ),
              Padding(padding: padding, child: child),
            ],
          ),
        ),
      ),
    );
  }
}

class _ParchmentGrainPainter extends CustomPainter {
  const _ParchmentGrainPainter();

  // Pete fixe de „uzură” — deterministe, ca să nu clipească la fiecare cadru.
  static const _stains = <Offset>[
    Offset(0.12, 0.22),
    Offset(0.78, 0.14),
    Offset(0.55, 0.63),
    Offset(0.24, 0.82),
    Offset(0.9, 0.72),
  ];

  @override
  void paint(Canvas canvas, Size size) {
    final paint = Paint()..color = const Color(0x14705520);
    for (var index = 0; index < _stains.length; index++) {
      canvas.drawCircle(
        Offset(_stains[index].dx * size.width, _stains[index].dy * size.height),
        (index.isEven ? 26 : 17).toDouble(),
        paint,
      );
    }
    canvas.drawRect(
      Offset.zero & size,
      Paint()
        ..shader = const LinearGradient(
          begin: Alignment.topCenter,
          end: Alignment.bottomCenter,
          colors: [Color(0x00000000), Color(0x1A6B4A16)],
        ).createShader(Offset.zero & size),
    );
  }

  @override
  bool shouldRepaint(covariant CustomPainter oldDelegate) => false;
}

/// Titlu pe fundal de banderolă, cu capete crestate.
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
                    (HSLColor.fromColor(color).lightness + 0.12).clamp(0, 1),
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
          ..strokeWidth = 1.4
          ..color = GamePalette.gold.withValues(alpha: 0.8),
      );
  }

  @override
  bool shouldRepaint(covariant _RibbonPainter oldDelegate) =>
      oldDelegate.color != color;
}
