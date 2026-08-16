import {
  BadRequestException,
  ForbiddenException,
  Injectable,
  Logger,
  NotFoundException,
  OnModuleInit,
} from '@nestjs/common';
import { CosmeticType, Prisma } from '@prisma/client';
import { capabilitiesFor } from '../auth/account-policy';
import { ChatService } from '../chat/chat.service';
import { LeaderboardService } from '../leaderboard/leaderboard.service';
import { PrismaService } from '../prisma/prisma.service';
import { resolveRank } from '../ranks/rank-tiers';
import {
  COSMETIC_CATALOG,
  CatalogCosmetic,
  CosmeticKind,
  DEFAULT_COSMETICS,
  DEFAULT_THEME_ACCENT,
  THEME_ACCENTS,
  catalogByCode,
  isKnownThemeAccent,
  isUnlocked,
} from './cosmetic-catalog';
import {
  MAX_PROFILE_LINKS,
  SUPPORTED_COUNTRIES,
  canChangeRegion,
  canPublishLinks,
  checkBio,
  checkLink,
  checkStatusEmoji,
  checkStatusText,
  isSupportedCountry,
  regionChangeAvailableAt,
} from './profile-content';
import { AddLinkDto } from './dto/add-link.dto';
import { EquipCosmeticDto } from './dto/equip-cosmetic.dto';
import { UpdateProfileContentDto } from './dto/update-profile-content.dto';
import { UpdateRegionDto } from './dto/update-region.dto';

/// Mesajele de respingere, într-un singur loc. Sunt în română fiindcă restul
/// erorilor de API sunt: aplicația le afișează ca atare când n-are un text
/// propriu pentru cazul respectiv.
const CONTENT_MESSAGES: Record<string, string> = {
  too_long: 'Textul depășește lungimea permisă.',
  profanity: 'Textul conține limbaj nepermis.',
  contains_link:
    'Linkurile se adaugă în secțiunea de linkuri, unde domeniul este verificat.',
  invalid_emoji: 'Câmpul de emoji acceptă doar un simbol, fără text.',
};

const LINK_MESSAGES: Record<string, string> = {
  label_too_long: 'Eticheta linkului lipsește sau este prea lungă.',
  url_too_long: 'Adresa este prea lungă.',
  malformed: 'Adresa nu este validă.',
  insecure_scheme: 'Sunt acceptate doar adresele https.',
  has_credentials: 'Adresa nu poate conține date de autentificare.',
  host_not_allowed:
    'Domeniul nu este pe lista platformelor acceptate pentru linkuri de profil.',
};

@Injectable()
export class ProfileService implements OnModuleInit {
  private readonly logger = new Logger(ProfileService.name);

  constructor(
    private readonly prisma: PrismaService,
    private readonly leaderboard: LeaderboardService,
    private readonly chat: ChatService,
  ) {}

  /// Aduce catalogul din cod în baza de date.
  ///
  /// Se face la pornire, nu într-o migrare cu `INSERT`-uri: catalogul e
  /// configurare, iar o migrare l-ar îngheța în istoricul schemei, unde
  /// adăugarea unui cosmetic ar cere o migrare nouă de fiecare dată. Rulează
  /// idempotent, deci a doua pornire nu schimbă nimic.
  async onModuleInit(): Promise<void> {
    try {
      await this.syncCatalog();
    } catch (error) {
      // O bază indisponibilă la pornire nu are voie să blocheze API-ul într-o
      // buclă de repornire: restul endpointurilor n-au nevoie de catalog.
      this.logger.error(
        `Catalogul de cosmetice nu a putut fi sincronizat: ${String(error)}`,
      );
    }
  }

  async syncCatalog(): Promise<void> {
    for (const cosmetic of COSMETIC_CATALOG) {
      const data = {
        type: cosmetic.type as CosmeticType,
        name: cosmetic.name,
        rarity: cosmetic.rarity,
        unlockLevel: cosmetic.unlockLevel,
        unlockRankOrder: cosmetic.unlockRankOrder,
        sortOrder: cosmetic.sortOrder,
      };
      await this.prisma.cosmetic.upsert({
        where: { code: cosmetic.code },
        create: { code: cosmetic.code, ...data },
        update: data,
      });
    }
  }

  // --- Citire ---

  /// Profilul propriu, complet: identitate, progres, cosmetice, linkuri,
  /// confidențialitate și regiune. Un singur request, fiindcă ecranul de profil
  /// le arată pe toate deodată și cinci apeluri paralele ar face antetul să
  /// apară în cinci pași.
  async getMyProfile(userId: string) {
    const user = await this.loadUser(userId);
    const [standing, permissions, privacy, links] = await Promise.all([
      this.leaderboard.getPosition(userId),
      this.chat.permissionsFor(userId),
      this.chat.getPrivacy(userId),
      this.prisma.userLink.findMany({
        where: { userId },
        orderBy: { createdAt: 'asc' },
      }),
    ]);

    const rank = resolveRank(user.eloRating, standing?.position ?? null);
    const capabilities = capabilitiesFor({
      emailVerifiedAt: user.emailVerifiedAt,
      birthDate: user.birthDate,
      now: new Date(),
    });
    const owned = new Set(
      user.inventory.map((entry) => entry.cosmetic.code),
    );
    const equipped = this.equippedCodes(user.inventory);

    return {
      id: user.id,
      username: user.username,
      displayName: user.displayName ?? user.username,
      email: user.email,
      /// Cum s-a autentificat contul, pentru secțiunea „Cont conectat" din
      /// `design-reference/04-account-settings.png`.
      authProvider: user.googleId !== null ? 'google' : 'email',
      createdAt: user.createdAt,
      level: user.level,
      xp: user.xp,
      coins: user.coins,
      correctAnswers: user.correctAnswers,
      matchesPlayed: user._count.matchPlayers,
      leaderboardPosition: standing?.position ?? null,
      rank,
      capabilities,
      trustTier: permissions.tier,
      trustTierKey: permissions.tierKey,
      bio: user.profile?.bio ?? null,
      status: this.activeStatus(user.profile),
      themeAccent: user.profile?.themeAccent ?? DEFAULT_THEME_ACCENT,
      themeAccents: THEME_ACCENTS,
      equipped,
      cosmetics: this.decorateCatalog({
        level: user.level,
        rankOrder: rank.order,
        ownedCodes: owned,
        equipped,
      }),
      links: links.map((link) => ({
        id: link.id,
        label: link.label,
        url: link.url,
        verified: link.verified,
      })),
      canPublishLinks: canPublishLinks({
        canPostExternalLinks: capabilities.canPostExternalLinks,
        trustTier: permissions.tier,
      }),
      maxLinks: MAX_PROFILE_LINKS,
      privacy,
      region: this.regionOf(user),
    };
  }

  /// Profilul altui jucător, filtrat prin setarea lui de vizibilitate (§4.9).
  ///
  /// Un profil ascuns întoarce 403 cu identitatea minimă, nu 404: jucătorul
  /// există, iar aplicația trebuie să poată arăta „profil privat" în loc de o
  /// eroare care sugerează un cont șters.
  async getPublicProfile(viewerId: string, username: string) {
    const user = await this.prisma.user.findFirst({
      where: { username: { equals: username, mode: 'insensitive' } },
      select: { id: true },
    });
    if (user === null) throw new NotFoundException('Jucătorul nu există.');

    const visible = await this.chat.canViewProfile(viewerId, user.id);
    const full = await this.loadUser(user.id);
    const standing = await this.leaderboard.getPosition(user.id);
    const rank = resolveRank(full.eloRating, standing?.position ?? null);
    const equipped = this.equippedCodes(full.inventory);

    const identity = {
      id: full.id,
      username: full.username,
      displayName: full.displayName ?? full.username,
      level: full.level,
      rank,
      equipped,
      visible,
    };
    if (!visible) return identity;

    const links = await this.prisma.userLink.findMany({
      where: { userId: user.id },
      orderBy: { createdAt: 'asc' },
    });

    return {
      ...identity,
      createdAt: full.createdAt,
      xp: full.xp,
      correctAnswers: full.correctAnswers,
      matchesPlayed: full._count.matchPlayers,
      leaderboardPosition: standing?.position ?? null,
      bio: full.profile?.bio ?? null,
      status: this.activeStatus(full.profile),
      themeAccent: full.profile?.themeAccent ?? DEFAULT_THEME_ACCENT,
      links: links.map((link) => ({
        id: link.id,
        label: link.label,
        url: link.url,
        verified: link.verified,
      })),
    };
  }

  // --- Scriere ---

  /// Bio, status și tema de accent (§4.3, §4.4, §4.8).
  ///
  /// `null` explicit șterge câmpul; câmpul absent îl lasă neatins. Fără
  /// distincția asta, „îmi șterg biografia" ar fi imposibil de exprimat.
  async updateContent(userId: string, dto: UpdateProfileContentDto) {
    const data: Prisma.UserProfileUncheckedCreateInput = { userId };

    if (dto.bio !== undefined) {
      const bio = dto.bio === null ? null : dto.bio.trim();
      if (bio !== null) {
        const check = checkBio(bio);
        if (!check.ok) throw new BadRequestException(this.contentError(check.reason));
      }
      data.bio = bio === '' ? null : bio;
    }

    if (dto.statusText !== undefined) {
      const text = dto.statusText === null ? null : dto.statusText.trim();
      if (text !== null) {
        const check = checkStatusText(text);
        if (!check.ok) throw new BadRequestException(this.contentError(check.reason));
      }
      data.statusText = text === '' ? null : text;
    }

    if (dto.statusEmoji !== undefined) {
      const emoji = dto.statusEmoji === null ? null : dto.statusEmoji.trim();
      if (emoji !== null && emoji !== '') {
        const check = checkStatusEmoji(emoji);
        if (!check.ok) throw new BadRequestException(this.contentError(check.reason));
      }
      data.statusEmoji = emoji === '' ? null : emoji;
    }

    if (dto.statusMinutes !== undefined) {
      // Durata se traduce imediat într-un moment absolut: un „mai are 30 de
      // minute" stocat ca durată ar depinde de când e citit.
      data.statusExpiresAt =
        dto.statusMinutes === null
          ? null
          : new Date(Date.now() + dto.statusMinutes * 60_000);
    }

    if (dto.themeAccent !== undefined) {
      if (!isKnownThemeAccent(dto.themeAccent)) {
        throw new BadRequestException('Tema de profil nu este recunoscută.');
      }
      data.themeAccent = dto.themeAccent;
    }

    const { userId: _ignored, ...update } = data;
    await this.prisma.userProfile.upsert({
      where: { userId },
      create: data,
      update,
    });
    return this.getMyProfile(userId);
  }

  /// Echipează un cosmetic sau, cu `code: null`, îl scoate.
  ///
  /// Deblocarea se verifică aici, pe server, chiar dacă aplicația ascunde deja
  /// obiectele blocate: clientul poate trimite orice cod (`agents.md`).
  async equip(userId: string, dto: EquipCosmeticDto) {
    const type = dto.type as CosmeticKind;

    if (dto.code === null) {
      await this.unequipType(userId, type);
      return this.getMyProfile(userId);
    }

    const catalogEntry = catalogByCode(dto.code);
    if (catalogEntry === undefined || catalogEntry.type !== type) {
      throw new BadRequestException('Cosmeticul nu există în catalog.');
    }

    const user = await this.loadUser(userId);
    const standing = await this.leaderboard.getPosition(userId);
    const rank = resolveRank(user.eloRating, standing?.position ?? null);
    const owned = new Set(user.inventory.map((entry) => entry.cosmetic.code));

    if (
      !isUnlocked(catalogEntry, {
        level: user.level,
        rankOrder: rank.order,
        ownedCodes: owned,
      })
    ) {
      throw new ForbiddenException('Cosmeticul nu este încă deblocat.');
    }

    const cosmetic = await this.prisma.cosmetic.findUnique({
      where: { code: catalogEntry.code },
      select: { id: true },
    });
    if (cosmetic === null) {
      throw new BadRequestException('Cosmeticul nu este disponibil.');
    }

    // Dezechiparea și echiparea într-o singură tranzacție: „cel mult unul per
    // tip" n-are cum să fie o constrângere de bază — tipul stă pe `cosmetics` —
    // deci o ține tranzacția, nu speranța că nimeni nu apasă de două ori.
    await this.prisma.$transaction(async (tx) => {
      await tx.userInventory.updateMany({
        where: { userId, equipped: true, cosmetic: { type: type as CosmeticType } },
        data: { equipped: false },
      });
      await tx.userInventory.upsert({
        where: {
          userId_cosmeticId: { userId, cosmeticId: cosmetic.id },
        },
        create: { userId, cosmeticId: cosmetic.id, equipped: true },
        update: { equipped: true },
      });
    });

    return this.getMyProfile(userId);
  }

  async addLink(userId: string, dto: AddLinkDto) {
    const [permissions, user] = await Promise.all([
      this.chat.permissionsFor(userId),
      this.prisma.user.findUniqueOrThrow({
        where: { id: userId },
        select: { emailVerifiedAt: true, birthDate: true },
      }),
    ]);
    const capabilities = capabilitiesFor({ ...user, now: new Date() });

    if (
      !canPublishLinks({
        canPostExternalLinks: capabilities.canPostExternalLinks,
        trustTier: permissions.tier,
      })
    ) {
      throw new ForbiddenException(
        'Linkurile de profil se deblochează la treapta de încredere T3, cu email confirmat.',
      );
    }

    const check = checkLink(dto.label, dto.url);
    if (!check.ok) {
      throw new BadRequestException(
        LINK_MESSAGES[check.reason ?? 'malformed'] ?? 'Link invalid.',
      );
    }

    const existing = await this.prisma.userLink.count({ where: { userId } });
    if (existing >= MAX_PROFILE_LINKS) {
      throw new BadRequestException(
        `Un profil poate avea cel mult ${MAX_PROFILE_LINKS} linkuri.`,
      );
    }

    await this.prisma.userLink.create({
      data: {
        userId,
        label: dto.label.trim(),
        url: check.url!,
        verified: true,
      },
    });
    return this.getMyProfile(userId);
  }

  async removeLink(userId: string, linkId: string) {
    // Filtrul pe `userId` face ca nimeni să nu poată șterge linkul altcuiva
    // ghicind un identificator.
    const deleted = await this.prisma.userLink.deleteMany({
      where: { id: linkId, userId },
    });
    if (deleted.count === 0) throw new NotFoundException('Linkul nu există.');
    return this.getMyProfile(userId);
  }

  // --- Regiune (§10.2) ---

  async updateRegion(userId: string, dto: UpdateRegionDto) {
    const now = new Date();
    const user = await this.prisma.user.findUniqueOrThrow({
      where: { id: userId },
      select: { countryCode: true, regionChangedAt: true },
    });

    const country = dto.countryCode.toUpperCase();
    if (!isSupportedCountry(country)) {
      throw new BadRequestException('Țara nu este în lista acceptată.');
    }
    if (country === user.countryCode) {
      return this.getMyProfile(userId);
    }
    // Prima alegere e gratuită: cooldown-ul are sens abia după ce există o
    // țară de la care să pleci.
    if (user.countryCode !== null && !canChangeRegion(user.regionChangedAt, now)) {
      const availableAt = regionChangeAvailableAt(user.regionChangedAt, now);
      throw new BadRequestException(
        `Țara se poate schimba din nou după ${availableAt?.toISOString()}.`,
      );
    }

    await this.prisma.user.update({
      where: { id: userId },
      data: { countryCode: country, regionChangedAt: now },
    });
    return this.getMyProfile(userId);
  }

  // --- Ajutoare ---

  private loadUser(userId: string) {
    return this.prisma.user.findUniqueOrThrow({
      where: { id: userId },
      select: {
        id: true,
        username: true,
        displayName: true,
        email: true,
        emailVerifiedAt: true,
        birthDate: true,
        googleId: true,
        countryCode: true,
        regionChangedAt: true,
        createdAt: true,
        eloRating: true,
        xp: true,
        level: true,
        coins: true,
        correctAnswers: true,
        profile: true,
        inventory: {
          select: {
            equipped: true,
            cosmetic: { select: { code: true, type: true } },
          },
        },
        _count: { select: { matchPlayers: true } },
      },
    });
  }

  private regionOf(user: { countryCode: string | null; regionChangedAt: Date | null }) {
    return {
      countryCode: user.countryCode,
      supportedCountries: SUPPORTED_COUNTRIES,
      changeAvailableAt:
        user.countryCode === null
          ? null
          : regionChangeAvailableAt(user.regionChangedAt, new Date()),
    };
  }

  /// Statusul custom, dar numai dacă n-a expirat (§4.4). Expirarea se aplică la
  /// citire, nu printr-un job: un status expirat pur și simplu nu se mai
  /// afișează, iar un job care curăță rânduri ar fi infrastructură în plus
  /// pentru exact același rezultat.
  private activeStatus(
    profile: {
      statusText: string | null;
      statusEmoji: string | null;
      statusExpiresAt: Date | null;
    } | null,
  ) {
    if (profile === null) return null;
    if (profile.statusText === null && profile.statusEmoji === null) return null;
    if (
      profile.statusExpiresAt !== null &&
      profile.statusExpiresAt.getTime() <= Date.now()
    ) {
      return null;
    }
    return {
      text: profile.statusText,
      emoji: profile.statusEmoji,
      expiresAt: profile.statusExpiresAt,
    };
  }

  private equippedCodes(
    inventory: readonly {
      equipped: boolean;
      cosmetic: { code: string; type: CosmeticType };
    }[],
  ): Record<string, string | null> {
    const equipped: Record<string, string | null> = { ...DEFAULT_COSMETICS };
    for (const entry of inventory) {
      if (!entry.equipped) continue;
      equipped[entry.cosmetic.type] = entry.cosmetic.code;
    }
    return equipped;
  }

  private decorateCatalog({
    level,
    rankOrder,
    ownedCodes,
    equipped,
  }: {
    level: number;
    rankOrder: number;
    ownedCodes: ReadonlySet<string>;
    equipped: Record<string, string | null>;
  }) {
    return COSMETIC_CATALOG.map((cosmetic: CatalogCosmetic) => ({
      code: cosmetic.code,
      type: cosmetic.type,
      rarity: cosmetic.rarity,
      unlockLevel: cosmetic.unlockLevel,
      unlockRankOrder: cosmetic.unlockRankOrder,
      unlocked: isUnlocked(cosmetic, { level, rankOrder, ownedCodes }),
      equipped: equipped[cosmetic.type] === cosmetic.code,
    }));
  }

  private async unequipType(userId: string, type: CosmeticKind): Promise<void> {
    await this.prisma.userInventory.updateMany({
      where: { userId, equipped: true, cosmetic: { type: type as CosmeticType } },
      data: { equipped: false },
    });
  }

  private contentError(reason?: string): string {
    return CONTENT_MESSAGES[reason ?? ''] ?? 'Conținutul nu este acceptat.';
  }
}
