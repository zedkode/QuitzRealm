import {
  COSMETIC_CATALOG,
  DEFAULT_COSMETICS,
  DEFAULT_THEME_ACCENT,
  THEME_ACCENTS,
  catalogByCode,
  catalogOfType,
  isKnownThemeAccent,
  isUnlocked,
} from './cosmetic-catalog';

const nothingOwned = new Set<string>();

describe('COSMETIC_CATALOG', () => {
  it('nu are coduri duplicate', () => {
    // Codul e cheia stabilă: un duplicat ar face reconcilierea în baza de date
    // să suprascrie tăcut un cosmetic cu altul.
    const codes = COSMETIC_CATALOG.map((cosmetic) => cosmetic.code);
    expect(new Set(codes).size).toBe(codes.length);
  });

  it('fiecare cosmetic are cel puțin o cale de deblocare', () => {
    // Fără nici nivel, nici rang, nici magazin (§9, încă neimplementat), un
    // cosmetic ar sta în catalog fără să poată fi obținut vreodată.
    for (const cosmetic of COSMETIC_CATALOG) {
      expect(
        cosmetic.unlockLevel !== null || cosmetic.unlockRankOrder !== null,
      ).toBe(true);
    }
  });

  it('cerințele de rang stau în intervalul treptelor reale', () => {
    // 22 de trepte în `rank-tiers.ts`; o cerință de 25 n-ar fi atinsă niciodată.
    for (const cosmetic of COSMETIC_CATALOG) {
      if (cosmetic.unlockRankOrder === null) continue;
      expect(cosmetic.unlockRankOrder).toBeGreaterThanOrEqual(1);
      expect(cosmetic.unlockRankOrder).toBeLessThanOrEqual(22);
    }
  });

  it('fiecare tip cu implicit are acel implicit în catalog și gratuit', () => {
    for (const [type, code] of Object.entries(DEFAULT_COSMETICS)) {
      if (code === null) continue;
      const cosmetic = catalogByCode(code);
      expect(cosmetic).toBeDefined();
      expect(cosmetic!.type).toBe(type);
      // Implicitul trebuie să fie purtabil din prima secundă a contului.
      expect(
        isUnlocked(cosmetic!, { level: 1, rankOrder: 1, ownedCodes: nothingOwned }),
      ).toBe(true);
    }
  });
});

describe('isUnlocked', () => {
  const byLevel = catalogByCode('frame-silver')!;
  const byRank = catalogByCode('title-mare-erudit')!;

  it('deblochează la nivelul cerut, nu înainte', () => {
    expect(
      isUnlocked(byLevel, { level: 4, rankOrder: 22, ownedCodes: nothingOwned }),
    ).toBe(false);
    expect(
      isUnlocked(byLevel, { level: 5, rankOrder: 1, ownedCodes: nothingOwned }),
    ).toBe(true);
  });

  it('deblochează la treapta de rang cerută, nu înainte', () => {
    expect(
      isUnlocked(byRank, { level: 99, rankOrder: 9, ownedCodes: nothingOwned }),
    ).toBe(false);
    expect(
      isUnlocked(byRank, { level: 1, rankOrder: 10, ownedCodes: nothingOwned }),
    ).toBe(true);
  });

  it('un cosmetic deținut rămâne purtabil chiar dacă rangul scade', () => {
    // Retrogradarea sezonieră din §5.2 nu are voie să ia înapoi ce a fost
    // acordat explicit — altfel un jucător ar rămâne fără ce purta ieri.
    expect(
      isUnlocked(byRank, {
        level: 1,
        rankOrder: 1,
        ownedCodes: new Set([byRank.code]),
      }),
    ).toBe(true);
  });
});

describe('catalogOfType', () => {
  it('întoarce doar tipul cerut, în ordinea din catalog', () => {
    const frames = catalogOfType('FRAME');
    expect(frames.length).toBeGreaterThan(1);
    expect(frames.every((cosmetic) => cosmetic.type === 'FRAME')).toBe(true);
    const orders = frames.map((cosmetic) => cosmetic.sortOrder);
    expect([...orders].sort((a, b) => a - b)).toEqual(orders);
  });
});

describe('temele de profil', () => {
  it('implicitul e o temă cunoscută', () => {
    expect(isKnownThemeAccent(DEFAULT_THEME_ACCENT)).toBe(true);
  });

  it('respinge o temă din afara setului', () => {
    expect(isKnownThemeAccent('roz-fosforescent')).toBe(false);
    expect(THEME_ACCENTS.length).toBeGreaterThan(1);
  });
});
