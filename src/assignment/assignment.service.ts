import { Injectable } from '@nestjs/common';
import { OdataService, overwriteCodesWithLabels } from '../odata/odata.service';
import { 
  extractMeta,
  coerceToNumber,
  coerceToDateString,
  mapInLookup,
  all,
  any,
  comparisonOperator,
  containsString,
  equalsAnyOf,
  containsAnyOf 
} from '../odata/odata.module';

const FIELD_LABEL_REPLACEMENT_WHITELIST = [
  'dcp_publicstatus',
  'dcp_borough',
  'statuscode',
  'dcp_ulurp_nonulurp',
  '_dcp_keyword_value',
  'dcp_ceqrtype',
  'dcp_applicantrole',
  '_dcp_applicant_customer_value',
  '_dcp_recommendationsubmittedby_value',
  'dcp_communityboardrecommendation',
  'dcp_boroughpresidentrecommendation',
  'dcp_boroughboardrecommendation',
  'dcp_representing',
  '_dcp_milestone_value',
  '_dcp_applicant_customer_value',
  '_dcp_applicantadministrator_customer_value',
  '_dcp_action_value',
  '_dcp_zoningresolution_value',
];

@Injectable()
export class AssignmentService {
  constructor(
    private readonly dynamicsWebApi: OdataService
  ) {}

  async getAssignments(contactid, tab) {
    const queryObject = generateQueryObject({ contactid, tab });
    const { records: projects } = await this.dynamicsWebApi
      .queryFromObject('dcp_projects', queryObject);

    // structure:
    //
    // project {
    //   actions
    //   milestones
    //   dispositions (all)
    // }
    // milestones
    // dispositions (for user)


    return transformAssignments(projects);
  }
}

// munge projects into user assignments
function transformAssignments(projects) {
  projects.forEach(assignment => {
    const {
      dcp_dcp_project_dcp_projectmilestone_project,
      dcp_dcp_project_dcp_communityboarddisposition_project,
    } = assignment;

    assignment.milestones = overwriteCodesWithLabels(
      dcp_dcp_project_dcp_projectmilestone_project,
      FIELD_LABEL_REPLACEMENT_WHITELIST,
    );
    assignment.dispositions = overwriteCodesWithLabels(
      dcp_dcp_project_dcp_communityboarddisposition_project,
      FIELD_LABEL_REPLACEMENT_WHITELIST,
    );
  });

  const valueMappedProjects = overwriteCodesWithLabels(
    projects,
    FIELD_LABEL_REPLACEMENT_WHITELIST,
  );

  return valueMappedProjects;
}

function generateQueryObject(query) {
  const { tab, contactid } = query;

  return {
    $count: true,
    $filter: `
      dcp_dcp_project_dcp_communityboarddisposition_project/any(o:o/_dcp_recommendationsubmittedby_value eq ${contactid})
      and dcp_dcp_project_dcp_communityboarddisposition_project/any(o:o/statuscode eq 1)
      and dcp_dcp_project_dcp_projectlupteam_project/any(o:o/statuscode eq 1)
    `,
    $expand: `
      dcp_dcp_project_dcp_communityboarddisposition_project($filter=_dcp_recommendationsubmittedby_value eq ${contactid} ),
      dcp_dcp_project_dcp_projectmilestone_project,dcp_dcp_project_dcp_projectaction_project,
      dcp_dcp_project_dcp_projectbbl_project
    `,
  };
}
