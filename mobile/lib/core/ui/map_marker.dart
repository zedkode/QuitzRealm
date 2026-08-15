import 'package:flutter/material.dart';

import '../theme/app_theme.dart';

/// Markerele ilustrate de pe hartă (`assets/game/map/markers/`).
enum MapMarkerKind {
  locked('marker-locked-region'),
  completed('marker-completed-region'),
  current('marker-current-location'),
  quest('marker-quest'),
  boss('marker-boss-quiz'),
  arena('marker-pvp-arena'),
  shop('marker-shop'),
  treasure('marker-treasure'),
  event('marker-event'),
  mystery('marker-mystery-location');

  const MapMarkerKind(this.fileName);

  final String fileName;

  String get asset => 'assets/game/map/markers/$fileName.png';
}

/// Markerul ilustrat, cu vârful ancorat pe reperul de pe hartă.
///
/// Toate markerele sunt pătrate, cu vârful desenat aproape de baza imaginii;
/// [tipOffset] spune unde cade acel vârf, ca un nod să poată fi așezat pe
/// coordonata lui reală, nu pe centrul dreptunghiului.
class MapMarker extends StatefulWidget {
  const MapMarker({
    required this.kind,
    required this.size,
    super.key,
    this.pulsing = false,
    this.dimmed = false,
  });

  final MapMarkerKind kind;
  final double size;

  /// Ținutul următor de jucat pulsează, ca ochiul să-l găsească imediat.
  final bool pulsing;

  /// Ținuturile blocate se sting, ca să nu concureze vizual cu cele deschise.
  final bool dimmed;

  /// Fracțiunea din înălțime la care se află vârful markerului.
  static const tipOffset = 0.93;

  @override
  State<MapMarker> createState() => _MapMarkerState();
}

class _MapMarkerState extends State<MapMarker>
    with SingleTickerProviderStateMixin {
  late final AnimationController _controller = AnimationController(
    vsync: this,
    duration: const Duration(milliseconds: 1600),
  );

  @override
  void initState() {
    super.initState();
    if (widget.pulsing) _controller.repeat(reverse: true);
  }

  @override
  void didUpdateWidget(covariant MapMarker oldWidget) {
    super.didUpdateWidget(oldWidget);
    if (widget.pulsing && !_controller.isAnimating) {
      _controller.repeat(reverse: true);
    } else if (!widget.pulsing && _controller.isAnimating) {
      _controller
        ..stop()
        ..value = 0;
    }
  }

  @override
  void dispose() {
    _controller.dispose();
    super.dispose();
  }

  @override
  Widget build(BuildContext context) {
    final image = Image.asset(
      widget.kind.asset,
      width: widget.size,
      height: widget.size,
      fit: BoxFit.contain,
      filterQuality: FilterQuality.medium,
      excludeFromSemantics: true,
    );

    // Desaturare parțială, nu totală: ținutul blocat trebuie să se retragă în
    // fundal, dar să rămână recognoscibil ca aceeași familie de insigne.
    final marker = widget.dimmed
        ? ColorFiltered(
            colorFilter: const ColorFilter.matrix(<double>[
              0.49, 0.35, 0.07, 0, 0, //
              0.20, 0.65, 0.07, 0, 0, //
              0.20, 0.35, 0.37, 0, 0, //
              0, 0, 0, 1, 0,
            ]),
            child: Opacity(opacity: 0.85, child: image),
          )
        : image;

    if (!widget.pulsing) return marker;

    return AnimatedBuilder(
      animation: _controller,
      builder: (context, child) {
        return Transform.scale(
          scale: 1 + 0.07 * _controller.value,
          child: DecoratedBox(
            decoration: BoxDecoration(
              shape: BoxShape.circle,
              boxShadow: [
                BoxShadow(
                  color: GamePalette.goldBright.withValues(
                    alpha: 0.25 + 0.3 * _controller.value,
                  ),
                  blurRadius: 16 + 12 * _controller.value,
                ),
              ],
            ),
            child: child,
          ),
        );
      },
      child: marker,
    );
  }
}
