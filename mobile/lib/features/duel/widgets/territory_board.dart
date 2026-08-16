import 'dart:math' as math;

import 'package:flutter/material.dart';

import '../../../core/design/quizrealm_tokens.dart';
import '../../../domain/duel/territory_map.dart';

/// Tabla de joc a modului Clasic: harta hexagonală cu teritoriile cucerite.
///
/// Cucerirea nu apare instant. `plan.md` §7 cere o tranziție — culoarea curge
/// în teritoriu, cu un halou scurt — pentru că schimbarea instantanee se pierde
/// exact în momentul în care jucătorul se uită la întrebare, nu la hartă.
class TerritoryBoard extends StatefulWidget {
  const TerritoryBoard({
    required this.map,
    required this.ownership,
    required this.myUserId,
    super.key,
    this.playerOrder = const [],
  });

  final TerritoryMap map;
  final TerritoryOwnership ownership;
  final String? myUserId;

  /// Ordinea jucătorilor, care le fixează culoarea. Trebuie să fie stabilă pe
  /// toată partida: altfel un jucător și-ar schimba culoarea între runde.
  final List<String> playerOrder;

  @override
  State<TerritoryBoard> createState() => _TerritoryBoardState();
}

class _TerritoryBoardState extends State<TerritoryBoard>
    with SingleTickerProviderStateMixin {
  late final AnimationController _controller = AnimationController(
    vsync: this,
    duration: const Duration(milliseconds: 650),
  );

  TerritoryOwnership _previous = TerritoryOwnership.empty;
  Set<String> _changed = {};

  @override
  void initState() {
    super.initState();
    _previous = widget.ownership;
  }

  @override
  void didUpdateWidget(TerritoryBoard old) {
    super.didUpdateWidget(old);
    if (identical(old.ownership, widget.ownership)) return;

    final changed = widget.ownership.changedSince(old.ownership);
    if (changed.isEmpty) return;

    // Se animează doar teritoriile schimbate; a reanima toată harta ar face
    // ecranul să pâlpâie la fiecare rundă.
    setState(() {
      _previous = old.ownership;
      _changed = changed.toSet();
    });
    _controller.forward(from: 0);
  }

  @override
  void dispose() {
    _controller.dispose();
    super.dispose();
  }

  @override
  Widget build(BuildContext context) {
    if (widget.map.isEmpty) return const SizedBox.shrink();

    return AspectRatio(
      aspectRatio: 1,
      child: AnimatedBuilder(
        animation: _controller,
        builder: (context, _) {
          return CustomPaint(
            painter: _BoardPainter(
              map: widget.map,
              ownership: widget.ownership,
              previous: _previous,
              changed: _changed,
              progress: _controller.value,
              colours: _colourAssignment(),
              myUserId: widget.myUserId,
            ),
          );
        },
      ),
    );
  }

  /// Culoarea fiecărui jucător. A mea e mereu albastrul electric, ca să-mi
  /// găsesc teritoriile dintr-o privire, indiferent de ordinea din lobby.
  Map<String, Color> _colourAssignment() {
    const palette = [
      QuizRealmColors.crimson,
      Color(0xFF1E6B45),
      Color(0xFF5B3FA8),
      Color(0xFFB87333),
      Color(0xFF0E7C7B),
      Color(0xFF8A2846),
      Color(0xFF6B6300),
    ];

    final order = widget.playerOrder.isNotEmpty
        ? widget.playerOrder
        : (widget.ownership.owners.values.whereType<String>().toSet().toList()
            ..sort());

    final colours = <String, Color>{};
    var index = 0;
    for (final userId in order) {
      if (userId == widget.myUserId) {
        colours[userId] = QuizRealmColors.royalBlue;
        continue;
      }
      colours[userId] = palette[index % palette.length];
      index++;
    }
    return colours;
  }
}

class _BoardPainter extends CustomPainter {
  const _BoardPainter({
    required this.map,
    required this.ownership,
    required this.previous,
    required this.changed,
    required this.progress,
    required this.colours,
    required this.myUserId,
  });

  final TerritoryMap map;
  final TerritoryOwnership ownership;
  final TerritoryOwnership previous;
  final Set<String> changed;
  final double progress;
  final Map<String, Color> colours;
  final String? myUserId;

  @override
  void paint(Canvas canvas, Size size) {
    // Raza se calculează din întinderea reală a hărții, nu dintr-o constantă:
    // o hartă de 8 jucători are aproape dublul celulelor uneia de 4 și ar ieși
    // din ecran cu o valoare fixă.
    var minQ = 0.0, maxQ = 0.0, minR = 0.0, maxR = 0.0;
    for (final territory in map.territories) {
      final centre = _centreFor(territory.coordinates, 1);
      minQ = math.min(minQ, centre.dx);
      maxQ = math.max(maxQ, centre.dx);
      minR = math.min(minR, centre.dy);
      maxR = math.max(maxR, centre.dy);
    }

    final spanX = (maxQ - minQ) + 2;
    final spanY = (maxR - minR) + 2;
    final radius = math.min(size.width / spanX, size.height / spanY);
    final offset = Offset(
      size.width / 2 - (minQ + maxQ) / 2 * radius,
      size.height / 2 - (minR + maxR) / 2 * radius,
    );

    for (final territory in map.territories) {
      final centre = _centreFor(territory.coordinates, radius) + offset;
      final path = _hexPath(centre, radius * 0.92);

      final isChanged = changed.contains(territory.id);
      final from = _colourOf(previous.ownerOf(territory.id));
      final to = _colourOf(ownership.ownerOf(territory.id));
      final fill = isChanged
          ? Color.lerp(from, to, Curves.easeOutCubic.transform(progress))!
          : to;

      canvas.drawPath(path, Paint()..color = fill);

      final isContested = territory.id == ownership.contestedTerritoryId;
      canvas.drawPath(
        path,
        Paint()
          ..style = PaintingStyle.stroke
          ..strokeWidth = isContested ? 2.5 : 1
          ..color = isContested
              ? QuizRealmColors.goldBright
              : QuizRealmColors.goldDeep,
      );

      // Haloul de cucerire se stinge pe măsură ce animația avansează.
      if (isChanged && progress < 1) {
        canvas.drawPath(
          path,
          Paint()
            ..style = PaintingStyle.stroke
            ..strokeWidth = 3
            ..color = QuizRealmColors.electricGlow.withValues(
              alpha: (1 - progress) * 0.9,
            )
            ..maskFilter = const MaskFilter.blur(BlurStyle.normal, 4),
        );
      }
    }
  }

  Color _colourOf(String? userId) {
    if (userId == null) return QuizRealmColors.surfaceRow;
    return colours[userId] ?? QuizRealmColors.surfaceRaised;
  }

  /// Centrul unei celule în coordonate axiale, pentru hexagoane „pointy-top".
  Offset _centreFor(HexCoordinates coordinates, double radius) {
    final x = radius * math.sqrt(3) * (coordinates.q + coordinates.r / 2);
    final y = radius * 1.5 * coordinates.r;
    return Offset(x, y);
  }

  Path _hexPath(Offset centre, double radius) {
    final path = Path();
    for (var i = 0; i < 6; i++) {
      final angle = math.pi / 180 * (60 * i - 30);
      final point = Offset(
        centre.dx + radius * math.cos(angle),
        centre.dy + radius * math.sin(angle),
      );
      if (i == 0) {
        path.moveTo(point.dx, point.dy);
      } else {
        path.lineTo(point.dx, point.dy);
      }
    }
    return path..close();
  }

  @override
  bool shouldRepaint(_BoardPainter old) =>
      old.progress != progress ||
      old.ownership != ownership ||
      old.map != map;
}
