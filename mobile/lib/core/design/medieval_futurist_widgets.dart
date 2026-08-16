import 'package:flutter/material.dart';

import 'quizrealm_tokens.dart';

/// Primitive vizuale comune pentru noua identitate medieval-futuristă.
/// Sunt intenționat fără logică de domeniu: orice ecran le poate compune.
class RealmBackdrop extends StatelessWidget {
  const RealmBackdrop({super.key, required this.child, this.padding = EdgeInsets.zero});

  final Widget child;
  final EdgeInsetsGeometry padding;

  @override
  Widget build(BuildContext context) {
    return Container(
      decoration: const BoxDecoration(gradient: QuizRealmGradients.screen),
      child: CustomPaint(
        painter: const _ConstellationGridPainter(),
        child: Padding(padding: padding, child: child),
      ),
    );
  }
}

class HeraldicPanel extends StatelessWidget {
  const HeraldicPanel({super.key, required this.child, this.padding = const EdgeInsets.all(16), this.highlighted = false});

  final Widget child;
  final EdgeInsetsGeometry padding;
  final bool highlighted;

  @override
  Widget build(BuildContext context) {
    return Container(
      decoration: BoxDecoration(
        gradient: QuizRealmGradients.engravedObsidian,
        borderRadius: BorderRadius.circular(QuizRealmRadius.lg),
        border: Border.all(color: highlighted ? QuizRealmColors.goldBright : QuizRealmColors.goldDeep, width: highlighted ? 2 : 1),
        boxShadow: highlighted ? QuizRealmShadows.goldGlow : QuizRealmShadows.panel,
      ),
      child: Stack(
        children: [
          Positioned.fill(child: IgnorePointer(child: CustomPaint(painter: _FiligreePainter(color: highlighted ? QuizRealmColors.goldBright : QuizRealmColors.goldDeep)))),
          Padding(padding: padding, child: child),
        ],
      ),
    );
  }
}

class SigilButton extends StatelessWidget {
  const SigilButton({super.key, required this.label, required this.onPressed, this.icon, this.expanded = true});

  final String label;
  final VoidCallback? onPressed;
  final IconData? icon;
  final bool expanded;

  @override
  Widget build(BuildContext context) {
    final content = InkWell(
      onTap: onPressed,
      borderRadius: BorderRadius.circular(QuizRealmRadius.md),
      child: Ink(
        height: 52,
        decoration: BoxDecoration(
          gradient: QuizRealmGradients.heraldicGold,
          borderRadius: BorderRadius.circular(QuizRealmRadius.md),
          border: Border.all(color: QuizRealmColors.goldLight),
          boxShadow: QuizRealmShadows.goldGlow,
        ),
        child: Stack(
          alignment: Alignment.center,
          children: [
            Positioned.fill(child: IgnorePointer(child: CustomPaint(painter: const _SigilEdgePainter()))),
            Row(mainAxisSize: MainAxisSize.min, children: [
              if (icon != null) ...[Icon(icon, color: QuizRealmColors.textOnGold, size: 19), const SizedBox(width: 9)],
              Text(label.toUpperCase(), style: QuizRealmTypography.buttonLabel.copyWith(color: QuizRealmColors.textOnGold, fontSize: 13)),
            ]),
          ],
        ),
      ),
    );
    return expanded ? SizedBox(width: double.infinity, child: content) : content;
  }
}

class RuneAvatar extends StatelessWidget {
  const RuneAvatar({super.key, required this.image, required this.size, this.online = false});

  final ImageProvider image;
  final double size;
  final bool online;

  @override
  Widget build(BuildContext context) {
    return SizedBox(
      width: size,
      height: size,
      child: Stack(children: [
        Container(
          decoration: BoxDecoration(shape: BoxShape.circle, gradient: QuizRealmGradients.astralCurrent, boxShadow: QuizRealmShadows.runeGlow),
          padding: const EdgeInsets.all(3),
          child: Container(decoration: BoxDecoration(shape: BoxShape.circle, image: DecorationImage(image: image, fit: BoxFit.cover))),
        ),
        if (online) Positioned(right: 1, bottom: 2, child: Container(width: size * .22, height: size * .22, decoration: BoxDecoration(shape: BoxShape.circle, color: QuizRealmColors.onlineDot, border: Border.all(color: QuizRealmColors.obsidian, width: 2)))),
      ]),
    );
  }
}

class _ConstellationGridPainter extends CustomPainter {
  const _ConstellationGridPainter();

  @override
  void paint(Canvas canvas, Size size) {
    final grid = Paint()..color = QuizRealmColors.runeViolet.withValues(alpha: .08)..strokeWidth = 1;
    const spacing = 42.0;
    for (double x = 0; x < size.width; x += spacing) {
      canvas.drawLine(Offset(x, 0), Offset(x, size.height), grid);
    }
    for (double y = 0; y < size.height; y += spacing) {
      canvas.drawLine(Offset(0, y), Offset(size.width, y), grid);
    }
    final stars = Paint()..color = QuizRealmColors.goldLight.withValues(alpha: .56);
    for (final point in [Offset(size.width * .12, 54), Offset(size.width * .78, 124), Offset(size.width * .36, size.height * .78), Offset(size.width * .9, size.height * .58)]) {
      canvas.drawCircle(point, 1.5, stars);
    }
  }

  @override
  bool shouldRepaint(covariant _ConstellationGridPainter oldDelegate) => false;
}

class _FiligreePainter extends CustomPainter {
  const _FiligreePainter({required this.color});
  final Color color;

  @override
  void paint(Canvas canvas, Size size) {
    final paint = Paint()..color = color.withValues(alpha: .48)..style = PaintingStyle.stroke..strokeWidth = 1;
    final path = Path()..moveTo(12, 34)..cubicTo(34, 34, 10, 12, 52, 12)..moveTo(size.width - 12, size.height - 34)..cubicTo(size.width - 34, size.height - 34, size.width - 10, size.height - 12, size.width - 52, size.height - 12);
    canvas.drawPath(path, paint);
  }
  @override
  bool shouldRepaint(covariant _FiligreePainter oldDelegate) => oldDelegate.color != color;
}

class _SigilEdgePainter extends CustomPainter {
  const _SigilEdgePainter();
  @override
  void paint(Canvas canvas, Size size) {
    final paint = Paint()..color = QuizRealmColors.goldShadow.withValues(alpha: .48)..style = PaintingStyle.stroke..strokeWidth = 1;
    canvas.drawRRect(RRect.fromRectAndRadius(Rect.fromLTWH(4, 4, size.width - 8, size.height - 8), const Radius.circular(7)), paint);
  }
  @override
  bool shouldRepaint(covariant _SigilEdgePainter oldDelegate) => false;
}
