import 'package:flutter_riverpod/flutter_riverpod.dart';

import '../../core/network/api_exception.dart';
import '../../core/providers/repository_providers.dart';
import '../../domain/social/social_models.dart';

enum SocialPhase { loading, ready, unauthenticated, error }

class SocialState {
  const SocialState({
    this.phase = SocialPhase.loading,
    this.friends = const [],
    this.conversations = const [],
    this.trust,
    this.privacy,
    this.errorMessage,
    this.busy = false,
  });

  final SocialPhase phase;
  final List<Friend> friends;
  final List<Conversation> conversations;
  final TrustInfo? trust;
  final PrivacySettings? privacy;

  /// Mesajul ultimei acțiuni eșuate (cerere respinsă, treaptă prea mică).
  /// Vine de la server: motivele reale sunt acolo, nu în client.
  final String? errorMessage;

  /// O acțiune e în curs; butoanele se blochează cât ține.
  final bool busy;

  /// Cererile primite se afișează separat: sunt singurele care cer o decizie.
  List<Friend> get incomingRequests => friends
      .where(
        (friend) =>
            friend.status == FriendshipStatus.pending &&
            friend.direction == FriendDirection.incoming,
      )
      .toList(growable: false);

  List<Friend> get outgoingRequests => friends
      .where(
        (friend) =>
            friend.status == FriendshipStatus.pending &&
            friend.direction == FriendDirection.outgoing,
      )
      .toList(growable: false);

  List<Friend> get acceptedFriends {
    final accepted = friends.where((friend) => friend.isMutual).toList();
    // Cei online primii: e informația pentru care deschizi lista.
    accepted.sort((first, second) {
      if (first.isOnline != second.isOnline) return first.isOnline ? -1 : 1;
      return first.displayName.toLowerCase().compareTo(
        second.displayName.toLowerCase(),
      );
    });
    return List.unmodifiable(accepted);
  }

  /// Cererile de mesaj neacceptate stau într-o coadă proprie (§2.4), ca să nu
  /// se amestece cu firele normale.
  List<Conversation> get messageRequests => conversations
      .where((conversation) => conversation.needsAcceptance)
      .toList(growable: false);

  List<Conversation> get activeConversations => conversations
      .where((conversation) => !conversation.needsAcceptance)
      .toList(growable: false);

  SocialState copyWith({
    SocialPhase? phase,
    List<Friend>? friends,
    List<Conversation>? conversations,
    TrustInfo? trust,
    PrivacySettings? privacy,
    String? errorMessage,
    bool clearError = false,
    bool? busy,
  }) {
    return SocialState(
      phase: phase ?? this.phase,
      friends: friends ?? this.friends,
      conversations: conversations ?? this.conversations,
      trust: trust ?? this.trust,
      privacy: privacy ?? this.privacy,
      errorMessage: clearError ? null : errorMessage ?? this.errorMessage,
      busy: busy ?? this.busy,
    );
  }
}

/// Starea ecranului social: prieteni, conversații, treaptă de încredere.
class SocialController extends StateNotifier<SocialState> {
  SocialController(this._ref) : super(const SocialState());

  final Ref _ref;

  Future<void> load() async {
    state = state.copyWith(phase: SocialPhase.loading, clearError: true);
    final repository = _ref.read(socialRepositoryProvider);
    try {
      final results = await Future.wait([
        repository.fetchFriends(),
        repository.fetchConversations(),
        repository.fetchTrust(),
        repository.fetchPrivacy(),
      ]);
      if (!mounted) return;
      state = state.copyWith(
        phase: SocialPhase.ready,
        friends: results[0] as List<Friend>,
        conversations: results[1] as List<Conversation>,
        trust: results[2] as TrustInfo,
        privacy: results[3] as PrivacySettings,
        clearError: true,
      );
    } on ApiException catch (error) {
      if (!mounted) return;
      // Fără cont valid nu e o defecțiune, ci un ecran de autentificare.
      state = state.copyWith(
        phase: error.statusCode == 401
            ? SocialPhase.unauthenticated
            : SocialPhase.error,
        errorMessage: error.message,
      );
    } catch (_) {
      if (!mounted) return;
      state = state.copyWith(phase: SocialPhase.error);
    }
  }

  Future<bool> sendFriendRequest(String username) {
    return _act(() async {
      await _ref.read(socialRepositoryProvider).requestFriendship(username);
      await _refreshFriends();
    });
  }

  Future<bool> respondToRequest(String friendshipId, {required bool accept}) {
    return _act(() async {
      await _ref
          .read(socialRepositoryProvider)
          .respondToRequest(friendshipId, accept: accept);
      await _refreshFriends();
    });
  }

  Future<bool> removeFriend(String userId) {
    return _act(() async {
      await _ref.read(socialRepositoryProvider).removeFriend(userId);
      await _refreshFriends();
    });
  }

  /// Blocarea atinge și lista de prieteni, și conversațiile: relația se rupe,
  /// iar firul dispare din listă.
  Future<bool> blockUser(String userId) {
    return _act(() async {
      await _ref.read(socialRepositoryProvider).blockUser(userId);
      await load();
    });
  }

  Future<Conversation?> openConversation(String userId) async {
    state = state.copyWith(busy: true, clearError: true);
    try {
      final conversation = await _ref
          .read(socialRepositoryProvider)
          .openConversation(userId);
      if (mounted) {
        state = state.copyWith(busy: false);
        await _refreshConversations();
      }
      return conversation;
    } on ApiException catch (error) {
      if (mounted) {
        state = state.copyWith(busy: false, errorMessage: error.message);
      }
      return null;
    }
  }

  Future<bool> acceptConversation(String conversationId) {
    return _act(() async {
      await _ref
          .read(socialRepositoryProvider)
          .acceptConversation(conversationId);
      await _refreshConversations();
    });
  }

  Future<bool> setDmPermission(DmPermission permission) {
    return _act(() async {
      final privacy = await _ref
          .read(socialRepositoryProvider)
          .updateDmPermission(permission);
      if (mounted) state = state.copyWith(privacy: privacy);
    });
  }

  /// Marchează prietenii online din anunțul de prezență primit pe socket.
  void applyPresence(Set<String> onlineUserIds) {
    if (!mounted) return;
    state = state.copyWith(
      friends: state.friends
          .map(
            (friend) =>
                friend.copyWith(isOnline: onlineUserIds.contains(friend.userId)),
          )
          .toList(growable: false),
    );
  }

  void clearError() {
    if (mounted) state = state.copyWith(clearError: true);
  }

  Future<bool> _act(Future<void> Function() operation) async {
    state = state.copyWith(busy: true, clearError: true);
    try {
      await operation();
      if (mounted) state = state.copyWith(busy: false);
      return true;
    } on ApiException catch (error) {
      if (mounted) {
        state = state.copyWith(busy: false, errorMessage: error.message);
      }
      return false;
    } catch (_) {
      if (mounted) state = state.copyWith(busy: false);
      return false;
    }
  }

  Future<void> _refreshFriends() async {
    final friends = await _ref.read(socialRepositoryProvider).fetchFriends();
    if (!mounted) return;
    // Prezența nu vine din REST; o păstrăm din starea curentă.
    final online = {
      for (final friend in state.friends)
        if (friend.isOnline) friend.userId,
    };
    state = state.copyWith(
      friends: friends
          .map((friend) => friend.copyWith(isOnline: online.contains(friend.userId)))
          .toList(growable: false),
    );
  }

  Future<void> _refreshConversations() async {
    final conversations = await _ref
        .read(socialRepositoryProvider)
        .fetchConversations();
    if (mounted) state = state.copyWith(conversations: conversations);
  }
}

final socialControllerProvider =
    StateNotifierProvider.autoDispose<SocialController, SocialState>((ref) {
      return SocialController(ref);
    });
