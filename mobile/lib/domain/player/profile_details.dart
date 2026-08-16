/// Profilul complet de jucător din `owner-plan.md` §4.
///
/// Vine într-un singur răspuns (`GET /users/me/profile`), fiindcă ecranul de
/// profil le arată pe toate deodată: identitate, progres, cosmetice, linkuri,
/// confidențialitate și regiune. Cinci apeluri paralele ar face pagina să
/// apară în cinci pași, cu antetul sărind la fiecare.
library;

import '../rank/player_rank.dart';
import 'account_privacy.dart';
import 'profile_cosmetics.dart';

/// Statusul custom (§4.4). Serverul trimite `null` când a expirat, deci
/// aplicația nu are de verificat nicio dată de expirare ca să decidă afișarea.
class ProfileStatus {
  const ProfileStatus({this.text, this.emoji, this.expiresAt});

  final String? text;
  final String? emoji;
  final DateTime? expiresAt;

  bool get isEmpty => (text == null || text!.isEmpty) && emoji == null;

  static ProfileStatus? fromJson(Object? payload) {
    if (payload is! Map<String, Object?>) return null;
    final status = ProfileStatus(
      text: payload['text']?.toString(),
      emoji: payload['emoji']?.toString(),
      expiresAt: DateTime.tryParse(payload['expiresAt']?.toString() ?? ''),
    );
    return status.isEmpty ? null : status;
  }
}

/// Un link extern de pe profil (§4.6).
class ProfileLink {
  const ProfileLink({
    required this.id,
    required this.label,
    required this.url,
    required this.verified,
  });

  final String id;
  final String label;
  final String url;

  /// Domeniul a trecut lista de platforme acceptate la momentul salvării.
  final bool verified;

  static ProfileLink fromJson(Map<String, Object?> json) {
    return ProfileLink(
      id: json['id']?.toString() ?? '',
      label: json['label']?.toString() ?? '',
      url: json['url']?.toString() ?? '',
      verified: json['verified'] == true,
    );
  }
}

/// Țara declarată și cooldown-ul de schimbare (§10.2).
class RegionSettings {
  const RegionSettings({
    this.countryCode,
    this.supportedCountries = const [],
    this.changeAvailableAt,
  });

  final String? countryCode;
  final List<String> supportedCountries;

  /// Când se poate schimba din nou. `null` = acum.
  final DateTime? changeAvailableAt;

  bool get canChange => changeAvailableAt == null;

  static const empty = RegionSettings();

  static RegionSettings fromJson(Object? payload) {
    if (payload is! Map<String, Object?>) return empty;
    final countries = payload['supportedCountries'];
    return RegionSettings(
      countryCode: payload['countryCode']?.toString(),
      supportedCountries: countries is List
          ? countries.map((code) => code.toString()).toList(growable: false)
          : const [],
      changeAvailableAt: DateTime.tryParse(
        payload['changeAvailableAt']?.toString() ?? '',
      ),
    );
  }
}

/// Ce poate face contul, derivat pe server din email confirmat și vârstă (§1.3).
class AccountCapabilities {
  const AccountCapabilities({
    this.emailVerified = false,
    this.isMinor = true,
    this.canPlayRanked = false,
    this.canUseGlobalChat = false,
    this.canPostExternalLinks = false,
  });

  final bool emailVerified;
  final bool isMinor;
  final bool canPlayRanked;
  final bool canUseGlobalChat;
  final bool canPostExternalLinks;

  static const none = AccountCapabilities();

  static AccountCapabilities fromJson(Object? payload) {
    if (payload is! Map<String, Object?>) return none;
    bool flag(String key) => payload[key] == true;
    return AccountCapabilities(
      emailVerified: flag('emailVerified'),
      // Absența datei se citește ca minor, la fel ca pe server: e alegerea
      // prudentă, nu o presupunere despre utilizator.
      isMinor: payload['isMinor'] != false,
      canPlayRanked: flag('canPlayRanked'),
      canUseGlobalChat: flag('canUseGlobalChat'),
      canPostExternalLinks: flag('canPostExternalLinks'),
    );
  }
}

class ProfileDetails {
  const ProfileDetails({
    required this.id,
    required this.username,
    required this.displayName,
    required this.rank,
    required this.equipped,
    this.email,
    this.authProvider = 'email',
    this.createdAt,
    this.level = 1,
    this.xp = 0,
    this.coins = 0,
    this.correctAnswers = 0,
    this.matchesPlayed = 0,
    this.leaderboardPosition,
    this.capabilities = AccountCapabilities.none,
    this.trustTier = 0,
    this.trustTierKey = 'newcomer',
    this.bio,
    this.status,
    this.themeAccent = 'gold',
    this.themeAccents = const ['gold'],
    this.cosmetics = const [],
    this.links = const [],
    this.canPublishLinks = false,
    this.maxLinks = 4,
    this.privacy = AccountPrivacy.defaults,
    this.region = RegionSettings.empty,
  });

  final String id;
  final String username;
  final String displayName;
  final String? email;

  /// `google` sau `email`, pentru secțiunea „Cont conectat".
  final String authProvider;
  final DateTime? createdAt;

  final PlayerRank rank;
  final int level;
  final int xp;
  final int coins;
  final int correctAnswers;
  final int matchesPlayed;
  final int? leaderboardPosition;

  final AccountCapabilities capabilities;
  final int trustTier;
  final String trustTierKey;

  final String? bio;
  final ProfileStatus? status;
  final String themeAccent;
  final List<String> themeAccents;

  final EquippedCosmetics equipped;
  final List<CosmeticItem> cosmetics;

  final List<ProfileLink> links;

  /// Serverul decide dacă linkurile sunt deblocate (§4.6: T3 + email
  /// confirmat + major). Aplicația doar arată sau ascunde butonul.
  final bool canPublishLinks;
  final int maxLinks;

  final AccountPrivacy privacy;
  final RegionSettings region;

  /// Cosmeticele unui tip, în ordinea din catalog.
  List<CosmeticItem> cosmeticsOf(CosmeticKind kind) {
    return cosmetics
        .where((cosmetic) => cosmetic.kind == kind)
        .toList(growable: false);
  }

  static ProfileDetails fromJson(Map<String, Object?> json) {
    int? asInt(Object? value) =>
        value is num ? value.round() : int.tryParse(value?.toString() ?? '');

    final rank = json['rank'];
    final cosmetics = json['cosmetics'];
    final links = json['links'];
    final accents = json['themeAccents'];

    return ProfileDetails(
      id: json['id']?.toString() ?? '',
      username: json['username']?.toString() ?? '',
      displayName:
          json['displayName']?.toString() ?? json['username']?.toString() ?? '',
      email: json['email']?.toString(),
      authProvider: json['authProvider']?.toString() ?? 'email',
      createdAt: DateTime.tryParse(json['createdAt']?.toString() ?? ''),
      rank: rank is Map<String, Object?>
          ? PlayerRank.fromJson(rank)
          : PlayerRank.unranked,
      level: asInt(json['level']) ?? 1,
      xp: asInt(json['xp']) ?? 0,
      coins: asInt(json['coins']) ?? 0,
      correctAnswers: asInt(json['correctAnswers']) ?? 0,
      matchesPlayed: asInt(json['matchesPlayed']) ?? 0,
      leaderboardPosition: asInt(json['leaderboardPosition']),
      capabilities: AccountCapabilities.fromJson(json['capabilities']),
      trustTier: asInt(json['trustTier']) ?? 0,
      trustTierKey: json['trustTierKey']?.toString() ?? 'newcomer',
      bio: json['bio']?.toString(),
      status: ProfileStatus.fromJson(json['status']),
      themeAccent: json['themeAccent']?.toString() ?? 'gold',
      themeAccents: accents is List
          ? accents.map((accent) => accent.toString()).toList(growable: false)
          : const ['gold'],
      equipped: EquippedCosmetics.fromJson(json['equipped']),
      cosmetics: cosmetics is List
          ? cosmetics
                .whereType<Map<String, Object?>>()
                .map(CosmeticItem.fromJson)
                .whereType<CosmeticItem>()
                .toList(growable: false)
          : const [],
      links: links is List
          ? links
                .whereType<Map<String, Object?>>()
                .map(ProfileLink.fromJson)
                .toList(growable: false)
          : const [],
      canPublishLinks: json['canPublishLinks'] == true,
      maxLinks: asInt(json['maxLinks']) ?? 4,
      privacy: AccountPrivacy.fromJson(json['privacy']),
      region: RegionSettings.fromJson(json['region']),
    );
  }
}

/// Profilul altui jucător (§4.9).
///
/// Când [visible] e fals, serverul a trimis doar identitatea. Nu e o eroare:
/// jucătorul există și are un profil închis, iar ecranul trebuie să spună exact
/// asta, nu „nu s-a putut încărca".
class PublicProfile {
  const PublicProfile({
    required this.id,
    required this.username,
    required this.displayName,
    required this.rank,
    required this.equipped,
    required this.visible,
    this.level = 1,
    this.xp = 0,
    this.correctAnswers = 0,
    this.matchesPlayed = 0,
    this.leaderboardPosition,
    this.createdAt,
    this.bio,
    this.status,
    this.themeAccent = 'gold',
    this.links = const [],
  });

  final String id;
  final String username;
  final String displayName;
  final PlayerRank rank;
  final EquippedCosmetics equipped;
  final bool visible;
  final int level;
  final int xp;
  final int correctAnswers;
  final int matchesPlayed;
  final int? leaderboardPosition;
  final DateTime? createdAt;
  final String? bio;
  final ProfileStatus? status;
  final String themeAccent;
  final List<ProfileLink> links;

  static PublicProfile fromJson(Map<String, Object?> json) {
    int? asInt(Object? value) =>
        value is num ? value.round() : int.tryParse(value?.toString() ?? '');
    final rank = json['rank'];
    final links = json['links'];

    return PublicProfile(
      id: json['id']?.toString() ?? '',
      username: json['username']?.toString() ?? '',
      displayName:
          json['displayName']?.toString() ?? json['username']?.toString() ?? '',
      rank: rank is Map<String, Object?>
          ? PlayerRank.fromJson(rank)
          : PlayerRank.unranked,
      equipped: EquippedCosmetics.fromJson(json['equipped']),
      visible: json['visible'] == true,
      level: asInt(json['level']) ?? 1,
      xp: asInt(json['xp']) ?? 0,
      correctAnswers: asInt(json['correctAnswers']) ?? 0,
      matchesPlayed: asInt(json['matchesPlayed']) ?? 0,
      leaderboardPosition: asInt(json['leaderboardPosition']),
      createdAt: DateTime.tryParse(json['createdAt']?.toString() ?? ''),
      bio: json['bio']?.toString(),
      status: ProfileStatus.fromJson(json['status']),
      themeAccent: json['themeAccent']?.toString() ?? 'gold',
      links: links is List
          ? links
                .whereType<Map<String, Object?>>()
                .map(ProfileLink.fromJson)
                .toList(growable: false)
          : const [],
    );
  }
}
