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
import 'login_screen.dart';

/// Contul este opțional: campania merge offline, dar un cont pregătește
/// sincronizarea și, mai târziu, partidele online.
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

    return Scaffold(
      body: RealmBackdrop(
        artAsset: 'assets/game/realm_map_v2.png',
        artOpacity: 0.20,
        child: SafeArea(
          child: Padding(
            padding: const EdgeInsets.all(20),
            child: Column(
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
                const Spacer(),
                GameFrame(
                  glow: true,
                  child: Column(
                    crossAxisAlignment: CrossAxisAlignment.stretch,
                    children: [
                      const Center(
                        child: GameIcon(GameSymbol.helmet, size: 56),
                      ),
                      const SizedBox(height: 14),
                      Text(
                        l10n.loginEyebrow,
                        textAlign: TextAlign.center,
                        style: GameText.eyebrow,
                      ),
                      const SizedBox(height: 6),
                      Text(
                        l10n.accountOptionalNote,
                        textAlign: TextAlign.center,
                        style: GameText.bodyDim,
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
                const Spacer(),
              ],
            ),
          ),
        ),
      ),
    );
  }
}
