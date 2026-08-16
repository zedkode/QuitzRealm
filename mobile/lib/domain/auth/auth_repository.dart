import 'account_session.dart';

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

  // --- Securitatea contului (§1.5) ---

  /// Dispozitivele conectate la cont. E singurul mod în care jucătorul poate
  /// observa că altcineva îi folosește contul.
  Future<List<AccountSession>> fetchSessions();

  /// Închide un alt dispozitiv. Sesiunea curentă nu se poate revoca de aici:
  /// pentru asta există deconectarea.
  Future<void> revokeSession(String sessionId);

  /// „Deconectează-mă de peste tot, mai puțin de aici." Întoarce câte sesiuni
  /// s-au închis, ca ecranul să poată confirma o acțiune care altfel n-ar avea
  /// niciun efect vizibil.
  Future<int> revokeOtherSessions();

  /// Schimbă parola cu parola curentă drept dovadă. Serverul închide celelalte
  /// dispozitive, dar păstrează sesiunea de aici.
  Future<void> changePassword({
    required String currentPassword,
    required String newPassword,
  });

  /// Ștergere definitivă. [password] lipsește doar la conturile fără parolă
  /// (create prin Google), unde dovada e sesiunea însăși.
  Future<void> deleteAccount({String? password});
}
