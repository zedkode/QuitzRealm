export const DEFAULT_LOCALE = 'en';

export type LocalizedErrorParam =
  | string
  | number
  | boolean
  | null
  | readonly (string | number | boolean | null)[];

export interface LocalizedErrorPayload {
  readonly code: string;
  readonly messageKey: string;
  readonly params: Readonly<Record<string, LocalizedErrorParam>>;
}

export interface LocaleRequestContext {
  headers?: Readonly<Record<string, string | readonly string[] | undefined>>;
  user?: { readonly languageIsoCode?: string };
  locale?: string;
}

const ERROR_CODE_PATTERN = /^[A-Z][A-Z0-9_]{1,79}$/;
const MESSAGE_KEY_PATTERN = /^[a-z][a-z0-9_-]*(?:\.[a-z][a-z0-9_-]*)+$/;

export function isLocalizedErrorPayload(
  value: unknown,
): value is LocalizedErrorPayload {
  if (value === null || typeof value !== 'object') return false;
  const candidate = value as Partial<LocalizedErrorPayload>;
  return (
    typeof candidate.code === 'string' &&
    ERROR_CODE_PATTERN.test(candidate.code) &&
    typeof candidate.messageKey === 'string' &&
    MESSAGE_KEY_PATTERN.test(candidate.messageKey) &&
    isLocalizedParams(candidate.params)
  );
}

function isLocalizedParams(
  value: unknown,
): value is Readonly<Record<string, LocalizedErrorParam>> {
  if (value === null || typeof value !== 'object' || Array.isArray(value)) {
    return false;
  }
  return Object.values(value).every((entry) =>
    Array.isArray(entry)
      ? entry.every(isLocalizedParamScalar)
      : isLocalizedParamScalar(entry),
  );
}

function isLocalizedParamScalar(value: unknown): boolean {
  return (
    value === null ||
    typeof value === 'string' ||
    typeof value === 'number' ||
    typeof value === 'boolean'
  );
}
