/// Cum arată cosmeticele din `owner-plan.md` §4.1, §4.2, §4.5 și §4.8.
///
/// Ramele, bannerele și stilurile de nume sunt **desenate**, nu imagini. Nu e o
/// soluție de compromis pentru artă care lipsește: §4.2 cere explicit „imagine
/// **sau** gradient", iar o ramă redată în cod arată la fel de bine la 32 și la
/// 120 de pixeli, fără o variantă de asset pentru fiecare dimensiune.
///
/// Portretele sunt singurele imagini reale. Sunt două, câte există în
/// `assets/game/avatars/` — vezi `ASSET_GAPS.md` pentru restul.
library;

import 'package:flutter/widgets.dart';

import 'quizrealm_tokens.dart';

/// Perechea de culori a unei rame: reflex și umbră.
typedef FrameColors = (Color light, Color dark);

abstract final class ProfileVisuals {
  /// Portretul, când codul are o ilustrație. `null` ⇒ se desenează inițiala.
  static String? avatarAsset(String? code) => switch (code) {
    'avatar-duelist-blue' => 'assets/game/avatars/default_duelist_blue.png',
    'avatar-duelist-crimson' =>
      'assets/game/avatars/default_duelist_crimson.png',
    _ => null,
  };

  /// Culorile ramei de portret (§4.1, „avatar decorations").
  static FrameColors frameColors(String? code) => switch (code) {
    'frame-silver' => (const Color(0xFFDCE6F2), const Color(0xFF6E7C90)),
    'frame-emerald' => (const Color(0xFF7BF0C6), const Color(0xFF16795E)),
    'frame-sapphire' => (const Color(0xFF7FC9FF), const Color(0xFF10538B)),
    'frame-amethyst' => (const Color(0xFFC9A6FF), const Color(0xFF4C289C)),
    'frame-ember' => (const Color(0xFFFFB08A), const Color(0xFF9C2E17)),
    _ => (QuizRealmColors.goldLight, QuizRealmColors.goldDeep),
  };

  /// Rama de vârf primește un halou: e singura recompensă de rang maxim din
  /// catalog, iar o simplă schimbare de culoare s-ar pierde pe un ecran mic.
  static bool frameGlows(String? code) => code == 'frame-ember';

  /// Degradeul bannerului de profil (§4.2).
  static LinearGradient bannerGradient(String? code) {
    final colors = switch (code) {
      'banner-dawn' => [
        const Color(0xFF2A1B4D),
        const Color(0xFF7A3B6B),
        const Color(0xFFE0915C),
      ],
      'banner-ember' => [
        const Color(0xFF2A0C08),
        const Color(0xFF8C2B14),
        const Color(0xFFE0763C),
      ],
      'banner-emerald' => [
        const Color(0xFF041A14),
        const Color(0xFF11614A),
        const Color(0xFF4FC79B),
      ],
      'banner-royal' => [
        const Color(0xFF190A33),
        const Color(0xFF4A1C8C),
        const Color(0xFF9A6BEA),
      ],
      'banner-legend' => [
        const Color(0xFF241703),
        const Color(0xFF8A6212),
        const Color(0xFFF3CE72),
      ],
      _ => [
        QuizRealmColors.backgroundDeep,
        const Color(0xFF04203F),
        const Color(0xFF0A3A7A),
      ],
    };
    return LinearGradient(
      begin: Alignment.bottomLeft,
      end: Alignment.topRight,
      colors: colors,
    );
  }

  /// Culorile unui stil de nume (§4.5). Două culori ⇒ degradeu; una singură ⇒
  /// culoare plină.
  static List<Color> nameStyleColors(String? code) => switch (code) {
    'name-azure' => const [Color(0xFF9BE0FF), Color(0xFF2F8FD8)],
    'name-ember' => const [Color(0xFFFFD3A8), Color(0xFFD9541F)],
    'name-legend' => const [
      Color(0xFFFFF3C4),
      Color(0xFFF3C662),
      Color(0xFFB8791A),
    ],
    _ => const [QuizRealmColors.textPrimary],
  };

  /// Culoarea de accent a paginii de profil (§4.8).
  static Color themeAccent(String? code) => switch (code) {
    'azure' => QuizRealmColors.electric,
    'ember' => const Color(0xFFE0763C),
    'emerald' => const Color(0xFF4FC79B),
    'amethyst' => const Color(0xFF9A6BEA),
    _ => QuizRealmColors.gold,
  };
}

/// Numele jucătorului, colorat după stilul echipat.
///
/// Un degradeu pe text cere un `ShaderMask`, care are nevoie de dimensiunea
/// finală: de aceea culoarea plină rămâne calea implicită, fără shader inutil.
class StyledPlayerName extends StatelessWidget {
  const StyledPlayerName({
    required this.name,
    super.key,
    this.styleCode,
    this.style,
    this.textAlign,
    this.maxLines = 1,
  });

  final String name;
  final String? styleCode;
  final TextStyle? style;
  final TextAlign? textAlign;
  final int maxLines;

  @override
  Widget build(BuildContext context) {
    final colors = ProfileVisuals.nameStyleColors(styleCode);
    final base = (style ?? QuizRealmTypography.playerName).copyWith(
      color: colors.first,
    );
    final text = Text(
      name,
      textAlign: textAlign,
      maxLines: maxLines,
      overflow: TextOverflow.ellipsis,
      style: base,
    );

    if (colors.length < 2) return text;

    return ShaderMask(
      // `srcIn`: degradeul înlocuiește culoarea glifelor, nu fundalul din
      // spatele lor. Cu modul implicit, textul ar fi acoperit de o bandă.
      blendMode: BlendMode.srcIn,
      shaderCallback: (bounds) => LinearGradient(
        colors: colors,
        begin: Alignment.topLeft,
        end: Alignment.bottomRight,
      ).createShader(bounds),
      child: Text(
        name,
        textAlign: textAlign,
        maxLines: maxLines,
        overflow: TextOverflow.ellipsis,
        style: base.copyWith(color: const Color(0xFFFFFFFF)),
      ),
    );
  }
}

/// Portret cu ramă echipată: inel dublu, în culorile ramei.
class FramedAvatar extends StatelessWidget {
  const FramedAvatar({
    required this.name,
    super.key,
    this.avatarCode,
    this.frameCode,
    this.size = 96,
  });

  final String name;
  final String? avatarCode;
  final String? frameCode;
  final double size;

  @override
  Widget build(BuildContext context) {
    final (light, dark) = ProfileVisuals.frameColors(frameCode);
    final asset = ProfileVisuals.avatarAsset(avatarCode);

    return SizedBox.square(
      dimension: size,
      child: DecoratedBox(
        decoration: BoxDecoration(
          shape: BoxShape.circle,
          gradient: LinearGradient(
            begin: Alignment.topCenter,
            end: Alignment.bottomCenter,
            colors: [light, dark],
          ),
          boxShadow: ProfileVisuals.frameGlows(frameCode)
              ? [BoxShadow(color: light.withValues(alpha: 0.5), blurRadius: 18)]
              : QuizRealmShadows.panel,
        ),
        child: Padding(
          // Grosimea inelului urmează dimensiunea: o valoare fixă ar înghiți
          // portretul la 32 px și ar dispărea la 120.
          padding: EdgeInsets.all(size * 0.045),
          child: DecoratedBox(
            decoration: BoxDecoration(
              shape: BoxShape.circle,
              color: QuizRealmColors.surfaceRaised,
              border: Border.all(
                color: QuizRealmColors.backgroundDeep,
                width: 1.5,
              ),
              image: asset == null
                  ? null
                  : DecorationImage(image: AssetImage(asset), fit: BoxFit.cover),
            ),
            child: asset != null
                ? null
                : Center(
                    child: Text(
                      _initial(name),
                      style: QuizRealmTypography.screenTitle.copyWith(
                        fontSize: size * 0.36,
                        letterSpacing: 0,
                        color: light,
                      ),
                    ),
                  ),
          ),
        ),
      ),
    );
  }

  static String _initial(String name) {
    final trimmed = name.trim();
    return trimmed.isEmpty ? '?' : trimmed.characters.first.toUpperCase();
  }
}

/// Banda de sus a paginii de profil (§4.2).
class ProfileBanner extends StatelessWidget {
  const ProfileBanner({
    required this.child,
    super.key,
    this.bannerCode,
    this.height = 132,
  });

  final Widget child;
  final String? bannerCode;
  final double height;

  @override
  Widget build(BuildContext context) {
    return ClipRRect(
      borderRadius: BorderRadius.circular(QuizRealmRadius.lg),
      child: Container(
        height: height,
        decoration: BoxDecoration(
          gradient: ProfileVisuals.bannerGradient(bannerCode),
        ),
        child: Stack(
          fit: StackFit.expand,
          children: [
            // Voal întunecat spre bază: numele stă peste banner, iar pe
            // degradeurile deschise ar deveni ilizibil.
            const DecoratedBox(
              decoration: BoxDecoration(
                gradient: LinearGradient(
                  begin: Alignment.topCenter,
                  end: Alignment.bottomCenter,
                  colors: [Color(0x00000000), Color(0xB3000814)],
                ),
              ),
            ),
            child,
          ],
        ),
      ),
    );
  }
}
