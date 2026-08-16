/// Progresul jucătorului pe fiecare categorie de întrebări.
///
/// Înlocuiește progresul de campanie ca sursă de progres solo. Diferența nu e
/// cosmetică: `owner-plan.md` §7.3 interzice o campanie de nivele parcurse
/// secvențial, așa că **nicio categorie nu se deblochează prin alta**. Progresul
/// se vede ca măiestrie acumulată pe fiecare subiect, nu ca un drum obligatoriu.
final class CategoryProgress {
  const CategoryProgress({this.stats = const {}});

  /// Cheie: codul categoriei (`history`, `logic`…).
  final Map<String, CategoryStat> stats;

  static const empty = CategoryProgress();

  CategoryStat statFor(String code) => stats[code] ?? CategoryStat.empty;

  int get totalAnswered =>
      stats.values.fold(0, (sum, stat) => sum + stat.answered);

  int get totalCorrect =>
      stats.values.fold(0, (sum, stat) => sum + stat.correct);

  /// Categoriile în care jucătorul a atins cel puțin măiestria de bronz.
  int get masteredCount =>
      stats.values.where((stat) => stat.tier != MasteryTier.none).length;

  CategoryProgress withRoundResult({
    required String code,
    required int answered,
    required int correct,
  }) {
    assert(answered >= 0);
    assert(correct >= 0 && correct <= answered);
    final previous = statFor(code);
    return CategoryProgress(
      stats: {
        ...stats,
        code: CategoryStat(
          answered: previous.answered + answered,
          correct: previous.correct + correct,
          bestRound: correct > previous.bestRound ? correct : previous.bestRound,
        ),
      },
    );
  }

  Map<String, Object?> toJson() => {
    for (final entry in stats.entries) entry.key: entry.value.toJson(),
  };

  static CategoryProgress fromJson(Map<String, Object?> json) {
    final stats = <String, CategoryStat>{};
    for (final entry in json.entries) {
      final value = entry.value;
      if (value is Map<String, Object?>) {
        stats[entry.key] = CategoryStat.fromJson(value);
      }
    }
    return CategoryProgress(stats: stats);
  }
}

/// Statistica unei categorii.
final class CategoryStat {
  const CategoryStat({
    this.answered = 0,
    this.correct = 0,
    this.bestRound = 0,
  }) : assert(answered >= 0),
       assert(correct >= 0);

  final int answered;
  final int correct;

  /// Cele mai multe răspunsuri corecte dintr-o singură rundă.
  final int bestRound;

  static const empty = CategoryStat();

  double get accuracy => answered == 0 ? 0 : correct / answered;

  /// Măiestria se câștigă din **răspunsuri corecte**, nu din timp petrecut sau
  /// runde jucate: altfel ar putea fi acumulată răspunzând la întâmplare.
  MasteryTier get tier {
    if (correct >= 250) return MasteryTier.gold;
    if (correct >= 100) return MasteryTier.silver;
    if (correct >= 25) return MasteryTier.bronze;
    return MasteryTier.none;
  }

  /// Cât mai e până la treapta următoare, ca fracție între 0 și 1.
  double get tierProgress {
    final (from, to) = switch (tier) {
      MasteryTier.none => (0, 25),
      MasteryTier.bronze => (25, 100),
      MasteryTier.silver => (100, 250),
      MasteryTier.gold => (250, 250),
    };
    if (to == from) return 1;
    return ((correct - from) / (to - from)).clamp(0.0, 1.0);
  }

  int get nextTierAt => switch (tier) {
    MasteryTier.none => 25,
    MasteryTier.bronze => 100,
    MasteryTier.silver => 250,
    MasteryTier.gold => 250,
  };

  Map<String, Object?> toJson() => {
    'answered': answered,
    'correct': correct,
    'bestRound': bestRound,
  };

  static CategoryStat fromJson(Map<String, Object?> json) {
    int asInt(Object? value) => value is num && value >= 0 ? value.round() : 0;
    final answered = asInt(json['answered']);
    final correct = asInt(json['correct']);
    return CategoryStat(
      answered: answered,
      // Un fișier stricat n-are voie să producă o acuratețe peste 100%.
      correct: correct > answered ? answered : correct,
      bestRound: asInt(json['bestRound']),
    );
  }
}

enum MasteryTier { none, bronze, silver, gold }
