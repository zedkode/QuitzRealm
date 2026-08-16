/// Confidențialitatea contului din `owner-plan.md` §4.9 și §2.4.
///
/// Un singur obiect pentru tot ce ține de „cine mă vede și cine îmi poate
/// scrie": pe server e un singur rând, iar două modele separate în aplicație
/// s-ar putea desincroniza după o salvare parțială.
library;

import '../social/social_models.dart' show DmPermission;

/// Cine îți vede pagina de profil (§4.9).
enum ProfileVisibility {
  public('PUBLIC'),
  friends('FRIENDS'),
  private('PRIVATE');

  const ProfileVisibility(this.wireValue);

  final String wireValue;

  static ProfileVisibility fromWire(String? value) => switch (value) {
    'FRIENDS' => ProfileVisibility.friends,
    'PRIVATE' => ProfileVisibility.private,
    _ => ProfileVisibility.public,
  };
}

/// Cine te vede conectat. Distinctă de [ProfileVisibility]: una spune cine
/// îți citește profilul, cealaltă cine află că ești online acum.
enum OnlineVisibility {
  everyone('EVERYONE'),
  friends('FRIENDS'),
  nobody('NOBODY');

  const OnlineVisibility(this.wireValue);

  final String wireValue;

  static OnlineVisibility fromWire(String? value) => switch (value) {
    'EVERYONE' => OnlineVisibility.everyone,
    'NOBODY' => OnlineVisibility.nobody,
    _ => OnlineVisibility.friends,
  };
}

class AccountPrivacy {
  const AccountPrivacy({
    required this.dmPermission,
    required this.profileVisibility,
    required this.onlineVisibility,
    required this.allowMatchInvites,
    required this.chatCensorship,
    required this.chatNotifications,
    required this.dmPermissionLocked,
  });

  final DmPermission dmPermission;
  final ProfileVisibility profileVisibility;
  final OnlineVisibility onlineVisibility;

  /// Invitațiile la partide de la alți jucători.
  final bool allowMatchInvites;

  /// Ascunde limbajul ofensator din chat. Nu oprește moderarea: schimbă doar
  /// ce vede jucătorul, nu ce e permis să se scrie.
  final bool chatCensorship;
  final bool chatNotifications;

  /// Conturile de minor nu pot ridica restricția de mesaje directe. Setarea se
  /// afișează blocată, nu ascunsă — altfel n-ar fi clar de ce nu primesc
  /// mesaje de la necunoscuți.
  final bool dmPermissionLocked;

  static const defaults = AccountPrivacy(
    dmPermission: DmPermission.friendsOnly,
    profileVisibility: ProfileVisibility.public,
    onlineVisibility: OnlineVisibility.friends,
    allowMatchInvites: true,
    chatCensorship: true,
    chatNotifications: true,
    dmPermissionLocked: false,
  );

  static AccountPrivacy fromJson(Object? payload) {
    if (payload is! Map<String, Object?>) return defaults;
    bool flag(String key, bool fallback) {
      final value = payload[key];
      return value is bool ? value : fallback;
    }

    return AccountPrivacy(
      dmPermission: switch (payload['dmPermission']?.toString()) {
        'EVERYONE' => DmPermission.everyone,
        'NOBODY' => DmPermission.nobody,
        _ => DmPermission.friendsOnly,
      },
      profileVisibility: ProfileVisibility.fromWire(
        payload['profileVisibility']?.toString(),
      ),
      onlineVisibility: OnlineVisibility.fromWire(
        payload['onlineVisibility']?.toString(),
      ),
      allowMatchInvites: flag('allowMatchInvites', true),
      chatCensorship: flag('chatCensorship', true),
      chatNotifications: flag('chatNotifications', true),
      dmPermissionLocked: flag('dmPermissionLocked', false),
    );
  }
}
