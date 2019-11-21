import { 
  HttpException,
  HttpStatus,
  Injectable,
} from '@nestjs/common';
import { OdataService } from '../odata/odata.service';
import { InjectRepository } from '@nestjs/typeorm';
import { ConfigService } from '../config/config.service';

export function stringifyToOdataFilter(object = {}): string {
  return Object.keys(object)
    .map(key => `${key} eq \'${object[key]}\'`)
    .join('and');
}

@Injectable()
export class ContactService {
  constructor(
    private readonly odataService: OdataService,
    private readonly config: ConfigService,
  ) {}

  CRM_REST_NAME = 'contacts';

  async findOne(options: any): Promise<any> {
    let result;

    if (typeof options === 'string') {
      result = await this.odataService.get(this.CRM_REST_NAME, options);
    } else {
      result = await this.odataService.filter(this.CRM_REST_NAME, stringifyToOdataFilter(options));
    }

    if (!result.length) {
      throw new Error(`${this.CRM_REST_NAME} not found! ${options}`);
    }

    // return the first result arbitrarily.
    return result[0];
  }
}
