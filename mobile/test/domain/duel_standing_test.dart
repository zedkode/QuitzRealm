import 'package:flutter_test/flutter_test.dart';
import 'package:quiz_realm/domain/duel/duel_standing.dart';

void main() {
  test('ordonează după puncte, apoi teritorii', () {
    final sorted = sortedStandings(const [
      DuelStanding(userId: 'a', points: 10, territories: 1),
      DuelStanding(userId: 'b', points: 30, territories: 0),
      DuelStanding(userId: 'c', points: 10, territories: 3),
    ]);

    expect(sorted.map((s) => s.userId), ['b', 'c', 'a']);
  });

  test('egalitatea perfectă se rezolvă stabil, nu la întâmplare', () {
    // Fără un criteriu final determinist, doi jucători la egalitate și-ar
    // schimba locurile între ei la fiecare redesenare a ecranului.
    final first = sortedStandings(const [
      DuelStanding(userId: 'zeta', points: 5, territories: 1),
      DuelStanding(userId: 'alfa', points: 5, territories: 1),
    ]);
    final second = sortedStandings(const [
      DuelStanding(userId: 'alfa', points: 5, territories: 1),
      DuelStanding(userId: 'zeta', points: 5, territories: 1),
    ]);

    expect(first.map((s) => s.userId), ['alfa', 'zeta']);
    expect(second.map((s) => s.userId), first.map((s) => s.userId));
  });

  test('păstrează toți jucătorii unei partide Clasic', () {
    final sorted = sortedStandings([
      for (var index = 0; index < 8; index++)
        DuelStanding(userId: 'p$index', points: index, territories: 0),
    ]);

    // Regresia pe care o prevenim: reducerea partidei la „eu și un adversar".
    expect(sorted, hasLength(8));
    expect(sorted.first.userId, 'p7');
  });

  test('lista rezultată nu poate fi modificată din afară', () {
    final sorted = sortedStandings(const [
      DuelStanding(userId: 'a', points: 1, territories: 0),
    ]);

    expect(
      () => sorted.add(
        const DuelStanding(userId: 'b', points: 0, territories: 0),
      ),
      throwsUnsupportedError,
    );
  });
}
