import { RedisModule } from '@infrastructure/redis/redis.module';
import { Module } from '@nestjs/common';
import { ProxyRepository } from './proxy-repository';

@Module({
  imports: [RedisModule],
  providers: [ProxyRepository],
  exports: [ProxyRepository],
})
export class ProxyRepositoryModule {}
