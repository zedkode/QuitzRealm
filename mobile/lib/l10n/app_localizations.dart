import 'dart:async';

import 'package:flutter/foundation.dart';
import 'package:flutter/widgets.dart';
import 'package:flutter_localizations/flutter_localizations.dart';
import 'package:intl/intl.dart' as intl;

import 'app_localizations_en.dart';
import 'app_localizations_ro.dart';

// ignore_for_file: type=lint

/// Callers can lookup localized strings with an instance of AppLocalizations
/// returned by `AppLocalizations.of(context)`.
///
/// Applications need to include `AppLocalizations.delegate()` in their app's
/// `localizationDelegates` list, and the locales they support in the app's
/// `supportedLocales` list. For example:
///
/// ```dart
/// import 'l10n/app_localizations.dart';
///
/// return MaterialApp(
///   localizationsDelegates: AppLocalizations.localizationsDelegates,
///   supportedLocales: AppLocalizations.supportedLocales,
///   home: MyApplicationHome(),
/// );
/// ```
///
/// ## Update pubspec.yaml
///
/// Please make sure to update your pubspec.yaml to include the following
/// packages:
///
/// ```yaml
/// dependencies:
///   # Internationalization support.
///   flutter_localizations:
///     sdk: flutter
///   intl: any # Use the pinned version from flutter_localizations
///
///   # Rest of dependencies
/// ```
///
/// ## iOS Applications
///
/// iOS applications define key application metadata, including supported
/// locales, in an Info.plist file that is built into the application bundle.
/// To configure the locales supported by your app, you’ll need to edit this
/// file.
///
/// First, open your project’s ios/Runner.xcworkspace Xcode workspace file.
/// Then, in the Project Navigator, open the Info.plist file under the Runner
/// project’s Runner folder.
///
/// Next, select the Information Property List item, select Add Item from the
/// Editor menu, then select Localizations from the pop-up menu.
///
/// Select and expand the newly-created Localizations item then, for each
/// locale your application supports, add a new item and select the locale
/// you wish to add from the pop-up menu in the Value field. This list should
/// be consistent with the languages listed in the AppLocalizations.supportedLocales
/// property.
abstract class AppLocalizations {
  AppLocalizations(String locale)
    : localeName = intl.Intl.canonicalizedLocale(locale.toString());

  final String localeName;

  static AppLocalizations of(BuildContext context) {
    return Localizations.of<AppLocalizations>(context, AppLocalizations)!;
  }

  static const LocalizationsDelegate<AppLocalizations> delegate =
      _AppLocalizationsDelegate();

  /// A list of this localizations delegate along with the default localizations
  /// delegates.
  ///
  /// Returns a list of localizations delegates containing this delegate along with
  /// GlobalMaterialLocalizations.delegate, GlobalCupertinoLocalizations.delegate,
  /// and GlobalWidgetsLocalizations.delegate.
  ///
  /// Additional delegates can be added by appending to this list in
  /// MaterialApp. This list does not have to be used at all if a custom list
  /// of delegates is preferred or required.
  static const List<LocalizationsDelegate<dynamic>> localizationsDelegates =
      <LocalizationsDelegate<dynamic>>[
        delegate,
        GlobalMaterialLocalizations.delegate,
        GlobalCupertinoLocalizations.delegate,
        GlobalWidgetsLocalizations.delegate,
      ];

  /// A list of this localizations delegate's supported locales.
  static const List<Locale> supportedLocales = <Locale>[
    Locale('en'),
    Locale('ro'),
  ];

  /// No description provided for @appTitle.
  ///
  /// In ro, this message translates to:
  /// **'QuizRealm'**
  String get appTitle;

  /// No description provided for @appTagline.
  ///
  /// In ro, this message translates to:
  /// **'Cunoaște. Cucerește. Domnește.'**
  String get appTagline;

  /// No description provided for @menuStartCampaign.
  ///
  /// In ro, this message translates to:
  /// **'Începe campania'**
  String get menuStartCampaign;

  /// No description provided for @menuContinueCampaign.
  ///
  /// In ro, this message translates to:
  /// **'Continuă campania'**
  String get menuContinueCampaign;

  /// No description provided for @menuAccount.
  ///
  /// In ro, this message translates to:
  /// **'Cont de jucător'**
  String get menuAccount;

  /// No description provided for @menuHowToPlay.
  ///
  /// In ro, this message translates to:
  /// **'Cum se joacă'**
  String get menuHowToPlay;

  /// No description provided for @menuTapToEnter.
  ///
  /// In ro, this message translates to:
  /// **'Atinge pecetea pentru a intra'**
  String get menuTapToEnter;

  /// No description provided for @howToPlayTitle.
  ///
  /// In ro, this message translates to:
  /// **'Legile regatului'**
  String get howToPlayTitle;

  /// No description provided for @howToPlayRuleQuestions.
  ///
  /// In ro, this message translates to:
  /// **'Fiecare asalt înseamnă întrebări grilă și estimări numerice, contra cronometru.'**
  String get howToPlayRuleQuestions;

  /// No description provided for @howToPlayRuleStreak.
  ///
  /// In ro, this message translates to:
  /// **'Răspunsurile corecte la rând cresc multiplicatorul de serie până la ×3.'**
  String get howToPlayRuleStreak;

  /// No description provided for @howToPlayRuleStars.
  ///
  /// In ro, this message translates to:
  /// **'Un asalt perfect îți aduce 3 stele. Stelele deblochează ținuturi noi.'**
  String get howToPlayRuleStars;

  /// No description provided for @howToPlayRuleOffline.
  ///
  /// In ro, this message translates to:
  /// **'Campania se joacă fără internet, din pachetele verificate livrate cu jocul.'**
  String get howToPlayRuleOffline;

  /// No description provided for @close.
  ///
  /// In ro, this message translates to:
  /// **'Am înțeles'**
  String get close;

  /// No description provided for @worldMapEyebrow.
  ///
  /// In ro, this message translates to:
  /// **'HARTA REGATULUI'**
  String get worldMapEyebrow;

  /// No description provided for @worldMapTitle.
  ///
  /// In ro, this message translates to:
  /// **'Alege-ți ținutul'**
  String get worldMapTitle;

  /// No description provided for @worldMapHint.
  ///
  /// In ro, this message translates to:
  /// **'Atinge un ținut cucerit pentru a-i deschide asalturile.'**
  String get worldMapHint;

  /// No description provided for @levelBadge.
  ///
  /// In ro, this message translates to:
  /// **'Nivel de cont {level}'**
  String levelBadge(int level);

  /// No description provided for @xpProgress.
  ///
  /// In ro, this message translates to:
  /// **'{current} / {total} XP'**
  String xpProgress(int current, int total);

  /// No description provided for @starsCollected.
  ///
  /// In ro, this message translates to:
  /// **'{earned} din {total} stele'**
  String starsCollected(int earned, int total);

  /// No description provided for @starsShort.
  ///
  /// In ro, this message translates to:
  /// **'{earned}/{total}'**
  String starsShort(int earned, int total);

  /// No description provided for @chapterLockedHint.
  ///
  /// In ro, this message translates to:
  /// **'Se deschide la {stars} stele'**
  String chapterLockedHint(int stars);

  /// No description provided for @chapterLockedSemantics.
  ///
  /// In ro, this message translates to:
  /// **'{chapter}, blocat, necesită {stars} stele'**
  String chapterLockedSemantics(String chapter, int stars);

  /// No description provided for @chapterOpenSemantics.
  ///
  /// In ro, this message translates to:
  /// **'{chapter}, {earned} din {total} stele'**
  String chapterOpenSemantics(String chapter, int earned, int total);

  /// No description provided for @chapterIstorie.
  ///
  /// In ro, this message translates to:
  /// **'Cetatea Cronicilor'**
  String get chapterIstorie;

  /// No description provided for @chapterRomania.
  ///
  /// In ro, this message translates to:
  /// **'Tronul Carpatin'**
  String get chapterRomania;

  /// No description provided for @chapterGeografie.
  ///
  /// In ro, this message translates to:
  /// **'Portul celor Șapte Mări'**
  String get chapterGeografie;

  /// No description provided for @chapterStiinta.
  ///
  /// In ro, this message translates to:
  /// **'Academia de Cristal'**
  String get chapterStiinta;

  /// No description provided for @chapterSport.
  ///
  /// In ro, this message translates to:
  /// **'Câmpul Turnirului'**
  String get chapterSport;

  /// No description provided for @chapterTehnologie.
  ///
  /// In ro, this message translates to:
  /// **'Observatorul de Alamă'**
  String get chapterTehnologie;

  /// No description provided for @chapterLiteratura.
  ///
  /// In ro, this message translates to:
  /// **'Schitul Manuscriselor'**
  String get chapterLiteratura;

  /// No description provided for @chapterArte.
  ///
  /// In ro, this message translates to:
  /// **'Golful Măștilor'**
  String get chapterArte;

  /// No description provided for @chapterMituri.
  ///
  /// In ro, this message translates to:
  /// **'Insula Nălucilor'**
  String get chapterMituri;

  /// No description provided for @subjectIstorie.
  ///
  /// In ro, this message translates to:
  /// **'Istorie'**
  String get subjectIstorie;

  /// No description provided for @subjectRomania.
  ///
  /// In ro, this message translates to:
  /// **'România'**
  String get subjectRomania;

  /// No description provided for @subjectGeografie.
  ///
  /// In ro, this message translates to:
  /// **'Geografie'**
  String get subjectGeografie;

  /// No description provided for @subjectStiinta.
  ///
  /// In ro, this message translates to:
  /// **'Știință'**
  String get subjectStiinta;

  /// No description provided for @subjectSport.
  ///
  /// In ro, this message translates to:
  /// **'Sport'**
  String get subjectSport;

  /// No description provided for @subjectTehnologie.
  ///
  /// In ro, this message translates to:
  /// **'Tehnologie'**
  String get subjectTehnologie;

  /// No description provided for @subjectLiteratura.
  ///
  /// In ro, this message translates to:
  /// **'Literatură'**
  String get subjectLiteratura;

  /// No description provided for @subjectArte.
  ///
  /// In ro, this message translates to:
  /// **'Film și muzică'**
  String get subjectArte;

  /// No description provided for @subjectMituri.
  ///
  /// In ro, this message translates to:
  /// **'Mituri și legende'**
  String get subjectMituri;

  /// No description provided for @stageOutpost.
  ///
  /// In ro, this message translates to:
  /// **'Avanpostul'**
  String get stageOutpost;

  /// No description provided for @stageCitadel.
  ///
  /// In ro, this message translates to:
  /// **'Cetatea'**
  String get stageCitadel;

  /// No description provided for @stageThrone.
  ///
  /// In ro, this message translates to:
  /// **'Sala Tronului'**
  String get stageThrone;

  /// No description provided for @stageNumber.
  ///
  /// In ro, this message translates to:
  /// **'Asaltul {index}'**
  String stageNumber(int index);

  /// No description provided for @stageSummary.
  ///
  /// In ro, this message translates to:
  /// **'{questions} întrebări • {seconds} secunde fiecare'**
  String stageSummary(int questions, int seconds);

  /// No description provided for @stageLockedHint.
  ///
  /// In ro, this message translates to:
  /// **'Câștigă o stea în asaltul precedent'**
  String get stageLockedHint;

  /// No description provided for @chooseStage.
  ///
  /// In ro, this message translates to:
  /// **'Alege asaltul'**
  String get chooseStage;

  /// No description provided for @startStage.
  ///
  /// In ro, this message translates to:
  /// **'Pornește asaltul'**
  String get startStage;

  /// No description provided for @battleHeader.
  ///
  /// In ro, this message translates to:
  /// **'{chapter} • {stage}'**
  String battleHeader(String chapter, String stage);

  /// No description provided for @hudScore.
  ///
  /// In ro, this message translates to:
  /// **'SCOR'**
  String get hudScore;

  /// No description provided for @hudRound.
  ///
  /// In ro, this message translates to:
  /// **'RUNDĂ'**
  String get hudRound;

  /// No description provided for @hudStreak.
  ///
  /// In ro, this message translates to:
  /// **'SERIE'**
  String get hudStreak;

  /// No description provided for @roundCounter.
  ///
  /// In ro, this message translates to:
  /// **'{current}/{total}'**
  String roundCounter(int current, int total);

  /// No description provided for @streakMultiplier.
  ///
  /// In ro, this message translates to:
  /// **'×{multiplier}'**
  String streakMultiplier(String multiplier);

  /// No description provided for @timerSemantics.
  ///
  /// In ro, this message translates to:
  /// **'Au rămas {seconds} secunde'**
  String timerSemantics(int seconds);

  /// No description provided for @questionLoading.
  ///
  /// In ro, this message translates to:
  /// **'Se pregătește asaltul…'**
  String get questionLoading;

  /// No description provided for @questionErrorTitle.
  ///
  /// In ro, this message translates to:
  /// **'Asaltul nu a putut porni'**
  String get questionErrorTitle;

  /// No description provided for @noQuestionsTitle.
  ///
  /// In ro, this message translates to:
  /// **'Ținutul e fără întrebări'**
  String get noQuestionsTitle;

  /// No description provided for @noQuestionsBody.
  ///
  /// In ro, this message translates to:
  /// **'Pachetul acestui ținut nu a putut fi citit. Nu intrăm în luptă cu întrebări neverificate.'**
  String get noQuestionsBody;

  /// No description provided for @retry.
  ///
  /// In ro, this message translates to:
  /// **'Încearcă din nou'**
  String get retry;

  /// No description provided for @difficulty.
  ///
  /// In ro, this message translates to:
  /// **'Dificultate {level}/5'**
  String difficulty(int level);

  /// No description provided for @categoryFallback.
  ///
  /// In ro, this message translates to:
  /// **'Arhivele regatului'**
  String get categoryFallback;

  /// No description provided for @numericHint.
  ///
  /// In ro, this message translates to:
  /// **'Scrie estimarea ta'**
  String get numericHint;

  /// No description provided for @submitAnswer.
  ///
  /// In ro, this message translates to:
  /// **'Confirmă răspunsul'**
  String get submitAnswer;

  /// No description provided for @answerOptionSemantics.
  ///
  /// In ro, this message translates to:
  /// **'Varianta {letter}: {answer}'**
  String answerOptionSemantics(String letter, String answer);

  /// No description provided for @correctTitle.
  ///
  /// In ro, this message translates to:
  /// **'Lovitură reușită!'**
  String get correctTitle;

  /// No description provided for @incorrectTitle.
  ///
  /// In ro, this message translates to:
  /// **'Atac respins'**
  String get incorrectTitle;

  /// No description provided for @timeoutTitle.
  ///
  /// In ro, this message translates to:
  /// **'Timpul a expirat'**
  String get timeoutTitle;

  /// No description provided for @correctAnswerLabel.
  ///
  /// In ro, this message translates to:
  /// **'Răspuns corect: {answer}'**
  String correctAnswerLabel(String answer);

  /// No description provided for @pointsAwarded.
  ///
  /// In ro, this message translates to:
  /// **'+{points}'**
  String pointsAwarded(int points);

  /// No description provided for @nextQuestion.
  ///
  /// In ro, this message translates to:
  /// **'Următoarea întrebare'**
  String get nextQuestion;

  /// No description provided for @finishRound.
  ///
  /// In ro, this message translates to:
  /// **'Vezi rezultatul'**
  String get finishRound;

  /// No description provided for @answerSubmitError.
  ///
  /// In ro, this message translates to:
  /// **'Verdictul nu a putut fi obținut. Atacul tău este păstrat.'**
  String get answerSubmitError;

  /// No description provided for @retryAnswer.
  ///
  /// In ro, this message translates to:
  /// **'Retrimite atacul'**
  String get retryAnswer;

  /// No description provided for @leaveBattleTitle.
  ///
  /// In ro, this message translates to:
  /// **'Abandonezi asaltul?'**
  String get leaveBattleTitle;

  /// No description provided for @leaveBattleBody.
  ///
  /// In ro, this message translates to:
  /// **'Progresul acestui asalt se pierde, iar ținutul rămâne necucerit.'**
  String get leaveBattleBody;

  /// No description provided for @leaveBattleConfirm.
  ///
  /// In ro, this message translates to:
  /// **'Abandonează'**
  String get leaveBattleConfirm;

  /// No description provided for @leaveBattleCancel.
  ///
  /// In ro, this message translates to:
  /// **'Continuă lupta'**
  String get leaveBattleCancel;

  /// No description provided for @resultVictoryTitle.
  ///
  /// In ro, this message translates to:
  /// **'Ținut cucerit'**
  String get resultVictoryTitle;

  /// No description provided for @resultDefeatTitle.
  ///
  /// In ro, this message translates to:
  /// **'Asalt respins'**
  String get resultDefeatTitle;

  /// No description provided for @resultVictoryBody.
  ///
  /// In ro, this message translates to:
  /// **'Steagul tău flutură peste {chapter}.'**
  String resultVictoryBody(String chapter);

  /// No description provided for @resultDefeatBody.
  ///
  /// In ro, this message translates to:
  /// **'Zidurile au ținut. Reia asaltul când ești pregătit.'**
  String get resultDefeatBody;

  /// No description provided for @resultScoreLabel.
  ///
  /// In ro, this message translates to:
  /// **'SCOR'**
  String get resultScoreLabel;

  /// No description provided for @resultAnswersLabel.
  ///
  /// In ro, this message translates to:
  /// **'CORECTE'**
  String get resultAnswersLabel;

  /// No description provided for @resultStreakLabel.
  ///
  /// In ro, this message translates to:
  /// **'SERIE MAXIMĂ'**
  String get resultStreakLabel;

  /// No description provided for @resultAnswers.
  ///
  /// In ro, this message translates to:
  /// **'{correct}/{total}'**
  String resultAnswers(int correct, int total);

  /// No description provided for @resultXpGained.
  ///
  /// In ro, this message translates to:
  /// **'+{xp} XP'**
  String resultXpGained(int xp);

  /// No description provided for @resultLevelUp.
  ///
  /// In ro, this message translates to:
  /// **'Nivel de cont nou: {level}!'**
  String resultLevelUp(int level);

  /// No description provided for @resultChapterCleared.
  ///
  /// In ro, this message translates to:
  /// **'Ai cucerit tot ținutul!'**
  String get resultChapterCleared;

  /// No description provided for @actionRetryStage.
  ///
  /// In ro, this message translates to:
  /// **'Reia asaltul'**
  String get actionRetryStage;

  /// No description provided for @actionNextStage.
  ///
  /// In ro, this message translates to:
  /// **'Asaltul următor'**
  String get actionNextStage;

  /// No description provided for @actionBackToMap.
  ///
  /// In ro, this message translates to:
  /// **'Înapoi la hartă'**
  String get actionBackToMap;

  /// No description provided for @starsSemantics.
  ///
  /// In ro, this message translates to:
  /// **'{earned} din {total} stele'**
  String starsSemantics(int earned, int total);

  /// No description provided for @menuDuel.
  ///
  /// In ro, this message translates to:
  /// **'Duel online'**
  String get menuDuel;

  /// No description provided for @menuLeaderboard.
  ///
  /// In ro, this message translates to:
  /// **'Clasament'**
  String get menuLeaderboard;

  /// No description provided for @leaderboardTitle.
  ///
  /// In ro, this message translates to:
  /// **'Clasamentul regatului'**
  String get leaderboardTitle;

  /// No description provided for @leaderboardPlayerCount.
  ///
  /// In ro, this message translates to:
  /// **'{total} jucători clasați'**
  String leaderboardPlayerCount(int total);

  /// No description provided for @leaderboardEmpty.
  ///
  /// In ro, this message translates to:
  /// **'Nu s-a clasat încă nimeni. Joacă un duel ca să deschizi clasamentul.'**
  String get leaderboardEmpty;

  /// No description provided for @leaderboardYourPlace.
  ///
  /// In ro, this message translates to:
  /// **'LOCUL TĂU'**
  String get leaderboardYourPlace;

  /// No description provided for @leaderboardPositionLine.
  ///
  /// In ro, this message translates to:
  /// **'Locul {position} • {matches} partide'**
  String leaderboardPositionLine(int position, int matches);

  /// No description provided for @leaderboardRowSemantics.
  ///
  /// In ro, this message translates to:
  /// **'Locul {position}, {username}, {rank}'**
  String leaderboardRowSemantics(int position, String username, String rank);

  /// No description provided for @leaderboardErrorTitle.
  ///
  /// In ro, this message translates to:
  /// **'Clasamentul nu a putut fi citit'**
  String get leaderboardErrorTitle;

  /// No description provided for @leaderboardErrorBody.
  ///
  /// In ro, this message translates to:
  /// **'Serverul nu răspunde. Clasamentul are nevoie de conexiune.'**
  String get leaderboardErrorBody;

  /// No description provided for @rankSemantics.
  ///
  /// In ro, this message translates to:
  /// **'Rang {rank}, {elo} puncte'**
  String rankSemantics(String rank, int elo);

  /// No description provided for @rankToNext.
  ///
  /// In ro, this message translates to:
  /// **'Încă {points} puncte până la treapta următoare'**
  String rankToNext(int points);

  /// No description provided for @rankTopReached.
  ///
  /// In ro, this message translates to:
  /// **'Ai atins treapta de vârf a regatului'**
  String get rankTopReached;

  /// No description provided for @duelRankUpdated.
  ///
  /// In ro, this message translates to:
  /// **'Rang: {rank}'**
  String duelRankUpdated(String rank);

  /// No description provided for @duelTitle.
  ///
  /// In ro, this message translates to:
  /// **'Duel 1v1'**
  String get duelTitle;

  /// No description provided for @duelConnecting.
  ///
  /// In ro, this message translates to:
  /// **'Ne conectăm la regat…'**
  String get duelConnecting;

  /// No description provided for @duelSearching.
  ///
  /// In ro, this message translates to:
  /// **'Căutăm un adversar'**
  String get duelSearching;

  /// No description provided for @duelSearchingHint.
  ///
  /// In ro, this message translates to:
  /// **'Rămâi pe recepție: prima rundă pornește imediat ce se găsește un adversar.'**
  String get duelSearchingHint;

  /// No description provided for @duelCancelSearch.
  ///
  /// In ro, this message translates to:
  /// **'Renunță la căutare'**
  String get duelCancelSearch;

  /// No description provided for @duelNeedAccountTitle.
  ///
  /// In ro, this message translates to:
  /// **'Duelul cere un cont'**
  String get duelNeedAccountTitle;

  /// No description provided for @duelNeedAccountBody.
  ///
  /// In ro, this message translates to:
  /// **'Partidele online se joacă autentificat, ca rezultatele să poată intra în clasament.'**
  String get duelNeedAccountBody;

  /// No description provided for @duelGoToAccount.
  ///
  /// In ro, this message translates to:
  /// **'Deschide contul'**
  String get duelGoToAccount;

  /// No description provided for @duelRoundCounter.
  ///
  /// In ro, this message translates to:
  /// **'Runda {current} din {total}'**
  String duelRoundCounter(int current, int total);

  /// No description provided for @duelYou.
  ///
  /// In ro, this message translates to:
  /// **'TU'**
  String get duelYou;

  /// No description provided for @duelOpponent.
  ///
  /// In ro, this message translates to:
  /// **'ADVERSAR'**
  String get duelOpponent;

  /// No description provided for @duelWaitingOpponent.
  ///
  /// In ro, this message translates to:
  /// **'Adversarul încă răspunde…'**
  String get duelWaitingOpponent;

  /// No description provided for @duelAnswerSent.
  ///
  /// In ro, this message translates to:
  /// **'Atac trimis'**
  String get duelAnswerSent;

  /// No description provided for @duelRoundWon.
  ///
  /// In ro, this message translates to:
  /// **'Ai cucerit teritoriul!'**
  String get duelRoundWon;

  /// No description provided for @duelRoundLost.
  ///
  /// In ro, this message translates to:
  /// **'Teritoriul a fost pierdut'**
  String get duelRoundLost;

  /// No description provided for @duelRoundNeutral.
  ///
  /// In ro, this message translates to:
  /// **'Niciun teritoriu cucerit'**
  String get duelRoundNeutral;

  /// No description provided for @duelNextRound.
  ///
  /// In ro, this message translates to:
  /// **'Runda următoare pornește…'**
  String get duelNextRound;

  /// No description provided for @duelNoAnswer.
  ///
  /// In ro, this message translates to:
  /// **'fără răspuns'**
  String get duelNoAnswer;

  /// No description provided for @duelVictory.
  ///
  /// In ro, this message translates to:
  /// **'Victorie'**
  String get duelVictory;

  /// No description provided for @duelDefeat.
  ///
  /// In ro, this message translates to:
  /// **'Înfrângere'**
  String get duelDefeat;

  /// No description provided for @duelDraw.
  ///
  /// In ro, this message translates to:
  /// **'Egalitate'**
  String get duelDraw;

  /// No description provided for @duelFinalLine.
  ///
  /// In ro, this message translates to:
  /// **'{score} puncte • {territories} teritorii'**
  String duelFinalLine(int score, int territories);

  /// No description provided for @duelRematch.
  ///
  /// In ro, this message translates to:
  /// **'Caută alt duel'**
  String get duelRematch;

  /// No description provided for @duelLeave.
  ///
  /// In ro, this message translates to:
  /// **'Ieși din duel'**
  String get duelLeave;

  /// No description provided for @duelDisconnectedTitle.
  ///
  /// In ro, this message translates to:
  /// **'Conexiunea s-a pierdut'**
  String get duelDisconnectedTitle;

  /// No description provided for @duelDisconnectedBody.
  ///
  /// In ro, this message translates to:
  /// **'Serverul de partide nu mai răspunde. Poți încerca din nou.'**
  String get duelDisconnectedBody;

  /// No description provided for @duelServerErrorTitle.
  ///
  /// In ro, this message translates to:
  /// **'Partida a fost oprită'**
  String get duelServerErrorTitle;

  /// No description provided for @duelVerifyEmailTitle.
  ///
  /// In ro, this message translates to:
  /// **'Confirmă-ți adresa de email'**
  String get duelVerifyEmailTitle;

  /// No description provided for @duelVerifyEmailBody.
  ///
  /// In ro, this message translates to:
  /// **'Duelurile clasate cer un cont verificat. Deschide linkul pe care ți l-am trimis pe email, apoi încearcă din nou.'**
  String get duelVerifyEmailBody;

  /// No description provided for @duelVerifyEmailAction.
  ///
  /// In ro, this message translates to:
  /// **'Retrimite linkul'**
  String get duelVerifyEmailAction;

  /// No description provided for @duelVerifyEmailSending.
  ///
  /// In ro, this message translates to:
  /// **'Se trimite…'**
  String get duelVerifyEmailSending;

  /// No description provided for @duelVerifyEmailSent.
  ///
  /// In ro, this message translates to:
  /// **'Ți-am trimis un link nou de confirmare.'**
  String get duelVerifyEmailSent;

  /// No description provided for @duelVerifyEmailFailed.
  ///
  /// In ro, this message translates to:
  /// **'Nu am putut trimite emailul. Încearcă mai târziu.'**
  String get duelVerifyEmailFailed;

  /// No description provided for @duelAccountRestrictedTitle.
  ///
  /// In ro, this message translates to:
  /// **'Cont restricționat'**
  String get duelAccountRestrictedTitle;

  /// No description provided for @duelAccountRestrictedBody.
  ///
  /// In ro, this message translates to:
  /// **'Contul tău nu poate intra acum în duelurile clasate.'**
  String get duelAccountRestrictedBody;

  /// No description provided for @duelReconnectingTitle.
  ///
  /// In ro, this message translates to:
  /// **'Te reconectăm la partidă'**
  String get duelReconnectingTitle;

  /// No description provided for @duelReconnectingBody.
  ///
  /// In ro, this message translates to:
  /// **'Locul îți este păstrat. Rămâi pe recepție câteva secunde.'**
  String get duelReconnectingBody;

  /// No description provided for @duelOpponentAwayTitle.
  ///
  /// In ro, this message translates to:
  /// **'Adversarul a pierdut legătura'**
  String get duelOpponentAwayTitle;

  /// No description provided for @duelOpponentAwayBody.
  ///
  /// In ro, this message translates to:
  /// **'{seconds, plural, =1{Mai are o secundă să revină.} other{Mai are {seconds} secunde să revină.}}'**
  String duelOpponentAwayBody(int seconds);

  /// No description provided for @duelOpponentAwayExpired.
  ///
  /// In ro, this message translates to:
  /// **'Timpul de revenire a expirat. Partida se închide.'**
  String get duelOpponentAwayExpired;

  /// No description provided for @duelWonByForfeit.
  ///
  /// In ro, this message translates to:
  /// **'Adversarul nu s-a mai întors în partidă.'**
  String get duelWonByForfeit;

  /// No description provided for @matchChatOpen.
  ///
  /// In ro, this message translates to:
  /// **'Deschide chatul de luptă'**
  String get matchChatOpen;

  /// No description provided for @matchChatTitle.
  ///
  /// In ro, this message translates to:
  /// **'Cronica luptei'**
  String get matchChatTitle;

  /// No description provided for @matchChatEphemeral.
  ///
  /// In ro, this message translates to:
  /// **'Mesajele acestei partide dispar după luptă.'**
  String get matchChatEphemeral;

  /// No description provided for @matchChatEmpty.
  ///
  /// In ro, this message translates to:
  /// **'Pergamentul este gol. Trimite o reacție adversarului.'**
  String get matchChatEmpty;

  /// No description provided for @matchChatReactions.
  ///
  /// In ro, this message translates to:
  /// **'REACȚII RAPIDE'**
  String get matchChatReactions;

  /// No description provided for @matchReactionGoodLuck.
  ///
  /// In ro, this message translates to:
  /// **'Mult noroc!'**
  String get matchReactionGoodLuck;

  /// No description provided for @matchReactionNiceMove.
  ///
  /// In ro, this message translates to:
  /// **'Mișcare bună!'**
  String get matchReactionNiceMove;

  /// No description provided for @matchReactionWow.
  ///
  /// In ro, this message translates to:
  /// **'Uau!'**
  String get matchReactionWow;

  /// No description provided for @matchReactionWellPlayed.
  ///
  /// In ro, this message translates to:
  /// **'Bine jucat!'**
  String get matchReactionWellPlayed;

  /// No description provided for @matchChatHint.
  ///
  /// In ro, this message translates to:
  /// **'Scrie un mesaj de luptă…'**
  String get matchChatHint;

  /// No description provided for @matchChatSend.
  ///
  /// In ro, this message translates to:
  /// **'Trimite mesajul'**
  String get matchChatSend;

  /// No description provided for @matchChatTextLocked.
  ///
  /// In ro, this message translates to:
  /// **'Textul liber se deblochează după 10 răspunsuri corecte. Reacțiile rămân disponibile.'**
  String get matchChatTextLocked;

  /// No description provided for @matchChatMuted.
  ///
  /// In ro, this message translates to:
  /// **'Chatul tău este temporar restricționat.'**
  String get matchChatMuted;

  /// No description provided for @matchChatTooFast.
  ///
  /// In ro, this message translates to:
  /// **'Prea multe mesaje. Așteaptă câteva secunde.'**
  String get matchChatTooFast;

  /// No description provided for @matchChatLinksLocked.
  ///
  /// In ro, this message translates to:
  /// **'Linkurile se deblochează la o treaptă de încredere mai mare.'**
  String get matchChatLinksLocked;

  /// No description provided for @matchChatClosed.
  ///
  /// In ro, this message translates to:
  /// **'Chatul acestei partide s-a închis.'**
  String get matchChatClosed;

  /// No description provided for @matchChatInvalid.
  ///
  /// In ro, this message translates to:
  /// **'Mesajul nu a putut fi trimis.'**
  String get matchChatInvalid;

  /// No description provided for @loginEyebrow.
  ///
  /// In ro, this message translates to:
  /// **'CONT DE JUCĂTOR'**
  String get loginEyebrow;

  /// No description provided for @loginTitle.
  ///
  /// In ro, this message translates to:
  /// **'Păstrează-ți cuceririle pe orice dispozitiv.'**
  String get loginTitle;

  /// No description provided for @accountOptionalNote.
  ///
  /// In ro, this message translates to:
  /// **'Contul este opțional — campania se joacă și fără el.'**
  String get accountOptionalNote;

  /// No description provided for @emailLabel.
  ///
  /// In ro, this message translates to:
  /// **'E-mail'**
  String get emailLabel;

  /// No description provided for @passwordLabel.
  ///
  /// In ro, this message translates to:
  /// **'Parolă'**
  String get passwordLabel;

  /// No description provided for @usernameLabel.
  ///
  /// In ro, this message translates to:
  /// **'Nume de jucător'**
  String get usernameLabel;

  /// No description provided for @loginButton.
  ///
  /// In ro, this message translates to:
  /// **'Intră în regat'**
  String get loginButton;

  /// No description provided for @continueWithGoogle.
  ///
  /// In ro, this message translates to:
  /// **'Continuă cu Google'**
  String get continueWithGoogle;

  /// No description provided for @createAccountButton.
  ///
  /// In ro, this message translates to:
  /// **'Creează contul'**
  String get createAccountButton;

  /// No description provided for @switchToRegister.
  ///
  /// In ro, this message translates to:
  /// **'Nu ai cont? Creează unul'**
  String get switchToRegister;

  /// No description provided for @switchToLogin.
  ///
  /// In ro, this message translates to:
  /// **'Ai deja cont? Autentifică-te'**
  String get switchToLogin;

  /// No description provided for @authGenericError.
  ///
  /// In ro, this message translates to:
  /// **'Autentificarea nu a reușit. Verifică datele și conexiunea.'**
  String get authGenericError;

  /// No description provided for @twoFactorTitle.
  ///
  /// In ro, this message translates to:
  /// **'Confirmă autentificarea'**
  String get twoFactorTitle;

  /// No description provided for @twoFactorBody.
  ///
  /// In ro, this message translates to:
  /// **'Introdu codul din aplicația de autentificare sau unul dintre codurile tale de recuperare.'**
  String get twoFactorBody;

  /// No description provided for @twoFactorCodeLabel.
  ///
  /// In ro, this message translates to:
  /// **'Cod de autentificare'**
  String get twoFactorCodeLabel;

  /// No description provided for @twoFactorVerify.
  ///
  /// In ro, this message translates to:
  /// **'Confirmă codul'**
  String get twoFactorVerify;

  /// No description provided for @twoFactorCancel.
  ///
  /// In ro, this message translates to:
  /// **'Înapoi la autentificare'**
  String get twoFactorCancel;

  /// No description provided for @twoFactorInvalid.
  ///
  /// In ro, this message translates to:
  /// **'Codul nu a fost acceptat. Încearcă din nou.'**
  String get twoFactorInvalid;

  /// No description provided for @forgotPassword.
  ///
  /// In ro, this message translates to:
  /// **'Ai uitat parola?'**
  String get forgotPassword;

  /// No description provided for @passwordResetTitle.
  ///
  /// In ro, this message translates to:
  /// **'Resetează parola'**
  String get passwordResetTitle;

  /// No description provided for @passwordResetBody.
  ///
  /// In ro, this message translates to:
  /// **'Vom trimite un link de resetare dacă adresa poate fi folosită pentru un cont.'**
  String get passwordResetBody;

  /// No description provided for @passwordResetSend.
  ///
  /// In ro, this message translates to:
  /// **'Trimite linkul'**
  String get passwordResetSend;

  /// No description provided for @passwordResetSent.
  ///
  /// In ro, this message translates to:
  /// **'Dacă adresa este asociată unui cont, vei primi un link de resetare.'**
  String get passwordResetSent;

  /// No description provided for @fieldRequired.
  ///
  /// In ro, this message translates to:
  /// **'Acest câmp este obligatoriu.'**
  String get fieldRequired;

  /// No description provided for @passwordHint.
  ///
  /// In ro, this message translates to:
  /// **'Minimum 10 caractere'**
  String get passwordHint;

  /// No description provided for @birthDateLabel.
  ///
  /// In ro, this message translates to:
  /// **'Data nașterii'**
  String get birthDateLabel;

  /// No description provided for @birthDatePick.
  ///
  /// In ro, this message translates to:
  /// **'Alege data'**
  String get birthDatePick;

  /// No description provided for @birthDateHint.
  ///
  /// In ro, this message translates to:
  /// **'Ne asigurăm că jocul e potrivit vârstei tale.'**
  String get birthDateHint;

  /// No description provided for @birthDateTooYoung.
  ///
  /// In ro, this message translates to:
  /// **'Trebuie să ai cel puțin {years} ani ca să-ți creezi cont.'**
  String birthDateTooYoung(int years);

  /// No description provided for @logout.
  ///
  /// In ro, this message translates to:
  /// **'Deconectare'**
  String get logout;

  /// No description provided for @backLabel.
  ///
  /// In ro, this message translates to:
  /// **'Înapoi'**
  String get backLabel;

  /// No description provided for @socialTitle.
  ///
  /// In ro, this message translates to:
  /// **'Prieteni și mesaje'**
  String get socialTitle;

  /// No description provided for @socialTabFriends.
  ///
  /// In ro, this message translates to:
  /// **'Prieteni'**
  String get socialTabFriends;

  /// No description provided for @socialTabMessages.
  ///
  /// In ro, this message translates to:
  /// **'Mesaje'**
  String get socialTabMessages;

  /// No description provided for @socialNeedAccountTitle.
  ///
  /// In ro, this message translates to:
  /// **'Partea socială cere un cont'**
  String get socialNeedAccountTitle;

  /// No description provided for @socialNeedAccountBody.
  ///
  /// In ro, this message translates to:
  /// **'Autentifică-te ca să ai prieteni, conversații și chat.'**
  String get socialNeedAccountBody;

  /// No description provided for @socialErrorTitle.
  ///
  /// In ro, this message translates to:
  /// **'Nu am putut încărca partea socială'**
  String get socialErrorTitle;

  /// No description provided for @friendsAddHint.
  ///
  /// In ro, this message translates to:
  /// **'Nume de utilizator'**
  String get friendsAddHint;

  /// No description provided for @friendsAddAction.
  ///
  /// In ro, this message translates to:
  /// **'Trimite cerere'**
  String get friendsAddAction;

  /// No description provided for @friendsIncomingRequests.
  ///
  /// In ro, this message translates to:
  /// **'Cereri primite'**
  String get friendsIncomingRequests;

  /// No description provided for @friendsOutgoingRequests.
  ///
  /// In ro, this message translates to:
  /// **'Cereri trimise'**
  String get friendsOutgoingRequests;

  /// No description provided for @friendsRequestSent.
  ///
  /// In ro, this message translates to:
  /// **'În așteptare'**
  String get friendsRequestSent;

  /// No description provided for @friendsListTitle.
  ///
  /// In ro, this message translates to:
  /// **'Prietenii tăi'**
  String get friendsListTitle;

  /// No description provided for @friendsEmpty.
  ///
  /// In ro, this message translates to:
  /// **'Încă nu ai prieteni. Caută pe cineva după numele de utilizator.'**
  String get friendsEmpty;

  /// No description provided for @friendsAccept.
  ///
  /// In ro, this message translates to:
  /// **'Acceptă'**
  String get friendsAccept;

  /// No description provided for @friendsDecline.
  ///
  /// In ro, this message translates to:
  /// **'Refuză'**
  String get friendsDecline;

  /// No description provided for @friendsOpenChat.
  ///
  /// In ro, this message translates to:
  /// **'Deschide conversația'**
  String get friendsOpenChat;

  /// No description provided for @friendsBlock.
  ///
  /// In ro, this message translates to:
  /// **'Blochează'**
  String get friendsBlock;

  /// No description provided for @friendsBlockTitle.
  ///
  /// In ro, this message translates to:
  /// **'Blochezi jucătorul?'**
  String get friendsBlockTitle;

  /// No description provided for @friendsBlockBody.
  ///
  /// In ro, this message translates to:
  /// **'{name} nu îți va mai putea scrie, iar prietenia se desface.'**
  String friendsBlockBody(String name);

  /// No description provided for @conversationsTitle.
  ///
  /// In ro, this message translates to:
  /// **'Conversații'**
  String get conversationsTitle;

  /// No description provided for @conversationsEmpty.
  ///
  /// In ro, this message translates to:
  /// **'Nicio conversație deocamdată.'**
  String get conversationsEmpty;

  /// No description provided for @conversationEmpty.
  ///
  /// In ro, this message translates to:
  /// **'Scrie primul mesaj.'**
  String get conversationEmpty;

  /// No description provided for @messageRequestsTitle.
  ///
  /// In ro, this message translates to:
  /// **'Cereri de mesaj'**
  String get messageRequestsTitle;

  /// No description provided for @messageRequestsExplainer.
  ///
  /// In ro, this message translates to:
  /// **'Cineva care nu îți e prieten vrea să-ți scrie. Acceptă doar dacă vrei să continui.'**
  String get messageRequestsExplainer;

  /// No description provided for @messageRequestAccept.
  ///
  /// In ro, this message translates to:
  /// **'Acceptă cererea'**
  String get messageRequestAccept;

  /// No description provided for @chatComposerHint.
  ///
  /// In ro, this message translates to:
  /// **'Scrie un mesaj…'**
  String get chatComposerHint;

  /// No description provided for @chatSend.
  ///
  /// In ro, this message translates to:
  /// **'Trimite'**
  String get chatSend;

  /// No description provided for @chatMutedNotice.
  ///
  /// In ro, this message translates to:
  /// **'Chatul îți este oprit temporar din cauza mesajelor repetate.'**
  String get chatMutedNotice;

  /// No description provided for @chatReportTitle.
  ///
  /// In ro, this message translates to:
  /// **'Raportează mesajul'**
  String get chatReportTitle;

  /// No description provided for @chatReportHint.
  ///
  /// In ro, this message translates to:
  /// **'Ce e în neregulă?'**
  String get chatReportHint;

  /// No description provided for @chatReportSend.
  ///
  /// In ro, this message translates to:
  /// **'Trimite raportul'**
  String get chatReportSend;

  /// No description provided for @chatReportSent.
  ///
  /// In ro, this message translates to:
  /// **'Raportul a fost trimis.'**
  String get chatReportSent;

  /// No description provided for @privacyTitle.
  ///
  /// In ro, this message translates to:
  /// **'Confidențialitate'**
  String get privacyTitle;

  /// No description provided for @privacyDmTitle.
  ///
  /// In ro, this message translates to:
  /// **'Cine îți poate scrie direct'**
  String get privacyDmTitle;

  /// No description provided for @privacyDmLocked.
  ///
  /// In ro, this message translates to:
  /// **'Conturile de minor primesc mesaje directe doar de la prieteni.'**
  String get privacyDmLocked;

  /// No description provided for @privacyDmEveryone.
  ///
  /// In ro, this message translates to:
  /// **'Oricine'**
  String get privacyDmEveryone;

  /// No description provided for @privacyDmFriends.
  ///
  /// In ro, this message translates to:
  /// **'Doar prietenii'**
  String get privacyDmFriends;

  /// No description provided for @privacyDmNobody.
  ///
  /// In ro, this message translates to:
  /// **'Nimeni'**
  String get privacyDmNobody;

  /// No description provided for @trustCorrectAnswers.
  ///
  /// In ro, this message translates to:
  /// **'{count} corecte'**
  String trustCorrectAnswers(int count);

  /// No description provided for @trustAnswersToNextTier.
  ///
  /// In ro, this message translates to:
  /// **'Încă {count} răspunsuri corecte până la treapta următoare.'**
  String trustAnswersToNextTier(int count);

  /// No description provided for @trustMaxTier.
  ///
  /// In ro, this message translates to:
  /// **'Ai atins ultima treaptă de încredere.'**
  String get trustMaxTier;

  /// No description provided for @trustTierNewcomer.
  ///
  /// In ro, this message translates to:
  /// **'Nou'**
  String get trustTierNewcomer;

  /// No description provided for @trustTierApprentice.
  ///
  /// In ro, this message translates to:
  /// **'Ucenic'**
  String get trustTierApprentice;

  /// No description provided for @trustTierContributor.
  ///
  /// In ro, this message translates to:
  /// **'Contribuitor'**
  String get trustTierContributor;

  /// No description provided for @trustTierEstablished.
  ///
  /// In ro, this message translates to:
  /// **'Stabilit'**
  String get trustTierEstablished;

  /// No description provided for @trustTierExperienced.
  ///
  /// In ro, this message translates to:
  /// **'Experimentat'**
  String get trustTierExperienced;

  /// No description provided for @trustTierExpert.
  ///
  /// In ro, this message translates to:
  /// **'Expert'**
  String get trustTierExpert;

  /// No description provided for @trustTierCommunityMaster.
  ///
  /// In ro, this message translates to:
  /// **'Maestru al comunității'**
  String get trustTierCommunityMaster;

  /// No description provided for @trustTierElite.
  ///
  /// In ro, this message translates to:
  /// **'Elită'**
  String get trustTierElite;

  /// No description provided for @trustTierCommunityLegend.
  ///
  /// In ro, this message translates to:
  /// **'Legendă a comunității'**
  String get trustTierCommunityLegend;

  /// No description provided for @homeGuestTitle.
  ///
  /// In ro, this message translates to:
  /// **'Joci fără cont'**
  String get homeGuestTitle;

  /// No description provided for @homeGuestAction.
  ///
  /// In ro, this message translates to:
  /// **'Deschide cont'**
  String get homeGuestAction;

  /// No description provided for @homeLoadingProfile.
  ///
  /// In ro, this message translates to:
  /// **'Se încarcă profilul…'**
  String get homeLoadingProfile;

  /// No description provided for @homeCoins.
  ///
  /// In ro, this message translates to:
  /// **'{count} monede'**
  String homeCoins(int count);

  /// No description provided for @homeContinueEyebrow.
  ///
  /// In ro, this message translates to:
  /// **'Continuă cucerirea'**
  String get homeContinueEyebrow;

  /// No description provided for @homeStartEyebrow.
  ///
  /// In ro, this message translates to:
  /// **'Primul ținut'**
  String get homeStartEyebrow;

  /// No description provided for @homeRealmsTitle.
  ///
  /// In ro, this message translates to:
  /// **'Ținuturile regatului'**
  String get homeRealmsTitle;

  /// No description provided for @homeRealmsAction.
  ///
  /// In ro, this message translates to:
  /// **'Vezi harta'**
  String get homeRealmsAction;

  /// No description provided for @homeRankPosition.
  ///
  /// In ro, this message translates to:
  /// **'Locul {position}'**
  String homeRankPosition(int position);

  /// No description provided for @homeMatchesPlayed.
  ///
  /// In ro, this message translates to:
  /// **'{count} partide online'**
  String homeMatchesPlayed(int count);

  /// No description provided for @homeDuelLocked.
  ///
  /// In ro, this message translates to:
  /// **'Cere email confirmat'**
  String get homeDuelLocked;

  /// Tablou de bord acasa
  ///
  /// In ro, this message translates to:
  /// **'Acasă'**
  String get navHome;

  /// Tablou de bord acasa
  ///
  /// In ro, this message translates to:
  /// **'Campanie'**
  String get navCampaign;

  /// Tablou de bord acasa
  ///
  /// In ro, this message translates to:
  /// **'Chat'**
  String get navChat;

  /// Tablou de bord acasa
  ///
  /// In ro, this message translates to:
  /// **'Clasament'**
  String get navRanking;

  /// Tablou de bord acasa
  ///
  /// In ro, this message translates to:
  /// **'Multiplayer'**
  String get navMultiplayer;

  /// Tablou de bord acasa
  ///
  /// In ro, this message translates to:
  /// **'Profil'**
  String get navProfile;

  /// Tablou de bord acasa
  ///
  /// In ro, this message translates to:
  /// **'Setări'**
  String get navSettings;

  /// Tablou de bord acasa
  ///
  /// In ro, this message translates to:
  /// **'Meniu'**
  String get homeMenu;

  /// No description provided for @homeCrystals.
  ///
  /// In ro, this message translates to:
  /// **'{count} cristale'**
  String homeCrystals(int count);

  /// Tablou de bord acasa
  ///
  /// In ro, this message translates to:
  /// **'Campanie'**
  String get homeModeCampaign;

  /// Tablou de bord acasa
  ///
  /// In ro, this message translates to:
  /// **'Progresează și cucerește noi teritorii.'**
  String get homeModeCampaignDesc;

  /// Tablou de bord acasa
  ///
  /// In ro, this message translates to:
  /// **'Multiplayer'**
  String get homeModeMultiplayer;

  /// Tablou de bord acasa
  ///
  /// In ro, this message translates to:
  /// **'Provoacă jucători din toată lumea.'**
  String get homeModeMultiplayerDesc;

  /// Tablou de bord acasa
  ///
  /// In ro, this message translates to:
  /// **'Chat'**
  String get homeModeChat;

  /// Tablou de bord acasa
  ///
  /// In ro, this message translates to:
  /// **'Discută cu aliații și prietenii tăi.'**
  String get homeModeChatDesc;

  /// Tablou de bord acasa
  ///
  /// In ro, this message translates to:
  /// **'Clasament'**
  String get homeModeRanking;

  /// Tablou de bord acasa
  ///
  /// In ro, this message translates to:
  /// **'Vezi cei mai buni strategi de pe tărâm.'**
  String get homeModeRankingDesc;

  /// Tablou de bord acasa
  ///
  /// In ro, this message translates to:
  /// **'Progres recent'**
  String get homeRecentProgress;

  /// Tablou de bord acasa
  ///
  /// In ro, this message translates to:
  /// **'Continuă'**
  String get homeContinue;

  /// Tablou de bord acasa
  ///
  /// In ro, this message translates to:
  /// **'Regatul tău'**
  String get homeKingdomTitle;

  /// Tablou de bord acasa
  ///
  /// In ro, this message translates to:
  /// **'Teritorii'**
  String get homeKingdomTerritories;

  /// Tablou de bord acasa
  ///
  /// In ro, this message translates to:
  /// **'Stele'**
  String get homeKingdomStars;

  /// Tablou de bord acasa
  ///
  /// In ro, this message translates to:
  /// **'Partide online'**
  String get homeKingdomMatches;

  /// Tablou de bord acasa
  ///
  /// In ro, this message translates to:
  /// **'Cuceritor de Întrebări'**
  String get homePlayerTitleDefault;

  /// Ecranul de setari
  ///
  /// In ro, this message translates to:
  /// **'Setări'**
  String get settingsTitle;

  /// Ecranul de setari
  ///
  /// In ro, this message translates to:
  /// **'Cont'**
  String get settingsAccount;

  /// Ecranul de setari
  ///
  /// In ro, this message translates to:
  /// **'ID Cont'**
  String get settingsAccountId;

  /// Ecranul de setari
  ///
  /// In ro, this message translates to:
  /// **'ID-ul contului a fost copiat.'**
  String get settingsAccountIdCopied;

  /// Ecranul de setari
  ///
  /// In ro, this message translates to:
  /// **'Conectat prin email'**
  String get settingsConnectedEmail;

  /// Ecranul de setari
  ///
  /// In ro, this message translates to:
  /// **'Schimbă parola'**
  String get settingsChangePassword;

  /// Ecranul de setari
  ///
  /// In ro, this message translates to:
  /// **'Nu ești autentificat'**
  String get settingsGuestTitle;

  /// Ecranul de setari
  ///
  /// In ro, this message translates to:
  /// **'Setările se păstrează pe acest dispozitiv și fără cont.'**
  String get settingsGuestBody;

  /// Ecranul de setari
  ///
  /// In ro, this message translates to:
  /// **'Sunet'**
  String get settingsSound;

  /// Ecranul de setari
  ///
  /// In ro, this message translates to:
  /// **'Muzică'**
  String get settingsMusic;

  /// Ecranul de setari
  ///
  /// In ro, this message translates to:
  /// **'Efecte'**
  String get settingsEffects;

  /// Ecranul de setari
  ///
  /// In ro, this message translates to:
  /// **'Vibrație'**
  String get settingsVibration;

  /// Ecranul de setari
  ///
  /// In ro, this message translates to:
  /// **'Notificări'**
  String get settingsNotifications;

  /// Ecranul de setari
  ///
  /// In ro, this message translates to:
  /// **'Notificări push'**
  String get settingsPush;

  /// Ecranul de setari
  ///
  /// In ro, this message translates to:
  /// **'Primește notificări despre recompense și evenimente.'**
  String get settingsPushDesc;

  /// Ecranul de setari
  ///
  /// In ro, this message translates to:
  /// **'Joc'**
  String get settingsGameplay;

  /// Ecranul de setari
  ///
  /// In ro, this message translates to:
  /// **'Confirmarea acțiunilor'**
  String get settingsConfirmActions;

  /// Ecranul de setari
  ///
  /// In ro, this message translates to:
  /// **'Cere confirmare pentru acțiuni importante.'**
  String get settingsConfirmActionsDesc;

  /// Ecranul de setari
  ///
  /// In ro, this message translates to:
  /// **'Tutoriale'**
  String get settingsTutorials;

  /// Ecranul de setari
  ///
  /// In ro, this message translates to:
  /// **'Afișează sfaturi și tutoriale în joc.'**
  String get settingsTutorialsDesc;

  /// Ecranul de setari
  ///
  /// In ro, this message translates to:
  /// **'Economisire resurse'**
  String get settingsDataSaver;

  /// Ecranul de setari
  ///
  /// In ro, this message translates to:
  /// **'Reduce consumul de date și de baterie.'**
  String get settingsDataSaverDesc;

  /// Ecranul de setari
  ///
  /// In ro, this message translates to:
  /// **'Limbă și aspect'**
  String get settingsLanguageSection;

  /// Ecranul de setari
  ///
  /// In ro, this message translates to:
  /// **'Limbă'**
  String get settingsLanguage;

  /// No description provided for @settingsVersion.
  ///
  /// In ro, this message translates to:
  /// **'Versiunea {version}'**
  String settingsVersion(String version);

  /// Ecranul de setari
  ///
  /// In ro, this message translates to:
  /// **'Deschide contul'**
  String get settingsOpenAccount;

  /// Eticheta nivelului de cont (owner-plan 7.3)
  ///
  /// In ro, this message translates to:
  /// **'Nivel de cont'**
  String get accountLevelLabel;

  /// Antrenament pe categorii
  ///
  /// In ro, this message translates to:
  /// **'Animale'**
  String get categoryAnimals;

  /// Antrenament pe categorii
  ///
  /// In ro, this message translates to:
  /// **'Artă'**
  String get categoryArt;

  /// Antrenament pe categorii
  ///
  /// In ro, this message translates to:
  /// **'Mașini'**
  String get categoryCars;

  /// Antrenament pe categorii
  ///
  /// In ro, this message translates to:
  /// **'Economie'**
  String get categoryEconomy;

  /// Antrenament pe categorii
  ///
  /// In ro, this message translates to:
  /// **'Gaming'**
  String get categoryGaming;

  /// Antrenament pe categorii
  ///
  /// In ro, this message translates to:
  /// **'Cultură generală'**
  String get categoryGeneralKnowledge;

  /// Antrenament pe categorii
  ///
  /// In ro, this message translates to:
  /// **'Geografie'**
  String get categoryGeography;

  /// Antrenament pe categorii
  ///
  /// In ro, this message translates to:
  /// **'Istorie'**
  String get categoryHistory;

  /// Antrenament pe categorii
  ///
  /// In ro, this message translates to:
  /// **'Literatură'**
  String get categoryLiterature;

  /// Antrenament pe categorii
  ///
  /// In ro, this message translates to:
  /// **'Logică'**
  String get categoryLogic;

  /// Antrenament pe categorii
  ///
  /// In ro, this message translates to:
  /// **'Medieval'**
  String get categoryMedieval;

  /// Antrenament pe categorii
  ///
  /// In ro, this message translates to:
  /// **'Filme'**
  String get categoryMovies;

  /// Antrenament pe categorii
  ///
  /// In ro, this message translates to:
  /// **'Muzică'**
  String get categoryMusic;

  /// Antrenament pe categorii
  ///
  /// In ro, this message translates to:
  /// **'Mitologie'**
  String get categoryMythology;

  /// Antrenament pe categorii
  ///
  /// In ro, this message translates to:
  /// **'Provocare regală'**
  String get categoryRoyalChallenge;

  /// Antrenament pe categorii
  ///
  /// In ro, this message translates to:
  /// **'Știință'**
  String get categoryScience;

  /// Antrenament pe categorii
  ///
  /// In ro, this message translates to:
  /// **'Spațiu'**
  String get categorySpace;

  /// Antrenament pe categorii
  ///
  /// In ro, this message translates to:
  /// **'Sport'**
  String get categorySports;

  /// Antrenament pe categorii
  ///
  /// In ro, this message translates to:
  /// **'Tehnologie'**
  String get categoryTechnology;

  /// Antrenament pe categorii
  ///
  /// In ro, this message translates to:
  /// **'Războaie'**
  String get categoryWars;

  /// Antrenament pe categorii
  ///
  /// In ro, this message translates to:
  /// **'Antrenament'**
  String get trainingTitle;

  /// Antrenament pe categorii
  ///
  /// In ro, this message translates to:
  /// **'Alege categoriile și exersează fără presiune.'**
  String get trainingSubtitle;

  /// Antrenament pe categorii
  ///
  /// In ro, this message translates to:
  /// **'Toate categoriile'**
  String get trainingSelectAll;

  /// Antrenament pe categorii
  ///
  /// In ro, this message translates to:
  /// **'Golește selecția'**
  String get trainingClear;

  /// No description provided for @trainingSelectedCount.
  ///
  /// In ro, this message translates to:
  /// **'{count} categorii alese'**
  String trainingSelectedCount(int count);

  /// No description provided for @trainingAllSelected.
  ///
  /// In ro, this message translates to:
  /// **'Toate cele {count} categorii'**
  String trainingAllSelected(int count);

  /// Antrenament pe categorii
  ///
  /// In ro, this message translates to:
  /// **'Începe runda'**
  String get trainingStart;

  /// Antrenament pe categorii
  ///
  /// In ro, this message translates to:
  /// **'Lungimea rundei'**
  String get trainingLength;

  /// Antrenament pe categorii
  ///
  /// In ro, this message translates to:
  /// **'Scurtă'**
  String get trainingLengthShort;

  /// Antrenament pe categorii
  ///
  /// In ro, this message translates to:
  /// **'Medie'**
  String get trainingLengthMedium;

  /// Antrenament pe categorii
  ///
  /// In ro, this message translates to:
  /// **'Lungă'**
  String get trainingLengthLong;

  /// Antrenament pe categorii
  ///
  /// In ro, this message translates to:
  /// **'Măiestrie'**
  String get trainingMastery;

  /// Antrenament pe categorii
  ///
  /// In ro, this message translates to:
  /// **'Neînceput'**
  String get trainingMasteryNone;

  /// Antrenament pe categorii
  ///
  /// In ro, this message translates to:
  /// **'Bronz'**
  String get trainingMasteryBronze;

  /// Antrenament pe categorii
  ///
  /// In ro, this message translates to:
  /// **'Argint'**
  String get trainingMasterySilver;

  /// Antrenament pe categorii
  ///
  /// In ro, this message translates to:
  /// **'Aur'**
  String get trainingMasteryGold;

  /// No description provided for @trainingCorrectOf.
  ///
  /// In ro, this message translates to:
  /// **'{correct} corecte din {answered}'**
  String trainingCorrectOf(int correct, int answered);

  /// Antrenament pe categorii
  ///
  /// In ro, this message translates to:
  /// **'Rundă încheiată'**
  String get trainingRoundDone;

  /// Antrenament pe categorii
  ///
  /// In ro, this message translates to:
  /// **'Încă o rundă'**
  String get trainingPlayAgain;

  /// Antrenament pe categorii
  ///
  /// In ro, this message translates to:
  /// **'Înapoi la categorii'**
  String get trainingBack;

  /// Antrenament pe categorii
  ///
  /// In ro, this message translates to:
  /// **'Nu am găsit întrebări pentru categoriile alese.'**
  String get trainingEmpty;

  /// Cartonasul de antrenament
  ///
  /// In ro, this message translates to:
  /// **'Exersează pe categoriile alese de tine.'**
  String get homeModeTrainingDesc;

  /// Ecranul de pregatire a meciului
  ///
  /// In ro, this message translates to:
  /// **'Joacă'**
  String get playTitle;

  /// Ecranul de pregatire a meciului
  ///
  /// In ro, this message translates to:
  /// **'Alege modul și categoriile, apoi caută adversari.'**
  String get playSubtitle;

  /// Ecranul de pregatire a meciului
  ///
  /// In ro, this message translates to:
  /// **'Mod de joc'**
  String get playMode;

  /// Ecranul de pregatire a meciului
  ///
  /// In ro, this message translates to:
  /// **'Duel 1v1'**
  String get playModeDuo;

  /// Ecranul de pregatire a meciului
  ///
  /// In ro, this message translates to:
  /// **'Față în față, pe rang.'**
  String get playModeDuoDesc;

  /// Ecranul de pregatire a meciului
  ///
  /// In ro, this message translates to:
  /// **'Clasic'**
  String get playModeClassic;

  /// Ecranul de pregatire a meciului
  ///
  /// In ro, this message translates to:
  /// **'Mai mulți jucători, cucerire de teritorii.'**
  String get playModeClassicDesc;

  /// Ecranul de pregatire a meciului
  ///
  /// In ro, this message translates to:
  /// **'Număr de jucători'**
  String get playPlayerCount;

  /// Ecranul de pregatire a meciului
  ///
  /// In ro, this message translates to:
  /// **'Categorii'**
  String get playCategories;

  /// Ecranul de pregatire a meciului
  ///
  /// In ro, this message translates to:
  /// **'Serverul folosește categoriile pe care le vreți amândoi. Dacă nu se potrivesc, meciul rulează pe toate.'**
  String get playCategoriesNote;

  /// Ecranul de pregatire a meciului
  ///
  /// In ro, this message translates to:
  /// **'Caută meci'**
  String get playFindMatch;

  /// Ecranul de pregatire a meciului
  ///
  /// In ro, this message translates to:
  /// **'În pregătire'**
  String get playModeSoon;

  /// Ecranul de pregatire a meciului
  ///
  /// In ro, this message translates to:
  /// **'Serverul îl suportă deja, dar ecranul de meci arată deocamdată un singur adversar.'**
  String get playModeClassicSoon;

  /// Cautare meci Clasic
  ///
  /// In ro, this message translates to:
  /// **'Căutăm jucători'**
  String get classicSearchingTitle;

  /// No description provided for @classicSearchingBody.
  ///
  /// In ro, this message translates to:
  /// **'Partida pornește când se strâng {count} jucători.'**
  String classicSearchingBody(int count);
}

class _AppLocalizationsDelegate
    extends LocalizationsDelegate<AppLocalizations> {
  const _AppLocalizationsDelegate();

  @override
  Future<AppLocalizations> load(Locale locale) {
    return SynchronousFuture<AppLocalizations>(lookupAppLocalizations(locale));
  }

  @override
  bool isSupported(Locale locale) =>
      <String>['en', 'ro'].contains(locale.languageCode);

  @override
  bool shouldReload(_AppLocalizationsDelegate old) => false;
}

AppLocalizations lookupAppLocalizations(Locale locale) {
  // Lookup logic when only language code is specified.
  switch (locale.languageCode) {
    case 'en':
      return AppLocalizationsEn();
    case 'ro':
      return AppLocalizationsRo();
  }

  throw FlutterError(
    'AppLocalizations.delegate failed to load unsupported locale "$locale". This is likely '
    'an issue with the localizations generation tool. Please file an issue '
    'on GitHub with a reproducible sample app and the gen-l10n configuration '
    'that was used.',
  );
}
