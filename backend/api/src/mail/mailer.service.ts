import { Injectable, Logger } from '@nestjs/common';
import { ConfigService } from '@nestjs/config';

export interface OutgoingMail {
  to: string;
  subject: string;
  body: string;
}

/// Transportul de email.
///
/// `console` scrie mesajul în loguri și e destinat exclusiv dezvoltării.
/// `resend` trimite prin API-ul HTTP de la resend.com. Cheia și adresa
/// expeditorului vin din variabile de mediu, niciodată din cod (`agents.md` §3).
export type MailTransport = 'console' | 'resend';

const RESEND_ENDPOINT = 'https://api.resend.com/emails';
const SEND_TIMEOUT_MS = 10_000;

@Injectable()
export class MailerService {
  private readonly logger = new Logger(MailerService.name);
  private readonly transport: MailTransport;
  private readonly apiKey: string;
  private readonly from: string;

  constructor(private readonly config: ConfigService) {
    this.transport = this.config.get<MailTransport>(
      'MAIL_TRANSPORT',
      'console',
    );
    this.apiKey = this.config.get<string>('RESEND_API_KEY', '');
    this.from = this.config.get<string>(
      'MAIL_FROM',
      'QuizRealm <no-reply@mail.dohotstudio.com>',
    );

    if (this.transport === 'resend' && !this.apiKey) {
      // Pornim oricum: un API care refuză să bootstrap-eze pentru că lipsește
      // o cheie de email ar opri și login-ul, care n-are nevoie de ea.
      this.logger.error(
        'MAIL_TRANSPORT=resend, dar RESEND_API_KEY lipsește. ' +
          'Emailurile nu vor pleca.',
      );
    }
  }

  /// Adevărat doar când mesajele chiar pleacă spre destinatar. Fluxurile care
  /// depind de email (verificare, resetare parolă) trebuie să întrebe asta
  /// înainte de a promite utilizatorului că „ți-am trimis un link”.
  get canDeliver(): boolean {
    return this.transport === 'resend' && this.apiKey.length > 0;
  }

  async send(mail: OutgoingMail): Promise<void> {
    if (!this.canDeliver) {
      // Linkul apare în loguri ca fluxul să fie testabil local. În producție
      // asta ar fi o scurgere: un token de resetare într-un log e o parolă.
      this.logger.warn(
        `[MAIL:console] către ${mail.to} — ${mail.subject}\n${mail.body}`,
      );
      return;
    }
    await this.sendViaResend(mail);
  }

  /// Trimite fără a propaga eșecul, doar cu urmă în loguri.
  ///
  /// Se folosește acolo unde o eroare de livrare n-are voie să schimbe
  /// răspunsul: la înregistrare (contul e deja creat, linkul se poate cere din
  /// nou) și la resetarea parolei, unde un 5xx doar pentru adresele reale ar
  /// transforma endpointul într-un instrument de enumerare a conturilor.
  async sendQuietly(mail: OutgoingMail): Promise<void> {
    try {
      await this.send(mail);
    } catch (error) {
      this.logger.error(
        `Trimiterea către ${mail.to} a eșuat: ${(error as Error).message}`,
      );
    }
  }

  private async sendViaResend(mail: OutgoingMail): Promise<void> {
    let response: Response;
    try {
      response = await fetch(RESEND_ENDPOINT, {
        method: 'POST',
        headers: {
          Authorization: `Bearer ${this.apiKey}`,
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({
          from: this.from,
          to: [mail.to],
          subject: mail.subject,
          text: mail.body,
        }),
        signal: AbortSignal.timeout(SEND_TIMEOUT_MS),
      });
    } catch (error) {
      throw new Error(
        `Resend nu a putut fi contactat: ${(error as Error).message}`,
      );
    }

    if (!response.ok) {
      // Corpul de eroare de la Resend conține motivul (domeniu neverificat,
      // adresă invalidă), dar niciodată cheia — e sigur de logat.
      const detail = await response.text().catch(() => '');
      throw new Error(`Resend a răspuns ${response.status}: ${detail}`);
    }
  }
}
