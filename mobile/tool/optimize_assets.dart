// Redimensionează ilustrațiile din `assets_src/game/` în `assets/game/`.
//
// De ce există: assets-urile livrate de proprietar sunt la rezoluție de
// producție (markere 1254², plăci de meniu 2172×724), adică de 8-23× mai mari
// decât dimensiunea la care sunt desenate pe ecran. Livrate ca atare, dădeau
// un APK de 264 MB — peste ce acceptă Google Play. Originalele rămân intacte
// în `assets_src/`, care NU e declarat în `pubspec.yaml`; în bundle intră doar
// varianta redimensionată.
//
// Ținta e ~2× dimensiunea maximă de desenare, ca ilustrațiile să rămână clare
// și pe ecrane cu densitate 3×.
//
// Rulare:  dart run tool/optimize_assets.dart
import 'dart:io';

import 'package:image/image.dart' as img;

/// Latura maximă (px) pentru fiecare folder, relativ la `assets_src/game/`.
const _maxSide = <String, int>{
  'Buttons/ro': 640, // desenate la ~290 px lățime
  'badges/achievements': 256,
  'badges/ranks': 256,
  'chests/static': 256,
  'icons/quiz-categories': 192,
  'icons/resources': 128,
  'map/markers': 192, // desenate la 54 px
  '': 768, // blazon, relicvar
};

/// Fișiere lăsate la rezoluția lor: harta se desenează pe toată lățimea.
const _keepAsIs = {'realm_map_v2.png', 'realm_map.png'};

int _limitFor(String relativeDir) => _maxSide[relativeDir] ?? 256;

Future<void> main() async {
  final root = Directory.current;
  final source = Directory('${root.path}/assets_src/game');
  final target = Directory('${root.path}/assets/game');

  if (!source.existsSync()) {
    stderr.writeln('Lipsește assets_src/game — nu am de unde optimiza.');
    exitCode = 1;
    return;
  }

  var totalBefore = 0;
  var totalAfter = 0;
  var resized = 0;
  var copied = 0;

  for (final entity in source.listSync(recursive: true)) {
    if (entity is! File) continue;
    final relative = entity.path
        .substring(source.path.length + 1)
        .replaceAll(r'\', '/');
    final relativeDir = relative.contains('/')
        ? relative.substring(0, relative.lastIndexOf('/'))
        : '';
    final name = relative.split('/').last;

    final destination = File('${target.path}/$relative');
    destination.parent.createSync(recursive: true);

    final bytes = entity.readAsBytesSync();
    totalBefore += bytes.length;

    if (!name.toLowerCase().endsWith('.png') || _keepAsIs.contains(name)) {
      destination.writeAsBytesSync(bytes);
      totalAfter += bytes.length;
      copied += 1;
      continue;
    }

    final decoded = img.decodePng(bytes);
    if (decoded == null) {
      stderr.writeln('Nu am putut decoda $relative — îl copiez neatins.');
      destination.writeAsBytesSync(bytes);
      totalAfter += bytes.length;
      copied += 1;
      continue;
    }

    final limit = _limitFor(relativeDir);
    final longest = decoded.width > decoded.height
        ? decoded.width
        : decoded.height;
    final output = longest <= limit
        ? decoded
        : img.copyResize(
            decoded,
            width: decoded.width >= decoded.height ? limit : null,
            height: decoded.height > decoded.width ? limit : null,
            interpolation: img.Interpolation.cubic,
          );

    final encoded = img.encodePng(output, level: 9);
    destination.writeAsBytesSync(encoded);
    totalAfter += encoded.length;
    resized += 1;
  }

  String mb(int bytes) => '${(bytes / 1024 / 1024).toStringAsFixed(1)} MB';
  stdout.writeln(
    'Redimensionate: $resized, copiate ca atare: $copied\n'
    'Înainte: ${mb(totalBefore)} → după: ${mb(totalAfter)} '
    '(${(100 - totalAfter / totalBefore * 100).toStringAsFixed(1)}% mai puțin)',
  );
}
