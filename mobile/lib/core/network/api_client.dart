import 'dart:convert';

import 'package:flutter_secure_storage/flutter_secure_storage.dart';
import 'package:http/http.dart' as http;

import 'api_exception.dart';

class ApiClient {
  ApiClient(this._baseUri, this._client, this._storage);

  static const accessTokenKey = 'quizrealm_access_token';
  static const refreshTokenKey = 'quizrealm_refresh_token';

  final Uri _baseUri;
  final http.Client _client;
  final FlutterSecureStorage _storage;
  Future<bool>? _refreshInFlight;

  Future<Object?> get(String path, {bool authenticated = false}) {
    return _send('GET', path, authenticated: authenticated);
  }

  Future<Object?> post(
    String path, {
    Object? body,
    bool authenticated = false,
  }) {
    return _send('POST', path, body: body, authenticated: authenticated);
  }

  Future<Object?> _send(
    String method,
    String path, {
    Object? body,
    required bool authenticated,
  }) async {
    var response = await _dispatch(
      method,
      path,
      body: body,
      accessToken: authenticated
          ? await _storage.read(key: accessTokenKey)
          : null,
    );

    if (authenticated && response.statusCode == 401) {
      final refreshed = await _refreshSession();
      if (refreshed) {
        response = await _dispatch(
          method,
          path,
          body: body,
          accessToken: await _storage.read(key: accessTokenKey),
        );
      }
    }

    return _decode(response);
  }

  Future<http.Response> _dispatch(
    String method,
    String path, {
    Object? body,
    String? accessToken,
  }) async {
    final headers = <String, String>{'Accept': 'application/json'};
    if (body != null) {
      headers['Content-Type'] = 'application/json; charset=utf-8';
    }
    if (accessToken != null) {
      headers['Authorization'] = 'Bearer $accessToken';
    }

    final uri = _baseUri.resolve(
      path.startsWith('/') ? path.substring(1) : path,
    );
    final request = http.Request(method, uri)..headers.addAll(headers);
    if (body != null) request.body = jsonEncode(body);

    final streamed = await _client
        .send(request)
        .timeout(const Duration(seconds: 15));
    return http.Response.fromStream(streamed);
  }

  Future<bool> _refreshSession() {
    final activeRefresh = _refreshInFlight;
    if (activeRefresh != null) return activeRefresh;

    final refresh = _performRefresh();
    _refreshInFlight = refresh;
    return refresh.whenComplete(() {
      if (identical(_refreshInFlight, refresh)) {
        _refreshInFlight = null;
      }
    });
  }

  Future<bool> _performRefresh() async {
    try {
      final refreshToken = await _storage.read(key: refreshTokenKey);
      if (refreshToken == null || refreshToken.isEmpty) {
        await _clearTokens();
        return false;
      }

      final response = await _dispatch(
        'POST',
        'auth/refresh',
        body: {'refreshToken': refreshToken},
      );
      if (response.statusCode < 200 || response.statusCode >= 300) {
        await _clearTokens();
        return false;
      }

      final payload = _decode(response);
      if (payload is! Map<String, dynamic>) {
        await _clearTokens();
        return false;
      }
      final accessToken = payload['accessToken'];
      final rotatedRefreshToken = payload['refreshToken'];
      if (accessToken is! String || rotatedRefreshToken is! String) {
        await _clearTokens();
        return false;
      }

      await _storage.write(key: accessTokenKey, value: accessToken);
      await _storage.write(key: refreshTokenKey, value: rotatedRefreshToken);
      return true;
    } catch (_) {
      await _clearTokens();
      return false;
    }
  }

  Object? _decode(http.Response response) {
    final decoded = response.body.isEmpty
        ? null
        : jsonDecode(utf8.decode(response.bodyBytes));
    if (response.statusCode < 200 || response.statusCode >= 300) {
      final rawMessage = decoded is Map<String, dynamic>
          ? decoded['message']
          : null;
      final message = rawMessage is List
          ? rawMessage.join(', ')
          : rawMessage?.toString() ?? 'Request failed';
      throw ApiException(response.statusCode, message);
    }
    return decoded;
  }

  Future<void> _clearTokens() async {
    await _storage.delete(key: accessTokenKey);
    await _storage.delete(key: refreshTokenKey);
  }
}
