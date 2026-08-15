/// Regulile de punctaj ale unui asalt. Sunt izolate aici ca să poată fi
/// testate fără UI și reutilizate mai târziu de partea de multiplayer.
abstract final class BattleRules {
  /// Puncte primite doar pentru răspunsul corect.
  static const basePoints = 100;

  /// Bonus pentru fiecare secundă rămasă pe cronometru.
  static const pointsPerSecond = 10;

  /// Fiecare răspuns corect consecutiv adaugă 25% la punctaj, până la ×3.
  static double streakMultiplier(int streakBefore) {
    assert(streakBefore >= 0);
    final multiplier = 1 + 0.25 * streakBefore;
    return multiplier > 3 ? 3 : multiplier;
  }

  static int pointsFor({
    required int remainingSeconds,
    required int streakBefore,
  }) {
    assert(remainingSeconds >= 0);
    final raw =
        (basePoints + remainingSeconds * pointsPerSecond) *
        streakMultiplier(streakBefore);
    return raw.round();
  }

  /// 3 stele = asalt perfect, 2 stele = cel puțin 70%, 1 stea = cel puțin 50%.
  static int starsFor({required int correct, required int total}) {
    assert(total > 0);
    assert(correct >= 0 && correct <= total);
    if (correct == total) return 3;
    final ratio = correct / total;
    if (ratio >= 0.7) return 2;
    if (ratio >= 0.5) return 1;
    return 0;
  }

  static int xpFor({required int score, required int stars}) {
    assert(score >= 0);
    assert(stars >= 0 && stars <= 3);
    return score ~/ 8 + stars * 25;
  }
}
