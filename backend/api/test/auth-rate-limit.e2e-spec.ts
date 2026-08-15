import { INestApplication, ValidationPipe } from '@nestjs/common';
import { Test } from '@nestjs/testing';
import request from 'supertest';
import { App } from 'supertest/types';
import { AppModule } from '../src/app.module';

/// `agents.md` §3 cere rate limiting obligatoriu pe login. Suita principală de
/// autentificare îl neutralizează ca să poată crea conturi, deci proba lui stă
/// separat — altfel regula ar putea dispărea fără ca nimic să se plângă.
describe('Rate limiting pe autentificare (e2e)', () => {
  let app: INestApplication<App>;
  let server: App;

  beforeAll(async () => {
    const moduleRef = await Test.createTestingModule({
      imports: [AppModule],
    }).compile();
    app = moduleRef.createNestApplication();
    app.useGlobalPipes(
      new ValidationPipe({
        forbidNonWhitelisted: true,
        transform: true,
        whitelist: true,
      }),
    );
    await app.init();
    server = app.getHttpServer();
  });

  afterAll(async () => {
    await app.close();
  });

  it('blochează încercările repetate de login', async () => {
    const credentials = {
      email: 'inexistent-pentru-rate-limit@quizrealm.test',
      password: 'ParolaMeaLunga2026',
    };

    const statuses: number[] = [];
    for (let attempt = 0; attempt < 8; attempt += 1) {
      const response = await request(server)
        .post('/auth/login')
        .send(credentials);
      statuses.push(response.status);
    }

    // Primele încercări eșuează cu 401 (credențiale greșite), apoi intervine
    // limitarea. Contează că apare 429, nu la a câta exact.
    expect(statuses).toContain(401);
    expect(statuses).toContain(429);
    expect(statuses.at(-1)).toBe(429);
  });
});
