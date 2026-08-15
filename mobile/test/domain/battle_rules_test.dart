import 'package:flutter_test/flutter_test.dart';
import 'package:quiz_realm/domain/battle/battle_rules.dart';

void main() {
  group('BattleRules.streakMultiplier', () {
    test('pornește de la 1 și crește cu 25% per răspuns corect', () {
      expect(BattleRules.streakMultiplier(0), 1);
      expect(BattleRules.streakMultiplier(1), 1.25);
      expect(BattleRules.streakMultiplier(4), 2);
    });

    test('se plafonează la ×3', () {
      expect(BattleRules.streakMultiplier(8), 3);
      expect(BattleRules.streakMultiplier(40), 3);
    });
  });

  group('BattleRules.pointsFor', () {
    test('răsplătește timpul rămas', () {
      expect(
        BattleRules.pointsFor(remainingSeconds: 0, streakBefore: 0),
        BattleRules.basePoints,
      );
      expect(BattleRules.pointsFor(remainingSeconds: 10, streakBefore: 0), 200);
    });

    test('aplică multiplicatorul de serie', () {
      expect(BattleRules.pointsFor(remainingSeconds: 10, streakBefore: 2), 300);
    });
  });

  group('BattleRules.starsFor', () {
    test('trei stele doar pentru asalt perfect', () {
      expect(BattleRules.starsFor(correct: 7, total: 7), 3);
      expect(BattleRules.starsFor(correct: 6, total: 7), 2);
    });

    test('două stele de la 70%, una de la 50%', () {
      expect(BattleRules.starsFor(correct: 7, total: 10), 2);
      expect(BattleRules.starsFor(correct: 5, total: 10), 1);
      expect(BattleRules.starsFor(correct: 4, total: 10), 0);
    });
  });

  test('xpFor combină scorul cu stelele', () {
    expect(BattleRules.xpFor(score: 800, stars: 3), 175);
    expect(BattleRules.xpFor(score: 0, stars: 0), 0);
  });
}
