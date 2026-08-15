import 'package:flutter/material.dart';
import 'package:flutter/services.dart';

import '../theme/app_theme.dart';
import 'game_icons.dart';

enum GameButtonTone { gold, stone, arcane, danger, emerald }

/// Buton „gros”, cu relief și cursă de apăsare — se comportă ca un buton de
/// joc, nu ca un buton de aplicație.
class GameButton extends StatefulWidget {
  const GameButton({
    required this.label,
    required this.onPressed,
    super.key,
    this.icon,
    this.tone = GameButtonTone.gold,
    this.expand = true,
    this.height = 56,
    this.compact = false,
  }) : assert(height > 0);

  final String label;
  final VoidCallback? onPressed;
  final GameSymbol? icon;
  final GameButtonTone tone;
  final bool expand;
  final double height;
  final bool compact;

  @override
  State<GameButton> createState() => _GameButtonState();
}

class _GameButtonState extends State<GameButton> {
  bool _down = false;

  static const _depth = 5.0;

  @override
  Widget build(BuildContext context) {
    final enabled = widget.onPressed != null;
    final colors = _ToneColors.of(widget.tone);
    final pressed = _down && enabled;

    final button = Semantics(
      button: true,
      enabled: enabled,
      label: widget.label,
      child: ExcludeSemantics(
        child: GestureDetector(
          behavior: HitTestBehavior.opaque,
          onTapDown: enabled ? (_) => setState(() => _down = true) : null,
          onTapUp: enabled ? (_) => setState(() => _down = false) : null,
          onTapCancel: enabled ? () => setState(() => _down = false) : null,
          onTap: enabled
              ? () {
                  HapticFeedback.selectionClick();
                  widget.onPressed!();
                }
              : null,
          child: Stack(
            children: [
              // Fundul butonului — rămâne pe loc și dă senzația de adâncime.
              Positioned(
                left: 0,
                right: 0,
                bottom: 0,
                top: _depth,
                child: DecoratedBox(
                  decoration: BoxDecoration(
                    color: enabled
                        ? colors.base
                        : colors.base.withValues(alpha: 0.4),
                    borderRadius: BorderRadius.circular(14),
                  ),
                ),
              ),
              // Fața butonului nu e poziționată: ea dă dimensiunea stivei.
              AnimatedPadding(
                duration: const Duration(milliseconds: 70),
                curve: Curves.easeOut,
                padding: EdgeInsets.only(
                  top: pressed ? _depth : 0,
                  bottom: pressed ? 0 : _depth,
                ),
                child: SizedBox(
                  height: widget.height,
                  child: _ButtonFace(
                    label: widget.label,
                    icon: widget.icon,
                    colors: colors,
                    enabled: enabled,
                    compact: widget.compact,
                  ),
                ),
              ),
            ],
          ),
        ),
      ),
    );

    return widget.expand
        ? SizedBox(width: double.infinity, child: button)
        : button;
  }
}

class _ButtonFace extends StatelessWidget {
  const _ButtonFace({
    required this.label,
    required this.icon,
    required this.colors,
    required this.enabled,
    required this.compact,
  });

  final String label;
  final GameSymbol? icon;
  final _ToneColors colors;
  final bool enabled;
  final bool compact;

  @override
  Widget build(BuildContext context) {
    final opacity = enabled ? 1.0 : 0.5;
    return Opacity(
      opacity: opacity,
      child: Container(
        decoration: BoxDecoration(
          borderRadius: BorderRadius.circular(14),
          gradient: LinearGradient(
            begin: Alignment.topCenter,
            end: Alignment.bottomCenter,
            colors: [colors.light, colors.mid, colors.base],
            stops: const [0, 0.5, 1],
          ),
          border: Border.all(color: colors.edge, width: 1.6),
          boxShadow: enabled
              ? [
                  BoxShadow(
                    color: colors.mid.withValues(alpha: 0.34),
                    blurRadius: 16,
                    offset: const Offset(0, 4),
                  ),
                ]
              : null,
        ),
        child: Stack(
          children: [
            // Luciu în partea superioară.
            Positioned(
              left: 6,
              right: 6,
              top: 3,
              height: 10,
              child: DecoratedBox(
                decoration: BoxDecoration(
                  borderRadius: BorderRadius.circular(9),
                  gradient: LinearGradient(
                    begin: Alignment.topCenter,
                    end: Alignment.bottomCenter,
                    colors: [
                      Colors.white.withValues(alpha: 0.32),
                      Colors.white.withValues(alpha: 0),
                    ],
                  ),
                ),
              ),
            ),
            Center(
              child: Padding(
                padding: EdgeInsets.symmetric(horizontal: compact ? 14 : 20),
                child: Row(
                  mainAxisSize: MainAxisSize.min,
                  children: [
                    if (icon != null) ...[
                      GameIcon(
                        icon!,
                        size: compact ? 18 : 22,
                        color: colors.content,
                        shadeColor: colors.content.withValues(alpha: 0.72),
                      ),
                      const SizedBox(width: 9),
                    ],
                    Flexible(
                      child: Text(
                        label,
                        maxLines: 1,
                        overflow: TextOverflow.ellipsis,
                        textAlign: TextAlign.center,
                        style: GameText.button.copyWith(
                          color: colors.content,
                          fontSize: compact ? 13 : 15,
                          shadows: [
                            Shadow(
                              color: colors.textShadow,
                              offset: const Offset(0, 1),
                            ),
                          ],
                        ),
                      ),
                    ),
                  ],
                ),
              ),
            ),
          ],
        ),
      ),
    );
  }
}

class _ToneColors {
  const _ToneColors({
    required this.light,
    required this.mid,
    required this.base,
    required this.edge,
    required this.content,
    required this.textShadow,
  });

  final Color light;
  final Color mid;
  final Color base;
  final Color edge;
  final Color content;
  final Color textShadow;

  static _ToneColors of(GameButtonTone tone) {
    return switch (tone) {
      GameButtonTone.gold => const _ToneColors(
        light: GamePalette.goldBright,
        mid: GamePalette.gold,
        base: GamePalette.goldDeep,
        edge: Color(0xFFFFE9B8),
        content: Color(0xFF3B2708),
        textShadow: Color(0x66FFF3D0),
      ),
      GameButtonTone.stone => const _ToneColors(
        light: GamePalette.stone600,
        mid: GamePalette.stone700,
        base: GamePalette.stone900,
        edge: Color(0x99F0B542),
        content: GamePalette.cream,
        textShadow: Color(0xAA000000),
      ),
      GameButtonTone.arcane => const _ToneColors(
        light: Color(0xFF8BDBFF),
        mid: GamePalette.arcane,
        base: GamePalette.arcaneDeep,
        edge: Color(0xFFB9ECFF),
        content: Color(0xFF06263A),
        textShadow: Color(0x55FFFFFF),
      ),
      GameButtonTone.danger => const _ToneColors(
        light: Color(0xFFFF8A7F),
        mid: GamePalette.crimson,
        base: GamePalette.crimsonDeep,
        edge: Color(0xFFFFB3AA),
        content: Color(0xFF3A0C08),
        textShadow: Color(0x55FFFFFF),
      ),
      GameButtonTone.emerald => const _ToneColors(
        light: Color(0xFF7BE7B7),
        mid: GamePalette.emerald,
        base: GamePalette.emeraldDeep,
        edge: Color(0xFFA9F2D2),
        content: Color(0xFF06301F),
        textShadow: Color(0x55FFFFFF),
      ),
    };
  }
}

/// Buton rotund, pentru acțiuni secundare (înapoi, setări, sunet).
class GameIconButton extends StatelessWidget {
  const GameIconButton({
    required this.symbol,
    required this.onPressed,
    required this.tooltip,
    super.key,
    this.size = 44,
    this.color = GamePalette.goldBright,
  });

  final GameSymbol symbol;
  final VoidCallback? onPressed;
  final String tooltip;
  final double size;
  final Color color;

  @override
  Widget build(BuildContext context) {
    return Semantics(
      button: true,
      label: tooltip,
      child: ExcludeSemantics(
        child: Material(
          color: Colors.transparent,
          child: InkWell(
            onTap: onPressed,
            customBorder: const CircleBorder(),
            child: Container(
              width: size,
              height: size,
              decoration: BoxDecoration(
                shape: BoxShape.circle,
                gradient: const LinearGradient(
                  begin: Alignment.topCenter,
                  end: Alignment.bottomCenter,
                  colors: [GamePalette.stone700, GamePalette.stone900],
                ),
                border: Border.all(
                  color: GamePalette.gold.withValues(alpha: 0.55),
                  width: 1.4,
                ),
              ),
              child: Center(
                child: GameIcon(symbol, size: size * 0.5, color: color),
              ),
            ),
          ),
        ),
      ),
    );
  }
}
