/// O etapă dintr-un ținut: un asalt cu un număr fix de întrebări, dintr-o
/// bandă de dificultate.
final class BattleStage {
  const BattleStage({
    required this.index,
    required this.questionCount,
    required this.minDifficulty,
    required this.maxDifficulty,
  }) : assert(index >= 0),
       assert(questionCount > 0),
       assert(minDifficulty >= 1 && minDifficulty <= maxDifficulty),
       assert(maxDifficulty <= 5);

  final int index;
  final int questionCount;
  final int minDifficulty;
  final int maxDifficulty;

  /// Secundele alocate per întrebare scad pe măsură ce urci în ținut.
  int get secondsPerQuestion => switch (index) {
    0 => 15,
    1 => 13,
    _ => 11,
  };
}

/// Un ținut de pe hartă. Fiecare ținut are propriul pachet de întrebări și
/// trei asalturi din ce în ce mai grele.
final class RealmChapter {
  const RealmChapter({
    required this.id,
    required this.packAsset,
    required this.starsToUnlock,
    required this.mapPosition,
  }) : assert(id != ''),
       assert(starsToUnlock >= 0);

  final String id;
  final String packAsset;
  final int starsToUnlock;

  /// Poziție relativă (0-1) pe imaginea hărții, aleasă pe reperul ilustrat al
  /// ținutului din `realm_map_v2.png` (cetate, port, arenă…), nu pe o grilă.
  final (double, double) mapPosition;

  static const stages = <BattleStage>[
    BattleStage(index: 0, questionCount: 5, minDifficulty: 1, maxDifficulty: 2),
    BattleStage(index: 1, questionCount: 6, minDifficulty: 2, maxDifficulty: 4),
    BattleStage(index: 2, questionCount: 7, minDifficulty: 3, maxDifficulty: 5),
  ];

  /// Ordinea din listă este ordinea campaniei; poziția este locul de pe hartă.
  ///
  /// Identificatorii ținuturilor rămân cei vechi, deși pachetele au acum nume
  /// englezești: cheia de progres salvată pe telefon e `<chapterId>/<etapă>`,
  /// iar o redenumire ar șterge în tăcere progresul jucătorilor.
  static const all = <RealmChapter>[
    RealmChapter(
      id: 'istorie',
      packAsset: 'assets/questions/istorie.json',
      starsToUnlock: 0,
      mapPosition: (0.545, 0.385),
    ),
    RealmChapter(
      id: 'romania',
      packAsset: 'assets/questions/romania.json',
      starsToUnlock: 3,
      mapPosition: (0.545, 0.605),
    ),
    RealmChapter(
      id: 'geografie',
      packAsset: 'assets/questions/geography.json',
      starsToUnlock: 6,
      mapPosition: (0.825, 0.515),
    ),
    RealmChapter(
      id: 'stiinta',
      packAsset: 'assets/questions/science.json',
      starsToUnlock: 10,
      mapPosition: (0.745, 0.245),
    ),
    RealmChapter(
      id: 'sport',
      packAsset: 'assets/questions/sports.json',
      starsToUnlock: 15,
      mapPosition: (0.765, 0.845),
    ),
    RealmChapter(
      id: 'tehnologie',
      packAsset: 'assets/questions/technology.json',
      starsToUnlock: 21,
      mapPosition: (0.455, 0.215),
    ),
    RealmChapter(
      id: 'literatura',
      packAsset: 'assets/questions/literature.json',
      starsToUnlock: 28,
      mapPosition: (0.195, 0.765),
    ),
    RealmChapter(
      id: 'arte',
      packAsset: 'assets/questions/art.json',
      starsToUnlock: 36,
      mapPosition: (0.235, 0.505),
    ),
    RealmChapter(
      id: 'mituri',
      packAsset: 'assets/questions/mythology.json',
      starsToUnlock: 45,
      mapPosition: (0.155, 0.255),
    ),
  ];

  static RealmChapter byId(String id) {
    return all.firstWhere(
      (chapter) => chapter.id == id,
      orElse: () => throw ArgumentError.value(id, 'id', 'Ținut necunoscut'),
    );
  }

  static int get maxStars => all.length * stages.length * 3;
}
