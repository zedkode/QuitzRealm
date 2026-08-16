import 'package:flutter/material.dart';
import 'package:flutter_riverpod/flutter_riverpod.dart';
import 'package:go_router/go_router.dart';

import '../../core/design/game_buttons.dart';
import '../../core/design/gold_frame.dart';
import '../../core/design/mode_card.dart';
import '../../core/design/player_identity.dart';
import '../../core/design/quizrealm_bottom_navigation.dart';
import '../../core/design/quizrealm_scaffold.dart';
import '../../core/design/quizrealm_tokens.dart';
import '../../core/providers/game_providers.dart';
import '../../core/providers/repository_providers.dart';
import '../../core/theme/app_theme.dart';
import '../../core/ui/game_button.dart';
import '../../core/ui/game_frame.dart';
import '../../core/ui/game_icons.dart';
import '../../domain/campaign/campaign_progress.dart';
import '../../domain/campaign/realm_chapter.dart';
import '../../domain/player/player_profile.dart';
import '../../l10n/app_localizations.dart';
import '../map/chapter_presentation.dart';
import 'widgets/home_navigation.dart';
import 'widgets/realm_strip.dart';

/// Tabloul de bord, reconstruit după `design-reference/02-home-dashboard.png`.
///
/// Ordinea panourilor urmează captura: cine ești, unde poți merge, unde ai
/// rămas, ce ai adunat. Secțiunile din captură care n-au încă sursă de date pe
/// server — misiuni zilnice, pass sezonier, cristale — **nu** sunt desenate cu
/// valori inventate; sunt trecute în `ASSET_GAPS.md`, la „Goluri de date".
class TitleScreen extends ConsumerWidget {
  const TitleScreen({super.key});

  @override
  Widget build(BuildContext context, WidgetRef ref) {
    final l10n = AppLocalizations.of(context);
    final progress = ref.watch(campaignProgressProvider);
    final profileAsync = ref.watch(playerProfileProvider);
    final profile = profileAsync.valueOrNull;

    return QuizRealmScaffold(
      onRefresh: () async => ref.invalidate(playerProfileProvider),
      header: _Header(profile: profile, progress: progress, l10n: l10n),
      bottomNavigation: HomeNavigation(
        current: QuizRealmTab.home,
        l10n: l10n,
      ),
      body: Column(
        crossAxisAlignment: CrossAxisAlignment.stretch,
        children: [
          const DiamondDivider(),
          _ModeRow(profile: profile, l10n: l10n),
          const SizedBox(height: QuizRealmSpacing.panelGap),
          _RecentProgressPanel(progress: progress, l10n: l10n),
          const SizedBox(height: QuizRealmSpacing.panelGap),
          _KingdomPanel(progress: progress, profile: profile, l10n: l10n),
          const SizedBox(height: QuizRealmSpacing.panelGap),
          SectionHeader(title: l10n.homeRealmsTitle, symbol: GameSymbol.map),
          const SizedBox(height: QuizRealmSpacing.sm),
          RealmStrip(
            progress: progress,
            onOpenMap: () => context.push('/harta'),
          ),
          const SizedBox(height: QuizRealmSpacing.panelGap),
          _FooterActions(onHowToPlay: () => _showRules(context, l10n)),
        ],
      ),
    );
  }

  void _showRules(BuildContext context, AppLocalizations l10n) {
    showDialog<void>(
      context: context,
      barrierColor: GamePalette.nightDeep.withValues(alpha: 0.8),
      builder: (context) => Dialog(
        backgroundColor: Colors.transparent,
        insetPadding: const EdgeInsets.all(20),
        child: GameFrame(
          glow: true,
          child: Column(
            mainAxisSize: MainAxisSize.min,
            crossAxisAlignment: CrossAxisAlignment.stretch,
            children: [
              Center(child: Text(l10n.howToPlayTitle, style: GameText.title)),
              const SizedBox(height: 16),
              _RuleLine(
                symbol: GameSymbol.hourglass,
                text: l10n.howToPlayRuleQuestions,
              ),
              _RuleLine(
                symbol: GameSymbol.flame,
                text: l10n.howToPlayRuleStreak,
              ),
              _RuleLine(symbol: GameSymbol.star, text: l10n.howToPlayRuleStars),
              _RuleLine(
                symbol: GameSymbol.shield,
                text: l10n.howToPlayRuleOffline,
              ),
              const SizedBox(height: 16),
              GameButton(
                label: l10n.close,
                height: 46,
                compact: true,
                onPressed: () => Navigator.of(context).pop(),
              ),
            ],
          ),
        ),
      ),
    );
  }
}

/// Antetul de identitate.
///
/// Nivelul și bara de XP vin din progresul de campanie, singura progresie cu
/// prag definit azi: contul păstrează `xp`/`level` pe server, dar regula de
/// nivel de cont (§7.3 din plan) încă nu există, iar o bară fără maxim real ar
/// fi o cifră inventată.
class _Header extends StatelessWidget {
  const _Header({
    required this.profile,
    required this.progress,
    required this.l10n,
  });

  final PlayerProfile? profile;
  final CampaignProgress progress;
  final AppLocalizations l10n;

  @override
  Widget build(BuildContext context) {
    final player = profile;

    return PlayerIdentityHeader(
      key: const Key('home-identity-header'),
      guestLabel: l10n.homeGuestTitle,
      name: player?.displayName,
      title: player?.rank.label,
      level: progress.level,
      xp: progress.xpIntoLevel,
      xpMax: CampaignProgress.xpForLevel(progress.level),
      xpLabel: l10n.xpProgress(
        progress.xpIntoLevel,
        CampaignProgress.xpForLevel(progress.level),
      ),
      onTapIdentity: () => context.push('/cont'),
      onMenu: () => context.push('/cont'),
      menuSemanticsLabel: l10n.homeMenu,
      currencies: [
        if (player != null)
          CurrencyCounter(
            asset: 'assets/game/icons/resources/icon-resource-gold-coin.png',
            value: '${player.coins}',
            semanticsLabel: l10n.homeCoins(player.coins),
            compact: true,
          ),
      ],
    );
  }
}

/// Rândul de moduri din capul tabloului: patru destinații, egale ca greutate.
class _ModeRow extends StatelessWidget {
  const _ModeRow({required this.profile, required this.l10n});

  final PlayerProfile? profile;
  final AppLocalizations l10n;

  @override
  Widget build(BuildContext context) {
    return IntrinsicHeight(
      child: Row(
        crossAxisAlignment: CrossAxisAlignment.stretch,
        children: [
          Expanded(
            child: GameModeCard(
              key: const Key('menu-campaign'),
              title: l10n.homeModeCampaign,
              description: l10n.homeModeCampaignDesc,
              symbol: GameSymbol.castle,
              tint: QuizRealmColors.royalBlue,
              onTap: () => context.push('/harta'),
            ),
          ),
          const SizedBox(width: QuizRealmSpacing.sm),
          Expanded(
            child: GameModeCard(
              key: const Key('menu-duel'),
              title: l10n.homeModeMultiplayer,
              description: l10n.homeModeMultiplayerDesc,
              symbol: GameSymbol.swords,
              tint: QuizRealmColors.crimson,
              onTap: () => context.push('/duel'),
            ),
          ),
          const SizedBox(width: QuizRealmSpacing.sm),
          Expanded(
            child: GameModeCard(
              key: const Key('menu-social'),
              title: l10n.homeModeChat,
              description: l10n.homeModeChatDesc,
              symbol: GameSymbol.chat,
              tint: const Color(0xFF5B3FA8),
              onTap: () => context.push('/social'),
            ),
          ),
          const SizedBox(width: QuizRealmSpacing.sm),
          Expanded(
            child: GameModeCard(
              key: const Key('menu-leaderboard'),
              title: l10n.homeModeRanking,
              description: l10n.homeModeRankingDesc,
              symbol: GameSymbol.trophy,
              tint: const Color(0xFF1E6B45),
              onTap: () => context.push('/clasament'),
            ),
          ),
        ],
      ),
    );
  }
}

/// „Progres recent": unde a rămas jucătorul în campanie.
class _RecentProgressPanel extends StatelessWidget {
  const _RecentProgressPanel({required this.progress, required this.l10n});

  final CampaignProgress progress;
  final AppLocalizations l10n;

  /// Stelele maxime dintr-un ținut: trei per asalt.
  static int get _chapterStars => RealmChapter.stages.length * 3;

  /// Ținutul curent: primul deblocat care nu e încă terminat, altfel ultimul
  /// deblocat. Fără asta, panoul ar trimite mereu în primul capitol.
  RealmChapter get _chapter {
    RealmChapter? lastUnlocked;
    for (final chapter in RealmChapter.all) {
      if (!progress.isChapterUnlocked(chapter)) continue;
      lastUnlocked = chapter;
      if (progress.starsForChapter(chapter.id) < _chapterStars) {
        return chapter;
      }
    }
    return lastUnlocked ?? RealmChapter.all.first;
  }

  @override
  Widget build(BuildContext context) {
    final chapter = _chapter;
    final stars = progress.starsForChapter(chapter.id);
    final ratio = stars / _chapterStars;

    return TitledPanel(
      key: const Key('home-recent-progress'),
      title: l10n.homeRecentProgress,
      child: Column(
        crossAxisAlignment: CrossAxisAlignment.stretch,
        mainAxisSize: MainAxisSize.min,
        children: [
          Text(
            ChapterPresentation.of(l10n, chapter.id).name,
            maxLines: 1,
            overflow: TextOverflow.ellipsis,
            style: QuizRealmTypography.playerName.copyWith(fontSize: 17),
          ),
          const SizedBox(height: QuizRealmSpacing.xs),
          Row(
            children: [
              Expanded(
                child: XpProgressBar(
                  value: stars,
                  max: _chapterStars,
                  height: 14,
                  showLabel: false,
                ),
              ),
              const SizedBox(width: QuizRealmSpacing.sm),
              Text(
                '${(ratio * 100).round()}%',
                style: QuizRealmTypography.numeric.copyWith(fontSize: 13),
              ),
            ],
          ),
          const SizedBox(height: QuizRealmSpacing.md),
          SecondaryGameButton(
            key: const Key('home-continue-campaign'),
            label: l10n.homeContinue,
            onPressed: () => context.push('/harta'),
          ),
        ],
      ),
    );
  }
}

/// „Regatul tău": ce a adunat jucătorul până acum.
class _KingdomPanel extends StatelessWidget {
  const _KingdomPanel({
    required this.progress,
    required this.profile,
    required this.l10n,
  });

  final CampaignProgress progress;
  final PlayerProfile? profile;
  final AppLocalizations l10n;

  @override
  Widget build(BuildContext context) {
    final conquered = progress.starsByStage.values
        .where((stars) => stars > 0)
        .length;
    final total = RealmChapter.all.length * RealmChapter.stages.length;

    return FantasyPanel(
      key: const Key('home-kingdom'),
      title: l10n.homeKingdomTitle,
      symbol: GameSymbol.castle,
      child: Column(
        mainAxisSize: MainAxisSize.min,
        children: [
          StatLine(
            symbol: GameSymbol.banner,
            label: l10n.homeKingdomTerritories,
            value: '$conquered / $total',
          ),
          StatLine(
            symbol: GameSymbol.star,
            label: l10n.homeKingdomStars,
            value: '${progress.totalStars} / ${RealmChapter.maxStars}',
          ),
          StatLine(
            symbol: GameSymbol.swords,
            label: l10n.homeKingdomMatches,
            value: '${profile?.matchesPlayed ?? 0}',
          ),
        ],
      ),
    );
  }
}

class _FooterActions extends StatelessWidget {
  const _FooterActions({required this.onHowToPlay});

  final VoidCallback onHowToPlay;

  @override
  Widget build(BuildContext context) {
    final l10n = AppLocalizations.of(context);
    return Row(
      children: [
        Expanded(
          child: SecondaryGameButton(
            key: const Key('menu-how-to'),
            label: l10n.menuHowToPlay,
            symbol: GameSymbol.scroll,
            onPressed: onHowToPlay,
          ),
        ),
        const SizedBox(width: QuizRealmSpacing.sm),
        Expanded(
          child: SecondaryGameButton(
            key: const Key('menu-account'),
            label: l10n.menuAccount,
            symbol: GameSymbol.helmet,
            onPressed: () => context.push('/cont'),
          ),
        ),
      ],
    );
  }
}

class _RuleLine extends StatelessWidget {
  const _RuleLine({required this.symbol, required this.text});

  final GameSymbol symbol;
  final String text;

  @override
  Widget build(BuildContext context) {
    return Padding(
      padding: const EdgeInsets.only(bottom: 12),
      child: Row(
        crossAxisAlignment: CrossAxisAlignment.start,
        children: [
          GameIcon(symbol, size: 22),
          const SizedBox(width: 11),
          Expanded(child: Text(text, style: GameText.body)),
        ],
      ),
    );
  }
}
