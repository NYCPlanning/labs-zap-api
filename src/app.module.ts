import { Module } from '@nestjs/common';
import { AppService } from './app.service';
import { ConfigModule } from './config/config.module';
import { ConfigService } from './config/config.service';
import { TypeOrmModule } from '@nestjs/typeorm';
import { ProjectModule } from './project/project.module';
import { TileCacheService } from './tile-cache/tile-cache.service';

@Module({
  imports: [
    ProjectModule,
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
   ],
  providers: [AppService, TileCacheService],
})
export class AppModule {}
