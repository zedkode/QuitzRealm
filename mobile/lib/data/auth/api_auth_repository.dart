import 'dart:math';

import 'package:flutter_secure_storage/flutter_secure_storage.dart';
import 'package:flutter_web_auth_2/flutter_web_auth_2.dart';

import '../../core/network/api_client.dart';
import '../../domain/auth/account_session.dart';
import '../../domain/auth/two_factor_challenge.dart';
import '../../domain/auth/auth_repository.dart';

class ApiAuthRepository implements AuthRepository {
  ApiAuthRepository(this._api, this._storage);

  final ApiClient _api;
  final FlutterSecureStorage _storage;

  @override
  Future<bool> hasSession() async {
    return await _storage.read(key: ApiClient.accessTokenKey) != null;
  }

  @override
  Future<TwoFactorChallenge?> login({
    required String email,
    required String password,
  }) async {
    final payload = await _api.post(
      'auth/login',
      body: {'email': email.trim(), 'password': password},
    );
    final challenge = TwoFactorChallenge.fromJson(payload);
    if (challenge != null) return challenge;
    await _saveTokens(payload);
    return null;
  }

  @override
  Future<TwoFactorChallenge?> loginWithGoogle() async {
    final state = _oauthState();
    final authorizationUri = _api.baseUri
        .resolve('auth/google/mobile')
        .replace(queryParameters: {'state': state});
    final callback = await FlutterWebAuth2.authenticate(
      url: authorizationUri.toString(),
      callbackUrlScheme: 'quizrealm',
    );
    final callbackUri = Uri.parse(callback);
    if (callbackUri.scheme != 'quizrealm' ||
        callbackUri.queryParameters['state'] != state) {
      throw const FormatException('Invalid Google OAuth callback');
    }
    final code = callbackUri.queryParameters['code'];
    if (code == null || code.isEmpty) {
      throw const FormatException('Missing Google OAuth exchange code');
    }
    final payload = await _api.post(
      'auth/google/mobile/exchange',
      body: {'code': code},
    );
    final challenge = TwoFactorChallenge.fromJson(payload);
    if (challenge != null) return challenge;
    await _saveTokens(payload);
    return null;
  }

  @override
  Future<void> completeTwoFactorLogin({
    required String challengeToken,
    required String code,
  }) async {
    final payload = await _api.post(
      'auth/two-factor/login',
      body: {'challengeToken': challengeToken, 'code': code.trim()},
    );
    await _saveTokens(payload);
  }

  @override
  Future<void> requestPasswordReset(String email) async {
    await _api.post(
      'auth/password-reset/request',
      body: {'email': email.trim()},
    );
  }

  @override
  Future<void> migrateGuestProgress({
    required String guestId,
    required Map<String, Object?> campaignProgress,
  }) async {
    await _api.post(
      'auth/guest/migrate',
      body: {'guestId': guestId, 'campaignProgress': campaignProgress},
      authenticated: true,
    );
  }

  @override
  Future<void> register({
    required String username,
    required String email,
    required String password,
    required DateTime birthDate,
    String? captchaToken,
  }) async {
    final body = <String, Object?>{
      'username': username.trim(),
      'email': email.trim(),
      'password': password,
      // Serverul așteaptă doar data, fără oră.
      'birthDate': _isoDate(birthDate),
    };
    final normalizedCaptchaToken = captchaToken?.trim();
    if (normalizedCaptchaToken != null && normalizedCaptchaToken.isNotEmpty) {
      body['captchaToken'] = normalizedCaptchaToken;
    }
    final payload = await _api.post('auth/register', body: body);
    await _saveTokens(payload);
  }

  @override
  Future<void> requestEmailVerification() async {
    await _api.post('auth/verify-email/request', authenticated: true);
  }

  @override
  Future<void> logout() async {
    try {
      await _api.post('auth/logout', authenticated: true);
    } catch (_) {
      // Serverul poate refuza un token deja expirat sau invalid. Deconectarea
      // locală rămâne validă: important e ca dispozitivul să uite tokenurile.
    } finally {
      await _storage.delete(key: ApiClient.accessTokenKey);
      await _storage.delete(key: ApiClient.refreshTokenKey);
    }
  }

  @override
  Future<List<AccountSession>> fetchSessions() async {
    final payload = await _api.get('auth/sessions', authenticated: true);
    if (payload is! List) return const [];
    return payload
        .whereType<Map<String, Object?>>()
        .map(AccountSession.fromJson)
        .toList(growable: false);
  }

  @override
  Future<void> revokeSession(String sessionId) async {
    await _api.delete('auth/sessions/$sessionId', authenticated: true);
  }

  @override
  Future<int> revokeOtherSessions() async {
    final payload = await _api.delete('auth/sessions', authenticated: true);
    if (payload is! Map<String, Object?>) return 0;
    final revoked = payload['revoked'];
    return revoked is num ? revoked.round() : 0;
  }

  @override
  Future<String> startTwoFactorEnrollment({
    required String currentPassword,
  }) async {
    final payload = await _api.post(
      'auth/two-factor/setup',
      body: {'currentPassword': currentPassword},
      authenticated: true,
    );
    if (payload is! Map<String, Object?> || payload['otpauthUri'] is! String) {
      throw const FormatException('Invalid two-factor enrollment response');
    }
    return payload['otpauthUri']! as String;
  }

  @override
  Future<List<String>> confirmTwoFactorEnrollment({
    required String currentPassword,
    required String code,
  }) async {
    final payload = await _api.post(
      'auth/two-factor/confirm',
      body: {'currentPassword': currentPassword, 'code': code.trim()},
      authenticated: true,
    );
    if (payload is! Map<String, Object?> || payload['recoveryCodes'] is! List) {
      throw const FormatException('Invalid two-factor confirmation response');
    }
    return (payload['recoveryCodes'] as List).whereType<String>().toList(
      growable: false,
    );
  }

  @override
  Future<void> disableTwoFactor({
    required String currentPassword,
    required String code,
  }) async {
    await _api.post(
      'auth/two-factor/disable',
      body: {'currentPassword': currentPassword, 'code': code.trim()},
      authenticated: true,
    );
  }

  @override
  Future<void> changePassword({
    required String currentPassword,
    required String newPassword,
  }) async {
    await _api.post(
      'auth/password/change',
      body: {'currentPassword': currentPassword, 'newPassword': newPassword},
      authenticated: true,
    );
  }

  @override
  Future<void> deleteAccount({String? password}) async {
    await _api.post(
      'auth/account/delete',
      body: {'password': ?password},
      authenticated: true,
    );
    // Contul nu mai există: tokenurile rămase pe dispozitiv n-ar mai putea fi
    // reîmprospătate oricum, iar aplicația trebuie să pornească fără sesiune.
    await _storage.delete(key: ApiClient.accessTokenKey);
    await _storage.delete(key: ApiClient.refreshTokenKey);
  }

  String _oauthState() {
    const alphabet =
        'ABCDEFGHIJKLMNOPQRSTUVWXYZabcdefghijklmnopqrstuvwxyz0123456789-_';
    final random = Random.secure();
    return 'mobile.${List<String>.generate(43, (_) => alphabet[random.nextInt(alphabet.length)]).join()}';
  }

  Future<void> _saveTokens(Object? payload) async {
    if (payload is! Map<String, dynamic>) {
      throw const FormatException('Invalid auth response');
    }
    final accessToken = payload['accessToken'];
    final refreshToken = payload['refreshToken'];
    if (accessToken is! String || refreshToken is! String) {
      throw const FormatException('Missing auth tokens');
    }
    await _storage.write(key: ApiClient.accessTokenKey, value: accessToken);
    await _storage.write(key: ApiClient.refreshTokenKey, value: refreshToken);
  }
}

/// `YYYY-MM-DD`, formatul cerut de API pentru data nașterii.
String _isoDate(DateTime date) {
  final month = date.month.toString().padLeft(2, '0');
  final day = date.day.toString().padLeft(2, '0');
  return '${date.year}-$month-$day';
}
