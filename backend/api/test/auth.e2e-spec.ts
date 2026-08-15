import { INestApplication, ValidationPipe } from '@nestjs/common';
import { Test } from '@nestjs/testing';
import { ThrottlerStorage } from '@nestjs/throttler';
import { AuthTokenPurpose } from '@prisma/client';
import request from 'supertest';
import { App } from 'supertest/types';
import { AppModule } from '../src/app.module';
import { AuthTokenService } from '../src/auth/auth-token.service';
import { PrismaService } from '../src/prisma/prisma.service';

/// Fluxul de identitate din `docs/features-social-progression.md` §1, verificat
/// pe baza reală: sesiuni pe dispozitiv, age gate, cooldown de username,
/// verificare email și resetare de parolă.
describe('Autentificare și identitate (e2e)', () => {
  let app: INestApplication<App>;
  let prisma: PrismaService;
  let server: App;

  const password = 'ParolaMeaLunga2026';
  const createdEmails: string[] = [];

  interface ProfileBody {
    username: string;
    displayName: string;
    usernameChangeAvailableAt: string | null;
    capabilities: Record<string, boolean>;
  }

  interface SessionBody {
    id: string;
    current: boolean;
  }

  function uniqueAccount(prefix: string) {
    const stamp = `${Date.now()}${Math.floor(Math.random() * 1000)}`;
    const email = `${prefix}-${stamp}@quizrealm.test`;
    createdEmails.push(email);
    return {
      email,
      username: `${prefix.replace(/-/g, '')}${stamp}`.slice(0, 32),
      password,
      birthDate: '1990-05-04',
    };
  }

  async function register(account: ReturnType<typeof uniqueAccount>) {
    const response = await request(server)
      .post('/auth/register')
      .send(account)
      .expect(201);
    return response.body as { accessToken: string; refreshToken: string };
  }

  beforeAll(async () => {
    // Rate limiting-ul e pornit în producție și numără pe IP; într-o suită
    // e2e toate cererile vin de la aceeași adresă, deci ar bloca testele după
    // câteva conturi. Îl neutralizăm aici și îl verificăm separat, în
    // `auth-rate-limit.e2e-spec.ts`.
    const moduleRef = await Test.createTestingModule({
      imports: [AppModule],
    })
      // Înlocuim contorul, nu garda: `@Throttle` rămâne pe rute exact ca în
      // producție, dar nu acumulează nimic, deci suita poate crea conturi.
      .overrideProvider(ThrottlerStorage)
      .useValue({
        increment: () =>
          Promise.resolve({
            totalHits: 0,
            timeToExpire: 0,
            isBlocked: false,
            timeToBlockExpire: 0,
          }),
      })
      .compile();

    app = moduleRef.createNestApplication();
    app.useGlobalPipes(
      new ValidationPipe({
        forbidNonWhitelisted: true,
        transform: true,
        whitelist: true,
      }),
    );
    await app.init();
    prisma = app.get(PrismaService);
    server = app.getHttpServer();
  });

  afterAll(async () => {
    if (createdEmails.length > 0) {
      await prisma.user.deleteMany({ where: { email: { in: createdEmails } } });
    }
    await app.close();
  });

  describe('age gate (§1.3)', () => {
    it('respinge conturile sub vârsta minimă', async () => {
      const account = uniqueAccount('minor');
      const thisYear = new Date().getUTCFullYear();
      await request(server)
        .post('/auth/register')
        .send({ ...account, birthDate: `${thisYear - 10}-01-01` })
        .expect(400);
    });

    it('respinge o dată de naștere din viitor', async () => {
      const account = uniqueAccount('viitor');
      const nextYear = new Date().getUTCFullYear() + 1;
      await request(server)
        .post('/auth/register')
        .send({ ...account, birthDate: `${nextYear}-01-01` })
        .expect(400);
    });

    it('acceptă un cont de adult și îl marchează neverificat', async () => {
      const account = uniqueAccount('adult');
      const tokens = await register(account);

      const profile = await request(server)
        .get('/users/me')
        .set('Authorization', `Bearer ${tokens.accessToken}`)
        .expect(200);

      expect((profile.body as ProfileBody).capabilities).toMatchObject({
        emailVerified: false,
        isMinor: false,
        // Emailul neconfirmat blochează ranked-ul, chiar dacă e adult.
        canPlayRanked: false,
        canUseGlobalChat: false,
      });
      // Data nașterii nu iese din server.
      expect(profile.body).not.toHaveProperty('birthDate');
    });
  });

  describe('sesiuni pe dispozitiv (§1.5)', () => {
    it('două conectări trăiesc în paralel, nu se anulează', async () => {
      const account = uniqueAccount('sesiuni');
      const first = await register(account);

      const second = await request(server)
        .post('/auth/login')
        .set('User-Agent', 'QuizRealm/Android')
        .send({ email: account.email, password })
        .expect(201);
      const secondTokens = second.body as { refreshToken: string };

      // Regresie: cu un singur `refresh_token_hash` pe user, al doilea login
      // îl invalida pe primul.
      await request(server)
        .post('/auth/refresh')
        .send({ refreshToken: first.refreshToken })
        .expect(201);
      await request(server)
        .post('/auth/refresh')
        .send({ refreshToken: secondTokens.refreshToken })
        .expect(201);
    });

    it('listează sesiunile și o marchează pe cea curentă', async () => {
      const account = uniqueAccount('lista');
      const first = await register(account);
      await request(server)
        .post('/auth/login')
        .set('User-Agent', 'QuizRealm/Test')
        .send({ email: account.email, password })
        .expect(201);

      const sessions = await request(server)
        .get('/auth/sessions')
        .set('Authorization', `Bearer ${first.accessToken}`)
        .expect(200);

      expect(sessions.body).toHaveLength(2);
      expect(
        (sessions.body as SessionBody[]).filter((s) => s.current),
      ).toHaveLength(1);
    });

    it('revocarea unei sesiuni o oprește doar pe aceea', async () => {
      const account = uniqueAccount('revoc');
      const keep = await register(account);
      const drop = await request(server)
        .post('/auth/login')
        .send({ email: account.email, password })
        .expect(201);
      const dropTokens = drop.body as {
        accessToken: string;
        refreshToken: string;
      };

      const sessions = await request(server)
        .get('/auth/sessions')
        .set('Authorization', `Bearer ${dropTokens.accessToken}`)
        .expect(200);
      const target = (sessions.body as SessionBody[]).find(
        (session) => session.current,
      )!;

      await request(server)
        .delete(`/auth/sessions/${target.id}`)
        .set('Authorization', `Bearer ${keep.accessToken}`)
        .expect(204);

      await request(server)
        .post('/auth/refresh')
        .send({ refreshToken: dropTokens.refreshToken })
        .expect(401);
      await request(server)
        .post('/auth/refresh')
        .send({ refreshToken: keep.refreshToken })
        .expect(201);
    });

    it('un token deja rotit, rejucat, e tratat ca furt și închide contul', async () => {
      const account = uniqueAccount('replay');
      const victim = await register(account);
      const other = await request(server)
        .post('/auth/login')
        .send({ email: account.email, password })
        .expect(201);
      const otherTokens = other.body as { refreshToken: string };

      // Rotire normală: tokenul vechi e înlocuit de unul nou.
      await request(server)
        .post('/auth/refresh')
        .send({ refreshToken: victim.refreshToken })
        .expect(201);

      // Cineva rejoacă tokenul vechi pe o sesiune încă activă. Înseamnă că
      // două părți dețin tokenuri ale aceleiași sesiuni.
      await request(server)
        .post('/auth/refresh')
        .send({ refreshToken: victim.refreshToken })
        .expect(401);

      // Nu știm care parte e legitimă, deci cade tot contul.
      await request(server)
        .post('/auth/refresh')
        .send({ refreshToken: otherTokens.refreshToken })
        .expect(401);
    });
  });

  describe('identitate: username vs display name (§1.2)', () => {
    it('numele afișat se schimbă liber', async () => {
      const account = uniqueAccount('afisat');
      const tokens = await register(account);

      const updated = await request(server)
        .patch('/users/me')
        .set('Authorization', `Bearer ${tokens.accessToken}`)
        .send({ displayName: 'Cavalerul Nopții' })
        .expect(200);
      expect((updated.body as ProfileBody).displayName).toBe(
        'Cavalerul Nopții',
      );
      // Handle-ul rămâne neatins.
      expect((updated.body as ProfileBody).username).toBe(account.username);
    });

    it('data nașterii deja stabilită nu se mai poate schimba', async () => {
      // Endpointul există pentru conturile create înainte de age gate, care
      // altfel ar rămâne tratate ca minori pentru totdeauna. Un cont creat
      // acum are deja data, deci trebuie refuzat.
      const account = uniqueAccount('nastere');
      const tokens = await register(account);

      await request(server)
        .patch('/users/me/birth-date')
        .set('Authorization', `Bearer ${tokens.accessToken}`)
        .send({ birthDate: '1988-02-29' })
        .expect(400);
    });

    it('handle-ul se schimbă o dată, apoi intră în cooldown', async () => {
      const account = uniqueAccount('handle');
      const tokens = await register(account);
      const newUsername = `${account.username}x`.slice(0, 32);

      const changed = await request(server)
        .patch('/users/me/username')
        .set('Authorization', `Bearer ${tokens.accessToken}`)
        .send({ username: newUsername })
        .expect(200);
      expect((changed.body as ProfileBody).username).toBe(newUsername);
      expect(
        (changed.body as ProfileBody).usernameChangeAvailableAt,
      ).not.toBeNull();

      await request(server)
        .patch('/users/me/username')
        .set('Authorization', `Bearer ${tokens.accessToken}`)
        .send({ username: `${newUsername}y`.slice(0, 32) })
        .expect(400);
    });

    it('nu poți lua un handle deja folosit', async () => {
      const owner = uniqueAccount('proprietar');
      await register(owner);
      const other = uniqueAccount('altul');
      const tokens = await register(other);

      await request(server)
        .patch('/users/me/username')
        .set('Authorization', `Bearer ${tokens.accessToken}`)
        .send({ username: owner.username })
        .expect(409);
    });
  });

  describe('verificare email (§1.3)', () => {
    it('confirmarea deblochează ranked-ul', async () => {
      const account = uniqueAccount('verif');
      const tokens = await register(account);

      // Tokenul e emis la înregistrare; îl citim ca și cum am deschide emailul.
      const token = await issuedToken(
        account.email,
        AuthTokenPurpose.EMAIL_VERIFICATION,
      );
      await request(server)
        .post('/auth/verify-email/confirm')
        .send({ token })
        .expect(204);

      const profile = await request(server)
        .get('/users/me')
        .set('Authorization', `Bearer ${tokens.accessToken}`)
        .expect(200);
      expect((profile.body as ProfileBody).capabilities).toMatchObject({
        emailVerified: true,
        canPlayRanked: true,
        canUseGlobalChat: true,
      });
    });

    it('același link nu se poate folosi de două ori', async () => {
      const account = uniqueAccount('odata');
      await register(account);
      const token = await issuedToken(
        account.email,
        AuthTokenPurpose.EMAIL_VERIFICATION,
      );

      await request(server)
        .post('/auth/verify-email/confirm')
        .send({ token })
        .expect(204);
      await request(server)
        .post('/auth/verify-email/confirm')
        .send({ token })
        .expect(400);
    });
  });

  describe('resetare parolă (§1.4)', () => {
    it('răspunde identic pentru o adresă inexistentă', async () => {
      // Altfel endpointul ar spune oricui ce conturi există.
      await request(server)
        .post('/auth/password-reset/request')
        .send({ email: 'nimeni-nu-are-adresa-asta@quizrealm.test' })
        .expect(202);
    });

    it('schimbă parola și închide toate sesiunile', async () => {
      const account = uniqueAccount('reset');
      const tokens = await register(account);

      await request(server)
        .post('/auth/password-reset/request')
        .send({ email: account.email })
        .expect(202);
      const token = await issuedToken(
        account.email,
        AuthTokenPurpose.PASSWORD_RESET,
      );

      const newPassword = 'AltaParolaLunga2026';
      await request(server)
        .post('/auth/password-reset/confirm')
        .send({ token, password: newPassword })
        .expect(204);

      // Sesiunea dinainte de resetare nu mai e bună: dacă resetarea a fost
      // cerută din cauza unui cont compromis, atacatorul trebuie dat afară.
      await request(server)
        .post('/auth/refresh')
        .send({ refreshToken: tokens.refreshToken })
        .expect(401);

      await request(server)
        .post('/auth/login')
        .send({ email: account.email, password: newPassword })
        .expect(201);
    });
  });

  /// Linkurile din emailuri se deschid într-un browser, nu în aplicație: dacă
  /// un `GET` pe ele întoarce 404, fluxul e rupt pentru utilizator chiar dacă
  /// endpointurile JSON funcționează.
  describe('paginile deschise din email', () => {
    it('linkul de verificare confirmă contul și arată o pagină', async () => {
      const account = uniqueAccount('pagina');
      const tokens = await register(account);
      const token = await issuedToken(
        account.email,
        AuthTokenPurpose.EMAIL_VERIFICATION,
      );

      const page = await request(server)
        .get(`/auth/verify-email?token=${encodeURIComponent(token)}`)
        .expect(200)
        .expect('Content-Type', /text\/html/);
      expect(page.text).toContain('Adresă confirmată');

      const profile = await request(server)
        .get('/users/me')
        .set('Authorization', `Bearer ${tokens.accessToken}`)
        .expect(200);
      expect((profile.body as ProfileBody).capabilities).toMatchObject({
        emailVerified: true,
      });
    });

    it('un token invalid dă o pagină de eroare, nu o eroare de server', async () => {
      const page = await request(server)
        .get('/auth/verify-email?token=nu-exista-tokenul-asta')
        .expect(200);
      expect(page.text).toContain('Link invalid sau expirat');
    });

    it('formularul de resetare schimbă parola', async () => {
      const account = uniqueAccount('formular');
      await register(account);
      const token = await issuedToken(
        account.email,
        AuthTokenPurpose.PASSWORD_RESET,
      );

      const form = await request(server)
        .get(`/auth/reset-password?token=${encodeURIComponent(token)}`)
        .expect(200);
      expect(form.text).toContain('Alege o parolă nouă');

      const newPassword = 'ParolaDinFormular2026';
      const done = await request(server)
        .post('/auth/reset-password')
        .type('form')
        .send({ token, password: newPassword })
        .expect(201);
      expect(done.text).toContain('Parolă schimbată');

      await request(server)
        .post('/auth/login')
        .send({ email: account.email, password: newPassword })
        .expect(201);
    });

    it('tokenul ajunge escapat în HTML, nu ca marcaj', async () => {
      const page = await request(server)
        .get(
          '/auth/reset-password?token=%22%3E%3Cscript%3Ealert(1)%3C/script%3E',
        )
        .expect(200);
      expect(page.text).not.toContain('<script>alert(1)</script>');
      expect(page.text).toContain('&lt;script&gt;');
    });
  });

  /// Poarta pe care `backend/realtime` decide dacă un cont poate intra în
  /// coada ranked (§1.3).
  describe('capabilități pentru realtime', () => {
    it('cere cheia internă', async () => {
      const account = uniqueAccount('intern');
      await register(account);
      const user = await prisma.user.findUniqueOrThrow({
        where: { email: account.email },
        select: { id: true },
      });

      await request(server)
        .get(`/users/internal/${user.id}/capabilities`)
        .expect(403);

      const response = await request(server)
        .get(`/users/internal/${user.id}/capabilities`)
        .set('x-internal-api-key', process.env.INTERNAL_API_KEY ?? '')
        .expect(200);
      expect(response.body).toMatchObject({
        emailVerified: false,
        canPlayRanked: false,
      });
    });
  });

  /// Ține locul emailului primit de utilizator.
  ///
  /// Baza păstrează doar hash-ul token-ului, deci nu se poate „citi” din
  /// tabelă — exact cum trebuie. Testul emite unul proaspăt prin același
  /// serviciu pe care îl folosește aplicația, ceea ce invalidează automat
  /// tokenul anterior (comportamentul pe care îl vrem oricum).
  async function issuedToken(
    email: string,
    purpose: AuthTokenPurpose,
  ): Promise<string> {
    const user = await prisma.user.findUniqueOrThrow({
      where: { email },
      select: { id: true },
    });
    const issued = await app.get(AuthTokenService).issue(user.id, purpose);
    return issued.token;
  }
});
