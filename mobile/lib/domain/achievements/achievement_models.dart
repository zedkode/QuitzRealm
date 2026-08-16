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

class AchievementSummary {
  const AchievementSummary({
    required this.prestigeScore,
    required this.unlockedCount,
  });

  final int prestigeScore;
  final int unlockedCount;

  static AchievementSummary fromJson(Map<String, Object?> json) {
    int read(String key) => json[key] is num
        ? (json[key]! as num).round()
        : int.tryParse(json[key]?.toString() ?? '') ?? 0;
    return AchievementSummary(
      prestigeScore: read('prestigeScore'),
      unlockedCount: read('unlockedCount'),
    );
  }
}
