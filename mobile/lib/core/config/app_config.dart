class AppConfig {
  const AppConfig._();

  static const apiBaseUrl = String.fromEnvironment(
    'API_BASE_URL',
    defaultValue: 'http://10.0.2.2:3000',
  );

  /// Serviciul realtime rulează separat de API (implicit pe portul 3001).
  static const realtimeBaseUrl = String.fromEnvironment(
    'REALTIME_BASE_URL',
    defaultValue: 'http://10.0.2.2:3001',
  );

  /// Cheia publică Turnstile; secretul de verificare rămâne exclusiv în API.
  static const turnstileSiteKey = String.fromEnvironment(
    'TURNSTILE_SITE_KEY',
    defaultValue: '',
  );

  /// Domeniu permis în widgetul Turnstile pentru Android/iOS.
  static const turnstileBaseUrl = String.fromEnvironment(
    'TURNSTILE_BASE_URL',
    defaultValue: 'https://quizrealm.app',
  );

  static Uri get apiBaseUri => _normalized(apiBaseUrl);

  static Uri get realtimeBaseUri => _normalized(realtimeBaseUrl);

  static Uri _normalized(String url) {
    return Uri.parse(url.endsWith('/') ? url : '$url/');
  }
}
