import 'package:flutter/material.dart';

import '../../../core/design/gold_frame.dart';
import '../../../core/design/quizrealm_tokens.dart';
import '../../../domain/duel/duel_standing.dart';

/// Clasamentul unei partide cu mai mulți jucători.
///
/// Duelul are propriul afișaj față-în-față, potrivit pentru doi. De la trei
/// jucători în sus, acela devine mincinos: arată un adversar și îi ascunde pe
/// ceilalți. Aici încap toți, ordonați, cu locul meu marcat.
class MatchStandings extends StatelessWidget {
  const MatchStandings({
    required this.standings,
    required this.myUserId,
    required this.youLabel,
    required this.opponentLabel,
    super.key,
  });

  final List<DuelStanding> standings;
  final String? myUserId;

  /// Cum mă numesc pe mine în listă.
  final String youLabel;

  /// Prefixul pentru ceilalți, urmat de numărul lor de ordine — numele reale
  /// ale jucătorilor nu vin încă prin protocol.
  final String opponentLabel;

  @override
  Widget build(BuildContext context) {
    return GoldFrame(
      key: const Key('match-standings'),
      padding: const EdgeInsets.all(QuizRealmSpacing.sm),
      child: Column(
        mainAxisSize: MainAxisSize.min,
        children: [
          for (var index = 0; index < standings.length; index++)
            _StandingRow(
              position: index + 1,
              standing: standings[index],
              isMe: standings[index].userId == myUserId,
              label: standings[index].userId == myUserId
                  ? youLabel
                  : '$opponentLabel ${_opponentNumber(index)}',
              isLast: index == standings.length - 1,
            ),
        ],
      ),
    );
  }

  /// Numerotarea adversarilor sare peste mine, ca să nu existe „Adversar 2"
  /// fără „Adversar 1" atunci când eu sunt pe locul al doilea.
  int _opponentNumber(int index) {
    var number = 0;
    for (var i = 0; i <= index; i++) {
      if (standings[i].userId != myUserId) number++;
    }
    return number;
  }
}

class _StandingRow extends StatelessWidget {
  const _StandingRow({
    required this.position,
    required this.standing,
    required this.isMe,
    required this.label,
    required this.isLast,
  });

  final int position;
  final DuelStanding standing;
  final bool isMe;
  final String label;
  final bool isLast;

  @override
  Widget build(BuildContext context) {
    final color = isMe ? QuizRealmColors.electric : QuizRealmColors.goldDeep;

    return Semantics(
      label: '$position. $label, ${standing.points}',
      child: ExcludeSemantics(
        child: Container(
          margin: EdgeInsets.only(bottom: isLast ? 0 : 4),
          padding: const EdgeInsets.symmetric(
            horizontal: QuizRealmSpacing.sm,
            vertical: 6,
          ),
          decoration: BoxDecoration(
            color: isMe
                ? QuizRealmColors.surfaceSelected
                : QuizRealmColors.surfaceRow,
            borderRadius: BorderRadius.circular(QuizRealmRadius.sm),
            border: Border.all(color: color),
          ),
          child: Row(
            children: [
              SizedBox(
                width: 22,
                child: Text(
                  '$position',
                  style: QuizRealmTypography.numeric.copyWith(
                    fontSize: 13,
                    color: isMe
                        ? QuizRealmColors.electricGlow
                        : QuizRealmColors.textSecondary,
                  ),
                ),
              ),
              Expanded(
                child: Text(
                  label,
                  maxLines: 1,
                  overflow: TextOverflow.ellipsis,
                  style: QuizRealmTypography.body.copyWith(
                    fontSize: 14,
                    color: standing.connected
                        ? QuizRealmColors.textPrimary
                        // Deconectat: rămâne în listă, dar se vede că lipsește.
                        : QuizRealmColors.textMuted,
                  ),
                ),
              ),
              if (!standing.connected)
                const Padding(
                  padding: EdgeInsets.only(right: QuizRealmSpacing.sm),
                  child: Icon(
                    Icons.wifi_off_rounded,
                    size: 14,
                    color: QuizRealmColors.textMuted,
                  ),
                ),
              if (standing.territories > 0) ...[
                Icon(
                  Icons.flag_rounded,
                  size: 14,
                  color: QuizRealmColors.gold,
                ),
                const SizedBox(width: 3),
                Text(
                  '${standing.territories}',
                  style: QuizRealmTypography.numeric.copyWith(fontSize: 12),
                ),
                const SizedBox(width: QuizRealmSpacing.sm),
              ],
              Text(
                '${standing.points}',
                style: QuizRealmTypography.numeric.copyWith(
                  fontSize: 15,
                  color: isMe
                      ? QuizRealmColors.electricGlow
                      : QuizRealmColors.textPrimary,
                ),
              ),
            ],
          ),
        ),
      ),
    );
  }
}
