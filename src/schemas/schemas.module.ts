import { Module } from '@nestjs/common';
import { SchemasService } from './schemas.service';
import { SchemasController } from './schemas.controller';
import { SchemaComparisonService } from './schema-comparison.service';
import { KnexModule } from 'src/knex/knex.module';
import { RedisModule } from 'src/redis/redis.module';

@Module({
  controllers: [SchemasController],
  providers: [SchemasService, SchemaComparisonService],
  imports: [KnexModule, RedisModule],
})
export class SchemasModule {}
