import { Inject, Injectable, Logger } from '@nestjs/common';
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
  private readonly logger = new Logger(SchemasService.name);

  constructor(
    @Inject('KNEX_CONNECTION') private knex: Knex,
    private readonly redisService: RedisService,
    private readonly schemaComparisonService: SchemaComparisonService,
  ) {}

  async findByEndpointPath(endpointPath: string) {
    this.logger.debug(`Finding schema for endpoint: ${endpointPath}`);

    const cacheKey = `schema:${endpointPath}`;
    const cached = await this.redisService.get(cacheKey);

    if (cached) {
      return JSON.parse(cached);
    }

    this.logger.debug(
      `Schema not in cache, querying database for endpoint: ${endpointPath}`,
    );

    try {
      const result = await this.knex('schemastable')
        .select('schema')
        .where({ endpoint_path: endpointPath })
        .first();

      if (result) {
        this.logger.debug(
          `Schema found in database for endpoint: ${endpointPath}`,
        );
        await this.redisService.set(cacheKey, JSON.stringify(result), 3600);
        this.logger.debug(`Schema cached for endpoint: ${endpointPath}`);
      } else {
        this.logger.warn(`No schema found for endpoint: ${endpointPath}`);
      }

      return result || null;
    } catch (error) {
      this.logger.error(
        `Error querying database for endpoint ${endpointPath}:`,
        error.stack,
      );
      throw error;
    }
  }

  async lookupAndCompare(
    lookupDto: LookupSchemaDto,
    endpoint: string,
  ): Promise<ComparisonResult & { schema?: any }> {
    const schemaResult = await this.findByEndpointPath(endpoint);

    if (!schemaResult) {
      return {
        isMatch: false,
        message: 'Schema not found for the specified endpoint',
        differences: ['No schema exists for this endpoint'],
      };
    }

    const schema = schemaResult.schema;

    // compare the schema with the provided payload
    const comparisonResult =
      this.schemaComparisonService.compareSchemaWithPayload(
        schema,
        lookupDto.payload,
      );

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
