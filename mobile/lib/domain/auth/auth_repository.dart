abstract class AuthRepository {
  Future<bool> hasSession();

  Future<void> login({required String email, required String password});

  Future<void> register({
    required String username,
    required String email,
    required String password,
    /// Age gate: serverul refuză conturile sub vârsta minimă.
    required DateTime birthDate,
  });

  Future<void> logout();

  /// Cere un link nou de confirmare a adresei. Fără email confirmat, serverul
  /// refuză intrarea în coada ranked (§1.3).
  Future<void> requestEmailVerification();
}
