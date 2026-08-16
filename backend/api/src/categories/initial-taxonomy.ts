export interface TaxonomyNode {
  readonly id: string;
  readonly code?: string;
  readonly name: string;
  readonly icon: string;
}

export interface TaxonomyRoot extends TaxonomyNode {
  readonly children: readonly TaxonomyNode[];
}

export const INITIAL_CATEGORY_TAXONOMY = [
  {
    id: '10000000-0000-4000-8000-000000000001',
    code: 'history',
    name: 'Istorie',
    icon: 'landmark',
    children: [
      {
        id: '11000000-0000-4000-8000-000000000001',
        name: 'Istoria României',
        icon: 'history-romania',
      },
      {
        id: '11000000-0000-4000-8000-000000000002',
        name: 'Antichitate',
        icon: 'ancient-world',
      },
      {
        id: '11000000-0000-4000-8000-000000000003',
        code: 'medieval',
        name: 'Evul Mediu',
        icon: 'castle',
      },
      {
        id: '11000000-0000-4000-8000-000000000004',
        name: 'Epoca modernă',
        icon: 'history-modern',
      },
      {
        id: '11000000-0000-4000-8000-000000000005',
        name: 'Secolul XX',
        icon: 'history-twentieth-century',
      },
      {
        id: '11000000-0000-4000-8000-000000000006',
        name: 'Civilizații și imperii',
        icon: 'civilizations',
      },
      {
        id: '11000000-0000-4000-8000-000000000007',
        code: 'wars',
        name: 'Războaie',
        icon: 'crossed-swords',
      },
    ],
  },
  {
    id: '10000000-0000-4000-8000-000000000002',
    code: 'geography',
    name: 'Geografie',
    icon: 'public',
    children: [
      {
        id: '12000000-0000-4000-8000-000000000001',
        name: 'Geografia României',
        icon: 'map-romania',
      },
      {
        id: '12000000-0000-4000-8000-000000000002',
        name: 'Europa',
        icon: 'map-europe',
      },
      {
        id: '12000000-0000-4000-8000-000000000003',
        name: 'Asia',
        icon: 'map-asia',
      },
      {
        id: '12000000-0000-4000-8000-000000000004',
        name: 'Africa',
        icon: 'map-africa',
      },
      {
        id: '12000000-0000-4000-8000-000000000005',
        name: 'Americile și Oceania',
        icon: 'map-americas-oceania',
      },
      {
        id: '12000000-0000-4000-8000-000000000006',
        name: 'Geografie fizică',
        icon: 'terrain',
      },
    ],
  },
  {
    id: '10000000-0000-4000-8000-000000000003',
    code: 'science',
    name: 'Știință',
    icon: 'science',
    children: [
      {
        id: '13000000-0000-4000-8000-000000000001',
        name: 'Biologie',
        icon: 'biology',
      },
      {
        id: '13000000-0000-4000-8000-000000000002',
        name: 'Fizică',
        icon: 'physics',
      },
      {
        id: '13000000-0000-4000-8000-000000000003',
        name: 'Chimie',
        icon: 'chemistry',
      },
      {
        id: '13000000-0000-4000-8000-000000000004',
        code: 'space',
        name: 'Astronomie',
        icon: 'astronomy',
      },
      {
        id: '13000000-0000-4000-8000-000000000005',
        name: 'Matematică',
        icon: 'mathematics',
      },
      {
        id: '13000000-0000-4000-8000-000000000006',
        code: 'technology',
        name: 'Tehnologie și informatică',
        icon: 'technology',
      },
      {
        id: '13000000-0000-4000-8000-000000000007',
        code: 'gaming',
        name: 'Jocuri video',
        icon: 'gaming',
      },
      {
        id: '13000000-0000-4000-8000-000000000008',
        code: 'animals',
        name: 'Animale',
        icon: 'animals',
      },
      {
        id: '13000000-0000-4000-8000-000000000009',
        code: 'logic',
        name: 'Logică',
        icon: 'logic',
      },
    ],
  },
  {
    id: '10000000-0000-4000-8000-000000000004',
    code: 'sports',
    name: 'Sport',
    icon: 'sports',
    children: [
      {
        id: '14000000-0000-4000-8000-000000000001',
        name: 'Fotbal',
        icon: 'football',
      },
      {
        id: '14000000-0000-4000-8000-000000000002',
        name: 'Tenis',
        icon: 'tennis',
      },
      {
        id: '14000000-0000-4000-8000-000000000003',
        name: 'Jocuri Olimpice',
        icon: 'olympics',
      },
      {
        id: '14000000-0000-4000-8000-000000000004',
        name: 'Sporturi cu motor',
        icon: 'motorsports',
      },
      {
        id: '14000000-0000-4000-8000-000000000005',
        name: 'Baschet și handbal',
        icon: 'team-sports',
      },
      {
        id: '14000000-0000-4000-8000-000000000006',
        name: 'Recorduri sportive',
        icon: 'sports-records',
      },
    ],
  },
  {
    id: '10000000-0000-4000-8000-000000000005',
    name: 'Film și muzică',
    icon: 'movie-music',
    children: [
      {
        id: '15000000-0000-4000-8000-000000000007',
        code: 'movies',
        name: 'Filme',
        icon: 'movie',
      },
      {
        id: '15000000-0000-4000-8000-000000000008',
        code: 'music',
        name: 'Muzică',
        icon: 'music',
      },
      {
        id: '15000000-0000-4000-8000-000000000001',
        name: 'Cinema românesc',
        icon: 'romanian-cinema',
      },
      {
        id: '15000000-0000-4000-8000-000000000002',
        name: 'Film internațional',
        icon: 'international-film',
      },
      {
        id: '15000000-0000-4000-8000-000000000003',
        name: 'Seriale de televiziune',
        icon: 'television',
      },
      {
        id: '15000000-0000-4000-8000-000000000004',
        name: 'Muzică românească',
        icon: 'romanian-music',
      },
      {
        id: '15000000-0000-4000-8000-000000000005',
        name: 'Muzică internațională',
        icon: 'international-music',
      },
      {
        id: '15000000-0000-4000-8000-000000000006',
        name: 'Artele spectacolului',
        icon: 'performing-arts',
      },
    ],
  },
  {
    id: '10000000-0000-4000-8000-000000000006',
    code: 'literature',
    name: 'Literatură',
    icon: 'menu-book',
    children: [
      {
        id: '16000000-0000-4000-8000-000000000001',
        name: 'Literatură română',
        icon: 'romanian-literature',
      },
      {
        id: '16000000-0000-4000-8000-000000000002',
        name: 'Literatură universală',
        icon: 'world-literature',
      },
      {
        id: '16000000-0000-4000-8000-000000000003',
        name: 'Autori și opere',
        icon: 'authors-books',
      },
      {
        id: '16000000-0000-4000-8000-000000000004',
        name: 'Poezie',
        icon: 'poetry',
      },
      {
        id: '16000000-0000-4000-8000-000000000005',
        code: 'mythology',
        name: 'Basme și mitologie',
        icon: 'mythology',
      },
    ],
  },
  {
    id: '10000000-0000-4000-8000-000000000007',
    name: 'Actualitate',
    icon: 'newspaper',
    children: [
      {
        id: '17000000-0000-4000-8000-000000000001',
        name: 'Știință și tehnologie actuală',
        icon: 'current-technology',
      },
      {
        id: '17000000-0000-4000-8000-000000000002',
        name: 'Cultură și divertisment actual',
        icon: 'current-culture',
      },
      {
        id: '17000000-0000-4000-8000-000000000003',
        name: 'Sport actual',
        icon: 'current-sports',
      },
      {
        id: '17000000-0000-4000-8000-000000000004',
        name: 'Societate și lume',
        icon: 'current-world',
      },
    ],
  },
  {
    id: '10000000-0000-4000-8000-000000000008',
    name: 'România',
    icon: 'flag-romania',
    children: [
      {
        id: '18000000-0000-4000-8000-000000000001',
        name: 'Cultură și tradiții românești',
        icon: 'romanian-traditions',
      },
      {
        id: '18000000-0000-4000-8000-000000000002',
        name: 'Personalități românești',
        icon: 'romanian-people',
      },
      {
        id: '18000000-0000-4000-8000-000000000003',
        name: 'Instituții și simboluri naționale',
        icon: 'romanian-symbols',
      },
      {
        id: '18000000-0000-4000-8000-000000000004',
        name: 'Județe și orașe',
        icon: 'romanian-cities',
      },
      {
        id: '18000000-0000-4000-8000-000000000005',
        name: 'Limba română',
        icon: 'romanian-language',
      },
      {
        id: '18000000-0000-4000-8000-000000000006',
        name: 'Natură și patrimoniu românesc',
        icon: 'romanian-heritage',
      },
    ],
  },
  {
    id: '19000000-0000-4000-8000-000000000001',
    code: 'general-knowledge',
    name: 'Cultură generală',
    icon: 'general-knowledge',
    children: [
      {
        id: '19100000-0000-4000-8000-000000000001',
        name: 'Cunoaștere mixtă',
        icon: 'mixed-knowledge',
      },
    ],
  },
  {
    id: '19000000-0000-4000-8000-000000000002',
    code: 'art',
    name: 'Artă',
    icon: 'art',
    children: [
      {
        id: '19200000-0000-4000-8000-000000000001',
        name: 'Arte vizuale',
        icon: 'visual-arts',
      },
    ],
  },
  {
    id: '19000000-0000-4000-8000-000000000003',
    code: 'cars',
    name: 'Automobile',
    icon: 'cars',
    children: [
      {
        id: '19300000-0000-4000-8000-000000000001',
        name: 'Istorie și inginerie auto',
        icon: 'car-engineering',
      },
    ],
  },
  {
    id: '19000000-0000-4000-8000-000000000004',
    code: 'economy',
    name: 'Economie',
    icon: 'economy',
    children: [
      {
        id: '19400000-0000-4000-8000-000000000001',
        name: 'Economie generală',
        icon: 'economy-basics',
      },
    ],
  },
  {
    id: '19000000-0000-4000-8000-000000000005',
    code: 'royal-challenge',
    name: 'Provocarea Regală',
    icon: 'royal-challenge',
    children: [
      {
        id: '19500000-0000-4000-8000-000000000001',
        name: 'Întrebări de elită',
        icon: 'elite-questions',
      },
    ],
  },
] as const satisfies readonly TaxonomyRoot[];

export const OWNER_GAMEPLAY_CATEGORY_CODES = [
  'geography',
  'history',
  'science',
  'wars',
  'gaming',
  'movies',
  'music',
  'sports',
  'general-knowledge',
  'technology',
  'mythology',
  'animals',
  'space',
  'literature',
  'art',
  'cars',
  'logic',
  'economy',
  'medieval',
  'royal-challenge',
] as const;

export const INITIAL_TAXONOMY_ROOT_COUNT = INITIAL_CATEGORY_TAXONOMY.length;
export const INITIAL_TAXONOMY_CHILD_COUNT = INITIAL_CATEGORY_TAXONOMY.reduce(
  (count, root) => count + root.children.length,
  0,
);
export const INITIAL_TAXONOMY_TOTAL_COUNT =
  INITIAL_TAXONOMY_ROOT_COUNT + INITIAL_TAXONOMY_CHILD_COUNT;

export function validateTaxonomyDefinition(
  taxonomy: readonly TaxonomyRoot[],
): void {
  const ids = new Set<string>();
  const rootNames = new Set<string>();
  const codes = new Set<string>();
  const uuidPattern =
    /^[0-9a-f]{8}-[0-9a-f]{4}-4[0-9a-f]{3}-[89ab][0-9a-f]{3}-[0-9a-f]{12}$/i;

  for (const root of taxonomy) {
    if (!uuidPattern.test(root.id) || ids.has(root.id)) {
      throw new Error(`ID invalid sau duplicat în taxonomy: ${root.id}`);
    }
    if (rootNames.has(root.name)) {
      throw new Error(`Categorie-rădăcină duplicată: ${root.name}`);
    }
    if (root.children.length === 0) {
      throw new Error(`Categoria ${root.name} nu are subcategorii.`);
    }
    ids.add(root.id);
    rootNames.add(root.name);
    registerCode(root, codes);

    const childNames = new Set<string>();
    for (const child of root.children) {
      if (!uuidPattern.test(child.id) || ids.has(child.id)) {
        throw new Error(`ID invalid sau duplicat în taxonomy: ${child.id}`);
      }
      if (childNames.has(child.name)) {
        throw new Error(
          `Subcategorie duplicată sub ${root.name}: ${child.name}`,
        );
      }
      ids.add(child.id);
      childNames.add(child.name);
      registerCode(child, codes);
    }
  }

  for (const code of OWNER_GAMEPLAY_CATEGORY_CODES) {
    if (!codes.has(code)) {
      throw new Error(`Categoria cerută lipsește din taxonomy: ${code}`);
    }
  }
}

function registerCode(node: TaxonomyNode, codes: Set<string>): void {
  if (node.code === undefined) return;
  if (!/^[a-z0-9]+(?:-[a-z0-9]+)*$/.test(node.code)) {
    throw new Error(`Cod invalid în taxonomy: ${node.code}`);
  }
  if (codes.has(node.code)) {
    throw new Error(`Cod duplicat în taxonomy: ${node.code}`);
  }
  codes.add(node.code);
}
