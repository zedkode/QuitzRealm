import {
  BadRequestException,
  ConflictException,
  Injectable,
  UnauthorizedException,
} from '@nestjs/common';
import { ConfigService } from '@nestjs/config';
import { JwtService } from '@nestjs/jwt';
import { AuthTokenPurpose } from '@prisma/client';
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
import {
  AuthTokens,
  AuthenticatedUser,
  GoogleUser,
  JwtPayload,
  RefreshPayload,
} from './auth.types';
import { LoginDto } from './dto/login.dto';
import { RegisterDto } from './dto/register.dto';
import { SessionContext, SessionService } from './session.service';

@Injectable()
export class AuthService {
  constructor(
    private readonly prisma: PrismaService,
    private readonly jwt: JwtService,
    private readonly config: ConfigService,
    private readonly sessions: SessionService,
    private readonly tokens: AuthTokenService,
    private readonly mailer: MailerService,
  ) {}

  async register(
    dto: RegisterDto,
    context: SessionContext,
  ): Promise<AuthTokens> {
    const email = dto.email.trim().toLowerCase();
    const username = dto.username.trim();
    const birthDate = new Date(dto.birthDate);
    const now = new Date();

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

  async login(dto: LoginDto, context: SessionContext): Promise<AuthTokens> {
    const user = await this.prisma.user.findUnique({
      where: { email: dto.email.trim().toLowerCase() },
    });
    if (
      !user?.passwordHash ||
      !(await argon2.verify(user.passwordHash, dto.password))
    ) {
      throw new UnauthorizedException('Date de autentificare invalide.');
    }
    return this.startSession(user.id, user.email, context);
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
        emailVerifiedAt: true,
        birthDate: true,
      },
    });
    if (!user) {
      throw new UnauthorizedException();
    }
    return {
      id: user.id,
      email: user.email,
      username: user.username,
      displayName: user.displayName ?? user.username,
      sessionId: payload.sid,
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
  ): Promise<AuthTokens> {
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
    } else {
      const stem =
        (profile.displayName || email.split('@')[0])
          .replace(/[^a-zA-Z0-9_]/g, '')
          .slice(0, 20) || 'jucator';
      const username = `${stem}_${profile.googleId.slice(-8)}`;
      user = await this.prisma.user.create({
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
    return this.startSession(user.id, user.email, context);
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
