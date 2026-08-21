import {
  BadRequestException,
  ConflictException,
  ForbiddenException,
  Injectable,
  UnauthorizedException,
} from '@nestjs/common';
import { ConfigService } from '@nestjs/config';
import { JwtService } from '@nestjs/jwt';
import { AuthTokenPurpose, Prisma } from '@prisma/client';
import * as argon2 from 'argon2';
import { randomUUID } from 'node:crypto';
import { MailerService } from '../mail/mailer.service';
import { PrismaService } from '../prisma/prisma.service';
import {
  capabilitiesFor,
  isBelowMinimumAge,
  isPlausibleBirthDate,
  MINIMUM_AGE_YEARS,
} from './account-policy';
import { AuthTokenService } from './auth-token.service';
import { CaptchaService } from './captcha.service';
import {
  AuthTokens,
  AuthenticatedUser,
  GoogleUser,
  JwtPayload,
  LoginResult,
  RefreshPayload,
} from './auth.types';
import { MigrateGuestProgressDto } from './dto/guest-migration.dto';
import { LoginDto } from './dto/login.dto';
import { RegisterDto } from './dto/register.dto';
import { SessionContext, SessionService } from './session.service';
import { TotpService } from './totp.service';

@Injectable()
export class AuthService {
  constructor(
    private readonly prisma: PrismaService,
    private readonly jwt: JwtService,
    private readonly config: ConfigService,
    private readonly sessions: SessionService,
    private readonly tokens: AuthTokenService,
    private readonly mailer: MailerService,
    private readonly totp: TotpService,
    private readonly captcha: CaptchaService,
  ) {}

  async register(
    dto: RegisterDto,
    context: SessionContext,
  ): Promise<AuthTokens> {
    const email = dto.email.trim().toLowerCase();
    const username = dto.username.trim();
    const birthDate = new Date(dto.birthDate);
    const now = new Date();

    await this.captcha.assertValid(dto.captchaToken, context.ipAddress);
    await this.sessions.assertRegistrationAllowed(context);
    if (!isPlausibleBirthDate(birthDate, now)) {
      throw new BadRequestException('Data nașterii nu este validă.');
    }
    if (isBelowMinimumAge(birthDate, now)) {
      throw new BadRequestException(
        `Trebuie să ai cel puțin ${MINIMUM_AGE_YEARS} ani pentru a-ți crea cont.`,
      );
    }

    const existing = await this.prisma.user.findFirst({
      where: { OR: [{ email }, { username }] },
      select: { id: true },
    });
    if (existing) {
      throw new ConflictException(
        'Emailul sau numele de utilizator există deja.',
      );
    }

    const user = await this.prisma.user.create({
      data: {
        email,
        username,
        displayName: dto.displayName?.trim() || username,
        birthDate,
        passwordHash: await argon2.hash(dto.password),
      },
    });
    // Fără `await` pe eșec: contul e deja creat, iar o problemă la providerul
    // de email n-are voie să transforme o înregistrare reușită într-un 5xx.
    await this.sendVerificationEmail(user.id, user.email, { quiet: true });
    return this.startSession(user.id, user.email, context);
  }

  async login(dto: LoginDto, context: SessionContext): Promise<LoginResult> {
    const user = await this.prisma.user.findUnique({
      where: { email: dto.email.trim().toLowerCase() },
    });
    if (
      !user?.passwordHash ||
      !(await argon2.verify(user.passwordHash, dto.password))
    ) {
      throw new UnauthorizedException('Date de autentificare invalide.');
    }
    return this.completePrimaryLogin(user, context);
  }

  async refresh(
    refreshToken: string,
    context: SessionContext,
  ): Promise<AuthTokens> {
    let payload: RefreshPayload;
    try {
      payload = await this.jwt.verifyAsync<RefreshPayload>(refreshToken, {
        secret: this.config.getOrThrow<string>('JWT_REFRESH_SECRET'),
      });
    } catch {
      throw new UnauthorizedException('Refresh token invalid sau expirat.');
    }
    if (!payload.sid) {
      // Token emis înainte de trecerea la sesiuni pe dispozitiv.
      throw new UnauthorizedException('Refresh token invalidat.');
    }

    const valid = await this.sessions.verify(
      payload.sid,
      payload.sub,
      refreshToken,
    );
    if (!valid) {
      throw new UnauthorizedException('Refresh token invalidat.');
    }

    const tokens = await this.issueTokens(
      payload.sub,
      payload.email,
      payload.sid,
    );
    await this.sessions.rotate({
      sessionId: payload.sid,
      refreshToken: tokens.refreshToken,
      expiresAt: this.refreshExpiry(),
      context,
    });
    return tokens;
  }

  /// Închide sesiunea curentă. Fără `sessionId` (token deja invalid) nu avem
  /// ce revoca, dar clientul își poate curăța oricum starea locală.
  async logout(userId: string, sessionId?: string): Promise<void> {
    if (sessionId) {
      await this.sessions.revoke(userId, sessionId);
      return;
    }
    await this.sessions.revokeAll(userId);
  }

  async validateAccessUser(payload: JwtPayload): Promise<AuthenticatedUser> {
    const user = await this.prisma.user.findUnique({
      where: { id: payload.sub },
      select: {
        id: true,
        email: true,
        username: true,
        displayName: true,
        role: true,
        bannedAt: true,
        language: {
          select: { isoCode: true, active: true },
        },
        emailVerifiedAt: true,
        birthDate: true,
      },
    });
    if (!user) {
      throw new UnauthorizedException();
    }
    // Contul suspendat e oprit aici, o singură dată, pentru toate rutele
    // autentificate. Verificat la fiecare cerere pentru că `validateAccessUser`
    // citește oricum utilizatorul din baza de date: un ban are efect imediat,
    // nu după ce expiră tokenul curent.
    if (user.bannedAt !== null) {
      throw new ForbiddenException('Account suspended.');
    }
    return {
      id: user.id,
      email: user.email,
      username: user.username,
      displayName: user.displayName ?? user.username,
      sessionId: payload.sid,
      role: user.role,
      languageIsoCode: user.language?.active
        ? user.language.isoCode
        : undefined,
      bannedAt: user.bannedAt,
      capabilities: capabilitiesFor({
        emailVerifiedAt: user.emailVerifiedAt,
        birthDate: user.birthDate,
        now: new Date(),
      }),
    };
  }

  async loginWithGoogle(
    profile: GoogleUser,
    context: SessionContext,
  ): Promise<LoginResult> {
    const user = await this.resolveGoogleUser(profile);
    return this.completePrimaryLogin(user, context);
  }

  /// Callback-ul browserului mobil nu primește tokenuri JWT. Emitem în schimb
  /// un cod opac, utilizabil o singură dată de aplicația care a inițiat OAuth.
  async createGoogleMobileExchange(profile: GoogleUser): Promise<string> {
    const user = await this.resolveGoogleUser(profile);
    const exchange = await this.tokens.issue(
      user.id,
      AuthTokenPurpose.MOBILE_OAUTH_EXCHANGE,
    );
    return exchange.token;
  }

  async exchangeGoogleMobileCode(
    code: string,
    context: SessionContext,
  ): Promise<LoginResult> {
    const userId = await this.tokens.consume(
      code,
      AuthTokenPurpose.MOBILE_OAUTH_EXCHANGE,
    );
    if (!userId) {
      throw new UnauthorizedException('Codul Google OAuth este invalid sau expirat.');
    }
    const user = await this.prisma.user.findUnique({ where: { id: userId } });
    if (!user) throw new UnauthorizedException();
    return this.completePrimaryLogin(user, context);
  }

  // --- Autentificare cu doi factori (TOTP, §1.1) ---

  /// Generează un secret nou, criptat pe server. Acesta nu este activ până
  /// când proprietarul contului confirmă și codul curent din aplicația TOTP.
  async startTwoFactorEnrollment(
    userId: string,
    currentPassword: string,
  ): Promise<{ otpauthUri: string }> {
    const user = await this.prisma.user.findUniqueOrThrow({
      where: { id: userId },
      select: { email: true, passwordHash: true, twoFactorEnabledAt: true },
    });
    await this.assertCurrentPassword(user.passwordHash, currentPassword);
    if (user.twoFactorEnabledAt !== null) {
      throw new BadRequestException('Autentificarea cu doi factori este deja activă.');
    }

    const enrollment = this.totp.createEnrollment({ accountName: user.email });
    await this.prisma.user.update({
      where: { id: userId },
      data: {
        twoFactorSecret: this.totp.encryptSecret(enrollment.secret),
        twoFactorRecoveryCodes: Prisma.JsonNull,
      },
    });
    return { otpauthUri: enrollment.otpauthUri };
  }

  /// Activează 2FA după confirmarea parolei și a primului cod de autentificare.
  /// Codurile de recuperare sunt arătate o singură dată în răspunsul API.
  async confirmTwoFactorEnrollment(
    userId: string,
    currentPassword: string,
    code: string,
  ): Promise<{ recoveryCodes: string[] }> {
    const user = await this.prisma.user.findUniqueOrThrow({
      where: { id: userId },
      select: { passwordHash: true, twoFactorSecret: true, twoFactorEnabledAt: true },
    });
    await this.assertCurrentPassword(user.passwordHash, currentPassword);
    if (user.twoFactorEnabledAt !== null) {
      throw new BadRequestException('Autentificarea cu doi factori este deja activă.');
    }
    const secret = user.twoFactorSecret
      ? this.totp.decryptSecret(user.twoFactorSecret)
      : null;
    if (!secret || !this.totp.verifyCode(secret, code)) {
      throw new UnauthorizedException('Codul de autentificare nu este valid.');
    }

    const recovery = await this.totp.createRecoveryCodes();
    await this.prisma.user.update({
      where: { id: userId },
      data: {
        twoFactorEnabledAt: new Date(),
        twoFactorRecoveryCodes: recovery.hashes,
      },
    });
    return { recoveryCodes: recovery.plaintext };
  }

  async disableTwoFactor(
    userId: string,
    currentPassword: string,
    code: string,
  ): Promise<void> {
    const user = await this.prisma.user.findUniqueOrThrow({
      where: { id: userId },
      select: {
        passwordHash: true,
        twoFactorSecret: true,
        twoFactorEnabledAt: true,
        twoFactorRecoveryCodes: true,
      },
    });
    await this.assertCurrentPassword(user.passwordHash, currentPassword);
    if (user.twoFactorEnabledAt === null) {
      throw new BadRequestException('Autentificarea cu doi factori nu este activă.');
    }
    const verified = await this.verifyTwoFactorCode(user, code);
    if (!verified) {
      throw new UnauthorizedException('Codul de autentificare nu este valid.');
    }

    await this.prisma.user.update({
      where: { id: userId },
      data: {
        twoFactorSecret: null,
        twoFactorEnabledAt: null,
        twoFactorRecoveryCodes: Prisma.JsonNull,
      },
    });
    await this.sessions.revokeAll(userId);
  }

  /// Ultimul pas după parola corectă. Provocarea nu emite o sesiune și expiră
  /// în cinci minute; abia codul TOTP corect permite autentificarea.
  async completeTwoFactorLogin(
    challengeToken: string,
    code: string,
    context: SessionContext,
  ): Promise<AuthTokens> {
    const challenge = await this.tokens.inspect(
      challengeToken,
      AuthTokenPurpose.TWO_FACTOR_LOGIN,
    );
    if (!challenge) {
      throw new UnauthorizedException('Provocarea de autentificare a expirat.');
    }

    const user = await this.prisma.user.findUnique({
      where: { id: challenge.userId },
      select: {
        id: true,
        email: true,
        twoFactorSecret: true,
        twoFactorEnabledAt: true,
        twoFactorRecoveryCodes: true,
      },
    });
    if (!user || user.twoFactorEnabledAt === null) {
      throw new UnauthorizedException('Autentificarea cu doi factori nu mai este activă.');
    }
    const verified = await this.verifyTwoFactorCode(user, code);
    if (!verified || !(await this.tokens.claim(challenge.id))) {
      throw new UnauthorizedException('Codul de autentificare nu este valid sau a expirat.');
    }
    if (verified.remainingRecoveryCodes !== undefined) {
      await this.prisma.user.update({
        where: { id: user.id },
        data: { twoFactorRecoveryCodes: verified.remainingRecoveryCodes },
      });
    }
    return this.startSession(user.id, user.email, context);
  }

  // --- Conversie mod invitat (§1.1) ---

  /// Atașează o singură dată progresul solo de pe dispozitiv la cont. Payloadul
  /// este redus la campania necompetitivă; nu poate acorda ELO, monede sau
  /// cosmetice dintr-un client modificat.
  async migrateGuestProgress(
    userId: string,
    dto: MigrateGuestProgressDto,
  ): Promise<void> {
    const campaignProgress = this.sanitizeGuestCampaignProgress(dto.campaignProgress);
    const existing = await this.prisma.guestMigration.findFirst({
      where: { OR: [{ userId }, { guestId: dto.guestId.toLowerCase() }] },
      select: { id: true },
    });
    if (existing) {
      throw new ConflictException('Acest progres invitat a fost deja convertit.');
    }

    await this.prisma.guestMigration.create({
      data: {
        userId,
        guestId: dto.guestId.toLowerCase(),
        campaignProgress,
      },
    });
  }

  // --- Verificare email (§1.3) ---

  /// Emite și trimite un link de verificare. Nu spune niciodată dacă adresa
  /// există deja verificată — răspunsul e identic în toate cazurile.
  async requestEmailVerification(userId: string): Promise<void> {
    const user = await this.prisma.user.findUnique({
      where: { id: userId },
      select: { email: true, emailVerifiedAt: true },
    });
    if (!user || user.emailVerifiedAt !== null) return;
    await this.sendVerificationEmail(userId, user.email);
  }

  async confirmEmailVerification(token: string): Promise<void> {
    const userId = await this.tokens.consume(
      token,
      AuthTokenPurpose.EMAIL_VERIFICATION,
    );
    if (!userId) {
      throw new BadRequestException('Link de verificare invalid sau expirat.');
    }
    await this.prisma.user.update({
      where: { id: userId },
      data: { emailVerifiedAt: new Date() },
    });
  }

  // --- Resetare parolă (§1.4) ---

  /// Răspunsul e identic fie că adresa există sau nu: altfel endpointul ar
  /// deveni un instrument de verificat ce conturi sunt înregistrate.
  async requestPasswordReset(rawEmail: string): Promise<void> {
    const email = rawEmail.trim().toLowerCase();
    const user = await this.prisma.user.findUnique({
      where: { email },
      select: { id: true },
    });
    if (!user) return;

    const { token, expiresAt } = await this.tokens.issue(
      user.id,
      AuthTokenPurpose.PASSWORD_RESET,
    );
    // `sendQuietly`: un 5xx apărut doar pentru adresele care există ar spune
    // atacatorului exact ce voia să afle.
    await this.mailer.sendQuietly({
      to: email,
      subject: 'QuizRealm — resetare parolă',
      body:
        `Deschide linkul ca să-ți alegi o parolă nouă:\n` +
        `${this.appUrl()}/auth/reset-password?token=${token}\n\n` +
        `Linkul expiră la ${expiresAt.toISOString()}. ` +
        `Dacă nu tu ai cerut resetarea, ignoră mesajul.`,
    });
  }

  /// Schimbă parola și **închide toate sesiunile**: dacă resetarea a fost
  /// cerută pentru că cineva a intrat pe cont, atacatorul trebuie dat afară.
  async resetPassword(token: string, newPassword: string): Promise<void> {
    const userId = await this.tokens.consume(
      token,
      AuthTokenPurpose.PASSWORD_RESET,
    );
    if (!userId) {
      throw new BadRequestException('Link de resetare invalid sau expirat.');
    }
    await this.prisma.user.update({
      where: { id: userId },
      data: { passwordHash: await argon2.hash(newPassword) },
    });
    await this.sessions.revokeAll(userId);
  }

  /// Schimbarea parolei din cont, cu parola curentă drept dovadă.
  ///
  /// Diferit de resetarea prin email: acolo dovada e linkul primit pe adresă,
  /// aici e faptul că știi parola veche. Fără ea, un telefon lăsat deblocat
  /// cinci minute ar fi de ajuns ca să-i schimbe cineva parola contului.
  ///
  /// Închide celelalte sesiuni, dar o păstrează pe cea curentă: cine tocmai
  /// și-a schimbat parola în aplicație n-are de ce să fie dat afară din ea.
  async changePassword(
    userId: string,
    currentPassword: string,
    newPassword: string,
    sessionId?: string,
  ): Promise<void> {
    const user = await this.prisma.user.findUniqueOrThrow({
      where: { id: userId },
      select: { passwordHash: true },
    });

    if (user.passwordHash === null) {
      // Cont creat prin Google: n-are parolă de confirmat, deci și-o setează
      // prin fluxul de resetare pe email, unde dovada e accesul la adresă.
      throw new BadRequestException(
        'Contul folosește autentificarea Google. Setează o parolă prin resetare pe email.',
      );
    }
    if (!(await argon2.verify(user.passwordHash, currentPassword))) {
      throw new UnauthorizedException('Parola curentă nu este corectă.');
    }
    if (currentPassword === newPassword) {
      throw new BadRequestException('Noua parolă trebuie să fie diferită.');
    }

    await this.prisma.user.update({
      where: { id: userId },
      data: { passwordHash: await argon2.hash(newPassword) },
    });
    await this.sessions.revokeAll(userId, sessionId);
  }

  /// Șterge definitiv contul, după confirmarea identității.
  ///
  /// Ștergerea e reală, nu o marcare: `onDelete: Cascade` duce cu el sesiunile,
  /// prietenii, mesajele și inventarul. Partidele jucate rămân doar acolo unde
  /// relația e `Restrict` — istoricul altor jucători n-are voie să se rupă
  /// pentru că cineva a plecat.
  async deleteAccount(userId: string, password?: string): Promise<void> {
    const user = await this.prisma.user.findUniqueOrThrow({
      where: { id: userId },
      select: { passwordHash: true },
    });

    if (user.passwordHash !== null) {
      if (password === undefined || password.length === 0) {
        throw new BadRequestException(
          'Confirmă ștergerea contului cu parola ta.',
        );
      }
      if (!(await argon2.verify(user.passwordHash, password))) {
        throw new UnauthorizedException('Parola nu este corectă.');
      }
    }

    await this.prisma.user.delete({ where: { id: userId } });
  }

  private async resolveGoogleUser(profile: GoogleUser) {
    const email = profile.email.toLowerCase();
    let user = await this.prisma.user.findFirst({
      where: { OR: [{ googleId: profile.googleId }, { email }] },
    });

    if (user) {
      if (!user.googleId) {
        user = await this.prisma.user.update({
          where: { id: user.id },
          data: { googleId: profile.googleId },
        });
      }
      return user;
    }

    const stem =
      (profile.displayName || email.split('@')[0])
        .replace(/[^a-zA-Z0-9_]/g, '')
        .slice(0, 20) || 'jucator';
    const username = `${stem}_${profile.googleId.slice(-8)}`;
    return this.prisma.user.create({
      data: {
        email,
        googleId: profile.googleId,
        username,
        displayName: profile.displayName?.trim() || username,
        // Google a verificat deja adresa; nu mai cerem încă o confirmare.
        emailVerifiedAt: new Date(),
      },
    });
  }

  private sanitizeGuestCampaignProgress(
    value: Record<string, unknown>,
  ): { xp: number; stars: Record<string, number> } {
    const rawXp = value.xp;
    // XP-ul solo este expus doar ca progres de campanie; îl limităm totuși ca
    // un payload corupt sau malițios să nu umfle inutil stocarea de profil.
    const xp =
      typeof rawXp === 'number' && Number.isSafeInteger(rawXp) && rawXp >= 0
        ? Math.min(rawXp, 1_000_000)
        : 0;
    const stars: Record<string, number> = {};
    const rawStars = value.stars;
    if (rawStars && typeof rawStars === 'object' && !Array.isArray(rawStars)) {
      for (const [stage, score] of Object.entries(rawStars).slice(0, 120)) {
        if (
          /^[a-z0-9_-]{1,64}\/[0-9]{1,3}$/i.test(stage) &&
          typeof score === 'number' &&
          Number.isInteger(score) &&
          score >= 0 &&
          score <= 3
        ) {
          stars[stage] = score;
        }
      }
    }
    return { xp, stars };
  }

  private async completePrimaryLogin(
    user: {
      id: string;
      email: string;
      twoFactorEnabledAt: Date | null;
      bannedAt?: Date | null;
    },
    context: SessionContext,
  ): Promise<LoginResult> {
    // Punctul comun al tuturor căilor de autentificare (parolă și Google), deci
    // singurul loc unde suspendarea trebuie oprită la emiterea de tokenuri.
    if (user.bannedAt != null) {
      throw new ForbiddenException('Account suspended.');
    }
    if (user.twoFactorEnabledAt === null) {
      return this.startSession(user.id, user.email, context);
    }
    const challenge = await this.tokens.issue(
      user.id,
      AuthTokenPurpose.TWO_FACTOR_LOGIN,
    );
    return {
      twoFactorRequired: true,
      challengeToken: challenge.token,
      expiresAt: challenge.expiresAt.toISOString(),
    };
  }

  private async assertCurrentPassword(
    passwordHash: string | null,
    currentPassword: string,
  ): Promise<void> {
    if (passwordHash === null) {
      throw new BadRequestException(
        'Contul folosește autentificarea Google. Setează mai întâi o parolă prin resetare pe email.',
      );
    }
    if (!(await argon2.verify(passwordHash, currentPassword))) {
      throw new UnauthorizedException('Parola curentă nu este corectă.');
    }
  }

  private async verifyTwoFactorCode(
    user: {
      twoFactorSecret: string | null;
      twoFactorRecoveryCodes: unknown;
    },
    code: string,
  ): Promise<{ remainingRecoveryCodes?: string[] } | null> {
    const secret = user.twoFactorSecret
      ? this.totp.decryptSecret(user.twoFactorSecret)
      : null;
    if (secret && this.totp.verifyCode(secret, code)) return {};

    const remainingRecoveryCodes = await this.totp.consumeRecoveryCode(
      user.twoFactorRecoveryCodes,
      code,
    );
    return remainingRecoveryCodes === null ? null : { remainingRecoveryCodes };
  }

  private async sendVerificationEmail(
    userId: string,
    email: string,
    options: { quiet?: boolean } = {},
  ): Promise<void> {
    const { token, expiresAt } = await this.tokens.issue(
      userId,
      AuthTokenPurpose.EMAIL_VERIFICATION,
    );
    const mail = {
      to: email,
      subject: 'QuizRealm — confirmă-ți adresa de email',
      body:
        `Bine ai venit în QuizRealm. Confirmă-ți adresa:\n` +
        `${this.appUrl()}/auth/verify-email?token=${token}\n\n` +
        `Linkul expiră la ${expiresAt.toISOString()}.`,
    };
    // La cererea explicită „retrimite-mi linkul” eșecul se vede: jucătorul
    // așteaptă un email și trebuie să știe dacă n-a plecat.
    await (options.quiet
      ? this.mailer.sendQuietly(mail)
      : this.mailer.send(mail));
  }

  private async startSession(
    userId: string,
    email: string,
    context: SessionContext,
  ): Promise<AuthTokens> {
    // Sesiunea are nevoie de refresh token, iar token-ul de id-ul sesiunii.
    // Rupem cercul creând întâi rândul cu un token de unică folosință, apoi
    // rotindu-l imediat pe cel real.
    const sessionId = await this.sessions.create({
      userId,
      refreshToken: 'pending',
      expiresAt: this.refreshExpiry(),
      context,
    });
    const tokens = await this.issueTokens(userId, email, sessionId);
    await this.sessions.rotate({
      sessionId,
      refreshToken: tokens.refreshToken,
      expiresAt: this.refreshExpiry(),
      context,
    });
    return tokens;
  }

  private async issueTokens(
    userId: string,
    email: string,
    sessionId: string,
  ): Promise<AuthTokens> {
    const accessToken = await this.jwt.signAsync(
      { sub: userId, email, sid: sessionId } satisfies JwtPayload,
      {
        secret: this.config.getOrThrow<string>('JWT_ACCESS_SECRET'),
        expiresIn: this.config.get<string>(
          'JWT_ACCESS_EXPIRES_IN',
          '15m',
        ) as never,
      },
    );
    const refreshToken = await this.jwt.signAsync(
      {
        sub: userId,
        email,
        sid: sessionId,
        // `jti` aleator: fără el, două rotații în aceeași secundă produc un
        // token identic (aceleași revendicări, același `iat`), rotația devine
        // un no-op și detecția de rejucare nu mai are ce observa.
        jti: randomUUID(),
      } satisfies RefreshPayload,
      {
        secret: this.config.getOrThrow<string>('JWT_REFRESH_SECRET'),
        expiresIn: this.config.get<string>(
          'JWT_REFRESH_EXPIRES_IN',
          '30d',
        ) as never,
      },
    );
    return { accessToken, refreshToken };
  }

  private refreshExpiry(): Date {
    const raw = this.config.get<string>('JWT_REFRESH_EXPIRES_IN', '30d');
    const match = /^(\d+)([smhd])$/.exec(raw.trim());
    const unitMs: Record<string, number> = {
      s: 1_000,
      m: 60_000,
      h: 3_600_000,
      d: 86_400_000,
    };
    const ms = match ? Number(match[1]) * unitMs[match[2]] : 30 * 86_400_000;
    return new Date(Date.now() + ms);
  }

  private appUrl(): string {
    return this.config
      .get<string>('APP_PUBLIC_URL', 'http://localhost:3000')
      .replace(/\/+$/, '');
  }
}
