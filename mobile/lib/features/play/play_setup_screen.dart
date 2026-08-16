import 'package:flutter/material.dart';
import 'package:flutter_riverpod/flutter_riverpod.dart';
import 'package:go_router/go_router.dart';

import '../../core/design/entrance.dart';
import '../../core/design/game_buttons.dart';
import '../../core/design/game_controls.dart';
import '../../core/design/gold_frame.dart';
import '../../core/design/quizrealm_bottom_navigation.dart';
import '../../core/design/quizrealm_scaffold.dart';
import '../../core/design/quizrealm_tokens.dart';
import '../../core/ui/game_icons.dart';
import '../../data/pack/owner_question_pack_catalog.dart';
import '../../domain/duel/match_preferences.dart';
import '../../l10n/app_localizations.dart';
import '../categories/category_picker_grid.dart';
import '../title/widgets/home_navigation.dart';

/// Pregătirea unui meci online: modul și categoriile.
///
/// Selecția de categorii ajunge la server ca `categoryCodes`, iar serverul face
/// **intersecția** preferințelor celor doi jucători, cu revenire la „toate" când
/// intersecția e goală. De aceea bifele de aici sunt o dorință, nu o garanție —
/// textul de sub grilă o spune, ca jucătorul să nu creadă că meciul i-a ignorat
/// alegerea.
class PlaySetupScreen extends ConsumerStatefulWidget {
  const PlaySetupScreen({super.key});

  @override
  ConsumerState<PlaySetupScreen> createState() => _PlaySetupScreenState();
}

class _PlaySetupScreenState extends ConsumerState<PlaySetupScreen> {
  MatchMode _mode = MatchMode.duo;
  int _playerCount = MatchPreferences.classicPlayerCounts.first;
  Set<String> _selected = {};

  void _toggle(String code) {
    setState(() {
      final next = Set<String>.of(_selected);
      if (!next.remove(code)) next.add(code);
      _selected = next;
    });
  }

  @override
  Widget build(BuildContext context) {
    final l10n = AppLocalizations.of(context);

    return QuizRealmScaffold(
      backdropAsset: 'assets/game/duel_arena_backdrop.png',
      backdropOpacity: 0.42,
      title: l10n.playTitle,
      onBack: () => context.canPop() ? context.pop() : context.go('/'),
      backdropAccent: QuizRealmColors.crimson,
      bottomNavigation: HomeNavigation(
        current: QuizRealmTab.multiplayer,
        l10n: l10n,
      ),
      body: Column(
        crossAxisAlignment: CrossAxisAlignment.stretch,
        children: staggered([
          Text(
            l10n.playSubtitle,
            textAlign: TextAlign.center,
            style: QuizRealmTypography.bodySecondary,
          ),
          const DiamondDivider(),
          _ModePanel(
            mode: _mode,
            onChanged: (mode) => setState(() => _mode = mode),
            l10n: l10n,
          ),
          const SizedBox(height: QuizRealmSpacing.panelGap),
          if (_mode == MatchMode.classic) ...[
            _PlayerCountPanel(
              count: _playerCount,
              onChanged: (count) => setState(() => _playerCount = count),
              l10n: l10n,
            ),
            const SizedBox(height: QuizRealmSpacing.panelGap),
          ],
          FantasyPanel(
            title: l10n.playCategories,
            symbol: GameSymbol.scroll,
            child: Column(
              crossAxisAlignment: CrossAxisAlignment.stretch,
              mainAxisSize: MainAxisSize.min,
              children: [
                Text(
                  _selected.isEmpty
                      ? l10n.trainingAllSelected(ownerQuestionPacks.length)
                      : l10n.trainingSelectedCount(_selected.length),
                  textAlign: TextAlign.center,
                  style: QuizRealmTypography.bodySecondary.copyWith(
                    color: QuizRealmColors.textAccent,
                  ),
                ),
                const SizedBox(height: QuizRealmSpacing.sm),
                CategoryPickerGrid(
                  selected: _selected,
                  onToggle: _toggle,
                  l10n: l10n,
                  crossAxisCount: 4,
                ),
                const SizedBox(height: QuizRealmSpacing.sm),
                Text(
                  l10n.playCategoriesNote,
                  textAlign: TextAlign.center,
                  style: QuizRealmTypography.bodySecondary.copyWith(
                    fontSize: 11,
                    color: QuizRealmColors.textMuted,
                  ),
                ),
                if (_selected.isNotEmpty) ...[
                  const SizedBox(height: QuizRealmSpacing.sm),
                  SecondaryGameButton(
                    key: const Key('play-clear-categories'),
                    label: l10n.trainingSelectAll,
                    onPressed: () => setState(() => _selected = {}),
                  ),
                ],
              ],
            ),
          ),
          const SizedBox(height: QuizRealmSpacing.lg),
          PrimaryGameButton(
            key: const Key('play-start'),
            label: l10n.playFindMatch,
            symbol: GameSymbol.swords,
            emphasized: true,
            onPressed: () {
              final preferences = MatchPreferences(
                mode: _mode,
                categoryCodes: (_selected.toList()..sort()),
                playerCount: _mode == MatchMode.classic ? _playerCount : null,
              );
              final query = preferences
                  .toQueryParameters()
                  .entries
                  .map((entry) => '${entry.key}=${entry.value}')
                  .join('&');
              context.push('/duel?$query');
            },
          ),
        ]),
      ),
    );
  }
}

class _ModePanel extends StatelessWidget {
  const _ModePanel({
    required this.mode,
    required this.onChanged,
    required this.l10n,
  });

  final MatchMode mode;
  final ValueChanged<MatchMode> onChanged;
  final AppLocalizations l10n;

  @override
  Widget build(BuildContext context) {
    return FantasyPanel(
      title: l10n.playMode,
      symbol: GameSymbol.swords,
      child: Column(
        mainAxisSize: MainAxisSize.min,
        children: [
          _ModeRow(
            selected: mode == MatchMode.duo,
            symbol: GameSymbol.swords,
            title: l10n.playModeDuo,
            description: l10n.playModeDuoDesc,
            onTap: () => onChanged(MatchMode.duo),
            tileKey: const Key('play-mode-duo'),
          ),
          _ModeRow(
            selected: mode == MatchMode.classic,
            symbol: GameSymbol.map,
            title: l10n.playModeClassic,
            description: l10n.playModeClassicDesc,
            onTap: () => onChanged(MatchMode.classic),
            tileKey: const Key('play-mode-classic'),
          ),
        ],
      ),
    );
  }
}

class _ModeRow extends StatelessWidget {
  const _ModeRow({
    required this.selected,
    required this.symbol,
    required this.title,
    required this.description,
    required this.onTap,
    required this.tileKey,
  });

  final bool selected;
  final GameSymbol symbol;
  final String title;
  final String description;
  final VoidCallback onTap;
  final Key tileKey;

  @override
  Widget build(BuildContext context) {
    return Semantics(
      button: true,
      selected: selected,
      label: '$title. $description',
      child: ExcludeSemantics(
        child: Padding(
          padding: const EdgeInsets.only(bottom: QuizRealmSpacing.sm),
          child: Material(
            color: Colors.transparent,
            child: InkWell(
              key: tileKey,
              onTap: onTap,
              borderRadius: BorderRadius.circular(QuizRealmRadius.md),
              child: AnimatedContainer(
                duration: QuizRealmDurations.state,
                padding: const EdgeInsets.all(QuizRealmSpacing.md),
                decoration: BoxDecoration(
                  color: selected
                      ? QuizRealmColors.surfaceSelected
                      : QuizRealmColors.surfaceRow,
                  borderRadius: BorderRadius.circular(QuizRealmRadius.md),
                  border: Border.all(
                    color: selected
                        ? QuizRealmColors.electric
                        : QuizRealmColors.goldDeep,
                    width: selected ? QuizRealmBorders.frame : 1,
                  ),
                  boxShadow: selected ? QuizRealmShadows.electricGlow : null,
                ),
                child: Row(
                  children: [
                    GameIcon(
                      symbol,
                      size: 26,
                      color: selected
                          ? QuizRealmColors.electricGlow
                          : QuizRealmColors.gold,
                    ),
                    const SizedBox(width: QuizRealmSpacing.md),
                    Expanded(
                      child: Column(
                        crossAxisAlignment: CrossAxisAlignment.start,
                        mainAxisSize: MainAxisSize.min,
                        children: [
                          Text(
                            title,
                            style: QuizRealmTypography.playerName.copyWith(
                              fontSize: 15,
                            ),
                          ),
                          Text(
                            description,
                            style: QuizRealmTypography.bodySecondary,
                          ),
                        ],
                      ),
                    ),
                    if (selected)
                      const Icon(
                        Icons.check_circle,
                        size: 22,
                        color: QuizRealmColors.electric,
                      ),
                  ],
                ),
              ),
            ),
          ),
        ),
      ),
    );
  }
}

class _PlayerCountPanel extends StatelessWidget {
  const _PlayerCountPanel({
    required this.count,
    required this.onChanged,
    required this.l10n,
  });

  final int count;
  final ValueChanged<int> onChanged;
  final AppLocalizations l10n;

  @override
  Widget build(BuildContext context) {
    return FantasyPanel(
      title: l10n.playPlayerCount,
      symbol: GameSymbol.helmet,
      child: Center(
        child: GameTabBar<int>(
          selected: count,
          onSelect: onChanged,
          // Doar valorile pe care serverul le acceptă la Clasic public (4-8).
          // Un „2" aici ar fi respins de `publicMatchProfile`, iar jucătorul ar
          // vedea o eroare fără să înțeleagă de ce.
          options: [
            for (final count in MatchPreferences.classicPlayerCounts)
              GameTabOption(value: count, label: '$count'),
          ],
        ),
      ),
    );
  }
}
