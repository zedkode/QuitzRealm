/// Cosmeticele de profil din `owner-plan.md` §4.1, §4.2 și §4.5.
///
/// Catalogul, deblocările și ce e purtat vin de la server. Aplicația nu decide
/// niciodată dacă un obiect e deblocat: îl afișează așa cum l-a marcat
/// serverul, care e singurul care cunoaște nivelul și rangul reale.
library;

/// Ce fel de cosmetic e. Valorile de pe fir sunt cele din enum-ul Prisma.
enum CosmeticKind {
  avatar('AVATAR'),
  frame('FRAME'),
  banner('BANNER'),
  nameStyle('NAME_STYLE'),
  title('TITLE');

  const CosmeticKind(this.wireValue);

  /// Separat de `name`: `nameStyle` pe Dart, `NAME_STYLE` pe fir. Legate prin
  /// convenție, s-ar rupe tăcut la prima redenumire.
  final String wireValue;

  static CosmeticKind? fromWire(String? value) {
    for (final kind in CosmeticKind.values) {
      if (kind.wireValue == value) return kind;
    }
    return null;
  }
}

/// Raritatea, ca în §3.3. E o etichetă de afișare: aici nu se calculează nimic.
enum CosmeticRarity {
  common,
  rare,
  epic,
  legendary,
  mythic;

  static CosmeticRarity fromWire(String? value) => switch (value) {
    'rare' => CosmeticRarity.rare,
    'epic' => CosmeticRarity.epic,
    'legendary' => CosmeticRarity.legendary,
    'mythic' => CosmeticRarity.mythic,
    _ => CosmeticRarity.common,
  };
}

class CosmeticItem {
  const CosmeticItem({
    required this.code,
    required this.kind,
    required this.rarity,
    required this.unlocked,
    required this.equipped,
    this.unlockLevel,
    this.unlockRankOrder,
  });

  /// Cheia stabilă. Desenul și traducerea se leagă de ea, nu de nume.
  final String code;
  final CosmeticKind kind;
  final CosmeticRarity rarity;

  /// Poate fi purtat acum. Calculat pe server.
  final bool unlocked;
  final bool equipped;

  /// Condiția de deblocare, ca ecranul să poată spune **de ce** e blocat.
  /// Un lacăt fără explicație e mai frustrant decât un obiect care lipsește.
  final int? unlockLevel;
  final int? unlockRankOrder;

  static CosmeticItem? fromJson(Map<String, Object?> json) {
    final kind = CosmeticKind.fromWire(json['type']?.toString());
    // Un tip necunoscut vine dintr-un server mai nou decât aplicația. Se sare
    // peste el, nu se prăbușește ecranul de cosmetice.
    if (kind == null) return null;

    int? asInt(Object? value) =>
        value is num ? value.round() : int.tryParse(value?.toString() ?? '');

    return CosmeticItem(
      code: json['code']?.toString() ?? '',
      kind: kind,
      rarity: CosmeticRarity.fromWire(json['rarity']?.toString()),
      unlocked: json['unlocked'] == true,
      equipped: json['equipped'] == true,
      unlockLevel: asInt(json['unlockLevel']),
      unlockRankOrder: asInt(json['unlockRankOrder']),
    );
  }
}

/// Ce poartă jucătorul acum, pe fiecare tip.
class EquippedCosmetics {
  const EquippedCosmetics({
    this.avatar,
    this.frame,
    this.banner,
    this.nameStyle,
    this.title,
  });

  final String? avatar;
  final String? frame;
  final String? banner;
  final String? nameStyle;

  /// `null` e o stare validă: un jucător poate alege să n-aibă niciun titlu.
  final String? title;

  static const empty = EquippedCosmetics();

  String? of(CosmeticKind kind) => switch (kind) {
    CosmeticKind.avatar => avatar,
    CosmeticKind.frame => frame,
    CosmeticKind.banner => banner,
    CosmeticKind.nameStyle => nameStyle,
    CosmeticKind.title => title,
  };

  static EquippedCosmetics fromJson(Object? payload) {
    if (payload is! Map<String, Object?>) return empty;
    String? at(CosmeticKind kind) => payload[kind.wireValue]?.toString();
    return EquippedCosmetics(
      avatar: at(CosmeticKind.avatar),
      frame: at(CosmeticKind.frame),
      banner: at(CosmeticKind.banner),
      nameStyle: at(CosmeticKind.nameStyle),
      title: at(CosmeticKind.title),
    );
  }
}
