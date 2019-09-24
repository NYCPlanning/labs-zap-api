import { Injectable } from '@nestjs/common';
import { InjectRepository } from '@nestjs/typeorm';
import { Repository } from 'typeorm';
import { Serializer } from 'jsonapi-serializer';
import { Project } from './project.entity';
import { paginate, Pagination, IPaginationOptions } from 'nestjs-typeorm-paginate';

@Injectable()
export class ProjectService {
  constructor(
    @InjectRepository(Project)
    private readonly projectRepository: Repository<Project>,
  ) {}

  async findOne(id: string): Promise<Project> {
    const record = await this.projectRepository.findOne({ dcp_name: id });

    return this.serialize(record);
  }

  async paginate(options: IPaginationOptions): Promise<Pagination<Project>> {
    const {
      items,
      itemCount,
      totalItems,
      pageCount,
    } = await paginate<Project>(this.projectRepository, options);

    return this.serialize(items, {
      meta: {
        itemCount,
        totalItems,
        pageCount,
      },
    });
  }

  serialize(records, opts?: object): Serializer {
    const ProjectSerializer = new Serializer('projects', {
      id: 'dcp_name',
      attributes: this.projectRepository.metadata.columns.map(col => col.databaseName),
      ...opts,
    });

    return ProjectSerializer.serialize(records);
  }
}
