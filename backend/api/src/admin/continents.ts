/// Codul ISO-3166 alpha-2 → continent.
///
/// Tabel de referință, ținut într-un singur loc. `users.country_code` e
/// singura informație geografică pe care o are contul, deci gruparea pe
/// continente se face aici, nu în interogare: o instrucțiune `CASE` cu două
/// sute de ramuri în SQL ar fi imposibil de revizuit.
const GROUPS: Record<string, string> = {
  'North America':
    'US CA MX GT CU HT DO HN NI SV CR PA JM TT BS BZ BB LC VC GD AG DM KN PR GL BM AW CW SX TC VG VI KY MS AI BQ MQ GP',
  'South America': 'BR AR CO PE VE CL EC BO PY UY GY SR GF FK',
  Europe:
    'RO DE FR GB IT ES PL UA NL BE CZ GR PT SE HU AT CH BG RS DK FI SK NO IE HR MD BA AL LT SI LV EE MK MT IS LU ME AD MC LI SM VA GI FO AX JE GG IM BY RU',
  Asia:
    'CN IN ID PK BD JP PH VN TR IR TH MM KR IQ AF SA UZ MY YE NP KP LK KZ SY KH JO AZ AE TJ IL LA LB KG TM SG OM PS KW GE MN AM QA BH TL BT MV BN HK MO TW CY',
  Africa:
    'NG ET EG CD TZ ZA KE UG DZ SD MA AO MZ GH MG CM CI NE BF ML MW ZM SN TD SO ZW GN RW BJ BI TN SS TG SL LY LR CF MR ER NA GM BW GA LS GW GQ MU SZ DJ KM CV ST SC EH RE YT SH',
  Oceania: 'AU PG NZ FJ SB VU NC PF WS GU KI FM TO MH PW CK NR TV AS MP NU TK WF NF',
};

const BY_CODE = new Map<string, string>();
for (const [continent, codes] of Object.entries(GROUPS)) {
  for (const code of codes.split(' ')) BY_CODE.set(code, continent);
}

/// Ordinea în care se afișează, ca legenda să nu sară de la o încărcare la
/// alta când două continente au același număr de jucători.
export const CONTINENTS = [
  'North America', 'Europe', 'Asia', 'South America', 'Oceania', 'Africa', 'Necunoscut',
] as const;

export function continentOf(countryCode: string | null | undefined): string {
  if (!countryCode) return 'Necunoscut';
  return BY_CODE.get(countryCode.toUpperCase()) ?? 'Necunoscut';
}

/// Codurile de țară dintr-un continent, pentru filtrarea listei de jucători.
/// Se citesc din aceeași sursă ca `continentOf`, ca cele două să nu poată
/// ajunge niciodată în dezacord.
export function countriesIn(continent: string): string[] {
  return GROUPS[continent]?.split(' ') ?? [];
}
