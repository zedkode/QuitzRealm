import 'package:flutter/material.dart';

import '../theme/app_theme.dart';
import 'game_icons.dart';

/// Cele trei stele câștigate pe o bătălie.
class StarRow extends StatelessWidget {
  const StarRow({
    required this.earned,
    super.key,
    this.total = 3,
    this.size = 22,
    this.semanticsLabel,
  }) : assert(earned >= 0),
       assert(total > 0);

  final int earned;
  final int total;
  final double size;
  final String? semanticsLabel;

  @override
  Widget build(BuildContext context) {
    final row = Row(
      mainAxisSize: MainAxisSize.min,
      children: [
        for (var index = 0; index < total; index++)
          Padding(
            padding: EdgeInsets.symmetric(horizontal: size * 0.06),
            child: GameIcon(
              GameSymbol.star,
              key: Key('star-$index-${index < earned ? 'on' : 'off'}'),
              size: size,
              color: index < earned
                  ? GamePalette.goldBright
                  : GamePalette.stone600,
              shadeColor: index < earned
                  ? GamePalette.goldDeep
                  : GamePalette.stone800,
              glow: index < earned,
            ),
          ),
      ],
    );
    if (semanticsLabel == null) return row;
    return Semantics(label: semanticsLabel, child: ExcludeSemantics(child: row));
  }
}

/// Bara de experiență, cu nivelul afișat pe un scut în stânga.
class XpBar extends StatelessWidget {
  const XpBar({
    required this.level,
    required this.progress,
    required this.label,
    super.key,
    this.height = 14,
  }) : assert(progress >= 0 && progress <= 1);

  final int level;
  final double progress;
  final String label;
  final double height;

  @override
  Widget build(BuildContext context) {
    return Semantics(
      label: label,
      child: ExcludeSemantics(
        child: Row(
          children: [
            SizedBox.square(
              dimension: height * 2.4,
              child: Stack(
                alignment: Alignment.center,
                children: [
                  GameIcon(
                    GameSymbol.shield,
                    size: height * 2.4,
                    color: GamePalette.gold,
                  ),
                  Padding(
                    padding: EdgeInsets.only(bottom: height * 0.25),
                    child: Text(
                      '$level',
                      style: TextStyle(
                        fontFamily: 'Cinzel',
                        fontWeight: FontWeight.w900,
                        fontSize: height * 0.95,
                        color: GamePalette.stone900,
                      ),
                    ),
                  ),
                ],
              ),
            ),
            const SizedBox(width: 8),
            Expanded(
              child: ClipRRect(
                borderRadius: BorderRadius.circular(height),
                child: Container(
                  height: height,
                  decoration: BoxDecoration(
                    color: GamePalette.stone900,
                    border: Border.all(
                      color: GamePalette.gold.withValues(alpha: 0.5),
                    ),
                    borderRadius: BorderRadius.circular(height),
                  ),
                  child: Align(
                    alignment: Alignment.centerLeft,
                    child: FractionallySizedBox(
                      widthFactor: progress.clamp(0.0, 1.0),
                      child: TweenAnimationBuilder<double>(
                        tween: Tween(begin: 0, end: 1),
                        duration: const Duration(milliseconds: 500),
                        builder: (context, value, child) =>
                            Opacity(opacity: value, child: child),
                        // Fără `SizedBox.expand`, umplerea are înălțime zero și
                        // bara arată goală indiferent de progres.
                        child: const SizedBox.expand(
                          key: Key('xp-bar-fill'),
                          child: DecoratedBox(
                            decoration: BoxDecoration(
                              gradient: LinearGradient(
                                colors: [
                                  GamePalette.arcane,
                                  GamePalette.goldBright,
                                ],
                              ),
                            ),
                          ),
                        ),
                      ),
                    ),
                  ),
                ),
              ),
            ),
          ],
        ),
      ),
    );
  }
}

/// Pastilă de resursă (monede, stele, cristale).
class ResourcePill extends StatelessWidget {
  const ResourcePill({
    required this.symbol,
    required this.value,
    required this.semanticsLabel,
    super.key,
    this.color = GamePalette.goldBright,
  });

  final GameSymbol symbol;
  final String value;
  final String semanticsLabel;
  final Color color;

  @override
  Widget build(BuildContext context) {
    return Semantics(
      label: semanticsLabel,
      child: ExcludeSemantics(
        child: Container(
          padding: const EdgeInsets.fromLTRB(6, 4, 12, 4),
          decoration: BoxDecoration(
            borderRadius: BorderRadius.circular(20),
            gradient: const LinearGradient(
              colors: [GamePalette.stone800, GamePalette.stone900],
            ),
            border: Border.all(color: color.withValues(alpha: 0.45)),
          ),
          child: Row(
            mainAxisSize: MainAxisSize.min,
            children: [
              GameIcon(symbol, size: 18, color: color),
              const SizedBox(width: 6),
              Text(
                value,
                style: GameText.numeric.copyWith(fontSize: 14),
              ),
            ],
          ),
        ),
      ),
    );
  }
}
