import 'dart:async';

import 'package:flutter/material.dart';
import 'package:flutter_riverpod/flutter_riverpod.dart';
import 'package:go_router/go_router.dart';

import '../../core/network/api_exception.dart';
import '../../core/providers/repository_providers.dart';
import '../../core/theme/app_theme.dart';
import '../../core/ui/game_button.dart';
import '../../core/ui/game_frame.dart';
import '../../core/ui/game_icons.dart';
import '../../core/ui/realm_backdrop.dart';
import '../../domain/social/social_models.dart';
import '../../domain/social/social_realtime_event.dart';
import '../../l10n/app_localizations.dart';

/// Lobby-ul global este efemer și controlat server-side prin treptele de
/// încredere. Acest ecran nu calculează accesul; doar afișează decizia API.
class GlobalChatScreen extends ConsumerStatefulWidget {
  const GlobalChatScreen({super.key});

  @override
  ConsumerState<GlobalChatScreen> createState() => _GlobalChatScreenState();
}

class _GlobalChatScreenState extends ConsumerState<GlobalChatScreen> {
  final _composer = TextEditingController();
  final _scroll = ScrollController();
  StreamSubscription<SocialRealtimeEvent>? _subscription;

  List<GlobalChatMessage> _messages = const [];
  TrustInfo? _trust;
  bool _loading = true;
  bool _sending = false;
  String? _error;

  @override
  void initState() {
    super.initState();
    WidgetsBinding.instance.addPostFrameCallback((_) => _start());
  }

  @override
  void dispose() {
    _subscription?.cancel();
    ref.read(realtimeClientProvider).leaveGlobalChat();
    _composer.dispose();
    _scroll.dispose();
    super.dispose();
  }

  Future<void> _start() async {
    try {
      final trust = await ref.read(socialRepositoryProvider).fetchTrust();
      if (!mounted) return;
      setState(() => _trust = trust);

      final client = ref.read(realtimeClientProvider);
      _subscription ??= client.socialEvents.listen(_onEvent);
      if (!await client.connect()) {
        if (mounted) {
          setState(() => _error = 'Conexiunea live nu este disponibilă.');
        }
        return;
      }
      client.joinGlobalChat();
    } on ApiException catch (error) {
      if (mounted) setState(() => _error = error.message);
    } finally {
      if (mounted) setState(() => _loading = false);
    }
  }

  void _onEvent(SocialRealtimeEvent event) {
    switch (event) {
      case GlobalChatHistoryReceived(:final messages):
        if (!mounted) return;
        setState(() => _messages = _deduplicate(messages));
        _scrollToEnd();
      case GlobalChatMessageReceived(:final message):
        if (!mounted || _messages.any((entry) => entry.id == message.id)) {
          return;
        }
        setState(() {
          _messages = [..._messages, message];
          _sending = false;
        });
        _scrollToEnd();
      case SocialChatRejected(scope: 'global', :final reason):
        if (!mounted) return;
        setState(() => _sending = false);
        ScaffoldMessenger.of(context)
            .showSnackBar(SnackBar(content: Text(_reasonFor(reason))));
      default:
        break;
    }
  }

  List<GlobalChatMessage> _deduplicate(List<GlobalChatMessage> messages) {
    final ids = <String>{};
    return messages
        .where((message) => ids.add(message.id))
        .toList(growable: false);
  }

  Future<void> _send() async {
    final content = _composer.text.trim();
    if (content.isEmpty ||
        _sending ||
        _trust?.globalChat != GlobalChatAccess.public) {
      return;
    }
    setState(() => _sending = true);
    ref.read(realtimeClientProvider).sendGlobalChat(content);
    _composer.clear();
  }

  String _reasonFor(String reason) => switch (reason) {
    'tier_too_low' =>
      'Ai nevoie de treapta T2 și email verificat pentru chatul global.',
    'muted' => 'Chatul este restricționat temporar pentru acest cont.',
    'rate_limited' => 'Prea multe mesaje. Așteaptă câteva secunde.',
    _ => 'Mesajul nu a putut fi trimis.',
  };

  Future<void> _report(GlobalChatMessage message) async {
    final reasonController = TextEditingController();
    final reason = await showDialog<String>(
      context: context,
      builder: (dialogContext) => AlertDialog(
        backgroundColor: GamePalette.stone800,
        title: Text('Raportează mesajul', style: GameText.heading),
        content: TextField(
          key: const Key('global-chat-report-reason'),
          controller: reasonController,
          autofocus: true,
          style: GameText.body,
          decoration: InputDecoration(
            hintText: 'Descrie pe scurt problema',
            hintStyle: GameText.bodyDim,
          ),
        ),
        actions: [
          TextButton(
            onPressed: () => Navigator.of(dialogContext).pop(),
            child: const Text('Renunță'),
          ),
          TextButton(
            onPressed: () =>
                Navigator.of(dialogContext).pop(reasonController.text.trim()),
            child: const Text('Trimite'),
          ),
        ],
      ),
    );
    reasonController.dispose();
    if (reason == null || reason.length < 3 || !mounted) return;

    try {
      await ref
          .read(socialRepositoryProvider)
          .reportMessage(
            reportedUserId: message.senderId,
            reason: reason,
            scope: 'global',
            contentSnapshot: message.content,
          );
      if (!mounted) return;
      ScaffoldMessenger.of(context).showSnackBar(
        const SnackBar(content: Text('Raportul a fost trimis moderatorilor.')),
      );
    } on ApiException catch (error) {
      if (!mounted) return;
      ScaffoldMessenger.of(context)
          .showSnackBar(SnackBar(content: Text(error.message)));
    }
  }

  void _scrollToEnd() {
    WidgetsBinding.instance.addPostFrameCallback((_) {
      if (_scroll.hasClients) {
        _scroll.jumpTo(_scroll.position.maxScrollExtent);
      }
    });
  }

  @override
  Widget build(BuildContext context) {
    final l10n = AppLocalizations.of(context);
    return Scaffold(
      body: RealmBackdrop(
        accent: GamePalette.arcane,
        artAsset: 'assets/game/realm_map_v2.png',
        artOpacity: 0.12,
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
                    const GameIcon(
                      GameSymbol.chat,
                      size: 24,
                      color: GamePalette.gold,
                    ),
                    const SizedBox(width: 8),
                    Expanded(
                      child: Text(
                        'LOBBY GLOBAL',
                        style: GameText.heading.copyWith(fontSize: 15),
                      ),
                    ),
                    _TierSeal(trust: _trust),
                  ],
                ),
              ),
              Expanded(child: _buildBody(context)),
              _buildComposer(context),
            ],
          ),
        ),
      ),
    );
  }

  Widget _buildBody(BuildContext context) {
    if (_loading) return const Center(child: CircularProgressIndicator());
    if (_error != null) {
      return Center(
        child: GameFrame(
          margin: const EdgeInsets.all(22),
          glow: true,
          child: Text(
            _error!,
            textAlign: TextAlign.center,
            style: GameText.bodyDim,
          ),
        ),
      );
    }
    final trust = _trust;
    if (trust == null || trust.globalChat != GlobalChatAccess.public) {
      final remaining = trust?.answersToNextTier;
      return Center(
        child: GameFrame(
          margin: const EdgeInsets.all(22),
          glow: true,
          child: Column(
            mainAxisSize: MainAxisSize.min,
            children: [
              const GameIcon(
                GameSymbol.shield,
                size: 48,
                color: GamePalette.gold,
              ),
              const SizedBox(height: 14),
              Text('CHAT ÎNCUIAT', style: GameText.heading),
              const SizedBox(height: 8),
              Text(
                remaining == null
                    ? 'Verifică emailul pentru a accesa lobby-ul global.'
                    : 'Mai ai $remaining răspunsuri corecte până la următoarea treaptă.',
                textAlign: TextAlign.center,
                style: GameText.bodyDim,
              ),
            ],
          ),
        ),
      );
    }
    if (_messages.isEmpty) {
      return Center(
        child: Text(
          'Nimeni nu a vorbit încă în acest lobby.',
          style: GameText.bodyDim,
        ),
      );
    }
    return ListView.builder(
      key: const Key('global-chat-thread'),
      controller: _scroll,
      padding: const EdgeInsets.fromLTRB(14, 8, 14, 8),
      itemCount: _messages.length,
      itemBuilder: (context, index) {
        final message = _messages[index];
        return GestureDetector(
          onLongPress: () => _report(message),
          child: GameFrame(
            margin: const EdgeInsets.only(bottom: 8),
            padding: const EdgeInsets.symmetric(horizontal: 12, vertical: 9),
            child: Column(
              crossAxisAlignment: CrossAxisAlignment.start,
              children: [
                Text(
                  message.senderName.isEmpty ? 'Jucător' : message.senderName,
                  style: GameText.eyebrow.copyWith(fontSize: 10),
                ),
                const SizedBox(height: 3),
                Text(
                  message.content,
                  style: GameText.body.copyWith(fontSize: 13),
                ),
              ],
            ),
          ),
        );
      },
    );
  }

  Widget _buildComposer(BuildContext context) {
    final canSend = !_loading && _trust?.globalChat == GlobalChatAccess.public;
    if (!canSend) return const SizedBox(height: 12);
    return Padding(
      padding: const EdgeInsets.fromLTRB(14, 4, 14, 12),
      child: Row(
        children: [
          Expanded(
            child: TextField(
              key: const Key('global-chat-composer'),
              controller: _composer,
              maxLength: 500,
              minLines: 1,
              maxLines: 3,
              style: GameText.body.copyWith(fontSize: 13),
              decoration: InputDecoration(
                isDense: true,
                counterText: '',
                hintText: 'Trimite un mesaj în lobby…',
                hintStyle: GameText.bodyDim.copyWith(fontSize: 12),
              ),
              onSubmitted: (_) => _send(),
            ),
          ),
          const SizedBox(width: 10),
          GameIconButton(
            key: const Key('global-chat-send'),
            symbol: GameSymbol.play,
            tooltip: 'Trimite mesajul',
            size: 42,
            onPressed: _sending ? null : _send,
          ),
        ],
      ),
    );
  }
}

class _TierSeal extends StatelessWidget {
  const _TierSeal({required this.trust});

  final TrustInfo? trust;

  @override
  Widget build(BuildContext context) {
    final tier = trust?.tier ?? 0;
    return Container(
      padding: const EdgeInsets.symmetric(horizontal: 9, vertical: 5),
      decoration: BoxDecoration(
        color: GamePalette.stone900.withValues(alpha: 0.78),
        borderRadius: BorderRadius.circular(10),
        border: Border.all(color: GamePalette.gold.withValues(alpha: 0.34)),
      ),
      child: Text('T$tier', style: GameText.eyebrow.copyWith(fontSize: 11)),
    );
  }
}
