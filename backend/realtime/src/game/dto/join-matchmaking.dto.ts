import { Equals } from 'class-validator';

export class JoinMatchmakingDto {
  @Equals('duo')
  mode!: 'duo';
}
