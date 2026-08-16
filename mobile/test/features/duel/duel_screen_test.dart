import 'package:flutter/material.dart';
import 'package:flutter_riverpod/flutter_riverpod.dart';
import 'package:flutter_test/flutter_test.dart';
import 'package:quiz_realm/core/providers/repository_providers.dart';
import 'package:quiz_realm/domain/duel/duel_events.dart';
import 'package:quiz_realm/domain/question/quiz_question.dart';
import 'package:quiz_realm/features/duel/duel_screen.dart';
import 'package:quiz_realm/l10n/app_localizations.dart';

import '../../support/fake_realtime_client.dart';

Future<void> _pumpDuel(
  WidgetTester tester,
  FakeRealtimeClient client, {
  Size size = const Size(430, 1000),
}) async {
  tester.view
    ..physicalSize = size
    ..devicePixelRatio = 1;
  addTearDown(tester.view.reset);

  await tester.pumpWidget(
    ProviderScope(
      overrides: [realtimeClientProvider.overrideWithValue(client)],
      child: MaterialApp(
        locale: const Locale('ro'),
        localizationsDelegates: AppLocalizations.localizationsDelegates,
        supportedLocales: AppLocalizations.supportedLocales,
        home: const DuelScreen(),
      ),
    ),
  );
  await tester.pump();
  await tester.pump();
}

void main() {
  testWidgets('fără cont, ecranul cere autentificare', (tester) async {
    await _pumpDuel(tester, FakeRealtimeClient(connectResult: false));

    expect(find.text('Duelul cere un cont'), findsOneWidget);
    expect(tester.takeException(), isNull);
  });

  testWidgets('cât se caută adversar, se vede starea de căutare', (
    tester,
  ) async {
    final client = FakeRealtimeClient();
    await _pumpDuel(tester, client);

    client.emit(const DuelSessionReady('me'));
    await tester.pump();
    await tester.pump(const Duration(milliseconds: 300));

    expect(find.byKey(const Key('duel-searching')), findsOneWidget);
    expect(client.joinedQueue, isTrue);
  });

  testWidgets('runda afișează tabela, întrebarea și variantele', (
    tester,
  ) async {
    final client = FakeRealtimeClient();
    await _pumpDuel(tester, client);

    client.emitMatchStart();
    await tester.pump();
    await tester.pump(const Duration(milliseconds: 300));

    expect(find.byKey(const Key('duel-scoreboard')), findsOneWidget);
    expect(find.byKey(const Key('duel-question-text')), findsOneWidget);
    expect(find.text('Întrebarea rundei 1?'), findsOneWidget);
    expect(find.byKey(const Key('duel-option-0')), findsOneWidget);
    expect(find.text('Runda 1 din 3'), findsOneWidget);
  });

  testWidgets('după răspuns se așteaptă adversarul', (tester) async {
    final client = FakeRealtimeClient();
    await _pumpDuel(tester, client);

    client.emitMatchStart();
    await tester.pump();
    await tester.pump(const Duration(milliseconds: 300));

    await tester.tap(find.byKey(const Key('duel-option-0')));
    await tester.pump();
    await tester.pump(const Duration(milliseconds: 300));

    expect(find.byKey(const Key('duel-waiting')), findsOneWidget);
    expect(client.sentAnswers.single.answer, 'Alfa');
  });

  testWidgets('verdictul arată răspunsurile ambilor jucători', (tester) async {
    final client = FakeRealtimeClient();
    await _pumpDuel(tester, client);

    client.emitMatchStart();
    await tester.pump();
    client.emitRoundResult();
    await tester.pump();
    await tester.pump(const Duration(milliseconds: 300));

    expect(find.byKey(const Key('duel-verdict')), findsOneWidget);
    expect(find.text('Ai cucerit teritoriul!'), findsOneWidget);
    expect(find.textContaining('Alfa'), findsWidgets);
    expect(find.text('Beta'), findsWidgets);
  });

  testWidgets('finalul arată rezultatul și oferă un nou duel', (tester) async {
    final client = FakeRealtimeClient();
    await _pumpDuel(tester, client);

    client.emitMatchStart();
    await tester.pump();
    client.emitFinished();
    await tester.pump();
    await tester.pump(const Duration(milliseconds: 300));

    expect(find.byKey(const Key('duel-outcome')), findsOneWidget);
    expect(find.text('Victorie'), findsOneWidget);
    expect(find.byKey(const Key('duel-rematch')), findsOneWidget);
  });

  testWidgets('întrebarea numerică oferă câmp de estimare', (tester) async {
    final client = FakeRealtimeClient();
    await _pumpDuel(tester, client);

    client.emitMatchStart(type: QuizQuestionType.numeric);
    await tester.pump();
    await tester.pump(const Duration(milliseconds: 300));

    expect(find.byKey(const Key('duel-numeric')), findsOneWidget);
    await tester.enterText(find.byKey(const Key('duel-numeric')), '42');
    await tester.tap(find.byKey(const Key('duel-submit-numeric')));
    await tester.pump();

    expect(client.sentAnswers.single.answer, '42');
  });

  testWidgets(
    'pierderea conexiunii în afara unei partide permite reîncercarea',
    (tester) async {
      final client = FakeRealtimeClient();
      await _pumpDuel(tester, client);

      client.emit(const DuelSessionReady('me'));
      await tester.pump();
      client.emit(const DuelDisconnected());
      await tester.pump();
      await tester.pump(const Duration(milliseconds: 300));

      expect(find.text('Conexiunea s-a pierdut'), findsOneWidget);
    },
  );

  testWidgets(
    'pierderea conexiunii în partidă anunță reconectarea, nu înfrângerea',
    (tester) async {
      final client = FakeRealtimeClient();
      await _pumpDuel(tester, client);

      client.emitMatchStart();
      await tester.pump();
      client.emit(const DuelDisconnected());
      await tester.pump();
      await tester.pump(const Duration(milliseconds: 300));

      expect(find.byKey(const Key('duel-reconnecting')), findsOneWidget);
      expect(find.text('Conexiunea s-a pierdut'), findsNothing);
    },
  );

  testWidgets(
    'plecarea adversarului îngheață runda și arată timpul de revenire',
    (tester) async {
      final client = FakeRealtimeClient();
      await _pumpDuel(tester, client);

      client.emitMatchStart();
      await tester.pump();
      client.emit(
        DuelMatchPaused(
          disconnectedUserId: 'rival',
          resumeDeadline: DateTime.now().add(const Duration(seconds: 40)),
        ),
      );
      await tester.pump();
      await tester.pump(const Duration(milliseconds: 300));

      expect(find.byKey(const Key('duel-opponent-away')), findsOneWidget);
      expect(find.text('Adversarul a pierdut legătura'), findsOneWidget);

      // Cât e pauză, răspunsul nu pleacă spre server.
      await tester.tap(find.byKey(const Key('duel-option-0')));
      await tester.pump();
      expect(client.sentAnswers, isEmpty);
    },
  );

  testWidgets('instantaneul de reconectare readuce scorul și runda', (
    tester,
  ) async {
    final client = FakeRealtimeClient();
    await _pumpDuel(tester, client);

    client.emitMatchStart();
    await tester.pump();
    client.emit(const DuelDisconnected());
    await tester.pump();

    client.emit(
      DuelMatchSnapshot(
        matchId: 'match-1',
        isPaused: false,
        roundNumber: 2,
        totalRounds: 3,
        deadline: DateTime.now().add(const Duration(seconds: 9)),
        question: const QuizQuestion(
          id: 'q2',
          type: QuizQuestionType.multipleChoice,
          categoryId: 'cat',
          difficulty: 1,
          text: 'Întrebarea rundei 2?',
          options: ['A', 'B', 'C', 'D'],
        ),
        players: const [
          DuelPlayerSnapshot(
            userId: 'me',
            score: 1,
            territoriesWon: 1,
            hasAnswered: false,
            connected: true,
          ),
          DuelPlayerSnapshot(
            userId: 'rival',
            score: 0,
            territoriesWon: 0,
            hasAnswered: true,
            connected: true,
          ),
        ],
      ),
    );
    await tester.pump();
    await tester.pump(const Duration(milliseconds: 300));

    expect(find.byKey(const Key('duel-reconnecting')), findsNothing);
    expect(find.text('Întrebarea rundei 2?'), findsOneWidget);
    expect(find.text('Runda 2 din 3'), findsOneWidget);
    // Scorul acumulat înainte de deconectare nu se pierde.
    expect(find.byKey(const Key('duel-scoreboard')), findsOneWidget);

    // Se poate juca mai departe imediat.
    await tester.tap(find.byKey(const Key('duel-option-0')));
    await tester.pump();
    expect(client.sentAnswers.single.answer, 'A');
  });
  testWidgets('emailul neconfirmat oprește căutarea și oferă retrimiterea', (
    tester,
  ) async {
    final client = FakeRealtimeClient();
    await _pumpDuel(tester, client);

    client.emit(const DuelSessionReady('me'));
    await tester.pump();
    client.emit(const DuelQueueRejected(DuelRejectionReason.emailNotVerified));
    await tester.pump();
    await tester.pump(const Duration(milliseconds: 300));

    // Nu mai „caută adversar” la nesfârșit: nu e nimeni de găsit.
    expect(find.byKey(const Key('duel-searching')), findsNothing);
    expect(find.byKey(const Key('duel-verify-email')), findsOneWidget);
    expect(find.text('Confirmă-ți adresa de email'), findsOneWidget);
    expect(find.text('Retrimite linkul'), findsOneWidget);
  });

  testWidgets('chatul de luptă trimite reacții și text permis de server', (
    tester,
  ) async {
    final client = FakeRealtimeClient();
    await _pumpDuel(tester, client);

    client.emitMatchStart();
    await tester.pump();
    client.emit(
      DuelMatchChatHistory(
        matchId: 'match-1',
        canSendText: true,
        messages: [
          DuelChatMessage(
            id: 'msg-1',
            matchId: 'match-1',
            senderId: 'rival',
            senderName: 'Rivalul',
            content: 'well_played',
            kind: DuelChatMessageKind.reaction,
            createdAt: DateTime.now(),
          ),
        ],
      ),
    );
    await tester.pump(const Duration(milliseconds: 300));

    await tester.tap(find.byKey(const Key('duel-chat-open')));
    await tester.pump();
    await tester.pump(const Duration(milliseconds: 300));
    expect(find.byKey(const Key('duel-match-chat')), findsOneWidget);
    expect(find.byKey(const Key('duel-chat-message-msg-1')), findsOneWidget);

    await tester.tap(find.byKey(const Key('duel-reaction-good-luck')));
    expect(client.sentReactions.single.reaction, 'good_luck');

    await tester.enterText(find.byKey(const Key('duel-chat-input')), 'Salut!');
    await tester.tap(find.byKey(const Key('duel-chat-send')));
    expect(client.sentChatMessages.single.content, 'Salut!');
  });
}
