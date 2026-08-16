import 'package:flutter_riverpod/flutter_riverpod.dart';
import 'package:flutter_secure_storage/flutter_secure_storage.dart';
import 'package:http/http.dart' as http;

import '../../data/auth/api_auth_repository.dart';
import '../../data/question/api_question_repository.dart';
import '../../data/player/api_profile_repository.dart';
import '../../data/rank/api_leaderboard_repository.dart';
import '../../data/social/api_social_repository.dart';
import '../../domain/auth/auth_repository.dart';
import '../../domain/question/question_repository.dart';
import '../../domain/player/player_profile.dart';
import '../../domain/rank/leaderboard_repository.dart';
import '../../domain/social/social_repository.dart';
import '../config/app_config.dart';
import '../network/api_client.dart';
import '../network/realtime_client.dart';

final secureStorageProvider = Provider<FlutterSecureStorage>((ref) {
  return const FlutterSecureStorage(aOptions: AndroidOptions());
});

final httpClientProvider = Provider<http.Client>((ref) {
  final client = http.Client();
  ref.onDispose(client.close);
  return client;
});

final apiClientProvider = Provider<ApiClient>((ref) {
  return ApiClient(
    AppConfig.apiBaseUri,
    ref.watch(httpClientProvider),
    ref.watch(secureStorageProvider),
  );
});

final authRepositoryProvider = Provider<AuthRepository>((ref) {
  return ApiAuthRepository(
    ref.watch(apiClientProvider),
    ref.watch(secureStorageProvider),
  );
});

final questionRepositoryProvider = Provider<QuestionRepository>((ref) {
  return ApiQuestionRepository(ref.watch(apiClientProvider));
});

final leaderboardRepositoryProvider = Provider<LeaderboardRepository>((ref) {
  return ApiLeaderboardRepository(ref.watch(apiClientProvider));
});

final profileRepositoryProvider = Provider<ProfileRepository>((ref) {
  return ApiProfileRepository(ref.watch(apiClientProvider));
});

/// Profilul de cont pentru ecranul principal. `null` = joc fără cont, ceea ce
/// e o stare validă, nu o eroare.
final playerProfileProvider = FutureProvider.autoDispose<PlayerProfile?>((
  ref,
) async {
  return ref.watch(profileRepositoryProvider).fetchMe();
});

final socialRepositoryProvider = Provider<SocialRepository>((ref) {
  return ApiSocialRepository(ref.watch(apiClientProvider));
});

final realtimeClientProvider = Provider<RealtimeClient>((ref) {
  final client = RealtimeClient(
    AppConfig.realtimeBaseUri,
    ref.watch(secureStorageProvider),
  );
  ref.onDispose(client.dispose);
  return client;
});
