import { Module } from '@nestjs/common';
import { TypeOrmModule } from '@nestjs/typeorm';
import { Project } from './project.entity';
import { ScheduleService } from './project.schedule';
import { ProjectController } from './project.controller';
import { ProjectService } from './project.service';
import { ConfigModule } from '../config/config.module';
import { OdataModule } from '../odata/odata.module';
import { TilesService } from './tiles/tiles.service';
import { TilesModule } from './tiles/tiles.module';
import { GeometriesModule } from './geometries/geometries.module';

@Module({
  imports: [
  	TypeOrmModule.forFeature([Project]),
  	OdataModule,
  	ConfigModule,
  	TilesModule,
  	GeometriesModule,
  ],
  controllers: [ProjectController],
  providers: [ProjectService, ScheduleService]
})
export class ProjectModule {}
