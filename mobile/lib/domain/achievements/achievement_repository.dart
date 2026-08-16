import 'achievement_models.dart';

abstract class AchievementRepository {
  Future<List<AchievementProgress>> fetchAchievements();

  Future<AchievementSummary> fetchSummary();
}
