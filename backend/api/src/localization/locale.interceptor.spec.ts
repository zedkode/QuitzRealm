import type { CallHandler, ExecutionContext } from '@nestjs/common';
import { firstValueFrom, of } from 'rxjs';
import type { LocaleResolverService } from './locale-resolver.service';
import { LocaleInterceptor } from './locale.interceptor';

describe('LocaleInterceptor', () => {
  it('stores the resolved locale on the request and response', async () => {
    const request: { locale?: string } = {};
    const response = { setHeader: jest.fn(), vary: jest.fn() };
    const resolver = {
      resolve: jest.fn().mockResolvedValue('ro'),
    } as unknown as LocaleResolverService;
    const context = {
      switchToHttp: () => ({
        getRequest: () => request,
        getResponse: () => response,
      }),
    } as unknown as ExecutionContext;
    const next = { handle: () => of({ ok: true }) } as CallHandler;

    const stream = await new LocaleInterceptor(resolver).intercept(
      context,
      next,
    );

    await expect(firstValueFrom(stream)).resolves.toEqual({ ok: true });
    expect(request.locale).toBe('ro');
    expect(response.vary).toHaveBeenCalledWith('Accept-Language');
    expect(response.setHeader).toHaveBeenCalledWith('Content-Language', 'ro');
  });
});
