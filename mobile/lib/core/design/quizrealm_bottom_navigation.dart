import 'package:flutter/material.dart';

import '../ui/game_icons.dart';
import 'quizrealm_tokens.dart';

/// Destinațiile din bara de jos.
///
/// Ultimele două intrări se schimbă după context (Clasament ↔ Multiplayer,
/// Profil ↔ Setări), exact ca în capturi: bara urmează ecranul, nu invers.
enum QuizRealmTab { home, campaign, chat, ranking, multiplayer, profile, settings }

class QuizRealmNavItem {
  const QuizRealmNavItem({
    required this.tab,
    required this.symbol,
    required this.label,
    required this.route,
  });

  final QuizRealmTab tab;

  /// Simbol din setul jocului, nu din Material: siluetele trebuie să fie
  /// aceleași ca restul interfeței.
  final GameSymbol symbol;
  final String label;
  final String route;
}

/// Bara de navigație permanentă.
///
/// Elementul selectat nu se marchează doar prin culoare: primește fundal,
/// halou și un romb auriu pe muchia de sus. La o singură diferență de culoare,
/// starea activă se pierde pe un ecran întunecat.
class QuizRealmBottomNavigation extends StatelessWidget {
  const QuizRealmBottomNavigation({
    required this.items,
    required this.current,
    required this.onSelect,
    super.key,
  });

  final List<QuizRealmNavItem> items;
  final QuizRealmTab current;
  final ValueChanged<QuizRealmNavItem> onSelect;

  @override
  Widget build(BuildContext context) {
    return Container(
      decoration: const BoxDecoration(
        gradient: LinearGradient(
          begin: Alignment.topCenter,
          end: Alignment.bottomCenter,
          colors: [Color(0xFF020A16), QuizRealmColors.backgroundDeep],
        ),
        border: Border(
          top: BorderSide(color: QuizRealmColors.goldDeep, width: 2),
        ),
      ),
      child: SafeArea(
        top: false,
        child: Padding(
          padding: const EdgeInsets.symmetric(
            horizontal: QuizRealmSpacing.sm,
            vertical: QuizRealmSpacing.xs,
          ),
          child: Row(
            children: [
              for (final item in items)
                Expanded(
                  child: _NavCell(
                    item: item,
                    selected: item.tab == current,
                    onTap: () => onSelect(item),
                  ),
                ),
            ],
          ),
        ),
      ),
    );
  }
}

class _NavCell extends StatelessWidget {
  const _NavCell({
    required this.item,
    required this.selected,
    required this.onTap,
  });

  final QuizRealmNavItem item;
  final bool selected;
  final VoidCallback onTap;

  @override
  Widget build(BuildContext context) {
    final color = selected
        ? QuizRealmColors.electric
        : QuizRealmColors.gold;

    return Semantics(
      button: true,
      selected: selected,
      label: item.label,
      child: ExcludeSemantics(
        child: Material(
          color: Colors.transparent,
          child: InkWell(
            onTap: onTap,
            borderRadius: BorderRadius.circular(QuizRealmRadius.md),
            // Ținta de atingere rămâne peste 44 dp chiar dacă vizualul e mai mic.
            child: AnimatedContainer(
              duration: QuizRealmDurations.state,
              constraints: const BoxConstraints(minHeight: 48),
              padding: const EdgeInsets.symmetric(vertical: 6),
              decoration: BoxDecoration(
                color: selected
                    ? QuizRealmColors.surfaceSelected
                    : Colors.transparent,
                borderRadius: BorderRadius.circular(QuizRealmRadius.md),
                boxShadow: selected ? QuizRealmShadows.electricGlow : null,
              ),
              child: Stack(
                clipBehavior: Clip.none,
                alignment: Alignment.topCenter,
                children: [
                  Column(
                    mainAxisSize: MainAxisSize.min,
                    children: [
                      GameIcon(item.symbol, size: 21, color: color),
                      const SizedBox(height: 2),
                      // „CLASAMENT" e cel mai lung nume de filă și nu încape
                      // pe o cincime de ecran mic. Se micșorează, nu se taie:
                      // o filă tăiată nu se mai poate citi dintr-o privire.
                      FittedBox(
                        fit: BoxFit.scaleDown,
                        child: Text(
                          item.label.toUpperCase(),
                          maxLines: 1,
                          style: QuizRealmTypography.navLabel.copyWith(
                            color: color,
                          ),
                        ),
                      ),
                    ],
                  ),
                  if (selected)
                    Positioned(
                      top: -10,
                      child: Transform.rotate(
                        angle: 0.785398,
                        child: Container(
                          width: 8,
                          height: 8,
                          color: QuizRealmColors.goldBright,
                        ),
                      ),
                    ),
                ],
              ),
            ),
          ),
        ),
      ),
    );
  }
}
