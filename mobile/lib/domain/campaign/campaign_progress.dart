import 'realm_chapter.dart';

/// Progresul jucătorului în campanie: stele per asalt și experiență totală.
/// Este imuabil — fiecare rezultat produce un progres nou.
final class CampaignProgress {
  const CampaignProgress({this.starsByStage = const {}, this.xp = 0})
    : assert(xp >= 0);

  /// Cheie: `<chapterId>/<stageIndex>`. Valoare: 0-3 stele.
  final Map<String, int> starsByStage;
  final int xp;

  static const empty = CampaignProgress();

  /// XP necesar pentru a trece de la nivelul [level] la următorul.
  static int xpForLevel(int level) => 300 + (level - 1) * 180;

  static String stageKey(String chapterId, int stageIndex) =>
      '$chapterId/$stageIndex';

  int get totalStars =>
      starsByStage.values.fold(0, (total, stars) => total + stars);

  int get level {
    var level = 1;
    var remaining = xp;
    while (remaining >= xpForLevel(level)) {
      remaining -= xpForLevel(level);
      level++;
    }
    return level;
  }

  int get xpIntoLevel {
    var level = 1;
    var remaining = xp;
    while (remaining >= xpForLevel(level)) {
      remaining -= xpForLevel(level);
      level++;
    }
    return remaining;
  }

  double get levelProgress => xpIntoLevel / xpForLevel(level);

  int starsFor(String chapterId, int stageIndex) =>
      starsByStage[stageKey(chapterId, stageIndex)] ?? 0;

  int starsForChapter(String chapterId) {
    return RealmChapter.stages.fold(
      0,
      (total, stage) => total + starsFor(chapterId, stage.index),
    );
  }

  bool isChapterUnlocked(RealmChapter chapter) =>
      totalStars >= chapter.starsToUnlock;

  /// Un asalt e deblocat dacă ținutul e deschis și asaltul anterior a fost
  /// câștigat cu cel puțin o stea.
  bool isStageUnlocked(RealmChapter chapter, int stageIndex) {
    if (!isChapterUnlocked(chapter)) return false;
    if (stageIndex == 0) return true;
    return starsFor(chapter.id, stageIndex - 1) > 0;
  }

  /// Aplică rezultatul unui asalt. Stelele se păstrează la maximul obținut,
  /// dar XP-ul se acumulează la fiecare reluare.
  CampaignProgress withResult({
    required String chapterId,
    required int stageIndex,
    required int stars,
    required int xpGained,
  }) {
    assert(stars >= 0 && stars <= 3);
    assert(xpGained >= 0);
    final key = stageKey(chapterId, stageIndex);
    final previous = starsByStage[key] ?? 0;
    return CampaignProgress(
      starsByStage: {
        ...starsByStage,
        key: stars > previous ? stars : previous,
      },
      xp: xp + xpGained,
    );
  }

  Map<String, Object?> toJson() => {'xp': xp, 'stars': starsByStage};

  static CampaignProgress fromJson(Map<String, Object?> json) {
    final rawStars = json['stars'];
    final stars = <String, int>{};
    if (rawStars is Map) {
      for (final entry in rawStars.entries) {
        final value = entry.value;
        if (value is int && value >= 0 && value <= 3) {
          stars[entry.key.toString()] = value;
        }
      }
    }
    final rawXp = json['xp'];
    return CampaignProgress(
      starsByStage: stars,
      xp: rawXp is int && rawXp >= 0 ? rawXp : 0,
    );
  }
}
