import 'dart:async';

import 'package:flutter_riverpod/flutter_riverpod.dart';

import '../../data/settings/settings_store.dart';
import '../../domain/settings/app_settings.dart';

final settingsStoreProvider = Provider<SettingsStore>((ref) {
  return const SharedPreferencesSettingsStore();
});

/// Preferințele, restaurate de pe dispozitiv la pornire.
///
/// Fiecare schimbare se salvează imediat: setările se ating rar, iar o scriere
/// amânată s-ar pierde exact în cazul care contează — jucătorul dă volumul
/// jos și închide aplicația.
class SettingsController extends StateNotifier<AppSettings> {
  SettingsController(this._store) : super(AppSettings.defaults) {
    unawaited(_restore());
  }

  final SettingsStore _store;
  bool _restored = false;

  bool get isRestored => _restored;

  Future<void> _restore() async {
    try {
      final stored = await _store.read();
      if (mounted) state = stored;
    } catch (_) {
      // Preferințe necitibile: rămân cele implicite, aplicația pornește.
    } finally {
      _restored = true;
    }
  }

  Future<void> _update(AppSettings settings) async {
    state = settings;
    try {
      await _store.write(settings);
    } catch (_) {
      // Scrierea eșuată nu anulează schimbarea din sesiunea curentă.
    }
  }

  Future<void> setMusicVolume(double value) =>
      _update(state.copyWith(musicVolume: value.clamp(0.0, 1.0)));

  Future<void> setEffectsVolume(double value) =>
      _update(state.copyWith(effectsVolume: value.clamp(0.0, 1.0)));

  Future<void> setVibration(bool value) =>
      _update(state.copyWith(vibration: value));

  Future<void> setPushNotifications(bool value) =>
      _update(state.copyWith(pushNotifications: value));

  Future<void> setConfirmActions(bool value) =>
      _update(state.copyWith(confirmActions: value));

  Future<void> setTutorials(bool value) =>
      _update(state.copyWith(tutorials: value));

  Future<void> setDataSaver(bool value) =>
      _update(state.copyWith(dataSaver: value));

  Future<void> setLanguage(String code) {
    if (!AppSettings.supportedLanguages.contains(code)) return Future.value();
    return _update(state.copyWith(languageCode: code));
  }
}

final settingsProvider =
    StateNotifierProvider<SettingsController, AppSettings>((ref) {
      return SettingsController(ref.watch(settingsStoreProvider));
    });
