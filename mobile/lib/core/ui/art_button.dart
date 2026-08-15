import 'package:flutter/material.dart';
import 'package:flutter/services.dart';

import 'game_button.dart';
import 'game_icons.dart';

/// Plăcile ilustrate de meniu din `assets/game/Buttons/<limbă>/`.
enum ArtButtonArt {
  startCampaign('incepe_campania'),
  continueCampaign('continua_campania'),
  duelOnline('duel_online'),
  leaderboard('clasament'),
  playerAccount('cont_jucator'),
  howToPlay('cum_se_joaca'),
  dailyRewards('recompense_zilnice'),
  shop('magazin'),
  settings('setari'),
  exit('iesire');

  const ArtButtonArt(this.fileName);

  final String fileName;

  String assetFor(String languageCode) =>
      'assets/game/Buttons/$languageCode/$fileName.png';
}

/// Buton de meniu desenat ca imagine, cu textul deja pictat în artă.
///
/// Textul fiind parte din ilustrație, arta există per limbă. Pentru limbile
/// fără set de plăci, butonul revine la [GameButton], care își ia eticheta din
/// i18n — așa nimeni nu vede română într-o interfață engleză, iar adăugarea
/// unei limbi noi înseamnă doar plăcile plus o intrare în [_illustratedLocales].
class ArtButton extends StatefulWidget {
  const ArtButton({
    required this.art,
    required this.label,
    required this.onPressed,
    super.key,
    this.maxHeight = 92,
    this.fallbackIcon,
    this.fallbackTone = GameButtonTone.gold,
  });

  final ArtButtonArt art;

  /// Eticheta din i18n: citită de cititoarele de ecran și folosită dacă limba
  /// curentă nu are plăci ilustrate.
  final String label;
  final VoidCallback? onPressed;
  final double maxHeight;
  final GameSymbol? fallbackIcon;
  final GameButtonTone fallbackTone;

  /// Raportul plăcilor livrate (2172×724).
  static const artAspectRatio = 3.0;

  static const _illustratedLocales = {'ro'};

  static bool hasArtFor(Locale locale) =>
      _illustratedLocales.contains(locale.languageCode);

  @override
  State<ArtButton> createState() => _ArtButtonState();
}

class _ArtButtonState extends State<ArtButton> {
  bool _pressed = false;

  void _setPressed(bool value) {
    if (_pressed != value && mounted) setState(() => _pressed = value);
  }

  @override
  Widget build(BuildContext context) {
    final locale = Localizations.localeOf(context);
    if (!ArtButton.hasArtFor(locale)) {
      return GameButton(
        label: widget.label,
        icon: widget.fallbackIcon,
        tone: widget.fallbackTone,
        height: widget.maxHeight.clamp(44.0, 60.0),
        onPressed: widget.onPressed,
      );
    }

    final enabled = widget.onPressed != null;
    return Semantics(
      button: true,
      enabled: enabled,
      label: widget.label,
      child: ExcludeSemantics(
        child: GestureDetector(
          behavior: HitTestBehavior.opaque,
          onTapDown: enabled ? (_) => _setPressed(true) : null,
          onTapUp: enabled ? (_) => _setPressed(false) : null,
          onTapCancel: enabled ? () => _setPressed(false) : null,
          onTap: enabled
              ? () {
                  HapticFeedback.selectionClick();
                  widget.onPressed!();
                }
              : null,
          child: AnimatedScale(
            scale: _pressed ? 0.965 : 1,
            duration: const Duration(milliseconds: 90),
            child: Opacity(
              opacity: enabled ? 1 : 0.45,
              child: Center(
                child: ConstrainedBox(
                  constraints: BoxConstraints(maxHeight: widget.maxHeight),
                  child: AspectRatio(
                    aspectRatio: ArtButton.artAspectRatio,
                    child: Image.asset(
                      widget.art.assetFor(locale.languageCode),
                      fit: BoxFit.contain,
                      filterQuality: FilterQuality.medium,
                      excludeFromSemantics: true,
                    ),
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
