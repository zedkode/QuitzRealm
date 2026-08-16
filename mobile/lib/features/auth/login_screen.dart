import 'package:cloudflare_turnstile/cloudflare_turnstile.dart';
import 'package:flutter/material.dart';
import 'package:flutter_riverpod/flutter_riverpod.dart';
import 'package:go_router/go_router.dart';

import '../../core/config/app_config.dart';
import '../../core/providers/repository_providers.dart';
import '../../core/theme/app_theme.dart';
import '../../core/ui/game_button.dart';
import '../../core/ui/game_frame.dart';
import '../../core/ui/game_icons.dart';
import '../../core/ui/realm_backdrop.dart';
import '../../l10n/app_localizations.dart';
import 'auth_controller.dart';

class LoginScreen extends ConsumerStatefulWidget {
  const LoginScreen({super.key});

  @override
  ConsumerState<LoginScreen> createState() => _LoginScreenState();
}

class _LoginScreenState extends ConsumerState<LoginScreen> {
  final _formKey = GlobalKey<FormState>();
  final _usernameController = TextEditingController();
  final _emailController = TextEditingController();
  final _passwordController = TextEditingController();
  final _twoFactorController = TextEditingController();
  bool _registerMode = false;
  DateTime? _birthDate;
  String? _captchaToken;

  @override
  void dispose() {
    _usernameController.dispose();
    _emailController.dispose();
    _passwordController.dispose();
    _twoFactorController.dispose();
    super.dispose();
  }

  @override
  Widget build(BuildContext context) {
    final l10n = AppLocalizations.of(context);
    final auth = ref.watch(authControllerProvider);
    final loading = auth.status == AuthStatus.loading;
    final twoFactorFlow =
        auth.status == AuthStatus.twoFactorRequired ||
        (loading && auth.twoFactorChallenge != null);

    return Scaffold(
      body: RealmBackdrop(
        artAsset: 'assets/game/realm_map_v2.png',
        artOpacity: 0.22,
        child: SafeArea(
          child: SingleChildScrollView(
            padding: const EdgeInsets.fromLTRB(20, 10, 20, 28),
            child: ConstrainedBox(
              constraints: const BoxConstraints(maxWidth: 470),
              child: Column(
                crossAxisAlignment: CrossAxisAlignment.stretch,
                children: [
                  Row(
                    children: [
                      GameIconButton(
                        symbol: GameSymbol.back,
                        tooltip: l10n.backLabel,
                        onPressed: () => context.pop(),
                      ),
                    ],
                  ),
                  const SizedBox(height: 10),
                  Center(
                    child: Semantics(
                      label: l10n.appTitle,
                      image: true,
                      child: Image.asset(
                        'assets/game/quizrealm_crest.png',
                        height: 108,
                        filterQuality: FilterQuality.high,
                      ),
                    ),
                  ),
                  const SizedBox(height: 16),
                  Text(
                    l10n.loginEyebrow,
                    textAlign: TextAlign.center,
                    style: GameText.eyebrow,
                  ),
                  const SizedBox(height: 8),
                  Text(
                    l10n.loginTitle,
                    textAlign: TextAlign.center,
                    style: GameText.title,
                  ),
                  const SizedBox(height: 6),
                  Text(
                    l10n.accountOptionalNote,
                    textAlign: TextAlign.center,
                    style: GameText.bodyDim,
                  ),
                  const SizedBox(height: 20),
                  GameFrame(
                    child: twoFactorFlow
                        ? _TwoFactorForm(
                            controller: _twoFactorController,
                            loading: loading,
                            hasError: auth.hasError,
                            onSubmit: () => ref
                                .read(authControllerProvider.notifier)
                                .completeTwoFactorLogin(
                                  _twoFactorController.text,
                                ),
                            onCancel: () => ref
                                .read(authControllerProvider.notifier)
                                .cancelTwoFactorLogin(),
                          )
                        : Form(
                            key: _formKey,
                            child: Column(
                              crossAxisAlignment: CrossAxisAlignment.stretch,
                              children: [
                                if (_registerMode) ...[
                                  TextFormField(
                                    key: const Key('username-field'),
                                    controller: _usernameController,
                                    textInputAction: TextInputAction.next,
                                    style: GameText.body,
                                    decoration: InputDecoration(
                                      labelText: l10n.usernameLabel,
                                    ),
                                    validator: (value) =>
                                        value == null || value.trim().isEmpty
                                        ? l10n.fieldRequired
                                        : null,
                                  ),
                                  const SizedBox(height: 12),
                                  _BirthDateField(
                                    value: _birthDate,
                                    onPick: _pickBirthDate,
                                  ),
                                  const SizedBox(height: 12),
                                  if (AppConfig
                                      .turnstileSiteKey
                                      .isNotEmpty) ...[
                                    Container(
                                      key: const Key('turnstile-field'),
                                      padding: const EdgeInsets.symmetric(
                                        vertical: 4,
                                      ),
                                      decoration: BoxDecoration(
                                        color: GamePalette.stone900.withValues(
                                          alpha: 0.72,
                                        ),
                                        borderRadius: BorderRadius.circular(12),
                                        border: Border.all(
                                          color: GamePalette.gold.withValues(
                                            alpha: 0.28,
                                          ),
                                        ),
                                      ),
                                      child: CloudflareTurnstile(
                                        siteKey: AppConfig.turnstileSiteKey,
                                        baseUrl: AppConfig.turnstileBaseUrl,
                                        options: TurnstileOptions(
                                          size: TurnstileSize.normal,
                                          theme: TurnstileTheme.dark,
                                          retryAutomatically: true,
                                        ),
                                        onTokenReceived: (token) {
                                          if (mounted) {
                                            setState(
                                              () => _captchaToken = token,
                                            );
                                          }
                                        },
                                      ),
                                    ),
                                    const SizedBox(height: 12),
                                  ],
                                ],
                                TextFormField(
                                  key: const Key('email-field'),
                                  controller: _emailController,
                                  keyboardType: TextInputType.emailAddress,
                                  textInputAction: TextInputAction.next,
                                  style: GameText.body,
                                  decoration: InputDecoration(
                                    labelText: l10n.emailLabel,
                                  ),
                                  validator: (value) =>
                                      value == null || value.trim().isEmpty
                                      ? l10n.fieldRequired
                                      : null,
                                ),
                                const SizedBox(height: 12),
                                TextFormField(
                                  key: const Key('password-field'),
                                  controller: _passwordController,
                                  obscureText: true,
                                  style: GameText.body,
                                  onFieldSubmitted: (_) {
                                    if (!loading) _submit();
                                  },
                                  decoration: InputDecoration(
                                    labelText: l10n.passwordLabel,
                                    helperText: _registerMode
                                        ? l10n.passwordHint
                                        : null,
                                  ),
                                  validator: (value) =>
                                      value == null || value.isEmpty
                                      ? l10n.fieldRequired
                                      : null,
                                ),
                                if (auth.hasError) ...[
                                  const SizedBox(height: 12),
                                  Text(
                                    l10n.authGenericError,
                                    key: const Key('auth-error'),
                                    style: GameText.body.copyWith(
                                      color: GamePalette.crimson,
                                    ),
                                  ),
                                ],
                                const SizedBox(height: 18),
                                if (loading)
                                  const Center(
                                    child: CircularProgressIndicator(),
                                  )
                                else
                                  GameButton(
                                    key: const Key('auth-submit'),
                                    label: _registerMode
                                        ? l10n.createAccountButton
                                        : l10n.loginButton,
                                    icon: GameSymbol.crown,
                                    onPressed: _submit,
                                  ),
                                if (!_registerMode && !loading) ...[
                                  const SizedBox(height: 8),
                                  GameButton(
                                    key: const Key('google-auth-submit'),
                                    label: l10n.continueWithGoogle,
                                    icon: GameSymbol.crown,
                                    compact: true,
                                    tone: GameButtonTone.stone,
                                    onPressed: () => ref
                                        .read(authControllerProvider.notifier)
                                        .loginWithGoogle(),
                                  ),
                                ],
                                const SizedBox(height: 6),
                                TextButton(
                                  onPressed: loading
                                      ? null
                                      : () => setState(() {
                                          _registerMode = !_registerMode;
                                          _captchaToken = null;
                                        }),
                                  child: Text(
                                    _registerMode
                                        ? l10n.switchToLogin
                                        : l10n.switchToRegister,
                                  ),
                                ),
                                if (!_registerMode)
                                  TextButton(
                                    onPressed: loading
                                        ? null
                                        : _requestPasswordReset,
                                    child: Text(l10n.forgotPassword),
                                  ),
                              ],
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

  /// Vârsta minimă acceptată de server (`account-policy.ts`). O verificăm și
  /// aici doar ca să dăm un mesaj clar; decizia rămâne a serverului.
  static const _minimumAgeYears = 13;

  void _showFormError(String message) {
    ScaffoldMessenger.of(context)
      ..clearSnackBars()
      ..showSnackBar(
        SnackBar(
          backgroundColor: GamePalette.stone800,
          behavior: SnackBarBehavior.floating,
          content: Text(message, style: GameText.body),
        ),
      );
  }

  Future<void> _requestPasswordReset() async {
    final l10n = AppLocalizations.of(context);
    final email = _emailController.text.trim();
    if (email.isEmpty) {
      _showFormError(l10n.emailLabel);
      return;
    }
    try {
      await ref.read(authRepositoryProvider).requestPasswordReset(email);
      if (!mounted) return;
      _showFormError(l10n.passwordResetSent);
    } catch (_) {
      // Păstrăm același răspuns la client ca la API: nu dezvăluim dacă un cont
      // există sau dacă providerul de mail a putut fi contactat.
      if (!mounted) return;
      _showFormError(l10n.passwordResetSent);
    }
  }

  Future<void> _pickBirthDate() async {
    final now = DateTime.now();
    final picked = await showDatePicker(
      context: context,
      initialDate: _birthDate ?? DateTime(now.year - 18, now.month, now.day),
      firstDate: DateTime(now.year - 100),
      lastDate: now,
      helpText: AppLocalizations.of(context).birthDateLabel,
    );
    if (picked != null && mounted) setState(() => _birthDate = picked);
  }

  Future<void> _submit() async {
    if (!_formKey.currentState!.validate()) return;
    final controller = ref.read(authControllerProvider.notifier);
    if (_registerMode) {
      final birthDate = _birthDate;
      final l10n = AppLocalizations.of(context);
      if (birthDate == null) {
        _showFormError(l10n.fieldRequired);
        return;
      }
      if (_ageAt(birthDate, DateTime.now()) < _minimumAgeYears) {
        _showFormError(l10n.birthDateTooYoung(_minimumAgeYears));
        return;
      }
      if (AppConfig.turnstileSiteKey.isNotEmpty &&
          (_captchaToken == null || _captchaToken!.trim().isEmpty)) {
        _showFormError(
          'Completează verificarea anti-bot înainte de a continua.',
        );
        return;
      }
      await controller.register(
        username: _usernameController.text,
        email: _emailController.text,
        password: _passwordController.text,
        birthDate: birthDate,
        captchaToken: _captchaToken,
      );
    } else {
      await controller.login(
        email: _emailController.text,
        password: _passwordController.text,
      );
    }
  }
}

class _TwoFactorForm extends StatelessWidget {
  const _TwoFactorForm({
    required this.controller,
    required this.loading,
    required this.hasError,
    required this.onSubmit,
    required this.onCancel,
  });

  final TextEditingController controller;
  final bool loading;
  final bool hasError;
  final VoidCallback onSubmit;
  final VoidCallback onCancel;

  @override
  Widget build(BuildContext context) {
    final l10n = AppLocalizations.of(context);
    return Column(
      key: const Key('two-factor-form'),
      crossAxisAlignment: CrossAxisAlignment.stretch,
      children: [
        const Center(child: GameIcon(GameSymbol.shield, size: 42)),
        const SizedBox(height: 12),
        Text(
          l10n.twoFactorTitle,
          textAlign: TextAlign.center,
          style: GameText.title,
        ),
        const SizedBox(height: 8),
        Text(
          l10n.twoFactorBody,
          textAlign: TextAlign.center,
          style: GameText.bodyDim,
        ),
        const SizedBox(height: 18),
        TextFormField(
          key: const Key('two-factor-code-field'),
          controller: controller,
          autofocus: true,
          autocorrect: false,
          enableSuggestions: false,
          textInputAction: TextInputAction.done,
          style: GameText.body,
          decoration: InputDecoration(labelText: l10n.twoFactorCodeLabel),
          onFieldSubmitted: (_) {
            if (!loading && controller.text.trim().isNotEmpty) onSubmit();
          },
        ),
        if (hasError) ...[
          const SizedBox(height: 12),
          Text(
            l10n.twoFactorInvalid,
            key: const Key('two-factor-error'),
            textAlign: TextAlign.center,
            style: GameText.body.copyWith(color: GamePalette.crimson),
          ),
        ],
        const SizedBox(height: 18),
        if (loading)
          const Center(child: CircularProgressIndicator())
        else
          GameButton(
            key: const Key('two-factor-submit'),
            label: l10n.twoFactorVerify,
            icon: GameSymbol.shield,
            onPressed: () {
              if (controller.text.trim().isNotEmpty) onSubmit();
            },
          ),
        const SizedBox(height: 6),
        TextButton(
          onPressed: loading ? null : onCancel,
          child: Text(l10n.twoFactorCancel),
        ),
      ],
    );
  }
}

/// Vârsta împlinită, pe calendar. Aceeași regulă ca pe server.
int _ageAt(DateTime birthDate, DateTime now) {
  var age = now.year - birthDate.year;
  final beforeBirthday =
      now.month < birthDate.month ||
      (now.month == birthDate.month && now.day < birthDate.day);
  if (beforeBirthday) age -= 1;
  return age;
}

/// Selectorul de dată de naștere, cu aceeași înfățișare ca restul câmpurilor.
class _BirthDateField extends StatelessWidget {
  const _BirthDateField({required this.value, required this.onPick});

  final DateTime? value;
  final VoidCallback onPick;

  @override
  Widget build(BuildContext context) {
    final l10n = AppLocalizations.of(context);
    final formatted = value == null
        ? l10n.birthDatePick
        : '${value!.day.toString().padLeft(2, '0')}.'
              '${value!.month.toString().padLeft(2, '0')}.${value!.year}';

    return InkWell(
      key: const Key('birthdate-field'),
      onTap: onPick,
      child: InputDecorator(
        decoration: InputDecoration(
          labelText: l10n.birthDateLabel,
          helperText: l10n.birthDateHint,
        ),
        child: Row(
          children: [
            const GameIcon(GameSymbol.scroll, size: 18),
            const SizedBox(width: 10),
            Expanded(
              child: Text(
                formatted,
                style: value == null ? GameText.bodyDim : GameText.body,
              ),
            ),
          ],
        ),
      ),
    );
  }
}
