import 'package:flutter/material.dart';

import '../ui/game_icons.dart';
import 'gold_frame.dart';
import 'quizrealm_tokens.dart';

/// Portretul jucătorului, într-un inel auriu.
///
/// Arta de portret încă lipsește (vezi `ASSET_GAPS.md`, #1), iar referințele o
/// arată pe 8 din 10 ecrane. Până apare, desenăm o inițială pe fundal închis —
/// **nu** o iconiță Material generică, ce ar sugera un alt fel de element decât
/// un portret.
class PlayerAvatar extends StatelessWidget {
  const PlayerAvatar({
    required this.name,
    super.key,
    this.size = 56,
    this.imageProvider,
    this.online = false,
    this.ringColor = QuizRealmColors.gold,
  });

  final String name;
  final double size;

  /// Portretul, când există. Absent ⇒ inițiala.
  final ImageProvider? imageProvider;

  /// Bulina verde de prezență, folosită în listele de chat.
  final bool online;
  final Color ringColor;

  String get _initial {
    final trimmed = name.trim();
    return trimmed.isEmpty ? '?' : trimmed.characters.first.toUpperCase();
  }

  @override
  Widget build(BuildContext context) {
    final image = imageProvider;

    return SizedBox(
      width: size,
      height: size,
      child: Stack(
        clipBehavior: Clip.none,
        children: [
          Container(
            width: size,
            height: size,
            decoration: BoxDecoration(
              shape: BoxShape.circle,
              color: QuizRealmColors.surfaceRaised,
              border: Border.all(
                color: ringColor,
                width: QuizRealmBorders.frame,
              ),
              boxShadow: QuizRealmShadows.panel,
              image: image == null
                  ? null
                  : DecorationImage(image: image, fit: BoxFit.cover),
            ),
            alignment: Alignment.center,
            child: image != null
                ? null
                : Text(
                    _initial,
                    style: QuizRealmTypography.screenTitle.copyWith(
                      fontSize: size * 0.42,
                      letterSpacing: 0,
                      color: QuizRealmColors.goldBright,
                    ),
                  ),
          ),
          if (online)
            Positioned(
              right: 0,
              bottom: 0,
              child: Container(
                width: size * 0.24,
                height: size * 0.24,
                decoration: BoxDecoration(
                  shape: BoxShape.circle,
                  color: QuizRealmColors.onlineDot,
                  border: Border.all(
                    color: QuizRealmColors.backgroundDeep,
                    width: 2,
                  ),
                ),
              ),
            ),
        ],
      ),
    );
  }
}

/// Pastila cu nivelul, agățată de marginea de jos a portretului.
class LevelBadge extends StatelessWidget {
  const LevelBadge({required this.level, super.key, this.size = 26});

  final int level;
  final double size;

  @override
  Widget build(BuildContext context) {
    return Container(
      width: size,
      height: size,
      alignment: Alignment.center,
      decoration: BoxDecoration(
        shape: BoxShape.circle,
        color: QuizRealmColors.backgroundDeep,
        border: Border.all(color: QuizRealmColors.gold, width: 2),
      ),
      child: FittedBox(
        child: Padding(
          padding: const EdgeInsets.symmetric(horizontal: 2),
          child: Text(
            '$level',
            style: QuizRealmTypography.numeric.copyWith(
              fontSize: 13,
              color: QuizRealmColors.goldLight,
            ),
          ),
        ),
      ),
    );
  }
}

/// Portret + nivel, compuse așa cum apar în capturi.
class AvatarWithLevel extends StatelessWidget {
  const AvatarWithLevel({
    required this.name,
    required this.level,
    super.key,
    this.size = 56,
    this.imageProvider,
  });

  final String name;
  final int level;
  final double size;
  final ImageProvider? imageProvider;

  @override
  Widget build(BuildContext context) {
    final badge = size * 0.44;
    return SizedBox(
      width: size,
      // Pastila iese sub portret; înălțimea o include, altfel o taie părintele.
      height: size + badge * 0.4,
      child: Stack(
        clipBehavior: Clip.none,
        alignment: Alignment.topCenter,
        children: [
          PlayerAvatar(name: name, size: size, imageProvider: imageProvider),
          Positioned(
            bottom: 0,
            child: LevelBadge(level: level, size: badge),
          ),
        ],
      ),
    );
  }
}

/// Bara de experiență: pistă cu ramă aurie, umplere albastră, eticheta pe
/// mijloc.
///
/// Eticheta stă **peste** umplere, nu lângă bară: la valori lungi
/// („4.250 / 6.000 XP") o etichetă alăturată ar împinge bara în afara rândului.
class XpProgressBar extends StatelessWidget {
  const XpProgressBar({
    required this.value,
    required this.max,
    super.key,
    this.label,
    this.height = 20,
    this.showLabel = true,
  });

  final int value;
  final int max;

  /// Textul afișat peste bară. Absent ⇒ „valoare / maxim".
  final String? label;
  final double height;
  final bool showLabel;

  @override
  Widget build(BuildContext context) {
    final ratio = max <= 0 ? 0.0 : (value / max).clamp(0.0, 1.0);

    return Semantics(
      label: label ?? '$value / $max',
      value: '${(ratio * 100).round()}%',
      child: ExcludeSemantics(
        child: Container(
          height: height,
          decoration: BoxDecoration(
            color: QuizRealmColors.backgroundDeep,
            borderRadius: BorderRadius.circular(QuizRealmRadius.pill),
            border: Border.all(color: QuizRealmColors.goldDeep),
          ),
          child: ClipRRect(
            borderRadius: BorderRadius.circular(QuizRealmRadius.pill),
            child: Stack(
              children: [
                FractionallySizedBox(
                  widthFactor: ratio,
                  child: Container(
                    decoration: const BoxDecoration(
                      gradient: QuizRealmGradients.progressFill,
                    ),
                  ),
                ),
                if (showLabel)
                  Center(
                    child: Padding(
                      padding: const EdgeInsets.symmetric(horizontal: 6),
                      child: Text(
                        label ?? '$value / $max',
                        maxLines: 1,
                        overflow: TextOverflow.ellipsis,
                        style: QuizRealmTypography.numeric.copyWith(
                          fontSize: height * 0.55,
                          shadows: const [
                            Shadow(color: Color(0xCC000000), blurRadius: 3),
                          ],
                        ),
                      ),
                    ),
                  ),
              ],
            ),
          ),
        ),
      ),
    );
  }
}

/// Contorul de monedă: iconiță, valoare și, opțional, butonul „+".
class CurrencyCounter extends StatelessWidget {
  const CurrencyCounter({
    required this.asset,
    required this.value,
    required this.semanticsLabel,
    super.key,
    this.onAdd,
    this.compact = false,
  });

  /// Calea către iconița de resursă din `assets/game/icons/resources/`.
  final String asset;
  final String value;
  final String semanticsLabel;

  /// Butonul „+". Absent ⇒ contorul e doar informativ.
  final VoidCallback? onAdd;
  final bool compact;

  @override
  Widget build(BuildContext context) {
    final iconSize = compact ? 16.0 : 20.0;

    return Semantics(
      label: semanticsLabel,
      button: onAdd != null,
      child: ExcludeSemantics(
        child: Container(
          padding: EdgeInsets.only(
            left: compact ? 4 : 6,
            right: onAdd == null ? (compact ? 8 : 10) : 3,
            top: 3,
            bottom: 3,
          ),
          decoration: BoxDecoration(
            color: QuizRealmColors.backgroundDeep,
            borderRadius: BorderRadius.circular(QuizRealmRadius.pill),
            border: Border.all(color: QuizRealmColors.gold),
          ),
          child: Row(
            mainAxisSize: MainAxisSize.min,
            children: [
              Image.asset(asset, width: iconSize, height: iconSize),
              SizedBox(width: compact ? 4 : 6),
              // Plafon de lățime: contorul nu are voie să împingă numele afară
              // din antet dacă valoarea crește neașteptat de mult.
              ConstrainedBox(
                constraints: const BoxConstraints(maxWidth: 92),
                child: Text(
                  value,
                  maxLines: 1,
                  overflow: TextOverflow.ellipsis,
                  style: QuizRealmTypography.numeric.copyWith(
                    fontSize: compact ? 12 : 14,
                  ),
                ),
              ),
              if (onAdd != null) ...[
                const SizedBox(width: 6),
                _AddButton(onTap: onAdd!, size: compact ? 18 : 22),
              ],
            ],
          ),
        ),
      ),
    );
  }
}

class _AddButton extends StatelessWidget {
  const _AddButton({required this.onTap, required this.size});

  final VoidCallback onTap;
  final double size;

  @override
  Widget build(BuildContext context) {
    return Material(
      color: Colors.transparent,
      child: InkWell(
        onTap: onTap,
        customBorder: const CircleBorder(),
        child: Container(
          width: size,
          height: size,
          alignment: Alignment.center,
          decoration: BoxDecoration(
            shape: BoxShape.circle,
            border: Border.all(color: QuizRealmColors.gold),
          ),
          child: Icon(
            Icons.add,
            size: size * 0.66,
            color: QuizRealmColors.goldBright,
          ),
        ),
      ),
    );
  }
}

/// Antetul de identitate: portret, nume, titlu, bara de XP și resursele.
///
/// E prezent pe 8 din 10 ecrane, deci trăiește în `core/design`, nu în ecranul
/// de acasă. Când [name] lipsește, antetul afișează invitația de autentificare;
/// nu inventează un „nivel 1, 0 monede" pentru un vizitator.
class PlayerIdentityHeader extends StatelessWidget {
  const PlayerIdentityHeader({
    required this.guestLabel,
    super.key,
    this.name,
    this.title,
    this.level,
    this.xp,
    this.xpMax,
    this.xpLabel,
    this.avatar,
    this.currencies = const [],
    this.onTapIdentity,
    this.onMenu,
    this.menuSemanticsLabel,
  });

  final String? name;
  final String? title;
  final int? level;
  final int? xp;
  final int? xpMax;
  final String? xpLabel;
  final ImageProvider? avatar;

  /// Contoarele din dreapta. Ordinea din capturi: aur, apoi cristale.
  final List<Widget> currencies;
  final VoidCallback? onTapIdentity;
  final VoidCallback? onMenu;
  final String? menuSemanticsLabel;

  /// Eticheta pentru un vizitator neautentificat.
  final String guestLabel;

  @override
  Widget build(BuildContext context) {
    final player = name;
    final hasXp = xp != null && xpMax != null;

    final identity = Row(
      crossAxisAlignment: CrossAxisAlignment.start,
      children: [
        if (player == null)
          const PlayerAvatar(name: '?', size: 46)
        else
          AvatarWithLevel(
            name: player,
            level: level ?? 1,
            size: 46,
            imageProvider: avatar,
          ),
        const SizedBox(width: QuizRealmSpacing.sm),
        Expanded(
          child: Column(
            crossAxisAlignment: CrossAxisAlignment.start,
            mainAxisSize: MainAxisSize.min,
            children: [
              Text(
                player ?? guestLabel,
                maxLines: 1,
                overflow: TextOverflow.ellipsis,
                style: QuizRealmTypography.playerName,
              ),
              if (title != null)
                Text(
                  title!,
                  maxLines: 1,
                  overflow: TextOverflow.ellipsis,
                  style: QuizRealmTypography.playerTitle,
                ),
              if (hasXp) ...[
                const SizedBox(height: QuizRealmSpacing.xs),
                Row(
                  children: [
                    const GameIcon(
                      GameSymbol.crown,
                      size: 18,
                      color: QuizRealmColors.goldBright,
                    ),
                    const SizedBox(width: QuizRealmSpacing.xs),
                    Expanded(
                      child: XpProgressBar(
                        value: xp!,
                        max: xpMax!,
                        label: xpLabel,
                        height: 18,
                      ),
                    ),
                  ],
                ),
              ],
            ],
          ),
        ),
      ],
    );

    return Row(
      crossAxisAlignment: CrossAxisAlignment.start,
      children: [
        Expanded(
          child: onTapIdentity == null
              ? identity
              : Material(
                  color: Colors.transparent,
                  child: InkWell(
                    onTap: onTapIdentity,
                    borderRadius: BorderRadius.circular(QuizRealmRadius.md),
                    child: identity,
                  ),
                ),
        ),
        const SizedBox(width: QuizRealmSpacing.sm),
        // Fără flex: partea din dreapta ia exact cât îi trebuie, iar numele
        // primește tot restul. Un `Flexible` aici ar avea implicit `flex: 1` și
        // ar rezerva jumătate din rând chiar și gol — antetul s-ar strânge în
        // stânga, cu butonul de meniu plutind pe mijlocul ecranului.
        Row(
          mainAxisSize: MainAxisSize.min,
          children: [
            for (final currency in currencies) ...[
              currency,
              const SizedBox(width: QuizRealmSpacing.xs),
            ],
            if (onMenu != null)
              _MenuButton(
                onTap: onMenu!,
                semanticsLabel: menuSemanticsLabel ?? 'Meniu',
              ),
          ],
        ),
      ],
    );
  }
}

class _MenuButton extends StatelessWidget {
  const _MenuButton({required this.onTap, required this.semanticsLabel});

  final VoidCallback onTap;
  final String semanticsLabel;

  @override
  Widget build(BuildContext context) {
    return Semantics(
      button: true,
      label: semanticsLabel,
      child: ExcludeSemantics(
        child: Material(
          color: Colors.transparent,
          child: InkWell(
            onTap: onTap,
            customBorder: const CircleBorder(),
            child: Container(
              width: 38,
              height: 38,
              alignment: Alignment.center,
              decoration: BoxDecoration(
                shape: BoxShape.circle,
                color: QuizRealmColors.backgroundDeep,
                border: Border.all(color: QuizRealmColors.gold),
              ),
              child: const Icon(
                Icons.menu,
                size: 20,
                color: QuizRealmColors.goldBright,
              ),
            ),
          ),
        ),
      ),
    );
  }
}

/// Titlul unei secțiuni, cu filetele laterale din capturi.
class SectionHeader extends StatelessWidget {
  const SectionHeader({
    required this.title,
    super.key,
    this.trailing,
    this.symbol,
  });

  final String title;
  final Widget? trailing;
  final GameSymbol? symbol;

  @override
  Widget build(BuildContext context) {
    return Row(
      children: [
        if (symbol != null) ...[
          GameIcon(symbol!, size: 18, color: QuizRealmColors.goldBright),
          const SizedBox(width: QuizRealmSpacing.sm),
        ],
        Expanded(
          child: Text(
            title.toUpperCase(),
            maxLines: 1,
            overflow: TextOverflow.ellipsis,
            style: QuizRealmTypography.sectionTitle,
          ),
        ),
        ?trailing,
      ],
    );
  }
}

/// Panoul cu titlu centrat, ca „PROGRES RECENT" și „PASS SEZONIER".
class TitledPanel extends StatelessWidget {
  const TitledPanel({
    required this.title,
    required this.child,
    super.key,
    this.subtitle,
    this.padding = const EdgeInsets.all(QuizRealmSpacing.md),
  });

  final String title;
  final String? subtitle;
  final Widget child;
  final EdgeInsetsGeometry padding;

  @override
  Widget build(BuildContext context) {
    return GoldFrame(
      padding: padding,
      child: Column(
        crossAxisAlignment: CrossAxisAlignment.stretch,
        mainAxisSize: MainAxisSize.min,
        children: [
          Text(
            title.toUpperCase(),
            textAlign: TextAlign.center,
            maxLines: 1,
            overflow: TextOverflow.ellipsis,
            style: QuizRealmTypography.sectionTitle,
          ),
          if (subtitle != null) ...[
            const SizedBox(height: 2),
            Text(
              subtitle!,
              textAlign: TextAlign.center,
              maxLines: 1,
              overflow: TextOverflow.ellipsis,
              style: QuizRealmTypography.bodySecondary,
            ),
          ],
          const SizedBox(height: QuizRealmSpacing.sm),
          child,
        ],
      ),
    );
  }
}
