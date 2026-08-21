import { AccountCapabilities } from './game.types';
import { resolveMatchRegion } from './match-region';

function capabilities(
  languageIsoCode: string | null,
  countryCode: string | null,
): AccountCapabilities {
  return {
    emailVerified: true,
    isMinor: false,
    canPlayRanked: true,
    canUseGlobalChat: true,
    canPostExternalLinks: true,
    dmPermissionLocked: false,
    languageIsoCode,
    countryCode,
  };
}

describe('resolveMatchRegion', () => {
  it('normalizes and accepts one server-side region shared by the group', () => {
    expect(
      resolveMatchRegion([
        capabilities('RO', 'ro'),
        capabilities('ro', 'RO'),
      ]),
    ).toEqual({
      ok: true,
      region: { requestedLanguageIsoCode: 'ro', countryCode: 'RO' },
    });
  });

  it('requires both account preferences without inventing ro or en', () => {
    expect(
      resolveMatchRegion([capabilities(null, 'RO')]),
    ).toEqual({ ok: false, reason: 'region_not_selected' });
    expect(
      resolveMatchRegion([capabilities('ro', null)]),
    ).toEqual({ ok: false, reason: 'region_not_selected' });
  });

  it.each([
    [capabilities('ro', 'RO'), capabilities('en', 'RO')],
    [capabilities('ro', 'RO'), capabilities('ro', 'MD')],
  ])('rejects a selected group from incompatible pools', (first, second) => {
    expect(resolveMatchRegion([first, second])).toEqual({
      ok: false,
      reason: 'incompatible_region_pool',
    });
  });
});
