import 'package:flutter/services.dart';
import 'package:flutter_test/flutter_test.dart';
import 'package:quiz_realm/core/ui/art_button.dart';
import 'package:quiz_realm/core/ui/map_marker.dart';

/// Flutter nu include subdirectoarele de assets recursiv: `assets/game/` în
/// `pubspec.yaml` nu aduce și `assets/game/map/markers/`. O omisiune se vede
/// abia pe device, ca imagine lipsă. Testul de aici încarcă fiecare asset prin
/// bundle-ul real, deci o declarație uitată pică imediat.
Future<void> _expectBundled(String asset) async {
  final data = await rootBundle.load(asset);
  expect(data.lengthInBytes, greaterThan(0), reason: '$asset este gol');
}

void main() {
  TestWidgetsFlutterBinding.ensureInitialized();

  test('toate markerele de hartă sunt în bundle', () async {
    for (final kind in MapMarkerKind.values) {
      await _expectBundled(kind.asset);
    }
  });

  test('plăcile de meniu există pentru fiecare limbă ilustrată', () async {
    for (final art in ArtButtonArt.values) {
      await _expectBundled(art.assetFor('ro'));
    }
  });

  test('ilustrațiile de bază ale jocului sunt în bundle', () async {
    for (final asset in const [
      'assets/game/realm_map_v2.png',
      'assets/game/quizrealm_crest.png',
      'assets/game/victory_reliquary.png',
    ]) {
      await _expectBundled(asset);
    }
  });
}
