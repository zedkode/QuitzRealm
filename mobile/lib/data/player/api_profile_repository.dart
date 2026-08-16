import '../../core/network/api_client.dart';
import '../../core/network/api_exception.dart';
import '../../domain/player/account_privacy.dart';
import '../../domain/player/player_profile.dart';
import '../../domain/player/profile_cosmetics.dart';
import '../../domain/player/profile_details.dart';
import '../../domain/social/social_models.dart' show DmPermission;

/// Profilul de jucător (`owner-plan.md` §4) și confidențialitatea contului
/// (§4.9), așa cum le expune API-ul.
///
/// Fără sesiune validă, [fetchMe] întoarce `null`: jocul are un mod fără cont,
/// deci lipsa profilului e o stare validă, nu o eroare. Restul metodelor cer o
/// sesiune și lasă erorile să iasă — acolo, un eșec chiar trebuie arătat.
abstract class ProfileRepository {
  Future<PlayerProfile?> fetchMe();

  Future<ProfileDetails> fetchDetails();

  /// `null` explicit șterge câmpul; câmpul absent îl lasă neatins. Fără
  /// distincția asta, „îmi șterg biografia" n-ar putea fi exprimat.
  Future<ProfileDetails> updateContent({
    Object? bio = _unset,
    Object? statusText = _unset,
    Object? statusEmoji = _unset,
    Object? statusMinutes = _unset,
    String? themeAccent,
  });

  Future<ProfileDetails> equip(CosmeticKind kind, String? code);

  Future<ProfileDetails> addLink({required String label, required String url});

  Future<ProfileDetails> removeLink(String linkId);

  Future<ProfileDetails> setCountry(String countryCode);

  Future<AccountPrivacy> fetchPrivacy();

  Future<AccountPrivacy> updatePrivacy({
    DmPermission? dmPermission,
    ProfileVisibility? profileVisibility,
    OnlineVisibility? onlineVisibility,
    bool? allowMatchInvites,
    bool? chatCensorship,
    bool? chatNotifications,
  });

  Future<PublicProfile> fetchPlayer(String username);

  /// Numele afișat se schimbă liber (§1.2): nu e identificatorul contului.
  Future<void> updateDisplayName(String displayName);

  /// Handle-ul are cooldown propriu și poate eșua din motive diferite (nume
  /// luat, fereastră neexpirată), deci e un apel separat.
  Future<void> updateUsername(String username);
}

/// Santinelă pentru „parametru neatins", ca `null` să poată însemna „șterge".
const Object _unset = Object();

class ApiProfileRepository implements ProfileRepository {
  ApiProfileRepository(this._api);

  final ApiClient _api;

  @override
  Future<PlayerProfile?> fetchMe() async {
    try {
      final payload = await _api.get('users/me', authenticated: true);
      if (payload is! Map<String, Object?>) return null;
      return PlayerProfile.fromJson(payload);
    } on ApiException catch (error) {
      if (error.statusCode == 401 || error.statusCode == 403) return null;
      rethrow;
    }
  }

  @override
  Future<ProfileDetails> fetchDetails() async {
    final payload = await _api.get('users/me/profile', authenticated: true);
    return ProfileDetails.fromJson(_map(payload));
  }

  @override
  Future<ProfileDetails> updateContent({
    Object? bio = _unset,
    Object? statusText = _unset,
    Object? statusEmoji = _unset,
    Object? statusMinutes = _unset,
    String? themeAccent,
  }) async {
    final body = <String, Object?>{};
    if (!identical(bio, _unset)) body['bio'] = bio;
    if (!identical(statusText, _unset)) body['statusText'] = statusText;
    if (!identical(statusEmoji, _unset)) body['statusEmoji'] = statusEmoji;
    if (!identical(statusMinutes, _unset)) {
      body['statusMinutes'] = statusMinutes;
    }
    if (themeAccent != null) body['themeAccent'] = themeAccent;

    final payload = await _api.patch(
      'users/me/profile',
      body: body,
      authenticated: true,
    );
    return ProfileDetails.fromJson(_map(payload));
  }

  @override
  Future<ProfileDetails> equip(CosmeticKind kind, String? code) async {
    final payload = await _api.put(
      'users/me/profile/equip',
      body: {'type': kind.wireValue, 'code': code},
      authenticated: true,
    );
    return ProfileDetails.fromJson(_map(payload));
  }

  @override
  Future<ProfileDetails> addLink({
    required String label,
    required String url,
  }) async {
    final payload = await _api.post(
      'users/me/profile/links',
      body: {'label': label.trim(), 'url': url.trim()},
      authenticated: true,
    );
    return ProfileDetails.fromJson(_map(payload));
  }

  @override
  Future<ProfileDetails> removeLink(String linkId) async {
    final payload = await _api.delete(
      'users/me/profile/links/$linkId',
      authenticated: true,
    );
    return ProfileDetails.fromJson(_map(payload));
  }

  @override
  Future<ProfileDetails> setCountry(String countryCode) async {
    final payload = await _api.patch(
      'users/me/profile/region',
      body: {'countryCode': countryCode},
      authenticated: true,
    );
    return ProfileDetails.fromJson(_map(payload));
  }

  @override
  Future<AccountPrivacy> fetchPrivacy() async {
    final payload = await _api.get('users/me/privacy', authenticated: true);
    return AccountPrivacy.fromJson(payload);
  }

  @override
  Future<AccountPrivacy> updatePrivacy({
    DmPermission? dmPermission,
    ProfileVisibility? profileVisibility,
    OnlineVisibility? onlineVisibility,
    bool? allowMatchInvites,
    bool? chatCensorship,
    bool? chatNotifications,
  }) async {
    // Se trimite doar comutatorul atins. Un obiect complet ar suprascrie
    // schimbările făcute între timp de pe alt dispozitiv.
    final payload = await _api.patch(
      'users/me/privacy',
      body: {
        if (dmPermission != null)
          'dmPermission': switch (dmPermission) {
            DmPermission.everyone => 'EVERYONE',
            DmPermission.friendsOnly => 'FRIENDS_ONLY',
            DmPermission.nobody => 'NOBODY',
          },
        if (profileVisibility != null)
          'profileVisibility': profileVisibility.wireValue,
        if (onlineVisibility != null)
          'onlineVisibility': onlineVisibility.wireValue,
        'allowMatchInvites': ?allowMatchInvites,
        'chatCensorship': ?chatCensorship,
        'chatNotifications': ?chatNotifications,
      },
      authenticated: true,
    );
    return AccountPrivacy.fromJson(payload);
  }

  @override
  Future<PublicProfile> fetchPlayer(String username) async {
    final payload = await _api.get(
      'players/${Uri.encodeComponent(username)}',
      authenticated: true,
    );
    return PublicProfile.fromJson(_map(payload));
  }

  @override
  Future<void> updateDisplayName(String displayName) async {
    await _api.patch(
      'users/me',
      body: {'displayName': displayName.trim()},
      authenticated: true,
    );
  }

  @override
  Future<void> updateUsername(String username) async {
    await _api.patch(
      'users/me/username',
      body: {'username': username.trim()},
      authenticated: true,
    );
  }

  Map<String, Object?> _map(Object? payload) {
    if (payload is! Map<String, Object?>) {
      throw const FormatException('Răspuns de profil invalid');
    }
    return payload;
  }
}
