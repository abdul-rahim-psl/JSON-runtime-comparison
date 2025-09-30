import { Module } from '@nestjs/common';
import { SchemasService } from './schemas.service';
import { SchemasController } from './schemas.controller';
import { KnexModule } from 'src/knex/knex.module';
import { RedisModule } from 'src/redis/redis.module';

@Module({
  controllers: [SchemasController],
  providers: [SchemasService],
  imports: [KnexModule, RedisModule],
})
export class SchemasModule {}
