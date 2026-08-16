import 'achievement_models.dart';

abstract class AchievementRepository {
  Future<List<AchievementProgress>> fetchAchievements();

  Future<AchievementSummary> fetchSummary();

  Future<void> setBadgeSlot({required int slotIndex, String? achievementId});

  Future<AchievementSummary> setShowcase(List<String> achievementIds);
}
