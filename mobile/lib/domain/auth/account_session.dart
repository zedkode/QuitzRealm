/// O sesiune activă = un dispozitiv conectat la cont (`owner-plan.md` §1.5).
///
/// Lista lor e singurul mod în care jucătorul poate observa că altcineva îi
/// folosește contul, deci ecranul trebuie să arate ultima activitate, nu doar
/// numele dispozitivului.
class AccountSession {
  const AccountSession({
    required this.id,
    required this.createdAt,
    required this.lastSeenAt,
    required this.isCurrent,
    this.deviceLabel,
    this.expiresAt,
  });

  final String id;

  /// Eticheta dedusă din `User-Agent`. Poate lipsi pentru sesiuni vechi.
  final String? deviceLabel;
  final DateTime createdAt;
  final DateTime lastSeenAt;
  final DateTime? expiresAt;

  /// Dispozitivul de pe care se face cererea. Nu poate fi închis din listă:
  /// pentru asta există „Deconectare".
  final bool isCurrent;

  static AccountSession fromJson(Map<String, Object?> json) {
    DateTime parse(Object? value) =>
        DateTime.tryParse(value?.toString() ?? '') ?? DateTime.now();

    return AccountSession(
      id: json['id']?.toString() ?? '',
      deviceLabel: json['deviceLabel']?.toString(),
      createdAt: parse(json['createdAt']),
      lastSeenAt: parse(json['lastSeenAt']),
      expiresAt: DateTime.tryParse(json['expiresAt']?.toString() ?? ''),
      isCurrent: json['current'] == true,
    );
  }
}
