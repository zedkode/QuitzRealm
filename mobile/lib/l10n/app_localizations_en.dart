// ignore: unused_import
import 'package:intl/intl.dart' as intl;

import 'app_localizations.dart';

// ignore_for_file: type=lint

/// The translations for English (`en`).
class AppLocalizationsEn extends AppLocalizations {
  AppLocalizationsEn([String locale = 'en']) : super(locale);

  @override
  String get appTitle => 'QuizRealm';

  @override
  String get appTagline => 'Know. Conquer. Reign.';

  @override
  String get menuStartCampaign => 'Start the campaign';

  @override
  String get menuContinueCampaign => 'Continue the campaign';

  @override
  String get menuAccount => 'Player account';

  @override
  String get menuHowToPlay => 'How to play';

  @override
  String get menuTapToEnter => 'Touch the seal to enter';

  @override
  String get howToPlayTitle => 'Laws of the realm';

  @override
  String get howToPlayRuleQuestions =>
      'Every assault mixes multiple-choice and numeric questions, against the clock.';

  @override
  String get howToPlayRuleStreak =>
      'Consecutive correct answers raise your streak multiplier up to ×3.';

  @override
  String get howToPlayRuleStars =>
      'A flawless assault earns 3 stars. Stars unlock new realms.';

  @override
  String get howToPlayRuleOffline =>
      'The campaign runs offline, from the verified packs shipped with the game.';

  @override
  String get close => 'Got it';

  @override
  String get worldMapEyebrow => 'MAP OF THE REALM';

  @override
  String get worldMapTitle => 'Choose your realm';

  @override
  String get worldMapHint => 'Tap an unlocked realm to open its assaults.';

  @override
  String levelBadge(int level) {
    return 'Level $level';
  }

  @override
  String xpProgress(int current, int total) {
    return '$current / $total XP';
  }

  @override
  String starsCollected(int earned, int total) {
    return '$earned of $total stars';
  }

  @override
  String starsShort(int earned, int total) {
    return '$earned/$total';
  }

  @override
  String chapterLockedHint(int stars) {
    return 'Unlocks at $stars stars';
  }

  @override
  String chapterLockedSemantics(String chapter, int stars) {
    return '$chapter, locked, needs $stars stars';
  }

  @override
  String chapterOpenSemantics(String chapter, int earned, int total) {
    return '$chapter, $earned of $total stars';
  }

  @override
  String get chapterIstorie => 'Keep of Chronicles';

  @override
  String get chapterRomania => 'Carpathian Throne';

  @override
  String get chapterGeografie => 'Port of Seven Seas';

  @override
  String get chapterStiinta => 'Crystal Academy';

  @override
  String get chapterSport => 'Tourney Fields';

  @override
  String get chapterTehnologie => 'Brass Observatory';

  @override
  String get chapterLiteratura => 'Hermitage of Manuscripts';

  @override
  String get chapterArte => 'Bay of Masks';

  @override
  String get chapterMituri => 'Isle of Wraiths';

  @override
  String get subjectIstorie => 'History';

  @override
  String get subjectRomania => 'Romania';

  @override
  String get subjectGeografie => 'Geography';

  @override
  String get subjectStiinta => 'Science';

  @override
  String get subjectSport => 'Sport';

  @override
  String get subjectTehnologie => 'Technology';

  @override
  String get subjectLiteratura => 'Literature';

  @override
  String get subjectArte => 'Film and music';

  @override
  String get subjectMituri => 'Myths and legends';

  @override
  String get stageOutpost => 'The Outpost';

  @override
  String get stageCitadel => 'The Citadel';

  @override
  String get stageThrone => 'The Throne Hall';

  @override
  String stageNumber(int index) {
    return 'Assault $index';
  }

  @override
  String stageSummary(int questions, int seconds) {
    return '$questions questions • $seconds seconds each';
  }

  @override
  String get stageLockedHint => 'Earn a star in the previous assault';

  @override
  String get chooseStage => 'Choose the assault';

  @override
  String get startStage => 'Begin the assault';

  @override
  String battleHeader(String chapter, String stage) {
    return '$chapter • $stage';
  }

  @override
  String get hudScore => 'SCORE';

  @override
  String get hudRound => 'ROUND';

  @override
  String get hudStreak => 'STREAK';

  @override
  String roundCounter(int current, int total) {
    return '$current/$total';
  }

  @override
  String streakMultiplier(String multiplier) {
    return '×$multiplier';
  }

  @override
  String timerSemantics(int seconds) {
    return '$seconds seconds left';
  }

  @override
  String get questionLoading => 'Preparing the assault…';

  @override
  String get questionErrorTitle => 'The assault could not start';

  @override
  String get noQuestionsTitle => 'This realm has no questions';

  @override
  String get noQuestionsBody =>
      'The realm\'s pack could not be read. We never fight with unverified questions.';

  @override
  String get retry => 'Try again';

  @override
  String difficulty(int level) {
    return 'Difficulty $level/5';
  }

  @override
  String get categoryFallback => 'Realm archives';

  @override
  String get numericHint => 'Type your estimate';

  @override
  String get submitAnswer => 'Confirm answer';

  @override
  String answerOptionSemantics(String letter, String answer) {
    return 'Option $letter: $answer';
  }

  @override
  String get correctTitle => 'Direct hit!';

  @override
  String get incorrectTitle => 'Attack repelled';

  @override
  String get timeoutTitle => 'Time is up';

  @override
  String correctAnswerLabel(String answer) {
    return 'Correct answer: $answer';
  }

  @override
  String pointsAwarded(int points) {
    return '+$points';
  }

  @override
  String get nextQuestion => 'Next question';

  @override
  String get finishRound => 'See the result';

  @override
  String get answerSubmitError =>
      'The verdict could not be obtained. Your attack is kept.';

  @override
  String get retryAnswer => 'Send the attack again';

  @override
  String get leaveBattleTitle => 'Abandon the assault?';

  @override
  String get leaveBattleBody =>
      'This assault\'s progress is lost and the realm stays unconquered.';

  @override
  String get leaveBattleConfirm => 'Abandon';

  @override
  String get leaveBattleCancel => 'Keep fighting';

  @override
  String get resultVictoryTitle => 'Realm conquered';

  @override
  String get resultDefeatTitle => 'Assault repelled';

  @override
  String resultVictoryBody(String chapter) {
    return 'Your banner flies over $chapter.';
  }

  @override
  String get resultDefeatBody => 'The walls held. Return when you are ready.';

  @override
  String get resultScoreLabel => 'SCORE';

  @override
  String get resultAnswersLabel => 'CORRECT';

  @override
  String get resultStreakLabel => 'BEST STREAK';

  @override
  String resultAnswers(int correct, int total) {
    return '$correct/$total';
  }

  @override
  String resultXpGained(int xp) {
    return '+$xp XP';
  }

  @override
  String resultLevelUp(int level) {
    return 'New level: $level!';
  }

  @override
  String get resultChapterCleared => 'You have conquered the whole realm!';

  @override
  String get actionRetryStage => 'Retry the assault';

  @override
  String get actionNextStage => 'Next assault';

  @override
  String get actionBackToMap => 'Back to the map';

  @override
  String starsSemantics(int earned, int total) {
    return '$earned of $total stars';
  }

  @override
  String get menuDuel => 'Online duel';

  @override
  String get menuLeaderboard => 'Leaderboard';

  @override
  String get leaderboardTitle => 'Realm leaderboard';

  @override
  String leaderboardPlayerCount(int total) {
    return '$total ranked players';
  }

  @override
  String get leaderboardEmpty =>
      'Nobody is ranked yet. Play a duel to open the leaderboard.';

  @override
  String get leaderboardYourPlace => 'YOUR PLACE';

  @override
  String leaderboardPositionLine(int position, int matches) {
    return 'Place $position • $matches matches';
  }

  @override
  String leaderboardRowSemantics(int position, String username, String rank) {
    return 'Place $position, $username, $rank';
  }

  @override
  String get leaderboardErrorTitle => 'The leaderboard could not be read';

  @override
  String get leaderboardErrorBody =>
      'The server is not responding. The leaderboard needs a connection.';

  @override
  String rankSemantics(String rank, int elo) {
    return 'Rank $rank, $elo points';
  }

  @override
  String rankToNext(int points) {
    return '$points more points to the next tier';
  }

  @override
  String get rankTopReached => 'You have reached the realm\'s highest tier';

  @override
  String duelRankUpdated(String rank) {
    return 'Rank: $rank';
  }

  @override
  String get duelTitle => '1v1 duel';

  @override
  String get duelConnecting => 'Connecting to the realm…';

  @override
  String get duelSearching => 'Looking for an opponent';

  @override
  String get duelSearchingHint =>
      'Stay tuned: the first round starts as soon as an opponent is found.';

  @override
  String get duelCancelSearch => 'Cancel the search';

  @override
  String get duelNeedAccountTitle => 'The duel needs an account';

  @override
  String get duelNeedAccountBody =>
      'Online matches are played signed in, so results can count towards the leaderboard.';

  @override
  String get duelGoToAccount => 'Open the account';

  @override
  String duelRoundCounter(int current, int total) {
    return 'Round $current of $total';
  }

  @override
  String get duelYou => 'YOU';

  @override
  String get duelOpponent => 'OPPONENT';

  @override
  String get duelWaitingOpponent => 'The opponent is still answering…';

  @override
  String get duelAnswerSent => 'Attack sent';

  @override
  String get duelRoundWon => 'You took the territory!';

  @override
  String get duelRoundLost => 'The territory was lost';

  @override
  String get duelRoundNeutral => 'No territory taken';

  @override
  String get duelNextRound => 'The next round is starting…';

  @override
  String get duelNoAnswer => 'no answer';

  @override
  String get duelVictory => 'Victory';

  @override
  String get duelDefeat => 'Defeat';

  @override
  String get duelDraw => 'Draw';

  @override
  String duelFinalLine(int score, int territories) {
    return '$score points • $territories territories';
  }

  @override
  String get duelRematch => 'Find another duel';

  @override
  String get duelLeave => 'Leave the duel';

  @override
  String get duelDisconnectedTitle => 'Connection lost';

  @override
  String get duelDisconnectedBody =>
      'The match server stopped responding. You can try again.';

  @override
  String get duelServerErrorTitle => 'The match was stopped';

  @override
  String get duelVerifyEmailTitle => 'Confirm your email address';

  @override
  String get duelVerifyEmailBody =>
      'Ranked duels require a verified account. Open the link we emailed you, then try again.';

  @override
  String get duelVerifyEmailAction => 'Resend the link';

  @override
  String get duelVerifyEmailSending => 'Sending…';

  @override
  String get duelVerifyEmailSent => 'We sent you a new confirmation link.';

  @override
  String get duelVerifyEmailFailed =>
      'We couldn\'t send the email. Try again later.';

  @override
  String get duelAccountRestrictedTitle => 'Restricted account';

  @override
  String get duelAccountRestrictedBody =>
      'Your account can\'t join ranked duels right now.';

  @override
  String get duelReconnectingTitle => 'Reconnecting you to the match';

  @override
  String get duelReconnectingBody =>
      'Your seat is being held. Stay put for a few seconds.';

  @override
  String get duelOpponentAwayTitle => 'The opponent lost connection';

  @override
  String duelOpponentAwayBody(int seconds) {
    String _temp0 = intl.Intl.pluralLogic(
      seconds,
      locale: localeName,
      other: '$seconds seconds left to come back.',
      one: 'One second left to come back.',
    );
    return '$_temp0';
  }

  @override
  String get duelOpponentAwayExpired =>
      'The return window expired. The match is closing.';

  @override
  String get duelWonByForfeit => 'The opponent never came back to the match.';

  @override
  String get matchChatOpen => 'Open battle chat';

  @override
  String get matchChatTitle => 'Battle chronicle';

  @override
  String get matchChatEphemeral =>
      'Messages from this match vanish after the battle.';

  @override
  String get matchChatEmpty =>
      'The scroll is empty. Send your opponent a reaction.';

  @override
  String get matchChatReactions => 'QUICK REACTIONS';

  @override
  String get matchReactionGoodLuck => 'Good luck!';

  @override
  String get matchReactionNiceMove => 'Nice move!';

  @override
  String get matchReactionWow => 'Wow!';

  @override
  String get matchReactionWellPlayed => 'Well played!';

  @override
  String get matchChatHint => 'Write a battle message…';

  @override
  String get matchChatSend => 'Send message';

  @override
  String get matchChatTextLocked =>
      'Free text unlocks after 10 correct answers. Reactions remain available.';

  @override
  String get matchChatMuted => 'Your chat is temporarily restricted.';

  @override
  String get matchChatTooFast => 'Too many messages. Wait a few seconds.';

  @override
  String get matchChatLinksLocked => 'Links unlock at a higher trust tier.';

  @override
  String get matchChatClosed => 'This match chat has closed.';

  @override
  String get matchChatInvalid => 'The message could not be sent.';

  @override
  String get loginEyebrow => 'PLAYER ACCOUNT';

  @override
  String get loginTitle => 'Keep your conquests on every device.';

  @override
  String get accountOptionalNote =>
      'The account is optional — the campaign plays without it.';

  @override
  String get emailLabel => 'Email';

  @override
  String get passwordLabel => 'Password';

  @override
  String get usernameLabel => 'Player name';

  @override
  String get loginButton => 'Enter the realm';

  @override
  String get createAccountButton => 'Create account';

  @override
  String get switchToRegister => 'No account? Create one';

  @override
  String get switchToLogin => 'Already have an account? Sign in';

  @override
  String get authGenericError =>
      'Sign-in failed. Check your details and connection.';

  @override
  String get fieldRequired => 'This field is required.';

  @override
  String get passwordHint => 'At least 10 characters';

  @override
  String get birthDateLabel => 'Date of birth';

  @override
  String get birthDatePick => 'Pick a date';

  @override
  String get birthDateHint => 'We make sure the game fits your age.';

  @override
  String birthDateTooYoung(int years) {
    return 'You must be at least $years to create an account.';
  }

  @override
  String get logout => 'Sign out';

  @override
  String get backLabel => 'Back';

  @override
  String get socialTitle => 'Friends and messages';

  @override
  String get socialTabFriends => 'Friends';

  @override
  String get socialTabMessages => 'Messages';

  @override
  String get socialNeedAccountTitle => 'Social features need an account';

  @override
  String get socialNeedAccountBody =>
      'Sign in to have friends, conversations and chat.';

  @override
  String get socialErrorTitle => 'We couldn\'t load the social section';

  @override
  String get friendsAddHint => 'Username';

  @override
  String get friendsAddAction => 'Send request';

  @override
  String get friendsIncomingRequests => 'Incoming requests';

  @override
  String get friendsOutgoingRequests => 'Sent requests';

  @override
  String get friendsRequestSent => 'Pending';

  @override
  String get friendsListTitle => 'Your friends';

  @override
  String get friendsEmpty => 'No friends yet. Search for someone by username.';

  @override
  String get friendsAccept => 'Accept';

  @override
  String get friendsDecline => 'Decline';

  @override
  String get friendsOpenChat => 'Open conversation';

  @override
  String get friendsBlock => 'Block';

  @override
  String get friendsBlockTitle => 'Block this player?';

  @override
  String friendsBlockBody(String name) {
    return '$name won\'t be able to message you, and the friendship ends.';
  }

  @override
  String get conversationsTitle => 'Conversations';

  @override
  String get conversationsEmpty => 'No conversations yet.';

  @override
  String get conversationEmpty => 'Write the first message.';

  @override
  String get messageRequestsTitle => 'Message requests';

  @override
  String get messageRequestsExplainer =>
      'Someone who isn\'t your friend wants to message you. Accept only if you want to continue.';

  @override
  String get messageRequestAccept => 'Accept request';

  @override
  String get chatComposerHint => 'Write a message…';

  @override
  String get chatSend => 'Send';

  @override
  String get chatMutedNotice =>
      'Your chat is temporarily paused because of repeated messages.';

  @override
  String get chatReportTitle => 'Report message';

  @override
  String get chatReportHint => 'What\'s wrong?';

  @override
  String get chatReportSend => 'Send report';

  @override
  String get chatReportSent => 'Report sent.';

  @override
  String get privacyTitle => 'Privacy';

  @override
  String get privacyDmTitle => 'Who can message you directly';

  @override
  String get privacyDmLocked =>
      'Minor accounts receive direct messages from friends only.';

  @override
  String get privacyDmEveryone => 'Anyone';

  @override
  String get privacyDmFriends => 'Friends only';

  @override
  String get privacyDmNobody => 'Nobody';

  @override
  String trustCorrectAnswers(int count) {
    return '$count correct';
  }

  @override
  String trustAnswersToNextTier(int count) {
    return '$count more correct answers to the next tier.';
  }

  @override
  String get trustMaxTier => 'You\'ve reached the highest trust tier.';

  @override
  String get trustTierNewcomer => 'Newcomer';

  @override
  String get trustTierApprentice => 'Apprentice';

  @override
  String get trustTierContributor => 'Contributor';

  @override
  String get trustTierEstablished => 'Established';

  @override
  String get trustTierExperienced => 'Experienced';

  @override
  String get trustTierExpert => 'Expert';

  @override
  String get trustTierCommunityMaster => 'Community master';

  @override
  String get trustTierElite => 'Elite';

  @override
  String get trustTierCommunityLegend => 'Community legend';

  @override
  String get homeGuestTitle => 'Playing without an account';

  @override
  String get homeGuestAction => 'Create account';

  @override
  String get homeLoadingProfile => 'Loading profile…';

  @override
  String homeCoins(int count) {
    return '$count coins';
  }

  @override
  String get homeContinueEyebrow => 'Continue the conquest';

  @override
  String get homeStartEyebrow => 'First realm';

  @override
  String get homeRealmsTitle => 'Realms of the kingdom';

  @override
  String get homeRealmsAction => 'View map';

  @override
  String homeRankPosition(int position) {
    return 'Rank $position';
  }

  @override
  String homeMatchesPlayed(int count) {
    return '$count online matches';
  }

  @override
  String get homeDuelLocked => 'Needs verified email';

  @override
  String get navHome => 'Home';

  @override
  String get navCampaign => 'Campaign';

  @override
  String get navChat => 'Chat';

  @override
  String get navRanking => 'Ranking';

  @override
  String get navMultiplayer => 'Multiplayer';

  @override
  String get navProfile => 'Profile';

  @override
  String get navSettings => 'Settings';

  @override
  String get homeMenu => 'Menu';

  @override
  String homeCrystals(int count) {
    final intl.NumberFormat countNumberFormat =
        intl.NumberFormat.decimalPattern(localeName);
    final String countString = countNumberFormat.format(count);

    return '$countString crystals';
  }

  @override
  String get homeModeCampaign => 'Campaign';

  @override
  String get homeModeCampaignDesc => 'Advance and conquer new territories.';

  @override
  String get homeModeMultiplayer => 'Multiplayer';

  @override
  String get homeModeMultiplayerDesc =>
      'Challenge players from all over the world.';

  @override
  String get homeModeChat => 'Chat';

  @override
  String get homeModeChatDesc => 'Talk with your allies and friends.';

  @override
  String get homeModeRanking => 'Ranking';

  @override
  String get homeModeRankingDesc => 'See the finest strategists of the realm.';

  @override
  String get homeRecentProgress => 'Recent progress';

  @override
  String get homeContinue => 'Continue';

  @override
  String get homeKingdomTitle => 'Your kingdom';

  @override
  String get homeKingdomTerritories => 'Territories';

  @override
  String get homeKingdomStars => 'Stars';

  @override
  String get homeKingdomMatches => 'Online matches';

  @override
  String get homePlayerTitleDefault => 'Question Conqueror';

  @override
  String get settingsTitle => 'Settings';

  @override
  String get settingsAccount => 'Account';

  @override
  String get settingsAccountId => 'Account ID';

  @override
  String get settingsAccountIdCopied => 'Account ID copied.';

  @override
  String get settingsConnectedEmail => 'Signed in with email';

  @override
  String get settingsChangePassword => 'Change password';

  @override
  String get settingsGuestTitle => 'You are not signed in';

  @override
  String get settingsGuestBody =>
      'Settings are kept on this device even without an account.';

  @override
  String get settingsSound => 'Sound';

  @override
  String get settingsMusic => 'Music';

  @override
  String get settingsEffects => 'Effects';

  @override
  String get settingsVibration => 'Vibration';

  @override
  String get settingsNotifications => 'Notifications';

  @override
  String get settingsPush => 'Push notifications';

  @override
  String get settingsPushDesc => 'Get notified about rewards and events.';

  @override
  String get settingsGameplay => 'Gameplay';

  @override
  String get settingsConfirmActions => 'Action confirmations';

  @override
  String get settingsConfirmActionsDesc =>
      'Ask for confirmation on important actions.';

  @override
  String get settingsTutorials => 'Tutorials';

  @override
  String get settingsTutorialsDesc => 'Show in-game tips and tutorials.';

  @override
  String get settingsDataSaver => 'Data saver';

  @override
  String get settingsDataSaverDesc => 'Reduce data and battery usage.';

  @override
  String get settingsLanguageSection => 'Language and appearance';

  @override
  String get settingsLanguage => 'Language';

  @override
  String settingsVersion(String version) {
    return 'Version $version';
  }

  @override
  String get settingsOpenAccount => 'Open account';
}
