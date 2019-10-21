import * as pgp from 'pg-promise';
import { Controller, Get, Query, Session } from '@nestjs/common';
import { getConnection } from 'typeorm';
import { Serializer } from 'jsonapi-serializer';
import { getQueryFile } from '../_utils/get-query-file';

const userAssignmentsQuery = getQueryFile('/assignments/index.sql');

@Controller('assignments')
export class AssignmentController {
  @Get('/')
  async index(@Query() query, @Session() session) {
    const { contactid } = session;
    const { project_lup_status } = query;
    console.log(contactid);
    // we have different queries for LUPP things
    if (project_lup_status && contactid) {
      // one of 'archive', 'reviewed', 'to-review', 'upcoming'
      if (!['archive', 'reviewed', 'to-review', 'upcoming'].includes(project_lup_status)) {
        throw new Error('Must be one of archive, reviewed, to-review, upcoming');
      }

      const SQL = pgp.as.format(userAssignmentsQuery, {
        id: contactid,
        status: project_lup_status,
      });

      return this.serialize(await getConnection().query(SQL));
    }
  }

  // Serializes an array of objects into a JSON:API document
  serialize(records, opts?: object): Serializer {
    let [assignment] = (records.length ? records : [records]);
    const [disposition = {}] = assignment.dispositions || [];

    // This is wrong... the wrong approach.
    const AssignmentSerializer = new Serializer('assignments', {
      id: 'dcp_name',
      attributes: Object.keys(assignment),
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
