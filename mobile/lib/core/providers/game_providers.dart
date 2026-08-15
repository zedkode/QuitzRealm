import 'dart:async';

import 'package:flutter_riverpod/flutter_riverpod.dart';

import '../../data/pack/local_round_source.dart';
import '../../data/pack/question_pack_loader.dart';
import '../../data/progress/progress_store.dart';
import '../../domain/battle/round_source.dart';
import '../../domain/campaign/campaign_progress.dart';
import '../../domain/campaign/realm_chapter.dart';
import '../../features/battle/battle_controller.dart';

final questionPackLoaderProvider = Provider<QuestionPackLoader>((ref) {
  return QuestionPackLoader();
});

final progressStoreProvider = Provider<ProgressStore>((ref) {
  return const SharedPreferencesProgressStore();
});

/// Sursa de întrebări pentru un asalt anume din campanie.
final roundSourceProvider = Provider.autoDispose
    .family<RoundSource, BattleTarget>((ref, target) {
      return LocalRoundSource(
        chapter: RealmChapter.byId(target.chapterId),
        stage: RealmChapter.stages[target.stageIndex],
        loader: ref.watch(questionPackLoaderProvider),
      );
    });

/// Progresul campaniei, restaurat de pe dispozitiv la pornire.
class CampaignProgressController extends StateNotifier<CampaignProgress> {
  CampaignProgressController(this._store) : super(CampaignProgress.empty) {
    unawaited(_restore());
  }

  final ProgressStore _store;
  bool _restored = false;

  bool get isRestored => _restored;

  Future<void> _restore() async {
    try {
      final stored = await _store.read();
      if (mounted) state = stored;
    } catch (_) {
      // Progres necitibil: jocul pornește de la zero, dar rămâne jucabil.
    } finally {
      _restored = true;
    }
  }

  Future<void> recordResult({
    required String chapterId,
    required int stageIndex,
    required int stars,
    required int xpGained,
  }) async {
    final updated = state.withResult(
      chapterId: chapterId,
      stageIndex: stageIndex,
      stars: stars,
      xpGained: xpGained,
    );
    if (mounted) state = updated;
    try {
      await _store.write(updated);
    } catch (_) {
      // Salvarea eșuată nu trebuie să întrerupă jocul în curs.
    }
  }

  Future<void> resetCampaign() async {
    if (mounted) state = CampaignProgress.empty;
    await _store.write(CampaignProgress.empty);
  }
}

final campaignProgressProvider =
    StateNotifierProvider<CampaignProgressController, CampaignProgress>((ref) {
      return CampaignProgressController(ref.watch(progressStoreProvider));
    });
