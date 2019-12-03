import { 
  HttpException,
  HttpStatus,
  Injectable,
} from '@nestjs/common';
import { Repository } from 'typeorm';
import { InjectRepository } from '@nestjs/typeorm';
import { ILike } from '../_utils/postgres-typeorm-case-insensitive-like';
import { ConfigService } from '../config/config.service';
import { Contact } from './contact.entity';

@Injectable()
export class ContactService {
  constructor(
    @InjectRepository(Contact)
    private readonly contactRepository: Repository<Contact>,
    private readonly config: ConfigService,
  ) {}

  async findOne(opts: any): Promise<Contact> {
    return this.contactRepository.findOneOrFail(opts);
  }

  async findByEmail(email): Promise<Contact> {
    return this.contactRepository.findOneOrFail({
      emailaddress1: ILike(email),
    });
  }
}
