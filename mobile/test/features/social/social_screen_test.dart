import 'package:flutter/material.dart';
import 'package:flutter_riverpod/flutter_riverpod.dart';
import 'package:flutter_test/flutter_test.dart';
import 'package:quiz_realm/core/network/api_exception.dart';
import 'package:quiz_realm/core/providers/repository_providers.dart';
import 'package:quiz_realm/domain/social/social_models.dart';
import 'package:quiz_realm/domain/social/social_repository.dart';
import 'package:quiz_realm/features/social/social_screen.dart';
import 'package:quiz_realm/l10n/app_localizations.dart';

/// Ține locul serverului. Deciziile (cine poate scrie, cui) sunt ale lui, deci
/// testele le simulează prin ce întoarce, nu prin logică în client.
class _FakeSocialRepository implements SocialRepository {
  _FakeSocialRepository({
    this.friends = const [],
    this.conversations = const [],
    TrustInfo? trust,
    this.privacy = const PrivacySettings(
      dmPermission: DmPermission.friendsOnly,
      dmPermissionLocked: false,
    ),
    this.throwOnRequest,
  }) : trust =
           trust ??
           const TrustInfo(
             tier: 0,
             tierKey: 'newcomer',
             correctAnswers: 3,
             globalChat: GlobalChatAccess.reactions,
             canInitiateDm: false,
             answersToNextTier: 7,
             nextTierThreshold: 10,
           );

  List<Friend> friends;
  List<Conversation> conversations;
  TrustInfo trust;
  PrivacySettings privacy;
  ApiException? throwOnRequest;

  String? requestedUsername;
  String? respondedFriendshipId;
  bool? respondedAccept;
  String? blockedUserId;

  @override
  Future<List<Friend>> fetchFriends() async => friends;

  @override
  Future<Friend> requestFriendship(String username) async {
    final failure = throwOnRequest;
    if (failure != null) throw failure;
    requestedUsername = username;
    return const Friend(
      friendshipId: 'f1',
      userId: 'u9',
      username: 'nou',
      displayName: 'Nou',
      status: FriendshipStatus.pending,
      direction: FriendDirection.outgoing,
    );
  }

  @override
  Future<Friend> respondToRequest(
    String friendshipId, {
    required bool accept,
  }) async {
    respondedFriendshipId = friendshipId;
    respondedAccept = accept;
    friends = const [];
    return const Friend(
      friendshipId: 'f1',
      userId: 'u2',
      username: 'rival',
      displayName: 'Rival',
      status: FriendshipStatus.accepted,
      direction: FriendDirection.mutual,
    );
  }

  @override
  Future<void> removeFriend(String userId) async {}

  @override
  Future<void> blockUser(String userId) async {
    blockedUserId = userId;
    friends = const [];
  }

  @override
  Future<void> unblockUser(String userId) async {}

  @override
  Future<FriendSuggestionFeed> fetchFriendSuggestions() async {
    return const FriendSuggestionFeed(enabled: false, suggestions: []);
  }

  @override
  Future<bool> updateFriendSuggestionsEnabled(bool enabled) async => enabled;

  @override
  Future<List<Conversation>> fetchConversations() async => conversations;

  @override
  Future<Conversation> openConversation(String userId) async {
    return const Conversation(
      id: 'c1',
      kind: ConversationKind.friend,
      otherUserId: 'u2',
      otherDisplayName: 'Rival',
    );
  }

  @override
  Future<Conversation> acceptConversation(String conversationId) async {
    return const Conversation(
      id: 'c1',
      kind: ConversationKind.dmAccepted,
      otherUserId: 'u2',
      otherDisplayName: 'Rival',
    );
  }

  @override
  Future<List<ChatMessage>> fetchMessages(
    String conversationId, {
    DateTime? before,
  }) async => const [];

  @override
  Future<ChatMessage> sendMessage(String conversationId, String content) async {
    return ChatMessage(
      id: 'm1',
      conversationId: conversationId,
      senderId: 'me',
      content: content,
      createdAt: DateTime.now(),
    );
  }

  @override
  Future<TrustInfo> fetchTrust() async => trust;

  @override
  Future<PrivacySettings> fetchPrivacy() async => privacy;

  @override
  Future<PrivacySettings> updateDmPermission(DmPermission permission) async {
    privacy = PrivacySettings(
      dmPermission: permission,
      dmPermissionLocked: privacy.dmPermissionLocked,
    );
    return privacy;
  }

  @override
  Future<void> reportMessage({
    required String reportedUserId,
    required String reason,
    required String scope,
    String? messageId,
    String? contentSnapshot,
  }) async {}
}

Future<void> _pumpSocial(
  WidgetTester tester,
  _FakeSocialRepository repository,
) async {
  tester.view
    ..physicalSize = const Size(430, 1000)
    ..devicePixelRatio = 1;
  addTearDown(tester.view.reset);

  await tester.pumpWidget(
    ProviderScope(
      overrides: [socialRepositoryProvider.overrideWithValue(repository)],
      child: const MaterialApp(
        locale: Locale('ro'),
        localizationsDelegates: AppLocalizations.localizationsDelegates,
        supportedLocales: AppLocalizations.supportedLocales,
        home: SocialScreen(),
      ),
    ),
  );
  await tester.pump();
  await tester.pump(const Duration(milliseconds: 300));
}

void main() {
  testWidgets('treapta de încredere arată progresul calculat de server', (
    tester,
  ) async {
    await _pumpSocial(tester, _FakeSocialRepository());

    expect(find.byKey(const Key('social-trust-card')), findsOneWidget);
    expect(find.textContaining('T0'), findsOneWidget);
    // Pragurile nu se calculează în client: afișăm exact ce a spus serverul.
    expect(find.textContaining('7'), findsWidgets);
  });

  testWidgets('cererea primită oferă acceptare și refuz', (tester) async {
    final repository = _FakeSocialRepository(
      friends: const [
        Friend(
          friendshipId: 'f1',
          userId: 'u2',
          username: 'rival',
          displayName: 'Rival',
          status: FriendshipStatus.pending,
          direction: FriendDirection.incoming,
        ),
      ],
    );
    await _pumpSocial(tester, repository);

    expect(find.byKey(const Key('friend-request-f1')), findsOneWidget);
    await tester.tap(find.byKey(const Key('friend-accept-f1')));
    await tester.pump();
    await tester.pump(const Duration(milliseconds: 300));

    expect(repository.respondedFriendshipId, 'f1');
    expect(repository.respondedAccept, isTrue);
  });

  testWidgets('prietenul online e marcat și se poate bloca', (tester) async {
    final repository = _FakeSocialRepository(
      friends: const [
        Friend(
          friendshipId: 'f2',
          userId: 'u3',
          username: 'aliat',
          displayName: 'Aliat',
          status: FriendshipStatus.accepted,
          direction: FriendDirection.mutual,
        ),
      ],
    );
    await _pumpSocial(tester, repository);

    expect(find.byKey(const Key('friend-u3')), findsOneWidget);
    await tester.tap(find.byKey(const Key('friend-block-u3')));
    await tester.pump();
    await tester.pump(const Duration(milliseconds: 400));
    await tester.tap(find.byKey(const Key('friend-block-confirm')));
    await tester.pump();
    await tester.pump(const Duration(milliseconds: 400));

    expect(repository.blockedUserId, 'u3');
  });

  testWidgets('refuzul serverului ajunge la jucător, nu e înghițit', (
    tester,
  ) async {
    final repository = _FakeSocialRepository(
      throwOnRequest: const ApiException(
        404,
        'Nu există un jucător cu acest nume.',
      ),
    );
    await _pumpSocial(tester, repository);

    await tester.enterText(
      find.byKey(const Key('social-add-friend-field')),
      'inexistent',
    );
    await tester.tap(find.byKey(const Key('social-add-friend-send')));
    await tester.pump();
    await tester.pump(const Duration(milliseconds: 300));

    expect(find.text('Nu există un jucător cu acest nume.'), findsOneWidget);
  });

  testWidgets('cererile de mesaj stau separat de conversații', (tester) async {
    final repository = _FakeSocialRepository(
      conversations: const [
        Conversation(
          id: 'c9',
          kind: ConversationKind.dmRequest,
          otherUserId: 'u7',
          otherDisplayName: 'Necunoscut',
        ),
        Conversation(
          id: 'c1',
          kind: ConversationKind.friend,
          otherUserId: 'u2',
          otherDisplayName: 'Rival',
        ),
      ],
    );
    await _pumpSocial(tester, repository);

    await tester.tap(find.byKey(const Key('social-tab-messages')));
    await tester.pump();
    await tester.pump(const Duration(milliseconds: 400));

    // Coada de cereri e vizibilă ca atare: acceptarea e o decizie, nu un fir
    // normal de conversație.
    expect(find.byKey(const Key('message-request-c9')), findsOneWidget);
    expect(find.byKey(const Key('conversation-c1')), findsOneWidget);
  });

  testWidgets('contul de minor vede setarea de DM blocată, nu ascunsă', (
    tester,
  ) async {
    final repository = _FakeSocialRepository(
      privacy: const PrivacySettings(
        dmPermission: DmPermission.friendsOnly,
        dmPermissionLocked: true,
      ),
    );
    await _pumpSocial(tester, repository);

    await tester.tap(find.byKey(const Key('social-privacy-open')));
    await tester.pump();
    await tester.pump(const Duration(milliseconds: 400));

    expect(find.byKey(const Key('privacy-dm-everyone')), findsOneWidget);
    final tile = tester.widget<ListTile>(
      find.byKey(const Key('privacy-dm-everyone')),
    );
    expect(tile.enabled, isFalse);
  });
}
