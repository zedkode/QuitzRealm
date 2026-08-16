import 'package:flutter/material.dart';

import '../ui/game_icons.dart';
import 'gold_frame.dart';
import 'quizrealm_tokens.dart';

/// Cartonașul unui mod de joc, din rândul de sus al tabloului de bord.
///
/// În capturi fiecare cartonaș are ilustrație proprie și o dominantă de culoare
/// diferită. Ilustrațiile lipsesc (`ASSET_GAPS.md`, #2), deci până apar folosim
/// simbolul jocului peste un fundal în tonul cerut — nu o iconiță Material, care
/// ar rupe silueta față de restul interfeței.
class GameModeCard extends StatelessWidget {
  const GameModeCard({
    required this.title,
    required this.description,
    required this.symbol,
    required this.tint,
    required this.onTap,
    super.key,
    this.artwork,
    this.badge,
  });

  final String title;
  final String description;
  final GameSymbol symbol;

  /// Dominanta de culoare a cartonașului.
  final Color tint;
  final VoidCallback onTap;

  /// Ilustrația, când va exista.
  final ImageProvider? artwork;

  /// Marcaj de colț (ex. „nou", număr de mesaje necitite).
  final Widget? badge;

  @override
  Widget build(BuildContext context) {
    final art = artwork;

    return Semantics(
      button: true,
      label: '$title. $description',
      child: ExcludeSemantics(
        child: GoldFrame(
          onTap: onTap,
          padding: const EdgeInsets.all(QuizRealmSpacing.sm),
          child: Column(
            mainAxisSize: MainAxisSize.min,
            crossAxisAlignment: CrossAxisAlignment.stretch,
            children: [
              AspectRatio(
                aspectRatio: 1,
                child: Stack(
                  fit: StackFit.expand,
                  children: [
                    Container(
                      decoration: BoxDecoration(
                        borderRadius: BorderRadius.circular(QuizRealmRadius.sm),
                        border: Border.all(color: QuizRealmColors.goldDeep),
                        gradient: LinearGradient(
                          begin: Alignment.topCenter,
                          end: Alignment.bottomCenter,
                          colors: [
                            Color.alphaBlend(
                              tint.withValues(alpha: 0.55),
                              QuizRealmColors.backgroundDeep,
                            ),
                            QuizRealmColors.backgroundDeep,
                          ],
                        ),
                        image: art == null
                            ? null
                            : DecorationImage(image: art, fit: BoxFit.cover),
                      ),
                      alignment: Alignment.center,
                      child: art != null
                          ? null
                          : GameIcon(
                              symbol,
                              size: 46,
                              color: QuizRealmColors.goldBright,
                              glow: true,
                            ),
                    ),
                    if (badge != null)
                      Positioned(top: 4, right: 4, child: badge!),
                  ],
                ),
              ),
              const SizedBox(height: QuizRealmSpacing.sm),
              // Patru cartonașe pe lățimea unui telefon lasă ~85 dp fiecăruia,
              // iar „MULTIPLAYER" cu spațiere de titlu nu încape. Micșorăm
              // litera cât e nevoie, în loc s-o tăiem cu trei puncte: un mod de
              // joc trebuie să se poată citi întreg.
              FittedBox(
                fit: BoxFit.scaleDown,
                child: Text(
                  title.toUpperCase(),
                  textAlign: TextAlign.center,
                  maxLines: 1,
                  style: QuizRealmTypography.sectionTitle.copyWith(
                    fontSize: 12,
                    letterSpacing: 0.8,
                  ),
                ),
              ),
              const SizedBox(height: 2),
              Text(
                description,
                textAlign: TextAlign.center,
                maxLines: 2,
                overflow: TextOverflow.ellipsis,
                style: QuizRealmTypography.bodySecondary.copyWith(fontSize: 10),
              ),
            ],
          ),
        ),
      ),
    );
  }
}

/// Recompensa afișată lângă o misiune sau un obiectiv: iconiță plus cantitate.
class RewardBadge extends StatelessWidget {
  const RewardBadge({
    required this.asset,
    required this.amount,
    required this.semanticsLabel,
    super.key,
    this.size = 22,
  });

  final String asset;
  final String amount;
  final String semanticsLabel;
  final double size;

  @override
  Widget build(BuildContext context) {
    return Semantics(
      label: semanticsLabel,
      child: ExcludeSemantics(
        child: Row(
          mainAxisSize: MainAxisSize.min,
          children: [
            Image.asset(asset, width: size, height: size),
            const SizedBox(width: QuizRealmSpacing.xs),
            Text(
              amount,
              style: QuizRealmTypography.numeric.copyWith(fontSize: 14),
            ),
          ],
        ),
      ),
    );
  }
}

/// Rândul unei statistici din panoul „Regatul tău": iconiță, etichetă mică,
/// valoare mare.
class StatLine extends StatelessWidget {
  const StatLine({
    required this.symbol,
    required this.label,
    required this.value,
    super.key,
  });

  final GameSymbol symbol;
  final String label;
  final String value;

  @override
  Widget build(BuildContext context) {
    return Padding(
      padding: const EdgeInsets.only(bottom: QuizRealmSpacing.md),
      child: Row(
        crossAxisAlignment: CrossAxisAlignment.start,
        children: [
          GameIcon(symbol, size: 22, color: QuizRealmColors.goldBright),
          const SizedBox(width: QuizRealmSpacing.sm),
          Expanded(
            child: Column(
              crossAxisAlignment: CrossAxisAlignment.start,
              mainAxisSize: MainAxisSize.min,
              children: [
                Text(
                  label,
                  maxLines: 1,
                  overflow: TextOverflow.ellipsis,
                  style: QuizRealmTypography.bodySecondary,
                ),
                Text(
                  value,
                  maxLines: 1,
                  overflow: TextOverflow.ellipsis,
                  style: QuizRealmTypography.numeric.copyWith(fontSize: 17),
                ),
              ],
            ),
          ),
        ],
      ),
    );
  }
}
