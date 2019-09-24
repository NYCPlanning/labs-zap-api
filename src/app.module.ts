import { Module } from '@nestjs/common';
import { AppService } from './app.service';
import { ConfigModule } from './config/config.module';
import { ConfigService } from './config/config.service';
import { TypeOrmModule } from '@nestjs/typeorm';
import { ProjectModule } from './project/project.module';
import { TilesModule } from './project/tiles/tiles.module';

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
  providers: [AppService],
})
export class AppModule {}
