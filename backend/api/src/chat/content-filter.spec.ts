import {
  containsProfanity,
  countLinks,
  detectSpam,
  filterMessage,
  normalizeForMatching,
} from './content-filter';

describe('filtru de conținut (§2.6)', () => {
  it('prinde profanitatea scrisă cu diacritice și substituiri', () => {
    expect(containsProfanity('ce cretin')).toBe(true);
    expect(containsProfanity('CRET1N')).toBe(true);
    expect(containsProfanity('creeeetin')).toBe(true);
    expect(containsProfanity('c-r-e-t-i-n')).toBe(true);
  });

  it('nu confundă un text curat cu unul murdar', () => {
    expect(containsProfanity('bună partidă, felicitări')).toBe(false);
    expect(containsProfanity('istoria României e categoria mea')).toBe(false);
  });

  it('maschează doar cuvântul, nu toată propoziția', () => {
    // Restul frazei rămâne vizibil: destinatarul trebuie să poată judeca dacă
    // merită raportat, iar un mesaj gol nu-i spune nimic.
    const result = filterMessage('esti un idiot, serios');
    expect(result.hasProfanity).toBe(true);
    expect(result.sanitized).toContain('esti un');
    expect(result.sanitized).toContain('serios');
    expect(result.sanitized).not.toContain('idiot');
  });

  it('lasă mesajele curate neatinse', () => {
    const result = filterMessage('hai la o revanșă');
    expect(result.hasProfanity).toBe(false);
    expect(result.sanitized).toBe('hai la o revanșă');
  });

  it('numără linkurile, inclusiv fără schemă', () => {
    expect(countLinks('vezi https://exemplu.ro/pagina')).toBe(1);
    expect(countLinks('intra pe www.ceva.com sau altceva.xyz')).toBe(2);
    expect(countLinks('fara niciun link aici')).toBe(0);
  });

  it('normalizarea nu lasă spații sau punctuație să ascundă cuvinte', () => {
    expect(normalizeForMatching('I. D. I. O. T')).toBe('idiot');
  });

  describe('detecție de spam', () => {
    it('acceptă un mesaj normal', () => {
      expect(
        detectSpam({ message: 'salut', recentMessages: ['ce faci'] }).isSpam,
      ).toBe(false);
    });

    it('prinde același mesaj repetat', () => {
      const verdict = detectSpam({
        message: 'cumpara aici',
        recentMessages: ['cumpara aici', 'CUMPĂRĂ AICI'],
      });
      expect(verdict).toEqual({ isSpam: true, reason: 'repetition' });
    });

    it('prinde potopul de linkuri chiar dacă textul diferă', () => {
      const verdict = detectSpam({
        message: 'si aici d.com',
        recentMessages: ['vezi a.com', 'sau b.com', 'ori c.com'],
      });
      expect(verdict).toEqual({ isSpam: true, reason: 'link_flood' });
    });

    it('prinde debitul prea mare de mesaje', () => {
      const verdict = detectSpam({
        message: 'inca unul',
        recentMessages: Array.from({ length: 8 }, (_, i) => `mesaj ${i}`),
      });
      expect(verdict).toEqual({ isSpam: true, reason: 'flood' });
    });

    it('un mesaj gol nu se numără ca repetiție', () => {
      // Altfel două mesaje formate doar din emoji ar declanșa mut automat.
      const verdict = detectSpam({
        message: '🙂',
        recentMessages: ['🙂', '🙂'],
      });
      expect(verdict.isSpam).toBe(false);
    });
  });
});
