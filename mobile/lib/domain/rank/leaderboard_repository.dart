import 'player_rank.dart';

abstract class LeaderboardRepository {
  Future<LeaderboardPage> fetchTop({int limit = 25});

  /// Poziția jucătorului autentificat; `null` dacă nu există sesiune.
  Future<LeaderboardEntry?> fetchMyPosition();
}
