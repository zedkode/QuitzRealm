/// Modurile de meci pe care le acceptă serverul de matchmaking.
///
/// `plan.md` §6 listează și Blitz și Partidă privată; serverul nu le are încă,
/// iar un buton care trimite un mod refuzat ar fi o promisiune falsă. Enumerarea
/// crește când crește și contractul din `JoinMatchmakingDto`.
enum MatchMode {
  /// Duel 1v1, matchmaking pe ELO.
  duo,

  /// Partidă pe hartă cu mai mulți jucători.
  classic,
}

extension MatchModeX on MatchMode {
  /// Valoarea trimisă serverului. Nu folosim `name` direct: o redenumire în
  /// Dart ar rupe în tăcere contractul de rețea.
  String get wireValue => switch (this) {
    MatchMode.duo => 'duo',
    MatchMode.classic => 'classic',
  };

  static MatchMode fromWire(String value) => switch (value) {
    'classic' => MatchMode.classic,
    _ => MatchMode.duo,
  };
}

/// Ce își dorește jucătorul de la meciul următor.
final class MatchPreferences {
  const MatchPreferences({
    this.mode = MatchMode.duo,
    this.categoryCodes = const [],
    this.playerCount,
  }) : assert(
         playerCount == null || (playerCount >= 2 && playerCount <= 8),
         'serverul acceptă între 2 și 8 jucători',
       );

  /// Numerele de jucători acceptate de server pentru modul Clasic public.
  ///
  /// `publicMatchProfile` respinge orice sub 4: o partidă Clasic cu doi jucători
  /// n-ar avea ce teritorii să-și dispute. Duelul are mereu exact doi.
  static const classicPlayerCounts = [4, 6, 8];

  final MatchMode mode;

  /// Categoriile bifate. **Lista goală înseamnă „toate"** — aceeași convenție
  /// ca pe server, unde absența preferinței nu restrânge pe nimeni.
  final List<String> categoryCodes;

  /// Doar pentru [MatchMode.classic]; la duel numărul e mereu doi.
  final int? playerCount;

  static const defaults = MatchPreferences();

  MatchPreferences copyWith({
    MatchMode? mode,
    List<String>? categoryCodes,
    int? playerCount,
  }) {
    return MatchPreferences(
      mode: mode ?? this.mode,
      categoryCodes: categoryCodes ?? this.categoryCodes,
      playerCount: playerCount ?? this.playerCount,
    );
  }

  /// Serializare pentru ruta de navigare, ca ecranul de duel să poată fi
  /// deschis direct dintr-un link fără să piardă alegerile.
  Map<String, String> toQueryParameters() => {
    'mode': mode.wireValue,
    if (categoryCodes.isNotEmpty) 'c': categoryCodes.join(','),
    if (playerCount != null) 'p': '$playerCount',
  };

  static MatchPreferences fromQueryParameters(Map<String, String> parameters) {
    final rawCodes = parameters['c'] ?? '';
    final rawCount = int.tryParse(parameters['p'] ?? '');
    return MatchPreferences(
      mode: MatchModeX.fromWire(parameters['mode'] ?? 'duo'),
      categoryCodes: rawCodes
          .split(',')
          .where((code) => code.isNotEmpty)
          .toList(growable: false),
      // Valoare din afara intervalului acceptat de server ⇒ o ignorăm, ca
      // serverul să aplice implicitul lui în loc să respingă cererea.
      playerCount: rawCount != null && rawCount >= 2 && rawCount <= 8
          ? rawCount
          : null,
    );
  }
}
