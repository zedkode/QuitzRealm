import 'package:flutter_test/flutter_test.dart';
import 'package:quiz_realm/domain/duel/territory_map.dart';

void main() {
  group('TerritoryMap.fromJson', () {
    test('citește harta trimisă de server', () {
      final map = TerritoryMap.fromJson(const {
        'playerCount': 4,
        'territories': [
          {
            'id': 't0',
            'coordinates': {'q': 0, 'r': 0},
            'neighbourIds': ['t1'],
          },
          {
            'id': 't1',
            'coordinates': {'q': 1, 'r': 0},
            'neighbourIds': ['t0'],
          },
        ],
        'bases': {
          'a': ['t0'],
        },
      });

      expect(map.playerCount, 4);
      expect(map.territories, hasLength(2));
      expect(map.territories.first.coordinates, const HexCoordinates(0, 0));
      expect(map.bases['a'], ['t0']);
    });

    test('un mesaj stricat nu aruncă, doar dă o hartă goală', () {
      // Un pachet malformat n-are voie să doboare ecranul în mijlocul partidei.
      final map = TerritoryMap.fromJson(const {'territories': 'nu e listă'});
      expect(map.isEmpty, isTrue);
    });
  });

  group('TerritoryOwnership', () {
    test('null înseamnă teritoriu liber, nu jucător necunoscut', () {
      final ownership = TerritoryOwnership.fromJson(const {
        'ownership': {'t0': 'a', 't1': null},
        'contestedTerritoryId': 't1',
      });

      expect(ownership.ownerOf('t0'), 'a');
      expect(ownership.isFree('t1'), isTrue);
      expect(ownership.contestedTerritoryId, 't1');
    });

    test('numără teritoriile fără să pună la socoteală pe cele libere', () {
      const ownership = TerritoryOwnership(
        owners: {'t0': 'a', 't1': 'a', 't2': 'b', 't3': null},
      );

      expect(ownership.counts(), {'a': 2, 'b': 1});
    });

    test('raportează exact teritoriile care și-au schimbat stăpânul', () {
      // Animația de cucerire se bazează pe lista asta; dacă ar întoarce tot,
      // harta ar pâlpâi întreagă la fiecare rundă.
      const before = TerritoryOwnership(
        owners: {'t0': 'a', 't1': null, 't2': 'b'},
      );
      const after = TerritoryOwnership(
        owners: {'t0': 'a', 't1': 'b', 't2': 'b'},
      );

      expect(after.changedSince(before), ['t1']);
    });

    test('fără schimbări, lista e goală', () {
      const ownership = TerritoryOwnership(owners: {'t0': 'a'});
      expect(ownership.changedSince(ownership), isEmpty);
    });
  });
}
