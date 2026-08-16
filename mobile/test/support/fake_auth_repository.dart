import 'package:quiz_realm/domain/auth/account_session.dart';
import 'package:quiz_realm/domain/auth/auth_repository.dart';
import 'package:quiz_realm/domain/auth/two_factor_challenge.dart';

/// Sesiune de test, fără stocare securizată.
///
/// `flutter_secure_storage` e un plugin de platformă: în teste nu există canal
/// nativ, iar repository-ul real aruncă `MissingPluginException` înainte ca
/// ecranul să apuce să se deseneze.
class FakeAuthRepository implements AuthRepository {
  FakeAuthRepository({this.signedIn = false});

  bool signedIn;

  @override
  Future<bool> hasSession() async => signedIn;

  @override
  Future<TwoFactorChallenge?> login({
    required String email,
    required String password,
  }) async {
    signedIn = true;
    return null;
  }

  @override
  Future<TwoFactorChallenge?> loginWithGoogle() async {
    signedIn = true;
    return null;
  }

  @override
  Future<void> completeTwoFactorLogin({
    required String challengeToken,
    required String code,
  }) async => signedIn = true;

  @override
  Future<void> requestPasswordReset(String email) async {}

  @override
  Future<void> migrateGuestProgress({
    required String guestId,
    required Map<String, Object?> campaignProgress,
  }) async {}

  @override
  Future<void> register({
    required String username,
    required String email,
    required String password,
    required DateTime birthDate,
    String? captchaToken,
  }) async => signedIn = true;

  @override
  Future<void> logout() async => signedIn = false;

  @override
  Future<void> requestEmailVerification() async {}

  @override
  Future<List<AccountSession>> fetchSessions() async => const [];

  @override
  Future<void> revokeSession(String sessionId) async {}

  @override
  Future<int> revokeOtherSessions() async => 0;

  @override
  Future<String> startTwoFactorEnrollment({
    required String currentPassword,
  }) async => 'otpauth://totp/QuizRealm:test?secret=TEST';

  @override
  Future<List<String>> confirmTwoFactorEnrollment({
    required String currentPassword,
    required String code,
  }) async => const ['AAAAA-BBBBB'];

  @override
  Future<void> disableTwoFactor({
    required String currentPassword,
    required String code,
  }) async {}

  @override
  Future<void> changePassword({
    required String currentPassword,
    required String newPassword,
  }) async {}

  @override
  Future<void> deleteAccount({String? password}) async => signedIn = false;
}
