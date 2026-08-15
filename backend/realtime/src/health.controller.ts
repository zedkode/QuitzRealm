import { Controller, Get } from '@nestjs/common';
import { RedisService } from './redis/redis.service';

@Controller('health')
export class HealthController {
  constructor(private readonly redis: RedisService) {}

  @Get()
  async getHealth(): Promise<{ status: 'ok'; redis: 'up' }> {
    await this.redis.client.ping();
    return { status: 'ok', redis: 'up' };
  }
}
