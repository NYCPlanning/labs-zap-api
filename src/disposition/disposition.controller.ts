import {
  Controller,
  Patch,
  Body,
  Req,
  Res,
  Param,
  Session,
  HttpException,
  HttpStatus,
  Post
} from '@nestjs/common';
import { Deserializer } from 'jsonapi-serializer';
import { pick } from 'underscore';
import { InjectRepository } from '@nestjs/typeorm';
import { Repository } from 'typeorm';
import { Disposition } from './disposition.entity';
import { ConfigService } from '../config/config.service';
import { Request } from 'express';
import { OdataService } from '../odata/odata.service';
import { CRMWebAPI } from '../_utils/crm-web-api';

// Only attrs in the whitelist get posted
const ATTRS_WHITELIST = [
  'dcp_publichearinglocation',
  'dcp_dateofpublichearing',
  'dcp_nameofpersoncompletingthisform',
  'dcp_title',
  'dcp_dateofvote',
  'dcp_votelocation',

  // the sum of the other vote types must be equal to the
  // number in this column:
  'dcp_totalmembersappointedtotheboard',
  'dcp_wasaquorumpresent',
  'dcp_boroughboardrecommendation',
  'dcp_communityboardrecommendation',
  'dcp_boroughpresidentrecommendation',
  'dcp_votingagainstrecommendation',
  'dcp_votinginfavorrecommendation',
  'dcp_votingabstainingonrecommendation',
  'dcp_consideration',
  'dcp_datereceived',

  // these are computed from the
  // other values on the model
  'statuscode',
  'statecode',
];
const { deserialize } = new Deserializer({
  keyForAttribute: 'underscore_case',
});

// todo: auth (decorator)
// auth that user is assigned to dispo
@Controller('dispositions')
export class DispositionController {
  constructor(
    @InjectRepository(Disposition)
    private readonly dispositionRepository: Repository<Disposition>,
    private readonly dynamicsWebApi:OdataService,
    private readonly config: ConfigService,
  ) {}

  @Patch('/:id')
  async update(@Body() body, @Param('id') id, @Session() session) {
    if (!session) throw new HttpException('Unauthorized', HttpStatus.UNAUTHORIZED);

    const { contactid } = session;
    const attributes = await deserialize(body);
    const whitelistedAttrs = pick(attributes, ATTRS_WHITELIST);

    // todo: throw error for non whitelisted keys
    // update CRM first
    // then, update the database
    try {
      const { dcp_recommendationsubmittedby } = await this.dispositionRepository.findOneOrFail(id);

      // check that the person updating the disposition is the person who submitted the dispo
      // also check if it's imposter_id enabled
      if ((dcp_recommendationsubmittedby !== contactid) && !this.config.get('CRM_IMPOSTER_ID')) {
        throw new Error('Not authorized to edit this record.');
      }

      await this.dynamicsWebApi.update('dcp_communityboarddispositions', id, whitelistedAttrs);
      await this.dispositionRepository.update(id, whitelistedAttrs);
    } catch (e) {
      const message = await e; 
      console.log(message);

      throw new HttpException({
        errors: [message],
      }, 400);
    }

    return body;
  }

  // Not yet a fully fleshed out endpoint. It hardcodes the project
  // for which to create a disposition
  @Post('/')
  async index(@Req() request: Request, @Res() response, @Session() session) {
    if (!session) throw new HttpException('Unauthorized', HttpStatus.UNAUTHORIZED); 

    const {
      body: {
        ulurpNumber,
        participant,
      },
    } = request;

    const headers = {
      MSCRMCallerID: this.config.get('CRM_ADMIN_SERVICE_USER')
    };

    let resp = await CRMWebAPI.create('dcp_communityboarddispositions', {
      // replace the fake project id here with a real project ID for testing
      "dcp_project@odata.bind": "/dcp_projects(12a12345-b123-c123-d123-123e1234567f)",
      "dcp_name": "test - test - test",
      "dcp_ulurpnumber": "123456"
    }, headers);

    response.status(200).send({"message": "Success creating a disposition"});
  }
}
