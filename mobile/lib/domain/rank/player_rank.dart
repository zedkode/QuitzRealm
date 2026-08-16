/// Rangul unui jucător, așa cum îl calculează serverul din ELO.
/// Clientul nu recalculează niciodată treapta: o afișează.
class PlayerRank {
  const PlayerRank({
    required this.key,
    required this.label,
    required this.majorRank,
    required this.division,
    required this.order,
    required this.totalTiers,
    required this.elo,
    required this.progress,
    required this.isLegend,
    this.eloToNextTier,
  }) : assert(majorRank >= 1),
       assert(progress >= 0 && progress <= 1);

  final String key;
  final String label;
  final int majorRank;
  final int? division;
  final int order;
  final int totalTiers;
  final int elo;
  final int? eloToNextTier;
  final double progress;
  final bool isLegend;

  /// Treapta de pornire, folosită când serverul n-a trimis un rang.
  ///
  /// Trăiește aici, nu copiată la fiecare loc care are nevoie de ea: trei
  /// variante scrise de mână s-ar putea abate una de alta fără ca cineva să
  /// observe, iar `majorRank: 1` decide culoarea insignei.
  static const unranked = PlayerRank(
    key: 'novice',
    label: '',
    majorRank: 1,
    division: null,
    order: 1,
    totalTiers: 1,
    elo: 0,
    progress: 0,
    isLegend: false,
  );

  static PlayerRank fromJson(Map<String, Object?> json) {
    final progress = json['progress'];
    final division = json['division'];
    final toNext = json['eloToNextTier'];
    return PlayerRank(
      key: json['key']?.toString() ?? '',
      label: json['label']?.toString() ?? '',
      majorRank: _asInt(json['majorRank']) ?? 1,
      division: division == null ? null : _asInt(division),
      order: _asInt(json['order']) ?? 1,
      totalTiers: _asInt(json['totalTiers']) ?? 1,
      elo: _asInt(json['elo']) ?? 0,
      eloToNextTier: toNext == null ? null : _asInt(toNext),
      progress: progress is num ? progress.toDouble().clamp(0.0, 1.0) : 0,
      isLegend: json['isLegend'] == true,
    );
  }
}

/// O linie din clasamentul global.
class LeaderboardEntry {
  const LeaderboardEntry({
    required this.position,
    required this.userId,
    required this.username,
    required this.elo,
    required this.matchesPlayed,
    required this.rank,
  });

  final int position;
  final String userId;
  final String username;
  final int elo;
  final int matchesPlayed;
  final PlayerRank rank;

  static LeaderboardEntry fromJson(Map<String, Object?> json) {
    final rank = json['rank'];
    return LeaderboardEntry(
      position: _asInt(json['position']) ?? 0,
      userId: json['userId']?.toString() ?? '',
      username: json['username']?.toString() ?? '',
      elo: _asInt(json['eloRating']) ?? 0,
      matchesPlayed: _asInt(json['matchesPlayed']) ?? 0,
      rank: rank is Map<String, Object?>
          ? PlayerRank.fromJson(rank)
          : PlayerRank.unranked,
    );
  }
}

class LeaderboardPage {
  const LeaderboardPage({required this.total, required this.entries});

  final int total;
  final List<LeaderboardEntry> entries;
}

int? _asInt(Object? value) {
  if (value is int) return value;
  if (value is num) return value.round();
  return int.tryParse(value?.toString() ?? '');
}
