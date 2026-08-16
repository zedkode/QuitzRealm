import 'package:flutter_riverpod/flutter_riverpod.dart';
import 'package:go_router/go_router.dart';

import '../../domain/campaign/realm_chapter.dart';
import '../../features/auth/account_screen.dart';
import '../../features/battle/battle_screen.dart';
import '../../features/duel/duel_screen.dart';
import '../../features/leaderboard/leaderboard_screen.dart';
import '../../features/map/world_map_screen.dart';
import '../../features/settings/settings_screen.dart';
import '../../features/social/conversation_screen.dart';
import '../../features/social/social_screen.dart';
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
      GoRoute(
        path: '/setari',
        builder: (context, state) => const SettingsScreen(),
      ),
      GoRoute(path: '/duel', builder: (context, state) => const DuelScreen()),
      GoRoute(
        path: '/social',
        builder: (context, state) => const SocialScreen(),
      ),
      GoRoute(
        path: '/social/conversatie/:id',
        builder: (context, state) => ConversationScreen(
          conversationId: state.pathParameters['id'] ?? '',
          // Numele celuilalt vine din ecranul precedent, ca sa nu mai cerem un
          // request doar pentru titlu.
          title: state.extra is String ? state.extra! as String : null,
        ),
      ),
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
