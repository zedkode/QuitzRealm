import { AccountCapabilities } from './game.types';

export interface MatchRegion {
  requestedLanguageIsoCode: string;
  countryCode: string;
}

export type MatchRegionResolution =
  | { ok: true; region: MatchRegion }
  | {
      ok: false;
      reason: 'region_not_selected' | 'incompatible_region_pool';
    };

/**
 * Resolves the one region shared by a selected group.
 *
 * Matchmaking is intentionally not partitioned here (that belongs to SRV-044),
 * so a mixed group can be selected from the FIFO queue. It must be rejected
 * explicitly instead of silently borrowing the last player's preferences.
 */
export function resolveMatchRegion(
  capabilities: readonly AccountCapabilities[],
): MatchRegionResolution {
  const regions = capabilities.map((entry) => {
    const language = entry.languageIsoCode?.trim();
    const country = entry.countryCode?.trim();
    if (!language || !country) return null;
    return {
      requestedLanguageIsoCode: language.toLowerCase(),
      countryCode: country.toUpperCase(),
    };
  });

  if (regions.some((region) => region === null)) {
    return { ok: false, reason: 'region_not_selected' };
  }
  const complete = regions as MatchRegion[];
  const first = complete[0];
  if (
    !first ||
    complete.some(
      (region) =>
        region.requestedLanguageIsoCode !== first.requestedLanguageIsoCode ||
        region.countryCode !== first.countryCode,
    )
  ) {
    return { ok: false, reason: 'incompatible_region_pool' };
  }
  return { ok: true, region: first };
}
