/// Provocarea de viață scurtă emisă de API după parola corectă pentru un cont
/// cu 2FA activ. Nu este o sesiune și nu trebuie păstrată în secure storage.
class TwoFactorChallenge {
  const TwoFactorChallenge({
    required this.token,
    required this.expiresAt,
  });

  final String token;
  final DateTime? expiresAt;

  static TwoFactorChallenge? fromJson(Object? payload) {
    if (payload is! Map<String, dynamic> || payload['twoFactorRequired'] != true) {
      return null;
    }
    final token = payload['challengeToken'];
    if (token is! String || token.isEmpty) return null;
    return TwoFactorChallenge(
      token: token,
      expiresAt: DateTime.tryParse(payload['expiresAt']?.toString() ?? ''),
    );
  }
}
