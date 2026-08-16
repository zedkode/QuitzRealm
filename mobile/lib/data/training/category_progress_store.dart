import 'dart:convert';

import 'package:shared_preferences/shared_preferences.dart';

import '../../domain/training/category_progress.dart';

/// Persistă progresul pe categorii pe dispozitiv.
abstract class CategoryProgressStore {
  Future<CategoryProgress> read();

  Future<void> write(CategoryProgress progress);
}

class SharedPreferencesCategoryProgressStore implements CategoryProgressStore {
  const SharedPreferencesCategoryProgressStore();

  static const storageKey = 'quizrealm_category_progress_v1';

  @override
  Future<CategoryProgress> read() async {
    final preferences = await SharedPreferences.getInstance();
    final raw = preferences.getString(storageKey);
    if (raw == null || raw.isEmpty) return CategoryProgress.empty;
    try {
      final decoded = jsonDecode(raw);
      if (decoded is! Map<String, Object?>) return CategoryProgress.empty;
      return CategoryProgress.fromJson(decoded);
    } on FormatException {
      // Progres necitibil: pornim de la zero, dar jocul rămâne jucabil.
      return CategoryProgress.empty;
    }
  }

  @override
  Future<void> write(CategoryProgress progress) async {
    final preferences = await SharedPreferences.getInstance();
    await preferences.setString(storageKey, jsonEncode(progress.toJson()));
  }
}

/// Variantă de memorie, pentru teste.
class InMemoryCategoryProgressStore implements CategoryProgressStore {
  InMemoryCategoryProgressStore([this._progress = CategoryProgress.empty]);

  CategoryProgress _progress;

  @override
  Future<CategoryProgress> read() async => _progress;

  @override
  Future<void> write(CategoryProgress progress) async => _progress = progress;
}
