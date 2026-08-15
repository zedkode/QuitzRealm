import 'dart:convert';

import 'package:flutter/services.dart' show AssetBundle, rootBundle;

import 'question_pack.dart';

/// Încarcă pachetele curatoriate din assets și le ține în memorie, ca să nu
/// citim de pe disc la fiecare asalt.
class QuestionPackLoader {
  QuestionPackLoader({AssetBundle? bundle}) : _bundle = bundle ?? rootBundle;

  final AssetBundle _bundle;
  final Map<String, QuestionPack> _cache = {};

  Future<QuestionPack> load(String asset) async {
    final cached = _cache[asset];
    if (cached != null) return cached;

    final raw = await _bundle.loadString(asset);
    final decoded = jsonDecode(raw);
    if (decoded is! Map<String, Object?>) {
      throw FormatException('Pachet invalid: $asset');
    }
    final pack = QuestionPack.fromJson(decoded);
    _cache[asset] = pack;
    return pack;
  }
}
