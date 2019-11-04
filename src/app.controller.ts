import { Controller } from '@nestjs/common';
import { Get, Query, Res, Session, Next } from '@nestjs/common';
import { Response } from 'express';
import { Serializer } from 'jsonapi-serializer';
import { AuthService } from './auth/auth.service';
import { ContactService } from './contact/contact.service';

@Controller()
export class AppController {
  constructor(
    private readonly authService: AuthService,
    private readonly contactService: ContactService,
  ) {}

  @Get('/')
  root() {
    return {};
  }

  @Get('/login')
  async login(@Res() res: Response, @Query('accessToken') token: string) {
    try {
      const ZAPToken = await this.authService.handleLogin(token);

      res.cookie('token', ZAPToken, { httpOnly: true })
        .send({ message: 'Login successful!' });
    } catch (e) {
      res.status(401).send({ errors: e });
    }
  }

  @Get('/users')
  async getUser(@Session() session, @Res() res) {
    const { contactid } = session;
    const contact = await this.contactService.findOne(contactid);

    if (!contactid) {
      res.status(401).send({
        errors: ['Authentication required for this route'],
      });
    } else {
      res.send(this.serialize(contact));
    }
  }

  // Serializes an array of objects into a JSON:API document
  serialize(records, opts?: object): Serializer {
    const ProjectSerializer = new Serializer('users', {
      attributes: ['contactid', 'emailaddress1'],
      id: 'contactid',
      meta: { ...opts },
    });

    return ProjectSerializer.serialize(records);
  }
}
