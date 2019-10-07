import {
  Controller,
  Patch,
  Body,
  Req,
} from '@nestjs/common';
import { Deserializer } from 'jsonapi-serializer';
import { OdataService } from '../odata/odata.service';

const ATTR_WHITELIST = ['dcp_dateofpublichearing']
const { deserialize } = new Deserializer({
  keyForAttribute: 'underscore_case',
});

@Controller('dispositions')
export class DispositionController {
  constructor(
    private readonly dynamicsWebApi:OdataService
  ) {}

  @Patch('/:id')
  async update(@Body() body) {
    const { data: { id } } = body;
    const attributes = {
      dcp_dateofpublichearing: '2019-10-09T17:01:00.000Z',
    };

    console.log(await deserialize(body));

    // await this.dynamicsWebApi.update('dcp_communityboarddispositions', id, attributes);

    return body;
  }
}
