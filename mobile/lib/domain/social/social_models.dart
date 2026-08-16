library;

/// Modelele sociale din `owner-plan.md` §2, așa cum le livrează API-ul.
///
/// Niciun prag și nicio permisiune nu se calculează aici: serverul e sursa de
/// adevăr, aplicația doar afișează ce a decis el.

enum FriendshipStatus { pending, accepted, declined }

/// Din ce parte vine relația, ca ecranul să știe dacă arată „Acceptă” sau
/// „Cerere trimisă”.
enum FriendDirection { incoming, outgoing, mutual }

class Friend {
  const Friend({
    required this.friendshipId,
    required this.userId,
    required this.username,
    required this.displayName,
    required this.status,
    required this.direction,
    this.isOnline = false,
  });

  final String friendshipId;
  final String userId;
  final String username;
  final String displayName;
  final FriendshipStatus status;
  final FriendDirection direction;

  /// Prezența vine pe socket, nu din REST, deci se completează separat.
  final bool isOnline;

  bool get isMutual => status == FriendshipStatus.accepted;

  Friend copyWith({bool? isOnline}) {
    return Friend(
      friendshipId: friendshipId,
      userId: userId,
      username: username,
      displayName: displayName,
      status: status,
      direction: direction,
      isOnline: isOnline ?? this.isOnline,
    );
  }

  static Friend fromJson(Map<String, Object?> json) {
    return Friend(
      friendshipId: json['friendshipId']?.toString() ?? '',
      userId: json['userId']?.toString() ?? '',
      username: json['username']?.toString() ?? '',
      displayName:
          json['displayName']?.toString() ?? json['username']?.toString() ?? '',
      status: switch (json['status']?.toString()) {
        'ACCEPTED' => FriendshipStatus.accepted,
        'DECLINED' => FriendshipStatus.declined,
        _ => FriendshipStatus.pending,
      },
      direction: switch (json['direction']?.toString()) {
        'mutual' => FriendDirection.mutual,
        'outgoing' => FriendDirection.outgoing,
        _ => FriendDirection.incoming,
      },
    );
  }
}

enum ConversationKind {
  /// Fir între prieteni: deschis din prima.
  friend,

  /// Cerere de mesaj de la un necunoscut, încă neacceptată (§2.4).
  dmRequest,

  /// Cerere acceptată — de aici e o conversație normală.
  dmAccepted,
}

class Conversation {
  const Conversation({
    required this.id,
    required this.kind,
    required this.otherUserId,
    required this.otherDisplayName,
    this.lastMessagePreview,
    this.lastMessageAt,
    this.unread = false,
  });

  final String id;
  final ConversationKind kind;
  final String otherUserId;
  final String otherDisplayName;
  final String? lastMessagePreview;
  final DateTime? lastMessageAt;
  final bool unread;

  bool get needsAcceptance => kind == ConversationKind.dmRequest;

  static Conversation fromJson(Map<String, Object?> json) {
    return Conversation(
      id: json['id']?.toString() ?? '',
      kind: switch (json['type']?.toString()) {
        'FRIEND' => ConversationKind.friend,
        'DM_ACCEPTED' => ConversationKind.dmAccepted,
        _ => ConversationKind.dmRequest,
      },
      otherUserId: json['otherUserId']?.toString() ?? '',
      otherDisplayName:
          json['otherDisplayName']?.toString() ??
          json['otherUsername']?.toString() ??
          '',
      lastMessagePreview: json['lastMessagePreview']?.toString(),
      lastMessageAt: DateTime.tryParse(json['lastMessageAt']?.toString() ?? ''),
      unread: json['unread'] == true,
    );
  }
}

class ChatMessage {
  const ChatMessage({
    required this.id,
    required this.conversationId,
    required this.senderId,
    required this.content,
    required this.createdAt,
    this.senderDisplayName = '',
  });

  final String id;
  final String conversationId;
  final String senderId;
  final String senderDisplayName;
  final String content;
  final DateTime createdAt;

  static ChatMessage fromJson(Map<String, Object?> json) {
    return ChatMessage(
      id: json['id']?.toString() ?? '',
      conversationId: json['conversationId']?.toString() ?? '',
      senderId: json['senderId']?.toString() ?? '',
      senderDisplayName: json['senderDisplayName']?.toString() ?? '',
      content: json['content']?.toString() ?? '',
      createdAt:
          DateTime.tryParse(json['createdAt']?.toString() ?? '') ??
          DateTime.now(),
    );
  }
}

/// Unde poate scrie jucătorul în chatul global (§2.5).
enum GlobalChatAccess { reactions, ownMatches, public }

/// Treapta de încredere și ce deblochează, exact cum a calculat-o serverul.
class TrustInfo {
  const TrustInfo({
    required this.tier,
    required this.tierKey,
    required this.correctAnswers,
    required this.globalChat,
    required this.canInitiateDm,
    this.answersToNextTier,
    this.nextTierThreshold,
    this.mutedUntil,
  });

  final int tier;

  /// Cheia de traducere a numelui treptei; textul afișat trece prin i18n.
  final String tierKey;
  final int correctAnswers;
  final GlobalChatAccess globalChat;
  final bool canInitiateDm;
  final int? answersToNextTier;
  final int? nextTierThreshold;
  final DateTime? mutedUntil;

  bool get isMuted =>
      mutedUntil != null && mutedUntil!.isAfter(DateTime.now());

  /// Cât din drumul spre treapta următoare e parcurs, pentru bara de progres.
  double get progressToNextTier {
    final target = nextTierThreshold;
    final remaining = answersToNextTier;
    if (target == null || remaining == null || target <= 0) return 1;
    final done = target - remaining;
    return (done / target).clamp(0.0, 1.0);
  }

  static TrustInfo fromJson(Map<String, Object?> json) {
    int? asInt(Object? value) =>
        value is num ? value.round() : int.tryParse(value?.toString() ?? '');
    return TrustInfo(
      tier: asInt(json['tier']) ?? 0,
      tierKey: json['tierKey']?.toString() ?? 'newcomer',
      correctAnswers: asInt(json['correctAnswers']) ?? 0,
      globalChat: switch (json['globalChat']?.toString()) {
        'public' => GlobalChatAccess.public,
        'ownMatches' => GlobalChatAccess.ownMatches,
        _ => GlobalChatAccess.reactions,
      },
      canInitiateDm: json['canInitiateDm'] == true,
      answersToNextTier: asInt(json['answersToNextTier']),
      nextTierThreshold: asInt(json['nextTierThreshold']),
      mutedUntil: DateTime.tryParse(json['mutedUntil']?.toString() ?? ''),
    );
  }
}

enum DmPermission { everyone, friendsOnly, nobody }

class PrivacySettings {
  const PrivacySettings({
    required this.dmPermission,
    required this.dmPermissionLocked,
  });

  final DmPermission dmPermission;

  /// Conturile de minor nu pot ridica restricția. Setarea se afișează blocată,
  /// nu ascunsă: altfel jucătorul n-ar înțelege de ce nu primește mesaje.
  final bool dmPermissionLocked;

  static PrivacySettings fromJson(Map<String, Object?> json) {
    return PrivacySettings(
      dmPermission: switch (json['dmPermission']?.toString()) {
        'EVERYONE' => DmPermission.everyone,
        'NOBODY' => DmPermission.nobody,
        _ => DmPermission.friendsOnly,
      },
      dmPermissionLocked: json['dmPermissionLocked'] == true,
    );
  }

  static String toWire(DmPermission permission) => switch (permission) {
    DmPermission.everyone => 'EVERYONE',
    DmPermission.friendsOnly => 'FRIENDS_ONLY',
    DmPermission.nobody => 'NOBODY',
  };
}
