import 'dart:convert';

import 'package:shared_preferences/shared_preferences.dart';

import '../../domain/settings/app_settings.dart';

/// Persistă preferințele pe dispozitiv.
abstract class SettingsStore {
  Future<AppSettings> read();

  Future<void> write(AppSettings settings);
}

class SharedPreferencesSettingsStore implements SettingsStore {
  const SharedPreferencesSettingsStore();

  static const storageKey = 'quizrealm_settings_v1';

  @override
  Future<AppSettings> read() async {
    final preferences = await SharedPreferences.getInstance();
    final raw = preferences.getString(storageKey);
    if (raw == null || raw.isEmpty) return AppSettings.defaults;
    try {
      final decoded = jsonDecode(raw);
      if (decoded is! Map<String, Object?>) return AppSettings.defaults;
      return AppSettings.fromJson(decoded);
    } on FormatException {
      // Preferințe stricate: repornim de la valorile implicite, nu blocăm
      // pornirea aplicației pentru un volum salvat greșit.
      return AppSettings.defaults;
    }
  }

  @override
  Future<void> write(AppSettings settings) async {
    final preferences = await SharedPreferences.getInstance();
    await preferences.setString(storageKey, jsonEncode(settings.toJson()));
  }
}

/// Variantă de memorie, pentru teste.
class InMemorySettingsStore implements SettingsStore {
  InMemorySettingsStore([this._settings = AppSettings.defaults]);

  AppSettings _settings;

  @override
  Future<AppSettings> read() async => _settings;

  @override
  Future<void> write(AppSettings settings) async => _settings = settings;
}
