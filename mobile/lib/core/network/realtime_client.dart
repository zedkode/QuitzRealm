import 'dart:async';

import 'package:flutter_secure_storage/flutter_secure_storage.dart';
import 'package:socket_io_client/socket_io_client.dart' as io;

import '../../domain/duel/duel_events.dart';
import '../../domain/duel/match_preferences.dart';
import '../../domain/duel/territory_map.dart';
import '../../domain/question/quiz_question.dart';
import 'api_client.dart';

/// Singurul loc din aplicație care vorbește Socket.IO cu `backend/realtime`.
/// Traduce evenimentele brute în tipurile din `domain/duel`.
class RealtimeClient {
  RealtimeClient(this._baseUri, this._storage);

  final Uri _baseUri;
  final FlutterSecureStorage _storage;

  final _events = StreamController<DuelEvent>.broadcast();
  io.Socket? _socket;

  Stream<DuelEvent> get events => _events.stream;

  bool get isConnected => _socket?.connected ?? false;

  /// Deschide conexiunea autentificată. Fără token valid nu are rost să
  /// încercăm: serverul deconectează imediat.
  Future<bool> connect() async {
    final token = await _storage.read(key: ApiClient.accessTokenKey);
    if (token == null || token.isEmpty) return false;

    await disconnect();
    final socket = io.io(
      _baseUri.resolve('game').toString(),
      io.OptionBuilder()
          .setTransports(['websocket'])
          .disableAutoConnect()
          .setAuth({'token': token})
          .setReconnectionAttempts(5)
          .setReconnectionDelay(1000)
          .build(),
    );
    _socket = socket;
    _bind(socket);
    socket.connect();
    return true;
  }

  void _bind(io.Socket socket) {
    socket
      ..on('session:ready', (data) {
        final map = _asMap(data);
        final activeMatchId = map?['activeMatchId']?.toString();
        _emit(
          DuelSessionReady(
            map?['userId']?.toString() ?? '',
            activeMatchId: (activeMatchId?.isEmpty ?? true)
                ? null
                : activeMatchId,
          ),
        );
      })
      ..on('matchmaking:queued', (_) => _emit(const DuelQueued()))
      ..on('matchmaking:left', (_) => _emit(const DuelLeftQueue()))
      ..on('matchmaking:rejected', (data) {
        // Un motiv necunoscut (adăugat ulterior în server) e tratat ca
        // restricție de cont: nu inventăm o soluție pe care n-o știm.
        final reason = _asMap(data)?['reason']?.toString();
        _emit(
          DuelQueueRejected(
            reason == 'email_not_verified'
                ? DuelRejectionReason.emailNotVerified
                : DuelRejectionReason.accountRestricted,
          ),
        );
      })
      ..on('match:found', (data) {
        final map = _asMap(data);
        if (map == null) return;
        final players = map['players'];
        _emit(
          DuelMatchFound(
            matchId: map['matchId']?.toString() ?? '',
            totalRounds: _asInt(map['totalRounds']) ?? 1,
            playerIds: players is List
                ? players
                      .map((player) => _asMap(player)?['userId']?.toString())
                      .whereType<String>()
                      .toList(growable: false)
                : const [],
          ),
        );
      })
      ..on('round:started', (data) {
        final map = _asMap(data);
        final question = _asMap(map?['question']);
        final deadline = DateTime.tryParse(
          map?['deadlineAt']?.toString() ?? '',
        );
        if (map == null || question == null || deadline == null) return;
        _emit(
          DuelRoundStarted(
            matchId: map['matchId']?.toString() ?? '',
            roundNumber: _asInt(map['roundNumber']) ?? 1,
            totalRounds: _asInt(map['totalRounds']) ?? 1,
            deadline: deadline,
            question: _parseQuestion(question),
          ),
        );
      })
      ..on('round:answer-accepted', (_) => _emit(const DuelAnswerAccepted()))
      ..on('round:result', (data) {
        final map = _asMap(data);
        if (map == null) return;
        final players = map['players'];
        _emit(
          DuelRoundResult(
            roundNumber: _asInt(map['roundNumber']) ?? 1,
            totalRounds: _asInt(map['totalRounds']) ?? 1,
            correctAnswer: map['correctAnswer']?.toString() ?? '',
            players: players is List
                ? players
                      .map(_parsePlayerScore)
                      .whereType<DuelPlayerScore>()
                      .toList(growable: false)
                : const [],
            territory: _parseTerritory(map['territory']),
            eliminatedUserIds: map['eliminatedUserIds'] is List
                ? (map['eliminatedUserIds']! as List)
                      .map((id) => id.toString())
                      .toList(growable: false)
                : const [],
          ),
        );
      })
      ..on('match:finished', (data) {
        final map = _asMap(data);
        if (map == null) return;
        final players = map['players'];
        _emit(
          DuelMatchFinished(
            matchId: map['matchId']?.toString() ?? '',
            roundsPlayed: _asInt(map['roundsPlayed']) ?? 1,
            endedByForfeit: map['endedBy']?.toString() == 'forfeit',
            players: players is List
                ? players
                      .map(_parseFinalScore)
                      .whereType<DuelFinalScore>()
                      .toList(growable: false)
                : const [],
          ),
        );
      })
      ..on('match:paused', (data) {
        final map = _asMap(data);
        final resumeDeadline = DateTime.tryParse(
          map?['resumeDeadlineAt']?.toString() ?? '',
        );
        if (map == null || resumeDeadline == null) return;
        _emit(
          DuelMatchPaused(
            disconnectedUserId: map['disconnectedUserId']?.toString() ?? '',
            resumeDeadline: resumeDeadline,
          ),
        );
      })
      ..on('match:resumed', (data) {
        final map = _asMap(data);
        final deadline = DateTime.tryParse(
          map?['deadlineAt']?.toString() ?? '',
        );
        if (map == null || deadline == null) return;
        _emit(
          DuelMatchResumed(
            reconnectedUserId: map['reconnectedUserId']?.toString() ?? '',
            deadline: deadline,
          ),
        );
      })
      ..on('match:state', (data) {
        final map = _asMap(data);
        final question = _asMap(map?['question']);
        final deadline = DateTime.tryParse(
          map?['deadlineAt']?.toString() ?? '',
        );
        if (map == null || question == null || deadline == null) return;
        final players = map['players'];
        _emit(
          DuelMatchSnapshot(
            matchId: map['matchId']?.toString() ?? '',
            isPaused: map['status']?.toString() == 'paused',
            roundNumber: _asInt(map['roundNumber']) ?? 1,
            totalRounds: _asInt(map['totalRounds']) ?? 1,
            deadline: deadline,
            resumeDeadline: DateTime.tryParse(
              map['resumeDeadlineAt']?.toString() ?? '',
            ),
            question: _parseQuestion(question),
            players: players is List
                ? players
                      .map(_parsePlayerSnapshot)
                      .whereType<DuelPlayerSnapshot>()
                      .toList(growable: false)
                : const [],
            territoryMap: _asMap(map['territoryMap']) == null
                ? null
                : TerritoryMap.fromJson(_asMap(map['territoryMap'])!),
            territory: _parseTerritory(map['territory']),
          ),
        );
      })
      ..on('chat:match:history', (data) {
        final map = _asMap(data);
        if (map == null) return;
        final messages = map['messages'];
        _emit(
          DuelMatchChatHistory(
            matchId: map['matchId']?.toString() ?? '',
            canSendText: map['access']?.toString() == 'text',
            messages: messages is List
                ? messages
                      .map(_parseChatMessage)
                      .whereType<DuelChatMessage>()
                      .toList(growable: false)
                : const [],
          ),
        );
      })
      ..on('chat:match:message', (data) {
        final message = _parseChatMessage(data);
        if (message != null) _emit(DuelMatchChatMessageReceived(message));
      })
      ..on('chat:rejected', (data) {
        final map = _asMap(data);
        if (map?['scope']?.toString() != 'match') return;
        _emit(
          DuelMatchChatRejected(
            matchId: map?['matchId']?.toString() ?? '',
            reason: map?['reason']?.toString() ?? 'invalid',
          ),
        );
      })
      ..on('match:error', (data) => _emitError(data))
      ..on('server:error', (data) => _emitError(data))
      ..on('connect_error', (_) => _emit(const DuelDisconnected()))
      ..onDisconnect((_) => _emit(const DuelDisconnected()));
  }

  /// Intră în coada de matchmaking cu preferințele jucătorului.
  ///
  /// Categoriile lipsesc din mesaj când lista e goală: pe server, absența
  /// preferinței înseamnă „accept orice", iar o listă goală trimisă explicit ar
  /// fi doar zgomot în validare.
  void joinQueue([MatchPreferences preferences = MatchPreferences.defaults]) {
    _socket?.emit('matchmaking:join', {
      'mode': preferences.mode.wireValue,
      if (preferences.categoryCodes.isNotEmpty)
        'categoryCodes': preferences.categoryCodes,
      if (preferences.playerCount != null)
        'playerCount': preferences.playerCount,
    });
  }

  /// Citește blocul de teritorii dintr-un mesaj. `null` la Duo, unde lipsește.
  TerritoryOwnership? _parseTerritory(Object? raw) {
    final map = _asMap(raw);
    if (map == null) return null;
    return TerritoryOwnership.fromJson(map);
  }

  void leaveQueue() => _socket?.emit('matchmaking:leave');

  void sendAnswer({required String matchId, required String answer}) {
    _socket?.emit('round:answer', {'matchId': matchId, 'answer': answer});
  }

  void joinMatchChat(String matchId) {
    _socket?.emit('chat:match:join', {'matchId': matchId});
  }

  void sendMatchChat({required String matchId, required String content}) {
    _socket?.emit('chat:match:send', {'matchId': matchId, 'content': content});
  }

  void sendMatchReaction({required String matchId, required String reaction}) {
    _socket?.emit('chat:match:react', {
      'matchId': matchId,
      'reaction': reaction,
    });
  }

  Future<void> disconnect() async {
    final socket = _socket;
    _socket = null;
    if (socket == null) return;
    socket
      ..clearListeners()
      ..disconnect()
      ..dispose();
  }

  Future<void> dispose() async {
    await disconnect();
    await _events.close();
  }

  void _emit(DuelEvent event) {
    if (!_events.isClosed) _events.add(event);
  }

  void _emitError(Object? data) {
    final map = _asMap(data);
    _emit(DuelServerError(map?['message']?.toString() ?? ''));
  }

  QuizQuestion _parseQuestion(Map<String, Object?> json) {
    final options = json['options'];
    return QuizQuestion(
      id: json['id']?.toString() ?? '',
      type: json['type']?.toString() == 'NUMERIC'
          ? QuizQuestionType.numeric
          : QuizQuestionType.multipleChoice,
      categoryId: json['categoryId']?.toString() ?? '',
      difficulty: _asInt(json['difficulty']) ?? 1,
      text: json['text']?.toString() ?? '',
      options: options is List
          ? options.map((option) => option.toString()).toList(growable: false)
          : const [],
    );
  }

  DuelPlayerScore? _parsePlayerScore(Object? value) {
    final map = _asMap(value);
    if (map == null) return null;
    return DuelPlayerScore(
      userId: map['userId']?.toString() ?? '',
      score: _asInt(map['score']) ?? 0,
      territoriesWon: _asInt(map['territoriesWon']) ?? 0,
      isCorrect: map['isCorrect'] == true,
      answer: map['answer']?.toString(),
      responseTimeMs: _asInt(map['responseTimeMs']),
    );
  }

  DuelPlayerSnapshot? _parsePlayerSnapshot(Object? value) {
    final map = _asMap(value);
    if (map == null) return null;
    return DuelPlayerSnapshot(
      userId: map['userId']?.toString() ?? '',
      score: _asInt(map['score']) ?? 0,
      territoriesWon: _asInt(map['territoriesWon']) ?? 0,
      hasAnswered: map['hasAnswered'] == true,
      connected: map['connected'] != false,
    );
  }

  DuelFinalScore? _parseFinalScore(Object? value) {
    final map = _asMap(value);
    if (map == null) return null;
    return DuelFinalScore(
      userId: map['userId']?.toString() ?? '',
      score: _asInt(map['score']) ?? 0,
      territoriesWon: _asInt(map['territoriesWon']) ?? 0,
      outcome: switch (map['result']?.toString()) {
        'WIN' => DuelOutcome.win,
        'LOSS' => DuelOutcome.loss,
        _ => DuelOutcome.draw,
      },
    );
  }

  DuelChatMessage? _parseChatMessage(Object? value) {
    final map = _asMap(value);
    if (map == null) return null;
    final createdAt = DateTime.tryParse(map['createdAt']?.toString() ?? '');
    if (createdAt == null) return null;
    return DuelChatMessage(
      id: map['id']?.toString() ?? '',
      matchId: map['matchId']?.toString() ?? '',
      senderId: map['senderId']?.toString() ?? '',
      senderName: map['senderName']?.toString() ?? '',
      content: map['content']?.toString() ?? '',
      kind: map['kind']?.toString() == 'reaction'
          ? DuelChatMessageKind.reaction
          : DuelChatMessageKind.text,
      createdAt: createdAt,
    );
  }

  Map<String, Object?>? _asMap(Object? value) {
    if (value is Map<String, Object?>) return value;
    if (value is Map) return value.map((key, v) => MapEntry(key.toString(), v));
    return null;
  }

  int? _asInt(Object? value) {
    if (value is int) return value;
    if (value is num) return value.round();
    return int.tryParse(value?.toString() ?? '');
  }
}
