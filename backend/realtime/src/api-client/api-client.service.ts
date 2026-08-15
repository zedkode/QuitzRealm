import { BadGatewayException, Injectable } from '@nestjs/common';
import { ConfigService } from '@nestjs/config';
import {
  AccountCapabilities,
  GlobalChatContext,
  InternalQuestion,
  PersistMatchPayload,
  StoredChatMessage,
} from '../game/game.types';

/// Refuz venit din API cu un motiv pe care jucătorul trebuie să-l vadă.
/// Se deosebește de o defecțiune: un mesaj respins pentru că ești mut nu e o
/// eroare de server și n-are ce căuta în loguri ca atare.
export class ChatRejectedError extends Error {
  constructor(
    message: string,
    readonly status: number,
  ) {
    super(message);
    this.name = 'ChatRejectedError';
  }
}

@Injectable()
export class ApiClientService {
  private readonly baseUrl: string;
  private readonly internalApiKey: string;

  constructor(config: ConfigService) {
    this.baseUrl = config.getOrThrow<string>('API_BASE_URL').replace(/\/$/, '');
    this.internalApiKey = config.getOrThrow<string>('INTERNAL_API_KEY');
  }

  async getRandomQuestion(): Promise<InternalQuestion> {
    const response = await fetch(
      `${this.baseUrl}/questions/internal/random?language=ro&limit=1`,
      {
        headers: { 'x-internal-api-key': this.internalApiKey },
        signal: AbortSignal.timeout(5_000),
      },
    );
    if (!response.ok) {
      throw new BadGatewayException(
        `API-ul de întrebări a răspuns cu ${response.status}.`,
      );
    }
    const question: unknown = await response.json();
    if (!this.isInternalQuestion(question)) {
      throw new BadGatewayException('API-ul a returnat o întrebare invalidă.');
    }
    return question;
  }

  /// Capabilitățile contului, citite proaspăt din API la fiecare intrare în
  /// coadă. Nu le luăm din tokenul de acces: acela trăiește 15 minute, deci un
  /// jucător care tocmai și-a confirmat emailul ar mai aștepta degeaba.
  async getCapabilities(userId: string): Promise<AccountCapabilities> {
    const response = await fetch(
      `${this.baseUrl}/users/internal/${encodeURIComponent(userId)}/capabilities`,
      {
        headers: { 'x-internal-api-key': this.internalApiKey },
        signal: AbortSignal.timeout(5_000),
      },
    );
    if (!response.ok) {
      throw new BadGatewayException(
        `API-ul de conturi a răspuns cu ${response.status}.`,
      );
    }
    const capabilities: unknown = await response.json();
    if (
      !capabilities ||
      typeof capabilities !== 'object' ||
      typeof (capabilities as AccountCapabilities).canPlayRanked !== 'boolean'
    ) {
      throw new BadGatewayException('API-ul a returnat capabilități invalide.');
    }
    return capabilities as AccountCapabilities;
  }

  /// Contextul de chat global: treaptă, mut activ și lista de blocări. Se
  /// citește din API, sursa de adevăr — realtime nu atinge baza de date.
  async getGlobalChatContext(userId: string): Promise<GlobalChatContext> {
    return this.getJson<GlobalChatContext>(
      `/chat/internal/${encodeURIComponent(userId)}/global-context`,
      (value) => typeof (value as GlobalChatContext).globalChat === 'string',
    );
  }

  async getFriendIds(userId: string): Promise<string[]> {
    const payload = await this.getJson<{ friendIds: string[] }>(
      `/friends/internal/${encodeURIComponent(userId)}/ids`,
      (value) => Array.isArray((value as { friendIds: unknown }).friendIds),
    );
    return payload.friendIds;
  }

  /// Trimite un mesaj persistent prin API, ca să treacă prin exact aceleași
  /// verificări ca ruta REST. Realtime doar difuzează ce a fost acceptat.
  async sendChatMessage(payload: {
    senderId: string;
    conversationId: string;
    content: string;
  }): Promise<StoredChatMessage> {
    const response = await fetch(`${this.baseUrl}/chat/internal/messages`, {
      method: 'POST',
      headers: {
        'content-type': 'application/json',
        'x-internal-api-key': this.internalApiKey,
      },
      body: JSON.stringify(payload),
      signal: AbortSignal.timeout(5_000),
    });
    if (!response.ok) {
      // Motivul refuzului vine de la API (mut, blocare, treaptă prea mică) și
      // trebuie să ajungă la jucător, nu înlocuit cu „eroare de server”.
      const body = (await response.json().catch(() => null)) as {
        message?: string | string[];
      } | null;
      const message = Array.isArray(body?.message)
        ? body.message.join(' ')
        : (body?.message ?? 'Mesajul nu a putut fi trimis.');
      throw new ChatRejectedError(message, response.status);
    }
    return (await response.json()) as StoredChatMessage;
  }

  async persistMatch(payload: PersistMatchPayload): Promise<void> {
    const response = await fetch(`${this.baseUrl}/matches/results`, {
      method: 'POST',
      headers: {
        'content-type': 'application/json',
        'x-internal-api-key': this.internalApiKey,
      },
      body: JSON.stringify(payload),
      signal: AbortSignal.timeout(5_000),
    });
    if (!response.ok) {
      throw new BadGatewayException(
        `Persistarea partidei a eșuat cu status ${response.status}.`,
      );
    }
  }

  private async getJson<T>(
    path: string,
    isValid: (value: unknown) => boolean,
  ): Promise<T> {
    const response = await fetch(`${this.baseUrl}${path}`, {
      headers: { 'x-internal-api-key': this.internalApiKey },
      signal: AbortSignal.timeout(5_000),
    });
    if (!response.ok) {
      throw new BadGatewayException(`API-ul a răspuns cu ${response.status}.`);
    }
    const payload: unknown = await response.json();
    if (!payload || typeof payload !== 'object' || !isValid(payload)) {
      throw new BadGatewayException('API-ul a returnat un răspuns invalid.');
    }
    return payload as T;
  }

  private isInternalQuestion(value: unknown): value is InternalQuestion {
    if (!value || typeof value !== 'object') {
      return false;
    }
    const question = value as Record<string, unknown>;
    const validType =
      question.type === 'MULTIPLE_CHOICE' || question.type === 'NUMERIC';
    const validOptions =
      question.options === null ||
      (Array.isArray(question.options) &&
        question.options.every((option) => typeof option === 'string'));
    const validShape =
      typeof question.id === 'string' &&
      validType &&
      typeof question.categoryId === 'string' &&
      typeof question.difficulty === 'number' &&
      typeof question.text === 'string' &&
      validOptions &&
      typeof question.correctAnswer === 'string' &&
      typeof question.language === 'string';
    if (!validShape) return false;
    if (question.type === 'MULTIPLE_CHOICE') {
      return (
        Array.isArray(question.options) &&
        question.options.length === 4 &&
        question.options.includes(question.correctAnswer)
      );
    }
    return (
      question.options === null &&
      Number.isFinite(Number(question.correctAnswer))
    );
  }
}
