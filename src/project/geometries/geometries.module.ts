import { Module } from '@nestjs/common';
import { TypeOrmModule } from '@nestjs/typeorm';
import { GeometriesService } from './geometries.service';
import { Project } from '../project.entity';
import { ConfigModule } from '../../config/config.module';

@Module({
  imports: [
    TypeOrmModule.forFeature([Project]),
    ConfigModule,
  ],
  providers: [GeometriesService],
  exports: [GeometriesService],
})
export class GeometriesModule {}
