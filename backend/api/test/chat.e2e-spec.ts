import { INestApplication, ValidationPipe } from '@nestjs/common';
import { Test } from '@nestjs/testing';
import { ThrottlerStorage } from '@nestjs/throttler';
import request from 'supertest';
import { App } from 'supertest/types';
import { AppModule } from '../src/app.module';
import { PrismaService } from '../src/prisma/prisma.service';

/// Chatul și prieteniile din `docs/features-social-progression.md` §2,
/// verificate pe baza reală: trepte de încredere, cereri de prietenie,
/// blocare, cereri de mesaj și raportare.
describe('Chat și prietenii (e2e)', () => {
  let app: INestApplication<App>;
  let prisma: PrismaService;
  let server: App;

  const password = 'ParolaMeaLunga2026';
  const createdEmails: string[] = [];

  interface Account {
    id: string;
    username: string;
    email: string;
    accessToken: string;
  }

  interface TrustBody {
    tier: number;
    tierKey: string;
    correctAnswers: number;
    answersToNextTier: number | null;
    globalChat: string;
    canInitiateDm: boolean;
  }

  interface FriendBody {
    friendshipId: string;
    userId: string;
    username: string;
    status: string;
    direction: string;
  }

  interface ConversationBody {
    id: string;
    type: string;
    otherUserId: string;
  }

  interface MessageBody {
    id: string;
    senderId: string;
    content: string;
  }

  async function makeAccount(prefix: string): Promise<Account> {
    const stamp = `${Date.now()}${Math.floor(Math.random() * 1000)}`;
    const email = `${prefix}-${stamp}@quizrealm.test`;
    const username = `${prefix}${stamp}`.slice(0, 32);
    createdEmails.push(email);
    const response = await request(server)
      .post('/auth/register')
      .send({ email, username, password, birthDate: '1990-05-04' })
      .expect(201);
    const { accessToken } = response.body as { accessToken: string };
    const user = await prisma.user.findUniqueOrThrow({
      where: { email },
      select: { id: true },
    });
    // Emailul confirmat direct în bază: fluxul lui are testele lui, iar aici ne
    // interesează chatul, nu încă o dată verificarea.
    await prisma.user.update({
      where: { id: user.id },
      data: { emailVerifiedAt: new Date() },
    });
    return { id: user.id, username, email, accessToken };
  }

  function as(account: Account) {
    return { Authorization: `Bearer ${account.accessToken}` };
  }

  async function setCorrectAnswers(account: Account, value: number) {
    await prisma.user.update({
      where: { id: account.id },
      data: { correctAnswers: value },
    });
  }

  beforeAll(async () => {
    const moduleRef = await Test.createTestingModule({ imports: [AppModule] })
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

  describe('trepte de încredere (§2.5)', () => {
    it('un cont nou e la T0 și nu are chat global liber', async () => {
      const account = await makeAccount('nou');
      const response = await request(server)
        .get('/chat/trust')
        .set(as(account))
        .expect(200);
      const trust = response.body as TrustBody;

      expect(trust.tier).toBe(0);
      expect(trust.tierKey).toBe('newcomer');
      expect(trust.globalChat).toBe('reactions');
      expect(trust.canInitiateDm).toBe(false);
      // Progresul e calculat pe server: aplicația doar îl afișează.
      expect(trust.answersToNextTier).toBe(10);
    });

    it('răspunsurile corecte urcă treapta', async () => {
      const account = await makeAccount('urca');
      await setCorrectAnswers(account, 220);

      const response = await request(server)
        .get('/chat/trust')
        .set(as(account))
        .expect(200);
      const trust = response.body as TrustBody;
      expect(trust.tier).toBe(3);
      expect(trust.globalChat).toBe('public');
      expect(trust.canInitiateDm).toBe(true);
    });
  });

  describe('prietenii (§2.7)', () => {
    it('cerere, acceptare, apoi conversație de prieteni', async () => {
      const first = await makeAccount('pri');
      const second = await makeAccount('sec');

      const sent = await request(server)
        .post('/friends/requests')
        .set(as(first))
        .send({ username: second.username })
        .expect(201);
      expect((sent.body as FriendBody).direction).toBe('outgoing');

      const inbox = await request(server)
        .get('/friends')
        .set(as(second))
        .expect(200);
      const incoming = (inbox.body as FriendBody[])[0];
      expect(incoming.direction).toBe('incoming');
      expect(incoming.status).toBe('PENDING');

      await request(server)
        .post(`/friends/requests/${incoming.friendshipId}`)
        .set(as(second))
        .send({ accept: true })
        .expect(201);

      const conversation = await request(server)
        .post('/chat/conversations')
        .set(as(first))
        .send({ userId: second.id })
        .expect(201);
      // Prietenii primesc direct un fir normal, fără coadă de cereri.
      expect((conversation.body as ConversationBody).type).toBe('FRIEND');
    });

    it('cererea inversă se transformă în acceptare', async () => {
      // Amândoi și-au exprimat consimțământul; n-are rost un buton în plus.
      const first = await makeAccount('rec1');
      const second = await makeAccount('rec2');

      await request(server)
        .post('/friends/requests')
        .set(as(first))
        .send({ username: second.username })
        .expect(201);
      const back = await request(server)
        .post('/friends/requests')
        .set(as(second))
        .send({ username: first.username })
        .expect(201);

      expect((back.body as FriendBody).status).toBe('ACCEPTED');
    });

    it('nu îți poți accepta propria cerere', async () => {
      const first = await makeAccount('self1');
      const second = await makeAccount('self2');
      const sent = await request(server)
        .post('/friends/requests')
        .set(as(first))
        .send({ username: second.username })
        .expect(201);

      await request(server)
        .post(`/friends/requests/${(sent.body as FriendBody).friendshipId}`)
        .set(as(first))
        .send({ accept: true })
        .expect(400);
    });

    it('blocarea rupe prietenia și oprește mesajele', async () => {
      const victim = await makeAccount('blk1');
      const abuser = await makeAccount('blk2');
      const sent = await request(server)
        .post('/friends/requests')
        .set(as(abuser))
        .send({ username: victim.username })
        .expect(201);
      await request(server)
        .post(`/friends/requests/${(sent.body as FriendBody).friendshipId}`)
        .set(as(victim))
        .send({ accept: true })
        .expect(201);

      await request(server)
        .post(`/blocks/${abuser.id}`)
        .set(as(victim))
        .expect(204);

      const friends = await request(server)
        .get('/friends')
        .set(as(victim))
        .expect(200);
      expect(friends.body).toHaveLength(0);

      // Blocarea taie în ambele sensuri: cel blocat nu poate continua să scrie.
      await request(server)
        .post('/chat/conversations')
        .set(as(abuser))
        .send({ userId: victim.id })
        .expect(403);
    });
  });

  describe('mesaje directe (§2.4)', () => {
    it('un cont sub T2 nu poate iniția un DM', async () => {
      const sender = await makeAccount('dmlow');
      const target = await makeAccount('dmtgt');
      await request(server)
        .patch('/chat/privacy')
        .set(as(target))
        .send({ dmPermission: 'EVERYONE' })
        .expect(200);

      await request(server)
        .post('/chat/conversations')
        .set(as(sender))
        .send({ userId: target.id })
        .expect(403);
    });

    it('setarea implicită „doar prieteni” respinge necunoscuții', async () => {
      const sender = await makeAccount('dmfr1');
      const target = await makeAccount('dmfr2');
      await setCorrectAnswers(sender, 100);

      await request(server)
        .post('/chat/conversations')
        .set(as(sender))
        .send({ userId: target.id })
        .expect(403);
    });

    it('cererea de mesaj acceptă un singur mesaj până e acceptată', async () => {
      const sender = await makeAccount('dmq1');
      const target = await makeAccount('dmq2');
      await setCorrectAnswers(sender, 100);
      await request(server)
        .patch('/chat/privacy')
        .set(as(target))
        .send({ dmPermission: 'EVERYONE' })
        .expect(200);

      const conversation = await request(server)
        .post('/chat/conversations')
        .set(as(sender))
        .send({ userId: target.id })
        .expect(201);
      const id = (conversation.body as ConversationBody).id;
      expect((conversation.body as ConversationBody).type).toBe('DM_REQUEST');

      await request(server)
        .post(`/chat/conversations/${id}/messages`)
        .set(as(sender))
        .send({ content: 'salut, jucăm?' })
        .expect(201);

      // Al doilea mesaj ar transforma coada de cereri într-un canal de
      // hărțuire cu firul închis.
      await request(server)
        .post(`/chat/conversations/${id}/messages`)
        .set(as(sender))
        .send({ content: 'hei, răspunde' })
        .expect(403);

      await request(server)
        .post(`/chat/conversations/${id}/accept`)
        .set(as(target))
        .expect(201);
      await request(server)
        .post(`/chat/conversations/${id}/messages`)
        .set(as(sender))
        .send({ content: 'acum merge' })
        .expect(201);
    });

    it('destinatarul acceptă cererea, nu expeditorul', async () => {
      const sender = await makeAccount('dma1');
      const target = await makeAccount('dma2');
      await setCorrectAnswers(sender, 100);
      await request(server)
        .patch('/chat/privacy')
        .set(as(target))
        .send({ dmPermission: 'EVERYONE' })
        .expect(200);

      const conversation = await request(server)
        .post('/chat/conversations')
        .set(as(sender))
        .send({ userId: target.id })
        .expect(201);
      const id = (conversation.body as ConversationBody).id;
      await request(server)
        .post(`/chat/conversations/${id}/messages`)
        .set(as(sender))
        .send({ content: 'primul mesaj' })
        .expect(201);

      await request(server)
        .post(`/chat/conversations/${id}/accept`)
        .set(as(sender))
        .expect(403);
    });
  });

  describe('mesaje și filtre (§2.6)', () => {
    async function friendPair(prefix: string) {
      const first = await makeAccount(`${prefix}a`);
      const second = await makeAccount(`${prefix}b`);
      const sent = await request(server)
        .post('/friends/requests')
        .set(as(first))
        .send({ username: second.username })
        .expect(201);
      await request(server)
        .post(`/friends/requests/${(sent.body as FriendBody).friendshipId}`)
        .set(as(second))
        .send({ accept: true })
        .expect(201);
      const conversation = await request(server)
        .post('/chat/conversations')
        .set(as(first))
        .send({ userId: second.id })
        .expect(201);
      return {
        first,
        second,
        conversationId: (conversation.body as ConversationBody).id,
      };
    }

    it('mesajul ajunge în istoric, în ordine cronologică', async () => {
      const { first, second, conversationId } = await friendPair('msg');
      await request(server)
        .post(`/chat/conversations/${conversationId}/messages`)
        .set(as(first))
        .send({ content: 'primul' })
        .expect(201);
      await request(server)
        .post(`/chat/conversations/${conversationId}/messages`)
        .set(as(second))
        .send({ content: 'al doilea' })
        .expect(201);

      const history = await request(server)
        .get(`/chat/conversations/${conversationId}/messages`)
        .set(as(second))
        .expect(200);
      const messages = history.body as MessageBody[];
      expect(messages.map((message) => message.content)).toEqual([
        'primul',
        'al doilea',
      ]);
    });

    it('profanitatea e mascată, nu ștearsă', async () => {
      const { first, conversationId } = await friendPair('prof');
      const sent = await request(server)
        .post(`/chat/conversations/${conversationId}/messages`)
        .set(as(first))
        .send({ content: 'esti un idiot dar buna partida' })
        .expect(201);

      const content = (sent.body as MessageBody).content;
      expect(content).not.toContain('idiot');
      expect(content).toContain('buna partida');
    });

    it('un străin nu poate citi conversația altora', async () => {
      const { conversationId } = await friendPair('priv');
      const stranger = await makeAccount('strain');

      await request(server)
        .get(`/chat/conversations/${conversationId}/messages`)
        .set(as(stranger))
        .expect(404);
    });

    it('linkurile cer o treaptă de încredere', async () => {
      const { first, conversationId } = await friendPair('link');
      await setCorrectAnswers(first, 0);

      await request(server)
        .post(`/chat/conversations/${conversationId}/messages`)
        .set(as(first))
        .send({ content: 'intra pe https://exemplu.ro' })
        .expect(403);

      await setCorrectAnswers(first, 100);
      await request(server)
        .post(`/chat/conversations/${conversationId}/messages`)
        .set(as(first))
        .send({ content: 'intra pe https://exemplu.ro' })
        .expect(201);
    });

    it('mesajele repetate opresc chatul automat', async () => {
      const { first, conversationId } = await friendPair('spam');
      for (let i = 0; i < 2; i += 1) {
        await request(server)
          .post(`/chat/conversations/${conversationId}/messages`)
          .set(as(first))
          .send({ content: 'cumpara monede ieftine' })
          .expect(201);
      }
      await request(server)
        .post(`/chat/conversations/${conversationId}/messages`)
        .set(as(first))
        .send({ content: 'cumpara monede ieftine' })
        .expect(403);

      // Mutul e real, nu doar un refuz pe mesajul acela.
      const trust = await request(server)
        .get('/chat/trust')
        .set(as(first))
        .expect(200);
      expect(
        (trust.body as { mutedUntil: string | null }).mutedUntil,
      ).not.toBeNull();
    });

    it('raportul păstrează o copie a mesajului', async () => {
      const { first, second, conversationId } = await friendPair('rep');
      const sent = await request(server)
        .post(`/chat/conversations/${conversationId}/messages`)
        .set(as(first))
        .send({ content: 'mesaj de raportat' })
        .expect(201);

      const report = await request(server)
        .post('/chat/reports')
        .set(as(second))
        .send({
          reportedUserId: first.id,
          reason: 'limbaj nepotrivit',
          scope: 'friend',
          messageId: (sent.body as MessageBody).id,
        })
        .expect(201);

      const stored = await prisma.chatReport.findUniqueOrThrow({
        where: { id: (report.body as { id: string }).id },
      });
      expect(stored.contentSnapshot).toBe('mesaj de raportat');
      // Rapoartele din context privat urcă în coadă.
      expect(stored.priority).toBeGreaterThan(0);
    });

    it('nu poți raporta un mesaj pe care nu l-ai putut vedea', async () => {
      const { first, conversationId } = await friendPair('rep2');
      const sent = await request(server)
        .post(`/chat/conversations/${conversationId}/messages`)
        .set(as(first))
        .send({ content: 'mesaj privat' })
        .expect(201);
      const stranger = await makeAccount('rep3');

      await request(server)
        .post('/chat/reports')
        .set(as(stranger))
        .send({
          reportedUserId: first.id,
          reason: 'curiozitate',
          scope: 'friend',
          messageId: (sent.body as MessageBody).id,
        })
        .expect(404);
    });
  });
});
