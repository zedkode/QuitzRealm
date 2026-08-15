import 'package:flutter_riverpod/flutter_riverpod.dart';

import '../../core/providers/repository_providers.dart';
import '../../domain/rank/player_rank.dart';

enum LeaderboardStatus { loading, ready, error }

class LeaderboardState {
  const LeaderboardState({
    this.status = LeaderboardStatus.loading,
    this.total = 0,
    this.entries = const [],
    this.myEntry,
  });

  final LeaderboardStatus status;
  final int total;
  final List<LeaderboardEntry> entries;
  final LeaderboardEntry? myEntry;

  /// Poziția mea apare separat doar dacă nu e deja în lista afișată.
  bool get showsMySeparately {
    final mine = myEntry;
    if (mine == null) return false;
    return !entries.any((entry) => entry.userId == mine.userId);
  }
}

class LeaderboardController extends StateNotifier<LeaderboardState> {
  LeaderboardController(this._ref) : super(const LeaderboardState()) {
    load();
  }

  final Ref _ref;

  Future<void> load() async {
    state = const LeaderboardState();
    final repository = _ref.read(leaderboardRepositoryProvider);
    try {
      final page = await repository.fetchTop();
      // Poziția proprie e opțională: fără cont, clasamentul rămâne vizibil.
      LeaderboardEntry? mine;
      try {
        mine = await repository.fetchMyPosition();
      } catch (_) {
        mine = null;
      }
      if (!mounted) return;
      state = LeaderboardState(
        status: LeaderboardStatus.ready,
        total: page.total,
        entries: page.entries,
        myEntry: mine,
      );
    } catch (_) {
      if (mounted) {
        state = const LeaderboardState(status: LeaderboardStatus.error);
      }
    }
  }
}

final leaderboardControllerProvider =
    StateNotifierProvider.autoDispose<LeaderboardController, LeaderboardState>((
      ref,
    ) {
      return LeaderboardController(ref);
    });
