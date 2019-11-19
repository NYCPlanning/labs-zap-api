import { Module } from '@nestjs/common';
import { ConfigModule } from '../config/config.module';
import { DownloadController } from './download.controller';

@Module({
  imports: [
    ConfigModule,
  ],
  controllers: [DownloadController]
})
export class DownloadModule {}
