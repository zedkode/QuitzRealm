import 'dart:convert';

import 'package:shared_preferences/shared_preferences.dart';

import '../../domain/campaign/campaign_progress.dart';

/// Persistă progresul campaniei pe dispozitiv.
abstract class ProgressStore {
  Future<CampaignProgress> read();

  Future<void> write(CampaignProgress progress);
}

class SharedPreferencesProgressStore implements ProgressStore {
  const SharedPreferencesProgressStore();

  static const storageKey = 'quizrealm_campaign_progress_v1';

  @override
  Future<CampaignProgress> read() async {
    final preferences = await SharedPreferences.getInstance();
    final raw = preferences.getString(storageKey);
    if (raw == null || raw.isEmpty) return CampaignProgress.empty;
    try {
      final decoded = jsonDecode(raw);
      if (decoded is! Map<String, Object?>) return CampaignProgress.empty;
      return CampaignProgress.fromJson(decoded);
    } on FormatException {
      // Progres corupt: mai bine repornim campania decât să blocăm jocul.
      return CampaignProgress.empty;
    }
  }

  @override
  Future<void> write(CampaignProgress progress) async {
    final preferences = await SharedPreferences.getInstance();
    await preferences.setString(storageKey, jsonEncode(progress.toJson()));
  }
}

/// Folosit în teste și ca rezervă dacă stocarea de pe dispozitiv nu răspunde.
class InMemoryProgressStore implements ProgressStore {
  InMemoryProgressStore([this._progress = CampaignProgress.empty]);

  CampaignProgress _progress;

  @override
  Future<CampaignProgress> read() async => _progress;

  @override
  Future<void> write(CampaignProgress progress) async => _progress = progress;
}
