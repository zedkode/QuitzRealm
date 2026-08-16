export type AchievementMetric = 'correct_answers' | 'duo_wins' | 'matches_played';

export interface AchievementBlueprint {
  templateKey: string;
  category: string;
  metric: AchievementMetric;
  thresholds: readonly number[];
  titleTemplate: string;
  descriptionTemplate: string;
  pointsBase: number;
  badgeAssetTemplate?: string;
}

/// Catalogul este deliberat compact: fiecare prag produce o instanță distinctă.
/// Se pot adăuga familii noi fără a modifica serviciul de progres.
export const ACHIEVEMENT_BLUEPRINTS: readonly AchievementBlueprint[] = [
  {
    templateKey: 'knowledge.correct_answers',
    category: 'knowledge',
    metric: 'correct_answers',
    thresholds: [10, 50, 100, 500, 1_000, 5_000],
    titleTemplate: 'Erudit: {threshold}',
    descriptionTemplate: 'Răspunde corect la {threshold} întrebări.',
    pointsBase: 10,
    badgeAssetTemplate: 'knowledge_{threshold}',
  },
  {
    templateKey: 'duel.duo_wins',
    category: 'victory',
    metric: 'duo_wins',
    thresholds: [1, 10, 50, 100, 500, 1_000],
    titleTemplate: 'Duelist: {threshold}',
    descriptionTemplate: 'Câștigă {threshold} dueluri Duo.',
    pointsBase: 15,
    badgeAssetTemplate: 'duo_win_{threshold}',
  },
  {
    templateKey: 'exploration.matches_played',
    category: 'exploration',
    metric: 'matches_played',
    thresholds: [1, 10, 50, 100, 500],
    titleTemplate: 'Cronicar: {threshold}',
    descriptionTemplate: 'Finalizează {threshold} partide.',
    pointsBase: 8,
  },
];

export function instanceKey(templateKey: string, threshold: number): string {
  return `${templateKey}:${threshold}`;
}

export function resolveTemplate(text: string, threshold: number): string {
  return text.replaceAll('{threshold}', threshold.toString());
}
