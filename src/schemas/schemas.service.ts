import { Inject, Injectable } from '@nestjs/common';
import { CreateSchemaDto } from './dto/create-schema.dto';
import { UpdateSchemaDto } from './dto/update-schema.dto';
import { LookupSchemaDto } from './dto/lookup-schema.dto';
import { Knex } from 'knex';
import { RedisService } from 'src/redis/redis.service';
import {
  SchemaComparisonService,
  ComparisonResult,
} from './schema-comparison.service';

@Injectable()
export class SchemasService {
  constructor(
    @Inject('KNEX_CONNECTION') private knex: Knex,
    private readonly redisService: RedisService,
    private readonly schemaComparisonService: SchemaComparisonService,
  ) {}

  async findByEndpointPath(endpointPath: string) {
    const cacheKey = `schema:${endpointPath}`;
    const cached = await this.redisService.get(cacheKey);
    if (cached) {
      return JSON.parse(cached);
    }

    //ofc not found in cache
    const result = await this.knex('schemastable')
      .select('schema')
      .where({ endpoint_path: endpointPath })
      .first();

    if (result) {
      await this.redisService.set(cacheKey, JSON.stringify(result), 3600);
    }

    return result || null;
  }

  async lookupAndCompare(
    lookupDto: LookupSchemaDto,
  ): Promise<ComparisonResult & { schema?: any }> {
    const schemaResult = await this.findByEndpointPath(lookupDto.path);

    if (!schemaResult) {
      return {
        isMatch: false,
        message: 'Schema not found for the specified endpoint',
        differences: ['No schema exists for this endpoint'],
      };
    }

    // Extract the schema from the result
    const schema = schemaResult.schema;

    // Compare the schema with the provided payload
    const comparisonResult =
      this.schemaComparisonService.compareSchemaWithPayload(
        schema,
        lookupDto.payload,
      );

    // Return the comparison result along with the schema for reference
    return {
      ...comparisonResult,
      schema: schema,
    };
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
