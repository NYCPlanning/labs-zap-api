import { Module } from '@nestjs/common';
import { AuthService } from './auth.service';
import { ConfigModule } from '../config/config.module';
import { ContactModule } from '../contact/contact.module';

@Module({
  imports: [
    ConfigModule,
    ContactModule,
  ],
  providers: [AuthService],
  exports: [AuthService],
})
export class AuthModule {}
