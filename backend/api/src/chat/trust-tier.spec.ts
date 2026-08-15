import {
  TRUST_TIER_KEYS,
  TRUST_TIER_THRESHOLDS,
  chatPermissionsFor,
  tierFor,
} from './trust-tier';

const adult = { isMinor: false, emailVerified: true };

describe('trepte de încredere (§2.5)', () => {
  it('are nouă trepte, cu praguri crescătoare', () => {
    expect(TRUST_TIER_THRESHOLDS).toHaveLength(9);
    expect(TRUST_TIER_KEYS).toHaveLength(9);
    for (let i = 1; i < TRUST_TIER_THRESHOLDS.length; i += 1) {
      expect(TRUST_TIER_THRESHOLDS[i]).toBeGreaterThan(
        TRUST_TIER_THRESHOLDS[i - 1],
      );
    }
  });

  it('încadrează exact la prag, nu doar peste el', () => {
    expect(tierFor(9)).toBe(0);
    expect(tierFor(10)).toBe(1);
    expect(tierFor(49)).toBe(1);
    expect(tierFor(50)).toBe(2);
    expect(tierFor(99_999)).toBe(7);
    expect(tierFor(100_000)).toBe(8);
  });

  it('tratează valorile absurde ca zero, nu ca eroare', () => {
    // Contorul vine din baza noastră, dar un `-1` scăpat n-are voie să dea o
    // treaptă negativă și să spargă indexarea în client.
    expect(tierFor(-5)).toBe(0);
    expect(tierFor(3.9)).toBe(0);
  });

  it('deblochează chatul global treptat', () => {
    expect(chatPermissionsFor({ correctAnswers: 0, ...adult }).globalChat).toBe(
      'reactions',
    );
    expect(
      chatPermissionsFor({ correctAnswers: 10, ...adult }).globalChat,
    ).toBe('ownMatches');
    expect(
      chatPermissionsFor({ correctAnswers: 50, ...adult }).globalChat,
    ).toBe('public');
  });

  it('spune cât mai e până la treapta următoare', () => {
    const permissions = chatPermissionsFor({ correctAnswers: 30, ...adult });
    expect(permissions.tier).toBe(1);
    expect(permissions.nextTierThreshold).toBe(50);
    expect(permissions.answersToNextTier).toBe(20);
  });

  it('la ultima treaptă nu mai promite un prag următor', () => {
    const permissions = chatPermissionsFor({
      correctAnswers: 250_000,
      ...adult,
    });
    expect(permissions.tier).toBe(8);
    expect(permissions.answersToNextTier).toBeNull();
    expect(permissions.nextTierThreshold).toBeNull();
  });

  it('un cont nou nu poate iniția DM-uri către necunoscuți', () => {
    expect(
      chatPermissionsFor({ correctAnswers: 49, ...adult }).canInitiateDm,
    ).toBe(false);
    expect(
      chatPermissionsFor({ correctAnswers: 50, ...adult }).canInitiateDm,
    ).toBe(true);
  });

  it('chatul cu prietenii e deschis de la prima secundă', () => {
    // Relația e consimțită reciproc; nu are ce dovedi cineva ca s-o merite.
    expect(
      chatPermissionsFor({
        correctAnswers: 0,
        isMinor: true,
        emailVerified: false,
      }).canChatWithFriends,
    ).toBe(true);
  });

  it('minorul nu primește chat global liber, oricât ar juca', () => {
    const veteran = chatPermissionsFor({
      correctAnswers: 100_000,
      isMinor: true,
      emailVerified: true,
    });
    expect(veteran.tier).toBe(8);
    expect(veteran.globalChat).toBe('reactions');
    expect(veteran.canInitiateDm).toBe(false);
    expect(veteran.canPostLinksInGlobal).toBe(false);
  });

  it('emailul neconfirmat blochează globalul, dar nu prietenii', () => {
    const unverified = chatPermissionsFor({
      correctAnswers: 5_000,
      isMinor: false,
      emailVerified: false,
    });
    expect(unverified.globalChat).toBe('reactions');
    expect(unverified.canInitiateDm).toBe(false);
    expect(unverified.canChatWithFriends).toBe(true);
  });

  it('rapoartele veteranilor cântăresc mai mult', () => {
    expect(
      chatPermissionsFor({ correctAnswers: 0, ...adult }).reportWeight,
    ).toBe(1);
    expect(
      chatPermissionsFor({ correctAnswers: 1_000, ...adult }).reportWeight,
    ).toBe(2);
    expect(
      chatPermissionsFor({ correctAnswers: 50_000, ...adult }).reportWeight,
    ).toBe(3);
  });
});
