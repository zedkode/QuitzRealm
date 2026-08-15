import 'package:flutter/material.dart';
import 'package:flutter/services.dart';

import '../../../core/theme/app_theme.dart';
import '../../../core/ui/game_icons.dart';

enum AnswerVisualState { idle, selected, correct, wrong, muted }

/// Varianta de răspuns, ca o placă de piatră cu pecete literală.
class AnswerOption extends StatefulWidget {
  const AnswerOption({
    required this.letter,
    required this.answer,
    required this.semanticsLabel,
    required this.state,
    required this.onPressed,
    super.key,
  });

  final String letter;
  final String answer;
  final String semanticsLabel;
  final AnswerVisualState state;
  final VoidCallback? onPressed;

  @override
  State<AnswerOption> createState() => _AnswerOptionState();
}

class _AnswerOptionState extends State<AnswerOption> {
  bool _down = false;

  @override
  Widget build(BuildContext context) {
    final enabled = widget.onPressed != null;
    final accent = switch (widget.state) {
      AnswerVisualState.idle => GamePalette.stone600,
      AnswerVisualState.selected => GamePalette.goldBright,
      AnswerVisualState.correct => GamePalette.emerald,
      AnswerVisualState.wrong => GamePalette.crimson,
      AnswerVisualState.muted => GamePalette.stone700,
    };
    final badge = switch (widget.state) {
      AnswerVisualState.correct => GameSymbol.check,
      AnswerVisualState.wrong => GameSymbol.cross,
      _ => null,
    };

    return Semantics(
      button: true,
      enabled: enabled,
      label: widget.semanticsLabel,
      child: ExcludeSemantics(
        child: GestureDetector(
          behavior: HitTestBehavior.opaque,
          onTapDown: enabled ? (_) => setState(() => _down = true) : null,
          onTapUp: enabled ? (_) => setState(() => _down = false) : null,
          onTapCancel: enabled ? () => setState(() => _down = false) : null,
          onTap: enabled
              ? () {
                  HapticFeedback.selectionClick();
                  widget.onPressed!();
                }
              : null,
          child: AnimatedOpacity(
            duration: const Duration(milliseconds: 200),
            opacity: widget.state == AnswerVisualState.muted ? 0.45 : 1,
            child: AnimatedScale(
              scale: _down && enabled ? 0.975 : 1,
              duration: const Duration(milliseconds: 90),
              child: AnimatedContainer(
                duration: const Duration(milliseconds: 240),
                padding: const EdgeInsets.fromLTRB(9, 9, 14, 9),
                decoration: BoxDecoration(
                  borderRadius: BorderRadius.circular(14),
                  gradient: LinearGradient(
                    begin: Alignment.topLeft,
                    end: Alignment.bottomRight,
                    colors: [
                      accent.withValues(alpha: 0.3),
                      GamePalette.stone900,
                    ],
                  ),
                  border: Border.all(color: accent, width: 1.5),
                  boxShadow: [
                    if (widget.state != AnswerVisualState.idle &&
                        widget.state != AnswerVisualState.muted)
                      BoxShadow(
                        color: accent.withValues(alpha: 0.32),
                        blurRadius: 16,
                      ),
                    BoxShadow(
                      color: Colors.black.withValues(alpha: 0.35),
                      blurRadius: 8,
                      offset: const Offset(0, 3),
                    ),
                  ],
                ),
                child: Row(
                  children: [
                    Container(
                      width: 38,
                      height: 38,
                      alignment: Alignment.center,
                      decoration: BoxDecoration(
                        shape: BoxShape.circle,
                        gradient: RadialGradient(
                          colors: [
                            accent.withValues(alpha: 0.35),
                            GamePalette.nightDeep,
                          ],
                        ),
                        border: Border.all(color: accent, width: 1.4),
                      ),
                      child: Text(
                        widget.letter,
                        style: TextStyle(
                          fontFamily: 'Cinzel',
                          fontWeight: FontWeight.w900,
                          fontSize: 16,
                          // Pe accentul închis (stare neatinsă) litera trebuie
                          // să rămână lizibilă, nu să se topească în fundal.
                          color: widget.state == AnswerVisualState.idle
                              ? GamePalette.goldBright
                              : accent,
                        ),
                      ),
                    ),
                    const SizedBox(width: 12),
                    Expanded(
                      child: Text(
                        widget.answer,
                        style: const TextStyle(
                          fontSize: 15,
                          height: 1.25,
                          fontWeight: FontWeight.w700,
                          color: GamePalette.cream,
                        ),
                      ),
                    ),
                    if (badge != null) ...[
                      const SizedBox(width: 8),
                      GameIcon(badge, size: 20, color: accent),
                    ],
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
