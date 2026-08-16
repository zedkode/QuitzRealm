import '../../core/network/api_client.dart';
import '../../domain/achievements/achievement_models.dart';
import '../../domain/achievements/achievement_repository.dart';

class ApiAchievementRepository implements AchievementRepository {
  ApiAchievementRepository(this._api);

  final ApiClient _api;

  @override
  Future<List<AchievementProgress>> fetchAchievements() async {
    final payload = await _api.get('achievements', authenticated: true);
    if (payload is! List) return const [];
    return payload
        .whereType<Map<String, Object?>>()
        .map(AchievementProgress.fromJson)
        .toList(growable: false);
  }

  @override
  Future<AchievementSummary> fetchSummary() async {
    final payload = await _api.get('achievements/summary', authenticated: true);
    if (payload is! Map<String, Object?>) {
      throw const FormatException('Rezumat achievements invalid');
    }
    return AchievementSummary.fromJson(payload);
  }

  @override
  Future<void> setBadgeSlot({
    required int slotIndex,
    String? achievementId,
  }) async {
    await _api.patch(
      'achievements/badges',
      body: {'slotIndex': slotIndex, 'achievementId': ?achievementId},
      authenticated: true,
    );
  }
}
