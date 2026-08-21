import {
  Catch,
  HttpException,
  HttpStatus,
  Injectable,
  Logger,
  type ArgumentsHost,
  type ExceptionFilter,
} from '@nestjs/common';
import type { Request, Response } from 'express';
import { LocaleResolverService } from './locale-resolver.service';
import {
  DEFAULT_LOCALE,
  isLocalizedErrorPayload,
  type LocaleRequestContext,
  type LocalizedErrorPayload,
} from './localization.types';

type LocalizedRequest = Request & LocaleRequestContext;

const ERROR_BY_STATUS: Readonly<
  Record<number, Omit<LocalizedErrorPayload, 'params'>>
> = {
  [HttpStatus.BAD_REQUEST]: {
    code: 'INVALID_REQUEST',
    messageKey: 'error.request.invalid',
  },
  [HttpStatus.UNAUTHORIZED]: {
    code: 'UNAUTHORIZED',
    messageKey: 'error.auth.unauthorized',
  },
  [HttpStatus.FORBIDDEN]: {
    code: 'FORBIDDEN',
    messageKey: 'error.auth.forbidden',
  },
  [HttpStatus.NOT_FOUND]: {
    code: 'NOT_FOUND',
    messageKey: 'error.resource.not_found',
  },
  [HttpStatus.CONFLICT]: {
    code: 'CONFLICT',
    messageKey: 'error.request.conflict',
  },
  [HttpStatus.TOO_MANY_REQUESTS]: {
    code: 'TOO_MANY_REQUESTS',
    messageKey: 'error.request.rate_limited',
  },
  [HttpStatus.SERVICE_UNAVAILABLE]: {
    code: 'SERVICE_UNAVAILABLE',
    messageKey: 'error.service.unavailable',
  },
  [HttpStatus.INTERNAL_SERVER_ERROR]: {
    code: 'INTERNAL_SERVER_ERROR',
    messageKey: 'error.request.failed',
  },
};

@Catch()
@Injectable()
export class LocalizedExceptionFilter implements ExceptionFilter {
  private readonly logger = new Logger(LocalizedExceptionFilter.name);

  constructor(private readonly localeResolver: LocaleResolverService) {}

  async catch(exception: unknown, host: ArgumentsHost): Promise<void> {
    const http = host.switchToHttp();
    const request = http.getRequest<LocalizedRequest>();
    const response = http.getResponse<Response>();
    const status =
      exception instanceof HttpException
        ? exception.getStatus()
        : HttpStatus.INTERNAL_SERVER_ERROR;
    const rawResponse =
      exception instanceof HttpException ? exception.getResponse() : undefined;
    const payload = isLocalizedErrorPayload(rawResponse)
      ? rawResponse
      : this.payloadForStatus(status);

    const locale =
      request.locale ??
      (await this.localeResolver.resolve(request).catch(() => DEFAULT_LOCALE));
    request.locale = locale;
    response.vary('Accept-Language');
    response.setHeader('Content-Language', locale);

    if (!(exception instanceof HttpException) || status >= 500) {
      const type =
        exception instanceof Error
          ? exception.constructor.name
          : typeof exception;
      this.logger.error(
        `HTTP_EXCEPTION status=${status} method=${request.method} path=${request.originalUrl} type=${type}`,
      );
    }
    response.status(status).json(payload);
  }

  private payloadForStatus(status: number): LocalizedErrorPayload {
    const contract = ERROR_BY_STATUS[status] ?? {
      code: `HTTP_${status}`,
      messageKey:
        status >= 500 ? 'error.service.unavailable' : 'error.request.invalid',
    };
    return { ...contract, params: {} };
  }
}
