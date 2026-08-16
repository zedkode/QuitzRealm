// ignore: unused_import
import 'package:intl/intl.dart' as intl;

import 'app_localizations.dart';

// ignore_for_file: type=lint

/// The translations for Romanian Moldavian Moldovan (`ro`).
class AppLocalizationsRo extends AppLocalizations {
  AppLocalizationsRo([String locale = 'ro']) : super(locale);

  @override
  String get appTitle => 'QuizRealm';

  @override
  String get appTagline => 'Cunoaște. Cucerește. Domnește.';

  @override
  String get menuStartCampaign => 'Începe campania';

  @override
  String get menuContinueCampaign => 'Continuă campania';

  @override
  String get menuAccount => 'Cont de jucător';

  @override
  String get menuHowToPlay => 'Cum se joacă';

  @override
  String get menuTapToEnter => 'Atinge pecetea pentru a intra';

  @override
  String get howToPlayTitle => 'Legile regatului';

  @override
  String get howToPlayRuleQuestions =>
      'Fiecare asalt înseamnă întrebări grilă și estimări numerice, contra cronometru.';

  @override
  String get howToPlayRuleStreak =>
      'Răspunsurile corecte la rând cresc multiplicatorul de serie până la ×3.';

  @override
  String get howToPlayRuleStars =>
      'Un asalt perfect îți aduce 3 stele. Stelele deblochează ținuturi noi.';

  @override
  String get howToPlayRuleOffline =>
      'Campania se joacă fără internet, din pachetele verificate livrate cu jocul.';

  @override
  String get close => 'Am înțeles';

  @override
  String get worldMapEyebrow => 'HARTA REGATULUI';

  @override
  String get worldMapTitle => 'Alege-ți ținutul';

  @override
  String get worldMapHint =>
      'Atinge un ținut cucerit pentru a-i deschide asalturile.';

  @override
  String levelBadge(int level) {
    return 'Nivel de cont $level';
  }

  @override
  String xpProgress(int current, int total) {
    return '$current / $total XP';
  }

  @override
  String starsCollected(int earned, int total) {
    return '$earned din $total stele';
  }

  @override
  String starsShort(int earned, int total) {
    return '$earned/$total';
  }

  @override
  String chapterLockedHint(int stars) {
    return 'Se deschide la $stars stele';
  }

  @override
  String chapterLockedSemantics(String chapter, int stars) {
    return '$chapter, blocat, necesită $stars stele';
  }

  @override
  String chapterOpenSemantics(String chapter, int earned, int total) {
    return '$chapter, $earned din $total stele';
  }

  @override
  String get chapterIstorie => 'Cetatea Cronicilor';

  @override
  String get chapterRomania => 'Tronul Carpatin';

  @override
  String get chapterGeografie => 'Portul celor Șapte Mări';

  @override
  String get chapterStiinta => 'Academia de Cristal';

  @override
  String get chapterSport => 'Câmpul Turnirului';

  @override
  String get chapterTehnologie => 'Observatorul de Alamă';

  @override
  String get chapterLiteratura => 'Schitul Manuscriselor';

  @override
  String get chapterArte => 'Golful Măștilor';

  @override
  String get chapterMituri => 'Insula Nălucilor';

  @override
  String get subjectIstorie => 'Istorie';

  @override
  String get subjectRomania => 'România';

  @override
  String get subjectGeografie => 'Geografie';

  @override
  String get subjectStiinta => 'Știință';

  @override
  String get subjectSport => 'Sport';

  @override
  String get subjectTehnologie => 'Tehnologie';

  @override
  String get subjectLiteratura => 'Literatură';

  @override
  String get subjectArte => 'Film și muzică';

  @override
  String get subjectMituri => 'Mituri și legende';

  @override
  String get stageOutpost => 'Avanpostul';

  @override
  String get stageCitadel => 'Cetatea';

  @override
  String get stageThrone => 'Sala Tronului';

  @override
  String stageNumber(int index) {
    return 'Asaltul $index';
  }

  @override
  String stageSummary(int questions, int seconds) {
    return '$questions întrebări • $seconds secunde fiecare';
  }

  @override
  String get stageLockedHint => 'Câștigă o stea în asaltul precedent';

  @override
  String get chooseStage => 'Alege asaltul';

  @override
  String get startStage => 'Pornește asaltul';

  @override
  String battleHeader(String chapter, String stage) {
    return '$chapter • $stage';
  }

  @override
  String get hudScore => 'SCOR';

  @override
  String get hudRound => 'RUNDĂ';

  @override
  String get hudStreak => 'SERIE';

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
    return 'Au rămas $seconds secunde';
  }

  @override
  String get questionLoading => 'Se pregătește asaltul…';

  @override
  String get questionErrorTitle => 'Asaltul nu a putut porni';

  @override
  String get noQuestionsTitle => 'Ținutul e fără întrebări';

  @override
  String get noQuestionsBody =>
      'Pachetul acestui ținut nu a putut fi citit. Nu intrăm în luptă cu întrebări neverificate.';

  @override
  String get retry => 'Încearcă din nou';

  @override
  String difficulty(int level) {
    return 'Dificultate $level/5';
  }

  @override
  String get categoryFallback => 'Arhivele regatului';

  @override
  String get numericHint => 'Scrie estimarea ta';

  @override
  String get submitAnswer => 'Confirmă răspunsul';

  @override
  String answerOptionSemantics(String letter, String answer) {
    return 'Varianta $letter: $answer';
  }

  @override
  String get correctTitle => 'Lovitură reușită!';

  @override
  String get incorrectTitle => 'Atac respins';

  @override
  String get timeoutTitle => 'Timpul a expirat';

  @override
  String correctAnswerLabel(String answer) {
    return 'Răspuns corect: $answer';
  }

  @override
  String pointsAwarded(int points) {
    return '+$points';
  }

  @override
  String get nextQuestion => 'Următoarea întrebare';

  @override
  String get finishRound => 'Vezi rezultatul';

  @override
  String get answerSubmitError =>
      'Verdictul nu a putut fi obținut. Atacul tău este păstrat.';

  @override
  String get retryAnswer => 'Retrimite atacul';

  @override
  String get leaveBattleTitle => 'Abandonezi asaltul?';

  @override
  String get leaveBattleBody =>
      'Progresul acestui asalt se pierde, iar ținutul rămâne necucerit.';

  @override
  String get leaveBattleConfirm => 'Abandonează';

  @override
  String get leaveBattleCancel => 'Continuă lupta';

  @override
  String get resultVictoryTitle => 'Ținut cucerit';

  @override
  String get resultDefeatTitle => 'Asalt respins';

  @override
  String resultVictoryBody(String chapter) {
    return 'Steagul tău flutură peste $chapter.';
  }

  @override
  String get resultDefeatBody =>
      'Zidurile au ținut. Reia asaltul când ești pregătit.';

  @override
  String get resultScoreLabel => 'SCOR';

  @override
  String get resultAnswersLabel => 'CORECTE';

  @override
  String get resultStreakLabel => 'SERIE MAXIMĂ';

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
    return 'Nivel de cont nou: $level!';
  }

  @override
  String get resultChapterCleared => 'Ai cucerit tot ținutul!';

  @override
  String get actionRetryStage => 'Reia asaltul';

  @override
  String get actionNextStage => 'Asaltul următor';

  @override
  String get actionBackToMap => 'Înapoi la hartă';

  @override
  String starsSemantics(int earned, int total) {
    return '$earned din $total stele';
  }

  @override
  String get menuDuel => 'Duel online';

  @override
  String get menuLeaderboard => 'Clasament';

  @override
  String get leaderboardTitle => 'Clasamentul regatului';

  @override
  String leaderboardPlayerCount(int total) {
    return '$total jucători clasați';
  }

  @override
  String get leaderboardEmpty =>
      'Nu s-a clasat încă nimeni. Joacă un duel ca să deschizi clasamentul.';

  @override
  String get leaderboardYourPlace => 'LOCUL TĂU';

  @override
  String leaderboardPositionLine(int position, int matches) {
    return 'Locul $position • $matches partide';
  }

  @override
  String leaderboardRowSemantics(int position, String username, String rank) {
    return 'Locul $position, $username, $rank';
  }

  @override
  String get leaderboardErrorTitle => 'Clasamentul nu a putut fi citit';

  @override
  String get leaderboardErrorBody =>
      'Serverul nu răspunde. Clasamentul are nevoie de conexiune.';

  @override
  String rankSemantics(String rank, int elo) {
    return 'Rang $rank, $elo puncte';
  }

  @override
  String rankToNext(int points) {
    return 'Încă $points puncte până la treapta următoare';
  }

  @override
  String get rankTopReached => 'Ai atins treapta de vârf a regatului';

  @override
  String duelRankUpdated(String rank) {
    return 'Rang: $rank';
  }

  @override
  String get duelTitle => 'Duel 1v1';

  @override
  String get duelConnecting => 'Ne conectăm la regat…';

  @override
  String get duelSearching => 'Căutăm un adversar';

  @override
  String get duelSearchingHint =>
      'Rămâi pe recepție: prima rundă pornește imediat ce se găsește un adversar.';

  @override
  String get duelCancelSearch => 'Renunță la căutare';

  @override
  String get duelNeedAccountTitle => 'Duelul cere un cont';

  @override
  String get duelNeedAccountBody =>
      'Partidele online se joacă autentificat, ca rezultatele să poată intra în clasament.';

  @override
  String get duelGoToAccount => 'Deschide contul';

  @override
  String duelRoundCounter(int current, int total) {
    return 'Runda $current din $total';
  }

  @override
  String get duelYou => 'TU';

  @override
  String get duelOpponent => 'ADVERSAR';

  @override
  String get duelWaitingOpponent => 'Adversarul încă răspunde…';

  @override
  String get duelAnswerSent => 'Atac trimis';

  @override
  String get duelRoundWon => 'Ai cucerit teritoriul!';

  @override
  String get duelRoundLost => 'Teritoriul a fost pierdut';

  @override
  String get duelRoundNeutral => 'Niciun teritoriu cucerit';

  @override
  String get duelNextRound => 'Runda următoare pornește…';

  @override
  String get duelNoAnswer => 'fără răspuns';

  @override
  String get duelVictory => 'Victorie';

  @override
  String get duelDefeat => 'Înfrângere';

  @override
  String get duelDraw => 'Egalitate';

  @override
  String duelFinalLine(int score, int territories) {
    return '$score puncte • $territories teritorii';
  }

  @override
  String get duelRematch => 'Caută alt duel';

  @override
  String get duelLeave => 'Ieși din duel';

  @override
  String get duelDisconnectedTitle => 'Conexiunea s-a pierdut';

  @override
  String get duelDisconnectedBody =>
      'Serverul de partide nu mai răspunde. Poți încerca din nou.';

  @override
  String get duelServerErrorTitle => 'Partida a fost oprită';

  @override
  String get duelVerifyEmailTitle => 'Confirmă-ți adresa de email';

  @override
  String get duelVerifyEmailBody =>
      'Duelurile clasate cer un cont verificat. Deschide linkul pe care ți l-am trimis pe email, apoi încearcă din nou.';

  @override
  String get duelVerifyEmailAction => 'Retrimite linkul';

  @override
  String get duelVerifyEmailSending => 'Se trimite…';

  @override
  String get duelVerifyEmailSent => 'Ți-am trimis un link nou de confirmare.';

  @override
  String get duelVerifyEmailFailed =>
      'Nu am putut trimite emailul. Încearcă mai târziu.';

  @override
  String get duelAccountRestrictedTitle => 'Cont restricționat';

  @override
  String get duelAccountRestrictedBody =>
      'Contul tău nu poate intra acum în duelurile clasate.';

  @override
  String get duelReconnectingTitle => 'Te reconectăm la partidă';

  @override
  String get duelReconnectingBody =>
      'Locul îți este păstrat. Rămâi pe recepție câteva secunde.';

  @override
  String get duelOpponentAwayTitle => 'Adversarul a pierdut legătura';

  @override
  String duelOpponentAwayBody(int seconds) {
    String _temp0 = intl.Intl.pluralLogic(
      seconds,
      locale: localeName,
      other: 'Mai are $seconds secunde să revină.',
      one: 'Mai are o secundă să revină.',
    );
    return '$_temp0';
  }

  @override
  String get duelOpponentAwayExpired =>
      'Timpul de revenire a expirat. Partida se închide.';

  @override
  String get duelWonByForfeit => 'Adversarul nu s-a mai întors în partidă.';

  @override
  String get matchChatOpen => 'Deschide chatul de luptă';

  @override
  String get matchChatTitle => 'Cronica luptei';

  @override
  String get matchChatEphemeral =>
      'Mesajele acestei partide dispar după luptă.';

  @override
  String get matchChatEmpty =>
      'Pergamentul este gol. Trimite o reacție adversarului.';

  @override
  String get matchChatReactions => 'REACȚII RAPIDE';

  @override
  String get matchReactionGoodLuck => 'Mult noroc!';

  @override
  String get matchReactionNiceMove => 'Mișcare bună!';

  @override
  String get matchReactionWow => 'Uau!';

  @override
  String get matchReactionWellPlayed => 'Bine jucat!';

  @override
  String get matchChatHint => 'Scrie un mesaj de luptă…';

  @override
  String get matchChatSend => 'Trimite mesajul';

  @override
  String get matchChatTextLocked =>
      'Textul liber se deblochează după 10 răspunsuri corecte. Reacțiile rămân disponibile.';

  @override
  String get matchChatMuted => 'Chatul tău este temporar restricționat.';

  @override
  String get matchChatTooFast => 'Prea multe mesaje. Așteaptă câteva secunde.';

  @override
  String get matchChatLinksLocked =>
      'Linkurile se deblochează la o treaptă de încredere mai mare.';

  @override
  String get matchChatClosed => 'Chatul acestei partide s-a închis.';

  @override
  String get matchChatInvalid => 'Mesajul nu a putut fi trimis.';

  @override
  String get loginEyebrow => 'CONT DE JUCĂTOR';

  @override
  String get loginTitle => 'Păstrează-ți cuceririle pe orice dispozitiv.';

  @override
  String get accountOptionalNote =>
      'Contul este opțional — campania se joacă și fără el.';

  @override
  String get emailLabel => 'E-mail';

  @override
  String get passwordLabel => 'Parolă';

  @override
  String get usernameLabel => 'Nume de jucător';

  @override
  String get loginButton => 'Intră în regat';

  @override
  String get createAccountButton => 'Creează contul';

  @override
  String get switchToRegister => 'Nu ai cont? Creează unul';

  @override
  String get switchToLogin => 'Ai deja cont? Autentifică-te';

  @override
  String get authGenericError =>
      'Autentificarea nu a reușit. Verifică datele și conexiunea.';

  @override
  String get fieldRequired => 'Acest câmp este obligatoriu.';

  @override
  String get passwordHint => 'Minimum 10 caractere';

  @override
  String get birthDateLabel => 'Data nașterii';

  @override
  String get birthDatePick => 'Alege data';

  @override
  String get birthDateHint => 'Ne asigurăm că jocul e potrivit vârstei tale.';

  @override
  String birthDateTooYoung(int years) {
    return 'Trebuie să ai cel puțin $years ani ca să-ți creezi cont.';
  }

  @override
  String get logout => 'Deconectare';

  @override
  String get backLabel => 'Înapoi';

  @override
  String get socialTitle => 'Prieteni și mesaje';

  @override
  String get socialTabFriends => 'Prieteni';

  @override
  String get socialTabMessages => 'Mesaje';

  @override
  String get socialNeedAccountTitle => 'Partea socială cere un cont';

  @override
  String get socialNeedAccountBody =>
      'Autentifică-te ca să ai prieteni, conversații și chat.';

  @override
  String get socialErrorTitle => 'Nu am putut încărca partea socială';

  @override
  String get friendsAddHint => 'Nume de utilizator';

  @override
  String get friendsAddAction => 'Trimite cerere';

  @override
  String get friendsIncomingRequests => 'Cereri primite';

  @override
  String get friendsOutgoingRequests => 'Cereri trimise';

  @override
  String get friendsRequestSent => 'În așteptare';

  @override
  String get friendsListTitle => 'Prietenii tăi';

  @override
  String get friendsEmpty =>
      'Încă nu ai prieteni. Caută pe cineva după numele de utilizator.';

  @override
  String get friendsAccept => 'Acceptă';

  @override
  String get friendsDecline => 'Refuză';

  @override
  String get friendsOpenChat => 'Deschide conversația';

  @override
  String get friendsBlock => 'Blochează';

  @override
  String get friendsBlockTitle => 'Blochezi jucătorul?';

  @override
  String friendsBlockBody(String name) {
    return '$name nu îți va mai putea scrie, iar prietenia se desface.';
  }

  @override
  String get conversationsTitle => 'Conversații';

  @override
  String get conversationsEmpty => 'Nicio conversație deocamdată.';

  @override
  String get conversationEmpty => 'Scrie primul mesaj.';

  @override
  String get messageRequestsTitle => 'Cereri de mesaj';

  @override
  String get messageRequestsExplainer =>
      'Cineva care nu îți e prieten vrea să-ți scrie. Acceptă doar dacă vrei să continui.';

  @override
  String get messageRequestAccept => 'Acceptă cererea';

  @override
  String get chatComposerHint => 'Scrie un mesaj…';

  @override
  String get chatSend => 'Trimite';

  @override
  String get chatMutedNotice =>
      'Chatul îți este oprit temporar din cauza mesajelor repetate.';

  @override
  String get chatReportTitle => 'Raportează mesajul';

  @override
  String get chatReportHint => 'Ce e în neregulă?';

  @override
  String get chatReportSend => 'Trimite raportul';

  @override
  String get chatReportSent => 'Raportul a fost trimis.';

  @override
  String get privacyTitle => 'Confidențialitate';

  @override
  String get privacyDmTitle => 'Cine îți poate scrie direct';

  @override
  String get privacyDmLocked =>
      'Conturile de minor primesc mesaje directe doar de la prieteni.';

  @override
  String get privacyDmEveryone => 'Oricine';

  @override
  String get privacyDmFriends => 'Doar prietenii';

  @override
  String get privacyDmNobody => 'Nimeni';

  @override
  String trustCorrectAnswers(int count) {
    return '$count corecte';
  }

  @override
  String trustAnswersToNextTier(int count) {
    return 'Încă $count răspunsuri corecte până la treapta următoare.';
  }

  @override
  String get trustMaxTier => 'Ai atins ultima treaptă de încredere.';

  @override
  String get trustTierNewcomer => 'Nou';

  @override
  String get trustTierApprentice => 'Ucenic';

  @override
  String get trustTierContributor => 'Contribuitor';

  @override
  String get trustTierEstablished => 'Stabilit';

  @override
  String get trustTierExperienced => 'Experimentat';

  @override
  String get trustTierExpert => 'Expert';

  @override
  String get trustTierCommunityMaster => 'Maestru al comunității';

  @override
  String get trustTierElite => 'Elită';

  @override
  String get trustTierCommunityLegend => 'Legendă a comunității';

  @override
  String get homeGuestTitle => 'Joci fără cont';

  @override
  String get homeGuestAction => 'Deschide cont';

  @override
  String get homeLoadingProfile => 'Se încarcă profilul…';

  @override
  String homeCoins(int count) {
    return '$count monede';
  }

  @override
  String get homeContinueEyebrow => 'Continuă cucerirea';

  @override
  String get homeStartEyebrow => 'Primul ținut';

  @override
  String get homeRealmsTitle => 'Ținuturile regatului';

  @override
  String get homeRealmsAction => 'Vezi harta';

  @override
  String homeRankPosition(int position) {
    return 'Locul $position';
  }

  @override
  String homeMatchesPlayed(int count) {
    return '$count partide online';
  }

  @override
  String get homeDuelLocked => 'Cere email confirmat';

  @override
  String get navHome => 'Acasă';

  @override
  String get navCampaign => 'Campanie';

  @override
  String get navChat => 'Chat';

  @override
  String get navRanking => 'Clasament';

  @override
  String get navMultiplayer => 'Multiplayer';

  @override
  String get navProfile => 'Profil';

  @override
  String get navSettings => 'Setări';

  @override
  String get homeMenu => 'Meniu';

  @override
  String homeCrystals(int count) {
    final intl.NumberFormat countNumberFormat =
        intl.NumberFormat.decimalPattern(localeName);
    final String countString = countNumberFormat.format(count);

    return '$countString cristale';
  }

  @override
  String get homeModeCampaign => 'Campanie';

  @override
  String get homeModeCampaignDesc => 'Progresează și cucerește noi teritorii.';

  @override
  String get homeModeMultiplayer => 'Multiplayer';

  @override
  String get homeModeMultiplayerDesc => 'Provoacă jucători din toată lumea.';

  @override
  String get homeModeChat => 'Chat';

  @override
  String get homeModeChatDesc => 'Discută cu aliații și prietenii tăi.';

  @override
  String get homeModeRanking => 'Clasament';

  @override
  String get homeModeRankingDesc => 'Vezi cei mai buni strategi de pe tărâm.';

  @override
  String get homeRecentProgress => 'Progres recent';

  @override
  String get homeContinue => 'Continuă';

  @override
  String get homeKingdomTitle => 'Regatul tău';

  @override
  String get homeKingdomTerritories => 'Teritorii';

  @override
  String get homeKingdomStars => 'Stele';

  @override
  String get homeKingdomMatches => 'Partide online';

  @override
  String get homePlayerTitleDefault => 'Cuceritor de Întrebări';

  @override
  String get settingsTitle => 'Setări';

  @override
  String get settingsAccount => 'Cont';

  @override
  String get settingsAccountId => 'ID Cont';

  @override
  String get settingsAccountIdCopied => 'ID-ul contului a fost copiat.';

  @override
  String get settingsConnectedEmail => 'Conectat prin email';

  @override
  String get settingsChangePassword => 'Schimbă parola';

  @override
  String get settingsGuestTitle => 'Nu ești autentificat';

  @override
  String get settingsGuestBody =>
      'Setările se păstrează pe acest dispozitiv și fără cont.';

  @override
  String get settingsSound => 'Sunet';

  @override
  String get settingsMusic => 'Muzică';

  @override
  String get settingsEffects => 'Efecte';

  @override
  String get settingsVibration => 'Vibrație';

  @override
  String get settingsNotifications => 'Notificări';

  @override
  String get settingsPush => 'Notificări push';

  @override
  String get settingsPushDesc =>
      'Primește notificări despre recompense și evenimente.';

  @override
  String get settingsGameplay => 'Joc';

  @override
  String get settingsConfirmActions => 'Confirmarea acțiunilor';

  @override
  String get settingsConfirmActionsDesc =>
      'Cere confirmare pentru acțiuni importante.';

  @override
  String get settingsTutorials => 'Tutoriale';

  @override
  String get settingsTutorialsDesc => 'Afișează sfaturi și tutoriale în joc.';

  @override
  String get settingsDataSaver => 'Economisire resurse';

  @override
  String get settingsDataSaverDesc => 'Reduce consumul de date și de baterie.';

  @override
  String get settingsLanguageSection => 'Limbă și aspect';

  @override
  String get settingsLanguage => 'Limbă';

  @override
  String settingsVersion(String version) {
    return 'Versiunea $version';
  }

  @override
  String get settingsOpenAccount => 'Deschide contul';

  @override
  String get accountLevelLabel => 'Nivel de cont';

  @override
  String get categoryAnimals => 'Animale';

  @override
  String get categoryArt => 'Artă';

  @override
  String get categoryCars => 'Mașini';

  @override
  String get categoryEconomy => 'Economie';

  @override
  String get categoryGaming => 'Gaming';

  @override
  String get categoryGeneralKnowledge => 'Cultură generală';

  @override
  String get categoryGeography => 'Geografie';

  @override
  String get categoryHistory => 'Istorie';

  @override
  String get categoryLiterature => 'Literatură';

  @override
  String get categoryLogic => 'Logică';

  @override
  String get categoryMedieval => 'Medieval';

  @override
  String get categoryMovies => 'Filme';

  @override
  String get categoryMusic => 'Muzică';

  @override
  String get categoryMythology => 'Mitologie';

  @override
  String get categoryRoyalChallenge => 'Provocare regală';

  @override
  String get categoryScience => 'Știință';

  @override
  String get categorySpace => 'Spațiu';

  @override
  String get categorySports => 'Sport';

  @override
  String get categoryTechnology => 'Tehnologie';

  @override
  String get categoryWars => 'Războaie';

  @override
  String get trainingTitle => 'Antrenament';

  @override
  String get trainingSubtitle =>
      'Alege categoriile și exersează fără presiune.';

  @override
  String get trainingSelectAll => 'Toate categoriile';

  @override
  String get trainingClear => 'Golește selecția';

  @override
  String trainingSelectedCount(int count) {
    return '$count categorii alese';
  }

  @override
  String trainingAllSelected(int count) {
    return 'Toate cele $count categorii';
  }

  @override
  String get trainingStart => 'Începe runda';

  @override
  String get trainingLength => 'Lungimea rundei';

  @override
  String get trainingLengthShort => 'Scurtă';

  @override
  String get trainingLengthMedium => 'Medie';

  @override
  String get trainingLengthLong => 'Lungă';

  @override
  String get trainingMastery => 'Măiestrie';

  @override
  String get trainingMasteryNone => 'Neînceput';

  @override
  String get trainingMasteryBronze => 'Bronz';

  @override
  String get trainingMasterySilver => 'Argint';

  @override
  String get trainingMasteryGold => 'Aur';

  @override
  String trainingCorrectOf(int correct, int answered) {
    return '$correct corecte din $answered';
  }

  @override
  String get trainingRoundDone => 'Rundă încheiată';

  @override
  String get trainingPlayAgain => 'Încă o rundă';

  @override
  String get trainingBack => 'Înapoi la categorii';

  @override
  String get trainingEmpty => 'Nu am găsit întrebări pentru categoriile alese.';

  @override
  String get homeModeTrainingDesc => 'Exersează pe categoriile alese de tine.';

  @override
  String get playTitle => 'Joacă';

  @override
  String get playSubtitle =>
      'Alege modul și categoriile, apoi caută adversari.';

  @override
  String get playMode => 'Mod de joc';

  @override
  String get playModeDuo => 'Duel 1v1';

  @override
  String get playModeDuoDesc => 'Față în față, pe rang.';

  @override
  String get playModeClassic => 'Clasic';

  @override
  String get playModeClassicDesc =>
      'Mai mulți jucători, cucerire de teritorii.';

  @override
  String get playPlayerCount => 'Număr de jucători';

  @override
  String get playCategories => 'Categorii';

  @override
  String get playCategoriesNote =>
      'Serverul folosește categoriile pe care le vreți amândoi. Dacă nu se potrivesc, meciul rulează pe toate.';

  @override
  String get playFindMatch => 'Caută meci';

  @override
  String get playModeSoon => 'În pregătire';

  @override
  String get playModeClassicSoon =>
      'Serverul îl suportă deja, dar ecranul de meci arată deocamdată un singur adversar.';
}
