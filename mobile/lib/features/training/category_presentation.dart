import '../../domain/training/category_progress.dart';
import '../../l10n/app_localizations.dart';

/// Numele și iconița unei categorii.
///
/// Eticheta trece prin i18n, nu prin numele din fișierul de pachet: fișierele
/// sunt scrise în română, iar aplicația trebuie să poată fi și în engleză.
/// Iconița se deduce din cod, ca o categorie nouă să nu ceară o listă în plus.
final class CategoryPresentation {
  const CategoryPresentation._();

  static String iconAsset(String code) =>
      'assets/game/icons/quiz-categories/icon-category-$code.png';

  static String label(AppLocalizations l10n, String code) => switch (code) {
    'animals' => l10n.categoryAnimals,
    'art' => l10n.categoryArt,
    'cars' => l10n.categoryCars,
    'economy' => l10n.categoryEconomy,
    'gaming' => l10n.categoryGaming,
    'general-knowledge' => l10n.categoryGeneralKnowledge,
    'geography' => l10n.categoryGeography,
    'history' => l10n.categoryHistory,
    'literature' => l10n.categoryLiterature,
    'logic' => l10n.categoryLogic,
    'medieval' => l10n.categoryMedieval,
    'movies' => l10n.categoryMovies,
    'music' => l10n.categoryMusic,
    'mythology' => l10n.categoryMythology,
    'royal-challenge' => l10n.categoryRoyalChallenge,
    'science' => l10n.categoryScience,
    'space' => l10n.categorySpace,
    'sports' => l10n.categorySports,
    'technology' => l10n.categoryTechnology,
    'wars' => l10n.categoryWars,
    // Un cod necunoscut nu are voie să arunce ecranul: apare cu propriul cod,
    // ceea ce e vizibil la revizuire fără să strice jocul.
    _ => code,
  };

  static String masteryLabel(AppLocalizations l10n, MasteryTier tier) =>
      switch (tier) {
        MasteryTier.none => l10n.trainingMasteryNone,
        MasteryTier.bronze => l10n.trainingMasteryBronze,
        MasteryTier.silver => l10n.trainingMasterySilver,
        MasteryTier.gold => l10n.trainingMasteryGold,
      };
}
