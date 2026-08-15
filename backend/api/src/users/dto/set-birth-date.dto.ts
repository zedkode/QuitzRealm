import { IsDateString } from 'class-validator';

export class SetBirthDateDto {
  /// `YYYY-MM-DD`. Se poate seta o singură dată, pentru conturile create
  /// înainte de introducerea age gate-ului.
  @IsDateString({ strict: true })
  birthDate!: string;
}
