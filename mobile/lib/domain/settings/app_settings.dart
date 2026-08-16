/// Preferințele jucătorului, păstrate pe dispozitiv.
///
/// Sunt setări de client, nu de cont: volumul sau vibrația n-au ce căuta pe
/// server, iar limba trebuie să funcționeze și fără autentificare.
final class AppSettings {
  const AppSettings({
    this.musicVolume = 0.7,
    this.effectsVolume = 0.8,
    this.vibration = true,
    this.pushNotifications = true,
    this.confirmActions = true,
    this.tutorials = true,
    this.dataSaver = false,
    this.languageCode = 'ro',
  }) : assert(musicVolume >= 0 && musicVolume <= 1),
       assert(effectsVolume >= 0 && effectsVolume <= 1);

  /// Volumele sunt fracții, nu procente: interfața le arată ca procent, dar
  /// mixerul le cere între 0 și 1, iar conversia se face o singură dată, sus.
  final double musicVolume;
  final double effectsVolume;
  final bool vibration;
  final bool pushNotifications;

  /// Cere confirmare la acțiunile importante (părăsirea unui meci, cheltuieli).
  final bool confirmActions;
  final bool tutorials;

  /// Reduce consumul de date: fără ilustrații mari, fără reîmprospătări dese.
  final bool dataSaver;
  final String languageCode;

  static const defaults = AppSettings();

  /// Limbile pe care aplicația chiar le are traduse. Lista trăiește aici ca să
  /// nu se desincronizeze de fișierele ARB fără ca cineva să observe.
  static const supportedLanguages = ['ro', 'en'];

  AppSettings copyWith({
    double? musicVolume,
    double? effectsVolume,
    bool? vibration,
    bool? pushNotifications,
    bool? confirmActions,
    bool? tutorials,
    bool? dataSaver,
    String? languageCode,
  }) {
    return AppSettings(
      musicVolume: musicVolume ?? this.musicVolume,
      effectsVolume: effectsVolume ?? this.effectsVolume,
      vibration: vibration ?? this.vibration,
      pushNotifications: pushNotifications ?? this.pushNotifications,
      confirmActions: confirmActions ?? this.confirmActions,
      tutorials: tutorials ?? this.tutorials,
      dataSaver: dataSaver ?? this.dataSaver,
      languageCode: languageCode ?? this.languageCode,
    );
  }

  Map<String, Object?> toJson() => {
    'musicVolume': musicVolume,
    'effectsVolume': effectsVolume,
    'vibration': vibration,
    'pushNotifications': pushNotifications,
    'confirmActions': confirmActions,
    'tutorials': tutorials,
    'dataSaver': dataSaver,
    'languageCode': languageCode,
  };

  static AppSettings fromJson(Map<String, Object?> json) {
    double volume(Object? value, double fallback) {
      final parsed = value is num ? value.toDouble() : null;
      // Un fișier stricat n-are voie să arunce aplicația la pornire, nici să
      // seteze volumul la o valoare imposibilă.
      return parsed == null ? fallback : parsed.clamp(0.0, 1.0);
    }

    bool flag(Object? value, bool fallback) =>
        value is bool ? value : fallback;

    final language = json['languageCode'];
    return AppSettings(
      musicVolume: volume(json['musicVolume'], defaults.musicVolume),
      effectsVolume: volume(json['effectsVolume'], defaults.effectsVolume),
      vibration: flag(json['vibration'], defaults.vibration),
      pushNotifications: flag(
        json['pushNotifications'],
        defaults.pushNotifications,
      ),
      confirmActions: flag(json['confirmActions'], defaults.confirmActions),
      tutorials: flag(json['tutorials'], defaults.tutorials),
      dataSaver: flag(json['dataSaver'], defaults.dataSaver),
      languageCode: supportedLanguages.contains(language)
          ? language! as String
          : defaults.languageCode,
    );
  }
}
