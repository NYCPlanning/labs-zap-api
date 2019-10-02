import { Module } from '@nestjs/common';
import { DispositionController } from './disposition.controller';

@Module({
  controllers: [DispositionController]
})
export class DispositionModule {}
