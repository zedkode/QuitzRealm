import { QuestionSource, QuestionStatus, QuestionType } from '@prisma/client';

const NASA_PLANETS = 'https://science.nasa.gov/solar-system/planets/';
const NASA_MOON_MISSIONS = 'https://science.nasa.gov/moon/missions/';
const EU_ROMANIA =
  'https://european-union.europa.eu/principles-countries-history/eu-countries/romania_en';
const NOAA_PACIFIC = 'https://oceanservice.noaa.gov/facts/biggestocean.html';
const NOAA_ATLANTIC = 'https://oceanservice.noaa.gov/facts/atlantic.html';
const NHLBI_HEART = 'https://www.nhlbi.nih.gov/health/heart/anatomy';
const NHGRI_CHROMOSOMES =
  'https://www.genome.gov/about-genomics/fact-sheets/Chromosome-Abnormalities-Fact-Sheet';
const NHGRI_DNA =
  'https://www.genome.gov/about-genomics/fact-sheets/Deoxyribonucleic-Acid-Fact-Sheet';

export const CURATED_OFFICIAL_SOURCES = new Set([
  NASA_PLANETS,
  NASA_MOON_MISSIONS,
  EU_ROMANIA,
  NOAA_PACIFIC,
  NOAA_ATLANTIC,
  NHLBI_HEART,
  NHGRI_CHROMOSOMES,
  NHGRI_DNA,
]);

export interface CuratedSoloQuestion {
  readonly id: string;
  readonly type: QuestionType;
  readonly categoryId: string;
  readonly difficulty: number;
  readonly text: string;
  readonly options: readonly [string, string, string, string] | null;
  readonly correctAnswer: string;
  readonly explanation: string;
  readonly verificationSource: string;
  readonly source: typeof QuestionSource.CURATED;
  readonly status: typeof QuestionStatus.APPROVED;
  readonly language: 'ro';
}

const ASTRONOMY_CATEGORY_ID = '13000000-0000-4000-8000-000000000004';
const EUROPE_CATEGORY_ID = '12000000-0000-4000-8000-000000000002';
const ROMANIA_GEOGRAPHY_CATEGORY_ID = '12000000-0000-4000-8000-000000000001';
const PHYSICAL_GEOGRAPHY_CATEGORY_ID = '12000000-0000-4000-8000-000000000006';
const BIOLOGY_CATEGORY_ID = '13000000-0000-4000-8000-000000000001';

const curated = (
  question: Omit<CuratedSoloQuestion, 'source' | 'status' | 'language'>,
): CuratedSoloQuestion => ({
  ...question,
  source: QuestionSource.CURATED,
  status: QuestionStatus.APPROVED,
  language: 'ro',
});

export const CURATED_SOLO_QUESTION_PACK = [
  curated({
    id: '20000000-0000-4000-8000-000000000001',
    type: QuestionType.NUMERIC,
    categoryId: ASTRONOMY_CATEGORY_ID,
    difficulty: 1,
    text: 'Câte planete are Sistemul Solar, conform clasificării prezentate de NASA?',
    options: null,
    correctAnswer: '8',
    explanation:
      'NASA enumeră opt planete: Mercur, Venus, Pământ, Marte, Jupiter, Saturn, Uranus și Neptun.',
    verificationSource: NASA_PLANETS,
  }),
  curated({
    id: '20000000-0000-4000-8000-000000000002',
    type: QuestionType.MULTIPLE_CHOICE,
    categoryId: ASTRONOMY_CATEGORY_ID,
    difficulty: 1,
    text: 'Care este planeta cea mai apropiată de Soare?',
    options: ['Mercur', 'Venus', 'Pământ', 'Marte'],
    correctAnswer: 'Mercur',
    explanation:
      'Mercur este prima planetă de la Soare și cea mai mică planetă din Sistemul Solar.',
    verificationSource: NASA_PLANETS,
  }),
  curated({
    id: '20000000-0000-4000-8000-000000000003',
    type: QuestionType.MULTIPLE_CHOICE,
    categoryId: ASTRONOMY_CATEGORY_ID,
    difficulty: 1,
    text: 'Care este cea mai mare planetă din Sistemul Solar?',
    options: ['Jupiter', 'Saturn', 'Neptun', 'Pământ'],
    correctAnswer: 'Jupiter',
    explanation:
      'Jupiter este a cincea planetă de la Soare și cea mai mare planetă din Sistemul Solar.',
    verificationSource: NASA_PLANETS,
  }),
  curated({
    id: '20000000-0000-4000-8000-000000000004',
    type: QuestionType.MULTIPLE_CHOICE,
    categoryId: ASTRONOMY_CATEGORY_ID,
    difficulty: 2,
    text: 'Care pereche este formată din cei doi giganți de gheață ai Sistemului Solar?',
    options: [
      'Uranus și Neptun',
      'Jupiter și Saturn',
      'Pământ și Marte',
      'Mercur și Venus',
    ],
    correctAnswer: 'Uranus și Neptun',
    explanation:
      'NASA clasifică Uranus și Neptun drept giganți de gheață, iar Jupiter și Saturn drept giganți gazoși.',
    verificationSource: NASA_PLANETS,
  }),
  curated({
    id: '20000000-0000-4000-8000-000000000005',
    type: QuestionType.NUMERIC,
    categoryId: ASTRONOMY_CATEGORY_ID,
    difficulty: 2,
    text: 'Câte planete pitice sunt recunoscute oficial în Sistemul Solar?',
    options: null,
    correctAnswer: '5',
    explanation:
      'Cele cinci planete pitice recunoscute oficial sunt Ceres, Pluto, Haumea, Makemake și Eris.',
    verificationSource: NASA_PLANETS,
  }),
  curated({
    id: '20000000-0000-4000-8000-000000000006',
    type: QuestionType.NUMERIC,
    categoryId: ASTRONOMY_CATEGORY_ID,
    difficulty: 1,
    text: 'În ce an au ajuns primii oameni pe Lună prin misiunea Apollo 11?',
    options: null,
    correctAnswer: '1969',
    explanation:
      'Apollo 11 a ajuns la Lună la 20 iulie 1969 și a realizat prima aselenizare cu echipaj uman.',
    verificationSource: NASA_MOON_MISSIONS,
  }),
  curated({
    id: '20000000-0000-4000-8000-000000000007',
    type: QuestionType.MULTIPLE_CHOICE,
    categoryId: ASTRONOMY_CATEGORY_ID,
    difficulty: 3,
    text: 'Care misiune a fost prima navă spațială care a lovit suprafața Lunii?',
    options: ['Luna 2', 'Luna 1', 'Apollo 8', 'Pioneer 4'],
    correctAnswer: 'Luna 2',
    explanation:
      'NASA consemnează Luna 2 ca prima navă spațială care a atins prin impact suprafața Lunii, în 1959.',
    verificationSource: NASA_MOON_MISSIONS,
  }),
  curated({
    id: '20000000-0000-4000-8000-000000000008',
    type: QuestionType.NUMERIC,
    categoryId: EUROPE_CATEGORY_ID,
    difficulty: 1,
    text: 'În ce an a devenit România stat membru al Uniunii Europene?',
    options: null,
    correctAnswer: '2007',
    explanation:
      'România este stat membru al Uniunii Europene din 1 ianuarie 2007.',
    verificationSource: EU_ROMANIA,
  }),
  curated({
    id: '20000000-0000-4000-8000-000000000009',
    type: QuestionType.MULTIPLE_CHOICE,
    categoryId: ROMANIA_GEOGRAPHY_CATEGORY_ID,
    difficulty: 1,
    text: 'Care este capitala României?',
    options: ['București', 'Cluj-Napoca', 'Iași', 'Timișoara'],
    correctAnswer: 'București',
    explanation:
      'Pagina oficială a Uniunii Europene pentru România indică București drept capitală.',
    verificationSource: EU_ROMANIA,
  }),
  curated({
    id: '20000000-0000-4000-8000-000000000010',
    type: QuestionType.MULTIPLE_CHOICE,
    categoryId: PHYSICAL_GEOGRAPHY_CATEGORY_ID,
    difficulty: 1,
    text: 'Care este cel mai mare și mai adânc bazin oceanic al Pământului?',
    options: [
      'Oceanul Pacific',
      'Oceanul Atlantic',
      'Oceanul Indian',
      'Oceanul Arctic',
    ],
    correctAnswer: 'Oceanul Pacific',
    explanation:
      'NOAA identifică Oceanul Pacific drept cel mai mare și mai adânc dintre bazinele oceanice ale lumii.',
    verificationSource: NOAA_PACIFIC,
  }),
  curated({
    id: '20000000-0000-4000-8000-000000000011',
    type: QuestionType.MULTIPLE_CHOICE,
    categoryId: PHYSICAL_GEOGRAPHY_CATEGORY_ID,
    difficulty: 1,
    text: 'Care este al doilea bazin oceanic ca mărime din lume?',
    options: [
      'Oceanul Atlantic',
      'Oceanul Indian',
      'Oceanul Arctic',
      'Oceanul Austral',
    ],
    correctAnswer: 'Oceanul Atlantic',
    explanation:
      'Oceanul Atlantic este al doilea bazin oceanic ca mărime, după Oceanul Pacific.',
    verificationSource: NOAA_ATLANTIC,
  }),
  curated({
    id: '20000000-0000-4000-8000-000000000012',
    type: QuestionType.NUMERIC,
    categoryId: BIOLOGY_CATEGORY_ID,
    difficulty: 1,
    text: 'Câte camere are inima umană?',
    options: null,
    correctAnswer: '4',
    explanation:
      'Inima umană are patru camere: două atrii în partea superioară și două ventricule în partea inferioară.',
    verificationSource: NHLBI_HEART,
  }),
  curated({
    id: '20000000-0000-4000-8000-000000000013',
    type: QuestionType.NUMERIC,
    categoryId: BIOLOGY_CATEGORY_ID,
    difficulty: 2,
    text: 'Care este numărul tipic de cromozomi dintr-o celulă umană?',
    options: null,
    correctAnswer: '46',
    explanation:
      'O celulă umană are în mod tipic 46 de cromozomi, organizați în 23 de perechi.',
    verificationSource: NHGRI_CHROMOSOMES,
  }),
  curated({
    id: '20000000-0000-4000-8000-000000000014',
    type: QuestionType.MULTIPLE_CHOICE,
    categoryId: BIOLOGY_CATEGORY_ID,
    difficulty: 2,
    text: 'Cu ce bază azotată se împerechează adenina în dubla elice a ADN-ului?',
    options: ['Timină', 'Guanină', 'Citozină', 'Uracil'],
    correctAnswer: 'Timină',
    explanation:
      'În ADN, adenina se împerechează întotdeauna cu timina, iar citozina cu guanina.',
    verificationSource: NHGRI_DNA,
  }),
] as const satisfies readonly CuratedSoloQuestion[];

const canonicalText = (value: string): string =>
  value
    .normalize('NFD')
    .replace(/[\u0300-\u036f]/g, '')
    .toLowerCase()
    .replace(/[^a-z0-9 ]/g, ' ')
    .replace(/\s+/g, ' ')
    .trim();

export const questionTextSimilarity = (left: string, right: string): number => {
  const leftTokens = new Set(canonicalText(left).split(' ').filter(Boolean));
  const rightTokens = new Set(canonicalText(right).split(' ').filter(Boolean));
  const union = new Set([...leftTokens, ...rightTokens]);
  if (union.size === 0) return 1;
  const intersection = [...leftTokens].filter((token) =>
    rightTokens.has(token),
  ).length;
  return intersection / union.size;
};

export function validateCuratedSoloQuestionPack(
  questions: readonly CuratedSoloQuestion[],
): void {
  if (questions.length !== 14) {
    throw new Error(`Pachetul curated trebuie să conțină exact 14 întrebări.`);
  }

  const ids = new Set<string>();
  const uuidPattern =
    /^[0-9a-f]{8}-[0-9a-f]{4}-4[0-9a-f]{3}-[89ab][0-9a-f]{3}-[0-9a-f]{12}$/i;
  let multipleChoiceCount = 0;
  let numericCount = 0;

  for (const question of questions) {
    if (!uuidPattern.test(question.id) || ids.has(question.id)) {
      throw new Error(`ID invalid sau duplicat: ${question.id}`);
    }
    ids.add(question.id);
    if (question.source !== QuestionSource.CURATED) {
      throw new Error(`Întrebarea ${question.id} nu are sursa CURATED.`);
    }
    if (question.status !== QuestionStatus.APPROVED) {
      throw new Error(`Întrebarea ${question.id} nu are statusul APPROVED.`);
    }
    if (question.language !== 'ro') {
      throw new Error(`Întrebarea ${question.id} nu este în limba română.`);
    }
    if (
      !Number.isInteger(question.difficulty) ||
      question.difficulty < 1 ||
      question.difficulty > 5
    ) {
      throw new Error(`Dificultate invalidă pentru ${question.id}.`);
    }
    if (question.text.trim().length < 10 || question.text.length > 1000) {
      throw new Error(`Text invalid pentru ${question.id}.`);
    }
    if (
      question.correctAnswer.trim().length === 0 ||
      question.correctAnswer.length > 500
    ) {
      throw new Error(`Răspuns invalid pentru ${question.id}.`);
    }
    if (
      question.explanation.trim().length < 10 ||
      question.explanation.length > 1000
    ) {
      throw new Error(`Explicație invalidă pentru ${question.id}.`);
    }
    if (!CURATED_OFFICIAL_SOURCES.has(question.verificationSource)) {
      throw new Error(`Sursă neaprobată pentru ${question.id}.`);
    }

    if (question.type === QuestionType.MULTIPLE_CHOICE) {
      multipleChoiceCount += 1;
      if (!question.options || question.options.length !== 4) {
        throw new Error(
          `Întrebarea grilă ${question.id} trebuie să aibă patru variante.`,
        );
      }
      const normalizedOptions = question.options.map(canonicalText);
      if (
        normalizedOptions.some((option) => option.length === 0) ||
        new Set(normalizedOptions).size !== 4
      ) {
        throw new Error(
          `Variante invalide sau duplicate pentru ${question.id}.`,
        );
      }
      if (!question.options.includes(question.correctAnswer)) {
        throw new Error(
          `Răspunsul corect lipsește din variante pentru ${question.id}.`,
        );
      }
    } else if (question.type === QuestionType.NUMERIC) {
      numericCount += 1;
      if (question.options !== null) {
        throw new Error(
          `Întrebarea numerică ${question.id} nu poate avea variante.`,
        );
      }
      if (!Number.isFinite(Number(question.correctAnswer))) {
        throw new Error(
          `Răspunsul numeric este invalid pentru ${question.id}.`,
        );
      }
    } else {
      throw new Error(`Tip necunoscut pentru ${question.id}.`);
    }
  }

  if (multipleChoiceCount === 0 || numericCount === 0) {
    throw new Error('Pachetul trebuie să includă întrebări grilă și numerice.');
  }

  for (let left = 0; left < questions.length; left += 1) {
    for (let right = left + 1; right < questions.length; right += 1) {
      if (
        questions[left].categoryId === questions[right].categoryId &&
        questionTextSimilarity(questions[left].text, questions[right].text) >=
          0.85
      ) {
        throw new Error(
          `Întrebări prea similare: ${questions[left].id} și ${questions[right].id}.`,
        );
      }
    }
  }
}
