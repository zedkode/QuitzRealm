import 'package:flutter_riverpod/flutter_riverpod.dart';

import '../../core/providers/repository_providers.dart';
import '../../domain/achievements/achievement_models.dart';

enum AchievementsStatus { loading, ready, error }

class AchievementsState {
  const AchievementsState({
    this.status = AchievementsStatus.loading,
    this.items = const [],
    this.summary,
  });

  final AchievementsStatus status;
  final List<AchievementProgress> items;
  final AchievementSummary? summary;

  AchievementsState copyWith({
    AchievementsStatus? status,
    List<AchievementProgress>? items,
    AchievementSummary? summary,
  }) => AchievementsState(
    status: status ?? this.status,
    items: items ?? this.items,
    summary: summary ?? this.summary,
  );
}

class AchievementsController extends StateNotifier<AchievementsState> {
  AchievementsController(this._ref) : super(const AchievementsState()) {
    load();
  }

  final Ref _ref;

  Future<void> setBadgeSlot({
    required int slotIndex,
    String? achievementId,
  }) async {
    await _ref
        .read(achievementRepositoryProvider)
        .setBadgeSlot(slotIndex: slotIndex, achievementId: achievementId);
    final summary = await _ref
        .read(achievementRepositoryProvider)
        .fetchSummary();
    if (mounted) state = state.copyWith(summary: summary);
  }

  Future<void> load() async {
    state = state.copyWith(status: AchievementsStatus.loading);
    try {
      final repository = _ref.read(achievementRepositoryProvider);
      final result = await Future.wait([
        repository.fetchAchievements(),
        repository.fetchSummary(),
      ]);
      if (!mounted) return;
      state = state.copyWith(
        status: AchievementsStatus.ready,
        items: result[0] as List<AchievementProgress>,
        summary: result[1] as AchievementSummary,
      );
    } catch (_) {
      if (mounted) state = state.copyWith(status: AchievementsStatus.error);
    }
  }
}

final achievementsControllerProvider =
    StateNotifierProvider.autoDispose<
      AchievementsController,
      AchievementsState
    >((ref) => AchievementsController(ref));
