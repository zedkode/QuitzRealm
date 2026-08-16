import 'package:flutter/material.dart';

import '../ui/game_icons.dart';
import 'quizrealm_tokens.dart';

/// Rama aurie dublă, cu ornamente în colțuri.
///
/// E blocul de bază al întregii interfețe. Diferența față de un card Material e
/// esențială: panoul **nu** se distinge prin umplutură sau elevație — umplutura
/// e aproape identică cu fundalul — ci prin ramă. De aceea rama nu e un simplu
/// `Border.all`, ci trei straturi: fir exterior întunecat, corp în degradeu și
/// reflex interior.
class GoldFrame extends StatelessWidget {
  const GoldFrame({
    required this.child,
    super.key,
    this.padding = const EdgeInsets.all(QuizRealmSpacing.md),
    this.margin = EdgeInsets.zero,
    this.fill = QuizRealmColors.surfacePanel,
    this.radius = QuizRealmRadius.lg,
    this.borderWidth = QuizRealmBorders.frame,
    this.corners = true,
    this.glow = false,
    this.onTap,
  });

  final Widget child;
  final EdgeInsetsGeometry padding;
  final EdgeInsetsGeometry margin;

  /// Umplutura panoului. Un degradeu se dă prin [gradientFill].
  final Color fill;
  final double radius;
  final double borderWidth;

  /// Ornamentele de colț. Fără ele panoul citește ca un card generic.
  final bool corners;
  final bool glow;
  final VoidCallback? onTap;

  @override
  Widget build(BuildContext context) {
    final content = Padding(padding: padding, child: child);
    return Container(
      margin: margin,
      decoration: BoxDecoration(
        borderRadius: BorderRadius.circular(radius),
        boxShadow: glow
            ? [...QuizRealmShadows.panel, ...QuizRealmShadows.goldGlow]
            : QuizRealmShadows.panel,
      ),
      child: CustomPaint(
        painter: _GoldFramePainter(
          radius: radius,
          borderWidth: borderWidth,
          fill: fill,
          corners: corners,
        ),
        child: onTap == null
            ? content
            : Material(
                color: Colors.transparent,
                child: InkWell(
                  onTap: onTap,
                  borderRadius: BorderRadius.circular(radius),
                  child: content,
                ),
              ),
      ),
    );
  }
}

class _GoldFramePainter extends CustomPainter {
  const _GoldFramePainter({
    required this.radius,
    required this.borderWidth,
    required this.fill,
    required this.corners,
  });

  final double radius;
  final double borderWidth;
  final Color fill;
  final bool corners;

  @override
  void paint(Canvas canvas, Size size) {
    final bounds = Offset.zero & size;
    final outer = RRect.fromRectAndRadius(bounds, Radius.circular(radius));

    canvas.drawRRect(outer, Paint()..color = fill);
    canvas.drawRRect(
      outer.deflate(1),
      Paint()
        ..shader = QuizRealmGradients.engravedObsidian.createShader(bounds)
        ..color = Colors.white.withValues(alpha: 0.9),
    );

    // Firul exterior: separă rama de fundal, altfel auriul se topește în el.
    canvas.drawRRect(
      outer.deflate(borderWidth / 2 + 0.5),
      Paint()
        ..style = PaintingStyle.stroke
        ..strokeWidth = borderWidth
        ..shader = QuizRealmGradients.goldFrame.createShader(bounds),
    );
    canvas.drawRRect(
      outer.deflate(0.5),
      Paint()
        ..style = PaintingStyle.stroke
        ..strokeWidth = 1
        ..color = QuizRealmColors.goldShadow,
    );

    if (!corners) return;

    // Ornamentul: un „L" scurt în fiecare colț, desenat spre interior.
    final ornament = Paint()
      ..style = PaintingStyle.stroke
      ..strokeWidth = 2
      ..strokeCap = StrokeCap.round
      ..color = QuizRealmColors.goldBright;
    const inset = 4.0;
    const arm = 11.0;
    final corner = radius * 0.55;

    void drawCorner(double x, double y, double dx, double dy) {
      final path = Path()
        ..moveTo(x + dx * (corner + arm), y)
        ..lineTo(x + dx * corner, y)
        ..quadraticBezierTo(x, y, x, y + dy * corner)
        ..lineTo(x, y + dy * (corner + arm));
      canvas.drawPath(path, ornament);
    }

    drawCorner(inset, inset, 1, 1);
    drawCorner(size.width - inset, inset, -1, 1);
    drawCorner(inset, size.height - inset, 1, -1);
    drawCorner(size.width - inset, size.height - inset, -1, -1);

    // Sigilii mici în axele ramei: un indiciu cartografic, fără zgomot vizual.
    final rune = Paint()..color = QuizRealmColors.runeViolet.withValues(alpha: 0.38);
    for (final point in [Offset(size.width / 2, 5), Offset(size.width / 2, size.height - 5)]) {
      canvas.save();
      canvas.translate(point.dx, point.dy);
      canvas.rotate(0.785398);
      canvas.drawRect(Rect.fromCenter(center: Offset.zero, width: 4, height: 4), rune);
      canvas.restore();
    }
  }

  @override
  bool shouldRepaint(_GoldFramePainter old) =>
      old.radius != radius ||
      old.borderWidth != borderWidth ||
      old.fill != fill ||
      old.corners != corners;
}

/// Panou cu titlu de secțiune, așa cum apare în setări și pe tabloul de bord.
class FantasyPanel extends StatelessWidget {
  const FantasyPanel({
    required this.child,
    super.key,
    this.title,
    this.symbol,
    this.trailing,
    this.margin = EdgeInsets.zero,
    this.padding = const EdgeInsets.all(QuizRealmSpacing.md),
  });

  final Widget child;
  final String? title;

  /// Simbol din setul jocului. Material-ul n-are voie aici: siluetele lui sunt
  /// subțiri și strică unitatea cu restul iconografiei.
  final GameSymbol? symbol;

  /// Colțul din dreapta al titlului (contor, ceas, acțiune).
  final Widget? trailing;
  final EdgeInsetsGeometry margin;
  final EdgeInsetsGeometry padding;

  @override
  Widget build(BuildContext context) {
    return GoldFrame(
      margin: margin,
      padding: padding,
      child: Column(
        crossAxisAlignment: CrossAxisAlignment.stretch,
        mainAxisSize: MainAxisSize.min,
        children: [
          if (title != null) ...[
            Row(
              children: [
                if (symbol != null) ...[
                  GameIcon(
                    symbol!,
                    size: 18,
                    color: QuizRealmColors.goldBright,
                  ),
                  const SizedBox(width: QuizRealmSpacing.sm),
                ],
                Expanded(
                  child: Text(
                    title!.toUpperCase(),
                    style: QuizRealmTypography.sectionTitle,
                    maxLines: 1,
                    overflow: TextOverflow.ellipsis,
                  ),
                ),
                ?trailing,
              ],
            ),
            const SizedBox(height: QuizRealmSpacing.md),
          ],
          child,
        ],
      ),
    );
  }
}

/// Rândul din interiorul unui panou: fundal abia mai deschis, contur discret.
class PanelRow extends StatelessWidget {
  const PanelRow({
    required this.child,
    super.key,
    this.padding = const EdgeInsets.symmetric(
      horizontal: QuizRealmSpacing.md,
      vertical: QuizRealmSpacing.sm,
    ),
    this.margin = const EdgeInsets.only(bottom: QuizRealmSpacing.sm),
    this.onTap,
  });

  final Widget child;
  final EdgeInsetsGeometry padding;
  final EdgeInsetsGeometry margin;
  final VoidCallback? onTap;

  @override
  Widget build(BuildContext context) {
    final content = Container(
      padding: padding,
      decoration: BoxDecoration(
        color: QuizRealmColors.surfaceRow,
        borderRadius: BorderRadius.circular(QuizRealmRadius.md),
        border: Border.all(color: QuizRealmColors.goldDeep),
      ),
      child: child,
    );
    return Container(
      margin: margin,
      child: onTap == null
          ? content
          : Material(
              color: Colors.transparent,
              child: InkWell(
                onTap: onTap,
                borderRadius: BorderRadius.circular(QuizRealmRadius.md),
                child: content,
              ),
            ),
    );
  }
}
