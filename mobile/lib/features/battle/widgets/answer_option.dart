import 'package:flutter/material.dart';
import 'package:flutter/services.dart';

import '../../../core/design/quizrealm_tokens.dart';
import '../../../core/ui/game_icons.dart';

enum AnswerVisualState { idle, selected, correct, wrong, muted }

/// O variantă de răspuns cu un cadru de joc, o insignă în romb și feedback
/// vizual imediat. Starea nu este comunicată doar prin culoare: apare și simbolul
/// de verdict când serverul confirmă răspunsul.
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
    final visual = _AnswerVisual.fromState(widget.state);

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
            duration: QuizRealmDurations.state,
            opacity: widget.state == AnswerVisualState.muted ? 0.44 : 1,
            child: AnimatedScale(
              scale: _down && enabled ? 0.978 : 1,
              duration: QuizRealmDurations.tap,
              child: AnimatedContainer(
                duration: QuizRealmDurations.state,
                padding: const EdgeInsets.all(3),
                decoration: BoxDecoration(
                  borderRadius: BorderRadius.circular(QuizRealmRadius.lg),
                  gradient: visual.borderGradient,
                  boxShadow: [
                    const BoxShadow(
                      color: Color(0xA6000000),
                      blurRadius: 9,
                      offset: Offset(0, 4),
                    ),
                    if (visual.glow)
                      BoxShadow(
                        color: visual.accent.withValues(alpha: 0.38),
                        blurRadius: 18,
                        spreadRadius: 1,
                      ),
                  ],
                ),
                child: Container(
                  padding: const EdgeInsets.fromLTRB(9, 9, 13, 9),
                  decoration: BoxDecoration(
                    borderRadius: BorderRadius.circular(QuizRealmRadius.md),
                    gradient: LinearGradient(
                      begin: Alignment.topLeft,
                      end: Alignment.bottomRight,
                      colors: [
                        visual.accent.withValues(alpha: visual.fillStrength),
                        QuizRealmColors.surfaceRaised,
                      ],
                    ),
                    border: Border.all(
                      color: QuizRealmColors.goldShadow.withValues(alpha: 0.9),
                    ),
                  ),
                  child: Row(
                    children: [
                      _AnswerLetterBadge(
                        letter: widget.letter,
                        accent: visual.accent,
                        selected: widget.state == AnswerVisualState.selected,
                      ),
                      const SizedBox(width: QuizRealmSpacing.md),
                      Expanded(
                        child: Text(
                          widget.answer,
                          style: QuizRealmTypography.body.copyWith(
                            fontSize: 15,
                            fontWeight: FontWeight.w700,
                          ),
                        ),
                      ),
                      if (visual.symbol != null) ...[
                        const SizedBox(width: QuizRealmSpacing.sm),
                        GameIcon(visual.symbol!, size: 21, color: visual.accent),
                      ],
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

class _AnswerLetterBadge extends StatelessWidget {
  const _AnswerLetterBadge({
    required this.letter,
    required this.accent,
    required this.selected,
  });

  final String letter;
  final Color accent;
  final bool selected;

  @override
  Widget build(BuildContext context) {
    return Transform.rotate(
      angle: 0.7853981634,
      child: Container(
        width: 34,
        height: 34,
        alignment: Alignment.center,
        decoration: BoxDecoration(
          gradient: LinearGradient(
            begin: Alignment.topLeft,
            end: Alignment.bottomRight,
            colors: [accent.withValues(alpha: selected ? 0.76 : 0.45), QuizRealmColors.backgroundDeep],
          ),
          border: Border.all(color: QuizRealmColors.goldBright, width: 1.2),
          boxShadow: selected ? QuizRealmShadows.electricGlow : null,
        ),
        child: Transform.rotate(
          angle: -0.7853981634,
          child: Text(
            letter,
            style: QuizRealmTypography.buttonLabel.copyWith(
              fontSize: 15,
              letterSpacing: 0,
              color: QuizRealmColors.goldLight,
            ),
          ),
        ),
      ),
    );
  }
}

class _AnswerVisual {
  const _AnswerVisual({
    required this.accent,
    required this.fillStrength,
    required this.glow,
    required this.symbol,
  });

  final Color accent;
  final double fillStrength;
  final bool glow;
  final GameSymbol? symbol;

  LinearGradient get borderGradient => LinearGradient(
    begin: Alignment.topLeft,
    end: Alignment.bottomRight,
    colors: [QuizRealmColors.goldLight, accent, QuizRealmColors.goldDeep],
  );

  static _AnswerVisual fromState(AnswerVisualState state) {
    return switch (state) {
      AnswerVisualState.idle => const _AnswerVisual(
        accent: QuizRealmColors.gold,
        fillStrength: 0.10,
        glow: false,
        symbol: null,
      ),
      AnswerVisualState.selected => const _AnswerVisual(
        accent: QuizRealmColors.electric,
        fillStrength: 0.34,
        glow: true,
        symbol: null,
      ),
      AnswerVisualState.correct => const _AnswerVisual(
        accent: QuizRealmColors.success,
        fillStrength: 0.30,
        glow: true,
        symbol: GameSymbol.check,
      ),
      AnswerVisualState.wrong => const _AnswerVisual(
        accent: QuizRealmColors.crimson,
        fillStrength: 0.30,
        glow: true,
        symbol: GameSymbol.cross,
      ),
      AnswerVisualState.muted => const _AnswerVisual(
        accent: QuizRealmColors.goldDeep,
        fillStrength: 0.04,
        glow: false,
        symbol: null,
      ),
    };
  }
}
