/**
 * Catalogul de cosmetice din `owner-plan.md` §4.1, §4.2 și §4.5.
 *
 * Catalogul trăiește în cod, nu într-o migrare cu `INSERT`-uri: e date de
 * configurare, iar codul e locul unde se pot citi condițiile de deblocare
 * alături de restul regulilor. Serviciul îl reconciliază în baza de date la
 * pornire, idempotent, ca `cosmetics.code` să existe pentru cheile străine din
 * inventar.
 *
 * **Numele de aici nu ajung pe ecran.** Sunt etichete pentru bază și pentru
 * viitorul admin panel (§13.3); aplicația traduce după `code`, fiindcă textul
 * vizibil trece prin i18n (`agents.md`).
 *
 * **Ce lipsește conștient**: prețuri reale în monedă. §9 cere un magazin cu
 * flux de cumpărare; până există, un preț afișat fără buton de cumpărare ar fi
 * o promisiune goală. Tot ce e aici se deblochează prin progres.
 */

export type CosmeticKind =
  | 'AVATAR'
  | 'FRAME'
  | 'BANNER'
  | 'NAME_STYLE'
  | 'TITLE';

export type CosmeticRarity =
  | 'common'
  | 'rare'
  | 'epic'
  | 'legendary'
  | 'mythic';

export interface CatalogCosmetic {
  readonly code: string;
  readonly type: CosmeticKind;
  /** Etichetă internă (bază + admin). Aplicația traduce după `code`. */
  readonly name: string;
  readonly rarity: CosmeticRarity;
  /** Nivel de cont minim (§7.3). `null` = nu se deblochează prin nivel. */
  readonly unlockLevel: number | null;
  /** Treaptă de rang minimă, ca `order` din §5.1. `null` = fără cerință. */
  readonly unlockRankOrder: number | null;
  readonly sortOrder: number;
}

/**
 * Ce primește orice cont, din prima. Fără el, un profil nou n-ar avea nimic
 * echipat și fiecare ecran ar trebui să inventeze un „dacă lipsește".
 */
export const DEFAULT_COSMETICS: Readonly<Record<CosmeticKind, string | null>> =
  Object.freeze({
    AVATAR: 'avatar-duelist-blue',
    FRAME: 'frame-gold',
    BANNER: 'banner-midnight',
    NAME_STYLE: 'name-parchment',
    // Titlul nu are implicit: un jucător nou pur și simplu n-are niciunul, iar
    // a-i pune unul din oficiu ar goli de sens deblocarea celorlalte.
    TITLE: null,
  });

/**
 * Culorile de accent ale paginii de profil (§4.8).
 *
 * Set închis, nu o valoare liberă de culoare: §4.8 cere explicit „un set curat
 * de opțiuni presetate", ca profilurile să rămână lizibile și coerente cu
 * sistemul de design.
 */
export const THEME_ACCENTS: readonly string[] = Object.freeze([
  'gold',
  'azure',
  'ember',
  'emerald',
  'amethyst',
]);

export const DEFAULT_THEME_ACCENT = 'gold';

export function isKnownThemeAccent(value: string): boolean {
  return THEME_ACCENTS.includes(value);
}

/**
 * Rangurile, ca `order` din `rank-tiers.ts`: 22 de trepte, unde 7 = Cercetător
 * III, 10 = Erudit III, 13 = Sofist III, 19 = Oracol III, 22 = Mare Maestru.
 */
export const COSMETIC_CATALOG: readonly CatalogCosmetic[] = Object.freeze([
  // --- Portrete (§4.1) ---
  // Doar două: sunt singurele două ilustrații care există cu adevărat în
  // `mobile/assets/game/avatars/`. Restul rândurilor din §4.1 („avatare
  // presetate tematice", upload custom cu moderare) cer artă și o conductă de
  // moderare a imaginilor — vezi `ASSET_GAPS.md`.
  {
    code: 'avatar-duelist-blue',
    type: 'AVATAR',
    name: 'Duelist — azur',
    rarity: 'common',
    unlockLevel: 1,
    unlockRankOrder: null,
    sortOrder: 10,
  },
  {
    code: 'avatar-duelist-crimson',
    type: 'AVATAR',
    name: 'Duelist — purpuriu',
    rarity: 'common',
    unlockLevel: 1,
    unlockRankOrder: null,
    sortOrder: 20,
  },

  // --- Rame de portret (§4.1, „avatar decorations") ---
  // Desenate în aplicație, nu imagini: o ramă e un inel colorat peste portret,
  // iar codul o poate reda la orice dimensiune fără o variantă de asset.
  {
    code: 'frame-gold',
    type: 'FRAME',
    name: 'Ramă de aur',
    rarity: 'common',
    unlockLevel: 1,
    unlockRankOrder: null,
    sortOrder: 10,
  },
  {
    code: 'frame-silver',
    type: 'FRAME',
    name: 'Ramă de argint',
    rarity: 'common',
    unlockLevel: 5,
    unlockRankOrder: null,
    sortOrder: 20,
  },
  {
    code: 'frame-emerald',
    type: 'FRAME',
    name: 'Ramă de smarald',
    rarity: 'rare',
    unlockLevel: 12,
    unlockRankOrder: null,
    sortOrder: 30,
  },
  {
    code: 'frame-sapphire',
    type: 'FRAME',
    name: 'Ramă de safir',
    rarity: 'rare',
    unlockLevel: null,
    unlockRankOrder: 10,
    sortOrder: 40,
  },
  {
    code: 'frame-amethyst',
    type: 'FRAME',
    name: 'Ramă de ametist',
    rarity: 'epic',
    unlockLevel: null,
    unlockRankOrder: 16,
    sortOrder: 50,
  },
  {
    code: 'frame-ember',
    type: 'FRAME',
    name: 'Ramă de jar',
    rarity: 'legendary',
    unlockLevel: null,
    unlockRankOrder: 22,
    sortOrder: 60,
  },

  // --- Bannere de profil (§4.2) ---
  // §4.2 permite explicit „imagine **sau** gradient"; sunt degradeuri desenate,
  // deci sunt cosmetice reale, nu substitute pentru artă care lipsește.
  {
    code: 'banner-midnight',
    type: 'BANNER',
    name: 'Miez de noapte',
    rarity: 'common',
    unlockLevel: 1,
    unlockRankOrder: null,
    sortOrder: 10,
  },
  {
    code: 'banner-dawn',
    type: 'BANNER',
    name: 'Zori peste regat',
    rarity: 'common',
    unlockLevel: 8,
    unlockRankOrder: null,
    sortOrder: 20,
  },
  {
    code: 'banner-ember',
    type: 'BANNER',
    name: 'Jar de asfințit',
    rarity: 'rare',
    unlockLevel: 18,
    unlockRankOrder: null,
    sortOrder: 30,
  },
  {
    code: 'banner-emerald',
    type: 'BANNER',
    name: 'Codrul de smarald',
    rarity: 'rare',
    unlockLevel: 30,
    unlockRankOrder: null,
    sortOrder: 40,
  },
  {
    code: 'banner-royal',
    type: 'BANNER',
    name: 'Purpură regală',
    rarity: 'epic',
    unlockLevel: null,
    unlockRankOrder: 13,
    sortOrder: 50,
  },
  {
    code: 'banner-legend',
    type: 'BANNER',
    name: 'Cerul legendelor',
    rarity: 'legendary',
    unlockLevel: null,
    unlockRankOrder: 22,
    sortOrder: 60,
  },

  // --- Stiluri de nume (§4.5) ---
  {
    code: 'name-parchment',
    type: 'NAME_STYLE',
    name: 'Pergament',
    rarity: 'common',
    unlockLevel: 1,
    unlockRankOrder: null,
    sortOrder: 10,
  },
  {
    code: 'name-azure',
    type: 'NAME_STYLE',
    name: 'Azur',
    rarity: 'common',
    unlockLevel: 10,
    unlockRankOrder: null,
    sortOrder: 20,
  },
  {
    code: 'name-ember',
    type: 'NAME_STYLE',
    name: 'Jar',
    rarity: 'rare',
    unlockLevel: null,
    unlockRankOrder: 10,
    sortOrder: 30,
  },
  {
    code: 'name-legend',
    type: 'NAME_STYLE',
    name: 'Aur viu',
    rarity: 'legendary',
    unlockLevel: null,
    unlockRankOrder: 22,
    sortOrder: 40,
  },

  // --- Titluri de nume (§4.5) ---
  // §4.5 cere titluri derivate din rang **sau** dintr-un achievement ales.
  // Cele din rang sunt aici; cele din achievements vin cu §3, care încă n-are
  // sistem — un titlu legat de un achievement inexistent n-ar fi deblocabil.
  {
    code: 'title-cuceritor',
    type: 'TITLE',
    name: 'Cuceritor de Întrebări',
    rarity: 'common',
    unlockLevel: 10,
    unlockRankOrder: null,
    sortOrder: 10,
  },
  {
    code: 'title-cartograf',
    type: 'TITLE',
    name: 'Cartograf al Regatului',
    rarity: 'rare',
    unlockLevel: null,
    unlockRankOrder: 7,
    sortOrder: 20,
  },
  {
    code: 'title-mare-erudit',
    type: 'TITLE',
    name: 'Marele Erudit',
    rarity: 'epic',
    unlockLevel: null,
    unlockRankOrder: 10,
    sortOrder: 30,
  },
  {
    code: 'title-glas-oracol',
    type: 'TITLE',
    name: 'Glas al Oracolului',
    rarity: 'epic',
    unlockLevel: null,
    unlockRankOrder: 19,
    sortOrder: 40,
  },
  {
    code: 'title-legenda',
    type: 'TITLE',
    name: 'Legendă a Regatului',
    rarity: 'mythic',
    unlockLevel: null,
    unlockRankOrder: 22,
    sortOrder: 50,
  },
]);

export interface UnlockContext {
  readonly level: number;
  /** Treapta de rang atinsă, ca `order` din §5.1. */
  readonly rankOrder: number;
  /** Ce a fost cumpărat sau acordat explicit (`user_inventory`). */
  readonly ownedCodes: ReadonlySet<string>;
}

/**
 * Dacă jucătorul poate purta cosmeticul.
 *
 * Deblocarea prin progres se **calculează la citire**, nu se materializează în
 * inventar la momentul atingerii pragului. Altfel ar fi nevoie de un job care
 * urmărește fiecare creștere de nivel și de rang, iar o singură rulare ratată
 * ar lăsa jucători cu recompense nedecontate, fără nicio urmă vizibilă.
 */
export function isUnlocked(
  cosmetic: CatalogCosmetic,
  context: UnlockContext,
): boolean {
  if (context.ownedCodes.has(cosmetic.code)) return true;
  if (cosmetic.unlockLevel !== null && context.level >= cosmetic.unlockLevel) {
    return true;
  }
  if (
    cosmetic.unlockRankOrder !== null &&
    context.rankOrder >= cosmetic.unlockRankOrder
  ) {
    return true;
  }
  return false;
}

export function catalogByCode(code: string): CatalogCosmetic | undefined {
  return COSMETIC_CATALOG.find((cosmetic) => cosmetic.code === code);
}

export function catalogOfType(
  type: CosmeticKind,
): readonly CatalogCosmetic[] {
  return COSMETIC_CATALOG.filter((cosmetic) => cosmetic.type === type).sort(
    (a, b) => a.sortOrder - b.sortOrder,
  );
}
