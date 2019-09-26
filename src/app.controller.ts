import { Controller } from '@nestjs/common';
import { Get, Query, Res, Session } from '@nestjs/common';
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

  @Get('/login')
  async login(@Res() res: Response, @Query('accessToken') token: string) {
    const ZAPToken = await this.authService.handleLogin(token);

    res.cookie('token', ZAPToken, { httpOnly: true })
      .send({ message: 'Login successful!' });
  }

  @Get('/users')
  async getUser(@Session() session) {
    const { contactid } = session;
    const contact = await this.contactService.findOne(contactid);

    return this.serialize(contact);
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
