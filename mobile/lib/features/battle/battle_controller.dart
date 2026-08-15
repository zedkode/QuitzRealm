import 'dart:async';

import 'package:flutter_riverpod/flutter_riverpod.dart';

import '../../core/providers/game_providers.dart';
import '../../domain/battle/battle_rules.dart';
import '../../domain/battle/round_source.dart';
import '../../domain/campaign/realm_chapter.dart';
import '../../domain/question/quiz_question.dart';

enum BattlePhase {
  loading,
  active,
  submitting,
  submitError,
  revealed,
  complete,
  empty,
  error,
}

enum AnswerOutcome { correct, incorrect, timedOut }

/// Starea unui asalt. Un singur obiect imuabil descrie tot ce afișează HUD-ul.
class BattleState {
  const BattleState({
    required this.phase,
    required this.totalSeconds,
    required this.remainingSeconds,
    this.questions = const [],
    this.outcomes = const [],
    this.index = 0,
    this.correctCount = 0,
    this.streak = 0,
    this.bestStreak = 0,
    this.score = 0,
    this.lastPoints = 0,
    this.selectedAnswer,
    this.submissionTimedOut = false,
    this.outcome,
    this.correctAnswer,
    this.explanation,
  });

  const BattleState.loading(int seconds)
    : this(
        phase: BattlePhase.loading,
        totalSeconds: seconds,
        remainingSeconds: seconds,
      );

  final BattlePhase phase;
  final List<QuizQuestion> questions;

  /// Rezultatul fiecărei întrebări; `null` cât timp nu s-a răspuns.
  final List<AnswerOutcome?> outcomes;
  final int index;
  final int correctCount;
  final int streak;
  final int bestStreak;
  final int score;
  final int lastPoints;
  final int totalSeconds;
  final int remainingSeconds;
  final String? selectedAnswer;
  final bool submissionTimedOut;
  final AnswerOutcome? outcome;
  final String? correctAnswer;
  final String? explanation;

  QuizQuestion? get currentQuestion =>
      index < questions.length ? questions[index] : null;

  bool get isLastQuestion => index + 1 >= questions.length;

  int get stars => questions.isEmpty
      ? 0
      : BattleRules.starsFor(correct: correctCount, total: questions.length);

  int get xpGained => BattleRules.xpFor(score: score, stars: stars);

  BattleState copyWith({
    BattlePhase? phase,
    List<QuizQuestion>? questions,
    List<AnswerOutcome?>? outcomes,
    int? index,
    int? correctCount,
    int? streak,
    int? bestStreak,
    int? score,
    int? lastPoints,
    int? totalSeconds,
    int? remainingSeconds,
    String? selectedAnswer,
    bool clearSelectedAnswer = false,
    bool? submissionTimedOut,
    AnswerOutcome? outcome,
    bool clearOutcome = false,
    String? correctAnswer,
    bool clearCorrectAnswer = false,
    String? explanation,
    bool clearExplanation = false,
  }) {
    return BattleState(
      phase: phase ?? this.phase,
      questions: questions ?? this.questions,
      outcomes: outcomes ?? this.outcomes,
      index: index ?? this.index,
      correctCount: correctCount ?? this.correctCount,
      streak: streak ?? this.streak,
      bestStreak: bestStreak ?? this.bestStreak,
      score: score ?? this.score,
      lastPoints: lastPoints ?? this.lastPoints,
      totalSeconds: totalSeconds ?? this.totalSeconds,
      remainingSeconds: remainingSeconds ?? this.remainingSeconds,
      selectedAnswer: clearSelectedAnswer
          ? null
          : selectedAnswer ?? this.selectedAnswer,
      submissionTimedOut: submissionTimedOut ?? this.submissionTimedOut,
      outcome: clearOutcome ? null : outcome ?? this.outcome,
      correctAnswer: clearCorrectAnswer
          ? null
          : correctAnswer ?? this.correctAnswer,
      explanation: clearExplanation ? null : explanation ?? this.explanation,
    );
  }
}

typedef BattleFinished =
    Future<void> Function({required int stars, required int xpGained});

class BattleController extends StateNotifier<BattleState> {
  BattleController({
    required this.source,
    required this.stage,
    required this.onFinished,
    this.timerTick = const Duration(seconds: 1),
  }) : super(BattleState.loading(stage.secondsPerQuestion));

  final RoundSource source;
  final BattleStage stage;
  final BattleFinished onFinished;
  final Duration timerTick;

  Timer? _timer;
  bool _resultRecorded = false;

  Future<void> start() async {
    _timer?.cancel();
    _resultRecorded = false;
    state = BattleState.loading(stage.secondsPerQuestion);
    try {
      final questions = await source.loadRound();
      if (!mounted) return;
      if (questions.isEmpty) {
        state = BattleState(
          phase: BattlePhase.empty,
          totalSeconds: stage.secondsPerQuestion,
          remainingSeconds: stage.secondsPerQuestion,
        );
        return;
      }
      state = BattleState(
        phase: BattlePhase.active,
        questions: questions,
        outcomes: List<AnswerOutcome?>.filled(questions.length, null),
        totalSeconds: stage.secondsPerQuestion,
        remainingSeconds: stage.secondsPerQuestion,
      );
      _startTimer();
    } on EmptyRoundException {
      if (mounted) {
        state = BattleState(
          phase: BattlePhase.empty,
          totalSeconds: stage.secondsPerQuestion,
          remainingSeconds: stage.secondsPerQuestion,
        );
      }
    } catch (_) {
      if (mounted) {
        state = BattleState(
          phase: BattlePhase.error,
          totalSeconds: stage.secondsPerQuestion,
          remainingSeconds: stage.secondsPerQuestion,
        );
      }
    }
  }

  Future<void> submitAnswer(String answer) async {
    if (state.phase != BattlePhase.active || answer.trim().isEmpty) return;
    await _submit(answer.trim(), timedOut: false);
  }

  Future<void> retrySubmission() async {
    if (state.phase != BattlePhase.submitError) return;
    await _submit(
      state.selectedAnswer ?? '',
      timedOut: state.submissionTimedOut,
    );
  }

  Future<void> _submit(String answer, {required bool timedOut}) async {
    final question = state.currentQuestion;
    if (question == null) return;
    _timer?.cancel();
    state = state.copyWith(
      phase: BattlePhase.submitting,
      selectedAnswer: answer,
      submissionTimedOut: timedOut,
    );

    try {
      final result = await source.judge(
        questionId: question.id,
        answer: answer,
      );
      if (!mounted) return;

      final conquered = result.isCorrect && !timedOut;
      final outcome = timedOut
          ? AnswerOutcome.timedOut
          : result.isCorrect
          ? AnswerOutcome.correct
          : AnswerOutcome.incorrect;
      final points = conquered
          ? BattleRules.pointsFor(
              remainingSeconds: state.remainingSeconds,
              streakBefore: state.streak,
            )
          : 0;
      final streak = conquered ? state.streak + 1 : 0;

      state = state.copyWith(
        phase: BattlePhase.revealed,
        outcomes: [
          for (var slot = 0; slot < state.outcomes.length; slot++)
            slot == state.index ? outcome : state.outcomes[slot],
        ],
        correctCount: state.correctCount + (conquered ? 1 : 0),
        streak: streak,
        bestStreak: streak > state.bestStreak ? streak : state.bestStreak,
        score: state.score + points,
        lastPoints: points,
        outcome: outcome,
        correctAnswer: result.correctAnswer,
        explanation: result.explanation,
      );
    } catch (_) {
      if (mounted) state = state.copyWith(phase: BattlePhase.submitError);
    }
  }

  Future<void> next() async {
    if (state.phase != BattlePhase.revealed) return;
    if (state.isLastQuestion) {
      state = state.copyWith(phase: BattlePhase.complete);
      await _recordResult();
      return;
    }
    state = state.copyWith(
      phase: BattlePhase.active,
      index: state.index + 1,
      remainingSeconds: state.totalSeconds,
      lastPoints: 0,
      clearSelectedAnswer: true,
      submissionTimedOut: false,
      clearOutcome: true,
      clearCorrectAnswer: true,
      clearExplanation: true,
    );
    _startTimer();
  }

  Future<void> _recordResult() async {
    if (_resultRecorded) return;
    _resultRecorded = true;
    await onFinished(stars: state.stars, xpGained: state.xpGained);
  }

  void _startTimer() {
    _timer?.cancel();
    _timer = Timer.periodic(timerTick, (_) {
      if (!mounted || state.phase != BattlePhase.active) return;
      final next = state.remainingSeconds - 1;
      if (next <= 0) {
        _timer?.cancel();
        state = state.copyWith(remainingSeconds: 0);
        unawaited(_submit('', timedOut: true));
      } else {
        state = state.copyWith(remainingSeconds: next);
      }
    });
  }

  @override
  void dispose() {
    _timer?.cancel();
    super.dispose();
  }
}

/// Identifică un asalt: ținutul și etapa din el.
typedef BattleTarget = ({String chapterId, int stageIndex});

final battleControllerProvider = StateNotifierProvider.autoDispose
    .family<BattleController, BattleState, BattleTarget>((ref, target) {
      final chapter = RealmChapter.byId(target.chapterId);
      final stage = RealmChapter.stages[target.stageIndex];
      return BattleController(
        source: ref.watch(roundSourceProvider(target)),
        stage: stage,
        onFinished: ({required int stars, required int xpGained}) {
          return ref
              .read(campaignProgressProvider.notifier)
              .recordResult(
                chapterId: chapter.id,
                stageIndex: stage.index,
                stars: stars,
                xpGained: xpGained,
              );
        },
      );
    });
