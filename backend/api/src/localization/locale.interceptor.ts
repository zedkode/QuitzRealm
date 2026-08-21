import {
  Injectable,
  type CallHandler,
  type ExecutionContext,
  type NestInterceptor,
} from '@nestjs/common';
import type { Request, Response } from 'express';
import type { Observable } from 'rxjs';
import { LocaleResolverService } from './locale-resolver.service';
import type { LocaleRequestContext } from './localization.types';

type LocalizedRequest = Request & LocaleRequestContext;

@Injectable()
export class LocaleInterceptor implements NestInterceptor {
  constructor(private readonly localeResolver: LocaleResolverService) {}

  async intercept(
    context: ExecutionContext,
    next: CallHandler,
  ): Promise<Observable<unknown>> {
    const request = context.switchToHttp().getRequest<LocalizedRequest>();
    const response = context.switchToHttp().getResponse<Response>();
    request.locale = await this.localeResolver.resolve(request);
    response.vary('Accept-Language');
    response.setHeader('Content-Language', request.locale);
    return next.handle();
  }
}
