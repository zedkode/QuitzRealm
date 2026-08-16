import 'package:flutter/material.dart';
import 'package:flutter_riverpod/flutter_riverpod.dart';
import 'package:go_router/go_router.dart';

import '../../core/theme/app_theme.dart';
import '../../core/ui/game_button.dart';
import '../../core/ui/game_frame.dart';
import '../../core/ui/game_icons.dart';
import '../../core/ui/realm_backdrop.dart';
import '../../domain/social/social_models.dart';
import '../../l10n/app_localizations.dart';
import 'social_controller.dart';
import 'widgets/trust_card.dart';

/// Ecranul social: prieteni, cereri și conversații (`owner-plan.md` §2).
class SocialScreen extends ConsumerStatefulWidget {
  const SocialScreen({super.key});

  @override
  ConsumerState<SocialScreen> createState() => _SocialScreenState();
}

class _SocialScreenState extends ConsumerState<SocialScreen>
    with SingleTickerProviderStateMixin {
  late final TabController _tabs = TabController(length: 2, vsync: this);
  final _usernameController = TextEditingController();

  @override
  void initState() {
    super.initState();
    WidgetsBinding.instance.addPostFrameCallback((_) {
      if (mounted) ref.read(socialControllerProvider.notifier).load();
    });
  }

  @override
  void dispose() {
    _tabs.dispose();
    _usernameController.dispose();
    super.dispose();
  }

  @override
  Widget build(BuildContext context) {
    final l10n = AppLocalizations.of(context);
    final state = ref.watch(socialControllerProvider);

    // Erorile vin de la server (treaptă prea mică, setări de confidențialitate,
    // blocare) și trebuie arătate ca atare, nu înghițite.
    ref.listen<SocialState>(socialControllerProvider, (previous, next) {
      final message = next.errorMessage;
      if (message == null || message == previous?.errorMessage) return;
      // Lipsa contului are deja un ecran care o explică; un „Unauthorized”
      // aruncat peste el ar fi zgomot brut de la server, nu informație.
      if (next.phase == SocialPhase.unauthenticated ||
          next.phase == SocialPhase.error) {
        return;
      }
      ScaffoldMessenger.of(context)
          .showSnackBar(SnackBar(content: Text(message)));
      ref.read(socialControllerProvider.notifier).clearError();
    });

    return Scaffold(
      body: RealmBackdrop(
        accent: GamePalette.arcane,
        artAsset: 'assets/game/realm_map_v2.png',
        artOpacity: 0.14,
        child: SafeArea(
          child: Column(
            children: [
              Padding(
                padding: const EdgeInsets.fromLTRB(10, 6, 14, 4),
                child: Row(
                  children: [
                    GameIconButton(
                      symbol: GameSymbol.back,
                      tooltip: l10n.backLabel,
                      size: 40,
                      onPressed: () => context.pop(),
                    ),
                    const SizedBox(width: 10),
                    Expanded(
                      child: Text(
                        l10n.socialTitle,
                        style: GameText.heading.copyWith(fontSize: 16),
                      ),
                    ),
                    GameIconButton(
                      key: const Key('social-global-chat-open'),
                      symbol: GameSymbol.chat,
                      tooltip: 'Lobby global',
                      size: 38,
                      onPressed: () => context.push('/social/global'),
                    ),
                    const SizedBox(width: 6),
                    if (state.privacy != null)
                      GameIconButton(
                        key: const Key('social-privacy-open'),
                        symbol: GameSymbol.shield,
                        tooltip: l10n.privacyTitle,
                        size: 38,
                        onPressed: () => _openPrivacySheet(context, state),
                      ),
                  ],
                ),
              ),
              Expanded(child: _buildBody(context, state)),
            ],
          ),
        ),
      ),
    );
  }

  Widget _buildBody(BuildContext context, SocialState state) {
    final l10n = AppLocalizations.of(context);
    switch (state.phase) {
      case SocialPhase.loading:
        return const Center(child: CircularProgressIndicator());
      case SocialPhase.unauthenticated:
        return _Message(
          symbol: GameSymbol.helmet,
          title: l10n.socialNeedAccountTitle,
          body: l10n.socialNeedAccountBody,
          actionLabel: l10n.duelGoToAccount,
          onAction: () => context.pushReplacement('/cont'),
        );
      case SocialPhase.error:
        return _Message(
          symbol: GameSymbol.skull,
          title: l10n.socialErrorTitle,
          body: state.errorMessage,
          actionLabel: l10n.retry,
          onAction: () => ref.read(socialControllerProvider.notifier).load(),
        );
      case SocialPhase.ready:
        break;
    }

    final trust = state.trust;
    return Column(
      children: [
        if (trust != null) TrustCard(trust: trust),
        TabBar(
          controller: _tabs,
          labelColor: GamePalette.goldBright,
          unselectedLabelColor: GamePalette.creamDim,
          indicatorColor: GamePalette.gold,
          tabs: [
            Tab(text: l10n.socialTabFriends),
            Tab(
              key: const Key('social-tab-messages'),
              text: state.messageRequests.isEmpty
                  ? l10n.socialTabMessages
                  : '${l10n.socialTabMessages} (${state.messageRequests.length})',
            ),
          ],
        ),
        Expanded(
          child: TabBarView(
            controller: _tabs,
            children: [
              _FriendsTab(state: state, controller: _usernameController),
              _ConversationsTab(state: state),
            ],
          ),
        ),
      ],
    );
  }

  Future<void> _openPrivacySheet(
    BuildContext context,
    SocialState state,
  ) async {
    final l10n = AppLocalizations.of(context);
    final privacy = state.privacy;
    if (privacy == null) return;

    await showModalBottomSheet<void>(
      context: context,
      backgroundColor: GamePalette.stone900,
      builder: (sheetContext) {
        return SafeArea(
          child: Consumer(
            builder: (consumerContext, sheetRef, _) {
              final current =
                  sheetRef.watch(socialControllerProvider).privacy ?? privacy;
              return Column(
                mainAxisSize: MainAxisSize.min,
                crossAxisAlignment: CrossAxisAlignment.start,
                children: [
                  Padding(
                    padding: const EdgeInsets.fromLTRB(20, 18, 20, 6),
                    child: Text(
                      l10n.privacyDmTitle,
                      style: GameText.heading.copyWith(fontSize: 14),
                    ),
                  ),
                  if (current.dmPermissionLocked)
                    Padding(
                      padding: const EdgeInsets.fromLTRB(20, 0, 20, 8),
                      child: Text(
                        // Minorii au setarea impusă; o ascundem ar fi mai rău:
                        // n-ar înțelege de ce nu primesc mesaje.
                        l10n.privacyDmLocked,
                        style: GameText.bodyDim.copyWith(fontSize: 11),
                      ),
                    ),
                  for (final option in DmPermission.values)
                    ListTile(
                      key: Key('privacy-dm-${option.name}'),
                      enabled: !current.dmPermissionLocked,
                      leading: GameIcon(
                        current.dmPermission == option
                            ? GameSymbol.check
                            : GameSymbol.shield,
                        size: 20,
                        color: current.dmPermission == option
                            ? GamePalette.gold
                            : GamePalette.stone600,
                      ),
                      title: Text(switch (option) {
                        DmPermission.everyone => l10n.privacyDmEveryone,
                        DmPermission.friendsOnly => l10n.privacyDmFriends,
                        DmPermission.nobody => l10n.privacyDmNobody,
                      }, style: GameText.body.copyWith(fontSize: 13)),
                      onTap: current.dmPermissionLocked
                          ? null
                          : () => sheetRef
                                .read(socialControllerProvider.notifier)
                                .setDmPermission(option),
                    ),
                  const SizedBox(height: 12),
                ],
              );
            },
          ),
        );
      },
    );
  }
}

class _FriendsTab extends ConsumerWidget {
  const _FriendsTab({required this.state, required this.controller});

  final SocialState state;
  final TextEditingController controller;

  @override
  Widget build(BuildContext context, WidgetRef ref) {
    final l10n = AppLocalizations.of(context);
    final notifier = ref.read(socialControllerProvider.notifier);

    return ListView(
      padding: const EdgeInsets.fromLTRB(14, 12, 14, 24),
      children: [
        GameFrame(
          padding: const EdgeInsets.all(12),
          child: Row(
            children: [
              Expanded(
                child: TextField(
                  key: const Key('social-add-friend-field'),
                  controller: controller,
                  style: GameText.body.copyWith(fontSize: 13),
                  decoration: InputDecoration(
                    isDense: true,
                    hintText: l10n.friendsAddHint,
                    hintStyle: GameText.bodyDim.copyWith(fontSize: 12),
                  ),
                ),
              ),
              const SizedBox(width: 10),
              GameIconButton(
                key: const Key('social-add-friend-send'),
                symbol: GameSymbol.check,
                tooltip: l10n.friendsAddAction,
                size: 40,
                onPressed: state.busy
                    ? null
                    : () async {
                        final username = controller.text.trim();
                        if (username.isEmpty) return;
                        final sent = await notifier.sendFriendRequest(username);
                        if (sent) controller.clear();
                      },
              ),
            ],
          ),
        ),
        if (state.friendSuggestionFeed != null) ...[
          const SizedBox(height: 16),
          _FriendSuggestionsPanel(
            feed: state.friendSuggestionFeed!,
            busy: state.busy,
          ),
        ],
        if (state.incomingRequests.isNotEmpty) ...[
          const SizedBox(height: 16),
          _SectionTitle(l10n.friendsIncomingRequests),
          for (final request in state.incomingRequests)
            _FriendRow(
              key: Key('friend-request-${request.friendshipId}'),
              friend: request,
              trailing: Row(
                mainAxisSize: MainAxisSize.min,
                children: [
                  GameIconButton(
                    key: Key('friend-accept-${request.friendshipId}'),
                    symbol: GameSymbol.check,
                    tooltip: l10n.friendsAccept,
                    size: 36,
                    onPressed: state.busy
                        ? null
                        : () => notifier.respondToRequest(
                            request.friendshipId,
                            accept: true,
                          ),
                  ),
                  const SizedBox(width: 6),
                  GameIconButton(
                    key: Key('friend-decline-${request.friendshipId}'),
                    symbol: GameSymbol.cross,
                    tooltip: l10n.friendsDecline,
                    size: 36,
                    onPressed: state.busy
                        ? null
                        : () => notifier.respondToRequest(
                            request.friendshipId,
                            accept: false,
                          ),
                  ),
                ],
              ),
            ),
        ],
        if (state.outgoingRequests.isNotEmpty) ...[
          const SizedBox(height: 16),
          _SectionTitle(l10n.friendsOutgoingRequests),
          for (final request in state.outgoingRequests)
            _FriendRow(
              friend: request,
              trailing: Text(
                l10n.friendsRequestSent,
                style: GameText.bodyDim.copyWith(fontSize: 11),
              ),
            ),
        ],
        const SizedBox(height: 16),
        _SectionTitle(l10n.friendsListTitle),
        if (state.acceptedFriends.isEmpty)
          Padding(
            padding: const EdgeInsets.symmetric(vertical: 18),
            child: Text(
              l10n.friendsEmpty,
              textAlign: TextAlign.center,
              style: GameText.bodyDim.copyWith(fontSize: 12),
            ),
          ),
        for (final friend in state.acceptedFriends)
          _FriendRow(
            key: Key('friend-${friend.userId}'),
            friend: friend,
            trailing: Row(
              mainAxisSize: MainAxisSize.min,
              children: [
                GameIconButton(
                  key: Key('friend-chat-${friend.userId}'),
                  symbol: GameSymbol.chat,
                  tooltip: l10n.friendsOpenChat,
                  size: 36,
                  onPressed: state.busy
                      ? null
                      : () async {
                          final conversation = await notifier.openConversation(
                            friend.userId,
                          );
                          if (conversation != null && context.mounted) {
                            context.push(
                              '/social/conversatie/${conversation.id}',
                              extra: friend.displayName,
                            );
                          }
                        },
                ),
                const SizedBox(width: 6),
                GameIconButton(
                  key: Key('friend-block-${friend.userId}'),
                  symbol: GameSymbol.skull,
                  tooltip: l10n.friendsBlock,
                  size: 36,
                  onPressed: state.busy
                      ? null
                      : () => _confirmBlock(context, ref, friend),
                ),
              ],
            ),
          ),
      ],
    );
  }

  Future<void> _confirmBlock(
    BuildContext context,
    WidgetRef ref,
    Friend friend,
  ) async {
    final l10n = AppLocalizations.of(context);
    final confirmed = await showDialog<bool>(
      context: context,
      builder: (dialogContext) => AlertDialog(
        backgroundColor: GamePalette.stone800,
        title: Text(l10n.friendsBlockTitle, style: GameText.heading),
        content: Text(
          l10n.friendsBlockBody(friend.displayName),
          style: GameText.bodyDim,
        ),
        actions: [
          TextButton(
            onPressed: () => Navigator.of(dialogContext).pop(false),
            child: Text(l10n.leaveBattleCancel),
          ),
          TextButton(
            key: const Key('friend-block-confirm'),
            onPressed: () => Navigator.of(dialogContext).pop(true),
            child: Text(
              l10n.friendsBlock,
              style: const TextStyle(color: GamePalette.crimson),
            ),
          ),
        ],
      ),
    );
    if (confirmed == true) {
      await ref
          .read(socialControllerProvider.notifier)
          .blockUser(friend.userId);
    }
  }
}

class _ConversationsTab extends ConsumerWidget {
  const _ConversationsTab({required this.state});

  final SocialState state;

  @override
  Widget build(BuildContext context, WidgetRef ref) {
    final l10n = AppLocalizations.of(context);
    final notifier = ref.read(socialControllerProvider.notifier);

    return ListView(
      padding: const EdgeInsets.fromLTRB(14, 12, 14, 24),
      children: [
        if (state.messageRequests.isNotEmpty) ...[
          _SectionTitle(l10n.messageRequestsTitle),
          Text(
            l10n.messageRequestsExplainer,
            style: GameText.bodyDim.copyWith(fontSize: 11),
          ),
          const SizedBox(height: 8),
          for (final conversation in state.messageRequests)
            _ConversationRow(
              key: Key('message-request-${conversation.id}'),
              conversation: conversation,
              trailing: GameIconButton(
                key: Key('message-request-accept-${conversation.id}'),
                symbol: GameSymbol.check,
                tooltip: l10n.messageRequestAccept,
                size: 36,
                onPressed: state.busy
                    ? null
                    : () => notifier.acceptConversation(conversation.id),
              ),
              onTap: () => context.push(
                '/social/conversatie/${conversation.id}',
                extra: conversation.otherDisplayName,
              ),
            ),
          const SizedBox(height: 16),
        ],
        _SectionTitle(l10n.conversationsTitle),
        if (state.activeConversations.isEmpty)
          Padding(
            padding: const EdgeInsets.symmetric(vertical: 18),
            child: Text(
              l10n.conversationsEmpty,
              textAlign: TextAlign.center,
              style: GameText.bodyDim.copyWith(fontSize: 12),
            ),
          ),
        for (final conversation in state.activeConversations)
          _ConversationRow(
            key: Key('conversation-${conversation.id}'),
            conversation: conversation,
            onTap: () => context.push(
              '/social/conversatie/${conversation.id}',
              extra: conversation.otherDisplayName,
            ),
          ),
      ],
    );
  }
}

class _FriendSuggestionsPanel extends ConsumerWidget {
  const _FriendSuggestionsPanel({required this.feed, required this.busy});

  final FriendSuggestionFeed feed;
  final bool busy;

  @override
  Widget build(BuildContext context, WidgetRef ref) {
    final notifier = ref.read(socialControllerProvider.notifier);
    return GameFrame(
      padding: const EdgeInsets.all(12),
      child: Column(
        crossAxisAlignment: CrossAxisAlignment.start,
        children: [
          Row(
            children: [
              const GameIcon(
                GameSymbol.helmet,
                size: 21,
                color: GamePalette.gold,
              ),
              const SizedBox(width: 8),
              Expanded(
                child: Text(
                  'ALIAȚI ÎNTÂLNIȚI',
                  style: GameText.eyebrow.copyWith(fontSize: 11),
                ),
              ),
              Switch(
                key: const Key('friend-suggestions-opt-in'),
                value: feed.enabled,
                activeThumbColor: GamePalette.gold,
                onChanged: busy ? null : notifier.setFriendSuggestionsEnabled,
              ),
            ],
          ),
          Text(
            feed.enabled
                ? 'Arătăm doar jucători întâlniți recent care au ales și ei această opțiune.'
                : 'Activează opțiunea pentru a vedea recomandări bazate pe partide recente.',
            style: GameText.bodyDim.copyWith(fontSize: 11),
          ),
          if (feed.enabled && feed.suggestions.isNotEmpty) ...[
            const SizedBox(height: 10),
            for (final suggestion in feed.suggestions)
              Padding(
                padding: const EdgeInsets.only(top: 6),
                child: Row(
                  children: [
                    Expanded(
                      child: Column(
                        crossAxisAlignment: CrossAxisAlignment.start,
                        children: [
                          Text(
                            suggestion.displayName,
                            style: GameText.body.copyWith(fontSize: 12),
                            overflow: TextOverflow.ellipsis,
                          ),
                          Text(
                            '${suggestion.sharedMatches} partide împreună',
                            style: GameText.bodyDim.copyWith(fontSize: 10),
                          ),
                        ],
                      ),
                    ),
                    GameIconButton(
                      key: Key('friend-suggestion-add-${suggestion.userId}'),
                      symbol: GameSymbol.check,
                      tooltip: 'Trimite cerere de prietenie',
                      size: 34,
                      onPressed: busy
                          ? null
                          : () =>
                                notifier.sendFriendRequest(suggestion.username),
                    ),
                  ],
                ),
              ),
          ],
        ],
      ),
    );
  }
}

class _SectionTitle extends StatelessWidget {
  const _SectionTitle(this.text);

  final String text;

  @override
  Widget build(BuildContext context) {
    return Padding(
      padding: const EdgeInsets.only(bottom: 8),
      child: Text(text, style: GameText.eyebrow),
    );
  }
}

class _FriendRow extends StatelessWidget {
  const _FriendRow({required this.friend, this.trailing, super.key});

  final Friend friend;
  final Widget? trailing;

  @override
  Widget build(BuildContext context) {
    return GameFrame(
      margin: const EdgeInsets.only(bottom: 8),
      padding: const EdgeInsets.symmetric(horizontal: 12, vertical: 10),
      child: Row(
        children: [
          Container(
            width: 9,
            height: 9,
            decoration: BoxDecoration(
              shape: BoxShape.circle,
              color: friend.isOnline
                  ? GamePalette.emerald
                  : GamePalette.stone600,
            ),
          ),
          const SizedBox(width: 10),
          Expanded(
            child: Column(
              crossAxisAlignment: CrossAxisAlignment.start,
              children: [
                Text(
                  friend.displayName,
                  style: GameText.body.copyWith(fontSize: 13),
                  overflow: TextOverflow.ellipsis,
                ),
                Text(
                  '@${friend.username}',
                  style: GameText.bodyDim.copyWith(fontSize: 10),
                  overflow: TextOverflow.ellipsis,
                ),
              ],
            ),
          ),
          ?trailing,
        ],
      ),
    );
  }
}

class _ConversationRow extends StatelessWidget {
  const _ConversationRow({
    required this.conversation,
    this.trailing,
    this.onTap,
    super.key,
  });

  final Conversation conversation;
  final Widget? trailing;
  final VoidCallback? onTap;

  @override
  Widget build(BuildContext context) {
    return InkWell(
      onTap: onTap,
      child: GameFrame(
        margin: const EdgeInsets.only(bottom: 8),
        padding: const EdgeInsets.symmetric(horizontal: 12, vertical: 10),
        child: Row(
          children: [
            Expanded(
              child: Column(
                crossAxisAlignment: CrossAxisAlignment.start,
                children: [
                  Row(
                    children: [
                      Expanded(
                        child: Text(
                          conversation.otherDisplayName,
                          style: GameText.body.copyWith(
                            fontSize: 13,
                            fontWeight: conversation.unread
                                ? FontWeight.w700
                                : FontWeight.w400,
                          ),
                          overflow: TextOverflow.ellipsis,
                        ),
                      ),
                      if (conversation.unread)
                        Container(
                          width: 8,
                          height: 8,
                          decoration: const BoxDecoration(
                            shape: BoxShape.circle,
                            color: GamePalette.gold,
                          ),
                        ),
                    ],
                  ),
                  if (conversation.lastMessagePreview != null)
                    Text(
                      conversation.lastMessagePreview!,
                      style: GameText.bodyDim.copyWith(fontSize: 11),
                      maxLines: 1,
                      overflow: TextOverflow.ellipsis,
                    ),
                ],
              ),
            ),
            if (trailing != null) ...[const SizedBox(width: 8), trailing!],
          ],
        ),
      ),
    );
  }
}

class _Message extends StatelessWidget {
  const _Message({
    required this.symbol,
    required this.title,
    required this.actionLabel,
    required this.onAction,
    this.body,
  });

  final GameSymbol symbol;
  final String title;
  final String? body;
  final String actionLabel;
  final VoidCallback onAction;

  @override
  Widget build(BuildContext context) {
    return Center(
      child: SingleChildScrollView(
        padding: const EdgeInsets.all(22),
        child: ConstrainedBox(
          constraints: const BoxConstraints(maxWidth: 430),
          child: GameFrame(
            glow: true,
            child: Column(
              children: [
                GameIcon(symbol, size: 52, color: GamePalette.gold),
                const SizedBox(height: 16),
                Text(title, textAlign: TextAlign.center, style: GameText.title),
                if (body != null && body!.isNotEmpty) ...[
                  const SizedBox(height: 10),
                  Text(
                    body!,
                    textAlign: TextAlign.center,
                    style: GameText.bodyDim,
                  ),
                ],
                const SizedBox(height: 20),
                GameButton(label: actionLabel, onPressed: onAction),
              ],
            ),
          ),
        ),
      ),
    );
  }
}
