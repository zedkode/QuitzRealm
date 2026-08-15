import 'package:flutter_riverpod/flutter_riverpod.dart';
import 'package:go_router/go_router.dart';

import '../../domain/campaign/realm_chapter.dart';
import '../../features/auth/account_screen.dart';
import '../../features/battle/battle_screen.dart';
import '../../features/duel/duel_screen.dart';
import '../../features/leaderboard/leaderboard_screen.dart';
import '../../features/map/world_map_screen.dart';
import '../../features/title/title_screen.dart';

final appRouterProvider = Provider<GoRouter>((ref) {
  final router = GoRouter(
    routes: [
      GoRoute(path: '/', builder: (context, state) => const TitleScreen()),
      GoRoute(
        path: '/harta',
        builder: (context, state) => const WorldMapScreen(),
      ),
      GoRoute(path: '/cont', builder: (context, state) => const AccountScreen()),
      GoRoute(path: '/duel', builder: (context, state) => const DuelScreen()),
      GoRoute(
        path: '/clasament',
        builder: (context, state) => const LeaderboardScreen(),
      ),
      GoRoute(
        path: '/asalt/:chapter/:stage',
        builder: (context, state) {
          final chapterId = state.pathParameters['chapter'] ?? '';
          final stageIndex =
              int.tryParse(state.pathParameters['stage'] ?? '') ?? 0;
          return BattleScreen(
            chapterId: chapterId,
            stageIndex: stageIndex.clamp(0, RealmChapter.stages.length - 1),
          );
        },
      ),
    ],
  );
  ref.onDispose(router.dispose);
  return router;
});
