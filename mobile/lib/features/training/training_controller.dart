import 'dart:async';

import 'package:flutter_riverpod/flutter_riverpod.dart';

import '../../core/providers/game_providers.dart';
import '../../data/pack/category_round_source.dart';
import '../../data/pack/owner_question_pack_catalog.dart';
import '../../data/training/category_progress_store.dart';
import '../../domain/campaign/realm_chapter.dart';
import '../../domain/training/category_progress.dart';
import '../battle/battle_controller.dart';

final categoryProgressStoreProvider = Provider<CategoryProgressStore>((ref) {
  return const SharedPreferencesCategoryProgressStore();
});

/// Progresul pe categorii, restaurat de pe dispozitiv la pornire.
class CategoryProgressController extends StateNotifier<CategoryProgress> {
  CategoryProgressController(this._store) : super(CategoryProgress.empty) {
    unawaited(_restore());
  }

  final CategoryProgressStore _store;

  Future<void> _restore() async {
    try {
      final stored = await _store.read();
      if (mounted) state = stored;
    } catch (_) {
      // Progres necitibil: rămâne gol, dar antrenamentul se poate juca.
    }
  }

  /// Înregistrează rezultatul unei runde. Când runda a combinat mai multe
  /// categorii, meritul se împarte după câte întrebări a dat fiecare — altfel
  /// o categorie ar primi progres pentru întrebări care n-au fost ale ei.
  Future<void> recordRound(Map<String, ({int answered, int correct})> perCategory) async {
    var updated = state;
    for (final entry in perCategory.entries) {
      updated = updated.withRoundResult(
        code: entry.key,
        answered: entry.value.answered,
        correct: entry.value.correct,
      );
    }
    state = updated;
    try {
      await _store.write(updated);
    } catch (_) {
      // Scrierea eșuată nu anulează progresul din sesiunea curentă.
    }
  }
}

final categoryProgressProvider =
    StateNotifierProvider<CategoryProgressController, CategoryProgress>((ref) {
      return CategoryProgressController(
        ref.watch(categoryProgressStoreProvider),
      );
    });

/// Categoriile bifate pentru runda următoare. Gol = toate.
class CategorySelectionController extends StateNotifier<Set<String>> {
  CategorySelectionController() : super(const {});

  static final _allCodes = ownerQuestionPacks
      .map((definition) => definition.code)
      .toSet();

  void toggle(String code) {
    final next = Set<String>.of(state);
    if (!next.remove(code)) next.add(code);
    state = next;
  }

  void selectAll() => state = const {};

  void clear() => state = const {};

  bool get isAll => state.isEmpty;

  /// Codurile efective ale rundei: bifele jucătorului sau, dacă n-a bifat
  /// nimic, toate categoriile.
  Set<String> get effective => state.isEmpty ? _allCodes : state;
}

final categorySelectionProvider =
    StateNotifierProvider<CategorySelectionController, Set<String>>((ref) {
      return CategorySelectionController();
    });

/// Lungimea unei runde de antrenament.
enum TrainingLength { short, medium, long }

extension TrainingLengthX on TrainingLength {
  int get questionCount => switch (this) {
    TrainingLength.short => 5,
    TrainingLength.medium => 10,
    TrainingLength.long => 20,
  };
}

/// Configurația unei runde de antrenament.
typedef TrainingTarget = ({String codes, int questionCount});

/// Etapa folosită de antrenament: toate benzile de dificultate, ca jucătorul
/// să vadă categoria întreagă, nu doar începutul ei.
///
/// Timpul e mai generos decât în asalturi. `plan.md` §6 descrie antrenamentul ca
/// „mod fără presiune", pentru onboarding și testarea băncii de întrebări — un
/// cronometru de asalt ar contrazice exact scopul modului.
BattleStage trainingStage(int questionCount) => BattleStage(
  index: 0,
  questionCount: questionCount,
  minDifficulty: 1,
  maxDifficulty: 5,
  secondsOverride: 30,
);

final trainingBattleProvider = StateNotifierProvider.autoDispose
    .family<BattleController, BattleState, TrainingTarget>((ref, target) {
      final codes = target.codes.split(',').where((c) => c.isNotEmpty).toList();
      final stage = trainingStage(target.questionCount);
      final source = CategoryRoundSource(
        packAssets: codes
            .map((code) => 'assets/questions/$code.json')
            .toList(growable: false),
        stage: stage,
        loader: ref.watch(questionPackLoaderProvider),
      );

      return BattleController(
        source: source,
        stage: stage,
        onFinished: ({required int stars, required int xpGained}) async {
          // Progresul pe categorii se scrie din ecran, unde se știe din ce
          // categorie a venit fiecare întrebare. Aici nu avem decât totalul.
        },
      );
    });
