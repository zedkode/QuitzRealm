import 'package:flutter/material.dart';
import 'package:flutter/services.dart';
import 'package:flutter_riverpod/flutter_riverpod.dart';
import 'package:go_router/go_router.dart';

import '../../core/providers/repository_providers.dart';
import '../../core/theme/app_theme.dart';
import '../../core/ui/game_button.dart';
import '../../core/ui/game_frame.dart';
import '../../core/ui/game_icons.dart';
import '../../core/ui/realm_backdrop.dart';
import '../../domain/auth/account_session.dart';
import '../../l10n/app_localizations.dart';
import 'auth_controller.dart';
import 'login_screen.dart';

/// Contul este opțional pentru jocul solo, dar aici jucătorul își poate vedea
/// și proteja identitatea online: dispozitive active, revocare și 2FA TOTP.
class AccountScreen extends ConsumerWidget {
  const AccountScreen({super.key});

  @override
  Widget build(BuildContext context, WidgetRef ref) {
    final l10n = AppLocalizations.of(context);
    final auth = ref.watch(authControllerProvider);

    if (auth.status == AuthStatus.checking) {
      return const Scaffold(
        body: RealmBackdrop(
          artAsset: 'assets/game/realm_map_v2.png',
          artOpacity: 0.18,
          child: Center(child: CircularProgressIndicator()),
        ),
      );
    }
    if (auth.status != AuthStatus.authenticated) {
      return const LoginScreen();
    }

    final sessions = ref.watch(accountSessionsProvider);
    return Scaffold(
      body: RealmBackdrop(
        artAsset: 'assets/game/realm_map_v2.png',
        artOpacity: 0.20,
        child: SafeArea(
          child: SingleChildScrollView(
            padding: const EdgeInsets.fromLTRB(20, 8, 20, 28),
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
                const SizedBox(height: 18),
                const Center(child: GameIcon(GameSymbol.shield, size: 56)),
                const SizedBox(height: 12),
                Text(
                  'SIGURANȚA CONTULUI',
                  textAlign: TextAlign.center,
                  style: GameText.title,
                ),
                const SizedBox(height: 6),
                Text(
                  'Păstrează-ți cuceririle și dispozitivele conectate sub control.',
                  textAlign: TextAlign.center,
                  style: GameText.bodyDim,
                ),
                const SizedBox(height: 16),
                GameButton(
                  key: const Key('account-achievements-open'),
                  label: 'SALA PRESTIGIULUI',
                  icon: GameSymbol.trophy,
                  compact: true,
                  onPressed: () => context.push('/realizari'),
                ),
                const SizedBox(height: 20),
                _TwoFactorPanel(
                  onConfigure: () => _showTwoFactorDialog(context, ref),
                ),
                const SizedBox(height: 16),
                GameFrame(
                  child: Column(
                    crossAxisAlignment: CrossAxisAlignment.stretch,
                    children: [
                      Text('SESIUNI ACTIVE', style: GameText.heading),
                      const SizedBox(height: 6),
                      Text(
                        'Revocă imediat dispozitivele pe care nu le recunoști.',
                        style: GameText.bodyDim,
                      ),
                      const SizedBox(height: 14),
                      sessions.when(
                        loading: () => const Center(
                          child: Padding(
                            padding: EdgeInsets.all(16),
                            child: CircularProgressIndicator(),
                          ),
                        ),
                        error: (_, _) => Text(
                          'Nu am putut încărca sesiunile. Încearcă mai târziu.',
                          style: GameText.body.copyWith(
                            color: GamePalette.crimson,
                          ),
                        ),
                        data: (items) => _SessionsList(sessions: items),
                      ),
                      const SizedBox(height: 14),
                      GameButton(
                        label: 'DECONECTEAZĂ CELELALTE DISPOZITIVE',
                        icon: GameSymbol.shield,
                        compact: true,
                        tone: GameButtonTone.stone,
                        onPressed: () async {
                          try {
                            final revoked = await ref
                                .read(authRepositoryProvider)
                                .revokeOtherSessions();
                            ref.invalidate(accountSessionsProvider);
                            if (!context.mounted) return;
                            ScaffoldMessenger.of(context).showSnackBar(
                              SnackBar(
                                content: Text(
                                  revoked == 0
                                      ? 'Nu există alte sesiuni active.'
                                      : 'Au fost închise $revoked sesiuni.',
                                ),
                              ),
                            );
                          } catch (_) {
                            if (!context.mounted) return;
                            ScaffoldMessenger.of(context).showSnackBar(
                              const SnackBar(
                                content: Text('Nu am putut revoca sesiunile.'),
                              ),
                            );
                          }
                        },
                      ),
                    ],
                  ),
                ),
                const SizedBox(height: 16),
                GameFrame(
                  child: Column(
                    crossAxisAlignment: CrossAxisAlignment.stretch,
                    children: [
                      Text('VERIFICARE EMAIL', style: GameText.heading),
                      const SizedBox(height: 6),
                      Text(
                        'E-mailul verificat este necesar pentru meciurile clasate și chatul global.',
                        style: GameText.bodyDim,
                      ),
                      const SizedBox(height: 14),
                      GameButton(
                        label: 'RETRIMITE LINKUL DE CONFIRMARE',
                        icon: GameSymbol.scroll,
                        compact: true,
                        onPressed: () async {
                          try {
                            await ref
                                .read(authRepositoryProvider)
                                .requestEmailVerification();
                            if (!context.mounted) return;
                            ScaffoldMessenger.of(context).showSnackBar(
                              const SnackBar(
                                content: Text(
                                  'Am trimis un nou link de confirmare.',
                                ),
                              ),
                            );
                          } catch (_) {
                            if (!context.mounted) return;
                            ScaffoldMessenger.of(context).showSnackBar(
                              const SnackBar(
                                content: Text('Nu am putut trimite emailul.'),
                              ),
                            );
                          }
                        },
                      ),
                    ],
                  ),
                ),
                const SizedBox(height: 20),
                GameButton(
                  key: const Key('logout'),
                  label: l10n.logout,
                  icon: GameSymbol.back,
                  tone: GameButtonTone.stone,
                  onPressed: () =>
                      ref.read(authControllerProvider.notifier).logout(),
                ),
              ],
            ),
          ),
        ),
      ),
    );
  }

  Future<void> _showTwoFactorDialog(BuildContext context, WidgetRef ref) {
    return showDialog<void>(
      context: context,
      builder: (dialogContext) => _TwoFactorSetupDialog(ref: ref),
    );
  }
}

class _TwoFactorPanel extends StatelessWidget {
  const _TwoFactorPanel({required this.onConfigure});

  final VoidCallback onConfigure;

  @override
  Widget build(BuildContext context) {
    return GameFrame(
      glow: true,
      child: Column(
        crossAxisAlignment: CrossAxisAlignment.stretch,
        children: [
          Text('AUTENTIFICARE ÎN DOI PAȘI', style: GameText.heading),
          const SizedBox(height: 6),
          Text(
            'Adaugă o aplicație TOTP pentru ca parola singură să nu poată deschide contul.',
            style: GameText.bodyDim,
          ),
          const SizedBox(height: 14),
          GameButton(
            label: 'CONFIGUREAZĂ 2FA',
            icon: GameSymbol.shield,
            compact: true,
            onPressed: onConfigure,
          ),
        ],
      ),
    );
  }
}

class _SessionsList extends ConsumerWidget {
  const _SessionsList({required this.sessions});

  final List<AccountSession> sessions;

  @override
  Widget build(BuildContext context, WidgetRef ref) {
    if (sessions.isEmpty) {
      return Text('Nu există sesiuni active.', style: GameText.bodyDim);
    }
    return Column(
      children: [
        for (final session in sessions)
          Padding(
            padding: const EdgeInsets.only(bottom: 10),
            child: _SessionRow(session: session),
          ),
      ],
    );
  }
}

class _SessionRow extends ConsumerWidget {
  const _SessionRow({required this.session});

  final AccountSession session;

  @override
  Widget build(BuildContext context, WidgetRef ref) {
    final lastSeen = session.lastSeenAt.toLocal().toString().split('.').first;
    return Container(
      padding: const EdgeInsets.all(10),
      decoration: BoxDecoration(
        color: GamePalette.stone900.withValues(alpha: 0.65),
        borderRadius: BorderRadius.circular(12),
        border: Border.all(
          color: session.isCurrent ? GamePalette.gold : GamePalette.stone600,
        ),
      ),
      child: Row(
        children: [
          GameIcon(
            session.isCurrent ? GameSymbol.crown : GameSymbol.shield,
            size: 21,
            color: session.isCurrent
                ? GamePalette.goldBright
                : GamePalette.creamDim,
          ),
          const SizedBox(width: 10),
          Expanded(
            child: Column(
              crossAxisAlignment: CrossAxisAlignment.start,
              children: [
                Text(
                  session.isCurrent
                      ? 'Acest dispozitiv'
                      : (session.deviceLabel ?? 'Dispozitiv necunoscut'),
                  maxLines: 1,
                  overflow: TextOverflow.ellipsis,
                  style: GameText.body,
                ),
                Text('Activ ultima dată: $lastSeen', style: GameText.bodyDim),
              ],
            ),
          ),
          if (!session.isCurrent)
            IconButton(
              tooltip: 'Revocă sesiunea',
              onPressed: () async {
                await ref
                    .read(authRepositoryProvider)
                    .revokeSession(session.id);
                ref.invalidate(accountSessionsProvider);
              },
              icon: const Icon(Icons.close_rounded),
            ),
        ],
      ),
    );
  }
}

class _TwoFactorSetupDialog extends StatefulWidget {
  const _TwoFactorSetupDialog({required this.ref});

  final WidgetRef ref;

  @override
  State<_TwoFactorSetupDialog> createState() => _TwoFactorSetupDialogState();
}

class _TwoFactorSetupDialogState extends State<_TwoFactorSetupDialog> {
  final _password = TextEditingController();
  final _code = TextEditingController();
  String? _otpauthUri;
  List<String>? _recoveryCodes;
  bool _loading = false;
  String? _error;

  @override
  void dispose() {
    _password.dispose();
    _code.dispose();
    super.dispose();
  }

  Future<void> _start() async {
    setState(() {
      _loading = true;
      _error = null;
    });
    try {
      final uri = await widget.ref
          .read(authRepositoryProvider)
          .startTwoFactorEnrollment(currentPassword: _password.text);
      if (mounted) setState(() => _otpauthUri = uri);
    } catch (_) {
      if (mounted) {
        setState(() => _error = 'Parola nu a putut iniția configurarea 2FA.');
      }
    } finally {
      if (mounted) setState(() => _loading = false);
    }
  }

  Future<void> _confirm() async {
    setState(() {
      _loading = true;
      _error = null;
    });
    try {
      final codes = await widget.ref
          .read(authRepositoryProvider)
          .confirmTwoFactorEnrollment(
            currentPassword: _password.text,
            code: _code.text,
          );
      if (mounted) setState(() => _recoveryCodes = codes);
    } catch (_) {
      if (mounted) {
        setState(() => _error = 'Codul de autentificare nu este valid.');
      }
    } finally {
      if (mounted) setState(() => _loading = false);
    }
  }

  @override
  Widget build(BuildContext context) {
    return AlertDialog(
      backgroundColor: GamePalette.stone800,
      title: Text(
        'Configurează 2FA',
        style: GameText.title.copyWith(fontSize: 18),
      ),
      content: SingleChildScrollView(
        child: _recoveryCodes != null
            ? Column(
                mainAxisSize: MainAxisSize.min,
                crossAxisAlignment: CrossAxisAlignment.stretch,
                children: [
                  Text(
                    'Salvează aceste coduri într-un loc sigur. Sunt afișate o singură dată.',
                    style: GameText.body,
                  ),
                  const SizedBox(height: 12),
                  SelectableText(
                    _recoveryCodes!.join('\n'),
                    style: GameText.numeric.copyWith(fontSize: 14),
                  ),
                  const SizedBox(height: 12),
                  TextButton.icon(
                    onPressed: () => Clipboard.setData(
                      ClipboardData(text: _recoveryCodes!.join('\n')),
                    ),
                    icon: const Icon(Icons.copy_rounded),
                    label: const Text('Copiază codurile'),
                  ),
                ],
              )
            : Column(
                mainAxisSize: MainAxisSize.min,
                crossAxisAlignment: CrossAxisAlignment.stretch,
                children: [
                  Text(
                    _otpauthUri == null
                        ? 'Confirmă parola pentru a genera secretul de autentificare.'
                        : 'Adaugă manual acest URI în aplicația TOTP, apoi introdu codul de șase cifre.',
                    style: GameText.bodyDim,
                  ),
                  const SizedBox(height: 12),
                  TextField(
                    controller: _password,
                    obscureText: true,
                    enabled: !_loading && _otpauthUri == null,
                    decoration: const InputDecoration(
                      labelText: 'Parola curentă',
                    ),
                  ),
                  if (_otpauthUri != null) ...[
                    const SizedBox(height: 12),
                    SelectableText(_otpauthUri!, style: GameText.bodyDim),
                    TextButton.icon(
                      onPressed: () =>
                          Clipboard.setData(ClipboardData(text: _otpauthUri!)),
                      icon: const Icon(Icons.copy_rounded),
                      label: const Text('Copiază URI-ul'),
                    ),
                    TextField(
                      controller: _code,
                      keyboardType: TextInputType.number,
                      enabled: !_loading,
                      decoration: const InputDecoration(
                        labelText: 'Codul TOTP',
                      ),
                    ),
                  ],
                  if (_error != null) ...[
                    const SizedBox(height: 10),
                    Text(
                      _error!,
                      style: GameText.body.copyWith(color: GamePalette.crimson),
                    ),
                  ],
                ],
              ),
      ),
      actions: [
        TextButton(
          onPressed: _loading ? null : () => Navigator.of(context).pop(),
          child: Text(
            _recoveryCodes == null ? 'Anulează' : 'Am salvat codurile',
          ),
        ),
        if (_recoveryCodes == null)
          FilledButton(
            onPressed: _loading
                ? null
                : (_otpauthUri == null ? _start : _confirm),
            child: Text(_otpauthUri == null ? 'Generează' : 'Confirmă'),
          ),
      ],
    );
  }
}
