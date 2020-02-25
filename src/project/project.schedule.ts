import { Injectable } from '@nestjs/common';
import { Cron, Interval, Timeout, NestSchedule } from 'nest-schedule';
import { ProjectService } from './project.service';
import { GeometriesService } from './geometries/geometries.service';

@Injectable() // Only support SINGLETON scope
export class ScheduleService extends NestSchedule {
  constructor(
    private projectService: ProjectService,
    private geometryService: GeometriesService
  ) {
    super();
  }

  @Cron('*/1 * * * *', {
    startTime: new Date(),
  })
  async refreshMaterializedView() {
    try {
      await this.projectService.refreshMaterializedView();
    } catch(e) {
      throw new Error(e);
    }
  }

  // Refresh every 20 minutes
  @Cron('*/20 * * * *', {
    startTime: new Date(),
  })
  async refreshGeoms() {
    try {
      console.log('Refreshing geometries...');

      await this.geometryService.synchronizeGeoms();
    } catch(e) {
      throw new Error(e);
    }
  }
}
