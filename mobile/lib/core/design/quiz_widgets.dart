import 'package:flutter/material.dart';

import 'gold_frame.dart';
import 'quizrealm_tokens.dart';

/// Cardul întrebării: panoul ridicat din capturile de duel.
class QuizQuestionCard extends StatelessWidget {
  const QuizQuestionCard({
    required this.question,
    super.key,
    this.categoryLabel,
    this.difficultyLabel,
  });

  final String question;
  final String? categoryLabel;
  final String? difficultyLabel;

  @override
  Widget build(BuildContext context) {
    return GoldFrame(
      fill: QuizRealmColors.surfaceRaised,
      padding: const EdgeInsets.symmetric(
        horizontal: QuizRealmSpacing.lg,
        vertical: QuizRealmSpacing.lg,
      ),
      child: Column(
        mainAxisSize: MainAxisSize.min,
        crossAxisAlignment: CrossAxisAlignment.stretch,
        children: [
          if (categoryLabel != null || difficultyLabel != null) ...[
            Row(
              children: [
                if (categoryLabel != null)
                  Expanded(
                    child: Text(
                      categoryLabel!.toUpperCase(),
                      maxLines: 1,
                      overflow: TextOverflow.ellipsis,
                      style: QuizRealmTypography.sectionTitle.copyWith(
                        fontSize: 12,
                        letterSpacing: 1.2,
                      ),
                    ),
                  ),
                if (difficultyLabel != null)
                  Text(
                    difficultyLabel!,
                    style: QuizRealmTypography.bodySecondary,
                  ),
              ],
            ),
            const SizedBox(height: QuizRealmSpacing.sm),
          ],
          Text(
            question,
            textAlign: TextAlign.center,
            style: QuizRealmTypography.body.copyWith(fontSize: 18, height: 1.3),
          ),
        ],
      ),
    );
  }
}

/// Starea vizuală a unui răspuns după ce runda s-a dezvăluit.
enum AnswerVisualState { idle, selected, correct, wrong, revealedCorrect }

/// Butonul de răspuns.
///
/// Culoarea nu e singurul semnal: răspunsul corect primește și o bifă, iar cel
/// greșit un „x". Pe verde/roșu singur, un jucător cu daltonism n-ar distinge
/// rezultatul.
class QuizAnswerButton extends StatelessWidget {
  const QuizAnswerButton({
    required this.label,
    required this.state,
    required this.onPressed,
    super.key,
  });

  final String label;
  final AnswerVisualState state;
  final VoidCallback? onPressed;

  @override
  Widget build(BuildContext context) {
    final (border, fill, icon) = switch (state) {
      AnswerVisualState.idle => (
        QuizRealmColors.goldDeep,
        QuizRealmColors.surfaceRow,
        null,
      ),
      AnswerVisualState.selected => (
        QuizRealmColors.electric,
        QuizRealmColors.surfaceSelected,
        null,
      ),
      AnswerVisualState.correct ||
      AnswerVisualState.revealedCorrect => (
        QuizRealmColors.success,
        const Color(0xFF06341A),
        Icons.check_rounded,
      ),
      AnswerVisualState.wrong => (
        QuizRealmColors.crimson,
        QuizRealmColors.crimsonDeep,
        Icons.close_rounded,
      ),
    };

    return Semantics(
      button: true,
      enabled: onPressed != null,
      label: label,
      child: ExcludeSemantics(
        child: Padding(
          padding: const EdgeInsets.only(bottom: QuizRealmSpacing.sm),
          child: Material(
            color: Colors.transparent,
            child: InkWell(
              onTap: onPressed,
              borderRadius: BorderRadius.circular(QuizRealmRadius.md),
              child: AnimatedContainer(
                duration: QuizRealmDurations.state,
                constraints: const BoxConstraints(minHeight: 54),
                padding: const EdgeInsets.symmetric(
                  horizontal: QuizRealmSpacing.md,
                  vertical: QuizRealmSpacing.sm,
                ),
                decoration: BoxDecoration(
                  color: fill,
                  borderRadius: BorderRadius.circular(QuizRealmRadius.md),
                  border: Border.all(color: border, width: 2),
                ),
                child: Row(
                  children: [
                    Expanded(
                      child: Text(
                        label,
                        style: QuizRealmTypography.body.copyWith(fontSize: 16),
                      ),
                    ),
                    if (icon != null) ...[
                      const SizedBox(width: QuizRealmSpacing.sm),
                      Icon(icon, size: 22, color: border),
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

/// Bara de progres a meciului: câte întrebări au trecut și cum au ieșit.
class MatchProgressBar extends StatelessWidget {
  const MatchProgressBar({
    required this.total,
    required this.current,
    required this.results,
    super.key,
  });

  final int total;
  final int current;

  /// `true` corect, `false` greșit, `null` încă nejucată.
  final List<bool?> results;

  @override
  Widget build(BuildContext context) {
    return Row(
      children: [
        for (var index = 0; index < total; index++) ...[
          Expanded(
            child: Container(
              height: 6,
              decoration: BoxDecoration(
                borderRadius: BorderRadius.circular(QuizRealmRadius.sm),
                color: switch (index < results.length ? results[index] : null) {
                  true => QuizRealmColors.success,
                  false => QuizRealmColors.crimson,
                  null => index == current
                      ? QuizRealmColors.electric
                      : QuizRealmColors.surfaceRaised,
                },
              ),
            ),
          ),
          if (index < total - 1) const SizedBox(width: 3),
        ],
      ],
    );
  }
}
