import { Injectable } from '@nestjs/common';
import { ConfigService } from '../config/config.service';
import { ADAL } from '../_utils/adal';
import { CRMWebAPI } from '../_utils/crm-web-api';

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

  update(entityName, guid, data, headers = {}) {
    return CRMWebAPI.update(entityName, guid, data, headers);
  }

  async get(entityName, guid): Promise<[]> {
    const { value } = await CRMWebAPI.get(`${entityName}(${guid})`);

    return value;
  }

  async filter(entityName, operators): Promise<[]> {
    const { value } = await CRMWebAPI.get(`${entityName}?$filter=${operators}`);

    return value;
  }
}
