import 'package:flutter/material.dart';
import 'package:flutter_riverpod/flutter_riverpod.dart';
import 'package:go_router/go_router.dart';

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
  bool _registerMode = false;
  DateTime? _birthDate;

  @override
  void dispose() {
    _usernameController.dispose();
    _emailController.dispose();
    _passwordController.dispose();
    super.dispose();
  }

  @override
  Widget build(BuildContext context) {
    final l10n = AppLocalizations.of(context);
    final auth = ref.watch(authControllerProvider);
    final loading = auth.status == AuthStatus.loading;

    return Scaffold(
      body: RealmBackdrop(
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
                    child: Form(
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
                            validator: (value) => value == null || value.isEmpty
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
                            const Center(child: CircularProgressIndicator())
                          else
                            GameButton(
                              key: const Key('auth-submit'),
                              label: _registerMode
                                  ? l10n.createAccountButton
                                  : l10n.loginButton,
                              icon: GameSymbol.crown,
                              onPressed: _submit,
                            ),
                          const SizedBox(height: 6),
                          TextButton(
                            onPressed: loading
                                ? null
                                : () => setState(
                                    () => _registerMode = !_registerMode,
                                  ),
                            child: Text(
                              _registerMode
                                  ? l10n.switchToLogin
                                  : l10n.switchToRegister,
                            ),
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

  Future<void> _pickBirthDate() async {
    final now = DateTime.now();
    final picked = await showDatePicker(
      context: context,
      initialDate:
          _birthDate ?? DateTime(now.year - 18, now.month, now.day),
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
      await controller.register(
        username: _usernameController.text,
        email: _emailController.text,
        password: _passwordController.text,
        birthDate: birthDate,
      );
    } else {
      await controller.login(
        email: _emailController.text,
        password: _passwordController.text,
      );
    }
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
