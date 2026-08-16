import '../rank/player_rank.dart';

/// Profilul de cont, așa cum îl livrează `GET /users/me`.
///
/// Rangul, nivelul online și monedele sunt calculate de server. Clientul le
/// afișează; progresul campaniei offline rămâne separat, în `CampaignProgress`.
class PlayerProfile {
  const PlayerProfile({
    required this.id,
    required this.username,
    required this.displayName,
    required this.rank,
    this.level = 1,
    this.xp = 0,
    this.coins = 0,
    this.matchesPlayed = 0,
    this.leaderboardPosition,
    this.emailVerified = false,
    this.canPlayRanked = false,
  });

  final String id;
  final String username;
  final String displayName;
  final PlayerRank rank;
  final int level;
  final int xp;
  final int coins;
  final int matchesPlayed;
  final int? leaderboardPosition;

  /// Din `capabilities`: acasă avem nevoie doar de consecințe, nu de motive.
  final bool emailVerified;
  final bool canPlayRanked;

  static PlayerProfile fromJson(Map<String, Object?> json) {
    int? asInt(Object? value) =>
        value is num ? value.round() : int.tryParse(value?.toString() ?? '');
    final capabilities = json['capabilities'];
    final capabilityMap = capabilities is Map<String, Object?>
        ? capabilities
        : const <String, Object?>{};
    final rank = json['rank'];

    return PlayerProfile(
      id: json['id']?.toString() ?? '',
      username: json['username']?.toString() ?? '',
      displayName:
          json['displayName']?.toString() ?? json['username']?.toString() ?? '',
      rank: rank is Map<String, Object?>
          ? PlayerRank.fromJson(rank)
          : const PlayerRank(
              key: 'novice',
              label: '',
              majorRank: 1,
              division: 1,
              order: 1,
              totalTiers: 1,
              elo: 0,
              progress: 0,
              isLegend: false,
            ),
      level: asInt(json['level']) ?? 1,
      xp: asInt(json['xp']) ?? 0,
      coins: asInt(json['coins']) ?? 0,
      matchesPlayed: asInt(json['matchesPlayed']) ?? 0,
      leaderboardPosition: asInt(json['leaderboardPosition']),
      emailVerified: capabilityMap['emailVerified'] == true,
      canPlayRanked: capabilityMap['canPlayRanked'] == true,
    );
  }
}
