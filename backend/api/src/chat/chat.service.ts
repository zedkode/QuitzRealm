import {
  BadRequestException,
  ForbiddenException,
  Injectable,
  NotFoundException,
} from '@nestjs/common';
import {
  ConversationType,
  DmPermission,
  MessageScope,
  OnlineVisibility,
  Prisma,
  ProfileVisibility,
} from '@prisma/client';
import { capabilitiesFor } from '../auth/account-policy';
import { PrismaService } from '../prisma/prisma.service';
import { FriendsService } from '../social/friends.service';
import { detectSpam, filterMessage } from './content-filter';
import {
  ChatPermissions,
  TRUST_TIER_KEYS,
  TRUST_TIER_THRESHOLDS,
  chatPermissionsFor,
} from './trust-tier';

/// Cât ține mutul automat pus de detecția de spam. Scurt intenționat: e o
/// frână, nu o pedeapsă — pedepsele vin din moderare, după raport.
const AUTO_MUTE_MINUTES = 10;

/// Câte mesaje recente ale aceluiași expeditor intră în fereastra de spam.
const SPAM_WINDOW_SIZE = 8;
const SPAM_WINDOW_MS = 30_000;

export interface SendMessageResult {
  id: string;
  conversationId: string;
  scope: MessageScope;
  senderId: string;
  content: string;
  createdAt: Date;
  /// Cui trebuie livrat mesajul în timp real (fără expeditor).
  recipientIds: string[];
}

const publicUser = {
  id: true,
  username: true,
  displayName: true,
} satisfies Prisma.UserSelect;

@Injectable()
export class ChatService {
  constructor(
    private readonly prisma: PrismaService,
    private readonly friends: FriendsService,
  ) {}

  // --- Treaptă de încredere (§2.5) ---

  /// Ce poate face contul în chat, plus progresul spre treapta următoare.
  /// Aplicația afișează progresul, dar nu-l calculează: pragurile stau aici.
  async permissionsFor(userId: string): Promise<
    ChatPermissions & {
      tierKey: string;
      thresholds: readonly number[];
      mutedUntil: Date | null;
    }
  > {
    const user = await this.prisma.user.findUniqueOrThrow({
      where: { id: userId },
      select: {
        correctAnswers: true,
        emailVerifiedAt: true,
        birthDate: true,
        chatMutedUntil: true,
      },
    });
    const capabilities = capabilitiesFor({
      emailVerifiedAt: user.emailVerifiedAt,
      birthDate: user.birthDate,
      now: new Date(),
    });
    const permissions = chatPermissionsFor({
      correctAnswers: user.correctAnswers,
      isMinor: capabilities.isMinor,
      emailVerified: capabilities.emailVerified,
    });
    return {
      ...permissions,
      tierKey: TRUST_TIER_KEYS[permissions.tier],
      thresholds: TRUST_TIER_THRESHOLDS,
      mutedUntil: this.activeMute(user.chatMutedUntil),
    };
  }

  // --- Confidențialitate (§2.4) ---

  /// Toate setările de confidențialitate ale contului, nu doar cele de chat:
  /// §2.4 și §4.9 le cer în același tabel, iar restricția de minor trebuie
  /// aplicată într-un singur loc, altfel al doilea apelant ar putea s-o uite.
  async getPrivacy(userId: string) {
    const settings = await this.prisma.userPrivacySettings.findUnique({
      where: { userId },
    });
    const capabilities = await this.capabilitiesOf(userId);
    return {
      dmPermission: capabilities.dmPermissionLocked
        ? DmPermission.FRIENDS_ONLY
        : (settings?.dmPermission ?? DmPermission.FRIENDS_ONLY),
      profileVisibility:
        settings?.profileVisibility ?? ProfileVisibility.PUBLIC,
      onlineVisibility: settings?.onlineVisibility ?? OnlineVisibility.FRIENDS,
      allowMatchInvites: settings?.allowMatchInvites ?? true,
      chatCensorship: settings?.chatCensorship ?? true,
      chatNotifications: settings?.chatNotifications ?? true,
      /// Minorii nu pot ridica restricția; aplicația trebuie să afișeze
      /// setarea ca blocată, nu s-o ascundă.
      dmPermissionLocked: capabilities.dmPermissionLocked,
    };
  }

  async updatePrivacy(
    userId: string,
    dto: {
      dmPermission?: DmPermission;
      profileVisibility?: ProfileVisibility;
      onlineVisibility?: OnlineVisibility;
      allowMatchInvites?: boolean;
      chatCensorship?: boolean;
      chatNotifications?: boolean;
    },
  ) {
    const capabilities = await this.capabilitiesOf(userId);
    if (
      capabilities.dmPermissionLocked &&
      dto.dmPermission !== undefined &&
      dto.dmPermission !== DmPermission.FRIENDS_ONLY
    ) {
      throw new ForbiddenException(
        'Conturile de minor primesc mesaje directe doar de la prieteni.',
      );
    }
    const data = {
      dmPermission: dto.dmPermission,
      profileVisibility: dto.profileVisibility,
      onlineVisibility: dto.onlineVisibility,
      allowMatchInvites: dto.allowMatchInvites,
      chatCensorship: dto.chatCensorship,
      chatNotifications: dto.chatNotifications,
    };
    await this.prisma.userPrivacySettings.upsert({
      where: { userId },
      create: { userId, ...data },
      update: data,
    });
    return this.getPrivacy(userId);
  }

  /// Dacă [viewerId] are voie să vadă profilul lui [ownerId] (§4.9).
  ///
  /// Proprietarul își vede întotdeauna propriul profil, oricât de închis l-ar
  /// fi setat: altfel și-ar pierde accesul la propriile setări.
  async canViewProfile(viewerId: string | null, ownerId: string) {
    if (viewerId === ownerId) return true;

    const settings = await this.prisma.userPrivacySettings.findUnique({
      where: { userId: ownerId },
      select: { profileVisibility: true },
    });
    const visibility = settings?.profileVisibility ?? ProfileVisibility.PUBLIC;

    if (visibility === ProfileVisibility.PRIVATE) return false;
    if (visibility === ProfileVisibility.PUBLIC) return true;
    if (viewerId === null) return false;
    return this.friends.areFriends(viewerId, ownerId);
  }

  // --- Conversații (§2.3, §2.4) ---

  async listConversations(userId: string) {
    const rows = await this.prisma.conversation.findMany({
      where: { participants: { some: { userId } } },
      include: {
        participants: { include: { user: { select: publicUser } } },
        messages: { orderBy: { createdAt: 'desc' }, take: 1 },
      },
      orderBy: [{ lastMessageAt: 'desc' }, { createdAt: 'desc' }],
      take: 100,
    });

    const blocked = new Set(
      (await this.friends.listBlocked(userId)).map((entry) => entry.userId),
    );
    return (
      rows
        .map((row) => {
          const other = row.participants.find(
            (participant) => participant.userId !== userId,
          );
          const mine = row.participants.find(
            (participant) => participant.userId === userId,
          );
          const last = row.messages[0];
          return {
            id: row.id,
            type: row.type,
            otherUserId: other?.user.id ?? '',
            otherUsername: other?.user.username ?? '',
            otherDisplayName:
              other?.user.displayName ?? other?.user.username ?? '',
            lastMessageAt: row.lastMessageAt,
            lastMessagePreview: last?.content ?? null,
            unread:
              last !== undefined &&
              last.senderId !== userId &&
              (mine?.lastReadAt === null ||
                (mine?.lastReadAt ?? new Date(0)) < last.createdAt),
          };
        })
        // Conversațiile cu cineva blocat dispar din listă: blocarea trebuie să
        // însemne „nu-l mai văd”, nu doar „nu-mi mai scrie”.
        .filter((entry) => !blocked.has(entry.otherUserId))
    );
  }

  /// Deschide (sau găsește) conversația 1:1 cu un alt jucător.
  ///
  /// Tipul nu e ales de client: prietenii primesc `FRIEND`, restul o cerere de
  /// mesaj. Altfel oricine ar putea sări peste coada de cereri declarându-se
  /// prieten.
  async openConversation(userId: string, otherId: string) {
    if (userId === otherId) {
      throw new BadRequestException('Nu poți deschide o conversație cu tine.');
    }
    const other = await this.prisma.user.findUnique({
      where: { id: otherId },
      select: publicUser,
    });
    if (!other) throw new NotFoundException('Jucătorul nu există.');
    if (await this.friends.isBlockedEitherWay(userId, otherId)) {
      throw new ForbiddenException('Conversația nu poate fi deschisă.');
    }

    const existing = await this.findDirectConversation(userId, otherId);
    if (existing) return this.describeConversation(existing.id, userId);

    const areFriends = await this.friends.areFriends(userId, otherId);
    if (!areFriends) {
      await this.assertCanInitiateDm(userId, otherId);
    }

    const created = await this.prisma.conversation.create({
      data: {
        type: areFriends
          ? ConversationType.FRIEND
          : ConversationType.DM_REQUEST,
        participants: {
          create: [{ userId }, { userId: otherId }],
        },
      },
    });
    return this.describeConversation(created.id, userId);
  }

  /// Destinatarul acceptă cererea de mesaj; abia atunci firul devine o
  /// conversație normală (§2.4).
  async acceptDmRequest(userId: string, conversationId: string) {
    const conversation = await this.requireParticipation(
      userId,
      conversationId,
    );
    if (conversation.type !== ConversationType.DM_REQUEST) {
      throw new BadRequestException('Conversația nu e o cerere de mesaj.');
    }
    // Cel care a deschis firul nu și-l poate accepta singur.
    const firstMessage = await this.prisma.message.findFirst({
      where: { conversationId },
      orderBy: { createdAt: 'asc' },
      select: { senderId: true },
    });
    if (firstMessage?.senderId === userId) {
      throw new ForbiddenException('Cererea trebuie acceptată de destinatar.');
    }
    await this.prisma.conversation.update({
      where: { id: conversationId },
      data: { type: ConversationType.DM_ACCEPTED },
    });
    return this.describeConversation(conversationId, userId);
  }

  async messages(
    userId: string,
    conversationId: string,
    options: { before?: Date; limit?: number } = {},
  ) {
    await this.requireParticipation(userId, conversationId);
    const limit = Math.min(Math.max(options.limit ?? 50, 1), 100);
    const rows = await this.prisma.message.findMany({
      where: {
        conversationId,
        ...(options.before ? { createdAt: { lt: options.before } } : {}),
      },
      orderBy: { createdAt: 'desc' },
      take: limit,
      include: { sender: { select: publicUser } },
    });
    await this.prisma.conversationParticipant.update({
      where: { conversationId_userId: { conversationId, userId } },
      data: { lastReadAt: new Date() },
    });
    return rows.reverse().map((row) => ({
      id: row.id,
      conversationId: row.conversationId,
      senderId: row.senderId,
      senderUsername: row.sender.username,
      senderDisplayName: row.sender.displayName ?? row.sender.username,
      content: row.content,
      createdAt: row.createdAt,
      flagged: row.flagged,
    }));
  }

  /// Trimite un mesaj într-o conversație persistentă.
  ///
  /// Toate verificările stau aici, nu în client: apartenența la conversație,
  /// mutul, blocarea, treapta de încredere pentru linkuri, filtrul de limbaj
  /// și detecția de spam.
  async sendMessage(
    userId: string,
    conversationId: string,
    rawContent: string,
  ): Promise<SendMessageResult> {
    const content = rawContent.trim();
    if (content.length === 0) {
      throw new BadRequestException('Mesajul este gol.');
    }
    if (content.length > 1000) {
      throw new BadRequestException('Mesajul e prea lung.');
    }

    const conversation = await this.requireParticipation(
      userId,
      conversationId,
    );
    const otherIds = conversation.participants
      .map((participant) => participant.userId)
      .filter((id) => id !== userId);

    await this.assertNotMuted(userId);
    for (const otherId of otherIds) {
      if (await this.friends.isBlockedEitherWay(userId, otherId)) {
        throw new ForbiddenException('Mesajul nu poate fi trimis.');
      }
    }

    const permissions = await this.permissionsFor(userId);
    const filtered = filterMessage(content);
    const isFriendScope = conversation.type === ConversationType.FRIEND;
    if (filtered.linkCount > 0) {
      const allowed = isFriendScope
        ? permissions.canPostLinksToFriends
        : permissions.canPostLinksInGlobal;
      if (!allowed) {
        throw new ForbiddenException(
          'Linkurile se deblochează la o treaptă de încredere mai mare.',
        );
      }
    }

    // O cerere de mesaj neacceptată primește un singur mesaj: coada de cereri
    // n-are voie să devină un canal de hărțuire cu firul închis.
    if (conversation.type === ConversationType.DM_REQUEST) {
      const alreadySent = await this.prisma.message.count({
        where: { conversationId, senderId: userId },
      });
      if (alreadySent >= 1) {
        throw new ForbiddenException(
          'Așteaptă ca destinatarul să accepte cererea de mesaj.',
        );
      }
    }

    await this.applySpamGuard(userId, content);

    const stored = await this.prisma.$transaction(async (transaction) => {
      const message = await transaction.message.create({
        data: {
          conversationId,
          scope: isFriendScope ? MessageScope.FRIEND : MessageScope.DM,
          senderId: userId,
          content: filtered.sanitized,
          flagged: filtered.hasProfanity,
        },
      });
      await transaction.conversation.update({
        where: { id: conversationId },
        data: { lastMessageAt: message.createdAt },
      });
      return message;
    });

    return {
      id: stored.id,
      conversationId,
      scope: stored.scope,
      senderId: userId,
      content: stored.content,
      createdAt: stored.createdAt,
      recipientIds: otherIds,
    };
  }

  // --- Raportare (§2.6) ---

  async report(
    userId: string,
    dto: {
      reportedUserId: string;
      reason: string;
      scope: string;
      messageId?: string;
      contentSnapshot?: string;
    },
  ) {
    if (dto.reportedUserId === userId) {
      throw new BadRequestException('Nu te poți raporta pe tine.');
    }
    let snapshot = dto.contentSnapshot?.slice(0, 1000) ?? '';
    let messageId: string | undefined;

    if (dto.messageId) {
      // Mesajul trebuie să fie unul pe care raportorul chiar l-a putut vedea.
      const message = await this.prisma.message.findFirst({
        where: {
          id: dto.messageId,
          conversation: { participants: { some: { userId } } },
        },
        select: { id: true, content: true, senderId: true },
      });
      if (!message) throw new NotFoundException('Mesajul nu există.');
      if (message.senderId !== dto.reportedUserId) {
        throw new BadRequestException(
          'Mesajul nu aparține jucătorului raportat.',
        );
      }
      messageId = message.id;
      // Conținutul se copiază: dacă mesajul dispare, raportul rămâne cu dovada.
      snapshot = message.content;
    }
    if (snapshot.length === 0) {
      throw new BadRequestException('Raportul are nevoie de conținut.');
    }

    const permissions = await this.permissionsFor(userId);
    const report = await this.prisma.chatReport.create({
      data: {
        messageId,
        reporterId: userId,
        reportedUserId: dto.reportedUserId,
        contentSnapshot: snapshot,
        scope: dto.scope.slice(0, 20),
        reason: dto.reason.slice(0, 500),
        // Rapoartele din context privat urcă în coadă: hărțuirea în DM e mai
        // greu de observat din afară decât cea din chatul public.
        priority:
          (dto.scope === 'dm' || dto.scope === 'friend' ? 5 : 0) +
          permissions.reportWeight,
      },
    });
    return { id: report.id, createdAt: report.createdAt };
  }

  // --- Ajutoare ---

  /// Sursa de adevăr pentru realtime: tot ce trebuie știut înainte de a lăsa
  /// un mesaj global să plece.
  async globalChatContext(userId: string) {
    const permissions = await this.permissionsFor(userId);
    // Numele afisat vine de aici, nu din tokenul de acces: se poate schimba
    // liber, iar un token de 15 minute ar arata numele vechi in chat.
    const user = await this.prisma.user.findUniqueOrThrow({
      where: { id: userId },
      select: publicUser,
    });
    const blocked = await this.prisma.userBlock.findMany({
      where: { OR: [{ blockerId: userId }, { blockedId: userId }] },
      select: { blockerId: true, blockedId: true },
    });
    return {
      displayName: user.displayName ?? user.username,
      globalChat: permissions.globalChat,
      canPostLinksInGlobal: permissions.canPostLinksInGlobal,
      tier: permissions.tier,
      mutedUntil: permissions.mutedUntil,
      /// Perechile blocate, în ambele sensuri: realtime nu livrează între ele.
      blockedUserIds: [
        ...new Set(
          blocked.map((row) =>
            row.blockerId === userId ? row.blockedId : row.blockerId,
          ),
        ),
      ],
    };
  }

  /// Contorul care alimentează treptele de încredere. Se incrementează la
  /// finalul unei partide, din `backend/realtime`, cu răspunsurile validate
  /// server-side — niciodată raportate de client (§2.5).
  async recordCorrectAnswers(
    entries: readonly { userId: string; correctAnswers: number }[],
  ): Promise<void> {
    await this.prisma.$transaction(
      entries
        .filter((entry) => entry.correctAnswers > 0)
        .map((entry) =>
          this.prisma.user.update({
            where: { id: entry.userId },
            data: { correctAnswers: { increment: entry.correctAnswers } },
          }),
        ),
    );
  }

  private async capabilitiesOf(userId: string) {
    const user = await this.prisma.user.findUniqueOrThrow({
      where: { id: userId },
      select: { emailVerifiedAt: true, birthDate: true },
    });
    return capabilitiesFor({ ...user, now: new Date() });
  }

  private activeMute(mutedUntil: Date | null): Date | null {
    if (mutedUntil === null) return null;
    return mutedUntil.getTime() > Date.now() ? mutedUntil : null;
  }

  private async assertNotMuted(userId: string): Promise<void> {
    const user = await this.prisma.user.findUniqueOrThrow({
      where: { id: userId },
      select: { chatMutedUntil: true },
    });
    const mute = this.activeMute(user.chatMutedUntil);
    if (mute) {
      throw new ForbiddenException(
        `Chatul îți este restricționat până la ${mute.toISOString()}.`,
      );
    }
  }

  private async assertCanInitiateDm(
    userId: string,
    otherId: string,
  ): Promise<void> {
    const permissions = await this.permissionsFor(userId);
    if (!permissions.canInitiateDm) {
      throw new ForbiddenException(
        'Mesajele directe către necunoscuți se deblochează la treapta T2.',
      );
    }
    const target = await this.getPrivacy(otherId);
    if (target.dmPermission === DmPermission.NOBODY) {
      throw new ForbiddenException('Jucătorul nu primește mesaje directe.');
    }
    if (target.dmPermission === DmPermission.FRIENDS_ONLY) {
      throw new ForbiddenException(
        'Jucătorul primește mesaje directe doar de la prieteni.',
      );
    }
  }

  /// Mut automat la spam. Contorul se citește din mesajele recente, nu dintr-o
  /// stare în memorie: două instanțe de API trebuie să vadă același istoric.
  private async applySpamGuard(userId: string, content: string): Promise<void> {
    const recent = await this.prisma.message.findMany({
      where: {
        senderId: userId,
        createdAt: { gt: new Date(Date.now() - SPAM_WINDOW_MS) },
      },
      orderBy: { createdAt: 'desc' },
      take: SPAM_WINDOW_SIZE,
      select: { content: true },
    });
    const verdict = detectSpam({
      message: content,
      recentMessages: recent.map((row) => row.content),
      windowLimit: SPAM_WINDOW_SIZE,
    });
    if (!verdict.isSpam) return;

    const until = new Date(Date.now() + AUTO_MUTE_MINUTES * 60_000);
    await this.prisma.user.update({
      where: { id: userId },
      data: { chatMutedUntil: until },
    });
    throw new ForbiddenException(
      `Mesajele repetate ți-au oprit chatul până la ${until.toISOString()}.`,
    );
  }

  private async findDirectConversation(userId: string, otherId: string) {
    return this.prisma.conversation.findFirst({
      where: {
        AND: [
          { participants: { some: { userId } } },
          { participants: { some: { userId: otherId } } },
        ],
      },
      select: { id: true },
    });
  }

  private async requireParticipation(userId: string, conversationId: string) {
    const conversation = await this.prisma.conversation.findFirst({
      where: { id: conversationId, participants: { some: { userId } } },
      include: { participants: { select: { userId: true } } },
    });
    if (!conversation) {
      // Aceeași eroare și când conversația nu există, și când nu e a noastră:
      // altfel s-ar putea afla ce id-uri sunt valide.
      throw new NotFoundException('Conversația nu există.');
    }
    return conversation;
  }

  private async describeConversation(conversationId: string, userId: string) {
    const row = await this.prisma.conversation.findUniqueOrThrow({
      where: { id: conversationId },
      include: { participants: { include: { user: { select: publicUser } } } },
    });
    const other = row.participants.find(
      (participant) => participant.userId !== userId,
    );
    return {
      id: row.id,
      type: row.type,
      otherUserId: other?.user.id ?? '',
      otherUsername: other?.user.username ?? '',
      otherDisplayName: other?.user.displayName ?? other?.user.username ?? '',
      lastMessageAt: row.lastMessageAt,
    };
  }
}
