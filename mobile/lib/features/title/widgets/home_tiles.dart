import 'package:flutter/material.dart';

import '../../../core/theme/app_theme.dart';
import '../../../core/ui/game_frame.dart';
import '../../../core/ui/game_icons.dart';

/// Acțiune secundară din ecranul principal.
///
/// Plăcile astea sunt mai mici decât cardul de campanie **intenționat**: dacă
/// totul are aceeași greutate vizuală, jucătorul nu află de unde să înceapă.
class HomeTile extends StatelessWidget {
  const HomeTile({
    required this.symbol,
    required this.label,
    required this.onTap,
    this.accent = GamePalette.gold,
    this.badge,
    this.subtitle,
    super.key,
  });

  final GameSymbol symbol;
  final String label;
  final String? subtitle;
  final Color accent;

  /// Pastilă de notificare (ex. cereri de prietenie neprocesate).
  final String? badge;
  final VoidCallback onTap;

  @override
  Widget build(BuildContext context) {
    return GameFrame(
      accent: accent,
      padding: EdgeInsets.zero,
      child: InkWell(
        onTap: onTap,
        borderRadius: BorderRadius.circular(12),
        child: Padding(
          padding: const EdgeInsets.symmetric(horizontal: 10, vertical: 12),
          child: Column(
            mainAxisSize: MainAxisSize.min,
            children: [
              Stack(
                clipBehavior: Clip.none,
                children: [
                  GameIcon(symbol, size: 28, color: accent),
                  if (badge != null)
                    Positioned(
                      right: -10,
                      top: -6,
                      child: Container(
                        padding: const EdgeInsets.symmetric(
                          horizontal: 5,
                          vertical: 1,
                        ),
                        decoration: BoxDecoration(
                          color: GamePalette.crimson,
                          borderRadius: BorderRadius.circular(9),
                        ),
                        child: Text(
                          badge!,
                          style: GameText.numeric.copyWith(
                            fontSize: 10,
                            color: GamePalette.cream,
                          ),
                        ),
                      ),
                    ),
                ],
              ),
              const SizedBox(height: 8),
              Text(
                label,
                textAlign: TextAlign.center,
                maxLines: 2,
                overflow: TextOverflow.ellipsis,
                style: GameText.button.copyWith(fontSize: 11),
              ),
              if (subtitle != null) ...[
                const SizedBox(height: 2),
                Text(
                  subtitle!,
                  textAlign: TextAlign.center,
                  maxLines: 1,
                  overflow: TextOverflow.ellipsis,
                  style: GameText.bodyDim.copyWith(fontSize: 9),
                ),
              ],
            ],
          ),
        ),
      ),
    );
  }
}
