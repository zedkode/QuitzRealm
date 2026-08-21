import { BadRequestException, type ValidationError } from '@nestjs/common';
import type { LocalizedErrorPayload } from './localization.types';

export function localizedValidationException(
  errors: ValidationError[],
): BadRequestException {
  const fields = Array.from(new Set(collectFieldPaths(errors))).sort();
  const payload: LocalizedErrorPayload = {
    code: 'VALIDATION_FAILED',
    messageKey: 'error.validation.failed',
    params: { fields },
  };
  return new BadRequestException(payload);
}

function collectFieldPaths(
  errors: readonly ValidationError[],
  prefix = '',
): string[] {
  const fields: string[] = [];
  for (const error of errors) {
    const path = prefix ? `${prefix}.${error.property}` : error.property;
    if (error.children && error.children.length > 0) {
      fields.push(...collectFieldPaths(error.children, path));
    } else if (path) {
      fields.push(path);
    }
  }
  return fields;
}
