import { LoadResource } from '@application/auto-update-phone-number/auto-update-phone-number-usecase';
import {
  ProxyEntity,
  ProxyStatus,
  ProxyType,
} from '@domain/entities/proxy.entity';
import { RedisService } from '@infrastructure/redis/redis.service';
import { Injectable } from '@nestjs/common';
import { Cron, CronExpression } from '@nestjs/schedule';
import { InjectRepository } from '@nestjs/typeorm';
import { Repository } from 'typeorm';

@Injectable()
export class ProxyRepository {
  proxies: ProxyEntity[] = [];
  constructor(
    private readonly redisService: RedisService,
  ) {}
}
