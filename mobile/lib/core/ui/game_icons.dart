import 'dart:math' as math;

import 'package:flutter/widgets.dart';

import '../theme/app_theme.dart';

/// Simbolurile jocului. Sunt desenate vectorial, nu luate din setul Material,
/// ca să aibă toate aceeași siluetă groasă, de icon de joc.
enum GameSymbol {
  shield,
  sword,
  swords,
  crown,
  coin,
  flame,
  scroll,
  star,
  lock,
  castle,
  banner,
  gem,
  book,
  trophy,
  hourglass,
  map,
  skull,
  bolt,
  check,
  cross,
  play,
  back,
  globe,
  flask,
  mask,
  helmet,
  compass,
  chevronRight,
}

/// Icon desenat pe o grilă de 24×24, colorat cu un degrade vertical și,
/// opțional, cu o aură în spate.
class GameIcon extends StatelessWidget {
  const GameIcon(
    this.symbol, {
    super.key,
    this.size = 24,
    this.color = GamePalette.gold,
    this.shadeColor,
    this.glow = false,
    this.semanticLabel,
  }) : assert(size > 0);

  final GameSymbol symbol;
  final double size;
  final Color color;
  final Color? shadeColor;
  final bool glow;
  final String? semanticLabel;

  @override
  Widget build(BuildContext context) {
    final icon = SizedBox.square(
      dimension: size,
      child: CustomPaint(
        painter: _GameIconPainter(
          symbol: symbol,
          color: color,
          shadeColor: shadeColor ?? _darken(color, 0.32),
          glow: glow,
        ),
      ),
    );
    if (semanticLabel == null) {
      return ExcludeSemantics(child: icon);
    }
    return Semantics(label: semanticLabel, child: ExcludeSemantics(child: icon));
  }
}

Color _darken(Color color, double amount) {
  final hsl = HSLColor.fromColor(color);
  return hsl
      .withLightness((hsl.lightness - amount).clamp(0.0, 1.0))
      .withSaturation((hsl.saturation + amount * 0.3).clamp(0.0, 1.0))
      .toColor();
}

class _GameIconPainter extends CustomPainter {
  const _GameIconPainter({
    required this.symbol,
    required this.color,
    required this.shadeColor,
    required this.glow,
  });

  final GameSymbol symbol;
  final Color color;
  final Color shadeColor;
  final bool glow;

  @override
  void paint(Canvas canvas, Size size) {
    final scale = size.shortestSide / 24;
    canvas.save();
    canvas.translate(
      (size.width - 24 * scale) / 2,
      (size.height - 24 * scale) / 2,
    );
    canvas.scale(scale);

    final bounds = const Rect.fromLTWH(0, 0, 24, 24);
    final fill = Paint()
      ..shader = LinearGradient(
        begin: Alignment.topCenter,
        end: Alignment.bottomCenter,
        colors: [color, shadeColor],
      ).createShader(bounds)
      ..isAntiAlias = true;

    final stroke = Paint()
      ..style = PaintingStyle.stroke
      ..strokeWidth = 1.6
      ..strokeCap = StrokeCap.round
      ..strokeJoin = StrokeJoin.round
      ..color = color
      ..isAntiAlias = true;

    if (glow) {
      canvas.drawCircle(
        const Offset(12, 12),
        11,
        Paint()
          ..color = color.withValues(alpha: 0.22)
          ..maskFilter = const MaskFilter.blur(BlurStyle.normal, 6),
      );
    }

    switch (symbol) {
      case GameSymbol.check:
        canvas.drawPath(
          Path()
            ..moveTo(4.5, 12.5)
            ..lineTo(9.5, 17.5)
            ..lineTo(19.5, 6.5),
          stroke..strokeWidth = 3,
        );
      case GameSymbol.cross:
        canvas
          ..drawLine(
            const Offset(6, 6),
            const Offset(18, 18),
            stroke..strokeWidth = 3,
          )
          ..drawLine(const Offset(18, 6), const Offset(6, 18), stroke);
      case GameSymbol.chevronRight:
        canvas.drawPath(
          Path()
            ..moveTo(9, 5)
            ..lineTo(16, 12)
            ..lineTo(9, 19),
          stroke..strokeWidth = 2.6,
        );
      default:
        canvas.drawPath(_pathFor(symbol), fill);
        // Sub ~16 px detaliile interioare se citesc ca murdărie, nu ca relief.
        if (size.shortestSide >= 16) _paintDetails(canvas, symbol);
    }

    canvas.restore();
  }

  /// Detaliile desenate peste silueta plină (fante, ochi, fațete…).
  void _paintDetails(Canvas canvas, GameSymbol symbol) {
    final light = Paint()
      ..color = const Color(0x59FFFFFF)
      ..isAntiAlias = true;
    final dark = Paint()
      ..color = shadeColor.withValues(alpha: 0.85)
      ..isAntiAlias = true;
    final line = Paint()
      ..style = PaintingStyle.stroke
      ..strokeWidth = 1.1
      ..strokeCap = StrokeCap.round
      ..color = shadeColor.withValues(alpha: 0.9)
      ..isAntiAlias = true;

    switch (symbol) {
      case GameSymbol.shield:
        canvas.drawPath(
          Path()
            ..moveTo(12, 3.4)
            ..lineTo(12, 20.4)
            ..lineTo(5, 15)
            ..lineTo(5, 6)
            ..close(),
          light,
        );
      case GameSymbol.coin:
        canvas
          ..drawCircle(const Offset(12, 12), 6.4, dark)
          ..drawPath(_starPath(const Offset(12, 12), 4.6, 2.1, 5), light);
      case GameSymbol.gem:
        canvas
          ..drawLine(const Offset(4, 10), const Offset(20, 10), line)
          ..drawLine(const Offset(9, 10), const Offset(12, 21), line)
          ..drawLine(const Offset(15, 10), const Offset(12, 21), line);
      case GameSymbol.castle:
        canvas
          ..drawRect(const Rect.fromLTWH(10.6, 14, 2.8, 7), dark)
          ..drawRect(const Rect.fromLTWH(5.4, 15, 2, 2.6), dark)
          ..drawRect(const Rect.fromLTWH(16.6, 15, 2, 2.6), dark);
      case GameSymbol.book:
        canvas
          ..drawLine(const Offset(12, 5.6), const Offset(12, 19.6), line)
          ..drawLine(const Offset(5.5, 9), const Offset(10, 9), line)
          ..drawLine(const Offset(14, 9), const Offset(18.5, 9), line)
          ..drawLine(const Offset(5.5, 12), const Offset(10, 12), line)
          ..drawLine(const Offset(14, 12), const Offset(18.5, 12), line);
      case GameSymbol.scroll:
        canvas
          ..drawLine(const Offset(8.5, 9.5), const Offset(16, 9.5), line)
          ..drawLine(const Offset(8.5, 12.5), const Offset(16, 12.5), line)
          ..drawLine(const Offset(8.5, 15.5), const Offset(13.5, 15.5), line);
      case GameSymbol.skull:
        canvas
          ..drawCircle(const Offset(9.4, 11.4), 1.9, dark)
          ..drawCircle(const Offset(14.6, 11.4), 1.9, dark)
          ..drawRect(const Rect.fromLTWH(11.2, 14.4, 1.6, 2.4), dark);
      case GameSymbol.hourglass:
        canvas.drawPath(
          Path()
            ..moveTo(9, 7.5)
            ..lineTo(15, 7.5)
            ..lineTo(12, 12)
            ..close(),
          light,
        );
      case GameSymbol.mask:
        canvas
          ..drawCircle(const Offset(9, 11), 1.5, dark)
          ..drawCircle(const Offset(15, 11), 1.5, dark);
      case GameSymbol.globe:
        canvas
          ..drawLine(const Offset(3.4, 12), const Offset(20.6, 12), line)
          ..drawOval(
            Rect.fromCenter(
              center: const Offset(12, 12),
              width: 9,
              height: 17.2,
            ),
            line,
          );
      case GameSymbol.compass:
        canvas.drawPath(
          Path()
            ..moveTo(15.6, 8.4)
            ..lineTo(13.2, 13.2)
            ..lineTo(8.4, 15.6)
            ..lineTo(10.8, 10.8)
            ..close(),
          light,
        );
      case GameSymbol.flask:
        canvas.drawPath(
          Path()
            ..moveTo(8.2, 15)
            ..lineTo(15.8, 15)
            ..lineTo(17.6, 19)
            ..lineTo(6.4, 19)
            ..close(),
          dark,
        );
      case GameSymbol.helmet:
        canvas.drawRect(const Rect.fromLTWH(11.1, 9, 1.8, 8), dark);
      case GameSymbol.trophy:
        canvas.drawPath(
          Path()
            ..moveTo(9.5, 5.5)
            ..lineTo(9.5, 11)
            ..lineTo(11.4, 13.6)
            ..lineTo(11.4, 5.5)
            ..close(),
          light,
        );
      default:
        break;
    }
  }

  Path _pathFor(GameSymbol symbol) {
    switch (symbol) {
      case GameSymbol.shield:
        return Path()
          ..moveTo(12, 1.8)
          ..lineTo(21, 5)
          ..lineTo(21, 11.4)
          ..cubicTo(21, 16.6, 17.2, 20.6, 12, 22.2)
          ..cubicTo(6.8, 20.6, 3, 16.6, 3, 11.4)
          ..lineTo(3, 5)
          ..close();

      case GameSymbol.sword:
        return _swordPath();

      case GameSymbol.swords:
        // Două săbii încrucișate: aceeași siluetă ca `sword`, rotită simetric.
        final left = _rotated(_swordPath(), -0.62);
        final right = _rotated(_swordPath(), 0.62);
        return Path.combine(PathOperation.union, left, right);

      case GameSymbol.crown:
        return Path()
          ..moveTo(2.6, 19.4)
          ..lineTo(4.2, 6.2)
          ..lineTo(8.6, 11.6)
          ..lineTo(12, 3.6)
          ..lineTo(15.4, 11.6)
          ..lineTo(19.8, 6.2)
          ..lineTo(21.4, 19.4)
          ..close();

      case GameSymbol.coin:
        return Path()
          ..addOval(Rect.fromCircle(center: const Offset(12, 12), radius: 9.4));

      case GameSymbol.flame:
        return Path()
          ..moveTo(12, 1.8)
          ..cubicTo(15.4, 6.4, 19.6, 8.4, 19.6, 13.6)
          ..cubicTo(19.6, 18.4, 16.2, 22.2, 12, 22.2)
          ..cubicTo(7.8, 22.2, 4.4, 18.4, 4.4, 13.6)
          ..cubicTo(4.4, 10.4, 6.4, 8.6, 8.2, 6.4)
          ..cubicTo(8.6, 9.6, 10.2, 10.6, 11, 10.6)
          ..cubicTo(12.2, 10.6, 10.4, 6.2, 12, 1.8)
          ..close();

      case GameSymbol.scroll:
        return Path()
          ..addRRect(
            RRect.fromRectAndRadius(
              const Rect.fromLTWH(5.4, 3.6, 13.2, 17),
              const Radius.circular(2.4),
            ),
          )
          ..addRRect(
            RRect.fromRectAndRadius(
              const Rect.fromLTWH(3.2, 2.4, 4.4, 19.4),
              const Radius.circular(2.2),
            ),
          )
          ..addRRect(
            RRect.fromRectAndRadius(
              const Rect.fromLTWH(16.4, 2.4, 4.4, 19.4),
              const Radius.circular(2.2),
            ),
          );

      case GameSymbol.star:
        return _starPath(const Offset(12, 12.4), 10.4, 4.4, 5);

      case GameSymbol.lock:
        final body = Path()
          ..addRRect(
            RRect.fromRectAndRadius(
              const Rect.fromLTWH(4.4, 10, 15.2, 11.6),
              const Radius.circular(2.6),
            ),
          );
        final shackle = Path()
          ..moveTo(7, 11)
          ..lineTo(7, 8.4)
          ..arcToPoint(
            const Offset(17, 8.4),
            radius: const Radius.circular(5),
          )
          ..lineTo(17, 11)
          ..lineTo(14.4, 11)
          ..lineTo(14.4, 8.4)
          ..arcToPoint(
            const Offset(9.6, 8.4),
            radius: const Radius.circular(2.4),
            clockwise: false,
          )
          ..lineTo(9.6, 11)
          ..close();
        return Path.combine(PathOperation.union, body, shackle);

      case GameSymbol.castle:
        return Path()
          ..moveTo(2.6, 21.4)
          ..lineTo(2.6, 6.4)
          ..lineTo(5, 6.4)
          ..lineTo(5, 8.6)
          ..lineTo(7.4, 8.6)
          ..lineTo(7.4, 6.4)
          ..lineTo(9.8, 6.4)
          ..lineTo(9.8, 8.6)
          ..lineTo(10.4, 8.6)
          ..lineTo(10.4, 3.6)
          ..lineTo(13.6, 3.6)
          ..lineTo(13.6, 8.6)
          ..lineTo(14.2, 8.6)
          ..lineTo(14.2, 6.4)
          ..lineTo(16.6, 6.4)
          ..lineTo(16.6, 8.6)
          ..lineTo(19, 8.6)
          ..lineTo(19, 6.4)
          ..lineTo(21.4, 6.4)
          ..lineTo(21.4, 21.4)
          ..close();

      case GameSymbol.banner:
        return Path()
          ..moveTo(4.6, 2.6)
          ..lineTo(19.4, 2.6)
          ..lineTo(19.4, 21.4)
          ..lineTo(12, 16.8)
          ..lineTo(4.6, 21.4)
          ..close();

      case GameSymbol.gem:
        return Path()
          ..moveTo(7.6, 3.4)
          ..lineTo(16.4, 3.4)
          ..lineTo(21.4, 10.2)
          ..lineTo(12, 21.4)
          ..lineTo(2.6, 10.2)
          ..close();

      case GameSymbol.book:
        return Path()
          ..moveTo(3.4, 4.4)
          ..cubicTo(6.4, 3, 9.6, 3.4, 12, 5.4)
          ..cubicTo(14.4, 3.4, 17.6, 3, 20.6, 4.4)
          ..lineTo(20.6, 19.8)
          ..cubicTo(17.6, 18.4, 14.4, 18.8, 12, 20.6)
          ..cubicTo(9.6, 18.8, 6.4, 18.4, 3.4, 19.8)
          ..close();

      case GameSymbol.trophy:
        return Path()
          ..moveTo(7.4, 3)
          ..lineTo(16.6, 3)
          ..lineTo(16.6, 10.4)
          ..cubicTo(16.6, 13.4, 14.6, 15.4, 12, 15.4)
          ..cubicTo(9.4, 15.4, 7.4, 13.4, 7.4, 10.4)
          ..close()
          ..addRRect(
            RRect.fromRectAndRadius(
              const Rect.fromLTWH(10.6, 15, 2.8, 3.6),
              const Radius.circular(0.8),
            ),
          )
          ..addRRect(
            RRect.fromRectAndRadius(
              const Rect.fromLTWH(6.6, 18.4, 10.8, 3),
              const Radius.circular(1.4),
            ),
          )
          ..addRRect(
            RRect.fromRectAndRadius(
              const Rect.fromLTWH(2.8, 4, 4.6, 6.4),
              const Radius.circular(2.2),
            ),
          )
          ..addRRect(
            RRect.fromRectAndRadius(
              const Rect.fromLTWH(16.6, 4, 4.6, 6.4),
              const Radius.circular(2.2),
            ),
          );

      case GameSymbol.hourglass:
        return Path()
          ..moveTo(5, 2.6)
          ..lineTo(19, 2.6)
          ..lineTo(19, 5)
          ..lineTo(13.6, 12)
          ..lineTo(19, 19)
          ..lineTo(19, 21.4)
          ..lineTo(5, 21.4)
          ..lineTo(5, 19)
          ..lineTo(10.4, 12)
          ..lineTo(5, 5)
          ..close();

      case GameSymbol.map:
        return Path()
          ..moveTo(2.6, 5.4)
          ..lineTo(9, 3)
          ..lineTo(15, 6)
          ..lineTo(21.4, 3.4)
          ..lineTo(21.4, 18.6)
          ..lineTo(15, 21)
          ..lineTo(9, 18)
          ..lineTo(2.6, 20.6)
          ..close();

      case GameSymbol.skull:
        return Path()
          ..moveTo(12, 2.4)
          ..cubicTo(17.2, 2.4, 20.6, 6, 20.6, 11)
          ..cubicTo(20.6, 14.4, 18.6, 16.4, 17.4, 17.4)
          ..lineTo(17.4, 20.4)
          ..lineTo(6.6, 20.4)
          ..lineTo(6.6, 17.4)
          ..cubicTo(5.4, 16.4, 3.4, 14.4, 3.4, 11)
          ..cubicTo(3.4, 6, 6.8, 2.4, 12, 2.4)
          ..close();

      case GameSymbol.bolt:
        return Path()
          ..moveTo(13.6, 2)
          ..lineTo(5, 13.4)
          ..lineTo(10.6, 13.4)
          ..lineTo(9.4, 22)
          ..lineTo(19, 10.2)
          ..lineTo(13.2, 10.2)
          ..close();

      case GameSymbol.play:
        return Path()
          ..moveTo(6.4, 3.4)
          ..lineTo(20.4, 12)
          ..lineTo(6.4, 20.6)
          ..close();

      case GameSymbol.back:
        return Path()
          ..moveTo(11.4, 3.4)
          ..lineTo(11.4, 8.6)
          ..lineTo(21.4, 8.6)
          ..lineTo(21.4, 15.4)
          ..lineTo(11.4, 15.4)
          ..lineTo(11.4, 20.6)
          ..lineTo(2.6, 12)
          ..close();

      case GameSymbol.globe:
        return Path()
          ..addOval(Rect.fromCircle(center: const Offset(12, 12), radius: 9.4));

      case GameSymbol.flask:
        return Path()
          ..moveTo(9.4, 2.6)
          ..lineTo(14.6, 2.6)
          ..lineTo(14.6, 9)
          ..lineTo(19.8, 18.4)
          ..cubicTo(20.8, 20.2, 19.6, 21.6, 17.8, 21.6)
          ..lineTo(6.2, 21.6)
          ..cubicTo(4.4, 21.6, 3.2, 20.2, 4.2, 18.4)
          ..lineTo(9.4, 9)
          ..close();

      case GameSymbol.mask:
        return Path()
          ..moveTo(4, 4.4)
          ..lineTo(20, 4.4)
          ..lineTo(20, 12)
          ..cubicTo(20, 17.4, 16.4, 21.4, 12, 21.4)
          ..cubicTo(7.6, 21.4, 4, 17.4, 4, 12)
          ..close();

      case GameSymbol.helmet:
        return Path()
          ..moveTo(12, 2.4)
          ..cubicTo(17, 2.4, 20.4, 6, 20.4, 11.4)
          ..lineTo(20.4, 21.4)
          ..lineTo(3.6, 21.4)
          ..lineTo(3.6, 11.4)
          ..cubicTo(3.6, 6, 7, 2.4, 12, 2.4)
          ..close();

      case GameSymbol.compass:
        return Path()
          ..addOval(Rect.fromCircle(center: const Offset(12, 12), radius: 9.4));

      case GameSymbol.check:
      case GameSymbol.cross:
      case GameSymbol.chevronRight:
        return Path();
    }
  }

  @override
  bool shouldRepaint(covariant _GameIconPainter oldDelegate) {
    return oldDelegate.symbol != symbol ||
        oldDelegate.color != color ||
        oldDelegate.shadeColor != shadeColor ||
        oldDelegate.glow != glow;
  }
}

/// Sabie cu vârful în sus, pe grila de 24×24.
Path _swordPath() {
  return Path()
    // lamă
    ..moveTo(12, 1.6)
    ..lineTo(14.2, 5.4)
    ..lineTo(14.2, 14)
    ..lineTo(9.8, 14)
    ..lineTo(9.8, 5.4)
    ..close()
    // gardă
    ..addRRect(
      RRect.fromRectAndRadius(
        const Rect.fromLTWH(6.2, 14, 11.6, 2.4),
        const Radius.circular(1.2),
      ),
    )
    // mâner
    ..addRRect(
      RRect.fromRectAndRadius(
        const Rect.fromLTWH(10.9, 16.4, 2.2, 4),
        const Radius.circular(1.1),
      ),
    )
    // măciulie
    ..addOval(Rect.fromCircle(center: const Offset(12, 21), radius: 1.6));
}

/// Rotește o formă în jurul centrului grilei.
Path _rotated(Path path, double radians) {
  final matrix = Matrix4.identity()
    ..translateByDouble(12, 12, 0, 1)
    ..rotateZ(radians)
    ..translateByDouble(-12, -12, 0, 1);
  return path.transform(matrix.storage);
}

Path _starPath(Offset center, double outer, double inner, int points) {
  final path = Path();
  final step = math.pi / points;
  for (var index = 0; index < points * 2; index++) {
    final radius = index.isEven ? outer : inner;
    final angle = -math.pi / 2 + index * step;
    final point = Offset(
      center.dx + radius * math.cos(angle),
      center.dy + radius * math.sin(angle),
    );
    index == 0
        ? path.moveTo(point.dx, point.dy)
        : path.lineTo(point.dx, point.dy);
  }
  return path..close();
}
