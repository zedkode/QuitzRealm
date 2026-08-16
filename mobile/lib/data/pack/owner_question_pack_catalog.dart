final class OwnerQuestionPackDefinition {
  const OwnerQuestionPackDefinition({required this.code, required this.name});

  final String code;
  final String name;

  String get assetPath => 'assets/questions/$code.json';
}

/// Cele 20 de categorii cerute explicit de proprietarul QuizRealm.
/// Pachetele sunt ținute separat de campania veche până la review factual.
const ownerQuestionPacks = <OwnerQuestionPackDefinition>[
  OwnerQuestionPackDefinition(code: 'geography', name: 'Geography'),
  OwnerQuestionPackDefinition(code: 'history', name: 'History'),
  OwnerQuestionPackDefinition(code: 'science', name: 'Science'),
  OwnerQuestionPackDefinition(code: 'wars', name: 'Wars'),
  OwnerQuestionPackDefinition(code: 'gaming', name: 'Gaming'),
  OwnerQuestionPackDefinition(code: 'movies', name: 'Movies'),
  OwnerQuestionPackDefinition(code: 'music', name: 'Music'),
  OwnerQuestionPackDefinition(code: 'sports', name: 'Sports'),
  OwnerQuestionPackDefinition(
    code: 'general-knowledge',
    name: 'General Knowledge',
  ),
  OwnerQuestionPackDefinition(code: 'technology', name: 'Technology'),
  OwnerQuestionPackDefinition(code: 'mythology', name: 'Mythology'),
  OwnerQuestionPackDefinition(code: 'animals', name: 'Animals'),
  OwnerQuestionPackDefinition(code: 'space', name: 'Space'),
  OwnerQuestionPackDefinition(code: 'literature', name: 'Literature'),
  OwnerQuestionPackDefinition(code: 'art', name: 'Art'),
  OwnerQuestionPackDefinition(code: 'cars', name: 'Cars'),
  OwnerQuestionPackDefinition(code: 'logic', name: 'Logic'),
  OwnerQuestionPackDefinition(code: 'economy', name: 'Economy'),
  OwnerQuestionPackDefinition(code: 'medieval', name: 'Medieval'),
  OwnerQuestionPackDefinition(code: 'royal-challenge', name: 'Royal Challenge'),
];
