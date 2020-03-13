import { Injectable } from '@nestjs/common';
import { ORequest } from 'odata';
import { ConfigService } from '../config/config.service';
import { ADAL } from '../_utils/adal';
import { CRMWebAPI } from '../_utils/crm-web-api';

const COMMUNITY_DISPLAY_TOKEN = '@OData.Community.Display.V1.FormattedValue';

@Injectable()
export class OdataService {
  constructor(
    private readonly config:ConfigService
  ) {
    ADAL.ADAL_CONFIG = {
      CRMUrl: this.config.get('CRM_HOST'),
      webAPIurl: this.config.get('CRM_URL_PATH'),
      clientId: this.config.get('CLIENT_ID'),
      clientSecret: this.config.get('CLIENT_SECRET'),
      tenantId: this.config.get('TENANT_ID'),
      authorityHostUrl: this.config.get('AUTHORITY_HOST_URL'),
      tokenPath: this.config.get('TOKEN_PATH'),
    };

    CRMWebAPI.webAPIurl = this.config.get('CRM_URL_PATH');
    CRMWebAPI.CRMUrl = this.config.get('CRM_HOST');
  }

  async query(entity: string, query: string, ...options) {
    const response = await CRMWebAPI.get(`${entity}?${query}`, ...options);
    const {
      value: records,
      '@odata.nextLink': nextPage = '',
      '@odata.count': count,
    } = response;
    console.log(query);
    const valueMappedRecords = this.mapValues(records);

    return {
      count,
      skipTokenParams: nextPage.split('?')[1],
      records: valueMappedRecords,
    }
  }

  async queryFromObject(entity: string, query: any, ...options) {
    const queryStringForEntity = this.serializeToQueryString(query);

    return await this.query(entity, queryStringForEntity, ...options);
  }

  update(model, guid, data, headers = {}) {
    if (!this.config.get('SKIP_CRM')) {
      return CRMWebAPI.update(model, guid, data, headers);
    }

    return data;
  }

  mapValues(records) {
    return records.map(record => {
      const newRecord = record;

      // parent record
      Object.keys(record)
        .filter(key => key.includes('_formatted'))
        .map(key => key.replace('_formatted', ''))
        .forEach(key => {
          newRecord[key] = record[`${key}_formatted`];
        });

      // child records
      // etag here is used to filter for entities
      // we need keys whos values are arrays
      const values = Object.entries(record)
        .filter(([, value]) => Array.isArray(value))
        .forEach(([, collection]) => {
          // @ts-ignore
          collection.map(record => {
            const newRecord = record;

            // parent record
            Object.keys(record)
              .filter(key => key.includes(COMMUNITY_DISPLAY_TOKEN))
              .map(key => key.replace(COMMUNITY_DISPLAY_TOKEN, ''))
              .forEach(key => {
                newRecord[key] = record[`${key}${COMMUNITY_DISPLAY_TOKEN}`];
              });
           });
        });

      return newRecord;
    });
  }

  serializeToQueryString(query: any) {
    const truthyKeyedObject = Object.keys(query).reduce((acc, curr) => {
      if (query[curr]) {
        acc[curr] = query[curr];
      }

      return acc;
    }, {})

    const oDataReq = new ORequest(this.config.get('CRM_HOST'), {});
    oDataReq.applyQuery(truthyKeyedObject);

    const { url: { search } } = oDataReq;

    return search.split('?')[1];
  }
}
