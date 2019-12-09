import { Injectable } from '@nestjs/common';
import { Cron, Interval, Timeout, NestSchedule } from 'nest-schedule';
import { ProjectService } from './project.service';

@Injectable() // Only support SINGLETON scope
export class ScheduleService extends NestSchedule {
  constructor(
    private projectService: ProjectService
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
}
