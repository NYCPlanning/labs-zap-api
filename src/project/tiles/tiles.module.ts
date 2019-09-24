import { Module } from '@nestjs/common';
import { TypeOrmModule } from '@nestjs/typeorm';
import { Project } from '../project.entity';
import { TilesService } from './tiles.service';

@Module({
  imports: [TypeOrmModule.forFeature([Project])],
  exports: [TilesService],
  providers: [TilesService],
})
export class TilesModule {}
