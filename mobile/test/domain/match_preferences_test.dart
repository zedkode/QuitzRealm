import 'package:flutter_test/flutter_test.dart';
import 'package:quiz_realm/domain/duel/match_preferences.dart';

void main() {
  test('numerele de jucători la Clasic sunt cele acceptate de server', () {
    // `publicMatchProfile` din backend respinge orice sub 4 la Clasic public.
    // Dacă cineva adaugă „2" în listă, meciul ar fi refuzat de server, iar
    // jucătorul ar vedea o eroare fără explicație.
    expect(MatchPreferences.classicPlayerCounts, everyElement(greaterThanOrEqualTo(4)));
    expect(MatchPreferences.classicPlayerCounts, everyElement(lessThanOrEqualTo(8)));
  });

  test('valoarea de rețea a modului nu depinde de numele din Dart', () {
    expect(MatchMode.duo.wireValue, 'duo');
    expect(MatchMode.classic.wireValue, 'classic');
  });

  test('preferințele trec neschimbate prin parametrii de rută', () {
    const original = MatchPreferences(
      mode: MatchMode.classic,
      categoryCodes: ['history', 'logic'],
      playerCount: 6,
    );

    final restored = MatchPreferences.fromQueryParameters(
      original.toQueryParameters(),
    );

    expect(restored.mode, MatchMode.classic);
    expect(restored.categoryCodes, ['history', 'logic']);
    expect(restored.playerCount, 6);
  });

  test('lista goală de categorii nu ajunge în parametri', () {
    // Pe server, absența preferinței înseamnă „accept orice”. Un `c=` gol ar fi
    // doar zgomot.
    const preferences = MatchPreferences();
    expect(preferences.toQueryParameters().containsKey('c'), isFalse);
  });

  test('un număr de jucători imposibil e ignorat, nu propagat', () {
    final restored = MatchPreferences.fromQueryParameters({
      'mode': 'classic',
      'p': '99',
    });

    // Mai bine lăsăm serverul să aplice implicitul lui decât să-i trimitem o
    // valoare pe care o va respinge.
    expect(restored.playerCount, isNull);
  });
}
