import 'package:flutter_riverpod/flutter_riverpod.dart';

import '../../core/providers/repository_providers.dart';
import '../../data/auth/guest_progress_migrator.dart';
import '../../domain/auth/auth_repository.dart';
import '../../domain/auth/two_factor_challenge.dart';

enum AuthStatus {
  checking,
  unauthenticated,
  loading,
  twoFactorRequired,
  authenticated,
}

class AuthState {
  const AuthState({
    required this.status,
    this.hasError = false,
    this.twoFactorChallenge,
  });

  const AuthState.checking() : this(status: AuthStatus.checking);

  final AuthStatus status;
  final bool hasError;
  final TwoFactorChallenge? twoFactorChallenge;
}

class AuthController extends StateNotifier<AuthState> {
  AuthController(this._repository, {this.guestProgressMigrator})
    : super(const AuthState.checking()) {
    restoreSession();
  }

  final AuthRepository _repository;
  final GuestProgressMigrator? guestProgressMigrator;

  Future<void> restoreSession() async {
    final hasSession = await _repository.hasSession();
    if (mounted) {
      state = AuthState(
        status: hasSession
            ? AuthStatus.authenticated
            : AuthStatus.unauthenticated,
      );
    }
  }

  Future<void> login({required String email, required String password}) async {
    state = const AuthState(status: AuthStatus.loading);
    try {
      final challenge = await _repository.login(
        email: email,
        password: password,
      );
      if (!mounted) return;
      state = challenge == null
          ? const AuthState(status: AuthStatus.authenticated)
          : AuthState(
              status: AuthStatus.twoFactorRequired,
              twoFactorChallenge: challenge,
            );
    } catch (_) {
      if (mounted) {
        state = const AuthState(
          status: AuthStatus.unauthenticated,
          hasError: true,
        );
      }
    }
  }

  Future<void> loginWithGoogle() async {
    state = const AuthState(status: AuthStatus.loading);
    try {
      final challenge = await _repository.loginWithGoogle();
      if (!mounted) return;
      state = challenge == null
          ? const AuthState(status: AuthStatus.authenticated)
          : AuthState(
              status: AuthStatus.twoFactorRequired,
              twoFactorChallenge: challenge,
            );
    } catch (_) {
      if (mounted) {
        state = const AuthState(
          status: AuthStatus.unauthenticated,
          hasError: true,
        );
      }
    }
  }

  Future<void> completeTwoFactorLogin(String code) async {
    final challenge = state.twoFactorChallenge;
    if (challenge == null) {
      state = const AuthState(
        status: AuthStatus.unauthenticated,
        hasError: true,
      );
      return;
    }
    state = AuthState(
      status: AuthStatus.loading,
      twoFactorChallenge: challenge,
    );
    try {
      await _repository.completeTwoFactorLogin(
        challengeToken: challenge.token,
        code: code,
      );
      if (mounted) state = const AuthState(status: AuthStatus.authenticated);
    } catch (_) {
      if (mounted) {
        state = AuthState(
          status: AuthStatus.twoFactorRequired,
          hasError: true,
          twoFactorChallenge: challenge,
        );
      }
    }
  }

  Future<void> cancelTwoFactorLogin() async {
    if (mounted) state = const AuthState(status: AuthStatus.unauthenticated);
  }

  Future<void> register({
    required String username,
    required String email,
    required String password,
    required DateTime birthDate,
    String? captchaToken,
  }) async {
    state = const AuthState(status: AuthStatus.loading);
    try {
      await _repository.register(
        username: username,
        email: email,
        password: password,
        birthDate: birthDate,
        captchaToken: captchaToken,
      );
      // Migrarea este repetabilă: dacă rețeaua cade acum, nu sacrificăm contul
      // proaspăt creat; următoarea înregistrare nu are loc, dar transferul se
      // poate relua din ecranul de cont când este disponibil.
      try {
        await guestProgressMigrator?.migrateAfterRegistration();
      } catch (_) {
        // Progresul rămâne sigur în stocarea locală până la reluare.
      }
      if (mounted) state = const AuthState(status: AuthStatus.authenticated);
    } catch (_) {
      if (mounted) {
        state = const AuthState(
          status: AuthStatus.unauthenticated,
          hasError: true,
        );
      }
    }
  }

  Future<void> logout() async {
    state = const AuthState(status: AuthStatus.loading);
    try {
      await _repository.logout();
    } finally {
      if (mounted) state = const AuthState(status: AuthStatus.unauthenticated);
    }
  }
}

final authControllerProvider = StateNotifierProvider<AuthController, AuthState>(
  (ref) {
    return AuthController(
      ref.watch(authRepositoryProvider),
      guestProgressMigrator: ref.watch(guestProgressMigratorProvider),
    );
  },
);
