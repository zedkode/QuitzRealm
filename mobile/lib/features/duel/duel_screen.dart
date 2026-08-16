import 'package:flutter/material.dart';
import 'package:flutter/services.dart';
import 'package:flutter_riverpod/flutter_riverpod.dart';
import 'package:go_router/go_router.dart';

import '../../core/providers/repository_providers.dart';
import '../../core/theme/app_theme.dart';
import '../../core/ui/game_button.dart';
import '../../core/ui/game_frame.dart';
import '../../core/ui/game_icons.dart';
import '../../core/ui/realm_backdrop.dart';
import '../../domain/duel/duel_events.dart';
import '../../domain/duel/match_preferences.dart';
import '../../domain/question/quiz_question.dart';
import '../../l10n/app_localizations.dart';
import '../battle/widgets/answer_option.dart';
import '../battle/widgets/battle_hud.dart';
import 'duel_controller.dart';
import 'widgets/duel_scoreboard.dart';
import 'widgets/match_standings.dart';
import 'widgets/territory_board.dart';

/// Duel 1v1 online. Toate verdictele vin de la server; ecranul doar le arată.
class DuelScreen extends ConsumerStatefulWidget {
  const DuelScreen({super.key, this.preferences = MatchPreferences.defaults});

  /// Modul și categoriile alese pe ecranul „Joacă". Implicitul păstrează
  /// comportamentul vechi: duel 1v1 pe toate categoriile.
  final MatchPreferences preferences;

  @override
  ConsumerState<DuelScreen> createState() => _DuelScreenState();
}

class _DuelScreenState extends ConsumerState<DuelScreen> {
  final _numericController = TextEditingController();

  @override
  void initState() {
    super.initState();
    WidgetsBinding.instance.addPostFrameCallback((_) {
      if (mounted) ref.read(duelControllerProvider.notifier).start(widget.preferences);
    });
  }

  @override
  void dispose() {
    _numericController.dispose();
    super.dispose();
  }

  @override
  Widget build(BuildContext context) {
    final l10n = AppLocalizations.of(context);
    final state = ref.watch(duelControllerProvider);

    ref.listen<DuelState>(duelControllerProvider, (previous, next) {
      if (previous?.phase == next.phase) return;
      if (next.phase == DuelPhase.roundRevealed) {
        next.myScore?.isCorrect == true
            ? HapticFeedback.heavyImpact()
            : HapticFeedback.mediumImpact();
      }
      if (next.phase == DuelPhase.roundActive) {
        _numericController.clear();
      }
    });

    return PopScope(
      canPop: _canLeaveWithoutAsking(state.phase),
      onPopInvokedWithResult: (didPop, _) {
        if (!didPop) _confirmLeave(context, l10n);
      },
      child: Scaffold(
        body: RealmBackdrop(
          accent: GamePalette.crimson,
          child: SafeArea(
            child: Column(
              children: [
                Padding(
                  padding: const EdgeInsets.fromLTRB(10, 6, 14, 4),
                  child: Row(
                    children: [
                      GameIconButton(
                        symbol: GameSymbol.back,
                        tooltip: l10n.backLabel,
                        size: 40,
                        onPressed: () async {
                          if (_canLeaveWithoutAsking(state.phase)) {
                            await ref
                                .read(duelControllerProvider.notifier)
                                .leave();
                            if (context.mounted) context.pop();
                            return;
                          }
                          await _confirmLeave(context, l10n);
                        },
                      ),
                      const SizedBox(width: 10),
                      Expanded(
                        child: Text(
                          // Titlul urmează modul ales, nu presupune duel:
                          // altfel o partidă Clasic de patru s-ar anunța
                          // „Duel 1v1".
                          widget.preferences.mode == MatchMode.classic
                              ? l10n.playModeClassic
                              : l10n.duelTitle,
                          style: GameText.heading.copyWith(
                            fontSize: 15,
                            color: GamePalette.crimson,
                          ),
                        ),
                      ),
                      if (state.matchId != null && _isPlayingPhase(state.phase))
                        GameIconButton(
                          key: const Key('duel-chat-open'),
                          symbol: GameSymbol.chat,
                          tooltip: l10n.matchChatOpen,
                          size: 40,
                          color: GamePalette.arcane,
                          onPressed: () => _openMatchChat(context),
                        ),
                    ],
                  ),
                ),
                Expanded(child: _buildBody(context, state)),
              ],
            ),
          ),
        ),
      ),
    );
  }

  /// Ieșirea liberă e permisă doar când nu e nimic de pierdut.
  static bool _canLeaveWithoutAsking(DuelPhase phase) {
    return phase == DuelPhase.idle ||
        phase == DuelPhase.connecting ||
        phase == DuelPhase.finished ||
        phase == DuelPhase.error ||
        phase == DuelPhase.disconnected ||
        phase == DuelPhase.unauthenticated;
  }

  static bool _isPlayingPhase(DuelPhase phase) {
    return phase == DuelPhase.roundActive ||
        phase == DuelPhase.waitingOpponent ||
        phase == DuelPhase.roundRevealed;
  }

  Future<void> _openMatchChat(BuildContext context) async {
    final input = TextEditingController();
    await showModalBottomSheet<void>(
      context: context,
      isScrollControlled: true,
      useSafeArea: true,
      backgroundColor: Colors.transparent,
      barrierColor: GamePalette.nightDeep.withValues(alpha: 0.78),
      builder: (_) => Consumer(
        builder: (context, ref, _) => _MatchChatSheet(
          state: ref.watch(duelControllerProvider),
          input: input,
          onSend: (message) {
            ref.read(duelControllerProvider.notifier).sendChatMessage(message);
            input.clear();
          },
          onReaction: ref
              .read(duelControllerProvider.notifier)
              .sendChatReaction,
        ),
      ),
    );
    input.dispose();
  }

  Future<void> _confirmLeave(
    BuildContext context,
    AppLocalizations l10n,
  ) async {
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
                key: const Key('duel-leave-confirm'),
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
    if (leave != true) return;
    await ref.read(duelControllerProvider.notifier).leave();
    if (context.mounted) context.pop();
  }

  Widget _buildBody(BuildContext context, DuelState state) {
    final l10n = AppLocalizations.of(context);
    return switch (state.phase) {
      DuelPhase.idle ||
      DuelPhase.connecting => _DuelStatus(title: l10n.duelConnecting),
      DuelPhase.searching => _SearchingView(
        playerCount: widget.preferences.mode == MatchMode.classic
            ? widget.preferences.playerCount
            : null,
        onCancel: () async {
          await ref.read(duelControllerProvider.notifier).leave();
          if (context.mounted) context.pop();
        },
      ),
      DuelPhase.unauthenticated => _DuelMessage(
        symbol: GameSymbol.helmet,
        title: l10n.duelNeedAccountTitle,
        body: l10n.duelNeedAccountBody,
        actionLabel: l10n.duelGoToAccount,
        onAction: () => context.pushReplacement('/cont'),
      ),
      DuelPhase.disconnected => _DuelMessage(
        symbol: GameSymbol.skull,
        title: l10n.duelDisconnectedTitle,
        body: l10n.duelDisconnectedBody,
        actionLabel: l10n.retry,
        onAction: () => ref.read(duelControllerProvider.notifier).start(),
      ),
      DuelPhase.error => _DuelMessage(
        symbol: GameSymbol.skull,
        title: l10n.duelServerErrorTitle,
        body: state.errorMessage,
        actionLabel: l10n.retry,
        onAction: () => ref.read(duelControllerProvider.notifier).start(),
      ),
      DuelPhase.finished => _DuelFinishedView(
        state: state,
        onRematch: () => ref.read(duelControllerProvider.notifier).start(),
        onLeave: () async {
          await ref.read(duelControllerProvider.notifier).leave();
          if (context.mounted) context.pop();
        },
      ),
      DuelPhase.blocked =>
        state.rejectionReason == DuelRejectionReason.emailNotVerified
            ? const _VerifyEmailNeeded(key: Key('duel-verify-email'))
            : _DuelMessage(
                key: const Key('duel-account-restricted'),
                symbol: GameSymbol.skull,
                title: l10n.duelAccountRestrictedTitle,
                body: l10n.duelAccountRestrictedBody,
                actionLabel: l10n.duelGoToAccount,
                onAction: () => context.pushReplacement('/cont'),
              ),
      DuelPhase.reconnecting => _DuelStatus(
        key: const Key('duel-reconnecting'),
        title: l10n.duelReconnectingTitle,
        body: l10n.duelReconnectingBody,
      ),
      DuelPhase.roundActive ||
      DuelPhase.waitingOpponent ||
      DuelPhase.roundRevealed => _DuelRoundView(
        state: state,
        numericController: _numericController,
        onAnswer: (answer) =>
            ref.read(duelControllerProvider.notifier).submitAnswer(answer),
        onSelectTarget: (territoryId) => ref
            .read(duelControllerProvider.notifier)
            .declareAttack(territoryId),
      ),
    };
  }
}

class _MatchChatSheet extends StatelessWidget {
  const _MatchChatSheet({
    required this.state,
    required this.input,
    required this.onSend,
    required this.onReaction,
  });

  final DuelState state;
  final TextEditingController input;
  final ValueChanged<String> onSend;
  final ValueChanged<String> onReaction;

  @override
  Widget build(BuildContext context) {
    final l10n = AppLocalizations.of(context);
    return FractionallySizedBox(
      heightFactor: 0.78,
      child: Padding(
        padding: EdgeInsets.fromLTRB(
          10,
          0,
          10,
          MediaQuery.viewInsetsOf(context).bottom + 10,
        ),
        child: GameFrame(
          key: const Key('duel-match-chat'),
          accent: GamePalette.arcane,
          glow: true,
          child: Column(
            crossAxisAlignment: CrossAxisAlignment.stretch,
            children: [
              Row(
                children: [
                  const GameIcon(
                    GameSymbol.chat,
                    size: 30,
                    color: GamePalette.arcane,
                    glow: true,
                  ),
                  const SizedBox(width: 10),
                  Expanded(
                    child: Column(
                      crossAxisAlignment: CrossAxisAlignment.start,
                      children: [
                        Text(l10n.matchChatTitle, style: GameText.heading),
                        Text(l10n.matchChatEphemeral, style: GameText.bodyDim),
                      ],
                    ),
                  ),
                  GameIconButton(
                    symbol: GameSymbol.cross,
                    tooltip: l10n.close,
                    size: 38,
                    onPressed: () => Navigator.of(context).pop(),
                  ),
                ],
              ),
              const SizedBox(height: 12),
              Expanded(
                child: state.chatMessages.isEmpty
                    ? Center(
                        child: Text(
                          l10n.matchChatEmpty,
                          textAlign: TextAlign.center,
                          style: GameText.bodyDim,
                        ),
                      )
                    : ListView.separated(
                        key: const Key('duel-chat-messages'),
                        reverse: true,
                        itemCount: state.chatMessages.length,
                        separatorBuilder: (_, _) => const SizedBox(height: 7),
                        itemBuilder: (context, index) {
                          final message =
                              state.chatMessages[state.chatMessages.length -
                                  1 -
                                  index];
                          return _MatchChatMessageBubble(
                            message: message,
                            mine: message.senderId == state.myUserId,
                          );
                        },
                      ),
              ),
              if (state.chatErrorReason != null) ...[
                const SizedBox(height: 8),
                Text(
                  _chatError(l10n, state.chatErrorReason!),
                  key: const Key('duel-chat-error'),
                  style: GameText.body.copyWith(color: GamePalette.crimson),
                  textAlign: TextAlign.center,
                ),
              ],
              const SizedBox(height: 10),
              Text(l10n.matchChatReactions, style: GameText.eyebrow),
              const SizedBox(height: 7),
              Row(
                children: [
                  Expanded(
                    child: GameButton(
                      key: const Key('duel-reaction-good-luck'),
                      label: l10n.matchReactionGoodLuck,
                      tone: GameButtonTone.arcane,
                      height: 38,
                      compact: true,
                      onPressed: () => onReaction('good_luck'),
                    ),
                  ),
                  const SizedBox(width: 7),
                  Expanded(
                    child: GameButton(
                      label: l10n.matchReactionNiceMove,
                      tone: GameButtonTone.stone,
                      height: 38,
                      compact: true,
                      onPressed: () => onReaction('nice_move'),
                    ),
                  ),
                ],
              ),
              const SizedBox(height: 6),
              Row(
                children: [
                  Expanded(
                    child: GameButton(
                      label: l10n.matchReactionWow,
                      tone: GameButtonTone.stone,
                      height: 38,
                      compact: true,
                      onPressed: () => onReaction('wow'),
                    ),
                  ),
                  const SizedBox(width: 7),
                  Expanded(
                    child: GameButton(
                      label: l10n.matchReactionWellPlayed,
                      tone: GameButtonTone.emerald,
                      height: 38,
                      compact: true,
                      onPressed: () => onReaction('well_played'),
                    ),
                  ),
                ],
              ),
              const SizedBox(height: 10),
              if (state.canSendChatText)
                Row(
                  children: [
                    Expanded(
                      child: TextField(
                        key: const Key('duel-chat-input'),
                        controller: input,
                        maxLength: 500,
                        minLines: 1,
                        maxLines: 2,
                        textInputAction: TextInputAction.send,
                        onSubmitted: onSend,
                        decoration: InputDecoration(
                          counterText: '',
                          hintText: l10n.matchChatHint,
                        ),
                      ),
                    ),
                    const SizedBox(width: 8),
                    GameIconButton(
                      key: const Key('duel-chat-send'),
                      symbol: GameSymbol.sword,
                      tooltip: l10n.matchChatSend,
                      color: GamePalette.goldBright,
                      onPressed: () => onSend(input.text),
                    ),
                  ],
                )
              else
                Text(
                  l10n.matchChatTextLocked,
                  key: const Key('duel-chat-text-locked'),
                  textAlign: TextAlign.center,
                  style: GameText.bodyDim,
                ),
            ],
          ),
        ),
      ),
    );
  }

  String _chatError(AppLocalizations l10n, String reason) {
    return switch (reason) {
      'tier_too_low' => l10n.matchChatTextLocked,
      'muted' => l10n.matchChatMuted,
      'rate_limited' => l10n.matchChatTooFast,
      'links_not_allowed' => l10n.matchChatLinksLocked,
      'not_in_match' => l10n.matchChatClosed,
      _ => l10n.matchChatInvalid,
    };
  }
}

class _MatchChatMessageBubble extends StatelessWidget {
  const _MatchChatMessageBubble({required this.message, required this.mine});

  final DuelChatMessage message;
  final bool mine;

  @override
  Widget build(BuildContext context) {
    final l10n = AppLocalizations.of(context);
    final content = message.kind == DuelChatMessageKind.reaction
        ? switch (message.content) {
            'good_luck' => l10n.matchReactionGoodLuck,
            'nice_move' => l10n.matchReactionNiceMove,
            'wow' => l10n.matchReactionWow,
            'well_played' => l10n.matchReactionWellPlayed,
            _ => message.content,
          }
        : message.content;
    final accent = mine ? GamePalette.gold : GamePalette.arcane;
    return Align(
      alignment: mine ? Alignment.centerRight : Alignment.centerLeft,
      child: Container(
        constraints: const BoxConstraints(maxWidth: 310),
        padding: const EdgeInsets.symmetric(horizontal: 12, vertical: 8),
        decoration: BoxDecoration(
          color: GamePalette.stone900.withValues(alpha: 0.92),
          borderRadius: BorderRadius.circular(14),
          border: Border.all(color: accent.withValues(alpha: 0.65)),
        ),
        child: Column(
          crossAxisAlignment: CrossAxisAlignment.start,
          children: [
            Text(
              mine ? l10n.duelYou : message.senderName,
              style: GameText.eyebrow.copyWith(color: accent),
            ),
            const SizedBox(height: 3),
            Text(
              content,
              key: Key('duel-chat-message-${message.id}'),
              style: message.kind == DuelChatMessageKind.reaction
                  ? GameText.heading.copyWith(fontSize: 14)
                  : GameText.body,
            ),
          ],
        ),
      ),
    );
  }
}

class _DuelRoundView extends StatelessWidget {
  const _DuelRoundView({
    required this.state,
    required this.numericController,
    required this.onAnswer,
    required this.onSelectTarget,
  });

  final DuelState state;
  final TextEditingController numericController;
  final ValueChanged<String> onAnswer;

  /// Alegerea unei ținte pe hartă, în faza de luptă.
  final ValueChanged<String> onSelectTarget;

  @override
  Widget build(BuildContext context) {
    final l10n = AppLocalizations.of(context);
    final question = state.question;
    if (question == null) return _DuelStatus(title: l10n.duelConnecting);

    final revealed = state.phase == DuelPhase.roundRevealed;
    final inputEnabled = state.canAnswer;

    return SingleChildScrollView(
      padding: const EdgeInsets.fromLTRB(14, 4, 14, 28),
      child: Column(
        crossAxisAlignment: CrossAxisAlignment.stretch,
        children: [
          // Tabla de joc apare doar la Clasic, unde serverul trimite hartă.
          if (state.territoryMap != null && state.territory != null) ...[
            TerritoryBoard(
              map: state.territoryMap!,
              ownership: state.territory!,
              myUserId: state.myUserId,
              playerOrder: state.standings
                  .map((standing) => standing.userId)
                  .toList(growable: false),
              attackable: state.attackableTerritories,
              selectedTargetId: state.declaredTargetId,
              onSelectTarget: state.amSpectator ? null : onSelectTarget,
            ),
            const SizedBox(height: 10),
          ],
          // Față-în-față doar când chiar sunt doi. La Clasic, afișajul de duel
          // ar arăta un adversar și i-ar ascunde pe ceilalți.
          if (state.isMultiplayer)
            MatchStandings(
              standings: state.standings,
              myUserId: state.myUserId,
              youLabel: l10n.duelYou,
              opponentLabel: l10n.duelOpponent,
            )
          else
            DuelScoreboard(
              youLabel: l10n.duelYou,
              opponentLabel: l10n.duelOpponent,
              youScore: state.myPoints,
              opponentScore: state.opponentPoints,
              youTerritories: state.myTerritories,
              opponentTerritories: state.opponentTerritories,
            ),
          const SizedBox(height: 10),
          Row(
            children: [
              Expanded(
                child: Text(
                  l10n.duelRoundCounter(state.roundNumber, state.totalRounds),
                  style: GameText.eyebrow,
                ),
              ),
              BattleTimer(
                seconds: state.secondsLeft.clamp(0, state.roundSeconds),
                totalSeconds: state.roundSeconds,
                semanticsLabel: l10n.timerSemantics(state.secondsLeft),
                size: 48,
              ),
            ],
          ),
          if (state.opponentMissing) ...[
            const SizedBox(height: 10),
            _OpponentAwayBanner(secondsLeft: state.resumeSecondsLeft),
          ],
          const SizedBox(height: 10),
          ParchmentPanel(
            child: Text(
              question.text,
              key: const Key('duel-question-text'),
              style: const TextStyle(
                fontSize: 19,
                height: 1.3,
                fontWeight: FontWeight.w700,
                color: GamePalette.ink,
              ),
            ),
          ),
          const SizedBox(height: 12),
          if (question.type == QuizQuestionType.multipleChoice)
            ...question.options.asMap().entries.map((entry) {
              final letter = String.fromCharCode(65 + entry.key);
              return Padding(
                padding: const EdgeInsets.only(bottom: 9),
                child: AnswerOption(
                  key: Key('duel-option-${entry.key}'),
                  letter: letter,
                  answer: entry.value,
                  semanticsLabel: l10n.answerOptionSemantics(
                    letter,
                    entry.value,
                  ),
                  state: _visualState(state, entry.value, revealed),
                  onPressed: inputEnabled ? () => onAnswer(entry.value) : null,
                ),
              );
            })
          else ...[
            GameFrame(
              accent: GamePalette.arcane,
              padding: const EdgeInsets.all(10),
              rivets: false,
              child: TextField(
                key: const Key('duel-numeric'),
                controller: numericController,
                enabled: inputEnabled,
                textAlign: TextAlign.center,
                style: GameText.numeric.copyWith(fontSize: 22),
                keyboardType: const TextInputType.numberWithOptions(
                  decimal: true,
                  signed: true,
                ),
                inputFormatters: [
                  FilteringTextInputFormatter.allow(RegExp(r'[-0-9,.]')),
                ],
                onSubmitted: inputEnabled ? onAnswer : null,
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
              key: const Key('duel-submit-numeric'),
              label: l10n.submitAnswer,
              icon: GameSymbol.sword,
              onPressed: inputEnabled
                  ? () => onAnswer(numericController.text)
                  : null,
            ),
          ],
          if (state.phase == DuelPhase.waitingOpponent) ...[
            const SizedBox(height: 14),
            GameFrame(
              key: const Key('duel-waiting'),
              accent: GamePalette.arcane,
              rivets: false,
              child: Row(
                children: [
                  const SizedBox.square(
                    dimension: 18,
                    child: CircularProgressIndicator(strokeWidth: 2),
                  ),
                  const SizedBox(width: 12),
                  Expanded(
                    child: Text(
                      l10n.duelWaitingOpponent,
                      style: GameText.bodyDim,
                    ),
                  ),
                ],
              ),
            ),
          ],
          if (revealed) ...[
            const SizedBox(height: 14),
            _RoundVerdict(state: state),
          ],
        ],
      ),
    );
  }

  static AnswerVisualState _visualState(
    DuelState state,
    String answer,
    bool revealed,
  ) {
    final selected = state.selectedAnswer == answer;
    if (revealed) {
      if (state.lastResult?.correctAnswer == answer) {
        return AnswerVisualState.correct;
      }
      if (selected) return AnswerVisualState.wrong;
      return AnswerVisualState.muted;
    }
    return selected ? AnswerVisualState.selected : AnswerVisualState.idle;
  }
}

/// Adversarul a căzut din rețea. Partida stă pe loc cât timp mai are drept de
/// revenire; cronometrul rundei e înghețat pe server, nu doar în interfață.
class _OpponentAwayBanner extends StatelessWidget {
  const _OpponentAwayBanner({required this.secondsLeft});

  final int secondsLeft;

  @override
  Widget build(BuildContext context) {
    final l10n = AppLocalizations.of(context);
    return GameFrame(
      key: const Key('duel-opponent-away'),
      accent: GamePalette.gold,
      rivets: false,
      child: Row(
        children: [
          const GameIcon(
            GameSymbol.hourglass,
            size: 26,
            color: GamePalette.goldBright,
          ),
          const SizedBox(width: 12),
          Expanded(
            child: Column(
              crossAxisAlignment: CrossAxisAlignment.start,
              children: [
                Text(
                  l10n.duelOpponentAwayTitle,
                  style: GameText.heading.copyWith(
                    fontSize: 14,
                    color: GamePalette.goldBright,
                  ),
                ),
                const SizedBox(height: 4),
                Text(
                  secondsLeft > 0
                      ? l10n.duelOpponentAwayBody(secondsLeft)
                      : l10n.duelOpponentAwayExpired,
                  style: GameText.bodyDim,
                ),
              ],
            ),
          ),
        ],
      ),
    );
  }
}

class _RoundVerdict extends StatelessWidget {
  const _RoundVerdict({required this.state});

  final DuelState state;

  @override
  Widget build(BuildContext context) {
    final l10n = AppLocalizations.of(context);
    final mine = state.myScore;
    final theirs = state.opponentScore;
    final wonTerritory = state.lastTerritoryGain > 0;
    final color = mine?.isCorrect == true
        ? GamePalette.emerald
        : GamePalette.crimson;

    return GameFrame(
      key: const Key('duel-verdict'),
      accent: color,
      glow: mine?.isCorrect == true,
      child: Column(
        crossAxisAlignment: CrossAxisAlignment.start,
        children: [
          Row(
            children: [
              GameIcon(
                wonTerritory ? GameSymbol.castle : GameSymbol.shield,
                size: 24,
                color: color,
              ),
              const SizedBox(width: 10),
              Expanded(
                child: Text(
                  wonTerritory
                      ? l10n.duelRoundWon
                      : mine?.isCorrect == true
                      ? l10n.duelRoundNeutral
                      : l10n.duelRoundLost,
                  style: GameText.heading.copyWith(color: color, fontSize: 15),
                ),
              ),
            ],
          ),
          const SizedBox(height: 10),
          Text(
            l10n.correctAnswerLabel(state.lastResult?.correctAnswer ?? ''),
            style: GameText.body,
          ),
          const SizedBox(height: 10),
          _AnswerLine(
            label: l10n.duelYou,
            answer: mine?.answer,
            isCorrect: mine?.isCorrect ?? false,
            responseTimeMs: mine?.responseTimeMs,
            emptyLabel: l10n.duelNoAnswer,
          ),
          const SizedBox(height: 6),
          _AnswerLine(
            label: l10n.duelOpponent,
            answer: theirs?.answer,
            isCorrect: theirs?.isCorrect ?? false,
            responseTimeMs: theirs?.responseTimeMs,
            emptyLabel: l10n.duelNoAnswer,
          ),
          const SizedBox(height: 12),
          Text(l10n.duelNextRound, style: GameText.bodyDim),
        ],
      ),
    );
  }
}

class _AnswerLine extends StatelessWidget {
  const _AnswerLine({
    required this.label,
    required this.answer,
    required this.isCorrect,
    required this.responseTimeMs,
    required this.emptyLabel,
  });

  final String label;
  final String? answer;
  final bool isCorrect;
  final int? responseTimeMs;
  final String emptyLabel;

  @override
  Widget build(BuildContext context) {
    final color = isCorrect ? GamePalette.emerald : GamePalette.crimson;
    return Row(
      children: [
        SizedBox(
          width: 74,
          child: Text(
            label,
            style: GameText.eyebrow.copyWith(color: GamePalette.creamDim),
          ),
        ),
        GameIcon(
          isCorrect ? GameSymbol.check : GameSymbol.cross,
          size: 15,
          color: color,
        ),
        const SizedBox(width: 8),
        Expanded(
          child: Text(
            answer?.isNotEmpty == true ? answer! : emptyLabel,
            maxLines: 1,
            overflow: TextOverflow.ellipsis,
            style: GameText.body,
          ),
        ),
        if (responseTimeMs != null)
          Text(
            '${(responseTimeMs! / 1000).toStringAsFixed(1)}s',
            style: GameText.bodyDim.copyWith(fontSize: 12),
          ),
      ],
    );
  }
}

class _DuelFinishedView extends StatelessWidget {
  const _DuelFinishedView({
    required this.state,
    required this.onRematch,
    required this.onLeave,
  });

  final DuelState state;
  final VoidCallback onRematch;
  final VoidCallback onLeave;

  @override
  Widget build(BuildContext context) {
    final l10n = AppLocalizations.of(context);
    final mine = state.myFinalScore;
    final theirs = state.opponentFinalScore;
    final outcome = mine?.outcome ?? DuelOutcome.draw;
    final (title, color, symbol) = switch (outcome) {
      DuelOutcome.win => (
        l10n.duelVictory,
        GamePalette.goldBright,
        GameSymbol.trophy,
      ),
      DuelOutcome.loss => (
        l10n.duelDefeat,
        GamePalette.crimson,
        GameSymbol.shield,
      ),
      DuelOutcome.draw => (
        l10n.duelDraw,
        GamePalette.arcane,
        GameSymbol.swords,
      ),
    };

    return SingleChildScrollView(
      padding: const EdgeInsets.fromLTRB(18, 6, 18, 28),
      child: Column(
        crossAxisAlignment: CrossAxisAlignment.stretch,
        children: [
          const SizedBox(height: 10),
          Center(child: GameIcon(symbol, size: 96, color: color, glow: true)),
          const SizedBox(height: 14),
          Center(
            child: RibbonBanner(
              key: const Key('duel-outcome'),
              text: title,
              color: outcome == DuelOutcome.loss
                  ? GamePalette.stone700
                  : GamePalette.crimson,
            ),
          ),
          const SizedBox(height: 18),
          GameFrame(
            accent: color,
            child: Column(
              children: [
                _FinalLine(
                  label: l10n.duelYou,
                  score: mine?.score ?? 0,
                  territories: mine?.territoriesWon ?? 0,
                  highlight: outcome == DuelOutcome.win,
                ),
                const SizedBox(height: 10),
                _FinalLine(
                  label: l10n.duelOpponent,
                  score: theirs?.score ?? 0,
                  territories: theirs?.territoriesWon ?? 0,
                  highlight: outcome == DuelOutcome.loss,
                ),
              ],
            ),
          ),
          if (state.endedByForfeit) ...[
            const SizedBox(height: 12),
            Text(
              l10n.duelWonByForfeit,
              key: const Key('duel-forfeit-note'),
              textAlign: TextAlign.center,
              style: GameText.bodyDim,
            ),
          ],
          const SizedBox(height: 20),
          GameButton(
            key: const Key('duel-rematch'),
            label: l10n.duelRematch,
            icon: GameSymbol.swords,
            onPressed: onRematch,
          ),
          const SizedBox(height: 10),
          GameButton(
            label: l10n.duelLeave,
            icon: GameSymbol.back,
            tone: GameButtonTone.stone,
            height: 48,
            compact: true,
            onPressed: onLeave,
          ),
        ],
      ),
    );
  }
}

class _FinalLine extends StatelessWidget {
  const _FinalLine({
    required this.label,
    required this.score,
    required this.territories,
    required this.highlight,
  });

  final String label;
  final int score;
  final int territories;
  final bool highlight;

  @override
  Widget build(BuildContext context) {
    final l10n = AppLocalizations.of(context);
    return Row(
      children: [
        GameIcon(
          highlight ? GameSymbol.crown : GameSymbol.helmet,
          size: 22,
          color: highlight ? GamePalette.goldBright : GamePalette.stone600,
        ),
        const SizedBox(width: 10),
        Expanded(child: Text(label, style: GameText.eyebrow)),
        Text(
          l10n.duelFinalLine(score, territories),
          style: GameText.body.copyWith(fontWeight: FontWeight.w700),
        ),
      ],
    );
  }
}

class _SearchingView extends StatelessWidget {
  const _SearchingView({required this.onCancel, this.playerCount});

  final VoidCallback onCancel;

  /// Câți jucători se așteaptă la Clasic. `null` la duel, unde e mereu unul.
  final int? playerCount;

  @override
  Widget build(BuildContext context) {
    final l10n = AppLocalizations.of(context);
    return Center(
      child: SingleChildScrollView(
        padding: const EdgeInsets.all(22),
        child: Column(
          mainAxisSize: MainAxisSize.min,
          children: [
            const _PulsingCrest(),
            const SizedBox(height: 22),
            Text(
              playerCount == null
                  ? l10n.duelSearching
                  : l10n.classicSearchingTitle,
              key: const Key('duel-searching'),
              textAlign: TextAlign.center,
              style: GameText.title,
            ),
            const SizedBox(height: 10),
            Text(
              // La Clasic aștepți mai mulți jucători, nu „un adversar".
              playerCount == null
                  ? l10n.duelSearchingHint
                  : l10n.classicSearchingBody(playerCount!),
              textAlign: TextAlign.center,
              style: GameText.bodyDim,
            ),
            const SizedBox(height: 26),
            GameButton(
              label: l10n.duelCancelSearch,
              tone: GameButtonTone.stone,
              height: 48,
              compact: true,
              expand: false,
              onPressed: onCancel,
            ),
          ],
        ),
      ),
    );
  }
}

class _PulsingCrest extends StatefulWidget {
  const _PulsingCrest();

  @override
  State<_PulsingCrest> createState() => _PulsingCrestState();
}

class _PulsingCrestState extends State<_PulsingCrest>
    with SingleTickerProviderStateMixin {
  late final AnimationController _controller = AnimationController(
    vsync: this,
    duration: const Duration(milliseconds: 1400),
  )..repeat(reverse: true);

  @override
  void dispose() {
    _controller.dispose();
    super.dispose();
  }

  @override
  Widget build(BuildContext context) {
    return AnimatedBuilder(
      animation: _controller,
      builder: (context, child) {
        return Transform.scale(
          scale: 0.94 + 0.06 * _controller.value,
          child: child,
        );
      },
      child: SizedBox(
        height: 150,
        child: Image.asset(
          'assets/game/quizrealm_crest.png',
          excludeFromSemantics: true,
        ),
      ),
    );
  }
}

class _DuelStatus extends StatelessWidget {
  const _DuelStatus({required this.title, super.key, this.body});

  final String title;
  final String? body;

  @override
  Widget build(BuildContext context) {
    return Center(
      child: Padding(
        padding: const EdgeInsets.all(26),
        child: Column(
          mainAxisSize: MainAxisSize.min,
          children: [
            const CircularProgressIndicator(),
            const SizedBox(height: 16),
            Text(title, textAlign: TextAlign.center, style: GameText.body),
            if (body != null) ...[
              const SizedBox(height: 8),
              Text(body!, textAlign: TextAlign.center, style: GameText.bodyDim),
            ],
          ],
        ),
      ),
    );
  }
}

/// Ecranul văzut când serverul refuză coada pentru că adresa nu e confirmată.
///
/// Are propriul buton de retrimitere: fără el, jucătorul ar rămâne blocat cu
/// un mesaj și nicio cale de ieșire din aplicație.
class _VerifyEmailNeeded extends ConsumerStatefulWidget {
  const _VerifyEmailNeeded({super.key});

  @override
  ConsumerState<_VerifyEmailNeeded> createState() => _VerifyEmailNeededState();
}

class _VerifyEmailNeededState extends ConsumerState<_VerifyEmailNeeded> {
  bool _sending = false;

  Future<void> _resend() async {
    final l10n = AppLocalizations.of(context);
    final messenger = ScaffoldMessenger.of(context);
    setState(() => _sending = true);
    var message = l10n.duelVerifyEmailSent;
    try {
      await ref.read(authRepositoryProvider).requestEmailVerification();
    } catch (_) {
      message = l10n.duelVerifyEmailFailed;
    }
    if (!mounted) return;
    setState(() => _sending = false);
    messenger.showSnackBar(SnackBar(content: Text(message)));
  }

  @override
  Widget build(BuildContext context) {
    final l10n = AppLocalizations.of(context);
    return _DuelMessage(
      symbol: GameSymbol.scroll,
      title: l10n.duelVerifyEmailTitle,
      body: l10n.duelVerifyEmailBody,
      actionLabel: _sending
          ? l10n.duelVerifyEmailSending
          : l10n.duelVerifyEmailAction,
      onAction: _sending ? () {} : _resend,
    );
  }
}

class _DuelMessage extends StatelessWidget {
  const _DuelMessage({
    super.key,
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
                GameIcon(symbol, size: 52, color: GamePalette.gold),
                const SizedBox(height: 16),
                Text(title, textAlign: TextAlign.center, style: GameText.title),
                if (body != null && body!.isNotEmpty) ...[
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
