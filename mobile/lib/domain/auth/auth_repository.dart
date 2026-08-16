import 'account_session.dart';
import 'two_factor_challenge.dart';

abstract class AuthRepository {
  Future<bool> hasSession();

  /// Întoarce o provocare numai când contul are 2FA activ; în caz contrar,
  /// tokenurile sunt salvate și rezultatul este `null`.
  Future<TwoFactorChallenge?> login({
    required String email,
    required String password,
  });

  /// Deschide Google OAuth în browserul sistemului și finalizează callback-ul
  /// mobil printr-un cod de schimb unic.
  Future<TwoFactorChallenge?> loginWithGoogle();

  /// Finalizează provocarea TOTP sau codul de recuperare primit după parolă.
  Future<void> completeTwoFactorLogin({
    required String challengeToken,
    required String code,
  });

  /// Cere un link cu expirare scurtă. API-ul răspunde identic pentru emailuri
  /// existente sau inexistente, pentru a nu divulga dacă un cont există.
  Future<void> requestPasswordReset(String email);

  /// Convertește o singură dată progresul necompetitiv din campania jucată ca
  /// invitat. Serverul reduce payloadul și nu acceptă ELO, monede ori inventar.
  Future<void> migrateGuestProgress({
    required String guestId,
    required Map<String, Object?> campaignProgress,
  });

  Future<void> register({
    required String username,
    required String email,
    required String password,
    required DateTime birthDate,
    String? captchaToken,
  });

  Future<void> logout();

  /// Cere un link nou de confirmare a adresei. Fără email confirmat, serverul
  /// refuză intrarea în coada ranked (§1.3).
  Future<void> requestEmailVerification();

  // --- Securitatea contului (§1.5) ---
  Future<List<AccountSession>> fetchSessions();
  Future<void> revokeSession(String sessionId);
  Future<int> revokeOtherSessions();

  /// Începe configurarea TOTP și întoarce URI-ul standard care poate fi scanat
  /// de orice aplicație de autentificare. Secretul rămâne inactiv până la
  /// confirmarea codului.
  Future<String> startTwoFactorEnrollment({required String currentPassword});

  /// Confirmă primul cod TOTP și întoarce codurile de recuperare, afișate o
  /// singură dată utilizatorului.
  Future<List<String>> confirmTwoFactorEnrollment({
    required String currentPassword,
    required String code,
  });

  /// Dezactivează 2FA numai după parolă și un cod valid TOTP/recuperare.
  Future<void> disableTwoFactor({
    required String currentPassword,
    required String code,
  });

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
