import { Injectable } from '@nestjs/common';
import { InjectRepository } from '@nestjs/typeorm';
import { Repository } from 'typeorm';
import pLimit from 'p-limit';
import { Project } from '../project.entity';
import { upsertGeoms, IUpsertGeomsResult } from '../_utils/upsert-geoms';
import { ConfigService } from '../../config/config.service';

const GEOM_UPSERT_CONCURRENCY_LIMIT = 1;
const getProjectsSQL = `
  SELECT
    d.dcp_name
  FROM
    dcp_projectmilestone as mm
  LEFT JOIN
    dcp_project AS d
  ON
    mm.dcp_project = d.dcp_projectid
  WHERE mm.dcp_milestone = '663beec4-dad0-e711-8116-1458d04e2fb8'
    AND d.dcp_name NOT IN (SELECT projectid FROM project_geoms)
    AND d.dcp_visibility = 'General Public'
    AND d.dcp_projectid IN (
      SELECT DISTINCT dcp_project
      FROM dcp_projectbbl
      WHERE statuscode = 'Active'
      AND modifiedon > (NOW() - interval '360 days')
    )
  `;

@Injectable()
export class GeometriesService {
  constructor(
    @InjectRepository(Project)
    private readonly projectRepository: Repository<Project>,
    private readonly config: ConfigService
  ) {}

  validateAPIKey(key) {
    const USER_API_KEY = this.config.get('USER_API_KEY');

    return USER_API_KEY === key;
  }

  // regex match for project id with zero or one 'P', four numbers,
  // 1 letter, and four numbers
  validateProjectID(id: string) {
    return id.match(/^P?[0-9]{4}[A-Z]{1}[0-9]{4}$/);
  }

  async batchUpsertGeoms(ids) {
    const limit = pLimit(GEOM_UPSERT_CONCURRENCY_LIMIT);

    return Promise.all<IUpsertGeomsResult>(ids.map(id => limit(() => this.upsertGeoms(id))));
  }

  async upsertGeoms(id) {
    const repository = this.projectRepository;

    return upsertGeoms(id, repository);
  }

  async synchronizeGeoms() {
    const projects = await this.projectRepository.query(getProjectsSQL);
    const projectIDs = projects.map(d => d.dcp_name);

    console.log(`Found ${projects.length} projects`);

    const responseTemplate = {
      success: 0,
      failure: 0,
      failureMessages: [],
      error: 0,
      errorMessages: [],
      status: 200,
    }

    // this needs to be rate-limited
    const responses = await this.batchUpsertGeoms(projectIDs);

    return responses.reduce((acc, response) => {
      try {
        if (response.status === 'failure') {
          acc.failureMessages.push(response.message)
        }
      } catch (e) {
        console.log(e); // eslint-disable-line
        acc.errorMessages.push(e.toString());
      } finally {
        acc.success = projects.length - acc.errorMessages.length - acc.failureMessages.length;
        acc.failure = acc.failureMessages.length;
        acc.error = acc.errorMessages.length;
        acc.status = acc.errorMessages.length > 0 ? 500 : 200;

        return acc;
      }
    }, responseTemplate);
  }
}
