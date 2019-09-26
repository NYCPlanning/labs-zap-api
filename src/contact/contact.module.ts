import { Module } from '@nestjs/common';
import { TypeOrmModule } from '@nestjs/typeorm';
import { ConfigModule } from '../config/config.module';
import { ContactService } from './contact.service';
import { Contact } from './contact.entity';

@Module({
  imports: [
    TypeOrmModule.forFeature([Contact]),
    ConfigModule,
  ],
  providers: [ContactService],
  exports: [ContactService],
})
export class ContactModule {}
