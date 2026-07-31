import { Module } from '@nestjs/common';
import { AutoUpdatePhoneNumberUseCase, KEY_QUEUE } from './auto-update-phone-number-usecase';
import { HttpModule } from '@nestjs/axios';
import { ProxyRepositoryModule } from '@infrastructure/repositories/proxy-repository';
import { BullModule } from '@nestjs/bull';

@Module({
  imports: [
    HttpModule,
    ProxyRepositoryModule,
    BullModule.registerQueue({
      name: KEY_QUEUE.COMMENT,
    }),
  ],
  providers: [AutoUpdatePhoneNumberUseCase],
  exports: [AutoUpdatePhoneNumberUseCase],
})
export class AutoUpdatePhoneNumberUseCaseModule {}
