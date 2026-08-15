import 'package:flutter_secure_storage/flutter_secure_storage.dart';

import '../../core/network/api_client.dart';
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
  Future<void> login({required String email, required String password}) async {
    final payload = await _api.post(
      'auth/login',
      body: {'email': email.trim(), 'password': password},
    );
    await _saveTokens(payload);
  }

  @override
  Future<void> register({
    required String username,
    required String email,
    required String password,
    required DateTime birthDate,
  }) async {
    final payload = await _api.post(
      'auth/register',
      body: {
        'username': username.trim(),
        'email': email.trim(),
        'password': password,
        // Serverul așteaptă doar data, fără oră.
        'birthDate': _isoDate(birthDate),
      },
    );
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
