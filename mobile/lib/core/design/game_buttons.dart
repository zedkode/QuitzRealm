import 'package:flutter/material.dart';

import '../ui/game_icons.dart';
import 'entrance.dart';
import 'quizrealm_tokens.dart';

/// Butonul principal: umplere albastră în degradeu, ramă aurie, iconiță la
/// stânga și săgeată la dreapta.
///
/// Săgeata nu e decor: în capturi apare doar pe butoanele care duc altundeva,
/// și lipsește de pe cele care confirmă pe loc. [showChevron] păstrează
/// distincția.
class PrimaryGameButton extends StatefulWidget {
  const PrimaryGameButton({
    required this.label,
    required this.onPressed,
    super.key,
    this.symbol,
    this.showChevron = true,
    this.emphasized = false,
    this.height = 52,
  });

  final String label;

  /// `null` dezactivează butonul, la fel ca în Material.
  final VoidCallback? onPressed;
  final GameSymbol? symbol;
  final bool showChevron;

  /// Acțiunea dominantă a ecranului („JOACĂ"): halou și ramă mai groasă.
  final bool emphasized;
  final double height;

  @override
  State<PrimaryGameButton> createState() => _PrimaryGameButtonState();
}

class _PrimaryGameButtonState extends State<PrimaryGameButton> {
  bool _pressed = false;

  @override
  Widget build(BuildContext context) {
    final enabled = widget.onPressed != null;

    return Semantics(
      button: true,
      enabled: enabled,
      label: widget.label,
      child: ExcludeSemantics(
        child: PulseGlow(
          // Doar acțiunea dominantă pulsează. Dacă ar pulsa tot, nimic n-ar mai
          // ieși în evidență și ecranul ar deveni agitat.
          enabled: widget.emphasized && enabled,
          child: GestureDetector(
            onTapDown: enabled ? (_) => setState(() => _pressed = true) : null,
            onTapUp: enabled ? (_) => setState(() => _pressed = false) : null,
            onTapCancel: enabled
                ? () => setState(() => _pressed = false)
                : null,
            onTap: widget.onPressed,
            child: AnimatedScale(
              // Apăsarea se simte prin scădere de scară, nu prin ripple: pe un
              // buton cu ramă pictată, ripple-ul Material taie colțurile.
              scale: _pressed ? 0.98 : 1,
              duration: QuizRealmDurations.tap,
              child: Opacity(
                opacity: enabled ? 1 : 0.45,
                child: Container(
                  height: widget.height,
                  padding: const EdgeInsets.symmetric(
                    horizontal: QuizRealmSpacing.md,
                  ),
                  decoration: BoxDecoration(
                    gradient: QuizRealmGradients.heraldicGold,
                    borderRadius: BorderRadius.circular(QuizRealmRadius.md),
                    border: Border.all(
                      color: QuizRealmColors.goldLight,
                      width: widget.emphasized
                          ? QuizRealmBorders.emphasis
                          : QuizRealmBorders.frame,
                    ),
                    boxShadow: widget.emphasized && enabled
                        ? QuizRealmShadows.goldGlow
                        : QuizRealmShadows.panel,
                  ),
                  child: Row(
                    children: [
                      if (widget.symbol != null) ...[
                        GameIcon(
                          widget.symbol!,
                          size: 24,
                          color: QuizRealmColors.textOnGold,
                        ),
                        const SizedBox(width: QuizRealmSpacing.sm),
                      ],
                      Expanded(
                        child: Text(
                          widget.label.toUpperCase(),
                          textAlign: TextAlign.center,
                          maxLines: 1,
                          overflow: TextOverflow.ellipsis,
                          style: QuizRealmTypography.buttonLabel.copyWith(
                            fontSize: widget.emphasized ? 20 : 17,
                            color: QuizRealmColors.textOnGold,
                          ),
                        ),
                      ),
                      if (widget.showChevron) ...[
                        const SizedBox(width: QuizRealmSpacing.sm),
                        GameIcon(
                          GameSymbol.chevronRight,
                          size: 20,
                          color: QuizRealmColors.textOnGold,
                        ),
                      ] else if (widget.symbol != null)
                        // Păstrează eticheta centrată optic față de iconiță.
                        const SizedBox(width: 32),
                    ],
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

/// Butonul secundar: fără umplere, doar ramă și text auriu („MERGI",
/// „COLECTEAZĂ", „VEZI RECOMPENSE").
class SecondaryGameButton extends StatelessWidget {
  const SecondaryGameButton({
    required this.label,
    required this.onPressed,
    super.key,
    this.symbol,
    this.height = 38,
    this.dense = false,
    this.tone = SecondaryTone.gold,
  });

  final String label;
  final VoidCallback? onPressed;
  final GameSymbol? symbol;
  final double height;

  /// Variantă strânsă, pentru butoanele din rândurile de misiuni.
  final bool dense;
  final SecondaryTone tone;

  @override
  Widget build(BuildContext context) {
    final enabled = onPressed != null;
    final color = switch (tone) {
      SecondaryTone.gold => QuizRealmColors.gold,
      SecondaryTone.danger => QuizRealmColors.crimson,
      SecondaryTone.neutral => QuizRealmColors.textSecondary,
    };
    final textColor = switch (tone) {
      SecondaryTone.gold => QuizRealmColors.goldLight,
      SecondaryTone.danger => QuizRealmColors.crimson,
      SecondaryTone.neutral => QuizRealmColors.textSecondary,
    };

    return Semantics(
      button: true,
      enabled: enabled,
      label: label,
      child: ExcludeSemantics(
        child: Opacity(
          opacity: enabled ? 1 : 0.45,
          child: Material(
            color: Colors.transparent,
            child: InkWell(
              onTap: onPressed,
              borderRadius: BorderRadius.circular(QuizRealmRadius.md),
              child: Container(
                height: height,
                padding: EdgeInsets.symmetric(
                  horizontal: dense ? QuizRealmSpacing.sm : QuizRealmSpacing.md,
                ),
                alignment: Alignment.center,
                decoration: BoxDecoration(
                  color: QuizRealmColors.backgroundDeep,
                  borderRadius: BorderRadius.circular(QuizRealmRadius.md),
                  border: Border.all(
                    color: color,
                    width: QuizRealmBorders.hairline + 0.5,
                  ),
                ),
                child: Row(
                  mainAxisSize: MainAxisSize.min,
                  children: [
                    if (symbol != null) ...[
                      GameIcon(symbol!, size: 16, color: color),
                      const SizedBox(width: QuizRealmSpacing.xs),
                    ],
                    Flexible(
                      child: Text(
                        label.toUpperCase(),
                        maxLines: 1,
                        overflow: TextOverflow.ellipsis,
                        style: QuizRealmTypography.buttonLabel.copyWith(
                          fontSize: dense ? 12 : 14,
                          letterSpacing: dense ? 1.1 : 1.5,
                          color: textColor,
                        ),
                      ),
                    ),
                  ],
                ),
              ),
            ),
          ),
        ),
      ),
    );
  }
}

enum SecondaryTone { gold, danger, neutral }
