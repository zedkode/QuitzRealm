import {
  BadRequestException,
  Injectable,
  ServiceUnavailableException,
} from '@nestjs/common';
import { ConfigService } from '@nestjs/config';

interface TurnstileResponse {
  success?: boolean;
  hostname?: string;
  'error-codes'?: string[];
}

/**
 * Adaptor pentru challenge anti-bot. Providerul e configurat exclusiv prin
 * variabile de mediu; secretul nu ajunge în client. În producție, activarea
 * `CAPTCHA_REQUIRED=true` fără secret blochează intenționat înscrierile, în loc
 * să creeze conturi neprotejate din greșeală.
 */
@Injectable()
export class CaptchaService {
  constructor(private readonly config: ConfigService) {}

  async assertValid(token: string | undefined, remoteIp?: string): Promise<void> {
    const required = this.config.get<string>('CAPTCHA_REQUIRED', 'false') === 'true';
    const provider = this.config.get<string>('CAPTCHA_PROVIDER', 'turnstile');
    const secret = this.config.get<string>('CAPTCHA_SECRET_KEY');

    if (!secret) {
      if (required) {
        throw new ServiceUnavailableException(
          'Verificarea anti-bot nu este configurată momentan.',
        );
      }
      return;
    }
    if (provider !== 'turnstile') {
      throw new ServiceUnavailableException('Providerul anti-bot configurat nu este suportat.');
    }
    if (!token?.trim()) {
      throw new BadRequestException('Finalizează verificarea anti-bot înainte de înscriere.');
    }

    let response: TurnstileResponse;
    try {
      const body = new URLSearchParams({
        secret,
        response: token.trim(),
        ...(remoteIp ? { remoteip: remoteIp } : {}),
      });
      const raw = await fetch(
        'https://challenges.cloudflare.com/turnstile/v0/siteverify',
        {
          method: 'POST',
          headers: { 'content-type': 'application/x-www-form-urlencoded' },
          body,
          signal: AbortSignal.timeout(5_000),
        },
      );
      response = (await raw.json()) as TurnstileResponse;
    } catch {
      throw new ServiceUnavailableException(
        'Verificarea anti-bot nu este disponibilă. Încearcă din nou.',
      );
    }

    if (!response.success) {
      throw new BadRequestException('Verificarea anti-bot nu a fost acceptată.');
    }
  }
}
