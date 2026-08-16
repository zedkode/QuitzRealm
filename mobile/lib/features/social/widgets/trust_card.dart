import 'package:flutter/material.dart';

import '../../../core/theme/app_theme.dart';
import '../../../core/ui/game_frame.dart';
import '../../../core/ui/game_icons.dart';
import '../../../domain/social/social_models.dart';
import '../../../l10n/app_localizations.dart';

/// Treapta de încredere și cât mai e până la următoarea (§2.5).
///
/// Progresul e calculat de server; ecranul doar îl desenează. Numele treptei
/// vine dintr-o cheie de traducere, nu din API — textul vizibil trece prin
/// i18n.
class TrustCard extends StatelessWidget {
  const TrustCard({required this.trust, super.key});

  final TrustInfo trust;

  static String tierName(AppLocalizations l10n, String tierKey) {
    return switch (tierKey) {
      'apprentice' => l10n.trustTierApprentice,
      'contributor' => l10n.trustTierContributor,
      'established' => l10n.trustTierEstablished,
      'experienced' => l10n.trustTierExperienced,
      'expert' => l10n.trustTierExpert,
      'communityMaster' => l10n.trustTierCommunityMaster,
      'elite' => l10n.trustTierElite,
      'communityLegend' => l10n.trustTierCommunityLegend,
      _ => l10n.trustTierNewcomer,
    };
  }

  @override
  Widget build(BuildContext context) {
    final l10n = AppLocalizations.of(context);
    final remaining = trust.answersToNextTier;

    return GameFrame(
      key: const Key('social-trust-card'),
      margin: const EdgeInsets.fromLTRB(14, 4, 14, 10),
      padding: const EdgeInsets.all(14),
      child: Column(
        crossAxisAlignment: CrossAxisAlignment.start,
        children: [
          Row(
            children: [
              const GameIcon(
                GameSymbol.shield,
                size: 26,
                color: GamePalette.goldBright,
              ),
              const SizedBox(width: 10),
              Expanded(
                child: Text(
                  'T${trust.tier} · ${tierName(l10n, trust.tierKey)}',
                  style: GameText.heading.copyWith(fontSize: 14),
                ),
              ),
              Text(
                l10n.trustCorrectAnswers(trust.correctAnswers),
                style: GameText.bodyDim.copyWith(fontSize: 11),
              ),
            ],
          ),
          const SizedBox(height: 10),
          ClipRRect(
            borderRadius: BorderRadius.circular(6),
            child: LinearProgressIndicator(
              value: trust.progressToNextTier,
              minHeight: 8,
              backgroundColor: GamePalette.stone700,
              valueColor: const AlwaysStoppedAnimation(GamePalette.gold),
            ),
          ),
          const SizedBox(height: 8),
          Text(
            remaining == null
                ? l10n.trustMaxTier
                : l10n.trustAnswersToNextTier(remaining),
            style: GameText.bodyDim.copyWith(fontSize: 11),
          ),
          if (trust.isMuted) ...[
            const SizedBox(height: 8),
            Row(
              key: const Key('social-muted-note'),
              children: [
                const GameIcon(
                  GameSymbol.hourglass,
                  size: 16,
                  color: GamePalette.crimson,
                ),
                const SizedBox(width: 6),
                Expanded(
                  child: Text(
                    l10n.chatMutedNotice,
                    style: GameText.bodyDim.copyWith(
                      fontSize: 11,
                      color: GamePalette.crimson,
                    ),
                  ),
                ),
              ],
            ),
          ],
        ],
      ),
    );
  }
}
