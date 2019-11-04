import { Module, NestModule, MiddlewareConsumer } from '@nestjs/common';
import * as cookieparser from 'cookie-parser';
import { AuthMiddleware } from './auth.middleware';
import { ConfigModule } from './config/config.module';
import { ConfigService } from './config/config.service';
import { TypeOrmModule } from '@nestjs/typeorm';
import { ProjectModule } from './project/project.module';
import { TilesModule } from './project/tiles/tiles.module';
import { ContactService } from './contact/contact.service';
import { AppController } from './app.controller';
import { ContactModule } from './contact/contact.module';
import { AuthService } from './auth/auth.service';
import { AuthModule } from './auth/auth.module';
import { DispositionModule } from './disposition/disposition.module';
import { OdataModule } from './odata/odata.module';
import { AssignmentController } from './assignment/assignment.controller';
import { AssignmentModule } from './assignment/assignment.module';

@Module({
  imports: [
    ProjectModule,
    ContactModule,
    TypeOrmModule.forRootAsync({
      useFactory: (config: ConfigService) => ({
        type: 'postgres',
        url: config.get('DATABASE_URL'),
        entities: [__dirname + '/**/*.entity{.ts,.js}'],
        synchronize: false,
      }),
      imports: [ConfigModule],
      inject: [ConfigService],
    }),
    ConfigModule,
    AuthModule,
    DispositionModule,
    OdataModule,
    AssignmentModule,
   ],
  controllers: [AppController],
})
export class AppModule implements NestModule {
  configure(consumer: MiddlewareConsumer) {
    consumer
      .apply(cookieparser())
      .forRoutes('*');

    consumer
      .apply(AuthMiddleware)
      .forRoutes('*');
  }
}
