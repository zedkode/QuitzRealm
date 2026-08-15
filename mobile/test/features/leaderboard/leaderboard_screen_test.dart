import 'package:flutter/material.dart';
import 'package:flutter_riverpod/flutter_riverpod.dart';
import 'package:flutter_test/flutter_test.dart';
import 'package:quiz_realm/core/providers/repository_providers.dart';
import 'package:quiz_realm/domain/rank/leaderboard_repository.dart';
import 'package:quiz_realm/domain/rank/player_rank.dart';
import 'package:quiz_realm/features/leaderboard/leaderboard_screen.dart';
import 'package:quiz_realm/features/leaderboard/widgets/rank_badge.dart';
import 'package:quiz_realm/l10n/app_localizations.dart';

PlayerRank _rank({
  String label = 'Cercetător III',
  int majorRank = 3,
  int? division = 3,
  int elo = 1011,
  int? toNext = 122,
  bool isLegend = false,
}) {
  return PlayerRank(
    key: 'cercetator-3',
    label: label,
    majorRank: majorRank,
    division: division,
    order: 7,
    totalTiers: 22,
    elo: elo,
    eloToNextTier: toNext,
    progress: 0.4,
    isLegend: isLegend,
  );
}

LeaderboardEntry _entry({
  int position = 1,
  String userId = 'u1',
  String username = 'StrajaZorilor',
  int elo = 1011,
  int matches = 6,
}) {
  return LeaderboardEntry(
    position: position,
    userId: userId,
    username: username,
    elo: elo,
    matchesPlayed: matches,
    rank: _rank(elo: elo),
  );
}

class _FakeLeaderboardRepository implements LeaderboardRepository {
  _FakeLeaderboardRepository({
    this.page,
    this.mine,
    this.throwsOnTop = false,
    this.throwsOnMe = false,
  });

  final LeaderboardPage? page;
  final LeaderboardEntry? mine;
  final bool throwsOnTop;
  final bool throwsOnMe;

  @override
  Future<LeaderboardPage> fetchTop({int limit = 25}) async {
    if (throwsOnTop) throw Exception('server indisponibil');
    return page ?? const LeaderboardPage(total: 0, entries: []);
  }

  @override
  Future<LeaderboardEntry?> fetchMyPosition() async {
    if (throwsOnMe) throw Exception('neautentificat');
    return mine;
  }
}

Future<void> _pump(
  WidgetTester tester,
  _FakeLeaderboardRepository repository, {
  Size size = const Size(430, 1000),
}) async {
  tester.view
    ..physicalSize = size
    ..devicePixelRatio = 1;
  addTearDown(tester.view.reset);

  await tester.pumpWidget(
    ProviderScope(
      overrides: [
        leaderboardRepositoryProvider.overrideWithValue(repository),
      ],
      child: MaterialApp(
        locale: const Locale('ro'),
        localizationsDelegates: AppLocalizations.localizationsDelegates,
        supportedLocales: AppLocalizations.supportedLocales,
        home: const LeaderboardScreen(),
      ),
    ),
  );
  await tester.pump();
  await tester.pump(const Duration(milliseconds: 300));
}

void main() {
  testWidgets('afișează clasamentul cu poziții și ranguri', (tester) async {
    await _pump(
      tester,
      _FakeLeaderboardRepository(
        page: LeaderboardPage(
          total: 3,
          entries: [
            _entry(),
            _entry(position: 2, userId: 'u2', username: 'Andrei', elo: 1000),
            _entry(
              position: 3,
              userId: 'u3',
              username: 'CavalerulNoptii',
              elo: 989,
            ),
          ],
        ),
      ),
    );

    expect(find.text('3 jucători clasați'), findsOneWidget);
    expect(find.text('StrajaZorilor'), findsOneWidget);
    expect(find.text('CavalerulNoptii'), findsOneWidget);
    expect(find.byType(RankBadge), findsNWidgets(3));
    expect(tester.takeException(), isNull);
  });

  testWidgets('fără cont, clasamentul rămâne vizibil fără cartonașul propriu', (
    tester,
  ) async {
    await _pump(
      tester,
      _FakeLeaderboardRepository(
        page: LeaderboardPage(total: 1, entries: [_entry()]),
        throwsOnMe: true,
      ),
    );

    expect(find.text('StrajaZorilor'), findsOneWidget);
    expect(find.byKey(const Key('my-standing')), findsNothing);
  });

  testWidgets('cu cont, arată propria poziție și progresul spre treaptă', (
    tester,
  ) async {
    await _pump(
      tester,
      _FakeLeaderboardRepository(
        page: LeaderboardPage(total: 2, entries: [_entry()]),
        mine: _entry(
          position: 12,
          userId: 'me',
          username: 'CavalerulNoptii',
          elo: 989,
        ),
      ),
    );

    expect(find.byKey(const Key('my-standing')), findsOneWidget);
    expect(find.text('Locul 12 • 6 partide'), findsOneWidget);
    expect(find.text('LOCUL TĂU'), findsOneWidget);
    expect(find.textContaining('până la treapta următoare'), findsWidgets);
  });

  testWidgets('eroarea de rețea oferă reîncercare', (tester) async {
    await _pump(tester, _FakeLeaderboardRepository(throwsOnTop: true));

    expect(find.text('Clasamentul nu a putut fi citit'), findsOneWidget);
    expect(find.text('Încearcă din nou'), findsOneWidget);
  });

  testWidgets('clasamentul gol explică ce trebuie făcut', (tester) async {
    await _pump(tester, _FakeLeaderboardRepository());

    expect(find.textContaining('Nu s-a clasat încă nimeni'), findsOneWidget);
  });
}
