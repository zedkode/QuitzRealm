import {
  Controller,
  Get,
  Param,
  ParseUUIDPipe,
  UseGuards,
} from '@nestjs/common';
import { InternalApiKeyGuard } from '../common/guards/internal-api-key.guard';
import { UsersService } from './users.service';

/// Endpointuri pentru `backend/realtime`, nu pentru aplicație.
///
/// Controller separat de `UsersController` pentru că are altă poartă: cheie
/// internă, nu JWT de jucător. Amestecarea lor ar face ușor de scăpat un
/// endpoint intern în spatele gardianului greșit.
@Controller('users/internal')
@UseGuards(InternalApiKeyGuard)
export class UsersInternalController {
  constructor(private readonly users: UsersService) {}

  /// Sursa de adevăr pentru dreptul de a intra în coada ranked. Se citește la
  /// fiecare intrare în coadă, nu din tokenul de acces: altfel un jucător care
  /// tocmai și-a confirmat emailul ar aștepta până la 15 minute.
  @Get(':id/capabilities')
  getCapabilities(@Param('id', ParseUUIDPipe) id: string) {
    return this.users.getCapabilities(id);
  }
}
