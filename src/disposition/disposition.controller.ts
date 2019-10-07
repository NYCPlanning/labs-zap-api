import {
  Controller,
  Patch,
  Body,
  Req,
  Param,
} from '@nestjs/common';
import { Deserializer } from 'jsonapi-serializer';
import { pick } from 'underscore';
import { OdataService } from '../odata/odata.service';

// Only attrs in the whitelist get posted
const ATTRS_WHITELIST = [
  'dcp_publichearinglocation',
  'dcp_dateofpublichearing',
];
const { deserialize } = new Deserializer({
  keyForAttribute: 'underscore_case',
});

@Controller('dispositions')
export class DispositionController {
  constructor(
    private readonly dynamicsWebApi:OdataService
  ) {}

  @Patch('/:id')
  async update(@Body() body, @Param('id') id) {
    const attributes = await deserialize(body);
    const whitelistedAttrs = pick(attributes, ATTRS_WHITELIST);

    await this.dynamicsWebApi.update('dcp_communityboarddispositions', id, whitelistedAttrs);

    return body;
  }
}
