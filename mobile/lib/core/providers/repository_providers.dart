import 'package:flutter_riverpod/flutter_riverpod.dart';
import 'package:flutter_secure_storage/flutter_secure_storage.dart';
import 'package:http/http.dart' as http;

import '../../data/auth/api_auth_repository.dart';
import '../../data/auth/guest_progress_migrator.dart';
import '../../data/progress/progress_store.dart';
import '../../data/question/api_question_repository.dart';
import '../../data/player/api_profile_repository.dart';
import '../../data/rank/api_leaderboard_repository.dart';
import '../../data/social/api_social_repository.dart';
import '../../domain/auth/account_session.dart';
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

/// Dispozitive conectate, folosite numai în pagina de securitate a contului.
/// Nu păstrăm lista global: după revocare sau schimbare de parolă trebuie
/// reîncărcată din server, nu afișată din cache ca și cum ar fi încă validă.
final accountSessionsProvider = FutureProvider.autoDispose<List<AccountSession>>(
  (ref) => ref.watch(authRepositoryProvider).fetchSessions(),
);

final guestProgressMigratorProvider = Provider<GuestProgressMigrator>((ref) {
  return GuestProgressMigrator(
    ref.watch(authRepositoryProvider),
    ref.watch(secureStorageProvider),
    const SharedPreferencesProgressStore(),
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
