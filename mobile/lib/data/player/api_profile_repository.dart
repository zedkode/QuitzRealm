import '../../core/network/api_client.dart';
import '../../core/network/api_exception.dart';
import '../../domain/player/player_profile.dart';

/// Citește profilul de cont. Fără sesiune validă întoarce `null` — jocul are
/// un mod fără cont, deci lipsa profilului nu e o eroare.
abstract class ProfileRepository {
  Future<PlayerProfile?> fetchMe();
}

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
}
