import '../rank/player_rank.dart';
import 'profile_cosmetics.dart';

/// Profilul de cont, așa cum îl livrează `GET /users/me`.
///
/// Rangul, nivelul online și monedele sunt calculate de server. Clientul le
/// afișează; progresul campaniei offline rămâne separat, în `CampaignProgress`.
///
/// E versiunea **scurtă**, cerută de antetul fiecărui ecran. Profilul complet
/// (bio, status, catalog de cosmetice, linkuri) stă în `ProfileDetails` și se
/// cere doar când se deschide pagina de profil.
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
    this.equipped = EquippedCosmetics.empty,
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

  /// Ce poartă jucătorul (§4.1, §4.5). Antetul îl folosește ca să arate același
  /// portret și aceeași ramă pe toate ecranele.
  final EquippedCosmetics equipped;

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
          : PlayerRank.unranked,
      equipped: EquippedCosmetics.fromJson(json['equipped']),
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
