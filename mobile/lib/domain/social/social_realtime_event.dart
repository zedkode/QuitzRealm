import 'social_models.dart';

sealed class SocialRealtimeEvent {
  const SocialRealtimeEvent();
}

class GlobalChatHistoryReceived extends SocialRealtimeEvent {
  const GlobalChatHistoryReceived(this.messages);

  final List<GlobalChatMessage> messages;
}

class GlobalChatMessageReceived extends SocialRealtimeEvent {
  const GlobalChatMessageReceived(this.message);

  final GlobalChatMessage message;
}

class DirectChatMessageReceived extends SocialRealtimeEvent {
  const DirectChatMessageReceived(this.message);

  final ChatMessage message;
}

class SocialChatRejected extends SocialRealtimeEvent {
  const SocialChatRejected({required this.scope, required this.reason});

  final String scope;
  final String reason;
}
