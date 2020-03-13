import * as pgp from 'pg-promise';
import { Injectable } from '@nestjs/common';
import { InjectRepository } from '@nestjs/typeorm';
import { Repository } from 'typeorm';
import { Serializer } from 'jsonapi-serializer';
import { Query } from '@nestjs/common';
import { paginate, Pagination, IPaginationOptions } from 'nestjs-typeorm-paginate';
import { Request } from 'express';
import { getVideoLinks } from './_utils/get-video-links';
import { injectSupportDocumentURLs } from './_utils/inject-supporting-document-urls';
import { bbox, buffer, point } from '@turf/turf';
import { ConfigService } from '../config/config.service';
import { TilesService } from './tiles/tiles.service';
import { getQueryFile } from '../_utils/get-query-file';
import { handleDownload } from './_utils/handle-download';
import { buildProjectsSQL } from './_utils/build-projects-sql';
import { Project, KEYS as PROJECT_KEYS, ACTION_KEYS, MILESTONE_KEYS } from './project.entity';
import { KEYS as DISPOSITION_KEYS } from '../disposition/disposition.entity';
import { Octokit } from '@octokit/rest';
import { OdataService } from '../odata/odata.service';
import * as jwt from 'jsonwebtoken';

const ITEMS_PER_PAGE = 30;
// we use jwt to easily provide a stringified representation
// of the skip token provided by MS OData Web API
const SKIP_TOKEN_KEY = 'micro$oft';

const BOROUGH_LOOKUP = {
  Bronx: 717170000,
  Brooklyn: 717170002,
  Manhattan: 717170001,
  Queens: 717170003,
  Staten: 717170004,
  Citywide: 717170005,
};

const ULURP_LOOKUP = {
  'Non-ULURP': 717170000,
  'ULURP': 717170001,
};

const PROJECT_STATUS_LOOKUP = {
  Prefiled: 717170005,
  Filed: 717170000,
  'In Public Review': 717170001,
  Completed: 717170002,
  Unknown: null,
};

const PROJECT_VISIBILITY_LOOKUP = {
  'Applicant Only': 717170002,
  'CPC Only': 717170001,
  'General Public': 717170003,
  'Internal DCP Only': 717170000,
  'LUP': 717170004,
};

const DISPLAY_MILESTONE_IDS = [
  '683beec4-dad0-e711-8116-1458d04e2fb8',
  '6c3beec4-dad0-e711-8116-1458d04e2fb8',
  '743beec4-dad0-e711-8116-1458d04e2fb8',
  '783beec4-dad0-e711-8116-1458d04e2fb8',
  '7c3beec4-dad0-e711-8116-1458d04e2fb8',
  '7e3beec4-dad0-e711-8116-1458d04e2fb8',
  '823beec4-dad0-e711-8116-1458d04e2fb8',
  '843beec4-dad0-e711-8116-1458d04e2fb8',
  '863beec4-dad0-e711-8116-1458d04e2fb8',
  '8e3beec4-dad0-e711-8116-1458d04e2fb8',
  '923beec4-dad0-e711-8116-1458d04e2fb8',
  '943beec4-dad0-e711-8116-1458d04e2fb8',
  '963beec4-dad0-e711-8116-1458d04e2fb8',
  'a43beec4-dad0-e711-8116-1458d04e2fb8',
  '9e3beec4-dad0-e711-8116-1458d04e2fb8',
  'a63beec4-dad0-e711-8116-1458d04e2fb8',
  'a83beec4-dad0-e711-8116-1458d04e2fb8',
  'aa3beec4-dad0-e711-8116-1458d04e2fb8'
];

const DEFAULT_PROJECT_FIELDS = [
  'dcp_name',
  'dcp_applicanttype',
  'dcp_borough',
  'dcp_ceqrnumber',
  'dcp_ceqrtype',
  'dcp_certifiedreferred',
  'dcp_femafloodzonea',
  'dcp_femafloodzonecoastala', 
  'dcp_femafloodzoneshadedx',
  'dcp_femafloodzonev',
  'dcp_sisubdivision',
  'dcp_sischoolseat', 
  'dcp_projectbrief',
  'dcp_projectname',
  'dcp_publicstatus',
  'dcp_projectcompleted', 
  'dcp_hiddenprojectmetrictarget',
  'dcp_ulurp_nonulurp',
  'dcp_communitydistrict', 
  'dcp_communitydistricts',
  'dcp_validatedcommunitydistricts',
  'dcp_bsanumber',
  'dcp_wrpnumber',
  'dcp_lpcnumber',
  'dcp_name',
  'dcp_nydospermitnumber',
  'dcp_lastmilestonedate'
];

const findProjectQuery = getQueryFile('/projects/show.sql');
const boundingBoxQuery = getQueryFile('helpers/bounding-box-query.sql');

function extractMeta(projects = []) {
  const [{ total_projects: total = 0 } = {}] = projects;
  const { length: pageTotal = 0 } = projects;

  return { total, pageTotal };
}

function extractSkipToken(skipTokenParams): any {
  return jwt.verify(skipTokenParams, SKIP_TOKEN_KEY);
}

function signSkipToken(skipTokenParams): any {
  return jwt.sign(skipTokenParams, SKIP_TOKEN_KEY);
}

function coerceToNumber(numericStrings) {
  return numericStrings.map(stringish => {
    // smelly; but let's prefer actual null
    if (stringish === null) return stringish;

    return Number(stringish);
  });
}

function coerceToDateString(epoch) {
  return new Date(epoch * 1000);
}

function mapInLookup(arrayOfStrings, lookupHash) {
  return arrayOfStrings.map(string => lookupHash[string]);
}

function all(...statements): string {
  return statements
    .filter(Boolean)
    .join(' and ');
}

function any(...statements): string {
  return `(${(statements.join(' or '))})`;
}

function comparisonOperator(propertyName, operator, value) {
  // Reason for this: the printed form of any value must honor
  // a syntax close to JSON. For example, numbers are not quoted
  // booleans not quoted, but strings are. However, ORM API deals
  // single quotes, not double. JSON stringify gets us most of the
  // way there, but we have to replace double quote with single.
  const typeSafeValue = JSON
    .stringify(value)
    .replace(/"/g, "'");

  return `(${propertyName} ${operator} ${typeSafeValue})`;
}

function containsString(propertyName, string) {
  return `contains(${propertyName}, '${string}')`;
}

function equalsAnyOf(propertyName, strings = []) {
  const querySegment = strings
    .map(string => comparisonOperator(propertyName, 'eq', string))
    .join(' or ');

  return `(${querySegment})`;
}

function containsAnyOf(propertyName, strings = [], options?) {
  const {
    childEntity = '',
    comparisonStrategy = containsString,
    not = false,
  } = options || {};

  const containsQuery = strings
    .map((string, i) => {
      // in odata syntax, this character o is a variable for scoping
      // logic for related entities. it needs to only appear once.
      const lambdaScope = (childEntity && i === 0) ? `${childEntity}:` : '';
      const lambdaScopedProperty = childEntity ? `${childEntity}/${propertyName}` : propertyName;

      return `${lambdaScope}${comparisonStrategy(lambdaScopedProperty, string)}`;
    })
    .join(' or ');
  const lambdaQueryPrefix = childEntity ? `${childEntity}/any` : '';

  return `(${not ? 'not ': ''}${lambdaQueryPrefix}(${containsQuery}))`;
}

@Injectable()
export class ProjectService {
  constructor(
    @InjectRepository(Project)
    private readonly projectRepository: Repository<Project>,
    private readonly dynamicsWebApi: OdataService,
    private readonly config: ConfigService,
    private readonly tiles: TilesService,
  ) {}

  async findOneByName(name: string): Promise<Project> {
    const MILESTONES_FILTER = any(
      comparisonOperator('statuscode', 'eq', 717170001),
      containsAnyOf('_dcp_milestone_value', DISPLAY_MILESTONE_IDS, {
        comparisonStrategy: (prop, val) => comparisonOperator(prop, 'eq', val),
      })
    );

    const EXPANSIONS = [
      `dcp_dcp_project_dcp_projectmilestone_project($filter=${MILESTONES_FILTER})`,
      'dcp_dcp_project_dcp_projectaction_project',
      'dcp_dcp_project_dcp_projectbbl_project($select=dcp_name)',
      'dcp_dcp_project_dcp_projectkeywords_project($select=dcp_name)',
      'dcp_dcp_project_dcp_projectapplicant_Project($select=dcp_name)',
    ];
    const { records: [project] } = await this.dynamicsWebApi
      .queryFromObject('dcp_projects', {
        $filter: comparisonOperator('dcp_name', 'eq', name),
        $expand: EXPANSIONS.join(','),
      }, 1);

    project.milestones = project.dcp_dcp_project_dcp_projectmilestone_project;
    project.actions = project.dcp_dcp_project_dcp_projectaction_project;

    // This could possibly be a carto lookup based on 
    // projectbbl
    // project.bbl_featurecollection = {
    //   type: 'FeatureCollection',
    //   features: [{
    //     type: 'Feature',
    //     geometry: JSON.parse(project.bbl_multipolygon),
    //   }],
    // };

    // await injectSupportDocumentURLs(project);

    // project.video_links = await getVideoLinks(this.config.get('AIRTABLE_API_KEY'), project.dcp_name);

    return this.serialize(project);
  }

  async queryProjects(query, type = 'filter') {
    const ALLOWED_FILTERS = [
      'community-districts',
      'action-types',
      'boroughs',
      'dcp_ceqrtype', // is this even used? 'Type I', 'Type II', 'Unlisted', 'Unknown'
      'dcp_ulurp_nonulurp', // 'ULURP', 'Non-ULURP'
      'dcp_femafloodzonev',
      'dcp_femafloodzonecoastala',
      'dcp_femafloodzonea',
      'dcp_femafloodzoneshadedx',
      'dcp_publicstatus', // 'Prefiled', 'Filed', 'In Public Review', 'Completed', 'Unknown'
      'dcp_certifiedreferred',
      'project_applicant_text',
      'block', // not sure this gets used

      // not implemented yet
      'distance_from_point',
      'radius_from_point'
    ];

    // EXTRACT META PARAM VALUES;
    const {
      // meta: pagination
      skipTokenParams = '',
    } = query;

    // configure received params, provide procedures for generating queries.
    // these funcs do not get called unless they are in the query params.
    // could these become a first class object?
    const QUERY_TEMPLATES = {
      'community-districts': (queryParamValue) =>
        containsAnyOf('dcp_communitydistricts', queryParamValue),

      'action-types': (queryParamValue) =>
        containsAnyOf('dcp_name', queryParamValue, {
          childEntity: 'dcp_dcp_project_dcp_projectaction_project' 
        }),

      boroughs: (queryParamValue) =>
        equalsAnyOf('dcp_borough', coerceToNumber(mapInLookup(queryParamValue, BOROUGH_LOOKUP))),

      dcp_ulurp_nonulurp: (queryParamValue) =>
        equalsAnyOf('dcp_ulurp_nonulurp', coerceToNumber(mapInLookup(queryParamValue, ULURP_LOOKUP))),

      dcp_femafloodzonev: (queryParamValue) =>
        comparisonOperator('dcp_femafloodzonev', 'eq', queryParamValue),

      dcp_femafloodzonecoastala: (queryParamValue) =>
        comparisonOperator('dcp_femafloodzonecoastala', 'eq', queryParamValue),

      dcp_femafloodzonea: (queryParamValue) =>
        comparisonOperator('dcp_femafloodzonea', 'eq', queryParamValue),

      dcp_femafloodzoneshadedx: (queryParamValue) =>
        comparisonOperator('dcp_femafloodzoneshadedx', 'eq', queryParamValue),

      dcp_publicstatus: (queryParamValue) =>
        equalsAnyOf('dcp_publicstatus', coerceToNumber(mapInLookup(queryParamValue, PROJECT_STATUS_LOOKUP))),

      dcp_certifiedreferred: (queryParamValue) =>
        all(
          comparisonOperator('dcp_certifiedreferred', 'gt', coerceToDateString(queryParamValue[0])),
          comparisonOperator('dcp_certifiedreferred', 'lt', coerceToDateString(queryParamValue[1])),
        ),

      project_applicant_text: (queryParamValue) =>
        any(
          containsString('dcp_projectbrief', queryParamValue),
          containsString('dcp_projectname', queryParamValue),
          containsString('dcp_ceqrnumber', queryParamValue),
          containsAnyOf('dcp_name', [queryParamValue], {
            childEntity: 'dcp_dcp_project_dcp_projectapplicant_Project' 
          }),
          containsAnyOf('dcp_ulurpnumber', [queryParamValue], {
            childEntity: 'dcp_dcp_project_dcp_projectaction_project' 
          }),

          // this is prohibitively slow... not sure we can use this.
          // for some reason, only dcp_name is reasonably query-able in terms of speed.
          containsAnyOf('dcp_name', [queryParamValue], {
            childEntity: 'dcp_dcp_project_dcp_projectbbl_project' 
          }),
        ),
    };

    // optional params
    // apply only those that appear in the query object
    const requestedFiltersQuery = Object.keys(query)
      .filter(key => ALLOWED_FILTERS.includes(key)) // filter is allowed
      .filter(key => QUERY_TEMPLATES[key]) // filter has query handler
      .map(key => QUERY_TEMPLATES[key](query[key]));

    // this needs to be configurable, maybe come from project entity
    const projectFields = DEFAULT_PROJECT_FIELDS.join(',');
    const queryObject = {
      $select: projectFields,
      $count: true,
      $orderby: 'dcp_lastmilestonedate desc,dcp_publicstatus asc',
      $filter: all(
        // defaults
        comparisonOperator('dcp_visibility', 'eq', PROJECT_VISIBILITY_LOOKUP['General Public']),

        // optional params
        ...requestedFiltersQuery,
      ),
    };

    // prefer the skip token which include original params
    const reponse = await (async () => {
      if (skipTokenParams) {
        return this.dynamicsWebApi
          .query('dcp_projects', extractSkipToken(skipTokenParams));
      } else {
        return this.dynamicsWebApi
          .queryFromObject('dcp_projects', queryObject, ITEMS_PER_PAGE);
      } 
    })();

    // Note: we can't use PROJECT_KEYS yet because they reference the materialized view
    const {
      records: projects,
      skipTokenParams: nextPageSkipTokenParams,
      count,
    } = reponse;

    return this.serialize(projects, {
      pageTotal: ITEMS_PER_PAGE,
      total: count,
      ...(nextPageSkipTokenParams ? { skipTokenParams: signSkipToken(nextPageSkipTokenParams) } : {}),
    });
  }

  async handleDownload(request, filetype) {
    const SQL = buildProjectsSQL(request, 'csv_download');
    const { data } = await this.queryProjects(request, 'download');

    const deserializedData = data.map(jsonApiRecord => ({ id: jsonApiRecord.id, ...jsonApiRecord.attributes }));

    return handleDownload(filetype, deserializedData);
  }

  // triggers an update to the normalized_projects view
  async refreshMaterializedView() {
    this.projectRepository.query('REFRESH MATERIALIZED VIEW normalized_projects;');
  }

  // Serializes an array of objects into a JSON:API document
  serialize(records, opts?: object): Serializer {
    const ProjectSerializer = new Serializer('projects', {
      id: 'dcp_name',
      attributes: PROJECT_KEYS,
      actions: {
        ref: 'dcp_projectactionid',
        attributes: ACTION_KEYS,
      },

      milestones: {
        ref: 'dcp_projectmilestoneid',
        attributes: MILESTONE_KEYS,
      },

      dispositions: {
        ref: 'id',
        attributes: DISPOSITION_KEYS,
      },

      meta: { ...opts },
    });

    return ProjectSerializer.serialize(records);
  }

  // A function for creating an issue on github based on user feedback sent from frontend `modal-controls` component
  // Users submit text on the modal stating where they think data is incorrect, which is posted to the backend.
  // Octokit creates an issue in our dcp-zap-data-feedback repository.
  // This function is run in an @Post in the project controller.
  async sendFeedbackToGithubIssue(projectid, projectname, text) {
    const octokit = new Octokit({
      auth: this.config.get('GITHUB_ACCESS_TOKEN'),
    });

    return await octokit.issues.create({
      owner: 'nycplanning',
      repo: 'dcp-zap-data-feedback',
      title: `Feedback about ${projectname}`,
      body: `Project ID: [${projectid}](https://zap.planning.nyc.gov/projects/${projectid})\nFeedback: ${text}`,
    });
  }
}
