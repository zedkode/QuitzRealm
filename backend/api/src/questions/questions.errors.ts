import {
  BadRequestException,
  ConflictException,
  NotFoundException,
  ServiceUnavailableException,
} from '@nestjs/common';
import { LocalizedErrorParam } from '../localization/localization.types';

type Params = Readonly<Record<string, LocalizedErrorParam>>;

function payload(code: string, messageKey: string, params: Params = {}) {
  return { code, messageKey, params };
}

export function questionBadRequest(
  code: string,
  messageKey: string,
  params: Params = {},
): BadRequestException {
  return new BadRequestException(payload(code, messageKey, params));
}

export function questionConflict(
  code: string,
  messageKey: string,
  params: Params = {},
): ConflictException {
  return new ConflictException(payload(code, messageKey, params));
}

export function questionNotFound(
  code: string,
  messageKey: string,
  params: Params = {},
): NotFoundException {
  return new NotFoundException(payload(code, messageKey, params));
}

export function questionBankUnavailable(
  params: Params,
): ServiceUnavailableException {
  return new ServiceUnavailableException(
    payload(
      'QUESTION_BANK_UNAVAILABLE',
      'error.question_bank.unavailable',
      params,
    ),
  );
}
