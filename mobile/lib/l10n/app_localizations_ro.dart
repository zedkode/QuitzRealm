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
    return 'Nivel $level';
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
    return 'Nivel nou: $level!';
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
}
