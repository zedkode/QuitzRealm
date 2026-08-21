import { Allow } from 'class-validator';

export class UpsertTranslationDto {
  @Allow()
  value!: unknown;
}
