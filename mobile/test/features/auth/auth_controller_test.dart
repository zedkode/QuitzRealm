import 'package:flutter_test/flutter_test.dart';
import 'package:quiz_realm/domain/auth/account_session.dart';
import 'package:quiz_realm/domain/auth/auth_repository.dart';
import 'package:quiz_realm/domain/auth/two_factor_challenge.dart';
import 'package:quiz_realm/features/auth/auth_controller.dart';

class _FakeAuthRepository implements AuthRepository {
  _FakeAuthRepository({this.sessionExists = false, this.logoutThrows = false});

  bool sessionExists;
  bool logoutThrows;
  bool logoutCalled = false;
  int verificationRequests = 0;

  @override
  Future<bool> hasSession() async => sessionExists;

  @override
  Future<TwoFactorChallenge?> login({
    required String email,
    required String password,
  }) async {
    sessionExists = true;
    return null;
  }

  @override
  Future<TwoFactorChallenge?> loginWithGoogle() async {
    sessionExists = true;
    return null;
  }

  @override
  Future<void> completeTwoFactorLogin({
    required String challengeToken,
    required String code,
  }) async => sessionExists = true;

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
  }) async {
    sessionExists = true;
  }

  @override
  Future<void> requestEmailVerification() async {
    verificationRequests += 1;
  }

  @override
  Future<void> logout() async {
    logoutCalled = true;
    if (logoutThrows) throw Exception('serverul a refuzat tokenul');
    sessionExists = false;
  }

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
  Future<void> deleteAccount({String? password}) async => sessionExists = false;
}

Future<void> settle() => Future<void>.delayed(Duration.zero);

void main() {
  test('restaurează sesiunea existentă la pornire', () async {
    final controller = AuthController(_FakeAuthRepository(sessionExists: true));
    addTearDown(controller.dispose);
    await settle();

    expect(controller.state.status, AuthStatus.authenticated);
  });

  test('deconectarea reușită duce la stare neautentificată', () async {
    final repository = _FakeAuthRepository(sessionExists: true);
    final controller = AuthController(repository);
    addTearDown(controller.dispose);
    await settle();

    await controller.logout();

    expect(repository.logoutCalled, isTrue);
    expect(controller.state.status, AuthStatus.unauthenticated);
  });

  test(
    'deconectarea nu rămâne blocată în încărcare dacă serverul refuză tokenul',
    () async {
      final repository = _FakeAuthRepository(
        sessionExists: true,
        logoutThrows: true,
      );
      final controller = AuthController(repository);
      addTearDown(controller.dispose);
      await settle();

      await expectLater(controller.logout(), throwsA(isA<Exception>()));

      expect(controller.state.status, AuthStatus.unauthenticated);
    },
  );

  test(
    'autentificarea eșuată raportează eroarea, nu blochează ecranul',
    () async {
      final controller = AuthController(_FailingLogin());
      addTearDown(controller.dispose);
      await settle();

      await controller.login(email: 'a@b.test', password: 'gresita');

      expect(controller.state.status, AuthStatus.unauthenticated);
      expect(controller.state.hasError, isTrue);
    },
  );
}

class _FailingLogin extends _FakeAuthRepository {
  @override
  Future<TwoFactorChallenge?> login({
    required String email,
    required String password,
  }) async {
    throw Exception('date invalide');
  }
}
