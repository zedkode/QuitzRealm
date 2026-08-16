import {
  BadRequestException,
  ConflictException,
  Injectable,
} from '@nestjs/common';
import {
  MINIMUM_AGE_YEARS,
  USERNAME_CHANGE_COOLDOWN_DAYS,
  capabilitiesFor,
  canChangeUsername,
  isBelowMinimumAge,
  isPlausibleBirthDate,
  usernameChangeAvailableAt,
} from '../auth/account-policy';
import { LeaderboardService } from '../leaderboard/leaderboard.service';
import { PrismaService } from '../prisma/prisma.service';
import { DEFAULT_COSMETICS } from '../profile/cosmetic-catalog';
import { resolveRank } from '../ranks/rank-tiers';
import { SetBirthDateDto } from './dto/set-birth-date.dto';
import { UpdateProfileDto } from './dto/update-profile.dto';
import { UpdateUsernameDto } from './dto/update-username.dto';

/// Ce poartă jucătorul, cu implicitele completate.
///
/// Aceleași implicite ca în catalog: un cont nou n-are niciun rând în inventar,
/// dar are totuși un portret și o ramă — altfel fiecare ecran ar trebui să-și
/// inventeze propriul „dacă lipsește".
function equippedCosmetics(
  inventory: readonly { cosmetic: { code: string; type: string } }[],
): Record<string, string | null> {
  const equipped: Record<string, string | null> = { ...DEFAULT_COSMETICS };
  for (const entry of inventory) {
    equipped[entry.cosmetic.type] = entry.cosmetic.code;
  }
  return equipped;
}

@Injectable()
export class UsersService {
  constructor(
    private readonly prisma: PrismaService,
    private readonly leaderboard: LeaderboardService,
  ) {}

  async getProfile(id: string) {
    const user = await this.prisma.user.findUniqueOrThrow({
      where: { id },
      select: {
        id: true,
        username: true,
        displayName: true,
        usernameChangedAt: true,
        email: true,
        emailVerifiedAt: true,
        birthDate: true,
        createdAt: true,
        eloRating: true,
        xp: true,
        level: true,
        coins: true,
        inventory: {
          where: { equipped: true },
          select: { cosmetic: { select: { code: true, type: true } } },
        },
        _count: { select: { matchPlayers: true } },
      },
    });

    const standing = await this.leaderboard.getPosition(id);
    const now = new Date();
    const {
      _count,
      usernameChangedAt,
      emailVerifiedAt,
      birthDate,
      inventory,
      ...profile
    } = user;

    return {
      ...profile,
      // Când nu și-a ales un nume afișat, folosim handle-ul.
      displayName: user.displayName ?? user.username,
      // Ce poartă acum, ca antetul de identitate să arate același portret pe
      // toate ecranele fără să ceară profilul complet la fiecare randare.
      equipped: equippedCosmetics(inventory),
      matchesPlayed: _count.matchPlayers,
      leaderboardPosition: standing?.position ?? null,
      rank: resolveRank(user.eloRating, standing?.position ?? null),
      capabilities: capabilitiesFor({ emailVerifiedAt, birthDate, now }),
      // Data nașterii nu se întoarce clientului: aplicația are nevoie doar de
      // consecința ei (`capabilities.isMinor`), nu de dată în sine.
      usernameChangeAvailableAt: usernameChangeAvailableAt(
        usernameChangedAt,
        now,
      ),
    };
  }

  /// Capabilitățile contului, fără restul profilului. Le folosește
  /// `backend/realtime` ca să decidă dacă un jucător poate intra în coada
  /// ranked (§1.3).
  async getCapabilities(id: string) {
    const user = await this.prisma.user.findUniqueOrThrow({
      where: { id },
      select: { emailVerifiedAt: true, birthDate: true },
    });
    return capabilitiesFor({ ...user, now: new Date() });
  }

  /// Numele afișat se schimbă liber (§1.2) — nu are cooldown, pentru că nu e
  /// identificatorul contului.
  async updateProfile(id: string, dto: UpdateProfileDto) {
    await this.prisma.user.update({
      where: { id },
      data: { displayName: dto.displayName.trim() },
    });
    return this.getProfile(id);
  }

  /// Completează data nașterii pentru conturile create înainte de age gate.
  ///
  /// Se poate seta **o singură dată**: altfel ar fi o cale de a ocoli
  /// restricțiile de minor, schimbând data ori de câte ori e nevoie. Un cont
  /// care a greșit-o trebuie corectat prin suport, nu de la sine.
  async setBirthDate(id: string, dto: SetBirthDateDto) {
    const now = new Date();
    const current = await this.prisma.user.findUniqueOrThrow({
      where: { id },
      select: { birthDate: true },
    });
    if (current.birthDate !== null) {
      throw new BadRequestException(
        'Data nașterii este deja stabilită și nu se poate schimba.',
      );
    }

    const birthDate = new Date(dto.birthDate);
    if (!isPlausibleBirthDate(birthDate, now)) {
      throw new BadRequestException('Data nașterii nu este validă.');
    }
    if (isBelowMinimumAge(birthDate, now)) {
      throw new BadRequestException(
        `Trebuie să ai cel puțin ${MINIMUM_AGE_YEARS} ani pentru a folosi contul.`,
      );
    }

    await this.prisma.user.update({ where: { id }, data: { birthDate } });
    return this.getProfile(id);
  }

  /// Handle-ul e identificatorul public: se schimbă rar, ca să nu devină o
  /// unealtă de a scăpa de reputație sau de a impersona pe cineva.
  async updateUsername(id: string, dto: UpdateUsernameDto) {
    const now = new Date();
    const current = await this.prisma.user.findUniqueOrThrow({
      where: { id },
      select: { username: true, usernameChangedAt: true },
    });
    const username = dto.username.trim();

    if (username === current.username) {
      throw new BadRequestException('Acesta este deja numele tău.');
    }
    if (!canChangeUsername(current.usernameChangedAt, now)) {
      const availableAt = usernameChangeAvailableAt(
        current.usernameChangedAt,
        now,
      );
      throw new BadRequestException(
        `Numele se poate schimba o dată la ${USERNAME_CHANGE_COOLDOWN_DAYS} de zile. ` +
          `Următoarea schimbare e disponibilă la ${availableAt?.toISOString()}.`,
      );
    }

    const taken = await this.prisma.user.findUnique({
      where: { username },
      select: { id: true },
    });
    if (taken) {
      throw new ConflictException('Numele de utilizator este deja luat.');
    }

    await this.prisma.user.update({
      where: { id },
      data: { username, usernameChangedAt: now },
    });
    return this.getProfile(id);
  }
}
