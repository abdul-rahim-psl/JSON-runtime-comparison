import { Global, Module } from '@nestjs/common';
import { Knex } from 'knex';

const knexConfig: Knex.Config = {
  client: 'pg',
  connection: {
    host: 'localhost',
    port: 5432,
    user: 'postgres',
    password: 'postgres',
    database: 'json',
  },
};

export const knex = require('knex')(knexConfig);

@Global()
@Module({
  providers: [
    {
      provide: 'KNEX_CONNECTION',
      useValue: knex,
    },
  ],
  exports: ['KNEX_CONNECTION'],
})
export class KnexModule {}
