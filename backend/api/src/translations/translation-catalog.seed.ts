import { Prisma, PrismaClient } from '@prisma/client';
import {
  ACTIVE_LANGUAGES,
  COUNTRIES,
  type CountryDefinition,
  type LanguageDefinition,
} from '../reference-data/reference-data';

export const FALLBACK_LANGUAGE_ISO_CODE = 'en';
export const MISSING_TRANSLATION_KEY = 'system.translation.missing';
export const QUESTION_BANK_TRANSLATION_KEYS = [
  'question_bank.fallback.global',
  'error.question_bank.unavailable',
  'error.question_bank.language_required',
  'error.question_bank.language_filter_conflict',
  'error.question_bank.category_filter_conflict',
  'error.question_bank.category_not_found',
  'error.question_bank.category_region_mismatch',
  'error.question.not_found',
  'error.question.moderation_final_status_required',
  'error.question.correct_option_required',
  'error.question.numeric_options_not_allowed',
  'error.question.numeric_answer_invalid',
  'error.question.near_duplicate',
] as const;

export interface TranslationSeedDefinition {
  readonly key: string;
  readonly languageIsoCode: string;
  readonly value: string;
}

export interface TranslationSeedResult {
  readonly inserted: number;
  readonly total: number;
}

const SYSTEM_TRANSLATIONS: Readonly<
  Record<string, Readonly<Record<string, string>>>
> = {
  en: {
    [MISSING_TRANSLATION_KEY]: 'Content unavailable',
    'error.country.not_supported': 'The selected country is not supported.',
    'error.language.not_supported': 'The selected language is not supported.',
    'error.region.cooldown_active':
      'Country and language can be changed again after {availableAt}.',
    'error.translation.fallback_unavailable':
      'The translation fallback is unavailable.',
    'error.translation.invalid_key': 'The translation key is invalid.',
    'error.translation.value_required': 'The translation value is required.',
    'error.auth.unauthorized': 'Authentication is required.',
    'error.auth.forbidden': 'You are not allowed to perform this action.',
    'error.request.invalid': 'The request is invalid.',
    'error.validation.failed': 'Some fields are invalid.',
    'error.resource.not_found': 'The requested resource was not found.',
    'error.request.conflict': 'The request conflicts with the current state.',
    'error.request.rate_limited': 'Too many requests. Please try again later.',
    'error.request.failed': 'The request could not be completed.',
    'error.service.unavailable': 'The service is temporarily unavailable.',
    'question_bank.fallback.global':
      'Questions are being served from the global {resolvedLanguage} pool.',
    'error.question_bank.unavailable':
      'No suitable questions are available for the requested pool.',
    'error.question_bank.language_required':
      'A question language must be specified.',
    'error.question_bank.language_filter_conflict':
      'Only one question language may be requested.',
    'error.question_bank.category_filter_conflict':
      'Filter questions either by category ID or by category codes, not both.',
    'error.question_bank.category_not_found':
      'The requested question category was not found.',
    'error.question_bank.category_region_mismatch':
      'The requested category is not available for this country and language.',
    'error.question.not_found': 'The requested question was not found.',
    'error.question.moderation_final_status_required':
      'Moderation must choose a final question status.',
    'error.question.correct_option_required':
      'The correct answer must be one of the available options.',
    'error.question.numeric_options_not_allowed':
      'Numeric questions cannot contain answer options.',
    'error.question.numeric_answer_invalid':
      'The answer to a numeric question must be a valid number.',
    'error.question.near_duplicate':
      'A very similar question already exists in this category.',
    'auth.page.verify.missing.title': 'Incomplete link',
    'auth.page.verify.missing.message':
      'The verification link does not contain a token.',
    'auth.page.verify.invalid.title': 'Invalid or expired link',
    'auth.page.verify.invalid.message':
      'Request a new link in the app under Settings → Account.',
    'auth.page.verify.success.title': 'Email confirmed',
    'auth.page.verify.success.message':
      'Your account is verified. You can close this page and return to the game.',
    'auth.page.reset.missing.title': 'Incomplete link',
    'auth.page.reset.missing.message':
      'The password reset link does not contain a token.',
    'auth.page.reset.form.title': 'Choose a new password',
    'auth.page.reset.form.message':
      'The password must contain at least 10 characters.',
    'auth.page.reset.form.label': 'New password',
    'auth.page.reset.form.submit': 'Save password',
    'auth.page.reset.invalid.title': 'Invalid or expired link',
    'auth.page.reset.invalid.message':
      'Request another reset from the sign-in screen.',
    'auth.page.reset.success.title': 'Password changed',
    'auth.page.reset.success.message':
      'All connected devices were signed out. Sign in again with your new password.',
  },
  ro: {
    [MISSING_TRANSLATION_KEY]: 'Conținut indisponibil',
    'error.country.not_supported': 'Țara selectată nu este disponibilă.',
    'error.language.not_supported': 'Limba selectată nu este disponibilă.',
    'error.region.cooldown_active':
      'Țara și limba pot fi schimbate din nou după {availableAt}.',
    'error.translation.fallback_unavailable':
      'Limba de rezervă pentru traduceri nu este disponibilă.',
    'error.translation.invalid_key': 'Cheia traducerii nu este validă.',
    'error.translation.value_required': 'Valoarea traducerii este obligatorie.',
    'error.auth.unauthorized': 'Este necesară autentificarea.',
    'error.auth.forbidden': 'Nu ai permisiunea pentru această acțiune.',
    'error.request.invalid': 'Cererea nu este validă.',
    'error.validation.failed': 'Unele câmpuri nu sunt valide.',
    'error.resource.not_found': 'Resursa cerută nu a fost găsită.',
    'error.request.conflict': 'Cererea intră în conflict cu starea curentă.',
    'error.request.rate_limited':
      'Ai trimis prea multe cereri. Încearcă din nou mai târziu.',
    'error.request.failed': 'Cererea nu a putut fi finalizată.',
    'error.service.unavailable': 'Serviciul este temporar indisponibil.',
    'question_bank.fallback.global':
      'Întrebările sunt preluate din banca globală în limba {resolvedLanguage}.',
    'error.question_bank.unavailable':
      'Nu există întrebări potrivite pentru banca solicitată.',
    'error.question_bank.language_required':
      'Limba întrebărilor trebuie specificată.',
    'error.question_bank.language_filter_conflict':
      'Poate fi solicitată o singură limbă pentru întrebări.',
    'error.question_bank.category_filter_conflict':
      'Filtrează întrebările fie după ID-ul categoriei, fie după coduri, nu după ambele.',
    'error.question_bank.category_not_found':
      'Categoria de întrebări solicitată nu a fost găsită.',
    'error.question_bank.category_region_mismatch':
      'Categoria solicitată nu este disponibilă pentru această țară și limbă.',
    'error.question.not_found': 'Întrebarea solicitată nu a fost găsită.',
    'error.question.moderation_final_status_required':
      'Moderarea trebuie să aleagă un statut final pentru întrebare.',
    'error.question.correct_option_required':
      'Răspunsul corect trebuie să fie una dintre opțiunile disponibile.',
    'error.question.numeric_options_not_allowed':
      'Întrebările numerice nu pot conține variante de răspuns.',
    'error.question.numeric_answer_invalid':
      'Răspunsul unei întrebări numerice trebuie să fie un număr valid.',
    'error.question.near_duplicate':
      'Există deja o întrebare foarte asemănătoare în această categorie.',
    'auth.page.verify.missing.title': 'Link incomplet',
    'auth.page.verify.missing.message':
      'Linkul de verificare nu conține un token.',
    'auth.page.verify.invalid.title': 'Link invalid sau expirat',
    'auth.page.verify.invalid.message':
      'Cere un link nou din aplicație, de la Setări → Cont.',
    'auth.page.verify.success.title': 'Adresă confirmată',
    'auth.page.verify.success.message':
      'Contul tău este verificat. Poți închide pagina și reveni în joc.',
    'auth.page.reset.missing.title': 'Link incomplet',
    'auth.page.reset.missing.message':
      'Linkul de resetare nu conține un token.',
    'auth.page.reset.form.title': 'Alege o parolă nouă',
    'auth.page.reset.form.message':
      'Parola trebuie să aibă cel puțin 10 caractere.',
    'auth.page.reset.form.label': 'Parolă nouă',
    'auth.page.reset.form.submit': 'Salvează parola',
    'auth.page.reset.invalid.title': 'Link invalid sau expirat',
    'auth.page.reset.invalid.message':
      'Cere o resetare nouă din ecranul de autentificare.',
    'auth.page.reset.success.title': 'Parolă schimbată',
    'auth.page.reset.success.message':
      'Toate dispozitivele conectate au fost deconectate. Autentifică-te din nou cu parola nouă.',
  },
};

export const SYSTEM_TRANSLATION_KEY_COUNT = Object.keys(
  SYSTEM_TRANSLATIONS.en,
).length;

function displayName(
  locale: string,
  type: 'language' | 'region',
  code: string,
): string {
  const names = new Intl.DisplayNames([locale], { type, fallback: 'none' });
  const value = names.of(code)?.trim();
  if (!value) {
    throw new Error(
      `Intl.DisplayNames nu poate rezolva ${type} ${code} în ${locale}.`,
    );
  }
  return value;
}

export function buildInitialTranslationCatalog(
  languages: readonly LanguageDefinition[] = ACTIVE_LANGUAGES,
  countries: readonly CountryDefinition[] = COUNTRIES,
): readonly TranslationSeedDefinition[] {
  const definitions: TranslationSeedDefinition[] = [];

  for (const targetLanguage of languages) {
    const locale = targetLanguage.isoCode;

    for (const language of languages) {
      definitions.push({
        key: language.nameKey,
        languageIsoCode: locale,
        value: displayName(locale, 'language', language.isoCode),
      });
    }

    for (const country of countries) {
      definitions.push({
        key: country.nameKey,
        languageIsoCode: locale,
        value: displayName(locale, 'region', country.isoAlpha2),
      });
    }

    for (const [key, value] of Object.entries(
      SYSTEM_TRANSLATIONS[locale] ?? {},
    )) {
      definitions.push({ key, languageIsoCode: locale, value });
    }
  }

  const identities = definitions.map(
    (item) => `${item.key}\u0000${item.languageIsoCode}`,
  );
  if (new Set(identities).size !== identities.length) {
    throw new Error('Catalogul inițial conține traduceri duplicate.');
  }

  return definitions.sort((left, right) =>
    `${left.key}:${left.languageIsoCode}`.localeCompare(
      `${right.key}:${right.languageIsoCode}`,
    ),
  );
}

export async function syncInitialTranslations(
  transaction: Prisma.TransactionClient,
): Promise<TranslationSeedResult> {
  const definitions = buildInitialTranslationCatalog();
  const isoCodes = ACTIVE_LANGUAGES.map((language) => language.isoCode);
  const storedLanguages = await transaction.language.findMany({
    where: { isoCode: { in: isoCodes } },
    select: { id: true, isoCode: true },
  });
  const languageIds = new Map(
    storedLanguages.map((language) => [language.isoCode, language.id]),
  );

  for (const isoCode of isoCodes) {
    if (!languageIds.has(isoCode)) {
      throw new Error(
        `Limba ${isoCode} trebuie populată înaintea traducerilor.`,
      );
    }
  }

  const result = await transaction.translation.createMany({
    data: definitions.map((definition) => ({
      key: definition.key,
      languageId: languageIds.get(definition.languageIsoCode)!,
      value: definition.value,
    })),
    skipDuplicates: true,
  });

  return { inserted: result.count, total: definitions.length };
}

export async function seedTranslationCatalog(
  prisma: PrismaClient,
): Promise<TranslationSeedResult> {
  return prisma.$transaction(syncInitialTranslations);
}
