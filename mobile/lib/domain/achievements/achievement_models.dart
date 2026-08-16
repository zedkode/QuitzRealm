enum AchievementRarity { common, rare, epic, legendary, mythic }

class AchievementProgress {
  const AchievementProgress({
    required this.id,
    required this.title,
    required this.description,
    required this.rarity,
    required this.points,
    required this.progressCurrent,
    required this.target,
    this.unlockedAt,
    this.isHidden = false,
  });

  final String id;
  final String title;
  final String description;
  final AchievementRarity rarity;
  final int points;
  final int progressCurrent;
  final int target;
  final DateTime? unlockedAt;
  final bool isHidden;

  bool get isUnlocked => unlockedAt != null;
  double get progress =>
      target == 0 ? 1 : (progressCurrent / target).clamp(0, 1);

  static AchievementProgress fromJson(Map<String, Object?> json) {
    int number(String key) => json[key] is num
        ? (json[key]! as num).round()
        : int.tryParse(json[key]?.toString() ?? '') ?? 0;
    return AchievementProgress(
      id: json['id']?.toString() ?? '',
      title: json['title']?.toString() ?? '',
      description: json['description']?.toString() ?? '',
      rarity: switch (json['rarity']?.toString()) {
        'RARE' => AchievementRarity.rare,
        'EPIC' => AchievementRarity.epic,
        'LEGENDARY' => AchievementRarity.legendary,
        'MYTHIC' => AchievementRarity.mythic,
        _ => AchievementRarity.common,
      },
      points: number('points'),
      progressCurrent: number('progressCurrent'),
      target: number('target'),
      unlockedAt: DateTime.tryParse(json['unlockedAt']?.toString() ?? ''),
      isHidden: json['isHidden'] == true,
    );
  }
}

class EquippedAchievementBadge {
  const EquippedAchievementBadge({
    required this.slotIndex,
    this.achievementId,
    this.title,
    this.rarity,
  });

  final int slotIndex;
  final String? achievementId;
  final String? title;
  final AchievementRarity? rarity;

  static EquippedAchievementBadge fromJson(Map<String, Object?> json) {
    final achievement = json['achievement'];
    final rawAchievement = achievement is Map<String, Object?>
        ? achievement
        : null;
    final slot = json['slotIndex'];
    return EquippedAchievementBadge(
      slotIndex: slot is num
          ? slot.round()
          : int.tryParse(slot?.toString() ?? '') ?? 0,
      achievementId: rawAchievement?['id']?.toString(),
      title: rawAchievement?['title']?.toString(),
      rarity: switch (rawAchievement?['rarity']?.toString()) {
        'RARE' => AchievementRarity.rare,
        'EPIC' => AchievementRarity.epic,
        'LEGENDARY' => AchievementRarity.legendary,
        'MYTHIC' => AchievementRarity.mythic,
        'COMMON' => AchievementRarity.common,
        _ => null,
      },
    );
  }
}

class ProfileShowcaseAchievement {
  const ProfileShowcaseAchievement({
    required this.position,
    required this.achievementId,
    required this.title,
    required this.rarity,
  });

  final int position;
  final String achievementId;
  final String title;
  final AchievementRarity rarity;

  static ProfileShowcaseAchievement? fromJson(Map<String, Object?> json) {
    final achievement = json['achievement'];
    if (achievement is! Map<String, Object?>) return null;
    final id = achievement['id']?.toString() ?? '';
    if (id.isEmpty) return null;
    final rawPosition = json['position'];
    return ProfileShowcaseAchievement(
      position: rawPosition is num
          ? rawPosition.round()
          : int.tryParse(rawPosition?.toString() ?? '') ?? 0,
      achievementId: id,
      title: achievement['title']?.toString() ?? '',
      rarity: switch (achievement['rarity']?.toString()) {
        'RARE' => AchievementRarity.rare,
        'EPIC' => AchievementRarity.epic,
        'LEGENDARY' => AchievementRarity.legendary,
        'MYTHIC' => AchievementRarity.mythic,
        _ => AchievementRarity.common,
      },
    );
  }
}

class AchievementSummary {
  const AchievementSummary({
    required this.prestigeScore,
    required this.unlockedCount,
    this.badges = const [],
    this.showcase = const [],
  });

  final int prestigeScore;
  final int unlockedCount;
  final List<EquippedAchievementBadge> badges;
  final List<ProfileShowcaseAchievement> showcase;

  static AchievementSummary fromJson(Map<String, Object?> json) {
    int read(String key) => json[key] is num
        ? (json[key]! as num).round()
        : int.tryParse(json[key]?.toString() ?? '') ?? 0;
    return AchievementSummary(
      prestigeScore: read('prestigeScore'),
      unlockedCount: read('unlockedCount'),
      badges: json['badges'] is List
          ? (json['badges'] as List)
                .whereType<Map<String, Object?>>()
                .map(EquippedAchievementBadge.fromJson)
                .toList(growable: false)
          : const [],
      showcase: json['showcase'] is List
          ? (json['showcase'] as List)
                .whereType<Map<String, Object?>>()
                .map(ProfileShowcaseAchievement.fromJson)
                .whereType<ProfileShowcaseAchievement>()
                .toList(growable: false)
          : const [],
    );
  }
}
