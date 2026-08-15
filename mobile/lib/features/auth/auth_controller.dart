import 'package:flutter_riverpod/flutter_riverpod.dart';

import '../../core/providers/repository_providers.dart';
import '../../domain/auth/auth_repository.dart';

enum AuthStatus { checking, unauthenticated, loading, authenticated }

class AuthState {
  const AuthState({required this.status, this.hasError = false});

  const AuthState.checking() : this(status: AuthStatus.checking);

  final AuthStatus status;
  final bool hasError;
}

class AuthController extends StateNotifier<AuthState> {
  AuthController(this._repository) : super(const AuthState.checking()) {
    restoreSession();
  }

  final AuthRepository _repository;

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
      await _repository.login(email: email, password: password);
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

  Future<void> register({
    required String username,
    required String email,
    required String password,
    required DateTime birthDate,
  }) async {
    state = const AuthState(status: AuthStatus.loading);
    try {
      await _repository.register(
        username: username,
        email: email,
        password: password,
        birthDate: birthDate,
      );
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
      // Orice s-ar întâmpla cu serverul, ecranul nu are voie să rămână blocat
      // în starea de încărcare.
      if (mounted) state = const AuthState(status: AuthStatus.unauthenticated);
    }
  }
}

final authControllerProvider = StateNotifierProvider<AuthController, AuthState>(
  (ref) {
    return AuthController(ref.watch(authRepositoryProvider));
  },
);
