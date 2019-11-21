import { Module } from '@nestjs/common';
import { ConfigModule } from '../config/config.module';
import { OdataService } from './odata.service';

@Module({
  imports: [ConfigModule],
  providers: [OdataService],
  exports: [OdataService],
})
export class OdataModule {}
