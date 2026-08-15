import { ConfigService } from '@nestjs/config';
import { MailerService } from './mailer.service';

function mailerWith(env: Record<string, string>): MailerService {
  const config = {
    get: <T>(key: string, fallback: T): T => (env[key] as T) ?? fallback,
  } as unknown as ConfigService;
  return new MailerService(config);
}

const mail = { to: 'jucator@example.com', subject: 'Salut', body: 'Link' };

describe('MailerService', () => {
  afterEach(() => {
    jest.restoreAllMocks();
  });

  it('nu pretinde că livrează pe transportul de consolă', () => {
    expect(mailerWith({}).canDeliver).toBe(false);
  });

  it('nu pretinde că livrează dacă lipsește cheia Resend', () => {
    // Configurare greșită în producție: mai bine ca fluxurile să știe că
    // mesajul n-a plecat, decât să promită un email care nu vine.
    expect(mailerWith({ MAIL_TRANSPORT: 'resend' }).canDeliver).toBe(false);
  });

  it('trimite la Resend cu expeditorul configurat', async () => {
    const fetchMock = jest
      .spyOn(global, 'fetch')
      .mockResolvedValue(new Response('{}', { status: 200 }));
    const mailer = mailerWith({
      MAIL_TRANSPORT: 'resend',
      RESEND_API_KEY: 'cheie-de-test',
      MAIL_FROM: 'QuizRealm <no-reply@mail.example.com>',
    });

    expect(mailer.canDeliver).toBe(true);
    await mailer.send(mail);

    expect(fetchMock).toHaveBeenCalledTimes(1);
    const [url, init] = fetchMock.mock.calls[0];
    expect(url).toBe('https://api.resend.com/emails');
    const headers = (init as RequestInit).headers as Record<string, string>;
    expect(headers.Authorization).toBe('Bearer cheie-de-test');
    expect(JSON.parse((init as RequestInit).body as string)).toEqual({
      from: 'QuizRealm <no-reply@mail.example.com>',
      to: ['jucator@example.com'],
      subject: 'Salut',
      text: 'Link',
    });
  });

  it('propagă eroarea când Resend refuză mesajul', async () => {
    jest
      .spyOn(global, 'fetch')
      .mockResolvedValue(new Response('domeniu neverificat', { status: 403 }));
    const mailer = mailerWith({
      MAIL_TRANSPORT: 'resend',
      RESEND_API_KEY: 'cheie-de-test',
    });

    await expect(mailer.send(mail)).rejects.toThrow('403');
  });

  it('`sendQuietly` înghite eroarea, ca să nu devină un oracol de enumerare', async () => {
    jest
      .spyOn(global, 'fetch')
      .mockResolvedValue(new Response('nu', { status: 500 }));
    const mailer = mailerWith({
      MAIL_TRANSPORT: 'resend',
      RESEND_API_KEY: 'cheie-de-test',
    });

    await expect(mailer.sendQuietly(mail)).resolves.toBeUndefined();
  });

  it('nu scrie niciodată cheia în loguri', async () => {
    const logged: string[] = [];
    jest
      .spyOn(global, 'fetch')
      .mockResolvedValue(new Response('eroare', { status: 422 }));
    const mailer = mailerWith({
      MAIL_TRANSPORT: 'resend',
      RESEND_API_KEY: 'cheie-secreta',
    });
    jest
      .spyOn(mailer['logger'], 'error')
      .mockImplementation((message: unknown) => {
        logged.push(String(message));
      });

    await mailer.sendQuietly(mail);

    expect(logged).not.toHaveLength(0);
    expect(logged.join('\n')).not.toContain('cheie-secreta');
  });
});
