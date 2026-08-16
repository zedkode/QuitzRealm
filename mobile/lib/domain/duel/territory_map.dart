/// Harta de teritorii a unei partide Clasic.
///
/// Modelele sunt doar de citire: harta vine **de la server** și clientul n-o
/// recalculează niciodată. Dacă ar genera-o singur, doi jucători ar putea ajunge
/// cu hărți diferite ale aceleiași partide.
library;

/// Coordonate axiale pe grilă hexagonală, exact ca pe server.
final class HexCoordinates {
  const HexCoordinates(this.q, this.r);

  final int q;
  final int r;

  @override
  bool operator ==(Object other) =>
      other is HexCoordinates && other.q == q && other.r == r;

  @override
  int get hashCode => Object.hash(q, r);

  static HexCoordinates fromJson(Map<String, Object?> json) {
    int asInt(Object? value) => value is num ? value.round() : 0;
    return HexCoordinates(asInt(json['q']), asInt(json['r']));
  }
}

final class Territory {
  const Territory({
    required this.id,
    required this.coordinates,
    required this.neighbourIds,
  });

  final String id;
  final HexCoordinates coordinates;
  final List<String> neighbourIds;

  static Territory fromJson(Map<String, Object?> json) {
    final rawCoordinates = json['coordinates'];
    final rawNeighbours = json['neighbourIds'];
    return Territory(
      id: json['id']?.toString() ?? '',
      coordinates: rawCoordinates is Map<String, Object?>
          ? HexCoordinates.fromJson(rawCoordinates)
          : const HexCoordinates(0, 0),
      neighbourIds: rawNeighbours is List
          ? rawNeighbours.map((id) => id.toString()).toList(growable: false)
          : const [],
    );
  }
}

final class TerritoryMap {
  const TerritoryMap({
    required this.playerCount,
    required this.territories,
    this.bases = const {},
  });

  final int playerCount;
  final List<Territory> territories;

  /// Teritoriile de start ale fiecărui jucător.
  final Map<String, List<String>> bases;

  static const empty = TerritoryMap(playerCount: 0, territories: []);

  bool get isEmpty => territories.isEmpty;

  static TerritoryMap fromJson(Map<String, Object?> json) {
    final rawTerritories = json['territories'];
    final rawBases = json['bases'];
    final bases = <String, List<String>>{};

    if (rawBases is Map) {
      for (final entry in rawBases.entries) {
        final value = entry.value;
        if (value is List) {
          bases[entry.key.toString()] = value
              .map((id) => id.toString())
              .toList(growable: false);
        }
      }
    }

    return TerritoryMap(
      playerCount: json['playerCount'] is num
          ? (json['playerCount']! as num).round()
          : 0,
      territories: rawTerritories is List
          ? rawTerritories
                .whereType<Map<String, Object?>>()
                .map(Territory.fromJson)
                .toList(growable: false)
          : const [],
      bases: bases,
    );
  }
}

/// Cine deține ce, în runda curentă.
final class TerritoryOwnership {
  const TerritoryOwnership({
    this.owners = const {},
    this.contestedTerritoryId,
  });

  /// Cheie: id de teritoriu. Valoare `null` ⇒ liber, încă necucerit.
  final Map<String, String?> owners;

  /// Teritoriul pus în joc în runda următoare.
  final String? contestedTerritoryId;

  static const empty = TerritoryOwnership();

  String? ownerOf(String territoryId) => owners[territoryId];

  bool isFree(String territoryId) => owners[territoryId] == null;

  /// Câte teritorii deține fiecare jucător.
  Map<String, int> counts() {
    final result = <String, int>{};
    for (final owner in owners.values) {
      if (owner == null) continue;
      result[owner] = (result[owner] ?? 0) + 1;
    }
    return result;
  }

  /// Teritoriile care tocmai și-au schimbat stăpânul față de [previous].
  ///
  /// Animația de cucerire are nevoie exact de lista asta: fără ea, ecranul ar
  /// trebui să reanimeze toată harta la fiecare rundă.
  List<String> changedSince(TerritoryOwnership previous) {
    final changed = <String>[];
    for (final entry in owners.entries) {
      if (previous.owners[entry.key] != entry.value) changed.add(entry.key);
    }
    return changed;
  }

  static TerritoryOwnership fromJson(Map<String, Object?> json) {
    final rawOwners = json['ownership'];
    final owners = <String, String?>{};
    if (rawOwners is Map) {
      for (final entry in rawOwners.entries) {
        final value = entry.value;
        owners[entry.key.toString()] = value?.toString();
      }
    }
    return TerritoryOwnership(
      owners: owners,
      contestedTerritoryId: json['contestedTerritoryId']?.toString(),
    );
  }
}
