import {
  Controller,
  Patch,
  Body,
  Req,
  Param,
  HttpException,
} from '@nestjs/common';
import { Deserializer } from 'jsonapi-serializer';
import { pick } from 'underscore';
import { InjectRepository } from '@nestjs/typeorm';
import { Repository } from 'typeorm';
import { Disposition } from './disposition.entity';
import { ConfigService } from '../config/config.service';
import { OdataService } from '../odata/odata.service';

// Only attrs in the whitelist get posted
const ATTRS_WHITELIST = [
  'dcp_publichearinglocation',
  'dcp_dateofpublichearing',
  'dcp_representing',
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
  async update(@Body() body, @Param('id') id) {
    const attributes = await deserialize(body);
    const whitelistedAttrs = pick(attributes, ATTRS_WHITELIST);

    // todo: throw error for non whitelisted keys
    // update CRM first
    // then, update the database
    try {
      await this.dynamicsWebApi.update('dcp_communityboarddispositions', id, whitelistedAttrs);

      if (!this.config.get('SKIP_PG')) {
        await this.dispositionRepository.update(id, whitelistedAttrs);
      }
    } catch (e) {
      const message = await e;

      throw new HttpException({
        errors: [message],
      }, 400);
    }

    return body;
  }
}
