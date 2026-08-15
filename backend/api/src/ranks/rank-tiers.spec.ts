import {
  eloToNextTier,
  LEGEND_TITLE,
  RANK_TIERS,
  resolveRank,
  tierForElo,
  tierLabel,
  tierProgress,
} from './rank-tiers';

describe('treptele de rang', () => {
  it('acoperă minimul de 20 de trepte cerut de owner-plan', () => {
    expect(RANK_TIERS.length).toBeGreaterThanOrEqual(20);
  });

  it('are ordine strict crescătoare și intervale fără goluri sau suprapuneri', () => {
    for (let index = 0; index < RANK_TIERS.length; index += 1) {
      const tier = RANK_TIERS[index];
      expect(tier.order).toBe(index + 1);

      const next = RANK_TIERS[index + 1];
      if (!next) {
        expect(tier.eloMax).toBeNull();
        continue;
      }
      expect(tier.eloMax).not.toBeNull();
      expect(next.eloMin).toBe((tier.eloMax as number) + 1);
    }
  });

  it('începe de la 0 și se termină fără plafon', () => {
    expect(RANK_TIERS[0].eloMin).toBe(0);
    expect(RANK_TIERS[RANK_TIERS.length - 1].eloMax).toBeNull();
    expect(RANK_TIERS[RANK_TIERS.length - 1].majorName).toBe('Mare Maestru');
  });

  it('are chei unice pentru assets', () => {
    const keys = new Set(RANK_TIERS.map((tier) => tier.key));
    expect(keys.size).toBe(RANK_TIERS.length);
  });

  it('numerotează diviziunile de la III (jos) la I (sus)', () => {
    const novice = RANK_TIERS.filter((tier) => tier.majorRank === 1);
    expect(novice.map((tier) => tier.division)).toEqual([3, 2, 1]);
    expect(novice[0].eloMin).toBeLessThan(novice[2].eloMin);
  });
});

describe('tierForElo', () => {
  it('plasează jucătorul nou (1000) în Cercetător', () => {
    expect(tierForElo(1000).majorName).toBe('Cercetător');
  });

  it('respectă limitele intervalelor', () => {
    expect(tierLabel(tierForElo(0))).toBe('Novice III');
    expect(tierLabel(tierForElo(599))).toBe('Novice I');
    expect(tierLabel(tierForElo(600))).toBe('Ucenic III');
    expect(tierLabel(tierForElo(2999))).toBe('Oracol I');
    expect(tierLabel(tierForElo(3000))).toBe('Mare Maestru');
    expect(tierLabel(tierForElo(99999))).toBe('Mare Maestru');
  });

  it('tratează ELO negativ ca prima treaptă, nu ca eroare', () => {
    expect(tierForElo(-250).order).toBe(1);
  });
});

describe('progres între trepte', () => {
  it('spune câte puncte mai sunt până la treapta următoare', () => {
    expect(eloToNextTier(0)).toBe(200);
    expect(eloToNextTier(150)).toBe(50);
    expect(eloToNextTier(5000)).toBeNull();
  });

  it('raportează progresul în interiorul treptei', () => {
    expect(tierProgress(0)).toBe(0);
    expect(tierProgress(100)).toBeCloseTo(0.5, 2);
    expect(tierProgress(4000)).toBe(1);
  });
});

describe('resolveRank', () => {
  it('întoarce eticheta completă și progresul', () => {
    const rank = resolveRank(1044);

    expect(rank.label).toBe('Cercetător III');
    expect(rank.elo).toBe(1044);
    expect(rank.isLegend).toBe(false);
    expect(rank.totalTiers).toBe(RANK_TIERS.length);
    expect(rank.eloToNextTier).toBeGreaterThan(0);
  });

  it('acordă titlul de Legendă doar în Top 100 și doar la vârf', () => {
    expect(resolveRank(3200, 1).isLegend).toBe(true);
    expect(resolveRank(3200, 1).label).toBe(LEGEND_TITLE.name);
    expect(resolveRank(3200, 101).isLegend).toBe(false);
    // Un jucător din Top 100 care nu a atins vârful rămâne la rangul lui.
    expect(resolveRank(1500, 3).isLegend).toBe(false);
    expect(resolveRank(3200, null).isLegend).toBe(false);
  });
});
