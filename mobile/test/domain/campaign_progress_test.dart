import 'package:flutter_test/flutter_test.dart';
import 'package:quiz_realm/domain/campaign/campaign_progress.dart';
import 'package:quiz_realm/domain/campaign/realm_chapter.dart';

void main() {
  group('nivel și experiență', () {
    test('începe la nivelul 1 fără experiență', () {
      expect(CampaignProgress.empty.level, 1);
      expect(CampaignProgress.empty.xpIntoLevel, 0);
      expect(CampaignProgress.empty.levelProgress, 0);
    });

    test('urcă nivelul când pragul e depășit', () {
      const progress = CampaignProgress(xp: 300);
      expect(progress.level, 2);
      expect(progress.xpIntoLevel, 0);
    });

    test('păstrează restul de experiență în nivelul curent', () {
      const progress = CampaignProgress(xp: 350);
      expect(progress.level, 2);
      expect(progress.xpIntoLevel, 50);
      expect(progress.levelProgress, closeTo(50 / 480, 0.001));
    });
  });

  group('stele și deblocări', () {
    test('primul ținut e deschis, al doilea nu', () {
      final first = RealmChapter.all.first;
      final second = RealmChapter.all[1];
      expect(CampaignProgress.empty.isChapterUnlocked(first), isTrue);
      expect(CampaignProgress.empty.isChapterUnlocked(second), isFalse);
    });

    test('ținutul se deschide când sunt destule stele', () {
      final second = RealmChapter.all[1];
      final progress = CampaignProgress(
        starsByStage: {
          CampaignProgress.stageKey('istorie', 0): 3,
          CampaignProgress.stageKey('istorie', 1): 3,
        },
      );
      expect(progress.totalStars, 6);
      expect(progress.isChapterUnlocked(second), isTrue);
    });

    test('asaltul următor cere o stea în cel precedent', () {
      final chapter = RealmChapter.all.first;
      expect(CampaignProgress.empty.isStageUnlocked(chapter, 0), isTrue);
      expect(CampaignProgress.empty.isStageUnlocked(chapter, 1), isFalse);

      final progress = CampaignProgress.empty.withResult(
        chapterId: chapter.id,
        stageIndex: 0,
        stars: 1,
        xpGained: 40,
      );
      expect(progress.isStageUnlocked(chapter, 1), isTrue);
    });
  });

  group('withResult', () {
    test('păstrează cel mai bun rezultat, dar acumulează experiența', () {
      final first = CampaignProgress.empty.withResult(
        chapterId: 'istorie',
        stageIndex: 0,
        stars: 3,
        xpGained: 100,
      );
      final second = first.withResult(
        chapterId: 'istorie',
        stageIndex: 0,
        stars: 1,
        xpGained: 40,
      );

      expect(second.starsFor('istorie', 0), 3);
      expect(second.xp, 140);
    });
  });

  group('serializare', () {
    test('dus-întors prin JSON', () {
      final progress = CampaignProgress.empty.withResult(
        chapterId: 'romania',
        stageIndex: 2,
        stars: 2,
        xpGained: 210,
      );
      final restored = CampaignProgress.fromJson(progress.toJson());

      expect(restored.xp, 210);
      expect(restored.starsFor('romania', 2), 2);
    });

    test('ignoră valorile invalide din stocare', () {
      final restored = CampaignProgress.fromJson({
        'xp': -20,
        'stars': {'romania/0': 9, 'romania/1': 2},
      });

      expect(restored.xp, 0);
      expect(restored.starsFor('romania', 0), 0);
      expect(restored.starsFor('romania', 1), 2);
    });
  });
}
