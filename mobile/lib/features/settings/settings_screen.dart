import 'package:flutter/material.dart';
import 'package:flutter/services.dart';
import 'package:flutter_riverpod/flutter_riverpod.dart';
import 'package:go_router/go_router.dart';

import '../../core/design/game_buttons.dart';
import '../../core/design/game_controls.dart';
import '../../core/design/gold_frame.dart';
import '../../core/design/player_identity.dart';
import '../../core/design/quizrealm_bottom_navigation.dart';
import '../../core/design/quizrealm_scaffold.dart';
import '../../core/design/quizrealm_tokens.dart';
import '../../core/providers/game_providers.dart';
import '../../core/providers/repository_providers.dart';
import '../../core/ui/game_icons.dart';
import '../../domain/campaign/campaign_progress.dart';
import '../../domain/settings/app_settings.dart';
import '../../l10n/app_localizations.dart';
import '../auth/auth_controller.dart';
import '../title/widgets/home_navigation.dart';
import 'settings_controller.dart';

/// Ecranul de setări, reconstruit după `design-reference/03-settings.png`.
///
/// Panourile respectă ordinea din captură: cont, sunet, notificări, joc, limbă.
/// Tema nu apare încă între opțiuni: aplicația are o singură temă implementată,
/// iar un comutator care nu schimbă nimic e mai rău decât lipsa lui.
class SettingsScreen extends ConsumerWidget {
  const SettingsScreen({super.key});

  /// Versiunea afișată în subsol. Vine din `--dart-define` la build, ca să nu
  /// fie un număr scris de mână care rămâne în urmă.
  static const _version = String.fromEnvironment(
    'APP_VERSION',
    defaultValue: '1.4.0',
  );

  @override
  Widget build(BuildContext context, WidgetRef ref) {
    final l10n = AppLocalizations.of(context);
    final settings = ref.watch(settingsProvider);
    final controller = ref.read(settingsProvider.notifier);
    final progress = ref.watch(campaignProgressProvider);
    final profile = ref.watch(playerProfileProvider).valueOrNull;

    return QuizRealmScaffold(
      title: l10n.settingsTitle,
      onBack: () => context.canPop() ? context.pop() : context.go('/'),
      header: PlayerIdentityHeader(
        guestLabel: l10n.homeGuestTitle,
        name: profile?.displayName,
        title: profile?.rank.label,
        level: progress.level,
        xp: progress.xpIntoLevel,
        xpMax: CampaignProgress.xpForLevel(progress.level),
        xpLabel: l10n.xpProgress(
          progress.xpIntoLevel,
          CampaignProgress.xpForLevel(progress.level),
        ),
        currencies: [
          if (profile != null)
            CurrencyCounter(
              asset: 'assets/game/icons/resources/icon-resource-gold-coin.png',
              value: '${profile.coins}',
              semanticsLabel: l10n.homeCoins(profile.coins),
              compact: true,
            ),
        ],
      ),
      bottomNavigation: HomeNavigation(
        current: QuizRealmTab.settings,
        lastTab: QuizRealmTab.settings,
        l10n: l10n,
      ),
      body: Column(
        crossAxisAlignment: CrossAxisAlignment.stretch,
        children: [
          const DiamondDivider(),
          _AccountPanel(l10n: l10n),
          const SizedBox(height: QuizRealmSpacing.panelGap),
          _SoundPanel(
            settings: settings,
            controller: controller,
            l10n: l10n,
          ),
          const SizedBox(height: QuizRealmSpacing.panelGap),
          _NotificationsPanel(
            settings: settings,
            controller: controller,
            l10n: l10n,
          ),
          const SizedBox(height: QuizRealmSpacing.panelGap),
          _GameplayPanel(
            settings: settings,
            controller: controller,
            l10n: l10n,
          ),
          const SizedBox(height: QuizRealmSpacing.panelGap),
          _LanguagePanel(
            settings: settings,
            controller: controller,
            l10n: l10n,
          ),
          const SizedBox(height: QuizRealmSpacing.lg),
          Text(
            l10n.settingsVersion(_version),
            textAlign: TextAlign.center,
            style: QuizRealmTypography.bodySecondary.copyWith(
              color: QuizRealmColors.textMuted,
            ),
          ),
        ],
      ),
    );
  }
}

class _AccountPanel extends ConsumerWidget {
  const _AccountPanel({required this.l10n});

  final AppLocalizations l10n;

  @override
  Widget build(BuildContext context, WidgetRef ref) {
    final auth = ref.watch(authControllerProvider);
    final profile = ref.watch(playerProfileProvider).valueOrNull;
    final signedIn = auth.status == AuthStatus.authenticated;

    return FantasyPanel(
      key: const Key('settings-account'),
      title: l10n.settingsAccount,
      symbol: GameSymbol.helmet,
      child: signedIn && profile != null
          ? Column(
              crossAxisAlignment: CrossAxisAlignment.stretch,
              mainAxisSize: MainAxisSize.min,
              children: [
                Row(
                  children: [
                    PlayerAvatar(name: profile.displayName, size: 52),
                    const SizedBox(width: QuizRealmSpacing.md),
                    Expanded(
                      child: Column(
                        crossAxisAlignment: CrossAxisAlignment.start,
                        mainAxisSize: MainAxisSize.min,
                        children: [
                          Text(
                            profile.displayName,
                            maxLines: 1,
                            overflow: TextOverflow.ellipsis,
                            style: QuizRealmTypography.playerName,
                          ),
                          const SizedBox(height: 2),
                          _AccountId(id: profile.id, l10n: l10n),
                          const SizedBox(height: 2),
                          Text(
                            l10n.settingsConnectedEmail,
                            maxLines: 1,
                            overflow: TextOverflow.ellipsis,
                            style: QuizRealmTypography.bodySecondary.copyWith(
                              color: QuizRealmColors.success,
                            ),
                          ),
                        ],
                      ),
                    ),
                  ],
                ),
                const SizedBox(height: QuizRealmSpacing.md),
                Row(
                  children: [
                    Expanded(
                      child: SecondaryGameButton(
                        key: const Key('settings-open-account'),
                        label: l10n.settingsOpenAccount,
                        onPressed: () => context.push('/cont'),
                      ),
                    ),
                    const SizedBox(width: QuizRealmSpacing.sm),
                    Expanded(
                      child: SecondaryGameButton(
                        key: const Key('settings-logout'),
                        label: l10n.logout,
                        tone: SecondaryTone.danger,
                        onPressed: () =>
                            ref.read(authControllerProvider.notifier).logout(),
                      ),
                    ),
                  ],
                ),
              ],
            )
          : Column(
              crossAxisAlignment: CrossAxisAlignment.stretch,
              mainAxisSize: MainAxisSize.min,
              children: [
                Text(
                  l10n.settingsGuestTitle,
                  style: QuizRealmTypography.playerName,
                ),
                const SizedBox(height: 2),
                Text(
                  l10n.settingsGuestBody,
                  style: QuizRealmTypography.bodySecondary,
                ),
                const SizedBox(height: QuizRealmSpacing.md),
                SecondaryGameButton(
                  key: const Key('settings-sign-in'),
                  label: l10n.settingsOpenAccount,
                  onPressed: () => context.push('/cont'),
                ),
              ],
            ),
    );
  }
}

/// Identificatorul contului, cu copiere la atingere.
///
/// Se afișează scurtat: identificatorul întreg e un UUID care ar rupe rândul,
/// dar copierea pune în clipboard valoarea completă — altfel ar fi inutilă
/// pentru un raport de suport.
class _AccountId extends StatelessWidget {
  const _AccountId({required this.id, required this.l10n});

  final String id;
  final AppLocalizations l10n;

  @override
  Widget build(BuildContext context) {
    final short = id.length <= 8 ? id : id.substring(0, 8).toUpperCase();

    return Semantics(
      button: true,
      label: '${l10n.settingsAccountId}: $short',
      child: ExcludeSemantics(
        child: InkWell(
          key: const Key('settings-copy-account-id'),
          onTap: () async {
            await Clipboard.setData(ClipboardData(text: id));
            if (!context.mounted) return;
            ScaffoldMessenger.of(context).showSnackBar(
              SnackBar(content: Text(l10n.settingsAccountIdCopied)),
            );
          },
          child: Row(
            mainAxisSize: MainAxisSize.min,
            children: [
              Flexible(
                child: Text(
                  '${l10n.settingsAccountId}: $short',
                  maxLines: 1,
                  overflow: TextOverflow.ellipsis,
                  style: QuizRealmTypography.bodySecondary,
                ),
              ),
              const SizedBox(width: QuizRealmSpacing.xs),
              const Icon(
                Icons.copy_rounded,
                size: 14,
                color: QuizRealmColors.gold,
              ),
            ],
          ),
        ),
      ),
    );
  }
}

class _SoundPanel extends StatelessWidget {
  const _SoundPanel({
    required this.settings,
    required this.controller,
    required this.l10n,
  });

  final AppSettings settings;
  final SettingsController controller;
  final AppLocalizations l10n;

  @override
  Widget build(BuildContext context) {
    return FantasyPanel(
      key: const Key('settings-sound'),
      title: l10n.settingsSound,
      symbol: GameSymbol.bolt,
      padding: const EdgeInsets.fromLTRB(
        QuizRealmSpacing.md,
        QuizRealmSpacing.md,
        QuizRealmSpacing.md,
        0,
      ),
      child: Column(
        mainAxisSize: MainAxisSize.min,
        children: [
          _VolumeRow(
            label: l10n.settingsMusic,
            symbol: GameSymbol.book,
            value: settings.musicVolume,
            onChanged: controller.setMusicVolume,
            fieldKey: const Key('settings-music'),
          ),
          _VolumeRow(
            label: l10n.settingsEffects,
            symbol: GameSymbol.star,
            value: settings.effectsVolume,
            onChanged: controller.setEffectsVolume,
            fieldKey: const Key('settings-effects'),
          ),
          SettingsRow(
            label: l10n.settingsVibration,
            symbol: GameSymbol.flame,
            trailing: GameToggle(
              key: const Key('settings-vibration'),
              value: settings.vibration,
              onChanged: controller.setVibration,
              semanticsLabel: l10n.settingsVibration,
            ),
          ),
        ],
      ),
    );
  }
}

/// Rândul de volum: eticheta la stânga, cursorul pe mijloc, procentul la
/// dreapta — cu lățime fixă, ca bara să nu tresară la fiecare cifră.
class _VolumeRow extends StatelessWidget {
  const _VolumeRow({
    required this.label,
    required this.symbol,
    required this.value,
    required this.onChanged,
    required this.fieldKey,
  });

  final String label;
  final GameSymbol symbol;
  final double value;
  final ValueChanged<double> onChanged;
  final Key fieldKey;

  @override
  Widget build(BuildContext context) {
    return SettingsRow(
      label: label,
      symbol: symbol,
      trailing: SizedBox(
        width: 190,
        child: Row(
          children: [
            Expanded(
              child: GameSlider(
                key: fieldKey,
                value: value,
                onChanged: onChanged,
                semanticsLabel: label,
              ),
            ),
            SizedBox(
              width: 44,
              child: Text(
                '${(value * 100).round()}%',
                textAlign: TextAlign.right,
                style: QuizRealmTypography.numeric.copyWith(fontSize: 13),
              ),
            ),
          ],
        ),
      ),
    );
  }
}

class _NotificationsPanel extends StatelessWidget {
  const _NotificationsPanel({
    required this.settings,
    required this.controller,
    required this.l10n,
  });

  final AppSettings settings;
  final SettingsController controller;
  final AppLocalizations l10n;

  @override
  Widget build(BuildContext context) {
    return FantasyPanel(
      key: const Key('settings-notifications'),
      title: l10n.settingsNotifications,
      symbol: GameSymbol.banner,
      padding: const EdgeInsets.fromLTRB(
        QuizRealmSpacing.md,
        QuizRealmSpacing.md,
        QuizRealmSpacing.md,
        0,
      ),
      child: SettingsRow(
        label: l10n.settingsPush,
        symbol: GameSymbol.banner,
        description: l10n.settingsPushDesc,
        trailing: GameToggle(
          key: const Key('settings-push'),
          value: settings.pushNotifications,
          onChanged: controller.setPushNotifications,
          semanticsLabel: l10n.settingsPush,
        ),
      ),
    );
  }
}

class _GameplayPanel extends StatelessWidget {
  const _GameplayPanel({
    required this.settings,
    required this.controller,
    required this.l10n,
  });

  final AppSettings settings;
  final SettingsController controller;
  final AppLocalizations l10n;

  @override
  Widget build(BuildContext context) {
    return FantasyPanel(
      key: const Key('settings-gameplay'),
      title: l10n.settingsGameplay,
      symbol: GameSymbol.swords,
      padding: const EdgeInsets.fromLTRB(
        QuizRealmSpacing.md,
        QuizRealmSpacing.md,
        QuizRealmSpacing.md,
        0,
      ),
      child: Column(
        mainAxisSize: MainAxisSize.min,
        children: [
          SettingsRow(
            label: l10n.settingsConfirmActions,
            symbol: GameSymbol.check,
            description: l10n.settingsConfirmActionsDesc,
            trailing: GameToggle(
              key: const Key('settings-confirm'),
              value: settings.confirmActions,
              onChanged: controller.setConfirmActions,
              semanticsLabel: l10n.settingsConfirmActions,
            ),
          ),
          SettingsRow(
            label: l10n.settingsTutorials,
            symbol: GameSymbol.scroll,
            description: l10n.settingsTutorialsDesc,
            trailing: GameToggle(
              key: const Key('settings-tutorials'),
              value: settings.tutorials,
              onChanged: controller.setTutorials,
              semanticsLabel: l10n.settingsTutorials,
            ),
          ),
          SettingsRow(
            label: l10n.settingsDataSaver,
            symbol: GameSymbol.shield,
            description: l10n.settingsDataSaverDesc,
            trailing: GameToggle(
              key: const Key('settings-data-saver'),
              value: settings.dataSaver,
              onChanged: controller.setDataSaver,
              semanticsLabel: l10n.settingsDataSaver,
            ),
          ),
        ],
      ),
    );
  }
}

class _LanguagePanel extends StatelessWidget {
  const _LanguagePanel({
    required this.settings,
    required this.controller,
    required this.l10n,
  });

  final AppSettings settings;
  final SettingsController controller;
  final AppLocalizations l10n;

  @override
  Widget build(BuildContext context) {
    return FantasyPanel(
      key: const Key('settings-language'),
      title: l10n.settingsLanguageSection,
      symbol: GameSymbol.globe,
      padding: const EdgeInsets.fromLTRB(
        QuizRealmSpacing.md,
        QuizRealmSpacing.md,
        QuizRealmSpacing.md,
        0,
      ),
      child: SettingsRow(
        label: l10n.settingsLanguage,
        symbol: GameSymbol.globe,
        trailing: GameTabBar<String>(
          key: const Key('settings-language-tabs'),
          selected: settings.languageCode,
          onSelect: controller.setLanguage,
          options: const [
            // Numele limbilor rămân în limba lor: un vorbitor de engleză
            // trebuie să recunoască „English" chiar dacă aplicația e în română.
            GameTabOption(value: 'ro', label: 'Română'),
            GameTabOption(value: 'en', label: 'English'),
          ],
        ),
      ),
    );
  }
}
