import { 
  HttpException,
  HttpStatus,
  Injectable,
} from '@nestjs/common';
import { Repository } from 'typeorm';
import { InjectRepository } from '@nestjs/typeorm';
import { ConfigService } from '../config/config.service';
import { Contact } from './contact.entity';

@Injectable()
export class ContactService {
  constructor(
    @InjectRepository(Contact)
    private readonly contactRepository: Repository<Contact>,
    private readonly config: ConfigService,
  ) {}

  async findOne(opts: any) {
    let contact = await this.contactRepository.findOne(opts);
    if (!contact) {
      throw new HttpException('Contact not found', HttpStatus.BAD_REQUEST);
    }
    return contact;
  }
}
