import { maskEmail, playerCode, trustScore } from './players.service';
import { continentOf, countriesIn } from './continents';

describe('playerCode', () => {
  it('produce un cod stabil, derivat din uuid', () => {
    const id = '9f8e7d6c-5b4a-4392-8171-0a1b2c3d4e5f';
    expect(playerCode(id)).toBe('QR-9F8E7D');
    expect(playerCode(id)).toBe(playerCode(id));
  });

  it('dă coduri diferite pentru conturi diferite', () => {
    expect(playerCode('11111111-1111-4111-8111-111111111111'))
      .not.toBe(playerCode('22222222-2222-4222-8222-222222222222'));
  });
});

describe('maskEmail', () => {
  it('lasă vizibile cel mult trei caractere din partea locală', () => {
    expect(maskEmail('astranoir@gmail.com')).toBe('ast******@gmail.com');
  });

  it('nu dezvăluie o parte locală scurtă', () => {
    // `ab` ar rămâne complet vizibil dacă masca ar fi proporțională.
    expect(maskEmail('ab@x.ro').startsWith('ab***')).toBe(true);
  });

  it('nu se sparge pe o valoare fără @', () => {
    expect(maskEmail('nu-e-email')).toBe('***');
  });
});

describe('trustScore', () => {
  const base = { correctAnswers: 0, emailVerified: false, twoFactor: false, reports: 0, banned: false };

  it('pornește de la 60 pentru un cont nou și neverificat', () => {
    expect(trustScore(base).value).toBe(60);
  });

  it('urcă odată cu treapta de încredere din chat', () => {
    const low = trustScore({ ...base, correctAnswers: 10 });
    const high = trustScore({ ...base, correctAnswers: 100_000 });
    expect(high.value).toBeGreaterThan(low.value);
    expect(high.tier).toBe(8);
  });

  it('adaugă puncte pentru e-mail confirmat și 2FA', () => {
    expect(trustScore({ ...base, emailVerified: true, twoFactor: true }).value).toBe(80);
  });

  it('scade cu rapoartele, dar nu la nesfârșit', () => {
    expect(trustScore({ ...base, reports: 4 }).value).toBe(40);
    // Penalizarea se oprește la 40 de puncte, ca rapoartele repetate ale
    // aceluiași reclamant să nu poată duce singure scorul la zero.
    expect(trustScore({ ...base, reports: 50 }).value).toBe(20);
  });

  it('rămâne în intervalul 0–100 pentru un cont suspendat', () => {
    const score = trustScore({ ...base, reports: 50, banned: true });
    expect(score.value).toBe(0);
  });

  it('explică fiecare cifră prin `basis`', () => {
    const score = trustScore({ ...base, emailVerified: true, reports: 2 });
    expect(score.basis).toContain('bază 60');
    expect(score.basis).toContain('e-mail confirmat +10');
    expect(score.basis).toContain('2 rapoarte −10');
  });
});

describe('continents', () => {
  it('așază România în Europa și Brazilia în America de Sud', () => {
    expect(continentOf('RO')).toBe('Europe');
    expect(continentOf('BR')).toBe('South America');
  });

  it('acceptă și litere mici', () => {
    expect(continentOf('ro')).toBe(continentOf('RO'));
  });

  it('nu inventează un continent pentru un cod lipsă', () => {
    expect(continentOf(null)).toBe('Necunoscut');
    expect(continentOf('ZZ')).toBe('Necunoscut');
  });

  it('`countriesIn` e inversul lui `continentOf`', () => {
    for (const code of countriesIn('Europe')) {
      expect(continentOf(code)).toBe('Europe');
    }
    expect(countriesIn('Europe')).toContain('RO');
    expect(countriesIn('Nicăieri')).toEqual([]);
  });
});
