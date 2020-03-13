import { Module } from '@nestjs/common';
import { ConfigModule } from '../config/config.module';
import { OdataService } from './odata.service';

@Module({
  imports: [ConfigModule],
  exports: [OdataService],
  providers: [OdataService],
})
export class OdataModule {}
