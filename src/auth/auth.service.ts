import { Injectable } from '@nestjs/common';
import * as jwt from 'jsonwebtoken';
import { ConfigService } from '../config/config.service';
import { ContactService } from '../contact/contact.service';

@Injectable()
export class AuthService {
  constructor(
    private readonly config: ConfigService,
    private readonly contactService: ContactService,
  ) {}

  async handleLogin(token): Promise<string> {
    const secret = this.config.get('CRM_SIGNING_SECRET');

    // Development option to force return of a specific CRM ID
    const CRM_IMPOSTER_ID = this.config.get('CRM_IMPOSTER_ID');

    const { mail, exp } = this.validateNYCIDToken(token);
    let { contactid } = await this.contactService.findOne(CRM_IMPOSTER_ID || { emailaddress1: mail });

    // todo: handle these errors
    if (!contactid) {
      throw new Error(`No CRM Contact found for email ${mail}`);
    }

    return jwt.sign({ exp, contactid }, secret);
  }

  validateNYCIDToken(token): any {
    const secret = this.config.get('NYCID_CONSOLE_PASSWORD');

    return this.validateToken(token, secret);
  }

  validateCRMToken(token): any {
    const secret = this.config.get('CRM_SIGNING_SECRET');

    return this.validateToken(token, secret);
  }

  validateToken(token, secret): any {
    const CRM_IMPOSTER_ID = this.config.get('CRM_IMPOSTER_ID');

    if (this.config.get('SKIP_AUTH')) return {
      contactid: CRM_IMPOSTER_ID
    }

    try {
      return jwt.verify(token, secret);
    } catch (e) {
      console.log(e); // eslint-disable-line
      // throw new UnauthError(`Invalid NYCID token: ${e.message}`);
      throw new Error(`Invalid NYCID token: ${e.message}`);
    }
  }
}
