import { BadGatewayException, Injectable } from '@nestjs/common';
import { ConfigService } from '@nestjs/config';
import {
  AccountCapabilities,
  GlobalChatContext,
  InternalQuestion,
  PersistMatchPayload,
  QuestionBankMetadata,
  QuestionSelection,
  QuestionSelectionRequest,
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

export interface LocalizedApiErrorPayload {
  code: string;
  messageKey: string;
  params: Record<string, unknown>;
}

export class QuestionBankApiError extends Error {
  constructor(
    readonly status: number,
    readonly payload: LocalizedApiErrorPayload,
  ) {
    super(payload.code);
    this.name = 'QuestionBankApiError';
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

  /// `categoryCodes` gol înseamnă „toate categoriile” — exact ca bifa „Toate”
  /// din aplicație.
  async getRandomQuestion(
    request: QuestionSelectionRequest,
  ): Promise<QuestionSelection> {
    const query = new URLSearchParams({
      requestedLanguageIsoCode: request.requestedLanguageIsoCode,
      countryCode: request.countryCode,
    });
    if (request.categoryCodes && request.categoryCodes.length > 0) {
      query.set('categoryCodes', request.categoryCodes.join(','));
    }
    if (request.difficulty !== undefined) {
      query.set('difficulty', String(request.difficulty));
    }
    const response = await fetch(
      `${this.baseUrl}/questions/internal/random?${query.toString()}`,
      {
        headers: { 'x-internal-api-key': this.internalApiKey },
        signal: AbortSignal.timeout(5_000),
      },
    );
    if (!response.ok) {
      throw await this.toQuestionBankApiError(
        response,
        `API-ul de întrebări a răspuns cu ${response.status}.`,
      );
    }
    const selection: unknown = await response.json();
    if (!this.isQuestionSelection(selection)) {
      throw new BadGatewayException(
        'API-ul a returnat o selecție de întrebare invalidă.',
      );
    }
    return selection;
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
    if (!this.isAccountCapabilities(capabilities)) {
      throw new BadGatewayException('API-ul a returnat capabilități invalide.');
    }
    return capabilities;
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
      typeof question.languageIsoCode === 'string';
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

  private isQuestionSelection(value: unknown): value is QuestionSelection {
    if (!value || typeof value !== 'object') return false;
    const selection = value as Record<string, unknown>;
    return (
      this.isInternalQuestion(selection.question) &&
      this.isQuestionBankMetadata(selection.bank)
    );
  }

  private isQuestionBankMetadata(
    value: unknown,
  ): value is QuestionBankMetadata {
    if (!value || typeof value !== 'object' || Array.isArray(value)) {
      return false;
    }
    const bank = value as Record<string, unknown>;
    const nullableString = (candidate: unknown) =>
      candidate === null || typeof candidate === 'string';
    const stringArray = (candidate: unknown) =>
      candidate === undefined ||
      (Array.isArray(candidate) &&
        candidate.every((entry) => typeof entry === 'string'));
    return (
      typeof bank.requestedLanguageIsoCode === 'string' &&
      typeof bank.resolvedLanguageIsoCode === 'string' &&
      nullableString(bank.requestedCountryCode) &&
      nullableString(bank.resolvedCountryCode) &&
      typeof bank.fallbackApplied === 'boolean' &&
      nullableString(bank.messageKey) &&
      !!bank.params &&
      typeof bank.params === 'object' &&
      !Array.isArray(bank.params) &&
      Number.isInteger(bank.minimumApprovedPerCategory) &&
      (bank.minimumApprovedPerCategory as number) >= 1 &&
      stringArray(bank.requestedCategoryCodes) &&
      stringArray(bank.resolvedCategoryCodes)
    );
  }

  private isAccountCapabilities(
    value: unknown,
  ): value is AccountCapabilities {
    if (!value || typeof value !== 'object' || Array.isArray(value)) {
      return false;
    }
    const capabilities = value as Record<string, unknown>;
    const booleans = [
      'emailVerified',
      'isMinor',
      'canPlayRanked',
      'canUseGlobalChat',
      'canPostExternalLinks',
      'dmPermissionLocked',
    ];
    return (
      booleans.every((key) => typeof capabilities[key] === 'boolean') &&
      (capabilities.languageIsoCode === null ||
        typeof capabilities.languageIsoCode === 'string') &&
      (capabilities.countryCode === null ||
        typeof capabilities.countryCode === 'string')
    );
  }

  private async toQuestionBankApiError(
    response: Response,
    transportContext: string,
  ): Promise<QuestionBankApiError | BadGatewayException> {
    const body: unknown = await response.json().catch(() => null);
    return this.isLocalizedApiError(body)
      ? new QuestionBankApiError(response.status, body)
      : new BadGatewayException(transportContext);
  }

  private isLocalizedApiError(
    value: unknown,
  ): value is LocalizedApiErrorPayload {
    if (!value || typeof value !== 'object' || Array.isArray(value)) {
      return false;
    }
    const payload = value as Record<string, unknown>;
    return (
      typeof payload.code === 'string' &&
      typeof payload.messageKey === 'string' &&
      !!payload.params &&
      typeof payload.params === 'object' &&
      !Array.isArray(payload.params)
    );
  }
}
