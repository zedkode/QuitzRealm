import 'package:flutter/material.dart';
import 'package:flutter/services.dart';
import 'package:flutter_riverpod/flutter_riverpod.dart';
import 'package:go_router/go_router.dart';

import '../../core/design/entrance.dart';
import '../../core/design/game_buttons.dart';
import '../../core/design/gold_frame.dart';
import '../../core/design/quiz_widgets.dart';
import '../../core/design/quizrealm_scaffold.dart';
import '../../core/design/quizrealm_tokens.dart';
import '../../domain/question/quiz_question.dart';
import '../../l10n/app_localizations.dart';
import '../battle/battle_controller.dart';
import 'training_controller.dart';

/// Runda de antrenament pe categoriile alese.
///
/// Refolosește [BattleController] — aceeași logică de joc ca la restul
/// aplicației, doar cu altă sursă de întrebări și fără urmări asupra rangului.
class TrainingBattleScreen extends ConsumerStatefulWidget {
  const TrainingBattleScreen({
    required this.codes,
    required this.questionCount,
    super.key,
  });

  final String codes;
  final int questionCount;

  @override
  ConsumerState<TrainingBattleScreen> createState() =>
      _TrainingBattleScreenState();
}

class _TrainingBattleScreenState extends ConsumerState<TrainingBattleScreen> {
  final _numericController = TextEditingController();
  bool _recorded = false;

  TrainingTarget get _target =>
      (codes: widget.codes, questionCount: widget.questionCount);

  @override
  void initState() {
    super.initState();
    WidgetsBinding.instance.addPostFrameCallback((_) {
      if (mounted) ref.read(trainingBattleProvider(_target).notifier).start();
    });
  }

  @override
  void dispose() {
    _numericController.dispose();
    super.dispose();
  }

  /// Scrie progresul pe categorii, împărțit după categoria fiecărei întrebări.
  ///
  /// Se face aici, nu în `onFinished`, pentru că doar ecranul știe din ce
  /// categorie a venit fiecare întrebare — controllerul vede doar totalul.
  void _recordProgress(BattleState state) {
    if (_recorded) return;
    _recorded = true;

    final perCategory = <String, ({int answered, int correct})>{};
    for (var index = 0; index < state.questions.length; index++) {
      final outcome = index < state.outcomes.length
          ? state.outcomes[index]
          : null;
      if (outcome == null) continue;
      final code = state.questions[index].categoryId;
      final previous = perCategory[code] ?? (answered: 0, correct: 0);
      perCategory[code] = (
        answered: previous.answered + 1,
        correct:
            previous.correct + (outcome == AnswerOutcome.correct ? 1 : 0),
      );
    }
    if (perCategory.isEmpty) return;
    ref.read(categoryProgressProvider.notifier).recordRound(perCategory);
  }

  @override
  Widget build(BuildContext context) {
    final l10n = AppLocalizations.of(context);
    final state = ref.watch(trainingBattleProvider(_target));

    ref.listen<BattleState>(trainingBattleProvider(_target), (previous, next) {
      if (next.phase == BattlePhase.complete) _recordProgress(next);
      if (previous?.phase == next.phase || next.phase != BattlePhase.revealed) {
        return;
      }
      if (next.outcome == AnswerOutcome.correct) {
        HapticFeedback.heavyImpact();
      } else {
        HapticFeedback.mediumImpact();
      }
    });

    return QuizRealmScaffold(
      title: l10n.trainingTitle,
      onBack: () => context.canPop() ? context.pop() : context.go('/'),
      body: switch (state.phase) {
        BattlePhase.loading => const Padding(
          padding: EdgeInsets.only(top: 80),
          child: Center(child: CircularProgressIndicator()),
        ),
        BattlePhase.empty || BattlePhase.error => _Message(
          text: l10n.trainingEmpty,
          actionLabel: l10n.trainingBack,
          onAction: () => context.pop(),
        ),
        BattlePhase.complete => _Summary(state: state, l10n: l10n),
        _ => _Round(
          state: state,
          l10n: l10n,
          numericController: _numericController,
          onAnswer: (answer) => ref
              .read(trainingBattleProvider(_target).notifier)
              .submitAnswer(answer),
          onNext: () {
            _numericController.clear();
            ref.read(trainingBattleProvider(_target).notifier).next();
          },
          onRetry: () =>
              ref.read(trainingBattleProvider(_target).notifier).retrySubmission(),
        ),
      },
    );
  }
}

class _Round extends StatelessWidget {
  const _Round({
    required this.state,
    required this.l10n,
    required this.numericController,
    required this.onAnswer,
    required this.onNext,
    required this.onRetry,
  });

  final BattleState state;
  final AppLocalizations l10n;
  final TextEditingController numericController;
  final ValueChanged<String> onAnswer;
  final VoidCallback onNext;
  final VoidCallback onRetry;

  @override
  Widget build(BuildContext context) {
    final question = state.currentQuestion;
    if (question == null) return const SizedBox.shrink();

    final revealed = state.phase == BattlePhase.revealed;

    return Column(
      crossAxisAlignment: CrossAxisAlignment.stretch,
      children: [
        MatchProgressBar(
          total: state.questions.length,
          current: state.index,
          results: state.outcomes
              .map(
                (outcome) => outcome == null
                    ? null
                    : outcome == AnswerOutcome.correct,
              )
              .toList(growable: false),
        ),
        const SizedBox(height: QuizRealmSpacing.md),
        Row(
          children: [
            Text(
              '${state.index + 1} / ${state.questions.length}',
              style: QuizRealmTypography.numeric.copyWith(fontSize: 13),
            ),
            const Spacer(),
            Text(
              '${state.remainingSeconds}s',
              style: QuizRealmTypography.numeric.copyWith(
                fontSize: 16,
                color: state.remainingSeconds <= 3
                    ? QuizRealmColors.crimson
                    : QuizRealmColors.textAccent,
              ),
            ),
          ],
        ),
        const SizedBox(height: QuizRealmSpacing.sm),
        // Scuturarea pornește doar la răspuns greșit sau timp expirat: e un
        // semnal, nu decor, deci n-are voie să apară și când ai nimerit.
        ShakeOnChange(
          trigger: state.outcome == AnswerOutcome.correct
              ? null
              : '${state.index}-${state.outcome}',
          child: QuizQuestionCard(
            question: question.text,
            categoryLabel: question.categoryName,
            difficultyLabel: l10n.difficulty(question.difficulty),
          ),
        ),
        const SizedBox(height: QuizRealmSpacing.md),
        if (question.type == QuizQuestionType.multipleChoice)
          for (final option in question.options)
            QuizAnswerButton(
              label: option,
              state: _stateFor(option, revealed),
              onPressed: state.phase == BattlePhase.active
                  ? () => onAnswer(option)
                  : null,
            )
        else
          _NumericAnswer(
            controller: numericController,
            enabled: state.phase == BattlePhase.active,
            onSubmit: onAnswer,
            l10n: l10n,
          ),
        if (state.phase == BattlePhase.submitError) ...[
          const SizedBox(height: QuizRealmSpacing.sm),
          SecondaryGameButton(
            label: l10n.retry,
            tone: SecondaryTone.danger,
            onPressed: onRetry,
          ),
        ],
        if (revealed) ...[
          const SizedBox(height: QuizRealmSpacing.sm),
          if (state.explanation != null)
            FantasyPanel(
              child: Text(
                state.explanation!,
                style: QuizRealmTypography.bodySecondary,
              ),
            ),
          const SizedBox(height: QuizRealmSpacing.md),
          PrimaryGameButton(
            key: const Key('training-next'),
            label: state.isLastQuestion ? l10n.trainingRoundDone : l10n.nextQuestion,
            onPressed: onNext,
          ),
        ],
      ],
    );
  }

  AnswerVisualState _stateFor(String option, bool revealed) {
    if (!revealed) {
      return state.selectedAnswer == option
          ? AnswerVisualState.selected
          : AnswerVisualState.idle;
    }
    if (option == state.correctAnswer) return AnswerVisualState.revealedCorrect;
    if (option == state.selectedAnswer) return AnswerVisualState.wrong;
    return AnswerVisualState.idle;
  }
}

class _NumericAnswer extends StatelessWidget {
  const _NumericAnswer({
    required this.controller,
    required this.enabled,
    required this.onSubmit,
    required this.l10n,
  });

  final TextEditingController controller;
  final bool enabled;
  final ValueChanged<String> onSubmit;
  final AppLocalizations l10n;

  @override
  Widget build(BuildContext context) {
    return Column(
      crossAxisAlignment: CrossAxisAlignment.stretch,
      children: [
        TextField(
          controller: controller,
          enabled: enabled,
          keyboardType: const TextInputType.numberWithOptions(decimal: true),
          style: QuizRealmTypography.body.copyWith(fontSize: 18),
          textAlign: TextAlign.center,
          decoration: InputDecoration(
            filled: true,
            fillColor: QuizRealmColors.surfaceRow,
            border: OutlineInputBorder(
              borderRadius: BorderRadius.circular(QuizRealmRadius.md),
            ),
          ),
          onSubmitted: enabled ? onSubmit : null,
        ),
        const SizedBox(height: QuizRealmSpacing.sm),
        PrimaryGameButton(
          label: l10n.submitAnswer,
          showChevron: false,
          onPressed: enabled ? () => onSubmit(controller.text) : null,
        ),
      ],
    );
  }
}

class _Summary extends StatelessWidget {
  const _Summary({required this.state, required this.l10n});

  final BattleState state;
  final AppLocalizations l10n;

  @override
  Widget build(BuildContext context) {
    return Column(
      crossAxisAlignment: CrossAxisAlignment.stretch,
      children: [
        const SizedBox(height: QuizRealmSpacing.lg),
        FantasyPanel(
          key: const Key('training-summary'),
          title: l10n.trainingRoundDone,
          child: Column(
            mainAxisSize: MainAxisSize.min,
            children: [
              Text(
                l10n.trainingCorrectOf(
                  state.correctCount,
                  state.questions.length,
                ),
                style: QuizRealmTypography.playerName.copyWith(fontSize: 18),
              ),
              const SizedBox(height: QuizRealmSpacing.sm),
              Text(
                l10n.resultXpGained(state.xpGained),
                style: QuizRealmTypography.bodySecondary,
              ),
            ],
          ),
        ),
        const SizedBox(height: QuizRealmSpacing.lg),
        PrimaryGameButton(
          key: const Key('training-back'),
          label: l10n.trainingBack,
          onPressed: () => context.pop(),
        ),
      ],
    );
  }
}

class _Message extends StatelessWidget {
  const _Message({
    required this.text,
    required this.actionLabel,
    required this.onAction,
  });

  final String text;
  final String actionLabel;
  final VoidCallback onAction;

  @override
  Widget build(BuildContext context) {
    return Column(
      children: [
        const SizedBox(height: QuizRealmSpacing.xxl),
        FantasyPanel(
          child: Text(text, style: QuizRealmTypography.body),
        ),
        const SizedBox(height: QuizRealmSpacing.lg),
        SecondaryGameButton(label: actionLabel, onPressed: onAction),
      ],
    );
  }
}
