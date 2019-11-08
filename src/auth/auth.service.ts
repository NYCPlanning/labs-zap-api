import {
  HttpException,
  HttpStatus,
  Injectable,
} from '@nestjs/common';
import * as jwt from 'jsonwebtoken';
import * as moment from 'moment';
import { ConfigService } from '../config/config.service';
import { ContactService } from '../contact/contact.service';

@Injectable()
export class AuthService {
  // required env variables
  CRM_SIGNING_SECRET = '';
  NYCID_CONSOLE_PASSWORD = '';

  // development environment features
  SKIP_AUTH = false;
  CRM_IMPOSTER_ID = '';

  constructor(
    private readonly config: ConfigService,
    private readonly contactService: ContactService,
  ) {
    this.CRM_SIGNING_SECRET = this.config.get('CRM_SIGNING_SECRET');
    this.NYCID_CONSOLE_PASSWORD = this.config.get('NYCID_CONSOLE_PASSWORD');

    this.SKIP_AUTH = this.config.get('SKIP_AUTH');
    this.CRM_IMPOSTER_ID = this.config.get('CRM_IMPOSTER_ID');
  }

  generateNewToken(NYCIDToken): Promise<string> | string {
    return this.handleLogin(NYCIDToken);
  }

  validateCurrentToken(token) {
    const { CRM_IMPOSTER_ID } = this;

    if (this.SKIP_AUTH) {
      console.log('Warning! SKIP_AUTH is set to true. Your app is unsecured!');

      return this.signNewToken(CRM_IMPOSTER_ID);
    }

    return this.validateCRMToken(token);
  }

  private async handleLogin(NYCIDToken): Promise<string> {
    const { mail, exp } = this.validateNYCIDToken(NYCIDToken);
    const { contactid } = await this.lookupContact(mail);

    return this.signNewToken(contactid, exp);
  }

  private async lookupContact(mail) {
    const { CRM_IMPOSTER_ID } = this;

    try {
      // prefer CRM_IMPOSTER_ID if it exists
      return this.contactService.findOne(CRM_IMPOSTER_ID || { emailaddress1: mail });
    } catch (e) {
      throw new HttpException(e, HttpStatus.UNAUTHORIZED);
    }
  }

  private validateNYCIDToken(token): any {
    const { NYCID_CONSOLE_PASSWORD } = this;

    return this.verifyToken(token, NYCID_CONSOLE_PASSWORD);
  }

  private validateCRMToken(token): any {
    const { CRM_SIGNING_SECRET } = this;

    return this.verifyToken(token, CRM_SIGNING_SECRET);
  }

  // these methods wrap jwt calls.
  private signNewToken(contactid, exp = moment().add(1, 'days')) {
    const { CRM_SIGNING_SECRET } = this;

    return jwt.sign({ contactid, exp }, CRM_SIGNING_SECRET);
  }

  private verifyToken(token, secret) {
    try {
      return jwt.verify(token, secret);
    } catch (e) {
      throw new HttpException(e, HttpStatus.UNAUTHORIZED);
    }
  }
}
