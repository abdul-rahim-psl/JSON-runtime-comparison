import { Inject, Injectable } from '@nestjs/common';
import { CreateSchemaDto } from './dto/create-schema.dto';
import { UpdateSchemaDto } from './dto/update-schema.dto';
import { Knex } from 'knex';

@Injectable()
export class SchemasService {
  constructor(@Inject('KNEX_CONNECTION') private knex: Knex) {}

  async findByEndpointPath(endpointPath: string) {
    const result = await this.knex('schemastable')
      .select('schema')
      .where({ endpoint_path: endpointPath })
      .first();

    return result || null;
  }

  create(createSchemaDto: CreateSchemaDto) {
    return 'This action adds a new schema';
  }

  async findAll() {
    return await this.knex('schemastable').select('*');
  }

  findOne(id: number) {
    return `This action returns a #${id} schema`;
  }

  update(id: number, updateSchemaDto: UpdateSchemaDto) {
    return `This action updates a #${id} schema`;
  }

  remove(id: number) {
    return `This action removes a #${id} schema`;
  }
}
