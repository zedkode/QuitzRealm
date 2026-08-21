import {
  BadRequestException,
  HttpStatus,
  UnauthorizedException,
  type ArgumentsHost,
  type ValidationError,
} from '@nestjs/common';
import type { Response } from 'express';
import type { LocaleResolverService } from './locale-resolver.service';
import { LocalizedExceptionFilter } from './localized-exception.filter';
import { localizedValidationException } from './validation-exception';

function httpHost(response: Partial<Response>): ArgumentsHost {
  return {
    switchToHttp: () => ({
      getRequest: () => ({
        method: 'POST',
        originalUrl: '/test',
        headers: { 'accept-language': 'ro' },
      }),
      getResponse: () => response,
      getNext: () => undefined,
    }),
    getType: () => 'http',
    getArgs: () => [],
    getArgByIndex: () => undefined,
    switchToRpc: () => ({
      getData: () => undefined,
      getContext: () => undefined,
    }),
    switchToWs: () => ({
      getData: () => undefined,
      getClient: () => undefined,
      getPattern: () => undefined,
    }),
  } as unknown as ArgumentsHost;
}

function responseMock() {
  const response = {
    status: jest.fn(),
    json: jest.fn(),
    setHeader: jest.fn(),
    vary: jest.fn(),
  };
  response.status.mockReturnValue(response);
  return response;
}

describe('LocalizedExceptionFilter', () => {
  const localeResolver = {
    resolve: jest.fn().mockResolvedValue('ro'),
  } as unknown as LocaleResolverService;

  beforeEach(() => jest.clearAllMocks());

  it('preserves a valid localized payload without adding free text', async () => {
    const response = responseMock();
    const filter = new LocalizedExceptionFilter(localeResolver);
    const exception = new BadRequestException({
      code: 'INVALID_TRANSLATION_KEY',
      messageKey: 'error.translation.invalid_key',
      params: { key: 'invalid' },
    });

    await filter.catch(exception, httpHost(response as Partial<Response>));

    expect(response.status).toHaveBeenCalledWith(HttpStatus.BAD_REQUEST);
    expect(response.json).toHaveBeenCalledWith({
      code: 'INVALID_TRANSLATION_KEY',
      messageKey: 'error.translation.invalid_key',
      params: { key: 'invalid' },
    });
    expect(response.setHeader).toHaveBeenCalledWith('Content-Language', 'ro');
    expect(response.vary).toHaveBeenCalledWith('Accept-Language');
  });

  it('replaces legacy exception text with a stable localized contract', async () => {
    const response = responseMock();
    const filter = new LocalizedExceptionFilter(localeResolver);

    await filter.catch(
      new UnauthorizedException('Date de autentificare invalide.'),
      httpHost(response as Partial<Response>),
    );

    expect(response.json).toHaveBeenCalledWith({
      code: 'UNAUTHORIZED',
      messageKey: 'error.auth.unauthorized',
      params: {},
    });
    expect(JSON.stringify(response.json.mock.calls)).not.toContain(
      'Date de autentificare invalide',
    );
  });

  it('emits only field paths for DTO validation failures', async () => {
    const response = responseMock();
    const filter = new LocalizedExceptionFilter(localeResolver);
    const errors: ValidationError[] = [
      {
        property: 'profile',
        children: [{ property: 'displayName', children: [] }],
      },
      { property: 'email', children: [] },
    ];

    await filter.catch(
      localizedValidationException(errors),
      httpHost(response as Partial<Response>),
    );

    expect(response.json).toHaveBeenCalledWith({
      code: 'VALIDATION_FAILED',
      messageKey: 'error.validation.failed',
      params: { fields: ['email', 'profile.displayName'] },
    });
  });

  it('does not expose unexpected internal errors', async () => {
    const response = responseMock();
    const filter = new LocalizedExceptionFilter(localeResolver);

    await filter.catch(
      new Error('database password leaked'),
      httpHost(response as Partial<Response>),
    );

    expect(response.status).toHaveBeenCalledWith(500);
    expect(response.json).toHaveBeenCalledWith({
      code: 'INTERNAL_SERVER_ERROR',
      messageKey: 'error.request.failed',
      params: {},
    });
    expect(JSON.stringify(response.json.mock.calls)).not.toContain(
      'database password leaked',
    );
  });
});
