import { Module } from '@nestjs/common';
import { ConfigModule } from '../config/config.module';
import { ContactService } from './contact.service';
import { OdataModule } from '../odata/odata.module';
import { Repository } from 'typeorm';

@Module({
  imports: [
    ConfigModule,
    OdataModule,
  ],
  providers: [ContactService],
  exports: [ContactService],
})
export class ContactModule {}
