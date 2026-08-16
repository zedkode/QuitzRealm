import {
  assertMatchParticipants,
  DUO_MATCH_PROFILE,
  BLITZ_MATCH_PROFILE,
  publicMatchProfile,
} from './match-profile';

describe('match profiles', () => {
  it('păstrează Duo drept profilul generic pentru doi participanți', () => {
    expect(publicMatchProfile('duo')).toEqual(DUO_MATCH_PROFILE);
    expect(() =>
      assertMatchParticipants(['player-a', 'player-b'], DUO_MATCH_PROFILE),
    ).not.toThrow();
  });

  it('construiește profilul Blitz pentru doi participanți', () => {
    const profile = publicMatchProfile('blitz');
    expect(profile).toEqual(BLITZ_MATCH_PROFILE);
    expect(() => assertMatchParticipants(['player-a', 'player-b'], profile)).not.toThrow();
  });

  it.each([4, 5, 6, 7, 8])(
    'construiește profilul Clasic public pentru %i participanți',
    (playerCountTarget) => {
      const profile = publicMatchProfile('classic', playerCountTarget);

      expect(profile).toEqual({
        clientMode: 'classic',
        persistedMode: 'CLASSIC',
        playerCountTarget,
        lobbyType: 'public',
        resolutionPolicy: 'deadline',
      });
    },
  );

  it('respinge dimensiuni publice neacceptate și participanți duplicați', () => {
    expect(() => publicMatchProfile('duo', 4)).toThrow(/exact 2/);
    expect(() => publicMatchProfile('classic', 3)).toThrow(/între 4 și 8/);
    expect(() => publicMatchProfile('classic', 9)).toThrow(/între 4 și 8/);
    expect(() =>
      assertMatchParticipants(
        ['same-player', 'same-player'],
        DUO_MATCH_PROFILE,
      ),
    ).toThrow(/unici/);
  });
});
