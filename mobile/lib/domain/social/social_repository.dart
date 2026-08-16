import 'social_models.dart';

/// Accesul la partea socială a jocului (`owner-plan.md` §2).
///
/// Toate deciziile — cine poate scrie, cui, ce treaptă are — se iau pe server.
/// Interfața asta doar transportă rezultatul lor.
abstract class SocialRepository {
  Future<List<Friend>> fetchFriends();

  /// Trimite o cerere după handle. Dacă celălalt ne-a cerut deja prietenia,
  /// serverul o transformă direct în acceptare.
  Future<Friend> requestFriendship(String username);

  Future<Friend> respondToRequest(String friendshipId, {required bool accept});

  Future<void> removeFriend(String userId);

  Future<void> blockUser(String userId);

  Future<void> unblockUser(String userId);

  /// Jucători întâlniți recent; API-ul îi întoarce numai când ambele conturi au
  /// consimțit explicit să participe la sugestii.
  Future<FriendSuggestionFeed> fetchFriendSuggestions();

  Future<bool> updateFriendSuggestionsEnabled(bool enabled);

  Future<List<Conversation>> fetchConversations();

  /// Deschide (sau regăsește) firul 1:1 cu un jucător. Poate eșua dacă treapta
  /// de încredere sau setările destinatarului nu permit un mesaj direct.
  Future<Conversation> openConversation(String userId);

  Future<Conversation> acceptConversation(String conversationId);

  Future<List<ChatMessage>> fetchMessages(
    String conversationId, {
    DateTime? before,
  });

  Future<ChatMessage> sendMessage(String conversationId, String content);

  Future<TrustInfo> fetchTrust();

  Future<PrivacySettings> fetchPrivacy();

  Future<PrivacySettings> updateDmPermission(DmPermission permission);

  /// Raportează un mesaj. `contentSnapshot` e necesar doar pentru chatul
  /// global, care nu se persistă.
  Future<void> reportMessage({
    required String reportedUserId,
    required String reason,
    required String scope,
    String? messageId,
    String? contentSnapshot,
  });
}
