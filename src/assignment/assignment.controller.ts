import * as pgp from 'pg-promise';
import { Controller, Get, Query, Session } from '@nestjs/common';
import { getConnection } from 'typeorm';
import { Serializer } from 'jsonapi-serializer';
import { getQueryFile } from '../_utils/get-query-file';

const userAssignmentsQuery = getQueryFile('/assignments/index.sql');
const projectQuery = getQueryFile('/projects/project.sql');

@Controller('assignments')
export class AssignmentController {
  @Get('/')
  async index(@Query() query, @Session() session) {
    const { contactid } = session;
    const { tab = 'to-review' } = query;

    // we have different queries for LUPP things
    if (tab && contactid) {
      // one of 'archive', 'reviewed', 'to-review', 'upcoming'
      if (!['archive', 'reviewed', 'to-review', 'upcoming'].includes(tab)) {
        throw new Error('Must be one of archive, reviewed, to-review, upcoming');
      }

      const SQL = pgp.as.format(userAssignmentsQuery, {
        id: contactid,
        status: tab,
      });

      return this.serialize(await getConnection().query(SQL));
    }
  }

  // Serializes an array of objects into a JSON:API document
  serialize(records, opts?: object): Serializer {
    let [assignment] = (records.length ? records : [records]);
    const [milestone = {}] = assignment.milestones || [];
    const [disposition = {}] = assignment.dispositions || [];
    const { project = {} } = assignment || {};

    // This is wrong... the wrong approach.
    const AssignmentSerializer = new Serializer('assignments', {
      id: 'dcp_name',
      attributes: Object.keys(assignment),
      project: {
        ref: 'dcp_name',
        attributes: Object.keys(project),
      },
      ...(milestone ? {
        milestones: {
          ref(project, milestone) {
            return `${project.dcp_name}-${milestone.dcp_milestone}`;
          },
          attributes: Object.keys(milestone),
        },
      } : {}),
      ...(disposition ? {
        dispositions: {
          ref: 'id',
          attributes: Object.keys(disposition),
        },
      } : {}),
      meta: { ...opts },
    });

    return AssignmentSerializer.serialize(records);
  }
}
