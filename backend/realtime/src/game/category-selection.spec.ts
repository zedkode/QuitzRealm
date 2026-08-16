import { agreeOnCategories } from './category-selection';

describe('acordul pe categorii', () => {
  it('fără nicio preferință, partida merge pe toate', () => {
    expect(agreeOnCategories([[], []])).toEqual([]);
  });

  it('un singur jucător cu preferințe le impune pe ale lui', () => {
    // Celălalt a acceptat orice, deci nu are ce restrânge.
    expect(agreeOnCategories([['history', 'science'], []])).toEqual([
      'history',
      'science',
    ]);
  });

  it('ia intersecția, nu reuniunea', () => {
    // Cine a cerut doar istorie n-are de ce să primească sport.
    expect(
      agreeOnCategories([
        ['history', 'science', 'sports'],
        ['science', 'sports', 'music'],
      ]),
    ).toEqual(['science', 'sports']);
  });

  it('preferințele disjuncte cad înapoi pe toate categoriile', () => {
    // Un meci fără nicio întrebare disponibilă ar fi mai rău decât unul cu
    // categorii pe care nimeni nu le-a cerut explicit.
    expect(agreeOnCategories([['history'], ['sports']])).toEqual([]);
  });

  it('funcționează și pentru lobby-uri de mai mulți jucători', () => {
    expect(
      agreeOnCategories([
        ['history', 'science', 'art'],
        ['science', 'art'],
        [],
        ['art', 'science', 'music'],
      ]),
    ).toEqual(['art', 'science']);
  });

  it('rezultatul e stabil ca ordine', () => {
    expect(
      agreeOnCategories([
        ['sports', 'art', 'history'],
        ['history', 'sports', 'art'],
      ]),
    ).toEqual(['art', 'history', 'sports']);
  });
});
