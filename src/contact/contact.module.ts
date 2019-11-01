import { Module } from '@nestjs/common';
import { TypeOrmModule } from '@nestjs/typeorm';
import { ConfigModule } from '../config/config.module';
import { ContactService } from './contact.service';
import { Contact } from './contact.entity';
import { getRepositoryToken } from '@nestjs/typeorm';
import { Repository } from 'typeorm';

@Module({
  imports: [
    TypeOrmModule.forFeature([Contact]),
    ConfigModule,
  ],
  providers: [
    ContactService,
    {
      // how you provide the injection token in a test instance
      provide: getRepositoryToken(Contact),
      // as a class value, Repository needs no generics
      useClass: Repository,
    },
  ],
  exports: [ContactService],
})
export class ContactModule {}
