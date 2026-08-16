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
    this.attackable = const [],
    this.selectedTargetId,
    this.onSelectTarget,
  });

  final TerritoryMap map;
  final TerritoryOwnership ownership;
  final String? myUserId;

  /// Ordinea jucătorilor, care le fixează culoarea. Trebuie să fie stabilă pe
  /// toată partida: altfel un jucător și-ar schimba culoarea între runde.
  final List<String> playerOrder;

  /// Teritoriile pe care le pot ataca acum; restul nu răspund la atingere.
  final List<String> attackable;
  final String? selectedTargetId;
  final ValueChanged<String>? onSelectTarget;

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
      child: LayoutBuilder(
        builder: (context, constraints) {
          final size = Size(constraints.maxWidth, constraints.maxHeight);
          final layout = _BoardLayout(widget.map, size);

          return GestureDetector(
            onTapUp: widget.onSelectTarget == null
                ? null
                : (details) {
                    final id = layout.territoryAt(details.localPosition);
                    // Doar țintele legale răspund la atingere; altfel jucătorul
                    // ar crede că a declarat un atac care n-a plecat nicăieri.
                    if (id != null && widget.attackable.contains(id)) {
                      widget.onSelectTarget!(id);
                    }
                  },
            child: AnimatedBuilder(
              animation: _controller,
              builder: (context, _) {
                return CustomPaint(
                  size: size,
                  painter: _BoardPainter(
                    map: widget.map,
                    ownership: widget.ownership,
                    previous: _previous,
                    changed: _changed,
                    progress: _controller.value,
                    colours: _colourAssignment(),
                    myUserId: widget.myUserId,
                    layout: layout,
                    attackable: widget.attackable.toSet(),
                    selectedTargetId: widget.selectedTargetId,
                  ),
                );
              },
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

/// Geometria hărții: unde cade fiecare hexagon pe pânză.
///
/// Desenul și atingerea folosesc **aceeași** instanță. Dacă fiecare și-ar
/// calcula centrele separat, o modificare la unul ar muta tăcut zonele
/// sensibile ale celuilalt, iar atingerile ar nimeri alt teritoriu decât cel
/// văzut.
class _BoardLayout {
  _BoardLayout(this.map, Size size) {
    var minX = 0.0, maxX = 0.0, minY = 0.0, maxY = 0.0;
    for (final territory in map.territories) {
      final centre = _rawCentre(territory.coordinates, 1);
      minX = math.min(minX, centre.dx);
      maxX = math.max(maxX, centre.dx);
      minY = math.min(minY, centre.dy);
      maxY = math.max(maxY, centre.dy);
    }

    // Raza vine din întinderea reală a hărții: una de 8 jucători are aproape
    // dublul celulelor uneia de 4 și ar ieși din ecran cu o valoare fixă.
    radius = math.min(size.width / ((maxX - minX) + 2), size.height / ((maxY - minY) + 2));
    _offset = Offset(
      size.width / 2 - (minX + maxX) / 2 * radius,
      size.height / 2 - (minY + maxY) / 2 * radius,
    );

    for (final territory in map.territories) {
      centres[territory.id] = _rawCentre(territory.coordinates, radius) + _offset;
    }
  }

  final TerritoryMap map;
  late final double radius;
  late final Offset _offset;
  final Map<String, Offset> centres = {};

  static Offset _rawCentre(HexCoordinates coordinates, double radius) {
    return Offset(
      radius * math.sqrt(3) * (coordinates.q + coordinates.r / 2),
      radius * 1.5 * coordinates.r,
    );
  }

  Path hexPath(String territoryId) {
    final centre = centres[territoryId]!;
    final path = Path();
    for (var i = 0; i < 6; i++) {
      final angle = math.pi / 180 * (60 * i - 30);
      final point = Offset(
        centre.dx + radius * 0.92 * math.cos(angle),
        centre.dy + radius * 0.92 * math.sin(angle),
      );
      if (i == 0) {
        path.moveTo(point.dx, point.dy);
      } else {
        path.lineTo(point.dx, point.dy);
      }
    }
    return path..close();
  }

  /// Teritoriul atins. Se ia cel mai apropiat centru aflat în raza celulei —
  /// mai iertător decât un test exact de poligon, ceea ce contează pe un ecran
  /// unde degetul acoperă mai mult decât un hexagon.
  String? territoryAt(Offset position) {
    String? best;
    var bestDistance = double.infinity;
    for (final entry in centres.entries) {
      final distance = (entry.value - position).distance;
      if (distance < bestDistance) {
        bestDistance = distance;
        best = entry.key;
      }
    }
    return bestDistance <= radius ? best : null;
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
    required this.layout,
    required this.attackable,
    required this.selectedTargetId,
  });

  final TerritoryMap map;
  final TerritoryOwnership ownership;
  final TerritoryOwnership previous;
  final Set<String> changed;
  final double progress;
  final Map<String, Color> colours;
  final String? myUserId;
  final _BoardLayout layout;
  final Set<String> attackable;
  final String? selectedTargetId;

  @override
  void paint(Canvas canvas, Size size) {
    for (final territory in map.territories) {
      final path = layout.hexPath(territory.id);

      final isChanged = changed.contains(territory.id);
      final from = _colourOf(previous.ownerOf(territory.id));
      final to = _colourOf(ownership.ownerOf(territory.id));
      final fill = isChanged
          ? Color.lerp(from, to, Curves.easeOutCubic.transform(progress))!
          : to;

      canvas.drawPath(path, Paint()..color = fill);

      final isContested = territory.id == ownership.contestedTerritoryId;
      final isTarget = territory.id == selectedTargetId;
      final isAttackable = attackable.contains(territory.id);

      canvas.drawPath(
        path,
        Paint()
          ..style = PaintingStyle.stroke
          ..strokeWidth = isTarget || isContested ? 2.5 : 1
          ..color = isTarget
              ? QuizRealmColors.crimson
              : isContested
              ? QuizRealmColors.goldBright
              : isAttackable
              ? QuizRealmColors.electric
              : QuizRealmColors.goldDeep,
      );

      // Ținta aleasă primește un semn în mijloc: conturul singur se pierde
      // printre celelalte hexagoane colorate.
      if (isTarget) {
        canvas.drawCircle(
          layout.centres[territory.id]!,
          layout.radius * 0.28,
          Paint()..color = QuizRealmColors.crimson.withValues(alpha: 0.85),
        );
      }

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

  @override
  bool shouldRepaint(_BoardPainter old) =>
      old.progress != progress ||
      old.ownership != ownership ||
      old.selectedTargetId != selectedTargetId ||
      old.attackable != attackable ||
      old.map != map;
}
