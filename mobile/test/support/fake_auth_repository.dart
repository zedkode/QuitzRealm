import 'package:quiz_realm/domain/auth/auth_repository.dart';

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
  Future<void> login({
    required String email,
    required String password,
  }) async => signedIn = true;

  @override
  Future<void> register({
    required String username,
    required String email,
    required String password,
    required DateTime birthDate,
  }) async => signedIn = true;

  @override
  Future<void> logout() async => signedIn = false;

  @override
  Future<void> requestEmailVerification() async {}
}
