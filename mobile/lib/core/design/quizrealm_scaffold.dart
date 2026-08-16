import 'package:flutter/material.dart';

import '../ui/game_icons.dart';
import 'quizrealm_tokens.dart';

/// Structura comună a oricărui ecran: fundal, antet de identitate, titlu cu
/// filet, conținut și bara de jos.
///
/// Ecranele nu-și mai construiesc propriul `Scaffold`. Asta ține marginile,
/// fundalul și zonele sigure identice peste tot — în capturi nu există niciun
/// ecran care să se abată de la ele.
class QuizRealmScaffold extends StatelessWidget {
  const QuizRealmScaffold({
    required this.body,
    super.key,
    this.header,
    this.title,
    this.onBack,
    this.backSemanticsLabel,
    this.titleTrailing,
    this.bottomNavigation,
    this.floating,
    this.padded = true,
    this.scrollable = true,
    this.backdrop,
    this.onRefresh,
  });

  /// Antetul de identitate. Absent pe ecranele de autentificare.
  final Widget? header;

  /// Titlul ecranului, majuscule, între două filete aurii.
  final String? title;
  final VoidCallback? onBack;
  final String? backSemanticsLabel;
  final Widget? titleTrailing;
  final Widget body;
  final Widget? bottomNavigation;

  /// Element suprapus peste conținut (bară de acțiuni, panou de așteptare).
  final Widget? floating;

  /// Marginile laterale standard. Ecranele cu listă pe toată lățimea le opresc.
  final bool padded;
  final bool scrollable;

  /// Ilustrația de fundal, când ecranul o cere (acasă, campanie).
  final Widget? backdrop;

  /// Trage-pentru-reîmprospătare. Doar pe ecranele care chiar reîncarcă de pe
  /// server; pe cele pur locale gestul ar promite ceva ce nu se întâmplă.
  final Future<void> Function()? onRefresh;

  @override
  Widget build(BuildContext context) {
    final content = Column(
      crossAxisAlignment: CrossAxisAlignment.stretch,
      mainAxisSize: MainAxisSize.min,
      children: [
        if (title != null) ...[
          const SizedBox(height: QuizRealmSpacing.sm),
          QuizRealmTopBar(
            title: title!,
            onBack: onBack,
            backSemanticsLabel: backSemanticsLabel,
            trailing: titleTrailing,
          ),
          const SizedBox(height: QuizRealmSpacing.md),
        ],
        body,
      ],
    );

    final padding = padded
        ? const EdgeInsets.symmetric(horizontal: QuizRealmSpacing.screenGutter)
        : EdgeInsets.zero;

    return Scaffold(
      backgroundColor: QuizRealmColors.background,
      body: Container(
        decoration: const BoxDecoration(gradient: QuizRealmGradients.screen),
        child: Stack(
          children: [
            if (backdrop != null) Positioned.fill(child: backdrop!),
            SafeArea(
              bottom: false,
              child: Column(
                children: [
                  if (header != null)
                    Padding(
                      padding: const EdgeInsets.fromLTRB(
                        QuizRealmSpacing.screenGutter,
                        QuizRealmSpacing.sm,
                        QuizRealmSpacing.screenGutter,
                        0,
                      ),
                      child: header!,
                    ),
                  Expanded(child: _buildBody(padding, content)),
                  ?bottomNavigation,
                ],
              ),
            ),
            if (floating != null) Positioned.fill(child: floating!),
          ],
        ),
      ),
    );
  }

  Widget _buildBody(EdgeInsets padding, Widget content) {
    if (!scrollable) return Padding(padding: padding, child: content);

    final scroll = SingleChildScrollView(
      // `always` ca gestul de reîmprospătare să meargă și când conținutul e
      // mai scurt decât ecranul.
      physics: onRefresh == null
          ? null
          : const AlwaysScrollableScrollPhysics(),
      padding: padding.add(const EdgeInsets.only(bottom: QuizRealmSpacing.lg)),
      child: content,
    );

    if (onRefresh == null) return scroll;
    return RefreshIndicator(
      onRefresh: onRefresh!,
      color: QuizRealmColors.goldBright,
      backgroundColor: QuizRealmColors.surfaceRaised,
      child: scroll,
    );
  }
}

/// Rândul de titlu: buton de întoarcere încadrat, titlu centrat, filete aurii
/// cu romb pe laturi.
class QuizRealmTopBar extends StatelessWidget {
  const QuizRealmTopBar({
    required this.title,
    super.key,
    this.onBack,
    this.backSemanticsLabel,
    this.trailing,
  });

  final String title;
  final VoidCallback? onBack;
  final String? backSemanticsLabel;
  final Widget? trailing;

  @override
  Widget build(BuildContext context) {
    return Row(
      children: [
        if (onBack != null) ...[
          _FramedIconButton(
            symbol: GameSymbol.back,
            onTap: onBack!,
            semanticsLabel: backSemanticsLabel ?? 'Înapoi',
          ),
          const SizedBox(width: QuizRealmSpacing.sm),
        ],
        Expanded(
          child: Row(
            children: [
              const Expanded(child: _TitleRule(flipped: false)),
              Padding(
                padding: const EdgeInsets.symmetric(
                  horizontal: QuizRealmSpacing.sm,
                ),
                child: Text(
                  title.toUpperCase(),
                  maxLines: 1,
                  overflow: TextOverflow.ellipsis,
                  style: QuizRealmTypography.screenTitle,
                ),
              ),
              const Expanded(child: _TitleRule(flipped: true)),
            ],
          ),
        ),
        if (trailing != null) ...[
          const SizedBox(width: QuizRealmSpacing.sm),
          trailing!,
        ],
      ],
    );
  }
}

/// Filetul de lângă titlu: linie stinsă spre capăt, cu un romb pe ea.
class _TitleRule extends StatelessWidget {
  const _TitleRule({required this.flipped});

  final bool flipped;

  @override
  Widget build(BuildContext context) {
    final gradient = LinearGradient(
      begin: flipped ? Alignment.centerLeft : Alignment.centerRight,
      end: flipped ? Alignment.centerRight : Alignment.centerLeft,
      colors: const [QuizRealmColors.gold, Color(0x00C9A45C)],
    );

    final line = Expanded(
      child: Container(
        height: 1,
        decoration: BoxDecoration(gradient: gradient),
      ),
    );
    final diamond = Transform.rotate(
      angle: 0.785398,
      child: Container(width: 5, height: 5, color: QuizRealmColors.goldBright),
    );

    return SizedBox(
      height: 12,
      child: Row(
        // Rombul stă întotdeauna spre titlu, deci laturile se oglindesc.
        children: flipped ? [diamond, line] : [line, diamond],
      ),
    );
  }
}

class _FramedIconButton extends StatelessWidget {
  const _FramedIconButton({
    required this.symbol,
    required this.onTap,
    required this.semanticsLabel,
  });

  final GameSymbol symbol;
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
            borderRadius: BorderRadius.circular(QuizRealmRadius.md),
            child: Container(
              width: 48,
              height: 40,
              alignment: Alignment.center,
              decoration: BoxDecoration(
                color: QuizRealmColors.surfacePanel,
                borderRadius: BorderRadius.circular(QuizRealmRadius.md),
                border: Border.all(
                  color: QuizRealmColors.gold,
                  width: QuizRealmBorders.frame,
                ),
              ),
              child: GameIcon(
                symbol,
                size: 22,
                color: QuizRealmColors.goldBright,
              ),
            ),
          ),
        ),
      ),
    );
  }
}

/// Despărțitorul cu romb, folosit sub titlu și între grupuri de panouri.
class DiamondDivider extends StatelessWidget {
  const DiamondDivider({super.key, this.padding = QuizRealmSpacing.sm});

  final double padding;

  @override
  Widget build(BuildContext context) {
    return Padding(
      padding: EdgeInsets.symmetric(vertical: padding),
      child: Row(
        children: [
          const Expanded(child: _FadingLine(fromLeft: true)),
          Padding(
            padding: const EdgeInsets.symmetric(horizontal: QuizRealmSpacing.sm),
            child: Transform.rotate(
              angle: 0.785398,
              child: Container(
                width: 8,
                height: 8,
                decoration: BoxDecoration(
                  color: QuizRealmColors.electric,
                  border: Border.all(color: QuizRealmColors.goldBright),
                ),
              ),
            ),
          ),
          const Expanded(child: _FadingLine(fromLeft: false)),
        ],
      ),
    );
  }
}

class _FadingLine extends StatelessWidget {
  const _FadingLine({required this.fromLeft});

  final bool fromLeft;

  @override
  Widget build(BuildContext context) {
    return Container(
      height: 1,
      decoration: BoxDecoration(
        gradient: LinearGradient(
          begin: fromLeft ? Alignment.centerLeft : Alignment.centerRight,
          end: fromLeft ? Alignment.centerRight : Alignment.centerLeft,
          colors: const [Color(0x00C9A45C), QuizRealmColors.gold],
        ),
      ),
    );
  }
}
