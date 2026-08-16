import 'package:flutter/material.dart';
import 'package:flutter_riverpod/flutter_riverpod.dart';
import 'package:go_router/go_router.dart';

import '../../core/theme/app_theme.dart';
import '../../core/ui/game_button.dart';
import '../../core/ui/game_frame.dart';
import '../../core/ui/game_icons.dart';
import '../../core/ui/realm_backdrop.dart';
import '../../domain/achievements/achievement_models.dart';
import '../../l10n/app_localizations.dart';
import 'achievements_controller.dart';

class AchievementsScreen extends ConsumerWidget {
  const AchievementsScreen({super.key});

  @override
  Widget build(BuildContext context, WidgetRef ref) {
    final state = ref.watch(achievementsControllerProvider);
    final l10n = AppLocalizations.of(context);
    return Scaffold(
      body: RealmBackdrop(
        accent: GamePalette.goldBright,
        artAsset: 'assets/game/realm_map_v2.png',
        artOpacity: 0.16,
        child: SafeArea(
          child: Column(
            children: [
              Padding(
                padding: const EdgeInsets.fromLTRB(10, 6, 14, 4),
                child: Row(
                  children: [
                    GameIconButton(
                      symbol: GameSymbol.back,
                      tooltip: l10n.backLabel,
                      size: 40,
                      onPressed: () => context.pop(),
                    ),
                    const SizedBox(width: 10),
                    const GameIcon(GameSymbol.trophy, size: 24),
                    const SizedBox(width: 8),
                    Expanded(
                      child: Text(
                        'SALA PRESTIGIULUI',
                        style: GameText.heading.copyWith(fontSize: 16),
                      ),
                    ),
                  ],
                ),
              ),
              Expanded(
                child: switch (state.status) {
                  AchievementsStatus.loading => const Center(
                    child: CircularProgressIndicator(),
                  ),
                  AchievementsStatus.error => Center(
                    child: GameFrame(
                      glow: true,
                      margin: const EdgeInsets.all(22),
                      child: Column(
                        mainAxisSize: MainAxisSize.min,
                        children: [
                          const GameIcon(GameSymbol.skull, size: 44),
                          const SizedBox(height: 12),
                          Text(
                            'Nu am putut încărca realizările.',
                            style: GameText.bodyDim,
                          ),
                          const SizedBox(height: 14),
                          GameButton(
                            label: l10n.retry,
                            onPressed: () => ref
                                .read(achievementsControllerProvider.notifier)
                                .load(),
                          ),
                        ],
                      ),
                    ),
                  ),
                  AchievementsStatus.ready => _AchievementList(
                    items: state.items,
                    summary: state.summary!,
                  ),
                },
              ),
            ],
          ),
        ),
      ),
    );
  }
}

class _AchievementList extends ConsumerWidget {
  const _AchievementList({required this.items, required this.summary});
  final List<AchievementProgress> items;
  final AchievementSummary summary;
  @override
  Widget build(BuildContext context, WidgetRef ref) => ListView(
    padding: const EdgeInsets.fromLTRB(14, 8, 14, 20),
    children: [
      GameFrame(
        glow: true,
        child: Row(
          children: [
            const GameIcon(GameSymbol.crown, size: 38, glow: true),
            const SizedBox(width: 12),
            Expanded(
              child: Column(
                crossAxisAlignment: CrossAxisAlignment.start,
                children: [
                  Text('PRESTIGE SCORE', style: GameText.eyebrow),
                  Text('${summary.prestigeScore}', style: GameText.title),
                ],
              ),
            ),
            Text(
              '${summary.unlockedCount} deblocate',
              style: GameText.bodyDim.copyWith(fontSize: 11),
            ),
          ],
        ),
      ),
      const SizedBox(height: 12),
      GameFrame(
        child: Column(
          crossAxisAlignment: CrossAxisAlignment.start,
          children: [
            Text('BADGE-URI ECHIPATE', style: GameText.eyebrow),
            const SizedBox(height: 8),
            Row(
              children: List.generate(3, (slotIndex) {
                final badge = summary.badges
                    .where((entry) => entry.slotIndex == slotIndex)
                    .cast<EquippedAchievementBadge?>()
                    .firstWhere((entry) => entry != null, orElse: () => null);
                return Expanded(
                  child: Padding(
                    padding: EdgeInsets.only(right: slotIndex == 2 ? 0 : 8),
                    child: GestureDetector(
                      onTap: () => _chooseBadge(context, ref, slotIndex),
                      child: Container(
                        height: 50,
                        alignment: Alignment.center,
                        decoration: BoxDecoration(
                          color: GamePalette.stone800.withValues(alpha: .72),
                          borderRadius: BorderRadius.circular(10),
                          border: Border.all(
                            color:
                                (badge?.rarity == AchievementRarity.legendary
                                        ? GamePalette.gold
                                        : GamePalette.arcane)
                                    .withValues(
                                      alpha: badge?.achievementId == null
                                          ? .22
                                          : .7,
                                    ),
                          ),
                        ),
                        child: badge?.achievementId == null
                            ? const GameIcon(
                                GameSymbol.lock,
                                size: 20,
                                color: GamePalette.stone700,
                              )
                            : Text(
                                badge?.title ?? 'Badge',
                                maxLines: 2,
                                textAlign: TextAlign.center,
                                overflow: TextOverflow.ellipsis,
                                style: GameText.eyebrow.copyWith(fontSize: 9),
                              ),
                      ),
                    ),
                  ),
                );
              }),
            ),
          ],
        ),
      ),
      const SizedBox(height: 14),
      for (final item in items)
        Padding(
          padding: const EdgeInsets.only(bottom: 9),
          child: _AchievementCard(item: item),
        ),
    ],
  );

  Future<void> _chooseBadge(
    BuildContext context,
    WidgetRef ref,
    int slotIndex,
  ) async {
    final selected = await showModalBottomSheet<String?>(
      context: context,
      backgroundColor: GamePalette.stone800,
      builder: (context) => SafeArea(
        child: ListView(
          shrinkWrap: true,
          children: [
            ListTile(
              leading: const GameIcon(GameSymbol.cross, size: 22),
              title: Text('Golește slotul', style: GameText.body),
              onTap: () => Navigator.pop(context),
            ),
            for (final item in items.where((item) => item.isUnlocked))
              ListTile(
                leading: const GameIcon(GameSymbol.trophy, size: 22),
                title: Text(item.title, style: GameText.body),
                subtitle: Text('${item.points} PP', style: GameText.bodyDim),
                onTap: () => Navigator.pop(context, item.id),
              ),
          ],
        ),
      ),
    );
    if (!context.mounted) return;
    await ref
        .read(achievementsControllerProvider.notifier)
        .setBadgeSlot(slotIndex: slotIndex, achievementId: selected);
  }
}

class _AchievementCard extends StatelessWidget {
  const _AchievementCard({required this.item});
  final AchievementProgress item;
  @override
  Widget build(BuildContext context) {
    final color = switch (item.rarity) {
      AchievementRarity.common => const Color(0xFFB7B0A4),
      AchievementRarity.rare => GamePalette.arcane,
      AchievementRarity.epic => const Color(0xFFB26CFF),
      AchievementRarity.legendary => GamePalette.gold,
      AchievementRarity.mythic => GamePalette.crimson,
    };
    return Opacity(
      opacity: item.isUnlocked ? 1 : .78,
      child: GameFrame(
        child: Row(
          children: [
            GameIcon(
              item.isUnlocked ? GameSymbol.trophy : GameSymbol.lock,
              size: 30,
              color: color,
            ),
            const SizedBox(width: 11),
            Expanded(
              child: Column(
                crossAxisAlignment: CrossAxisAlignment.start,
                children: [
                  Text(
                    item.isHidden && !item.isUnlocked
                        ? 'Realizare secretă'
                        : item.title,
                    style: GameText.body.copyWith(fontSize: 13),
                  ),
                  Text(
                    item.isHidden && !item.isUnlocked
                        ? 'Descoperă condiția pentru a o debloca.'
                        : item.description,
                    style: GameText.bodyDim.copyWith(fontSize: 10),
                  ),
                  const SizedBox(height: 6),
                  LinearProgressIndicator(
                    value: item.progress,
                    color: color,
                    backgroundColor: GamePalette.stone700,
                  ),
                  Text(
                    '${item.progressCurrent.clamp(0, item.target)}/${item.target} · ${item.points} PP',
                    style: GameText.eyebrow.copyWith(fontSize: 9),
                  ),
                ],
              ),
            ),
          ],
        ),
      ),
    );
  }
}
