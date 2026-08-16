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
import '../../l10n/app_localizations.dart';

/// Firul unei conversații 1:1 (prieteni sau DM acceptat).
///
/// Trimiterea trece prin API, care aplică filtrul de limbaj, mutul, blocarea și
/// treapta de încredere. Ecranul nu decide nimic — afișează refuzul așa cum a
/// venit.
class ConversationScreen extends ConsumerStatefulWidget {
  const ConversationScreen({
    required this.conversationId,
    this.title,
    super.key,
  });

  final String conversationId;
  final String? title;

  @override
  ConsumerState<ConversationScreen> createState() =>
      _ConversationScreenState();
}

class _ConversationScreenState extends ConsumerState<ConversationScreen> {
  final _composer = TextEditingController();
  final _scroll = ScrollController();

  List<ChatMessage> _messages = const [];
  bool _loading = true;
  bool _sending = false;
  String? _error;
  Timer? _poll;

  @override
  void initState() {
    super.initState();
    WidgetsBinding.instance.addPostFrameCallback((_) => _load());
    // Livrarea în timp real a mesajelor directe merge prin `chat:message` din
    // `backend/realtime`. Până când clientul de socket e legat la el, ecranul
    // deschis reîmprospătează firul periodic — un chat în care mesajul
    // celuilalt apare abia la redeschidere n-ar fi un chat.
    _poll = Timer.periodic(const Duration(seconds: 4), (_) => _refresh());
  }

  @override
  void dispose() {
    _poll?.cancel();
    _composer.dispose();
    _scroll.dispose();
    super.dispose();
  }

  Future<void> _load() async {
    try {
      final messages = await ref
          .read(socialRepositoryProvider)
          .fetchMessages(widget.conversationId);
      if (!mounted) return;
      setState(() {
        _messages = messages;
        _loading = false;
        _error = null;
      });
      _scrollToEnd();
    } on ApiException catch (error) {
      if (!mounted) return;
      setState(() {
        _loading = false;
        _error = error.message;
      });
    }
  }

  /// Reîmprospătare tăcută: fără indicator de încărcare și fără erori pe ecran,
  /// ca o pană de rețea de o secundă să nu clipească peste conversație.
  Future<void> _refresh() async {
    if (!mounted || _loading) return;
    try {
      final messages = await ref
          .read(socialRepositoryProvider)
          .fetchMessages(widget.conversationId);
      if (!mounted) return;
      final known = _messages.map((message) => message.id).toSet();
      final fresh = messages
          .where((message) => !known.contains(message.id))
          .toList(growable: false);
      if (fresh.isEmpty) return;
      setState(() => _messages = [..._messages, ...fresh]);
      _scrollToEnd();
    } catch (_) {
      // Tăcut intenționat: următorul ciclu reîncearcă.
    }
  }

  Future<void> _send() async {
    final content = _composer.text.trim();
    if (content.isEmpty || _sending) return;
    setState(() => _sending = true);
    try {
      final sent = await ref
          .read(socialRepositoryProvider)
          .sendMessage(widget.conversationId, content);
      if (!mounted) return;
      setState(() {
        // Textul afișat e cel întors de server: profanitatea vine deja
        // mascată, deci ecranul nu poate arăta altceva decât a fost salvat.
        _messages = [..._messages, sent];
        _sending = false;
      });
      _composer.clear();
      _scrollToEnd();
    } on ApiException catch (error) {
      if (!mounted) return;
      setState(() => _sending = false);
      ScaffoldMessenger.of(
        context,
      ).showSnackBar(SnackBar(content: Text(error.message)));
    }
  }

  void _scrollToEnd() {
    WidgetsBinding.instance.addPostFrameCallback((_) {
      if (_scroll.hasClients) {
        _scroll.jumpTo(_scroll.position.maxScrollExtent);
      }
    });
  }

  Future<void> _report(ChatMessage message) async {
    final l10n = AppLocalizations.of(context);
    final reasonController = TextEditingController();
    final reason = await showDialog<String>(
      context: context,
      builder: (dialogContext) => AlertDialog(
        backgroundColor: GamePalette.stone800,
        title: Text(l10n.chatReportTitle, style: GameText.heading),
        content: TextField(
          key: const Key('chat-report-reason'),
          controller: reasonController,
          autofocus: true,
          style: GameText.body,
          decoration: InputDecoration(hintText: l10n.chatReportHint),
        ),
        actions: [
          TextButton(
            onPressed: () => Navigator.of(dialogContext).pop(),
            child: Text(l10n.leaveBattleCancel),
          ),
          TextButton(
            onPressed: () =>
                Navigator.of(dialogContext).pop(reasonController.text.trim()),
            child: Text(l10n.chatReportSend),
          ),
        ],
      ),
    );
    reasonController.dispose();
    if (reason == null || reason.length < 3 || !mounted) return;

    final messenger = ScaffoldMessenger.of(context);
    try {
      await ref
          .read(socialRepositoryProvider)
          .reportMessage(
            reportedUserId: message.senderId,
            reason: reason,
            scope: 'friend',
            messageId: message.id,
          );
      messenger.showSnackBar(SnackBar(content: Text(l10n.chatReportSent)));
    } on ApiException catch (error) {
      messenger.showSnackBar(SnackBar(content: Text(error.message)));
    }
  }

  @override
  Widget build(BuildContext context) {
    final l10n = AppLocalizations.of(context);

    return Scaffold(
      body: RealmBackdrop(
        accent: GamePalette.arcane,
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
                        widget.title ?? l10n.conversationsTitle,
                        style: GameText.heading.copyWith(fontSize: 15),
                        overflow: TextOverflow.ellipsis,
                      ),
                    ),
                  ],
                ),
              ),
              Expanded(child: _buildThread(context)),
              _buildComposer(context),
            ],
          ),
        ),
      ),
    );
  }

  Widget _buildThread(BuildContext context) {
    final l10n = AppLocalizations.of(context);
    if (_loading) return const Center(child: CircularProgressIndicator());
    final error = _error;
    if (error != null) {
      return Center(
        child: Padding(
          padding: const EdgeInsets.all(24),
          child: Text(
            error,
            textAlign: TextAlign.center,
            style: GameText.bodyDim,
          ),
        ),
      );
    }
    if (_messages.isEmpty) {
      return Center(
        child: Text(
          l10n.conversationEmpty,
          key: const Key('conversation-empty'),
          style: GameText.bodyDim.copyWith(fontSize: 12),
        ),
      );
    }

    return ListView.builder(
      key: const Key('conversation-thread'),
      controller: _scroll,
      padding: const EdgeInsets.fromLTRB(14, 8, 14, 8),
      itemCount: _messages.length,
      itemBuilder: (itemContext, index) {
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
                  message.senderDisplayName.isEmpty
                      ? '—'
                      : message.senderDisplayName,
                  style: GameText.eyebrow.copyWith(fontSize: 10),
                ),
                const SizedBox(height: 3),
                Text(message.content, style: GameText.body.copyWith(fontSize: 13)),
              ],
            ),
          ),
        );
      },
    );
  }

  Widget _buildComposer(BuildContext context) {
    final l10n = AppLocalizations.of(context);
    return Padding(
      padding: const EdgeInsets.fromLTRB(14, 4, 14, 12),
      child: Row(
        children: [
          Expanded(
            child: TextField(
              key: const Key('conversation-composer'),
              controller: _composer,
              maxLength: 1000,
              minLines: 1,
              maxLines: 4,
              style: GameText.body.copyWith(fontSize: 13),
              decoration: InputDecoration(
                isDense: true,
                counterText: '',
                hintText: l10n.chatComposerHint,
                hintStyle: GameText.bodyDim.copyWith(fontSize: 12),
              ),
              onSubmitted: (_) => _send(),
            ),
          ),
          const SizedBox(width: 10),
          GameIconButton(
            symbol: GameSymbol.play,
            tooltip: l10n.chatSend,
            size: 42,
            onPressed: _sending ? null : _send,
          ),
        ],
      ),
    );
  }
}
