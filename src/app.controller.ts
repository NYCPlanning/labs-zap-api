import { Controller } from '@nestjs/common';
import { Get, Query, Res, Session, Next, HttpException } from '@nestjs/common';
import { Response } from 'express';
import { Serializer } from 'jsonapi-serializer';
import * as jwt from 'jsonwebtoken';
import { ConfigService } from './config/config.service';

import { AuthService } from './auth/auth.service';
import { ContactService } from './contact/contact.service';

function generateImposterToken(email, secret) {
  return jwt.sign({
    mail: email,
    exp: 1565932329 * 100,
  }, secret);
}

@Controller()
export class AppController {
  NYCID_CONSOLE_PASSWORD = '';

  constructor(
    private readonly authService: AuthService,
    private readonly contactService: ContactService,
    private readonly config: ConfigService,
  ) {
    this.NYCID_CONSOLE_PASSWORD = this.config.get('NYCID_CONSOLE_PASSWORD');
  }

  @Get('/')
  root() {
    return {};
  }

  @Get('/login')
  async login(
    @Res() res: Response,
    @Query('accessToken') NYCIDToken: string,
    @Query('imposterEmail') imposterEmail: string,
  ) {
    try {
      let ZAPToken = await this.authService.generateNewToken(NYCIDToken);

      // godmode feature:
      // if the real authentication step worked, generate a safe imposter token
      if (ZAPToken && imposterEmail) {
        console.log('Warning: imposterEmail used!');

        const imposterToken = generateImposterToken(imposterEmail, this.NYCID_CONSOLE_PASSWORD);

        ZAPToken = await this.authService.generateNewToken(imposterToken);
      }

      res.cookie('token', ZAPToken, { httpOnly: true })
        .send({ message: 'Login successful!' });
    } catch (e) {
      if (e instanceof HttpException) {
        res.status(401).send({ errors: [e] });
      } else {
        console.log(e);

        res.status(500).send({ errors: [e] });
      }
    }
  }

  @Get('/users')
  async getUser(@Session() session, @Res() res) {
    const { contactid } = session;

    if (!contactid) {
      res.status(401).send({
        errors: ['Authentication required for this route'],
      });

      return;
    } 

    try {
      const contact = await this.contactService.findOne(contactid);

      res.send(this.serialize(contact));
    } catch(e) {
      res.status(401).send({
        errors: ['CRM user not found. Authentication required for this route'],
      });
    }
  }

  // Serializes an array of objects into a JSON:API document
  serialize(records, opts?: object): Serializer {
    const UserSerializer = new Serializer('users', {
      attributes: ['contactid', 'emailaddress1'],
      id: 'contactid',
      meta: { ...opts },
    });

    return UserSerializer.serialize(records);
  }
}
