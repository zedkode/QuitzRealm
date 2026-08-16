import 'dart:math' as math;

import 'package:flutter/material.dart';
import 'package:flutter/services.dart';
import 'package:flutter_riverpod/flutter_riverpod.dart';
import 'package:go_router/go_router.dart';

import '../../core/theme/app_theme.dart';
import '../../core/ui/game_button.dart';
import '../../core/ui/game_frame.dart';
import '../../core/ui/game_icons.dart';
import '../../core/ui/realm_backdrop.dart';
import '../../domain/campaign/realm_chapter.dart';
import '../../domain/question/quiz_question.dart';
import '../../l10n/app_localizations.dart';
import '../map/chapter_presentation.dart';
import 'battle_controller.dart';
import 'result_view.dart';
import 'widgets/answer_option.dart';
import 'widgets/battle_hud.dart';
import 'widgets/battle_track.dart';

/// Ecranul de asalt: întrebarea curentă, cronometrul și verdictul.
class BattleScreen extends ConsumerStatefulWidget {
  const BattleScreen({
    required this.chapterId,
    required this.stageIndex,
    super.key,
  });

  final String chapterId;
  final int stageIndex;

  @override
  ConsumerState<BattleScreen> createState() => _BattleScreenState();
}

class _BattleScreenState extends ConsumerState<BattleScreen>
    with SingleTickerProviderStateMixin {
  final _numericController = TextEditingController();

  late final AnimationController _shake = AnimationController(
    vsync: this,
    duration: const Duration(milliseconds: 420),
  );

  BattleTarget get _target =>
      (chapterId: widget.chapterId, stageIndex: widget.stageIndex);

  @override
  void initState() {
    super.initState();
    WidgetsBinding.instance.addPostFrameCallback((_) {
      if (mounted) ref.read(battleControllerProvider(_target).notifier).start();
    });
  }

  @override
  void dispose() {
    _numericController.dispose();
    _shake.dispose();
    super.dispose();
  }

  @override
  Widget build(BuildContext context) {
    final l10n = AppLocalizations.of(context);
    final chapter = RealmChapter.byId(widget.chapterId);
    final stage = RealmChapter.stages[widget.stageIndex];
    final visuals = ChapterPresentation.of(l10n, chapter.id);
    final state = ref.watch(battleControllerProvider(_target));

    ref.listen<BattleState>(battleControllerProvider(_target), (previous, next) {
      if (previous?.phase == next.phase || next.phase != BattlePhase.revealed) {
        return;
      }
      if (next.outcome == AnswerOutcome.correct) {
        HapticFeedback.heavyImpact();
      } else {
        HapticFeedback.mediumImpact();
        _shake.forward(from: 0);
      }
    });

    return PopScope(
      canPop: state.phase == BattlePhase.complete,
      onPopInvokedWithResult: (didPop, _) {
        if (!didPop) _confirmLeave(context, l10n);
      },
      child: Scaffold(
        body: RealmBackdrop(
          accent: visuals.color,
          artAsset: 'assets/game/duel_arena_backdrop.png',
          artOpacity: 0.24,
          child: SafeArea(
            child: Column(
              children: [
                _BattleHeader(
                  title: l10n.battleHeader(
                    visuals.name,
                    ChapterPresentation.stageName(l10n, stage.index),
                  ),
                  accent: visuals.color,
                  onBack: () => state.phase == BattlePhase.complete
                      ? context.pop()
                      : _confirmLeave(context, l10n),
                ),
                Expanded(child: _buildBody(context, state, chapter, stage)),
              ],
            ),
          ),
        ),
      ),
    );
  }

  Widget _buildBody(
    BuildContext context,
    BattleState state,
    RealmChapter chapter,
    BattleStage stage,
  ) {
    final l10n = AppLocalizations.of(context);
    return switch (state.phase) {
      BattlePhase.loading => _StatusView(title: l10n.questionLoading),
      BattlePhase.empty => _MessageView(
        symbol: GameSymbol.scroll,
        title: l10n.noQuestionsTitle,
        body: l10n.noQuestionsBody,
        actionLabel: l10n.actionBackToMap,
        onAction: () => context.pop(),
      ),
      BattlePhase.error => _MessageView(
        symbol: GameSymbol.skull,
        title: l10n.questionErrorTitle,
        actionLabel: l10n.retry,
        onAction: () =>
            ref.read(battleControllerProvider(_target).notifier).start(),
      ),
      BattlePhase.complete => ResultView(
        state: state,
        chapter: chapter,
        stage: stage,
        onRetry: () {
          _numericController.clear();
          ref.read(battleControllerProvider(_target).notifier).start();
        },
        onBackToMap: () => context.pop(),
      ),
      BattlePhase.active ||
      BattlePhase.submitting ||
      BattlePhase.submitError ||
      BattlePhase.revealed => _RoundView(
        state: state,
        shake: _shake,
        numericController: _numericController,
        onAnswer: (answer) => ref
            .read(battleControllerProvider(_target).notifier)
            .submitAnswer(answer),
        onRetryAnswer: () => ref
            .read(battleControllerProvider(_target).notifier)
            .retrySubmission(),
        onNext: () {
          _numericController.clear();
          ref.read(battleControllerProvider(_target).notifier).next();
        },
      ),
    };
  }

  Future<void> _confirmLeave(BuildContext context, AppLocalizations l10n) async {
    final leave = await showDialog<bool>(
      context: context,
      barrierColor: GamePalette.nightDeep.withValues(alpha: 0.82),
      builder: (context) => Dialog(
        backgroundColor: Colors.transparent,
        child: GameFrame(
          accent: GamePalette.crimson,
          glow: true,
          child: Column(
            mainAxisSize: MainAxisSize.min,
            crossAxisAlignment: CrossAxisAlignment.stretch,
            children: [
              const Center(
                child: GameIcon(
                  GameSymbol.skull,
                  size: 40,
                  color: GamePalette.crimson,
                ),
              ),
              const SizedBox(height: 12),
              Text(
                l10n.leaveBattleTitle,
                textAlign: TextAlign.center,
                style: GameText.heading,
              ),
              const SizedBox(height: 8),
              Text(
                l10n.leaveBattleBody,
                textAlign: TextAlign.center,
                style: GameText.bodyDim,
              ),
              const SizedBox(height: 18),
              GameButton(
                label: l10n.leaveBattleCancel,
                height: 46,
                compact: true,
                onPressed: () => Navigator.of(context).pop(false),
              ),
              const SizedBox(height: 8),
              GameButton(
                label: l10n.leaveBattleConfirm,
                tone: GameButtonTone.danger,
                height: 44,
                compact: true,
                onPressed: () => Navigator.of(context).pop(true),
              ),
            ],
          ),
        ),
      ),
    );
    if (leave == true && context.mounted) context.pop();
  }
}

class _BattleHeader extends StatelessWidget {
  const _BattleHeader({
    required this.title,
    required this.accent,
    required this.onBack,
  });

  final String title;
  final Color accent;
  final VoidCallback onBack;

  @override
  Widget build(BuildContext context) {
    final l10n = AppLocalizations.of(context);
    return Padding(
      padding: const EdgeInsets.fromLTRB(10, 6, 14, 4),
      child: Row(
        children: [
          GameIconButton(
            symbol: GameSymbol.back,
            tooltip: l10n.backLabel,
            size: 40,
            onPressed: onBack,
          ),
          const SizedBox(width: 10),
          Expanded(
            child: Text(
              title,
              maxLines: 1,
              overflow: TextOverflow.ellipsis,
              style: GameText.heading.copyWith(fontSize: 15, color: accent),
            ),
          ),
        ],
      ),
    );
  }
}

class _RoundView extends StatelessWidget {
  const _RoundView({
    required this.state,
    required this.shake,
    required this.numericController,
    required this.onAnswer,
    required this.onRetryAnswer,
    required this.onNext,
  });

  final BattleState state;
  final AnimationController shake;
  final TextEditingController numericController;
  final ValueChanged<String> onAnswer;
  final VoidCallback onRetryAnswer;
  final VoidCallback onNext;

  @override
  Widget build(BuildContext context) {
    // Pe ecrane înalte informația stă sus, iar acțiunea coboară spre degete.
    return LayoutBuilder(
      builder: (context, constraints) {
        return SingleChildScrollView(
          padding: const EdgeInsets.fromLTRB(14, 4, 14, 24),
          child: ConstrainedBox(
            constraints: BoxConstraints(minHeight: constraints.maxHeight - 28),
            child: Column(
              mainAxisAlignment: MainAxisAlignment.spaceBetween,
              crossAxisAlignment: CrossAxisAlignment.stretch,
              children: [
                _status(context),
                const SizedBox(height: 14),
                _actions(context),
              ],
            ),
          ),
        );
      },
    );
  }

  Widget _status(BuildContext context) {
    final l10n = AppLocalizations.of(context);
    return Column(
      mainAxisSize: MainAxisSize.min,
      crossAxisAlignment: CrossAxisAlignment.stretch,
      children: [
        BattleTrack(outcomes: state.outcomes, currentIndex: state.index),
        const SizedBox(height: 10),
        BattleHud(
          roundLabel: l10n.hudRound,
          roundValue: l10n.roundCounter(
            state.index + 1,
            state.questions.length,
          ),
          scoreLabel: l10n.hudScore,
          scoreValue: '${state.score}',
          streakLabel: l10n.hudStreak,
          streakValue: l10n.streakMultiplier('${state.streak}'),
          seconds: state.remainingSeconds,
          totalSeconds: state.totalSeconds,
          timerSemanticsLabel: l10n.timerSemantics(state.remainingSeconds),
        ),
        const SizedBox(height: 12),
        _ShakeOnWrong(
          animation: shake,
          child: _QuestionCard(question: state.currentQuestion!),
        ),
      ],
    );
  }

  Widget _actions(BuildContext context) {
    final l10n = AppLocalizations.of(context);
    final question = state.currentQuestion!;
    final revealed = state.phase == BattlePhase.revealed;
    final inputEnabled = state.phase == BattlePhase.active;

    return Column(
      mainAxisSize: MainAxisSize.min,
      crossAxisAlignment: CrossAxisAlignment.stretch,
      children: [
        if (question.type == QuizQuestionType.multipleChoice)
          ...question.options.asMap().entries.map((entry) {
            final letter = String.fromCharCode(65 + entry.key);
            return Padding(
              padding: const EdgeInsets.only(bottom: 9),
              child: AnswerOption(
                key: Key('option-${entry.key}'),
                letter: letter,
                answer: entry.value,
                semanticsLabel: l10n.answerOptionSemantics(letter, entry.value),
                state: _visualState(state, entry.value),
                onPressed: inputEnabled ? () => onAnswer(entry.value) : null,
              ),
            );
          })
        else
          _NumericInput(
            question: question,
            controller: numericController,
            enabled: inputEnabled,
            onSubmit: onAnswer,
          ),
        if (state.phase == BattlePhase.submitting) ...[
          const SizedBox(height: 14),
          const Center(child: CircularProgressIndicator()),
        ],
        if (state.phase == BattlePhase.submitError) ...[
          const SizedBox(height: 14),
          GameFrame(
            key: const Key('feedback-submit-error'),
            accent: GamePalette.crimson,
            child: Column(
              crossAxisAlignment: CrossAxisAlignment.stretch,
              children: [
                Text(l10n.answerSubmitError, style: GameText.body),
                const SizedBox(height: 12),
                GameButton(
                  label: l10n.retryAnswer,
                  icon: GameSymbol.swords,
                  tone: GameButtonTone.danger,
                  height: 46,
                  compact: true,
                  onPressed: onRetryAnswer,
                ),
              ],
            ),
          ),
        ],
        if (revealed) ...[
          const SizedBox(height: 12),
          _Verdict(state: state),
          const SizedBox(height: 12),
          GameButton(
            key: const Key('next-question'),
            label: state.isLastQuestion ? l10n.finishRound : l10n.nextQuestion,
            icon: state.isLastQuestion
                ? GameSymbol.trophy
                : GameSymbol.chevronRight,
            onPressed: onNext,
          ),
        ],
      ],
    );
  }

  static AnswerVisualState _visualState(BattleState state, String answer) {
    final selected = state.selectedAnswer == answer;
    if (state.phase == BattlePhase.revealed) {
      if (state.correctAnswer == answer) return AnswerVisualState.correct;
      if (selected) return AnswerVisualState.wrong;
      return AnswerVisualState.muted;
    }
    return selected ? AnswerVisualState.selected : AnswerVisualState.idle;
  }
}

/// Cartonul de pergament pe care stă întrebarea.
class _QuestionCard extends StatelessWidget {
  const _QuestionCard({required this.question});

  final QuizQuestion question;

  @override
  Widget build(BuildContext context) {
    final l10n = AppLocalizations.of(context);
    return ParchmentPanel(
      child: Column(
        crossAxisAlignment: CrossAxisAlignment.start,
        children: [
          Row(
            children: [
              const GameIcon(
                GameSymbol.banner,
                size: 16,
                color: GamePalette.goldDeep,
              ),
              const SizedBox(width: 7),
              Expanded(
                child: Text(
                  question.categoryName ?? l10n.categoryFallback,
                  maxLines: 1,
                  overflow: TextOverflow.ellipsis,
                  style: const TextStyle(
                    fontFamily: 'Cinzel',
                    fontSize: 12,
                    fontWeight: FontWeight.w800,
                    letterSpacing: 0.8,
                    color: GamePalette.inkSoft,
                  ),
                ),
              ),
              _DifficultyPips(level: question.difficulty),
            ],
          ),
          const SizedBox(height: 10),
          Container(
            height: 1,
            color: GamePalette.goldDeep.withValues(alpha: 0.35),
          ),
          const SizedBox(height: 12),
          Text(
            question.text,
            key: const Key('question-text'),
            style: const TextStyle(
              fontSize: 19.5,
              height: 1.3,
              fontWeight: FontWeight.w700,
              color: GamePalette.ink,
            ),
          ),
          const SizedBox(height: 6),
          Semantics(
            label: l10n.difficulty(question.difficulty),
            child: const SizedBox.shrink(),
          ),
        ],
      ),
    );
  }
}

class _DifficultyPips extends StatelessWidget {
  const _DifficultyPips({required this.level});

  final int level;

  @override
  Widget build(BuildContext context) {
    return Row(
      mainAxisSize: MainAxisSize.min,
      children: [
        for (var index = 0; index < 5; index++)
          Padding(
            padding: const EdgeInsets.only(left: 3),
            child: Container(
              width: 7,
              height: 7,
              decoration: BoxDecoration(
                shape: BoxShape.circle,
                color: index < level
                    ? GamePalette.crimson
                    : GamePalette.inkSoft.withValues(alpha: 0.28),
              ),
            ),
          ),
      ],
    );
  }
}

class _NumericInput extends StatelessWidget {
  const _NumericInput({
    required this.question,
    required this.controller,
    required this.enabled,
    required this.onSubmit,
  });

  final QuizQuestion question;
  final TextEditingController controller;
  final bool enabled;
  final ValueChanged<String> onSubmit;

  @override
  Widget build(BuildContext context) {
    final l10n = AppLocalizations.of(context);
    return Column(
      crossAxisAlignment: CrossAxisAlignment.stretch,
      children: [
        GameFrame(
          accent: GamePalette.arcane,
          padding: const EdgeInsets.all(10),
          rivets: false,
          child: TextField(
            key: Key('numeric-${question.id}'),
            controller: controller,
            enabled: enabled,
            style: GameText.numeric.copyWith(fontSize: 22),
            textAlign: TextAlign.center,
            keyboardType: const TextInputType.numberWithOptions(
              decimal: true,
              signed: true,
            ),
            inputFormatters: [
              FilteringTextInputFormatter.allow(RegExp(r'[-0-9,.]')),
            ],
            onSubmitted: enabled ? onSubmit : null,
            decoration: InputDecoration(
              labelText: l10n.numericHint,
              border: InputBorder.none,
              enabledBorder: InputBorder.none,
              focusedBorder: InputBorder.none,
              filled: false,
            ),
          ),
        ),
        const SizedBox(height: 10),
        GameButton(
          key: const Key('submit-numeric'),
          label: l10n.submitAnswer,
          icon: GameSymbol.sword,
          onPressed: enabled ? () => onSubmit(controller.text) : null,
        ),
      ],
    );
  }
}

class _Verdict extends StatelessWidget {
  const _Verdict({required this.state});

  final BattleState state;

  @override
  Widget build(BuildContext context) {
    final l10n = AppLocalizations.of(context);
    final correct = state.outcome == AnswerOutcome.correct;
    final timedOut = state.outcome == AnswerOutcome.timedOut;
    final color = correct ? GamePalette.emerald : GamePalette.crimson;
    final title = correct
        ? l10n.correctTitle
        : timedOut
        ? l10n.timeoutTitle
        : l10n.incorrectTitle;

    return GameFrame(
      key: Key(
        correct
            ? 'feedback-correct'
            : timedOut
            ? 'feedback-timeout'
            : 'feedback-wrong',
      ),
      accent: color,
      glow: correct,
      child: Column(
        crossAxisAlignment: CrossAxisAlignment.start,
        children: [
          Row(
            children: [
              GameIcon(
                correct
                    ? GameSymbol.castle
                    : timedOut
                    ? GameSymbol.hourglass
                    : GameSymbol.shield,
                size: 26,
                color: color,
              ),
              const SizedBox(width: 10),
              Expanded(
                child: Text(
                  title,
                  style: GameText.heading.copyWith(color: color, fontSize: 16),
                ),
              ),
              if (correct)
                Text(
                  l10n.pointsAwarded(state.lastPoints),
                  key: const Key('points-awarded'),
                  style: GameText.numeric.copyWith(
                    color: GamePalette.goldBright,
                    fontSize: 19,
                  ),
                ),
            ],
          ),
          if (!correct && state.correctAnswer != null) ...[
            const SizedBox(height: 10),
            Text(
              l10n.correctAnswerLabel(state.correctAnswer!),
              style: GameText.body,
            ),
          ],
          if (state.explanation != null && state.explanation!.isNotEmpty) ...[
            const SizedBox(height: 8),
            Text(state.explanation!, style: GameText.bodyDim),
          ],
        ],
      ),
    );
  }
}

/// Scutură panoul întrebării la un răspuns greșit.
class _ShakeOnWrong extends StatelessWidget {
  const _ShakeOnWrong({required this.animation, required this.child});

  final AnimationController animation;
  final Widget child;

  @override
  Widget build(BuildContext context) {
    return AnimatedBuilder(
      animation: animation,
      builder: (context, child) {
        final t = animation.value;
        final offset = t == 0
            ? 0.0
            : math.sin(t * math.pi * 6) * 10 * (1 - t);
        return Transform.translate(offset: Offset(offset, 0), child: child);
      },
      child: child,
    );
  }
}

class _StatusView extends StatelessWidget {
  const _StatusView({required this.title});

  final String title;

  @override
  Widget build(BuildContext context) {
    return Center(
      child: Column(
        mainAxisSize: MainAxisSize.min,
        children: [
          Image.asset('assets/game/quizrealm_crest.png', height: 120),
          const SizedBox(height: 18),
          const CircularProgressIndicator(),
          const SizedBox(height: 16),
          Text(title, style: GameText.body),
        ],
      ),
    );
  }
}

class _MessageView extends StatelessWidget {
  const _MessageView({
    required this.symbol,
    required this.title,
    required this.actionLabel,
    required this.onAction,
    this.body,
  });

  final GameSymbol symbol;
  final String title;
  final String? body;
  final String actionLabel;
  final VoidCallback onAction;

  @override
  Widget build(BuildContext context) {
    return Center(
      child: SingleChildScrollView(
        padding: const EdgeInsets.all(22),
        child: ConstrainedBox(
          constraints: const BoxConstraints(maxWidth: 430),
          child: GameFrame(
            glow: true,
            child: Column(
              children: [
                GameIcon(symbol, size: 54, color: GamePalette.gold),
                const SizedBox(height: 16),
                Text(
                  title,
                  textAlign: TextAlign.center,
                  style: GameText.title,
                ),
                if (body != null) ...[
                  const SizedBox(height: 10),
                  Text(
                    body!,
                    textAlign: TextAlign.center,
                    style: GameText.bodyDim,
                  ),
                ],
                const SizedBox(height: 20),
                GameButton(label: actionLabel, onPressed: onAction),
              ],
            ),
          ),
        ),
      ),
    );
  }
}
