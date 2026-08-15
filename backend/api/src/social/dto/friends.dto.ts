import {
  IsBoolean,
  IsString,
  Matches,
  MaxLength,
  MinLength,
} from 'class-validator';

export class RequestFriendshipDto {
  /// Se caută după handle, nu după id: id-urile nu se cunosc din UI, iar o
  /// căutare după email ar transforma lista de prieteni într-un instrument de
  /// verificat ce adrese au cont.
  @IsString()
  @MinLength(3)
  @MaxLength(32)
  @Matches(/^[a-zA-Z0-9_]+$/, {
    message:
      'Numele poate conține doar litere, cifre și liniuță de subliniere.',
  })
  username!: string;
}

export class RespondFriendshipDto {
  @IsBoolean()
  accept!: boolean;
}
