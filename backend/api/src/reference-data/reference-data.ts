export interface LanguageDefinition {
  readonly isoCode: string;
  readonly nameKey: string;
  readonly isGlobalPool: boolean;
  readonly active: boolean;
}

export interface CountryDefinition {
  readonly isoAlpha2: string;
  readonly nameKey: string;
  readonly defaultLanguageIsoCode: string;
  readonly active: boolean;
}

/** Limbile active la lansare, conform owner-plan.md §10.5 și §10.8. */
export const ACTIVE_LANGUAGES: readonly LanguageDefinition[] = Object.freeze([
  {
    isoCode: 'ro',
    nameKey: 'language.ro.name',
    isGlobalPool: false,
    active: true,
  },
  {
    isoCode: 'en',
    nameKey: 'language.en.name',
    isGlobalPool: true,
    active: true,
  },
]);

/**
 * Codurile curente ISO-3166-1 alpha-2.
 *
 * ISO păstrează registrul normativ, iar lista este verificată și față de
 * setul `regular` din Unicode CLDR. Codurile CLDR doar regionale (de exemplu
 * AC, CP, DG sau XK) nu intră aici, pentru că SRV-001 cere strict ISO-3166.
 */
export const ISO_3166_ALPHA2_CODES: readonly string[] = Object.freeze(
  `AD AE AF AG AI AL AM AO AQ AR AS AT AU AW AX AZ BA BB BD BE
BF BG BH BI BJ BL BM BN BO BQ BR BS BT BV BW BY BZ CA CC CD
CF CG CH CI CK CL CM CN CO CR CU CV CW CX CY CZ DE DJ DK DM
DO DZ EC EE EG EH ER ES ET FI FJ FK FM FO FR GA GB GD GE GF
GG GH GI GL GM GN GP GQ GR GS GT GU GW GY HK HM HN HR HT HU
ID IE IL IM IN IO IQ IR IS IT JE JM JO JP KE KG KH KI KM KN
KP KR KW KY KZ LA LB LC LI LK LR LS LT LU LV LY MA MC MD ME
MF MG MH MK ML MM MN MO MP MQ MR MS MT MU MV MW MX MY MZ NA
NC NE NF NG NI NL NO NP NR NU NZ OM PA PE PF PG PH PK PL PM
PN PR PS PT PW PY QA RE RO RS RU RW SA SB SC SD SE SG SH SI
SJ SK SL SM SN SO SR SS ST SV SX SY SZ TC TD TF TG TH TJ TK
TL TM TN TO TR TT TV TW TZ UA UG UM US UY UZ VA VC VE VG VI
VN VU WF WS YE YT ZA ZM ZW`.split(/\s+/),
);

const ROMANIAN_DEFAULT_COUNTRIES = new Set(['MD', 'RO']);

export const COUNTRIES: readonly CountryDefinition[] = Object.freeze(
  ISO_3166_ALPHA2_CODES.map((isoAlpha2) => ({
    isoAlpha2,
    nameKey: `country.${isoAlpha2.toLowerCase()}.name`,
    defaultLanguageIsoCode: ROMANIAN_DEFAULT_COUNTRIES.has(isoAlpha2)
      ? 'ro'
      : 'en',
    active: true,
  })),
);

export function validateReferenceDataDefinition(
  languages: readonly LanguageDefinition[] = ACTIVE_LANGUAGES,
  countries: readonly CountryDefinition[] = COUNTRIES,
): void {
  const languageCodes = new Set<string>();
  let globalPools = 0;
  for (const language of languages) {
    if (!/^[a-z]{2,3}$/.test(language.isoCode)) {
      throw new Error(`Cod de limbă invalid: ${language.isoCode}.`);
    }
    if (languageCodes.has(language.isoCode)) {
      throw new Error(`Cod de limbă duplicat: ${language.isoCode}.`);
    }
    if (!/^language\.[a-z]{2,3}\.name$/.test(language.nameKey)) {
      throw new Error(`Cheie de traducere invalidă: ${language.nameKey}.`);
    }
    languageCodes.add(language.isoCode);
    if (language.isGlobalPool) globalPools += 1;
  }
  if (
    globalPools !== 1 ||
    !languages.some((item) => item.isoCode === 'en' && item.isGlobalPool)
  ) {
    throw new Error('Engleza trebuie să fie singurul pool global.');
  }

  const countryCodes = new Set<string>();
  for (const country of countries) {
    if (!/^[A-Z]{2}$/.test(country.isoAlpha2)) {
      throw new Error(`Cod de țară invalid: ${country.isoAlpha2}.`);
    }
    if (countryCodes.has(country.isoAlpha2)) {
      throw new Error(`Cod de țară duplicat: ${country.isoAlpha2}.`);
    }
    if (country.nameKey !== `country.${country.isoAlpha2.toLowerCase()}.name`) {
      throw new Error(`Cheie de traducere invalidă: ${country.nameKey}.`);
    }
    if (!languageCodes.has(country.defaultLanguageIsoCode)) {
      throw new Error(
        `Țara ${country.isoAlpha2} indică limba inactivă ${country.defaultLanguageIsoCode}.`,
      );
    }
    countryCodes.add(country.isoAlpha2);
  }
  if (countryCodes.size !== 249) {
    throw new Error(
      `Registrul ISO-3166 trebuie să aibă 249 de coduri, nu ${countryCodes.size}.`,
    );
  }
}
