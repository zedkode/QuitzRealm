import 'package:flutter/widgets.dart';
import 'package:go_router/go_router.dart';

import '../../../core/design/quizrealm_bottom_navigation.dart';
import '../../../core/ui/game_icons.dart';
import '../../../l10n/app_localizations.dart';

/// Bara de jos, cu destinațiile și rutele lor.
///
/// Traseul e definit o singură dată aici: dacă fiecare ecran și-ar construi
/// propria bară, prima rută redenumită ar lăsa în urmă o filă moartă pe un
/// ecran uitat.
class HomeNavigation extends StatelessWidget {
  const HomeNavigation({
    required this.current,
    required this.l10n,
    super.key,
    this.lastTab = QuizRealmTab.profile,
  });

  final QuizRealmTab current;
  final AppLocalizations l10n;

  /// Ultima filă se schimbă după ecran: pe setări arată „Setări", în rest
  /// „Profil". Bara urmează ecranul, exact ca în capturi.
  final QuizRealmTab lastTab;

  @override
  Widget build(BuildContext context) {
    final items = [
      QuizRealmNavItem(
        tab: QuizRealmTab.home,
        symbol: GameSymbol.castle,
        label: l10n.navHome,
        route: '/',
      ),
      QuizRealmNavItem(
        tab: QuizRealmTab.campaign,
        symbol: GameSymbol.map,
        label: l10n.trainingTitle,
        route: '/antrenament',
      ),
      QuizRealmNavItem(
        tab: QuizRealmTab.chat,
        symbol: GameSymbol.chat,
        label: l10n.navChat,
        route: '/social',
      ),
      // A patra poziție alternează Clasament ↔ Multiplayer, ca în capturi: bara
      // arată destinația vecină ecranului curent, nu o listă fixă.
      if (current == QuizRealmTab.multiplayer)
        QuizRealmNavItem(
          tab: QuizRealmTab.multiplayer,
          symbol: GameSymbol.swords,
          label: l10n.navMultiplayer,
          route: '/joaca',
        )
      else
        QuizRealmNavItem(
          tab: QuizRealmTab.ranking,
          symbol: GameSymbol.trophy,
          label: l10n.navRanking,
          route: '/clasament',
        ),
      if (lastTab == QuizRealmTab.settings)
        QuizRealmNavItem(
          tab: QuizRealmTab.settings,
          symbol: GameSymbol.shield,
          label: l10n.navSettings,
          route: '/setari',
        )
      else
        QuizRealmNavItem(
          tab: QuizRealmTab.profile,
          symbol: GameSymbol.helmet,
          label: l10n.navProfile,
          route: '/cont',
        ),
    ];

    return QuizRealmBottomNavigation(
      items: items,
      current: current,
      onSelect: (item) {
        if (item.tab == current) return;
        // `go`, nu `push`: filele sunt destinații de nivel egal, iar `push` ar
        // stivui ecrane peste ecrane la fiecare comutare.
        context.go(item.route);
      },
    );
  }
}
