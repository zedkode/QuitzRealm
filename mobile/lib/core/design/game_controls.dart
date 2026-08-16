import 'package:flutter/material.dart';

import '../ui/game_icons.dart';
import 'quizrealm_tokens.dart';

/// Comutatorul: pistă albastră cu ramă aurie, bilă cu halou când e pornit.
///
/// Nu folosim `Switch`-ul Material: forma lui (pistă subțire, bilă mică) e
/// vizibil altceva decât cea din capturi, iar tema n-o poate schimba destul.
class GameToggle extends StatelessWidget {
  const GameToggle({
    required this.value,
    required this.onChanged,
    super.key,
    this.semanticsLabel,
  });

  final bool value;
  final ValueChanged<bool>? onChanged;
  final String? semanticsLabel;

  static const _width = 56.0;
  static const _height = 30.0;

  @override
  Widget build(BuildContext context) {
    final enabled = onChanged != null;

    return Semantics(
      toggled: value,
      enabled: enabled,
      label: semanticsLabel,
      child: ExcludeSemantics(
        child: Opacity(
          opacity: enabled ? 1 : 0.5,
          child: GestureDetector(
            onTap: enabled ? () => onChanged!(!value) : null,
            behavior: HitTestBehavior.opaque,
            child: Padding(
              // Ținta de atingere rămâne peste 44 dp, deși pista are 30.
              padding: const EdgeInsets.symmetric(vertical: 8),
              child: AnimatedContainer(
                duration: QuizRealmDurations.state,
                curve: Curves.easeOut,
                width: _width,
                height: _height,
                decoration: BoxDecoration(
                  borderRadius: BorderRadius.circular(QuizRealmRadius.pill),
                  border: Border.all(
                    color: value
                        ? QuizRealmColors.gold
                        : QuizRealmColors.goldDeep,
                    width: QuizRealmBorders.frame,
                  ),
                  gradient: value
                      ? const LinearGradient(
                          colors: [
                            QuizRealmColors.royalBlueDeep,
                            QuizRealmColors.royalBlue,
                          ],
                        )
                      : null,
                  color: value ? null : QuizRealmColors.backgroundDeep,
                ),
                child: AnimatedAlign(
                  duration: QuizRealmDurations.state,
                  curve: Curves.easeOut,
                  alignment: value
                      ? Alignment.centerRight
                      : Alignment.centerLeft,
                  child: Container(
                    width: _height - 8,
                    height: _height - 8,
                    margin: const EdgeInsets.symmetric(horizontal: 3),
                    decoration: BoxDecoration(
                      shape: BoxShape.circle,
                      color: value
                          ? QuizRealmColors.electricGlow
                          : QuizRealmColors.textMuted,
                      boxShadow: value ? QuizRealmShadows.electricGlow : null,
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

/// Cursorul de volum: pistă subțire, umplere albastră, mâner în formă de romb.
class GameSlider extends StatelessWidget {
  const GameSlider({
    required this.value,
    required this.onChanged,
    super.key,
    this.semanticsLabel,
  });

  /// Fracție între 0 și 1.
  final double value;
  final ValueChanged<double>? onChanged;
  final String? semanticsLabel;

  @override
  Widget build(BuildContext context) {
    return Semantics(
      slider: true,
      label: semanticsLabel,
      value: '${(value * 100).round()}%',
      child: ExcludeSemantics(
        child: SliderTheme(
          data: SliderThemeData(
            trackHeight: 8,
            activeTrackColor: QuizRealmColors.electric,
            inactiveTrackColor: QuizRealmColors.backgroundDeep,
            thumbShape: const _DiamondThumb(),
            overlayShape: const RoundSliderOverlayShape(overlayRadius: 18),
            overlayColor: QuizRealmColors.electric.withValues(alpha: 0.18),
            trackShape: const RoundedRectSliderTrackShape(),
          ),
          child: Slider(value: value.clamp(0.0, 1.0), onChanged: onChanged),
        ),
      ),
    );
  }
}

/// Mânerul în formă de romb, cu contur auriu — forma din capturi.
class _DiamondThumb extends SliderComponentShape {
  const _DiamondThumb();

  static const _radius = 10.0;

  @override
  Size getPreferredSize(bool isEnabled, bool isDiscrete) =>
      const Size.fromRadius(_radius);

  @override
  void paint(
    PaintingContext context,
    Offset center, {
    required Animation<double> activationAnimation,
    required Animation<double> enableAnimation,
    required bool isDiscrete,
    required TextPainter labelPainter,
    required RenderBox parentBox,
    required SliderThemeData sliderTheme,
    required TextDirection textDirection,
    required double value,
    required double textScaleFactor,
    required Size sizeWithOverflow,
  }) {
    final canvas = context.canvas;
    final path = Path()
      ..moveTo(center.dx, center.dy - _radius)
      ..lineTo(center.dx + _radius, center.dy)
      ..lineTo(center.dx, center.dy + _radius)
      ..lineTo(center.dx - _radius, center.dy)
      ..close();

    canvas
      ..drawPath(path, Paint()..color = QuizRealmColors.electricGlow)
      ..drawPath(
        path,
        Paint()
          ..style = PaintingStyle.stroke
          ..strokeWidth = 2
          ..color = QuizRealmColors.gold,
      );
  }
}

/// Grupul de opțiuni exclusive, ca „Întunecată / Luminoasă".
class GameTabBar<T> extends StatelessWidget {
  const GameTabBar({
    required this.options,
    required this.selected,
    required this.onSelect,
    super.key,
  });

  final List<GameTabOption<T>> options;
  final T selected;
  final ValueChanged<T> onSelect;

  @override
  Widget build(BuildContext context) {
    return Row(
      mainAxisSize: MainAxisSize.min,
      children: [
        for (final option in options) ...[
          _Tab(
            option: option,
            selected: option.value == selected,
            onTap: () => onSelect(option.value),
          ),
          if (option != options.last) const SizedBox(width: QuizRealmSpacing.sm),
        ],
      ],
    );
  }
}

class GameTabOption<T> {
  const GameTabOption({required this.value, required this.label, this.symbol});

  final T value;
  final String label;
  final GameSymbol? symbol;
}

class _Tab<T> extends StatelessWidget {
  const _Tab({
    required this.option,
    required this.selected,
    required this.onTap,
  });

  final GameTabOption<T> option;
  final bool selected;
  final VoidCallback onTap;

  @override
  Widget build(BuildContext context) {
    final color = selected
        ? QuizRealmColors.electricGlow
        : QuizRealmColors.textSecondary;

    return Semantics(
      button: true,
      selected: selected,
      label: option.label,
      child: ExcludeSemantics(
        child: Material(
          color: Colors.transparent,
          child: InkWell(
            onTap: onTap,
            borderRadius: BorderRadius.circular(QuizRealmRadius.md),
            child: AnimatedContainer(
              duration: QuizRealmDurations.state,
              padding: const EdgeInsets.symmetric(
                horizontal: QuizRealmSpacing.md,
                vertical: QuizRealmSpacing.sm,
              ),
              constraints: const BoxConstraints(minHeight: 40),
              decoration: BoxDecoration(
                color: selected
                    ? QuizRealmColors.surfaceSelected
                    : Colors.transparent,
                borderRadius: BorderRadius.circular(QuizRealmRadius.md),
                border: Border.all(
                  color: selected
                      ? QuizRealmColors.gold
                      : QuizRealmColors.goldDeep,
                  width: selected
                      ? QuizRealmBorders.frame
                      : QuizRealmBorders.hairline,
                ),
              ),
              child: Row(
                mainAxisSize: MainAxisSize.min,
                children: [
                  if (option.symbol != null) ...[
                    GameIcon(option.symbol!, size: 16, color: color),
                    const SizedBox(width: QuizRealmSpacing.xs),
                  ],
                  Text(
                    option.label,
                    maxLines: 1,
                    overflow: TextOverflow.ellipsis,
                    style: QuizRealmTypography.body.copyWith(color: color),
                  ),
                ],
              ),
            ),
          ),
        ),
      ),
    );
  }
}

/// Câmpul de căutare din listele de chat și clasament.
class GameSearchField extends StatelessWidget {
  const GameSearchField({
    required this.hint,
    required this.onChanged,
    super.key,
    this.controller,
  });

  final String hint;
  final ValueChanged<String> onChanged;
  final TextEditingController? controller;

  @override
  Widget build(BuildContext context) {
    return Container(
      decoration: BoxDecoration(
        color: QuizRealmColors.backgroundDeep,
        borderRadius: BorderRadius.circular(QuizRealmRadius.md),
        border: Border.all(color: QuizRealmColors.goldDeep),
      ),
      child: TextField(
        controller: controller,
        onChanged: onChanged,
        style: QuizRealmTypography.body,
        cursorColor: QuizRealmColors.goldBright,
        decoration: InputDecoration(
          hintText: hint,
          hintStyle: QuizRealmTypography.bodySecondary,
          border: InputBorder.none,
          isDense: true,
          contentPadding: const EdgeInsets.symmetric(
            horizontal: QuizRealmSpacing.md,
            vertical: QuizRealmSpacing.md,
          ),
          prefixIcon: const Padding(
            padding: EdgeInsets.only(left: QuizRealmSpacing.md, right: 6),
            child: GameIcon(
              GameSymbol.compass,
              size: 18,
              color: QuizRealmColors.gold,
            ),
          ),
          prefixIconConstraints: const BoxConstraints(minWidth: 0),
        ),
      ),
    );
  }
}

/// Rândul standard dintr-un panou de setări: iconiță, etichetă, descriere
/// opțională și controlul din dreapta.
class SettingsRow extends StatelessWidget {
  const SettingsRow({
    required this.label,
    required this.symbol,
    super.key,
    this.description,
    this.trailing,
    this.onTap,
  });

  final String label;
  final GameSymbol symbol;
  final String? description;
  final Widget? trailing;
  final VoidCallback? onTap;

  @override
  Widget build(BuildContext context) {
    final content = Padding(
      padding: const EdgeInsets.symmetric(
        horizontal: QuizRealmSpacing.md,
        vertical: QuizRealmSpacing.sm,
      ),
      child: Row(
        children: [
          GameIcon(symbol, size: 22, color: QuizRealmColors.goldBright),
          const SizedBox(width: QuizRealmSpacing.md),
          Expanded(
            child: Column(
              crossAxisAlignment: CrossAxisAlignment.start,
              mainAxisSize: MainAxisSize.min,
              children: [
                Text(
                  label,
                  style: QuizRealmTypography.body.copyWith(fontSize: 15),
                ),
                if (description != null)
                  Text(description!, style: QuizRealmTypography.bodySecondary),
              ],
            ),
          ),
          if (trailing != null) ...[
            const SizedBox(width: QuizRealmSpacing.sm),
            trailing!,
          ],
        ],
      ),
    );

    return DecoratedBox(
      decoration: const BoxDecoration(
        border: Border(
          bottom: BorderSide(color: QuizRealmColors.surfaceRaised),
        ),
      ),
      child: onTap == null
          ? content
          : Material(
              color: Colors.transparent,
              child: InkWell(onTap: onTap, child: content),
            ),
    );
  }
}
