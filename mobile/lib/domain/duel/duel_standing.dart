/// Poziția unui jucător în partida curentă.
///
/// Există pentru că modul Clasic are între 4 și 8 jucători, iar starea de duel
/// îi reducea la perechea „eu / adversarul", alegând un singur adversar din
/// listă. Într-o partidă de patru asta ascundea doi jucători din trei.
final class DuelStanding {
  const DuelStanding({
    required this.userId,
    required this.points,
    required this.territories,
    this.connected = true,
  }) : assert(userId != '');

  final String userId;
  final int points;
  final int territories;

  /// `false` cât timp jucătorul e deconectat și partida îi ține locul.
  final bool connected;

  DuelStanding copyWith({int? points, int? territories, bool? connected}) {
    return DuelStanding(
      userId: userId,
      points: points ?? this.points,
      territories: territories ?? this.territories,
      connected: connected ?? this.connected,
    );
  }
}

/// Ordonează clasamentul pentru afișare.
///
/// Criteriile sunt fixe și în ordinea asta: puncte, apoi teritorii, apoi
/// identificatorul. Ultimul nu e arbitrar — fără un criteriu final stabil,
/// doi jucători la egalitate și-ar schimba locurile între ele la fiecare
/// redesenare a ecranului.
List<DuelStanding> sortedStandings(Iterable<DuelStanding> standings) {
  final sorted = standings.toList()
    ..sort((a, b) {
      final byPoints = b.points.compareTo(a.points);
      if (byPoints != 0) return byPoints;
      final byTerritories = b.territories.compareTo(a.territories);
      if (byTerritories != 0) return byTerritories;
      return a.userId.compareTo(b.userId);
    });
  return List.unmodifiable(sorted);
}
