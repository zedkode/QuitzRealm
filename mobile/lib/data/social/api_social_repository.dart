import '../../core/network/api_client.dart';
import '../../domain/social/social_models.dart';
import '../../domain/social/social_repository.dart';

class ApiSocialRepository implements SocialRepository {
  ApiSocialRepository(this._api);

  final ApiClient _api;

  @override
  Future<List<Friend>> fetchFriends() async {
    final payload = await _api.get('friends', authenticated: true);
    return _list(payload).map(Friend.fromJson).toList(growable: false);
  }

  @override
  Future<Friend> requestFriendship(String username) async {
    final payload = await _api.post(
      'friends/requests',
      body: {'username': username.trim()},
      authenticated: true,
    );
    return Friend.fromJson(_map(payload));
  }

  @override
  Future<Friend> respondToRequest(
    String friendshipId, {
    required bool accept,
  }) async {
    final payload = await _api.post(
      'friends/requests/$friendshipId',
      body: {'accept': accept},
      authenticated: true,
    );
    return Friend.fromJson(_map(payload));
  }

  @override
  Future<void> removeFriend(String userId) async {
    await _api.delete('friends/$userId', authenticated: true);
  }

  @override
  Future<void> blockUser(String userId) async {
    await _api.post('blocks/$userId', authenticated: true);
  }

  @override
  Future<void> unblockUser(String userId) async {
    await _api.delete('blocks/$userId', authenticated: true);
  }

  @override
  Future<List<Conversation>> fetchConversations() async {
    final payload = await _api.get('chat/conversations', authenticated: true);
    return _list(payload).map(Conversation.fromJson).toList(growable: false);
  }

  @override
  Future<Conversation> openConversation(String userId) async {
    final payload = await _api.post(
      'chat/conversations',
      body: {'userId': userId},
      authenticated: true,
    );
    return Conversation.fromJson(_map(payload));
  }

  @override
  Future<Conversation> acceptConversation(String conversationId) async {
    final payload = await _api.post(
      'chat/conversations/$conversationId/accept',
      authenticated: true,
    );
    return Conversation.fromJson(_map(payload));
  }

  @override
  Future<List<ChatMessage>> fetchMessages(
    String conversationId, {
    DateTime? before,
  }) async {
    // Paginare pe timp: într-un fir care primește mesaje în timp ce derulezi,
    // un offset ar sări sau ar repeta rânduri.
    final query = before == null
        ? ''
        : '?before=${Uri.encodeQueryComponent(before.toUtc().toIso8601String())}';
    final payload = await _api.get(
      'chat/conversations/$conversationId/messages$query',
      authenticated: true,
    );
    return _list(payload).map(ChatMessage.fromJson).toList(growable: false);
  }

  @override
  Future<ChatMessage> sendMessage(
    String conversationId,
    String content,
  ) async {
    final payload = await _api.post(
      'chat/conversations/$conversationId/messages',
      body: {'content': content},
      authenticated: true,
    );
    return ChatMessage.fromJson(_map(payload));
  }

  @override
  Future<TrustInfo> fetchTrust() async {
    final payload = await _api.get('chat/trust', authenticated: true);
    return TrustInfo.fromJson(_map(payload));
  }

  @override
  Future<PrivacySettings> fetchPrivacy() async {
    final payload = await _api.get('chat/privacy', authenticated: true);
    return PrivacySettings.fromJson(_map(payload));
  }

  @override
  Future<PrivacySettings> updateDmPermission(DmPermission permission) async {
    final payload = await _api.patch(
      'chat/privacy',
      body: {'dmPermission': PrivacySettings.toWire(permission)},
      authenticated: true,
    );
    return PrivacySettings.fromJson(_map(payload));
  }

  @override
  Future<void> reportMessage({
    required String reportedUserId,
    required String reason,
    required String scope,
    String? messageId,
    String? contentSnapshot,
  }) async {
    await _api.post(
      'chat/reports',
      body: {
        'reportedUserId': reportedUserId,
        'reason': reason,
        'scope': scope,
        'messageId': ?messageId,
        'contentSnapshot': ?contentSnapshot,
      },
      authenticated: true,
    );
  }

  List<Map<String, Object?>> _list(Object? payload) {
    if (payload is! List) return const [];
    return payload.whereType<Map<String, Object?>>().toList(growable: false);
  }

  Map<String, Object?> _map(Object? payload) {
    if (payload is! Map<String, Object?>) {
      throw const FormatException('Răspuns social invalid');
    }
    return payload;
  }
}
