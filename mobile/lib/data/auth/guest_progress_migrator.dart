import 'dart:math';

import 'package:flutter_secure_storage/flutter_secure_storage.dart';

import '../../data/progress/progress_store.dart';
import '../../domain/auth/auth_repository.dart';

/// Leagă progresul solo local de primul cont creat pe dispozitiv. Identitatea
/// invitatului nu este un token de acces și nu oferă recompense competitive;
/// este doar o cheie de migrare idempotentă pentru campanie.
class GuestProgressMigrator {
  GuestProgressMigrator(this._auth, this._storage, this._progressStore);

  static const _guestIdKey = 'quizrealm_guest_id_v1';
  static const _migratedKey = 'quizrealm_guest_progress_migrated_v1';

  final AuthRepository _auth;
  final FlutterSecureStorage _storage;
  final ProgressStore _progressStore;

  Future<void> migrateAfterRegistration() async {
    if (await _storage.read(key: _migratedKey) == 'true') return;
    final guestId = await _guestId();
    final progress = await _progressStore.read();
    await _auth.migrateGuestProgress(
      guestId: guestId,
      campaignProgress: progress.toJson(),
    );
    await _storage.write(key: _migratedKey, value: 'true');
  }

  Future<String> _guestId() async {
    final existing = await _storage.read(key: _guestIdKey);
    if (existing != null && existing.isNotEmpty) return existing;

    final random = Random.secure();
    final bytes = List<int>.generate(16, (_) => random.nextInt(256));
    bytes[6] = (bytes[6] & 0x0f) | 0x40;
    bytes[8] = (bytes[8] & 0x3f) | 0x80;
    final hex = bytes.map((byte) => byte.toRadixString(16).padLeft(2, '0')).join();
    final guestId = '${hex.substring(0, 8)}-${hex.substring(8, 12)}-'
        '${hex.substring(12, 16)}-${hex.substring(16, 20)}-${hex.substring(20)}';
    await _storage.write(key: _guestIdKey, value: guestId);
    return guestId;
  }
}
