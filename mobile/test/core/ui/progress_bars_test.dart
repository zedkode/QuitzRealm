import 'package:flutter/material.dart';
import 'package:flutter_test/flutter_test.dart';
import 'package:quiz_realm/core/ui/game_meters.dart';
import 'package:quiz_realm/domain/rank/player_rank.dart';
import 'package:quiz_realm/features/leaderboard/widgets/rank_badge.dart';

/// Barele de progres au apărut goale pe device pentru că umplerea se prăbușea
/// la înălțime zero. Testele de aici verifică dimensiunea reală desenată.
Future<void> _pump(WidgetTester tester, Widget child) async {
  await tester.pumpWidget(
    MaterialApp(
      home: Scaffold(
        body: Center(child: SizedBox(width: 200, child: child)),
      ),
    ),
  );
  await tester.pump(const Duration(milliseconds: 600));
}

void main() {
  testWidgets('bara de XP se umple proporțional cu progresul', (tester) async {
    await _pump(
      tester,
      const XpBar(level: 3, progress: 0.5, label: 'progres', height: 14),
    );

    final fill = tester.getSize(find.byKey(const Key('xp-bar-fill')));
    expect(fill.height, greaterThan(0));
    expect(fill.width, greaterThan(0));
  });

  testWidgets('bara de XP goală nu desenează umplere lată', (tester) async {
    await _pump(
      tester,
      const XpBar(level: 1, progress: 0, label: 'progres', height: 14),
    );

    final fill = tester.getSize(find.byKey(const Key('xp-bar-fill')));
    expect(fill.width, 0);
  });

  testWidgets('bara de rang are înălțime reală, nu zero', (tester) async {
    const rank = PlayerRank(
      key: 'ucenic-1',
      label: 'Ucenic I',
      majorRank: 2,
      division: 1,
      order: 6,
      totalTiers: 22,
      elo: 989,
      eloToNextTier: 11,
      progress: 0.92,
      isLegend: false,
    );

    await _pump(
      tester,
      const RankProgressBar(rank: rank, label: 'progres', height: 10),
    );

    final fill = tester.getSize(find.byKey(const Key('rank-progress-fill')));
    expect(fill.height, greaterThan(0));
    // 92% din lățimea interioară a barei (200 minus bordurile).
    expect(fill.width, greaterThan(150));
  });

  testWidgets('bara de rang la progres zero rămâne vizibilă minimal', (
    tester,
  ) async {
    const rank = PlayerRank(
      key: 'novice-3',
      label: 'Novice III',
      majorRank: 1,
      division: 3,
      order: 1,
      totalTiers: 22,
      elo: 0,
      eloToNextTier: 200,
      progress: 0,
      isLegend: false,
    );

    await _pump(
      tester,
      const RankProgressBar(rank: rank, label: 'progres', height: 10),
    );

    final fill = tester.getSize(find.byKey(const Key('rank-progress-fill')));
    expect(fill.height, greaterThan(0));
    expect(fill.width, greaterThan(0));
    expect(fill.width, lessThan(20));
  });
}
