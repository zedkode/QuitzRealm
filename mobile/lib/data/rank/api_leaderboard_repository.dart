import '../../core/network/api_client.dart';
import '../../core/network/api_exception.dart';
import '../../domain/rank/leaderboard_repository.dart';
import '../../domain/rank/player_rank.dart';

class ApiLeaderboardRepository implements LeaderboardRepository {
  ApiLeaderboardRepository(this._api);

  final ApiClient _api;

  @override
  Future<LeaderboardPage> fetchTop({int limit = 25}) async {
    final payload = await _api.get('leaderboard?limit=$limit');
    if (payload is! Map<String, Object?>) {
      throw const FormatException('Clasament invalid');
    }
    final entries = payload['entries'];
    return LeaderboardPage(
      total: payload['total'] is num ? (payload['total']! as num).round() : 0,
      entries: entries is List
          ? entries
                .whereType<Map<String, Object?>>()
                .map(LeaderboardEntry.fromJson)
                .toList(growable: false)
          : const [],
    );
  }

  @override
  Future<LeaderboardEntry?> fetchMyPosition() async {
    try {
      final payload = await _api.get('leaderboard/me', authenticated: true);
      if (payload is! Map<String, Object?>) return null;
      return LeaderboardEntry.fromJson(payload);
    } on ApiException catch (error) {
      // Fără cont valid nu există poziție — nu e o eroare de afișat.
      if (error.statusCode == 401 || error.statusCode == 403) return null;
      rethrow;
    }
  }
}
